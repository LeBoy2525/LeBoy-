// lib/missionsStore.ts

import type { Mission, MissionUpdate, MissionStatus, MissionInternalState, SharedFile, Message } from "./types";
import { mapInternalStateToStatus, getProgressFromInternalState, getProgressStepFromInternalState } from "./types";
import { loadFromFile, saveToFileAsync } from "./persistence";

type GlobalStore = {
  _icdMissions?: Mission[];
  _icdMissionsLoaded?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

// Fonction de migration pour les missions existantes sans internalState
function migrateMissionToInternalState(mission: any): Mission {
  // Si la mission a déjà un internalState, elle est à jour
  if (mission.internalState) {
    return mission as Mission;
  }

  // Migration : déduire l'état interne depuis le statut existant
  let internalState: MissionInternalState = "CREATED";
  
  switch (mission.status) {
    case "en_analyse_quebec":
      internalState = "CREATED";
      break;
    case "en_evaluation_partenaire":
      internalState = "ASSIGNED_TO_PROVIDER";
      break;
    case "evaluation_recue_quebec":
      internalState = "PROVIDER_ESTIMATED";
      break;
    case "en_attente_paiement_client":
      internalState = "WAITING_CLIENT_PAYMENT";
      break;
    case "paye_en_attente_demarrage":
      internalState = "PAID_WAITING_TAKEOVER";
      break;
    case "avance_versee_partenaire":
      internalState = "ADVANCE_SENT";
      break;
    case "en_cours_partenaire":
      internalState = "IN_PROGRESS";
      break;
    case "en_validation_quebec":
      internalState = "PROVIDER_VALIDATION_SUBMITTED";
      break;
    case "termine_icd_canada":
      internalState = "ADMIN_CONFIRMED";
      break;
    case "cloture":
      internalState = "COMPLETED";
      break;
    default:
      internalState = "CREATED";
  }

  return {
    ...mission,
    internalState,
  } as Mission;
}

// Initialiser le store depuis le fichier
if (!globalStore._icdMissions) {
  globalStore._icdMissions = [];
  globalStore._icdMissionsLoaded = false;
  
  // Charger les données au démarrage (asynchrone)
  loadFromFile<Mission>("missions.json").then((data) => {
    if (data.length > 0) {
      // Migrer les missions existantes vers le nouveau système d'états internes
      globalStore._icdMissions = data.map(migrateMissionToInternalState);
      // Sauvegarder les missions migrées
      saveMissions();
      console.log(`✅ ${data.length} mission(s) chargée(s) et migrée(s) depuis le fichier`);
      
      // Vérifier et fermer automatiquement les missions après 24h
      checkAndAutoCloseMissions();
    }
    globalStore._icdMissionsLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des missions:", error);
    globalStore._icdMissionsLoaded = true;
  });
}

export const missionsStore = globalStore._icdMissions;

// Fonction pour sauvegarder les missions
export function saveMissions() {
  saveToFileAsync("missions.json", missionsStore);
}

export function createMission(
  data: Omit<Mission, "id" | "ref" | "createdAt" | "internalState" | "status" | "updates" | "sharedFiles">
): Mission {
  const nextId =
    missionsStore.length > 0
      ? missionsStore[missionsStore.length - 1].id + 1
      : 1;

  const year = new Date().getFullYear();
  const ref = `M-${year}-${String(nextId).padStart(3, "0")}`;
  const createdAt = new Date().toISOString();

  // État interne initial : CREATED (demande déposée par le client)
  const internalState: MissionInternalState = "CREATED";
  const status = mapInternalStateToStatus(internalState);

  const mission: Mission = {
    id: nextId,
    ref,
    createdAt,
    internalState, // État interne : source de vérité
    status, // Statut d'affichage dérivé
    updates: [],
    sharedFiles: [],
    proofs: [],
    messages: [],
    currentProgress: getProgressFromInternalState(internalState),
    progress: [],
    ...data,
  };

  missionsStore.push(mission);
  saveMissions(); // Sauvegarder après ajout
  return mission;
}

export function getMissionById(id: number): Mission | undefined {
  return missionsStore.find((m) => m.id === id);
}

export function getMissionsByClient(email: string): Mission[] {
  return missionsStore
    .filter((m) => m.clientEmail.toLowerCase() === email.toLowerCase())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getMissionsByPrestataire(prestataireId: number): Mission[] {
  return missionsStore
    .filter((m) => m.prestataireId === prestataireId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getMissionsByDemandeId(demandeId: number): Mission[] {
  return missionsStore
    .filter((m) => m.demandeId === demandeId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function missionExistsForDemandeAndPrestataire(demandeId: number, prestataireId: number): boolean {
  return missionsStore.some(
    (m) => m.demandeId === demandeId && m.prestataireId === prestataireId
  );
}

// Fonction principale pour mettre à jour l'état interne du mandat
export function updateMissionInternalState(
  id: number,
  newInternalState: MissionInternalState,
  authorEmail: string
): Mission | null {
  const mission = getMissionById(id);
  if (!mission) return null;

  const oldInternalState = mission.internalState;
  const oldStatus = mission.status;

  // Mettre à jour l'état interne (source de vérité)
  mission.internalState = newInternalState;
  
  // Mettre à jour le statut d'affichage dérivé
  mission.status = mapInternalStateToStatus(newInternalState);
  
  // Initialiser messages si nécessaire
  if (!mission.messages) {
    mission.messages = [];
  }

  // Ajouter une mise à jour
  const update: MissionUpdate = {
    id: mission.updates.length + 1,
    missionId: id,
    type: "status_change",
    author: authorEmail.includes("@leboy") || authorEmail.includes("@leboy.com") || authorEmail.includes("@leboy.ca") ? "admin" : "prestataire",
    authorEmail,
    content: `État interne changé de "${oldInternalState}" à "${newInternalState}"`,
    createdAt: new Date().toISOString(),
  };

  mission.updates.push(update);

  // Mettre à jour les dates et progression selon le nouvel état interne
  const now = new Date().toISOString();
  if (!mission.progress) mission.progress = [];
  
  // Mise à jour des dates et progression selon l'état interne
  const progressStep = getProgressStepFromInternalState(newInternalState);
  const progressPourcentage = getProgressFromInternalState(newInternalState);
  
  switch (newInternalState) {
    case "CREATED":
      if (!mission.currentProgress) mission.currentProgress = progressPourcentage;
      break;
    case "ASSIGNED_TO_PROVIDER":
      if (!mission.dateAssignation) mission.dateAssignation = now;
      if (progressStep) {
        mission.progress.push({
          etape: progressStep,
          pourcentage: progressPourcentage,
          date: now,
        });
      }
      mission.currentProgress = progressPourcentage;
      break;
    case "PROVIDER_ESTIMATED":
      if (!mission.dateAcceptation) mission.dateAcceptation = now;
      mission.currentProgress = progressPourcentage;
      break;
    case "WAITING_CLIENT_PAYMENT":
      mission.currentProgress = progressPourcentage;
      break;
    case "PAID_WAITING_TAKEOVER":
      if (!mission.paiementEffectueAt) mission.paiementEffectueAt = now;
      mission.paiementEffectue = true;
      mission.currentProgress = progressPourcentage;
      break;
    case "ADVANCE_SENT":
      if (!mission.avanceVerseeAt) mission.avanceVerseeAt = now;
      mission.avanceVersee = true;
      mission.currentProgress = progressPourcentage;
      break;
    case "IN_PROGRESS":
      if (!mission.datePriseEnCharge) mission.datePriseEnCharge = now;
      if (!mission.dateDebut) mission.dateDebut = now;
      if (progressStep) {
        mission.progress.push({
          etape: progressStep,
          pourcentage: progressPourcentage,
          date: now,
        });
      }
      mission.currentProgress = progressPourcentage;
      break;
    case "PROVIDER_VALIDATION_SUBMITTED":
      if (!mission.proofSubmissionDate) mission.proofSubmissionDate = now;
      if (progressStep) {
        mission.progress.push({
          etape: progressStep,
          pourcentage: progressPourcentage,
          date: now,
        });
      }
      mission.currentProgress = progressPourcentage;
      break;
    case "ADMIN_CONFIRMED":
      if (!mission.proofValidatedAt) mission.proofValidatedAt = now;
      if (!mission.proofValidatedByAdmin) mission.proofValidatedByAdmin = true;
      if (!mission.dateFin) mission.dateFin = now;
      if (progressStep) {
        mission.progress.push({
          etape: progressStep,
          pourcentage: progressPourcentage,
          date: now,
        });
      }
      mission.currentProgress = progressPourcentage;
      break;
    case "COMPLETED":
      if (progressStep) {
        mission.progress.push({
          etape: progressStep,
          pourcentage: progressPourcentage,
          date: now,
        });
      }
      mission.currentProgress = progressPourcentage;
      break;
  }

  // Recalculer la progression basée sur les phases si elles existent et que la mission est en cours
  if (mission.phases && mission.phases.length > 0 && 
      (newInternalState === "IN_PROGRESS" || newInternalState === "PROVIDER_VALIDATION_SUBMITTED")) {
    const completedPhases = mission.phases.filter((p) => p.completed).length;
    const totalPhases = mission.phases.length;
    // Progression de base (50% pour IN_PROGRESS) + progression des phases (50% à 80%)
    const baseProgress = 50;
    const phasesProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 30) : 0;
    mission.currentProgress = Math.min(
      baseProgress + phasesProgress, 
      newInternalState === "PROVIDER_VALIDATION_SUBMITTED" ? 80 : 90
    );
  }

  saveMissions(); // Sauvegarder après modification
  return mission;
}

// Fonction de compatibilité : met à jour le statut en déduisant l'état interne correspondant
// ⚠️ Cette fonction est conservée pour compatibilité mais devrait être remplacée par updateMissionInternalState
export function updateMissionStatus(
  id: number,
  status: MissionStatus,
  authorEmail: string
): Mission | null {
  // Mapper le statut vers l'état interne correspondant
  let internalState: MissionInternalState = "CREATED";
  
  switch (status) {
    case "en_analyse_quebec":
      internalState = "CREATED";
      break;
    case "en_evaluation_partenaire":
      internalState = "ASSIGNED_TO_PROVIDER";
      break;
    case "evaluation_recue_quebec":
      internalState = "PROVIDER_ESTIMATED";
      break;
    case "en_attente_paiement_client":
      internalState = "WAITING_CLIENT_PAYMENT";
      break;
    case "paye_en_attente_demarrage":
      internalState = "PAID_WAITING_TAKEOVER";
      break;
    case "avance_versee_partenaire":
      internalState = "ADVANCE_SENT";
      break;
    case "en_cours_partenaire":
      internalState = "IN_PROGRESS";
      break;
    case "en_validation_quebec":
      internalState = "PROVIDER_VALIDATION_SUBMITTED";
      break;
    case "termine_icd_canada":
      internalState = "ADMIN_CONFIRMED";
      break;
    case "cloture":
      internalState = "COMPLETED";
      break;
  }

  return updateMissionInternalState(id, internalState, authorEmail);
}

export function addMissionUpdate(
  missionId: number,
  update: Omit<MissionUpdate, "id" | "missionId" | "createdAt">
): MissionUpdate | null {
  const mission = getMissionById(missionId);
  if (!mission) return null;

  const newUpdate: MissionUpdate = {
    ...update,
    id: mission.updates.length + 1,
    missionId,
    createdAt: new Date().toISOString(),
  };

  mission.updates.push(newUpdate);
  saveMissions(); // Sauvegarder après modification
  return newUpdate;
}

export function updateMissionSharedFiles(
  missionId: number,
  sharedFiles: SharedFile[]
): Mission | null {
  const mission = getMissionById(missionId);
  if (!mission) return null;

  mission.sharedFiles = sharedFiles;
  saveMissions(); // Sauvegarder après modification
  return mission;
}

/**
 * Vérifie et ferme automatiquement les missions après 24h de validation des preuves pour le client
 * Cette fonction doit être appelée régulièrement (par exemple lors du chargement des missions)
 */
export function checkAndAutoCloseMissions(): number {
  let closedCount = 0;
  const now = new Date();
  const twentyFourHoursInMs = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

  for (const mission of missionsStore) {
    // Vérifier si la mission est dans l'état ADMIN_CONFIRMED et n'est pas déjà fermée
    if (
      mission.internalState === "ADMIN_CONFIRMED" &&
      mission.proofValidatedForClient &&
      mission.proofValidatedForClientAt &&
      !mission.closedAt &&
      !mission.closedBy
    ) {
      const validatedAt = new Date(mission.proofValidatedForClientAt);
      const timeSinceValidation = now.getTime() - validatedAt.getTime();

      // Si 24h se sont écoulées depuis la validation pour le client
      if (timeSinceValidation >= twentyFourHoursInMs) {
        // Fermer automatiquement la mission
        mission.closedBy = "auto";
        mission.closedAt = now.toISOString();
        
        // Archiver automatiquement la mission terminée
        mission.archived = true;
        mission.archivedAt = now.toISOString();
        mission.archivedBy = "admin"; // Auto-archivage traité comme admin
        
        // Mettre à jour l'état interne vers COMPLETED
        updateMissionInternalState(mission.id, "COMPLETED", "admin@leboy.com");
        
        // Ajouter une mise à jour
        addMissionUpdate(mission.id, {
          type: "status_change",
          author: "admin",
          authorEmail: "admin@leboy.com",
          content: "Mission fermée et archivée automatiquement après 24h de validation des preuves.",
        });
        
        closedCount++;
      }
    }
  }

  if (closedCount > 0) {
    saveMissions();
    console.log(`✅ ${closedCount} mission(s) fermée(s) automatiquement après 24h`);
  }

  return closedCount;
}


