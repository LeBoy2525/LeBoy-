import { prisma } from '../lib/db';

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

  try {
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
    await prisma.$disconnect();
  }
}

diagnosePrestataireIds();

