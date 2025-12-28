// Route API pour appliquer directement la migration SQL via connexion PostgreSQL brute
// Contourne Prisma Accelerate qui peut bloquer les opérations DDL

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";

export async function POST() {
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé. Accès réservé aux administrateurs." },
        { status: 403 }
      );
    }

    // Récupérer l'URL de connexion directe PostgreSQL (sans pooling, sans Accelerate)
    const directUrl = process.env.POSTGRES_URL_NON_POOLING || 
                      process.env.DATABASE_URL || 
                      process.env.POSTGRES_URL;

    if (!directUrl) {
      return NextResponse.json(
        { 
          error: "URL de base de données non disponible",
          message: "POSTGRES_URL_NON_POOLING, DATABASE_URL ou POSTGRES_URL doit être définie",
        },
        { status: 503 }
      );
    }

    // Utiliser pg (PostgreSQL client) pour connexion directe
    let pg: any;
    try {
      pg = await import("pg");
    } catch (err) {
      return NextResponse.json(
        { 
          error: "Module pg non disponible",
          message: "Le module 'pg' doit être installé pour cette opération",
          installCommand: "npm install pg @types/pg",
        },
        { status: 503 }
      );
    }

    const { Client } = pg;
    const client = new Client({
      connectionString: directUrl,
      ssl: directUrl.includes("vercel") || directUrl.includes("neon") ? { rejectUnauthorized: false } : false,
    });

    const results: any[] = [];

    try {
      await client.connect();
      results.push({
        action: "connect",
        success: true,
        message: "Connexion à PostgreSQL établie",
      });

      // Vérifier si la colonne existe
      const checkResult = await client.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'prestataires' 
        AND column_name = 'typePrestataire';
      `);

      if (checkResult.rows.length > 0) {
        results.push({
          action: "check_column",
          success: true,
          message: "Colonne typePrestataire existe déjà",
          columnInfo: checkResult.rows[0],
          skipped: true,
        });
      } else {
        // Ajouter la colonne
        await client.query(`
          ALTER TABLE "prestataires" 
          ADD COLUMN "typePrestataire" TEXT NOT NULL DEFAULT 'freelance';
        `);
        results.push({
          action: "add_column",
          success: true,
          message: "Colonne typePrestataire ajoutée avec succès",
        });

        // Mettre à jour les prestataires existants
        const updateResult = await client.query(`
          UPDATE "prestataires" 
          SET "typePrestataire" = 'freelance' 
          WHERE "typePrestataire" IS NULL OR "typePrestataire" = '';
        `);
        results.push({
          action: "update_existing",
          success: true,
          message: `Prestataires mis à jour: ${updateResult.rowCount} ligne(s) affectée(s)`,
          rowsAffected: updateResult.rowCount,
        });

        // Vérifier que la colonne existe maintenant
        const verifyResult = await client.query(`
          SELECT column_name, data_type, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'prestataires' 
          AND column_name = 'typePrestataire';
        `);

        if (verifyResult.rows.length > 0) {
          results.push({
            action: "verify_column",
            success: true,
            message: "Colonne vérifiée avec succès",
            columnInfo: verifyResult.rows[0],
          });
        } else {
          throw new Error("La colonne n'a pas été créée malgré l'absence d'erreur");
        }
      }

      // Marquer la migration comme appliquée dans _prisma_migrations
      try {
        const migrationName = "20250123000000_add_prestataire_type";
        const migrationCheck = await client.query(`
          SELECT migration_name, finished_at 
          FROM "_prisma_migrations" 
          WHERE migration_name = $1;
        `, [migrationName]);

        if (migrationCheck.rows.length === 0) {
          await client.query(`
            INSERT INTO "_prisma_migrations" (migration_name, checksum, finished_at, started_at, applied_steps_count)
            VALUES ($1, '', NOW(), NOW(), 1);
          `, [migrationName]);
          results.push({
            action: "mark_migration",
            success: true,
            message: "Migration marquée comme appliquée (nouvelle entrée)",
          });
        } else if (!migrationCheck.rows[0].finished_at) {
          await client.query(`
            UPDATE "_prisma_migrations" 
            SET finished_at = NOW(), applied_steps_count = 1
            WHERE migration_name = $1 AND finished_at IS NULL;
          `, [migrationName]);
          results.push({
            action: "mark_migration",
            success: true,
            message: "Migration marquée comme appliquée (mise à jour)",
          });
        } else {
          results.push({
            action: "mark_migration",
            success: true,
            message: "Migration déjà marquée comme appliquée",
            skipped: true,
          });
        }
      } catch (migrationErr: any) {
        results.push({
          action: "mark_migration",
          success: false,
          error: migrationErr.message,
          warning: "La colonne a été ajoutée mais la migration n'a pas pu être marquée",
        });
      }

      return NextResponse.json(
        {
          success: true,
          results,
          message: "✅ Migration appliquée avec succès ! La colonne typePrestataire existe maintenant.",
          note: "Vous devrez peut-être redéployer l'application pour que le client Prisma reconnaisse la nouvelle colonne.",
        },
        { status: 200 }
      );
    } finally {
      await client.end();
    }
  } catch (error: any) {
    console.error("❌ Erreur apply-migration-direct:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'application de la migration",
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

