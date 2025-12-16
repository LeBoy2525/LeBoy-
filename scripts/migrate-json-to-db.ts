/**
 * Script de migration des données JSON vers PostgreSQL
 * 
 * Usage: npx tsx scripts/migrate-json-to-db.ts
 * 
 * Ce script migre toutes les données des fichiers JSON vers la base de données PostgreSQL.
 * Il doit être exécuté UNE SEULE FOIS après la création de la base de données.
 */

import { prisma } from "../lib/db";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function loadJsonFile<T>(filename: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as T[];
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log(`⚠️  Fichier ${filename} non trouvé, ignoré.`);
      return [];
    }
    throw error;
  }
}

async function migrateUsers() {
  console.log("\n📦 Migration des utilisateurs...");
  const users = await loadJsonFile<any>("users.json");
  
  for (const user of users) {
    try {
      await prisma.user.upsert({
        where: { email: user.email.toLowerCase() },
        update: {},
        create: {
          id: user.id?.toString() || undefined,
          email: user.email.toLowerCase(),
          passwordHash: user.passwordHash,
          fullName: user.fullName,
          role: user.role || "client",
          createdAt: new Date(user.createdAt),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          emailVerified: user.emailVerified || false,
          verificationCode: user.verificationCode || null,
          verificationCodeExpires: user.verificationCodeExpires ? new Date(user.verificationCodeExpires) : null,
          country: user.country || null,
        },
      });
    } catch (error) {
      console.error(`❌ Erreur migration utilisateur ${user.email}:`, error);
    }
  }
  
  console.log(`✅ ${users.length} utilisateur(s) migré(s)`);
}

async function migrateDemandes() {
  console.log("\n📦 Migration des demandes...");
  const demandes = await loadJsonFile<any>("demandes.json");
  
  for (const demande of demandes) {
    try {
      await prisma.demande.upsert({
        where: { ref: demande.ref },
        update: {},
        create: {
          id: demande.id?.toString() || undefined,
          ref: demande.ref,
          createdAt: new Date(demande.createdAt),
          deviceId: demande.deviceId || null,
          fullName: demande.fullName,
          email: demande.email,
          phone: demande.phone,
          serviceType: demande.serviceType,
          serviceSubcategory: demande.serviceSubcategory || null,
          serviceAutre: demande.serviceAutre || null,
          country: demande.country || null,
          description: demande.description,
          lieu: demande.lieu || null,
          budget: demande.budget || null,
          urgence: demande.urgence,
          fileIds: demande.fileIds || [],
          statut: demande.statut || "en_attente",
          rejeteeAt: demande.rejeteeAt ? new Date(demande.rejeteeAt) : null,
          rejeteeBy: demande.rejeteeBy || null,
          raisonRejet: demande.raisonRejet || null,
          deletedAt: demande.deletedAt ? new Date(demande.deletedAt) : null,
          deletedBy: demande.deletedBy || null,
        },
      });
    } catch (error) {
      console.error(`❌ Erreur migration demande ${demande.ref}:`, error);
    }
  }
  
  console.log(`✅ ${demandes.length} demande(s) migrée(s)`);
}

async function migratePrestataires() {
  console.log("\n📦 Migration des prestataires...");
  const prestataires = await loadJsonFile<any>("prestataires.json");
  
  for (const prestataire of prestataires) {
    try {
      await prisma.prestataire.upsert({
        where: { ref: prestataire.ref },
        update: {},
        create: {
          id: prestataire.id?.toString() || undefined,
          ref: prestataire.ref,
          createdAt: new Date(prestataire.createdAt),
          nomEntreprise: prestataire.nomEntreprise,
          nomContact: prestataire.nomContact,
          email: prestataire.email,
          phone: prestataire.phone,
          adresse: prestataire.adresse,
          ville: prestataire.ville,
          specialites: prestataire.specialites || [],
          zonesIntervention: prestataire.zonesIntervention || [],
          statut: prestataire.statut || "en_attente",
          actifAt: prestataire.dateValidation ? new Date(prestataire.dateValidation) : null,
          deletedAt: prestataire.deletedAt ? new Date(prestataire.deletedAt) : null,
          deletedBy: prestataire.deletedBy || null,
        },
      });
    } catch (error) {
      console.error(`❌ Erreur migration prestataire ${prestataire.ref}:`, error);
    }
  }
  
  console.log(`✅ ${prestataires.length} prestataire(s) migré(s)`);
}

async function migrateMissions() {
  console.log("\n📦 Migration des missions...");
  const missions = await loadJsonFile<any>("missions.json");
  
  for (const mission of missions) {
    try {
      await prisma.mission.upsert({
        where: { ref: mission.ref },
        update: {},
        create: {
          id: mission.id?.toString() || undefined,
          ref: mission.ref,
          demandeId: String(mission.demandeId),
          clientEmail: mission.clientEmail,
          prestataireId: mission.prestataireId ? String(mission.prestataireId) : null,
          prestataireRef: mission.prestataireRef || null,
          internalState: mission.internalState || "CREATED",
          status: mission.status || "en_analyse_quebec",
          createdAt: new Date(mission.createdAt),
          dateAssignation: mission.dateAssignation ? new Date(mission.dateAssignation) : null,
          dateLimiteProposition: mission.dateLimiteProposition ? new Date(mission.dateLimiteProposition) : null,
          dateAcceptation: mission.dateAcceptation ? new Date(mission.dateAcceptation) : null,
          datePriseEnCharge: mission.datePriseEnCharge ? new Date(mission.datePriseEnCharge) : null,
          dateDebut: mission.dateDebut ? new Date(mission.dateDebut) : null,
          dateFin: mission.dateFin ? new Date(mission.dateFin) : null,
          titre: mission.titre,
          description: mission.description,
          serviceType: mission.serviceType,
          lieu: mission.lieu || null,
          urgence: mission.urgence,
          budget: mission.budget || null,
          tarifPrestataire: mission.tarifPrestataire || null,
          commissionICD: mission.commissionICD || null,
          commissionHybride: mission.commissionHybride || null,
          commissionRisk: mission.commissionRisk || null,
          commissionTotale: mission.commissionTotale || null,
          fraisSupplementaires: mission.fraisSupplementaires || null,
          tarifTotal: mission.tarifTotal || null,
          paiementEchelonne: mission.paiementEchelonne ? JSON.parse(JSON.stringify(mission.paiementEchelonne)) : null,
          sharedFiles: mission.sharedFiles ? JSON.parse(JSON.stringify(mission.sharedFiles)) : null,
          progress: mission.progress ? JSON.parse(JSON.stringify(mission.progress)) : null,
          currentProgress: mission.currentProgress || 0,
          phases: mission.phases ? JSON.parse(JSON.stringify(mission.phases)) : null,
          delaiMaximal: mission.delaiMaximal || null,
          dateLimiteMission: mission.dateLimiteMission ? new Date(mission.dateLimiteMission) : null,
          updates: mission.updates ? JSON.parse(JSON.stringify(mission.updates)) : [],
          messages: mission.messages ? JSON.parse(JSON.stringify(mission.messages)) : null,
          noteClient: mission.noteClient || null,
          notePrestataire: mission.notePrestataire || null,
          noteICD: mission.noteICD || null,
          noteAdminPourPrestataire: mission.noteAdminPourPrestataire || null,
          commentaireClient: mission.commentaireClient || null,
          commentairePrestataire: mission.commentairePrestataire || null,
          commentaireICD: mission.commentaireICD || null,
          commentaireAdminPourPrestataire: mission.commentaireAdminPourPrestataire || null,
          proofs: mission.proofs ? JSON.parse(JSON.stringify(mission.proofs)) : null,
          proofSubmissionDate: mission.proofSubmissionDate ? new Date(mission.proofSubmissionDate) : null,
          proofValidatedByAdmin: mission.proofValidatedByAdmin || false,
          proofValidatedAt: mission.proofValidatedAt ? new Date(mission.proofValidatedAt) : null,
          proofValidatedForClient: mission.proofValidatedForClient || false,
          proofValidatedForClientAt: mission.proofValidatedForClientAt ? new Date(mission.proofValidatedForClientAt) : null,
          closedBy: mission.closedBy || null,
          closedAt: mission.closedAt ? new Date(mission.closedAt) : null,
          devisGenere: mission.devisGenere || false,
          devisGenereAt: mission.devisGenereAt ? new Date(mission.devisGenereAt) : null,
          paiementEffectue: mission.paiementEffectue || false,
          paiementEffectueAt: mission.paiementEffectueAt ? new Date(mission.paiementEffectueAt) : null,
          avanceVersee: mission.avanceVersee || false,
          avanceVerseeAt: mission.avanceVerseeAt ? new Date(mission.avanceVerseeAt) : null,
          avancePercentage: mission.avancePercentage || null,
          soldeVersee: mission.soldeVersee || false,
          soldeVerseeAt: mission.soldeVerseeAt ? new Date(mission.soldeVerseeAt) : null,
          estimationPartenaire: mission.estimationPartenaire ? JSON.parse(JSON.stringify(mission.estimationPartenaire)) : null,
          archived: mission.archived || false,
          archivedAt: mission.archivedAt ? new Date(mission.archivedAt) : null,
          archivedBy: mission.archivedBy || null,
          deleted: mission.deleted || false,
          deletedAt: mission.deletedAt ? new Date(mission.deletedAt) : null,
          deletedBy: mission.deletedBy || null,
        },
      });
    } catch (error) {
      console.error(`❌ Erreur migration mission ${mission.ref}:`, error);
    }
  }
  
  console.log(`✅ ${missions.length} mission(s) migrée(s)`);
}

async function migratePropositions() {
  console.log("\n📦 Migration des propositions...");
  const propositions = await loadJsonFile<any>("propositions.json");
  
  for (const proposition of propositions) {
    try {
      await prisma.proposition.upsert({
        where: { ref: proposition.ref },
        update: {},
        create: {
          id: proposition.id?.toString() || undefined,
          ref: proposition.ref,
          createdAt: new Date(proposition.createdAt),
          demandeId: String(proposition.demandeId),
          prestataireId: String(proposition.prestataireId),
          prix_prestataire: proposition.prix_prestataire,
          delai_estime: proposition.delai_estime,
          commentaire: proposition.commentaire,
          difficulte_estimee: proposition.difficulte_estimee || 3,
          statut: proposition.statut || "en_attente",
          accepteeAt: proposition.accepteeAt ? new Date(proposition.accepteeAt) : null,
          refuseeAt: proposition.refuseeAt ? new Date(proposition.refuseeAt) : null,
          accepteeBy: proposition.accepteeBy || null,
          refuseeBy: proposition.refuseeBy || null,
          raisonRefus: proposition.raisonRefus || null,
          missionId: proposition.missionId ? String(proposition.missionId) : null,
        },
      });
    } catch (error) {
      console.error(`❌ Erreur migration proposition ${proposition.ref}:`, error);
    }
  }
  
  console.log(`✅ ${propositions.length} proposition(s) migrée(s)`);
}

async function migrateNotifications() {
  console.log("\n📦 Migration des notifications...");
  const notifications = await loadJsonFile<any>("adminNotifications.json");
  
  for (const notification of notifications) {
    try {
      await prisma.adminNotification.create({
        data: {
          id: notification.id?.toString() || undefined,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          missionId: notification.missionId ? String(notification.missionId) : null,
          missionRef: notification.missionRef || null,
          demandeId: notification.demandeId ? String(notification.demandeId) : null,
          clientEmail: notification.clientEmail || null,
          prestataireName: notification.prestataireName || null,
          createdAt: new Date(notification.createdAt),
          read: notification.read || false,
          readAt: notification.readAt ? new Date(notification.readAt) : null,
        },
      });
    } catch (error) {
      console.error(`❌ Erreur migration notification ${notification.id}:`, error);
    }
  }
  
  console.log(`✅ ${notifications.length} notification(s) migrée(s)`);
}

async function main() {
  console.log("🚀 Début de la migration des données JSON vers PostgreSQL...\n");
  
  try {
    await migrateUsers();
    await migrateDemandes();
    await migratePrestataires();
    await migrateMissions();
    await migratePropositions();
    await migrateNotifications();
    
    console.log("\n✅ Migration terminée avec succès !");
  } catch (error) {
    console.error("\n❌ Erreur lors de la migration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

