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
        
        // Étape 1: Vérifier si la table existe
        const tableExists = await prisma.$queryRaw<Array<{ table_name: string }>>`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'prestataires';
        `;
        
        if (tableExists.length === 0) {
          throw new Error("La table 'prestataires' n'existe pas dans la base de données");
        }
        
        results.push({
          action: "check_table_exists",
          success: true,
          message: "Table prestataires trouvée",
        });
        
        // Étape 2: Essayer d'ajouter la colonne avec différentes méthodes
        let columnAdded = false;
        let addColumnError = null;
        
        // Méthode 1: ALTER TABLE avec IF NOT EXISTS (PostgreSQL 9.5+)
        try {
          console.log("🔧 Tentative méthode 1: ALTER TABLE avec IF NOT EXISTS...");
          const result1 = await prisma.$executeRawUnsafe(`
            ALTER TABLE "prestataires" 
            ADD COLUMN IF NOT EXISTS "typePrestataire" TEXT NOT NULL DEFAULT 'freelance';
          `);
          console.log("✅ Méthode 1 réussie, résultat:", result1);
          columnAdded = true;
          results.push({
            action: "add_column_method1",
            success: true,
            message: "Colonne ajoutée avec IF NOT EXISTS",
            result: result1,
          });
        } catch (err: any) {
          addColumnError = err.message;
          console.error("❌ Méthode 1 échouée:", err);
          console.error("Code erreur:", err.code);
          console.error("Message complet:", JSON.stringify(err, null, 2));
          
          // Méthode 2: Vérifier d'abord puis ajouter sans IF NOT EXISTS
          try {
            console.log("🔧 Tentative méthode 2: Vérification préalable...");
            const columnCheck = await prisma.$queryRawUnsafe(`
              SELECT column_name, data_type, column_default
              FROM information_schema.columns 
              WHERE table_schema = 'public'
              AND table_name = 'prestataires' 
              AND column_name = 'typePrestataire';
            `);
            
            console.log("📋 Résultat vérification colonne:", columnCheck);
            
            if (columnCheck.length === 0) {
              console.log("🔧 Colonne n'existe pas, ajout...");
              const result2 = await prisma.$executeRawUnsafe(`
                ALTER TABLE "prestataires" 
                ADD COLUMN "typePrestataire" TEXT NOT NULL DEFAULT 'freelance';
              `);
              console.log("✅ Méthode 2 réussie, résultat:", result2);
              columnAdded = true;
              results.push({
                action: "add_column_method2",
                success: true,
                message: "Colonne ajoutée avec vérification préalable",
                result: result2,
              });
            } else {
              console.log("✅ Colonne existe déjà selon méthode 2");
              columnAdded = true;
              results.push({
                action: "add_column_method2",
                success: true,
                message: "Colonne existe déjà (détectée par méthode 2)",
                columnInfo: columnCheck[0],
                skipped: true,
              });
            }
          } catch (err2: any) {
            console.error("❌ Méthode 2 échouée:", err2);
            console.error("Code erreur:", err2.code);
            console.error("Message complet:", JSON.stringify(err2, null, 2));
            
            // Méthode 3: Essayer avec une transaction et gestion d'erreur PostgreSQL
            try {
              console.log("🔧 Tentative méthode 3: Transaction avec DO block...");
              const result3 = await prisma.$executeRawUnsafe(`
                DO $$
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'prestataires' 
                    AND column_name = 'typePrestataire'
                  ) THEN
                    ALTER TABLE "prestataires" 
                    ADD COLUMN "typePrestataire" TEXT NOT NULL DEFAULT 'freelance';
                  END IF;
                END $$;
              `);
              console.log("✅ Méthode 3 réussie, résultat:", result3);
              columnAdded = true;
              results.push({
                action: "add_column_method3",
                success: true,
                message: "Colonne ajoutée avec DO block PostgreSQL",
                result: result3,
              });
            } catch (err3: any) {
              console.error("❌ Méthode 3 échouée:", err3);
              throw new Error(`Toutes les méthodes ont échoué. Méthode 1: ${err.message}; Méthode 2: ${err2.message}; Méthode 3: ${err3.message}`);
            }
          }
        }
        
        if (!columnAdded) {
          throw new Error(`Impossible d'ajouter la colonne. Dernière erreur: ${addColumnError}`);
        }
        
        // Étape 3: Vérifier que la colonne existe maintenant
        const verifyColumn = await prisma.$queryRawUnsafe(`
          SELECT column_name, data_type, column_default
          FROM information_schema.columns 
          WHERE table_name = 'prestataires' 
          AND column_name = 'typePrestataire';
        `);
        
        if (verifyColumn.length === 0) {
          throw new Error("La colonne n'a pas été créée malgré l'absence d'erreur");
        }
        
        results.push({
          action: "verify_column",
          success: true,
          message: `Colonne vérifiée: ${JSON.stringify(verifyColumn[0])}`,
        });
        
        // Étape 4: Mettre à jour les prestataires existants (si nécessaire)
        try {
          const updateResult = await prisma.$executeRawUnsafe(`
            UPDATE "prestataires" 
            SET "typePrestataire" = 'freelance' 
            WHERE "typePrestataire" IS NULL OR "typePrestataire" = '';
          `);
          results.push({
            action: "update_existing_prestataires",
            success: true,
            message: `Prestataires mis à jour (affectés: ${updateResult})`,
          });
        } catch (err: any) {
          results.push({
            action: "update_existing_prestataires",
            success: false,
            error: err.message,
            warning: "La colonne existe mais la mise à jour a échoué",
          });
        }
        
        // Étape 5: Marquer la migration comme appliquée dans _prisma_migrations
        try {
          const migrationName = "20250123000000_add_prestataire_type";
          const migrationExists = await prisma.$queryRawUnsafe(`
            SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = '${migrationName}';
          `);
          
          if (migrationExists.length === 0) {
            await prisma.$executeRawUnsafe(`
              INSERT INTO "_prisma_migrations" (migration_name, checksum, finished_at, started_at, applied_steps_count)
              VALUES ('${migrationName}', '', NOW(), NOW(), 1);
            `);
            results.push({
              action: "mark_migration_applied",
              success: true,
              message: "Migration marquée comme appliquée (nouvelle entrée)",
            });
          } else {
            await prisma.$executeRawUnsafe(`
              UPDATE "_prisma_migrations" 
              SET finished_at = NOW(), applied_steps_count = 1
              WHERE migration_name = '${migrationName}' AND finished_at IS NULL;
            `);
            results.push({
              action: "mark_migration_applied",
              success: true,
              message: "Migration marquée comme appliquée (mise à jour)",
            });
          }
        } catch (err: any) {
          results.push({
            action: "mark_migration_applied",
            success: false,
            error: err.message,
            warning: "La colonne a été ajoutée mais la migration n'a pas pu être marquée",
          });
        }
        
      } catch (error: any) {
        console.error("❌ Erreur lors de l'ajout de la colonne:", error);
        results.push({
          action: "add_typePrestataire_column",
          success: false,
          error: error.message,
          code: error.code,
          stack: error.stack?.substring(0, 500),
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

