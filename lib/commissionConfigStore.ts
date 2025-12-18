// lib/commissionConfigStore.ts
// Store persistant pour les configurations de commission

import { loadFromFile, saveToFileAsync } from "./persistence";
import { CommissionConfig, DEFAULT_COMMISSION_CONFIGS } from "./commissionConfig";

type GlobalStore = {
  _leboyCommissionConfigs?: CommissionConfig[];
  _leboyCommissionConfigsLoaded?: boolean;
  _icdCommissionInitShown?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

// Initialiser le store
if (!globalStore._leboyCommissionConfigs) {
  globalStore._leboyCommissionConfigs = DEFAULT_COMMISSION_CONFIGS;
  globalStore._leboyCommissionConfigsLoaded = false;

  loadFromFile<CommissionConfig>("commissionConfigs.json")
    .then((data) => {
      const isBuildTime = typeof process !== "undefined" && (
        process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.NEXT_PHASE === "phase-development-build"
      );
      
      if (data.length > 0) {
        globalStore._leboyCommissionConfigs = data as CommissionConfig[];
        if (!isBuildTime) {
          console.log(
            `✅ ${data.length} configuration(s) de commission chargée(s) depuis le fichier`
          );
        }
      } else {
        // Si fichier vide, sauvegarder les valeurs par défaut
        saveCommissionConfigs();
        // Ne logger qu'une seule fois au démarrage runtime, pas pendant le build
        if (!isBuildTime && !globalStore._icdCommissionInitShown) {
          console.log(
            `✅ Configurations de commission initialisées avec les valeurs par défaut`
          );
          globalStore._icdCommissionInitShown = true;
        }
      }
      globalStore._leboyCommissionConfigsLoaded = true;
    })
    .catch((error) => {
      const isBuildTime = typeof process !== "undefined" && (
        process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.NEXT_PHASE === "phase-development-build"
      );
      if (!isBuildTime) {
        console.error("Erreur lors du chargement des configurations de commission:", error);
      }
      globalStore._leboyCommissionConfigsLoaded = true;
    });
}

export const commissionConfigsStore = globalStore._leboyCommissionConfigs;

function saveCommissionConfigs() {
  saveToFileAsync("commissionConfigs.json", commissionConfigsStore);
}

/**
 * Récupère toutes les configurations de commission
 */
export function getAllCommissionConfigs(): CommissionConfig[] {
  return commissionConfigsStore || [];
}

/**
 * Récupère une configuration par ID de catégorie
 */
export function getCommissionConfig(categoryId: string): CommissionConfig | null {
  const configs = getAllCommissionConfigs();
  return configs.find((c) => c.id === categoryId && c.enabled) || null;
}

/**
 * Met à jour une configuration de commission
 */
export function updateCommissionConfig(
  categoryId: string,
  updates: Partial<CommissionConfig>
): CommissionConfig | null {
  const configs = getAllCommissionConfigs();
  const index = configs.findIndex((c) => c.id === categoryId);

  if (index === -1) {
    // Créer une nouvelle configuration si elle n'existe pas
    const newConfig: CommissionConfig = {
      id: categoryId,
      categoryName: updates.categoryName || categoryId,
      basePercent: updates.basePercent || 12,
      minCommission: updates.minCommission || 1500,
      maxCommission: updates.maxCommission || 20000,
      riskPercent: updates.riskPercent || 3,
      enabled: updates.enabled !== undefined ? updates.enabled : true,
    };
    configs.push(newConfig);
    saveCommissionConfigs();
    return newConfig;
  }

  // Mettre à jour la configuration existante
  configs[index] = { ...configs[index], ...updates };
  saveCommissionConfigs();
  return configs[index];
}

/**
 * Active ou désactive une configuration
 */
export function toggleCommissionConfig(
  categoryId: string,
  enabled: boolean
): CommissionConfig | null {
  return updateCommissionConfig(categoryId, { enabled });
}

/**
 * Attend que les configurations soient chargées
 */
export async function waitForCommissionConfigsLoad(): Promise<void> {
  if (globalStore._leboyCommissionConfigsLoaded) {
    return;
  }
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (globalStore._leboyCommissionConfigsLoaded) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 50);
  });
}

