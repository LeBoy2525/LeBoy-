// lib/prestatairesStore.ts

import { loadFromFile, saveToFileAsync } from "./persistence";

// ServiceType est maintenant aligné avec ServiceCategoryId pour compatibilité
// Les anciens types sont mappés vers les nouvelles catégories
export type ServiceType = 
  | "administratif" // Mappé vers "administratif_government"
  | "immobilier_foncier" // Mappé vers "immobilier_foncier"
  | "fiscalite" // Mappé vers "financier_fiscal"
  | "entrepreneuriat" // Mappé vers "entrepreneuriat_projets"
  | "assistance_personnalisee" // Mappé vers "sante_assistance" ou "logistique_livraison"
  // Nouvelles catégories LeBoy
  | "administratif_government"
  | "immobilier_foncier"
  | "financier_fiscal"
  | "sante_assistance"
  | "logistique_livraison"
  | "entrepreneuriat_projets";

// Fonction de mapping pour rétrocompatibilité
export function mapLegacyServiceTypeToCategory(serviceType: string): string {
  const mapping: Record<string, string> = {
    "administratif": "administratif_government",
    "immobilier_foncier": "immobilier_foncier",
    "fiscalite": "financier_fiscal",
    "entrepreneuriat": "entrepreneuriat_projets",
    "assistance_personnalisee": "sante_assistance",
  };
  return mapping[serviceType] || serviceType;
}

export type StatutPrestataire = "en_attente" | "actif" | "suspendu" | "rejete";

export type Prestataire = {
  id: string; // UUID
  ref: string; // ex : P-2025-001
  createdAt: string; // ISO

  // Informations de base
  nomEntreprise: string;
  nomContact: string;
  email: string;
  phone: string;
  adresse: string;
  ville: string; // Yaoundé, Douala, etc.

  // Spécialités (catégories de services - utilise ServiceCategoryId)
  specialites: ServiceType[]; // IDs des catégories de services (ex: ["administratif_government", "immobilier_foncier"])
  zonesIntervention: string[]; // Villes où il intervient
  countries?: string[]; // Codes pays où le prestataire opère (ex: ["CM", "CI"] pour Cameroun et Côte d'Ivoire)
  
  // Type de prestataire
  typePrestataire?: "entreprise" | "freelance"; // Type de prestataire (entreprise avec documents officiels ou freelance indépendant)

  // Certifications et qualifications
  certifications: string[]; // ["Notaire", "Géomètre", "Comptable", etc.]
  numeroOrdre?: string; // Numéro d'ordre professionnel si applicable
  anneeExperience: number;

  // Statut et validation
  statut: StatutPrestataire;
  dateValidation?: string; // Date de validation par LeBoy
  documentsVerifies: boolean;

  // Performance
  noteMoyenne: number; // 0-5 (moyenne des notes de l'admin)
  nombreMissions: number;
  nombreMissionsReussies: number;
  nombreEvaluations?: number; // Nombre de missions évaluées par l'admin
  tauxReussite: number; // %

  // Tarification
  tarifType: "fixe" | "pourcentage" | "horaire";
  tarifMin?: number; // Montant minimum
  tarifMax?: number; // Montant maximum
  commissionICD: number; // % de commission pour LeBoy (ex: 15)

  // Disponibilité
  disponibilite: "disponible" | "charge" | "indisponible";
  capaciteMaxMissions: number; // Nombre max de missions simultanées

  // Informations complémentaires
  description?: string;
  siteWeb?: string;
  reseauxSociaux?: {
    linkedin?: string;
    facebook?: string;
  };

  // Ajouter ces champs :
  passwordHash?: string; // Hash bcrypt (optionnel pour compatibilité)
  
  // Documents justificatifs
  documents?: {
    id: string;
    type: "entreprise" | "certification" | "ordre_professionnel" | "autre";
    name: string;
    url: string; // URL ou chemin du fichier
    uploadedAt: string; // ISO date
  }[];

  // Soft delete
  deletedAt?: string | null; // ISO date de suppression
  deletedBy?: string | null; // Email de l'admin qui a supprimé
};

type GlobalStore = {
  _icdPrestataires?: Prestataire[];
  _icdPrestatairesLoaded?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

// Initialiser le store depuis le fichier
if (!globalStore._icdPrestataires) {
  globalStore._icdPrestataires = [];
  globalStore._icdPrestatairesLoaded = false;
  
  // Charger les données au démarrage (asynchrone)
  loadFromFile<Prestataire>("prestataires.json").then((data) => {
    if (data.length > 0) {
      globalStore._icdPrestataires = data;
      console.log(`✅ ${data.length} prestataire(s) chargé(s) depuis le fichier`);
    }
    globalStore._icdPrestatairesLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des prestataires:", error);
    globalStore._icdPrestatairesLoaded = true;
  });
}

export const prestatairesStore = globalStore._icdPrestataires;

// Fonction pour sauvegarder les prestataires
export function savePrestataires() {
  saveToFileAsync("prestataires.json", prestatairesStore);
}

export function addPrestataire(
  data: {
    // Champs obligatoires
    nomEntreprise: string;
    nomContact: string;
    email: string;
    phone: string;
    adresse: string;
    ville: string;
    specialites: ServiceType[];
    zonesIntervention: string[];
    countries?: string[]; // Pays d'opération
    certifications: string[];
    anneeExperience: number;
    tarifType: "fixe" | "pourcentage" | "horaire";
    commissionICD: number;
    capaciteMaxMissions: number;
    
    // Champs optionnels
    passwordHash?: string;
    typePrestataire?: "entreprise" | "freelance";
    description?: string;
    numeroOrdre?: string;
    tarifMin?: number;
    tarifMax?: number;
    siteWeb?: string;
    reseauxSociaux?: {
      linkedin?: string;
      facebook?: string;
    };
    documents?: {
      id: string;
      type: "entreprise" | "certification" | "ordre_professionnel" | "autre";
      name: string;
      url: string;
      uploadedAt: string;
    }[];
  }
): Prestataire {
  const nextId =
    prestatairesStore.length > 0
      ? prestatairesStore[prestatairesStore.length - 1].id + 1
      : 1;

  const year = new Date().getFullYear();
  const ref = `P-${year}-${String(nextId).padStart(3, "0")}`;
  const createdAt = new Date().toISOString();

  const prestataire: Prestataire = {
    id: nextId,
    ref,
    createdAt,
    // Valeurs par défaut (ne seront pas écrasées car définies avant le spread)
    noteMoyenne: 0,
    nombreMissions: 0,
    nombreMissionsReussies: 0,
    tauxReussite: 0,
    statut: "en_attente",
    documentsVerifies: false,
    disponibilite: "disponible",
    typePrestataire: data.typePrestataire || "freelance", // Par défaut freelance
    // Données fournies (peuvent écraser les valeurs par défaut si nécessaire)
    ...data,
  };

  prestatairesStore.push(prestataire);
  savePrestataires(); // Sauvegarder après ajout
  return prestataire;
}

export function getPrestataireById(id: number): Prestataire | undefined {
  return prestatairesStore.find((p) => p.id === id && !p.deletedAt);
}

export function getPrestataireByEmail(email: string): Prestataire | undefined {
  return prestatairesStore.find(
    (p) => p.email.toLowerCase() === email.toLowerCase() && !p.deletedAt
  );
}

export function getPrestataireByRef(ref: string): Prestataire | undefined {
  return prestatairesStore.find((p) => p.ref === ref);
}

export function getPrestatairesBySpecialite(
  specialite: ServiceType
): Prestataire[] {
  return prestatairesStore.filter(
    (p) => p.specialites.includes(specialite) && p.statut === "actif"
  );
}

/**
 * Normalise une chaîne en supprimant les accents et en convertissant en minuscules
 */
function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .toLowerCase()
    .trim();
}

/**
 * Vérifie si deux villes correspondent (normalisation des accents)
 */
function villesMatch(ville1: string, ville2: string): boolean {
  const normalized1 = normalizeString(ville1);
  const normalized2 = normalizeString(ville2);
  return normalized1 === normalized2 || 
         normalized1.includes(normalized2) || 
         normalized2.includes(normalized1);
}

export function getPrestatairesByVille(ville: string): Prestataire[] {
  return prestatairesStore.filter(
    (p) => p.zonesIntervention && p.zonesIntervention.some((zone) => villesMatch(zone, ville)) && p.statut === "actif" && !p.deletedAt
  );
}

export function getPrestatairesActifs(): Prestataire[] {
  return prestatairesStore.filter((p) => p.statut === "actif" && !p.deletedAt);
}

// Fonction pour obtenir les prestataires rejetés (non supprimés)
export function getPrestatairesRejetes(): Prestataire[] {
  return prestatairesStore.filter((p) => p.statut === "rejete" && !p.deletedAt);
}

// Fonction pour obtenir les prestataires supprimés (corbeille)
export function getDeletedPrestataires(): Prestataire[] {
  return prestatairesStore
    .filter((p) => p.deletedAt !== null && p.deletedAt !== undefined)
    .sort((a, b) => {
      const dateA = a.deletedAt || "";
      const dateB = b.deletedAt || "";
      return dateB.localeCompare(dateA); // Plus récent en premier
    });
}

// Fonction pour supprimer un prestataire rejeté (soft delete)
export function softDeletePrestataire(
  prestataireId: number,
  deletedBy: string
): Prestataire | null {
  const prestataire = prestatairesStore.find((p) => p.id === prestataireId);
  if (!prestataire) return null;

  // Ne permettre la suppression que si le prestataire est rejeté
  if (prestataire.statut !== "rejete") {
    console.warn(`Tentative de suppression d'un prestataire non rejeté: ${prestataireId}`);
    return null;
  }

  prestataire.deletedAt = new Date().toISOString();
  prestataire.deletedBy = deletedBy;
  savePrestataires();
  return prestataire;
}

// Fonction pour restaurer un prestataire supprimé
export function restorePrestataire(prestataireId: number): Prestataire | null {
  const prestataire = prestatairesStore.find((p) => p.id === prestataireId);
  if (!prestataire || !prestataire.deletedAt) return null;

  // Vérifier si la suppression date de plus de 30 jours
  const deletedDate = new Date(prestataire.deletedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff > 30) {
    return null; // Trop tard pour restaurer
  }

  prestataire.deletedAt = null;
  prestataire.deletedBy = null;
  savePrestataires();
  return prestataire;
}

// Fonction pour supprimer définitivement les prestataires de plus de 30 jours
export function purgeOldDeletedPrestataires(): number {
  const now = new Date();
  let purged = 0;

  for (let i = prestatairesStore.length - 1; i >= 0; i--) {
    const prestataire = prestatairesStore[i];
    if (prestataire.deletedAt) {
      const deletedDate = new Date(prestataire.deletedAt);
      const daysDiff = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 30) {
        prestatairesStore.splice(i, 1);
        purged++;
      }
    }
  }

  if (purged > 0) {
    savePrestataires();
  }

  return purged;
}

export function updatePrestataire(
  id: number,
  updates: Partial<Prestataire>
): Prestataire | null {
  const index = prestatairesStore.findIndex((p) => p.id === id);
  if (index === -1) return null;

  prestatairesStore[index] = { ...prestatairesStore[index], ...updates };
  savePrestataires(); // Sauvegarder après modification
  return prestatairesStore[index];
}

// Fonction utilitaire pour recalculer la note moyenne d'un prestataire
export function recalculatePrestataireRating(prestataireId: number): void {
  const prestataire = getPrestataireById(prestataireId);
  if (!prestataire) return;

  // Récupérer toutes les missions du prestataire avec des notes admin
  const { missionsStore } = require("@/lib/missionsStore");
  const missionsWithRatings = missionsStore.filter(
    (m: any) => m.prestataireId === prestataireId && m.noteAdminPourPrestataire !== undefined && m.noteAdminPourPrestataire > 0
  );

  if (missionsWithRatings.length > 0) {
    const sum = missionsWithRatings.reduce((acc: number, m: any) => acc + (m.noteAdminPourPrestataire || 0), 0);
    const average = sum / missionsWithRatings.length;

    prestataire.noteMoyenne = Math.round(average * 10) / 10;
    prestataire.nombreEvaluations = missionsWithRatings.length;
    savePrestataires();
  }
}

