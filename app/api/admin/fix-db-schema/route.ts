// Route API pour appliquer manuellement les migrations manquantes
// À appeler en cas d'erreur P2022 (colonne manquante)

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

    const { prisma } = await import("@/lib/db");
    
    if (!prisma) {
      return NextResponse.json(
        { error: "Prisma non disponible" },
        { status: 503 }
      );
    }

    // Vérifier si la colonne typePrestataire existe
    const checkColumn = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'prestataires' 
      AND column_name = 'typePrestataire';
    `;

    const columnExists = checkColumn.length > 0;
    const results: any[] = [];

    // Si la colonne n'existe pas, l'ajouter manuellement
    if (!columnExists) {
      try {
        console.log("🔧 Application manuelle de la migration add_prestataire_type...");
        
        // Appliquer la migration SQL directement
        await prisma.$executeRaw`
          ALTER TABLE "prestataires" ADD COLUMN IF NOT EXISTS "typePrestataire" TEXT NOT NULL DEFAULT 'freelance';
        `;
        
        // Mettre à jour les prestataires existants
        await prisma.$executeRaw`
          UPDATE "prestataires" SET "typePrestataire" = 'freelance' WHERE "typePrestataire" IS NULL;
        `;
        
        // Marquer la migration comme appliquée dans _prisma_migrations
        const migrationName = "20250123000000_add_prestataire_type";
        const migrationExists = await prisma.$queryRaw<Array<{ migration_name: string }>>`
          SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = ${migrationName};
        `;
        
        if (migrationExists.length === 0) {
          await prisma.$executeRaw`
            INSERT INTO "_prisma_migrations" (migration_name, checksum, finished_at, started_at, applied_steps_count)
            VALUES (${migrationName}, '', NOW(), NOW(), 1);
          `;
        } else {
          await prisma.$executeRaw`
            UPDATE "_prisma_migrations" 
            SET finished_at = NOW(), applied_steps_count = 1
            WHERE migration_name = ${migrationName} AND finished_at IS NULL;
          `;
        }
        
        results.push({
          action: "add_typePrestataire_column",
          success: true,
          message: "Colonne typePrestataire ajoutée avec succès",
        });
      } catch (error: any) {
        results.push({
          action: "add_typePrestataire_column",
          success: false,
          error: error.message,
          code: error.code,
        });
      }
    } else {
      results.push({
        action: "add_typePrestataire_column",
        success: true,
        message: "Colonne typePrestataire existe déjà",
        skipped: true,
      });
    }

    // Vérifier que la colonne existe maintenant
    const verifyColumn = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'prestataires' 
      AND column_name = 'typePrestataire';
    `;

    // Tester une requête sur prestataires
    let testQuery = false;
    let testError = null;
    try {
      await prisma.prestataire.findFirst({
        take: 1,
      });
      testQuery = true;
    } catch (error: any) {
      testError = error.message;
      console.error("Erreur test query:", error);
    }

    return NextResponse.json(
      {
        success: true,
        results,
        typePrestataireColumnExists: verifyColumn.length > 0,
        testQueryWorks: testQuery,
        testError,
        message: verifyColumn.length > 0
          ? "✅ Migration appliquée avec succès ! La colonne typePrestataire existe maintenant."
          : "❌ Erreur : La colonne n'a pas pu être ajoutée. Vérifiez les logs.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur fix-db-schema:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'application des migrations",
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

