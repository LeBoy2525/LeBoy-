/**
 * Script pour vérifier si les tables existent dans la base de données
 * Usage: npx tsx scripts/check-tables.ts
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "path";

// Charger les variables d'environnement
config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkTables() {
  console.log("=".repeat(80));
  console.log("🔍 VÉRIFICATION DES TABLES DANS LA BASE DE DONNÉES");
  console.log("=".repeat(80));
  
  const databaseUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    console.error("❌ Aucune URL de base de données trouvée (DATABASE_URL, PRISMA_DATABASE_URL ou POSTGRES_URL)");
    process.exit(1);
  }
  
  console.log(`📊 URL de base de données: ${databaseUrl.substring(0, 30)}...`);
  console.log(`📊 Format: ${databaseUrl.startsWith("prisma+") ? "Prisma Accelerate" : "PostgreSQL standard"}`);
  console.log("=".repeat(80));
  
  let prisma: PrismaClient;
  
  try {
    // Initialiser Prisma selon le format de l'URL
    if (databaseUrl.startsWith("prisma+")) {
      prisma = new PrismaClient({
        accelerateUrl: databaseUrl,
      });
    } else {
      prisma = new PrismaClient();
    }
    
    console.log("🔌 Connexion à la base de données...");
    await prisma.$connect();
    console.log("✅ Connexion réussie");
    console.log("=".repeat(80));
    
    // Vérifier les tables
    console.log("📋 Liste des tables dans le schéma 'public':");
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    if (tables.length === 0) {
      console.error("❌ Aucune table trouvée dans le schéma 'public'");
      console.error("⚠️  Les migrations n'ont probablement pas été appliquées");
    } else {
      console.log(`✅ ${tables.length} table(s) trouvée(s):`);
      tables.forEach((table) => {
        console.log(`   - ${table.table_name}`);
      });
      
      // Vérifier les tables essentielles
      const essentialTables = ["users", "demandes", "prestataires", "missions", "propositions", "files"];
      const foundTables = tables.map((t) => t.table_name);
      const missingTables = essentialTables.filter((t) => !foundTables.includes(t));
      
      if (missingTables.length > 0) {
        console.log("=".repeat(80));
        console.error(`❌ Tables manquantes: ${missingTables.join(", ")}`);
        console.error("⚠️  Les migrations n'ont pas été complètement appliquées");
      } else {
        console.log("=".repeat(80));
        console.log("✅ Toutes les tables essentielles sont présentes");
      }
    }
    
    await prisma.$disconnect();
    console.log("=".repeat(80));
    console.log("✅ Vérification terminée");
  } catch (error: any) {
    console.error("❌ Erreur lors de la vérification:", error?.message || error);
    console.error("   Stack:", error?.stack);
    process.exit(1);
  }
}

checkTables().catch(console.error);

