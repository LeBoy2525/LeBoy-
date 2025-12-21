/**
 * Script pour vérifier si les données existent toujours dans la base de données
 * À exécuter en cas de doute après un déploiement
 */

import { PrismaClient } from "@prisma/client";

async function checkData() {
  console.log("🔍 Vérification des données dans la base de données...\n");

  // Utiliser POSTGRES_PRISMA_URL ou DATABASE_URL
  const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    console.error("❌ Aucune URL de base de données trouvée");
    console.error("   Vérifiez POSTGRES_PRISMA_URL, DATABASE_URL ou POSTGRES_URL");
    process.exit(1);
  }

  console.log(`✅ URL de base de données trouvée: ${databaseUrl.substring(0, 30)}...\n`);

  const prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
  });

  try {
    // Vérifier les utilisateurs
    const usersCount = await prisma.user.count();
    console.log(`👥 Utilisateurs: ${usersCount}`);

    // Vérifier les prestataires
    const prestatairesCount = await prisma.prestataire.count();
    console.log(`🏢 Prestataires: ${prestatairesCount}`);

    // Vérifier les demandes
    const demandesCount = await prisma.demande.count();
    console.log(`📋 Demandes: ${demandesCount}`);

    // Vérifier les missions
    const missionsCount = await prisma.mission.count();
    console.log(`🎯 Missions: ${missionsCount}`);

    // Afficher quelques exemples
    if (prestatairesCount > 0) {
      const prestataires = await prisma.prestataire.findMany({ take: 5 });
      console.log(`\n📝 Exemples de prestataires:`);
      prestataires.forEach((p) => {
        console.log(`   - ${p.email} (${p.ref}) - Statut: ${p.statut}`);
      });
    }

    if (demandesCount > 0) {
      const demandes = await prisma.demande.findMany({ take: 5 });
      console.log(`\n📝 Exemples de demandes:`);
      demandes.forEach((d) => {
        console.log(`   - ${d.ref} - ${d.email} - ${d.serviceType}`);
      });
    }

    if (usersCount === 0 && prestatairesCount === 0 && demandesCount === 0) {
      console.log("\n⚠️  ATTENTION: Aucune donnée trouvée dans la base de données!");
      console.log("   Les données ont peut-être été perdues ou la connexion pointe vers une autre base.");
    } else {
      console.log("\n✅ Des données existent dans la base de données.");
      console.log("   Si elles n'apparaissent pas dans l'interface, vérifiez:");
      console.log("   1. USE_DB=true est défini dans Vercel");
      console.log("   2. DATABASE_URL ou POSTGRES_PRISMA_URL pointe vers la bonne base");
      console.log("   3. Les logs Vercel pour voir si Prisma se connecte correctement");
    }
  } catch (error: any) {
    console.error("❌ Erreur lors de la vérification:", error.message);
    console.error("\n💡 Vérifiez:");
    console.error("   1. Que les variables d'environnement sont correctes");
    console.error("   2. Que la base de données est accessible");
    console.error("   3. Que les migrations ont été appliquées");
  } finally {
    await prisma.$disconnect();
  }
}

checkData();

