// lib/demandesStore.ts

import { loadFromFile, saveToFileAsync } from "./persistence";

export type DemandeICD = {
  id: number;
  ref: string; // ex : D-2025-001
  createdAt: string; // ISO

  deviceId?: string | null;

  fullName: string;
  email: string;
  phone: string;

  serviceType: string; // ID de la catégorie principale (ex: "administratif_government")
  serviceSubcategory?: string; // ID de la sous-catégorie (ex: "acte_naissance")
  serviceAutre?: string | null; // Pour compatibilité rétroactive
  country?: string; // Code pays (ex: "CM" pour Cameroun, "CI" pour Côte d'Ivoire)

  description: string;
  lieu?: string | null;
  budget?: string | null;
  urgence: string;

  // Fichiers joints par le client
  fileIds?: string[]; // IDs des fichiers dans filesStore

  // Statut de la demande
  statut?: "en_attente" | "rejetee" | "acceptee" | "modification_demandee"; // Par défaut "en_attente"
  rejeteeAt?: string | null; // ISO date de rejet
  rejeteeBy?: string | null; // Email de l'admin qui a rejeté
  raisonRejet?: string | null; // Raison du rejet (optionnel)
  
  // Demande de modification
  modificationDemandeeAt?: string | null; // ISO date de demande de modification
  modificationDemandeeBy?: string | null; // Email de l'admin qui a demandé la modification
  messageModification?: string | null; // Message expliquant ce qui doit être modifié

  // Soft delete
  deletedAt?: string | null; // ISO date de suppression
  deletedBy?: string | null; // Email de l'admin qui a supprimé
};

type GlobalStore = {
  _icdDemandes?: DemandeICD[];
  _icdDemandesLoaded?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

// Initialiser le store depuis le fichier
if (!globalStore._icdDemandes) {
  globalStore._icdDemandes = [];
  globalStore._icdDemandesLoaded = false;
  
  // Charger les données au démarrage (asynchrone)
  loadFromFile<DemandeICD>("demandes.json").then((data) => {
    if (data.length > 0) {
      globalStore._icdDemandes = data;
      console.log(`✅ ${data.length} demande(s) chargée(s) depuis le fichier`);
    }
    globalStore._icdDemandesLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des demandes:", error);
    globalStore._icdDemandesLoaded = true;
  });
}

export const demandesStore = globalStore._icdDemandes;

// Fonction pour sauvegarder les demandes
function saveDemandes() {
  saveToFileAsync("demandes.json", demandesStore);
}

export function addDemande(
  data: Omit<DemandeICD, "id" | "ref" | "createdAt" | "deletedAt" | "deletedBy" | "statut" | "rejeteeAt" | "rejeteeBy" | "raisonRejet">
): DemandeICD {
  const nextId =
    demandesStore.length > 0
      ? demandesStore[demandesStore.length - 1].id + 1
      : 1;

  const year = new Date().getFullYear();
  const ref = `D-${year}-${String(nextId).padStart(3, "0")}`;
  const createdAt = new Date().toISOString();

  const demande: DemandeICD = {
    id: nextId,
    ref,
    createdAt,
    statut: "en_attente",
    deletedAt: null,
    deletedBy: null,
    rejeteeAt: null,
    rejeteeBy: null,
    raisonRejet: null,
    ...data,
  };

  demandesStore.push(demande);
  saveDemandes(); // Sauvegarder après ajout
  return demande;
}

export function getDemandesByDevice(deviceId: string | null): DemandeICD[] {
  if (!deviceId) return [];
  return demandesStore
    .filter((d) => d.deviceId === deviceId && !d.deletedAt) // Exclure les supprimées
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// Fonction pour obtenir toutes les demandes actives (non supprimées)
export function getActiveDemandes(): DemandeICD[] {
  return demandesStore.filter((d) => !d.deletedAt);
}

// Fonction pour obtenir les demandes rejetées
export function getRejectedDemandes(): DemandeICD[] {
  return demandesStore.filter((d) => d.statut === "rejetee" && !d.deletedAt);
}

// Fonction pour rejeter une demande
export function rejectDemande(
  demandeId: number,
  rejectedBy: string,
  raisonRejet?: string
): DemandeICD | null {
  const demande = demandesStore.find((d) => d.id === demandeId);
  if (!demande) return null;

  demande.statut = "rejetee";
  demande.rejeteeAt = new Date().toISOString();
  demande.rejeteeBy = rejectedBy;
  demande.raisonRejet = raisonRejet || null;
  saveDemandes(); // Sauvegarder après modification
  return demande;
}

// Fonction pour demander une modification à une demande
export function requestModificationDemande(
  demandeId: number,
  requestedBy: string,
  messageModification: string
): DemandeICD | null {
  const demande = demandesStore.find((d) => d.id === demandeId);
  if (!demande) return null;

  demande.statut = "modification_demandee";
  demande.modificationDemandeeAt = new Date().toISOString();
  demande.modificationDemandeeBy = requestedBy;
  demande.messageModification = messageModification;
  saveDemandes(); // Sauvegarder après modification
  return demande;
}

// Fonction pour renvoyer une demande après modification
export function resubmitDemande(demandeId: number): DemandeICD | null {
  const demande = demandesStore.find((d) => d.id === demandeId);
  if (!demande) return null;

  // Réinitialiser le statut à "en_attente" et effacer les champs de modification
  demande.statut = "en_attente";
  demande.modificationDemandeeAt = null;
  demande.modificationDemandeeBy = null;
  demande.messageModification = null;
  saveDemandes(); // Sauvegarder après modification
  return demande;
}

// Fonction pour obtenir une demande par ID
export function getDemandeById(id: number): DemandeICD | undefined {
  return demandesStore.find((d) => d.id === id);
}

// Fonction pour obtenir les demandes supprimées (corbeille)
export function getDeletedDemandes(): DemandeICD[] {
  return demandesStore
    .filter((d) => d.deletedAt !== null && d.deletedAt !== undefined)
    .sort((a, b) => {
      const dateA = a.deletedAt || "";
      const dateB = b.deletedAt || "";
      return dateA < dateB ? 1 : -1;
    });
}

// Fonction pour supprimer une demande (soft delete)
export function softDeleteDemande(
  demandeId: number,
  deletedBy: string
): DemandeICD | null {
  const demande = demandesStore.find((d) => d.id === demandeId);
  if (!demande) return null;

  demande.deletedAt = new Date().toISOString();
  demande.deletedBy = deletedBy;
  saveDemandes(); // Sauvegarder après modification
  return demande;
}

// Fonction pour restaurer une demande
export function restoreDemande(demandeId: number): DemandeICD | null {
  const demande = demandesStore.find((d) => d.id === demandeId);
  if (!demande || !demande.deletedAt) return null;

  // Vérifier si la suppression date de plus de 30 jours
  const deletedDate = new Date(demande.deletedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff > 30) {
    return null; // Trop tard pour restaurer
  }

  demande.deletedAt = null;
  demande.deletedBy = null;
  saveDemandes(); // Sauvegarder après modification
  return demande;
}

// Fonction pour supprimer définitivement les demandes de plus de 30 jours
export function purgeOldDeletedDemandes(): number {
  const now = new Date();
  let purged = 0;

  demandesStore.forEach((demande, index) => {
    if (demande.deletedAt) {
      const deletedDate = new Date(demande.deletedAt);
      const daysDiff = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 30) {
        demandesStore.splice(index, 1);
        purged++;
      }
    }
  });

  if (purged > 0) {
    saveDemandes(); // Sauvegarder après purge
  }

  return purged;
}

// Fonction pour mettre à jour le statut d'une demande
export function updateDemandeStatus(
  demandeId: number,
  newStatus: "en_attente" | "rejetee" | "acceptee",
  raisonRejet?: string
): DemandeICD | null {
  const demande = demandesStore.find((d) => d.id === demandeId);
  if (!demande) return null;

  demande.statut = newStatus;
  if (raisonRejet) {
    demande.raisonRejet = raisonRejet;
  }
  if (newStatus === "rejetee") {
    demande.rejeteeAt = new Date().toISOString();
  }
  saveDemandes();
  return demande;
}
