import { prisma } from "@/lib/db";
import type { Mission } from "@/lib/types";

export async function getAllMissions() {
  return prisma.mission.findMany({
    where: {
      deleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      demande: true,
      prestataire: true,
    },
  });
}

export async function getMissionById(id: string) {
  return prisma.mission.findUnique({
    where: { id },
    // Temporairement retirer les includes pour éviter l'erreur de colonne manquante
    // include: {
    //   demande: true,
    //   prestataire: true,
    // },
  });
}

export async function getMissionsByClient(email: string) {
  return prisma.mission.findMany({
    where: {
      clientEmail: email.toLowerCase(),
      deleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    // Temporairement retirer les includes pour éviter l'erreur de colonne manquante
    // include: {
    //   demande: true,
    //   prestataire: true,
    // },
  });
}

export async function getMissionsByPrestataire(prestataireId: string) {
  return prisma.mission.findMany({
    where: {
      prestataireId,
      deleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    // Temporairement retirer les includes pour éviter l'erreur de colonne manquante
    // include: {
    //   demande: true,
    //   prestataire: true,
    // },
  });
}

export async function getMissionsByDemandeId(demandeId: string) {
  return prisma.mission.findMany({
    where: {
      demandeId,
      deleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    // Temporairement retirer les includes pour éviter l'erreur de colonne manquante
    // include: {
    //   demande: true,
    //   prestataire: true,
    // },
  });
}

export async function createMission(data: Omit<Mission, "id">) {
  return prisma.mission.create({
    data: {
      ref: data.ref,
      demandeId: String(data.demandeId),
      clientEmail: data.clientEmail,
      prestataireId: data.prestataireId ? String(data.prestataireId) : null,
      prestataireRef: data.prestataireRef || null,
      internalState: data.internalState,
      status: data.status,
      createdAt: new Date(data.createdAt),
      dateAssignation: data.dateAssignation ? new Date(data.dateAssignation) : null,
      dateLimiteProposition: data.dateLimiteProposition ? new Date(data.dateLimiteProposition) : null,
      dateAcceptation: data.dateAcceptation ? new Date(data.dateAcceptation) : null,
      datePriseEnCharge: data.datePriseEnCharge ? new Date(data.datePriseEnCharge) : null,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
      dateFin: data.dateFin ? new Date(data.dateFin) : null,
      titre: data.titre,
      description: data.description,
      serviceType: data.serviceType,
      lieu: data.lieu || null,
      urgence: data.urgence,
      budget: data.budget || null,
      tarifPrestataire: data.tarifPrestataire || null,
      commissionICD: data.commissionICD || null,
      commissionHybride: data.commissionHybride || null,
      commissionRisk: data.commissionRisk || null,
      commissionTotale: data.commissionTotale || null,
      fraisSupplementaires: data.fraisSupplementaires || null,
      tarifTotal: data.tarifTotal || null,
      paiementEchelonne: data.paiementEchelonne ? JSON.parse(JSON.stringify(data.paiementEchelonne)) : null,
      sharedFiles: data.sharedFiles ? JSON.parse(JSON.stringify(data.sharedFiles)) : null,
      progress: data.progress ? JSON.parse(JSON.stringify(data.progress)) : null,
      currentProgress: data.currentProgress || 0,
      phases: data.phases ? JSON.parse(JSON.stringify(data.phases)) : null,
      delaiMaximal: data.delaiMaximal || null,
      dateLimiteMission: data.dateLimiteMission ? new Date(data.dateLimiteMission) : null,
      updates: data.updates ? JSON.parse(JSON.stringify(data.updates)) : [],
      messages: data.messages ? JSON.parse(JSON.stringify(data.messages)) : null,
      noteClient: data.noteClient || null,
      notePrestataire: data.notePrestataire || null,
      noteICD: data.noteICD || null,
      noteAdminPourPrestataire: data.noteAdminPourPrestataire || null,
      commentaireClient: data.commentaireClient || null,
      commentairePrestataire: data.commentairePrestataire || null,
      commentaireICD: data.commentaireICD || null,
      commentaireAdminPourPrestataire: data.commentaireAdminPourPrestataire || null,
      proofs: data.proofs ? JSON.parse(JSON.stringify(data.proofs)) : null,
      proofSubmissionDate: data.proofSubmissionDate ? new Date(data.proofSubmissionDate) : null,
      proofValidatedByAdmin: data.proofValidatedByAdmin || false,
      proofValidatedAt: data.proofValidatedAt ? new Date(data.proofValidatedAt) : null,
      proofValidatedForClient: data.proofValidatedForClient || false,
      proofValidatedForClientAt: data.proofValidatedForClientAt ? new Date(data.proofValidatedForClientAt) : null,
      closedBy: data.closedBy || null,
      closedAt: data.closedAt ? new Date(data.closedAt) : null,
      devisGenere: data.devisGenere || false,
      devisGenereAt: data.devisGenereAt ? new Date(data.devisGenereAt) : null,
      paiementEffectue: data.paiementEffectue || false,
      paiementEffectueAt: data.paiementEffectueAt ? new Date(data.paiementEffectueAt) : null,
      avanceVersee: data.avanceVersee || false,
      avanceVerseeAt: data.avanceVerseeAt ? new Date(data.avanceVerseeAt) : null,
      avancePercentage: data.avancePercentage || null,
      soldeVersee: data.soldeVersee || false,
      soldeVerseeAt: data.soldeVerseeAt ? new Date(data.soldeVerseeAt) : null,
      estimationPartenaire: data.estimationPartenaire ? JSON.parse(JSON.stringify(data.estimationPartenaire)) : null,
      archived: data.archived || false,
      archivedAt: data.archivedAt ? new Date(data.archivedAt) : null,
      archivedBy: data.archivedBy || null,
      deleted: data.deleted || false,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
      deletedBy: data.deletedBy || null,
    },
  });
}

export async function updateMission(id: string, data: Partial<Mission>) {
  const updateData: any = {};
  
  // Mapper les champs simples
  if (data.internalState !== undefined) updateData.internalState = data.internalState;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.currentProgress !== undefined) updateData.currentProgress = data.currentProgress;
  if (data.devisGenere !== undefined) updateData.devisGenere = data.devisGenere;
  if (data.paiementEffectue !== undefined) updateData.paiementEffectue = data.paiementEffectue;
  if (data.avanceVersee !== undefined) updateData.avanceVersee = data.avanceVersee;
  if (data.soldeVersee !== undefined) updateData.soldeVersee = data.soldeVersee;
  if (data.archived !== undefined) updateData.archived = data.archived;
  if (data.deleted !== undefined) updateData.deleted = data.deleted;
  
  // Mapper les dates
  if (data.dateAssignation !== undefined) updateData.dateAssignation = data.dateAssignation ? new Date(data.dateAssignation) : null;
  if (data.devisGenereAt !== undefined) updateData.devisGenereAt = data.devisGenereAt ? new Date(data.devisGenereAt) : null;
  if (data.paiementEffectueAt !== undefined) updateData.paiementEffectueAt = data.paiementEffectueAt ? new Date(data.paiementEffectueAt) : null;
  if (data.archivedAt !== undefined) updateData.archivedAt = data.archivedAt ? new Date(data.archivedAt) : null;
  if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;
  
  // Mapper les champs JSON
  if (data.updates !== undefined) updateData.updates = JSON.parse(JSON.stringify(data.updates));
  if (data.phases !== undefined) updateData.phases = data.phases ? JSON.parse(JSON.stringify(data.phases)) : null;
  if (data.proofs !== undefined) updateData.proofs = data.proofs ? JSON.parse(JSON.stringify(data.proofs)) : null;
  
  return prisma.mission.update({
    where: { id },
    data: updateData,
  });
}

export async function archiveMission(id: string, archivedBy: string) {
  return prisma.mission.update({
    where: { id },
    data: {
      archived: true,
      archivedAt: new Date(),
      archivedBy,
    },
  });
}

export async function deleteMission(id: string, deletedBy: string) {
  return prisma.mission.update({
    where: { id },
    data: {
      deleted: true,
      deletedAt: new Date(),
      deletedBy,
    },
  });
}

