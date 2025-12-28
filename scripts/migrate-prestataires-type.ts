// Script de migration pour mettre à jour le typePrestataire des prestataires existants
// Tous les prestataires existants seront marqués comme "entreprise"

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migratePrestatairesType() {
  console.log("🚀 Début de la migration des types de prestataires...\n");

  try {
    // Vérifier la connexion à la base de données
    await prisma.$connect();
    console.log("✅ Connexion à la base de données établie\n");

    // Récupérer tous les prestataires existants
    const prestataires = await prisma.prestataire.findMany({
      where: {
        deletedAt: null, // Exclure les prestataires supprimés
      },
    });

    console.log(`📊 ${prestataires.length} prestataire(s) trouvé(s)`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const prestataire of prestataires) {
      // Vérifier si le typePrestataire est déjà défini et différent de "freelance" par défaut
      // Si c'est null ou "freelance" (valeur par défaut), on le met à jour en "entreprise"
      if (!prestataire.typePrestataire || prestataire.typePrestataire === "freelance") {
        try {
          await prisma.prestataire.update({
            where: { id: prestataire.id },
            data: {
              typePrestataire: "entreprise",
            },
          });
          updatedCount++;
          console.log(`✅ ${prestataire.ref} (${prestataire.nomEntreprise}) → entreprise`);
        } catch (error) {
          console.error(`❌ Erreur mise à jour ${prestataire.ref}:`, error);
        }
      } else {
        skippedCount++;
        console.log(`⏭️  ${prestataire.ref} (${prestataire.nomEntreprise}) → déjà ${prestataire.typePrestataire}`);
      }
    }

    console.log(`\n✅ Migration terminée !`);
    console.log(`   - ${updatedCount} prestataire(s) mis à jour → entreprise`);
    console.log(`   - ${skippedCount} prestataire(s) déjà configuré(s)`);
  } catch (error) {
    console.error("\n❌ Erreur lors de la migration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migratePrestatairesType();

