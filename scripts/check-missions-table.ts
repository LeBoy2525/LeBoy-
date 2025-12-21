/**
 * Script pour vérifier la structure de la table missions dans la base de données
 * et comparer avec le schéma Prisma
 */

import { PrismaClient } from "@prisma/client";

async function checkMissionsTable() {
  console.log("🔍 Vérification de la structure de la table missions...\n");

  const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    console.error("❌ Aucune URL de base de données trouvée");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
  });

  try {
    // Récupérer la structure de la table missions depuis PostgreSQL
    const result = await prisma.$queryRaw<Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>>`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'missions'
      ORDER BY ordinal_position;
    `;

    console.log(`✅ Colonnes trouvées dans la table missions (${result.length}):\n`);
    result.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Colonnes attendues selon le schéma Prisma
    const expectedColumns = [
      'id', 'ref', 'demandeId', 'clientEmail', 'prestataireId', 'prestataireRef',
      'notifiedProviderAt', 'internalState', 'status', 'createdAt',
      'dateAssignation', 'dateLimiteProposition', 'dateAcceptation', 
      'datePriseEnCharge', 'dateDebut', 'dateFin',
      'titre', 'description', 'serviceType', 'lieu', 'urgence', 'budget',
      'tarifPrestataire', 'commissionICD', 'commissionHybride', 'commissionRisk',
      'commissionTotale', 'fraisSupplementaires', 'tarifTotal',
      'paiementEchelonne', 'sharedFiles', 'progress', 'currentProgress',
      'phases', 'delaiMaximal', 'dateLimiteMission', 'updates', 'messages',
      'noteClient', 'notePrestataire', 'noteICD', 'noteAdminPourPrestataire',
      'commentaireClient', 'commentairePrestataire', 'commentaireICD',
      'commentaireAdminPourPrestataire', 'proofs', 'proofSubmissionDate',
      'proofValidatedByAdmin', 'proofValidatedAt', 'proofValidatedForClient',
      'proofValidatedForClientAt', 'closedBy', 'closedAt',
      'devisGenere', 'devisGenereAt', 'paiementEffectue', 'paiementEffectueAt',
      'avanceVersee', 'avanceVerseeAt', 'avancePercentage', 'soldeVersee',
      'soldeVerseeAt', 'estimationPartenaire', 'archived', 'archivedAt',
      'archivedBy', 'deleted', 'deletedAt', 'deletedBy'
    ];

    const existingColumns = result.map(r => r.column_name);
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log(`\n⚠️  Colonnes manquantes (${missingColumns.length}):`);
      missingColumns.forEach(col => console.log(`   - ${col}`));
      console.log("\n💡 Exécutez 'npx prisma migrate deploy' pour appliquer les migrations manquantes.");
    } else {
      console.log("\n✅ Toutes les colonnes attendues sont présentes dans la table missions.");
    }

    // Vérifier aussi le nombre de missions
    const missionsCount = await prisma.mission.count();
    console.log(`\n📊 Nombre de missions dans la base: ${missionsCount}`);

  } catch (error: any) {
    console.error("❌ Erreur lors de la vérification:", error.message);
    if (error.message.includes("does not exist")) {
      console.error("\n💡 La table 'missions' n'existe peut-être pas.");
      console.error("   Exécutez 'npx prisma migrate deploy' pour créer les tables.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkMissionsTable();

