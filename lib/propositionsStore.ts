// lib/propositionsStore.ts

import { loadFromFile, saveToFileAsync } from "./persistence";

export type PropositionPrestataire = {
  id: string; // UUID
  ref: string; // ex : PROP-2025-001
  createdAt: string; // ISO

  demandeId: string; // UUID de la demande concernée
  prestataireId: string; // UUID du prestataire qui soumet la proposition

  // Informations de la proposition
  prix_prestataire: number; // Montant proposé en FCFA
  delai_estime: number; // Délai estimé en jours
  commentaire: string; // Note explicative
  difficulte_estimee: number; // Niveau de difficulté (1 à 5)

  // Statut de la proposition
  statut: "en_attente" | "acceptee" | "refusee"; // Par défaut "en_attente"
  accepteeAt?: string | null; // ISO date d'acceptation
  refuseeAt?: string | null; // ISO date de refus
  accepteeBy?: string | null; // Email de l'admin qui a accepté
  refuseeBy?: string | null; // Email de l'admin qui a refusé
  raisonRefus?: string | null; // Raison du refus (optionnel)

  // Si acceptée, créer une mission
  missionId?: string | null; // UUID de la mission créée si acceptée
};

type GlobalStore = {
  _icdPropositions?: PropositionPrestataire[];
  _icdPropositionsLoaded?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

// Initialiser le store depuis le fichier
if (!globalStore._icdPropositions) {
  globalStore._icdPropositions = [];
  globalStore._icdPropositionsLoaded = false;
  
  // Charger les données au démarrage (asynchrone)
  loadFromFile<PropositionPrestataire>("propositions.json").then((data) => {
    if (data.length > 0) {
      globalStore._icdPropositions = data;
      console.log(`✅ ${data.length} proposition(s) chargée(s) depuis le fichier`);
    }
    globalStore._icdPropositionsLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des propositions:", error);
    globalStore._icdPropositionsLoaded = true;
  });
}

export const propositionsStore = globalStore._icdPropositions;

// Fonction pour sauvegarder les propositions
function savePropositions() {
  saveToFileAsync("propositions.json", propositionsStore);
}

export function addProposition(
  data: Omit<PropositionPrestataire, "id" | "ref" | "createdAt" | "statut" | "accepteeAt" | "refuseeAt" | "accepteeBy" | "refuseeBy" | "raisonRefus" | "missionId">
): PropositionPrestataire {
  const nextId =
    propositionsStore.length > 0
      ? propositionsStore[propositionsStore.length - 1].id + 1
      : 1;

  const year = new Date().getFullYear();
  const ref = `PROP-${year}-${String(nextId).padStart(3, "0")}`;
  const createdAt = new Date().toISOString();

  const proposition: PropositionPrestataire = {
    id: nextId,
    ref,
    createdAt,
    statut: "en_attente",
    accepteeAt: null,
    refuseeAt: null,
    accepteeBy: null,
    refuseeBy: null,
    raisonRefus: null,
    missionId: null,
    ...data,
  };

  propositionsStore.push(proposition);
  savePropositions();
  return proposition;
}

export function getPropositionById(id: number): PropositionPrestataire | undefined {
  return propositionsStore.find((p) => p.id === id);
}

export function getPropositionsByDemandeId(demandeId: number): PropositionPrestataire[] {
  return propositionsStore.filter((p) => p.demandeId === demandeId);
}

export function getPropositionsByPrestataireId(prestataireId: number): PropositionPrestataire[] {
  return propositionsStore.filter((p) => p.prestataireId === prestataireId);
}

export function updatePropositionStatut(
  id: number,
  statut: "en_attente" | "acceptee" | "refusee",
  adminEmail: string,
  missionId?: number,
  raisonRefus?: string
): PropositionPrestataire | null {
  const proposition = propositionsStore.find((p) => p.id === id);
  if (!proposition) return null;

  proposition.statut = statut;
  if (statut === "acceptee") {
    proposition.accepteeAt = new Date().toISOString();
    proposition.accepteeBy = adminEmail;
    if (missionId) {
      proposition.missionId = missionId;
    }
    // Réinitialiser les champs de refus si nécessaire
    proposition.refuseeAt = null;
    proposition.refuseeBy = null;
    proposition.raisonRefus = null;
  } else if (statut === "refusee") {
    proposition.refuseeAt = new Date().toISOString();
    proposition.refuseeBy = adminEmail;
    if (raisonRefus) {
      proposition.raisonRefus = raisonRefus;
    }
    // Réinitialiser les champs d'acceptation si nécessaire
    proposition.accepteeAt = null;
    proposition.accepteeBy = null;
    proposition.missionId = null;
  } else if (statut === "en_attente") {
    // Réinitialiser tous les champs
    proposition.accepteeAt = null;
    proposition.accepteeBy = null;
    proposition.refuseeAt = null;
    proposition.refuseeBy = null;
    proposition.raisonRefus = null;
    proposition.missionId = null;
  }

  savePropositions();
  return proposition;
}

/**
 * Calcule le score composite d'une proposition
 * score = (0.50 × score_prix) + (0.30 × score_reputation) + (0.20 × score_delai)
 */
export type PropositionScore = {
  proposition: PropositionPrestataire;
  score_prix: number;
  score_reputation: number;
  score_delai: number;
  score_composite: number;
};

export function calculatePropositionScore(
  proposition: PropositionPrestataire,
  allPropositions: PropositionPrestataire[],
  prestataireNoteMoyenne: number
): PropositionScore {
  // 1. Score prix
  const prixMin = Math.min(...allPropositions.map((p) => p.prix_prestataire));
  let score_prix = 10;
  if (proposition.prix_prestataire > prixMin) {
    score_prix = 10 - ((proposition.prix_prestataire - prixMin) / prixMin) * 10;
    score_prix = Math.max(1, score_prix); // Score minimum = 1
  }

  // 2. Score réputation : moyenne × 2 (exemple: 4.5/5 × 2 = 9)
  // Si pas encore évalué, score de base de 5
  const finalScoreReputation = prestataireNoteMoyenne > 0 ? prestataireNoteMoyenne * 2 : 5;

  // 3. Score délai
  const delaiMin = Math.min(...allPropositions.map((p) => p.delai_estime));
  let score_delai = 10;
  if (proposition.delai_estime > delaiMin) {
    score_delai = 10 - ((proposition.delai_estime - delaiMin) / delaiMin) * 10;
    score_delai = Math.max(1, score_delai); // Score minimum = 1
  }

  // 4. Score composite
  const score_composite = 0.5 * score_prix + 0.3 * finalScoreReputation + 0.2 * score_delai;

  return {
    proposition,
    score_prix,
    score_reputation: finalScoreReputation,
    score_delai,
    score_composite,
  };
}

/**
 * Classe les propositions par score composite décroissant
 */
export function rankPropositions(
  propositions: PropositionPrestataire[],
  getPrestataireNoteMoyenne: (prestataireId: string) => number
): PropositionScore[] {
  const scores = propositions.map((prop) =>
    calculatePropositionScore(prop, propositions, getPrestataireNoteMoyenne(prop.prestataireId))
  );

  // Trier par score composite décroissant
  scores.sort((a, b) => b.score_composite - a.score_composite);

  return scores;
}

