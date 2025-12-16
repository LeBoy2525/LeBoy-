// lib/commissionConfig.ts
// Configuration des commissions LeBoy par catégorie de service

export type CommissionConfig = {
  id: string; // ID de la catégorie de service
  categoryName: string; // Nom de la catégorie (pour affichage)
  basePercent: number; // Commission de base (%)
  minCommission: number; // Commission minimale (FCFA)
  maxCommission: number; // Commission maximale (FCFA)
  riskPercent: number; // Frais de protection (%)
  enabled: boolean; // Actif/inactif
};

export type CommissionCalculationResult = {
  prixPrestataire: number;
  commissionHybride: number; // Revenu réel LeBoy
  commissionRisk: number; // Fonds de protection
  commissionTotale: number; // commissionHybride + commissionRisk
  prixClient: number; // prixPrestataire + commissionTotale
};

// Configuration par défaut
export const DEFAULT_COMMISSION_CONFIGS: CommissionConfig[] = [
  {
    id: "administration",
    categoryName: "Administration",
    basePercent: 12,
    minCommission: 1500,
    maxCommission: 20000,
    riskPercent: 3,
    enabled: true,
  },
  {
    id: "immobilier",
    categoryName: "Immobilier",
    basePercent: 15,
    minCommission: 2000,
    maxCommission: 30000,
    riskPercent: 4,
    enabled: true,
  },
  {
    id: "sante",
    categoryName: "Santé",
    basePercent: 10,
    minCommission: 1500,
    maxCommission: 15000,
    riskPercent: 3,
    enabled: true,
  },
  {
    id: "transport",
    categoryName: "Transport",
    basePercent: 12,
    minCommission: 1500,
    maxCommission: 20000,
    riskPercent: 3,
    enabled: true,
  },
  {
    id: "livraison",
    categoryName: "Livraison",
    basePercent: 10,
    minCommission: 1000,
    maxCommission: 15000,
    riskPercent: 2,
    enabled: true,
  },
  {
    id: "fiscalite",
    categoryName: "Fiscalité",
    basePercent: 15,
    minCommission: 2000,
    maxCommission: 25000,
    riskPercent: 4,
    enabled: true,
  },
];

/**
 * Calcule la commission LeBoy selon la formule hybride
 */
export function calculateCommission(
  prixPrestataire: number,
  config: CommissionConfig
): CommissionCalculationResult {
  // 1. Commission hybride (base avec min/max)
  const commissionBase = (prixPrestataire * config.basePercent) / 100;
  const commissionHybride = Math.max(
    config.minCommission,
    Math.min(commissionBase, config.maxCommission)
  );

  // 2. Commission risque (fonds de protection)
  const commissionRisk = (prixPrestataire * config.riskPercent) / 100;

  // 3. Commission totale
  const commissionTotale = commissionHybride + commissionRisk;

  // 4. Prix client final
  const prixClient = prixPrestataire + commissionTotale;

  return {
    prixPrestataire,
    commissionHybride: Math.round(commissionHybride * 100) / 100,
    commissionRisk: Math.round(commissionRisk * 100) / 100,
    commissionTotale: Math.round(commissionTotale * 100) / 100,
    prixClient: Math.round(prixClient * 100) / 100,
  };
}

/**
 * Mappe les types de services LeBoy vers les IDs de configuration de commission
 */
function mapServiceTypeToCommissionConfigId(serviceType: string): string {
  const mapping: Record<string, string> = {
    // Mapping des types de services vers les IDs de configuration
    "administratif_government": "administration",
    "administratif": "administration",
    "immobilier_foncier": "immobilier",
    "immobilier": "immobilier",
    "financier_fiscal": "fiscalite",
    "fiscalite": "fiscalite",
    "sante_assistance": "sante",
    "sante": "sante",
    "logistique_livraison": "livraison",
    "livraison": "livraison",
    "transport": "transport",
    "entrepreneuriat_projets": "administration", // Par défaut vers administration
    "entrepreneuriat": "administration",
    "assistance_personnalisee": "administration",
    "autre": "administration",
  };
  
  return mapping[serviceType] || serviceType;
}

/**
 * Trouve la configuration de commission pour une catégorie de service
 * Essaie d'abord une correspondance exacte, puis un mapping, puis crée une config par défaut
 */
export function getCommissionConfigForCategory(
  categoryId: string,
  configs: CommissionConfig[]
): CommissionConfig | null {
  // 1. Essayer une correspondance exacte
  let config = configs.find((c) => c.id === categoryId && c.enabled);
  
  if (config) {
    return config;
  }
  
  // 2. Essayer avec le mapping
  const mappedId = mapServiceTypeToCommissionConfigId(categoryId);
  config = configs.find((c) => c.id === mappedId && c.enabled);
  
  if (config) {
    return config;
  }
  
  // 3. Si aucune configuration trouvée, retourner une configuration par défaut basée sur "administration"
  const defaultConfig = configs.find((c) => c.id === "administration" && c.enabled);
  if (defaultConfig) {
    return defaultConfig;
  }
  
  // 4. Dernier recours : créer une configuration par défaut minimale
  return {
    id: categoryId,
    categoryName: categoryId,
    basePercent: 12,
    minCommission: 1500,
    maxCommission: 20000,
    riskPercent: 3,
    enabled: true,
  };
}

