import { prisma } from "@/lib/db";
import type { Mission } from "@/lib/types";
import { withRetry } from "@/lib/db-retry";
import { logPrismaError } from "@/lib/prisma-error-logger";

// Helper pour vérifier que Prisma est disponible
function ensurePrisma() {
  if (!prisma) {
    throw new Error("Prisma n'est pas initialisé. Vérifiez les variables d'environnement POSTGRES_PRISMA_URL ou DATABASE_URL.");
  }
  return prisma;
}

export async function getAllMissions() {
  const db = ensurePrisma();
  return withRetry(async () => {
    return db.mission.findMany({
      where: {
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
  });
}

export async function getMissionById(id: string) {
  const db = ensurePrisma();
  return withRetry(async () => {
    return db.mission.findUnique({
      where: { id },
      // Temporairement retirer les includes pour éviter l'erreur de colonne manquante
      // include: {
      //   demande: true,
      //   prestataire: true,
      // },
    });
  });
}

export async function getMissionsByClient(email: string) {
  const db = ensurePrisma();
  return db.mission.findMany({
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
  console.log(`[missionsRepo] getMissionsByPrestataire appelé avec UUID: ${prestataireId}`);
  const db = ensurePrisma();
  
  // Vérifier d'abord si le prestataire existe
  const prestataire = await db.prestataire.findUnique({
    where: { id: prestataireId },
    select: { id: true, email: true, ref: true },
  });
  
  if (!prestataire) {
    console.warn(`[missionsRepo] ⚠️ Prestataire UUID ${prestataireId} non trouvé dans la DB`);
    return [];
  }
  
  console.log(`[missionsRepo] ✅ Prestataire trouvé: ${prestataire.email} (${prestataire.ref})`);
  
  // Rechercher toutes les missions avec ce prestataireId (même celles supprimées pour diagnostic)
  const allMissionsRaw = await db.mission.findMany({
    where: {
      prestataireId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      ref: true,
      prestataireId: true,
      status: true,
      deleted: true,
      archived: true,
      internalState: true,
      createdAt: true,
    },
  });
  
  console.log(`[missionsRepo] 🔍 Recherche missions avec prestataireId UUID: ${prestataireId}`);
  console.log(`[missionsRepo] 📋 Total missions trouvées (y compris supprimées): ${allMissionsRaw.length}`);
  
  // Afficher toutes les missions trouvées pour diagnostic
  allMissionsRaw.forEach((m, idx) => {
    console.log(`[missionsRepo]   ${idx + 1}. ${m.ref} - prestataireId: ${m.prestataireId}, status: ${m.status}, deleted: ${m.deleted}, archived: ${m.archived}, internalState: ${m.internalState}`);
  });
  
  // Filtrer uniquement les missions non supprimées et non archivées
  const missions = allMissionsRaw.filter(m => !m.deleted && !m.archived);
  
  console.log(`[missionsRepo] ✅ Missions non supprimées et non archivées: ${missions.length}`);
  
  // Si aucune mission trouvée, vérifier s'il y a des missions avec un prestataireId différent
  if (missions.length === 0 && allMissionsRaw.length > 0) {
    console.warn(`[missionsRepo] ⚠️ ${allMissionsRaw.length} mission(s) trouvée(s) mais toutes supprimées/archivées`);
    allMissionsRaw.forEach((m, idx) => {
      console.warn(`[missionsRepo]   ${idx + 1}. ${m.ref} - deleted: ${m.deleted}, archived: ${m.archived}`);
    });
  } else if (allMissionsRaw.length === 0) {
    console.warn(`[missionsRepo] ⚠️ Aucune mission trouvée pour prestataireId: ${prestataireId}`);
    console.warn(`[missionsRepo] 🔍 Vérification des missions existantes dans la DB...`);
    
    // Récupérer quelques missions pour voir leur prestataireId
    const sampleMissions = await db.mission.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        ref: true,
        prestataireId: true,
        deleted: true,
        archived: true,
      },
    });
    
    console.warn(`[missionsRepo] 📊 Échantillon de missions dans la DB (10 dernières):`);
    sampleMissions.forEach((m, idx) => {
      const match = m.prestataireId === prestataireId;
      console.warn(`[missionsRepo]   ${idx + 1}. ${m.ref} - prestataireId: ${m.prestataireId || "NULL"} ${match ? "✅ MATCH" : "❌ DIFFÉRENT"} (deleted: ${m.deleted}, archived: ${m.archived})`);
    });
    
    // Vérifier aussi s'il y a des missions avec prestataireId NULL
    const missionsWithNullPrestataire = await db.mission.count({
      where: {
        prestataireId: null,
        deleted: false,
      },
    });
    if (missionsWithNullPrestataire > 0) {
      console.warn(`[missionsRepo] ⚠️ ${missionsWithNullPrestataire} mission(s) avec prestataireId NULL trouvée(s)`);
    }
  }
  
  return missions;
}

export async function getMissionsByDemandeId(demandeId: string) {
  const db = ensurePrisma();
  return withRetry(async () => {
    return db.mission.findMany({
      where: {
        demandeId,
        deleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      // Les includes sont désactivés temporairement jusqu'à ce que les relations soient correctement configurées
      // include: {
      //   demande: true,
      //   prestataire: true,
      // },
    });
  });
}

export async function createMission(data: Omit<Mission, "id">) {
  // Les données reçues ont déjà des UUIDs pour demandeId et prestataireId (depuis lib/dataAccess.ts)
  // Mais le type Mission définit ces champs comme numbers, donc on doit les traiter comme strings
  const demandeIdStr = typeof data.demandeId === "string" ? data.demandeId : String(data.demandeId);
  const prestataireIdStr = data.prestataireId 
    ? (typeof data.prestataireId === "string" ? data.prestataireId : String(data.prestataireId))
    : null;
  
  console.log(`[missionsRepo] createMission appelé avec:`);
  console.log(`[missionsRepo]   - demandeId: ${demandeIdStr} (type: ${typeof demandeIdStr})`);
  console.log(`[missionsRepo]   - prestataireId: ${prestataireIdStr} (type: ${typeof prestataireIdStr}, null: ${prestataireIdStr === null})`);
  console.log(`[missionsRepo]   - clientEmail: ${data.clientEmail}`);
  console.log(`[missionsRepo]   - ref fournie: ${data.ref || "non fournie"}`);
  
  const db = ensurePrisma();
  
  // IMPORTANT: Générer la ref de manière atomique dans la même transaction
  // Si data.ref est fourni, on l'utilise (pour compatibilité), sinon on génère atomiquement
  let refToUse: string;
  if (data.ref) {
    refToUse = data.ref;
    console.log(`[missionsRepo] Utilisation ref fournie: ${refToUse}`);
  } else {
    // Générer atomiquement via le compteur DB
    const { generateMissionRef } = await import("@/lib/missionRef");
    refToUse = await generateMissionRef(db);
    console.log(`[missionsRepo] ✅ Ref générée atomiquement: ${refToUse}`);
  }
  
  // Vérifier que prestataireIdStr est bien un UUID valide
  if (prestataireIdStr && !prestataireIdStr.includes("-")) {
    console.error(`[missionsRepo] ❌ ERREUR: prestataireIdStr n'est pas un UUID valide: ${prestataireIdStr}`);
    console.error(`[missionsRepo]   Type reçu: ${typeof data.prestataireId}, valeur: ${data.prestataireId}`);
  }
  
  return withRetry(async () => {
    const missionCreated = await db.mission.create({
      data: {
        ref: refToUse,
        demandeId: demandeIdStr,
        clientEmail: data.clientEmail,
        prestataireId: prestataireIdStr,
        prestataireRef: data.prestataireRef || null,
        notifiedProviderAt: (data as any).notifiedProviderAt ? new Date((data as any).notifiedProviderAt) : null,
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
    
    console.log(`[missionsRepo] ✅ Mission créée dans DB:`);
    console.log(`[missionsRepo]   - ref: ${missionCreated.ref}`);
    console.log(`[missionsRepo]   - id: ${missionCreated.id}`);
    console.log(`[missionsRepo]   - demandeId: ${missionCreated.demandeId}`);
    console.log(`[missionsRepo]   - prestataireId: ${missionCreated.prestataireId || "NULL ⚠️"}`);
    console.log(`[missionsRepo]   - internalState: ${missionCreated.internalState}`);
    console.log(`[missionsRepo]   - status: ${missionCreated.status}`);
    console.log(`[missionsRepo]   - deleted: ${missionCreated.deleted}`);
    console.log(`[missionsRepo]   - archived: ${missionCreated.archived}`);
    
    // Vérifier que le prestataireId a bien été sauvegardé
    if (!missionCreated.prestataireId) {
      console.error(`[missionsRepo] ❌ ERREUR CRITIQUE: Mission créée SANS prestataireId!`);
      console.error(`[missionsRepo]   Ref: ${missionCreated.ref}`);
      console.error(`[missionsRepo]   PrestataireId attendu: ${prestataireIdStr}`);
    } else if (missionCreated.prestataireId !== prestataireIdStr) {
      console.error(`[missionsRepo] ❌ ERREUR: prestataireId sauvegardé ne correspond pas!`);
      console.error(`[missionsRepo]   Attendu: ${prestataireIdStr}`);
      console.error(`[missionsRepo]   Sauvegardé: ${missionCreated.prestataireId}`);
    } else {
      console.log(`[missionsRepo] ✅ prestataireId correctement sauvegardé: ${missionCreated.prestataireId}`);
    }
    
    return missionCreated;
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
  
  // Mapper notifiedProviderAt si présent
  if ((data as any).notifiedProviderAt !== undefined) {
    updateData.notifiedProviderAt = (data as any).notifiedProviderAt ? new Date((data as any).notifiedProviderAt) : null;
  }
  
  const db = ensurePrisma();
  return withRetry(async () => {
    return db.mission.update({
      where: { id },
      data: updateData,
    });
  });
}

export async function archiveMission(id: string, archivedBy: string) {
  const db = ensurePrisma();
  return db.mission.update({
    where: { id },
    data: {
      archived: true,
      archivedAt: new Date(),
      archivedBy,
    },
  });
}

export async function deleteMission(id: string, deletedBy: string) {
  const db = ensurePrisma();
  return db.mission.update({
    where: { id },
    data: {
      deleted: true,
      deletedAt: new Date(),
      deletedBy,
    },
  });
}

