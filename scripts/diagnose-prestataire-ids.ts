import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

/**
 * Fonction helper pour calculer le hash d'un UUID vers un ID numérique
 * Identique à celle utilisée dans convertPrismaPrestataireToJSON
 */
function calculateUUIDHash(uuid: string): number {
  const hash = uuid.split("").reduce((acc: number, char: string) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return Math.abs(hash) % 1000000;
}

async function diagnosePrestataireIds() {
  console.log("================================================================================");
  console.log("🔍 DIAGNOSTIC DES IDs DES PRESTATAIRES");
  console.log("================================================================================");

  // Vérifier si DATABASE_URL est définie
  const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const PRISMA_DATABASE_URL = process.env.PRISMA_DATABASE_URL;

  if (!DATABASE_URL && !PRISMA_DATABASE_URL) {
    console.error("❌ Aucune URL de base de données trouvée.");
    console.error("   Veuillez définir DATABASE_URL ou PRISMA_DATABASE_URL dans votre .env");
    console.error("   Ce script nécessite une connexion à la base de données.");
    return;
  }

  let prisma: PrismaClient | null = null;

  try {
    // Initialiser Prisma selon la configuration (même logique que lib/db.ts)
    if (PRISMA_DATABASE_URL && PRISMA_DATABASE_URL.startsWith("prisma+")) {
      // Prisma Accelerate
      prisma = new PrismaClient({
        accelerateUrl: PRISMA_DATABASE_URL,
      });
      console.log("✅ Connexion via Prisma Accelerate");
    } else {
      // Connexion directe PostgreSQL - Prisma lit DATABASE_URL depuis schema.prisma
      prisma = new PrismaClient();
      console.log("✅ Connexion directe PostgreSQL");
    }

    if (!prisma) {
      throw new Error("Impossible d'initialiser Prisma");
    }

    const prestataires = await prisma.prestataire.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20, // Limiter aux 20 premiers pour le diagnostic
    });

    console.log(`\n📊 Total prestataires trouvés: ${prestataires.length}\n`);

    if (prestataires.length === 0) {
      console.log("❌ Aucun prestataire dans la base de données.");
      return;
    }

    console.log("📋 Liste des prestataires avec leurs IDs:");
    console.log("─".repeat(100));
    
    prestataires.forEach((p, idx) => {
      const numericId = calculateUUIDHash(p.id);
      console.log(`${idx + 1}. UUID: ${p.id}`);
      console.log(`   → ID numérique calculé: ${numericId}`);
      console.log(`   Email: ${p.email}`);
      console.log(`   Ref: ${p.ref}`);
      console.log(`   Statut: ${p.statut}`);
      console.log(`   Créé le: ${p.createdAt.toISOString()}`);
      console.log("");
    });

    console.log("================================================================================");
    console.log("💡 Pour tester la recherche:");
    console.log("   Utilisez l'un des IDs numériques calculés ci-dessus");
    console.log("   Exemple: GET /api/admin/prestataires/[numericId]");
    console.log("================================================================================");

  } catch (error: any) {
    console.error("❌ Erreur lors du diagnostic:", error);
    console.error("   Message:", error?.message);
    console.error("   Stack:", error?.stack);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

diagnosePrestataireIds();

