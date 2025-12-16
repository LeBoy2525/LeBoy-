// lib/demoStore.ts

// Type de demande stockée en mémoire (démo uniquement)
export type DemoDemande = {
  id: string; // ex : D-2025-001
  createdAt: string; // ISO string
  email: string;
  fullName: string;
  serviceType: string;
  serviceDetail?: string;
  country: string;
  city: string;
  cameroonCity: string;
  cameroonLocationDetails?: string;
  status: "en_analyse" | "en_cours" | "cloture";
};

// Tableau en mémoire côté serveur (se réinitialise si tu relances `npm run dev`)
const DEMANDES: DemoDemande[] = [];

// Génère une référence du type D-2025-001, D-2025-002, etc.
function generateRef(): string {
  const year = new Date().getFullYear();
  const nextIndex = DEMANDES.length + 1;
  const padded = String(nextIndex).padStart(3, "0");
  return `D-${year}-${padded}`;
}

// Ajoute une demande en mémoire
export function addDemandeForEmail(data: {
  email: string;
  fullName: string;
  serviceType: string;
  serviceDetail?: string;
  country: string;
  city: string;
  cameroonCity: string;
  cameroonLocationDetails?: string;
}): DemoDemande {
  const now = new Date().toISOString();
  const nouvelle: DemoDemande = {
    id: generateRef(),
    createdAt: now,
    email: data.email,
    fullName: data.fullName,
    serviceType: data.serviceType,
    serviceDetail: data.serviceDetail,
    country: data.country,
    city: data.city,
    cameroonCity: data.cameroonCity,
    cameroonLocationDetails: data.cameroonLocationDetails,
    status: "en_analyse",
  };

  // On insère en début de tableau pour avoir les plus récentes en premier
  DEMANDES.unshift(nouvelle);

  return nouvelle;
}

// Retourne les X dernières demandes pour un email donné
export function listDemandesForEmail(
  email: string,
  limit: number = 5
): DemoDemande[] {
  return DEMANDES.filter((d) => d.email === email).slice(0, limit);
}

// ➜ NOUVELLE FONCTION : toutes les demandes, sans filtre email
export function listAllDemandes(limit: number = 5): DemoDemande[] {
  return DEMANDES.slice(0, limit);
}

// Pour la page détail : pouvoir chercher par id
export function findDemandeById(id: string): DemoDemande | undefined {
  return DEMANDES.find((d) => d.id.toLowerCase() === id.toLowerCase());
}
