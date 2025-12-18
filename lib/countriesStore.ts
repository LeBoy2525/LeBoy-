// lib/countriesStore.ts
// Store pour gérer les pays supportés par LeBoy (persistant et configurable par l'admin)

import { loadFromFile, saveToFileAsync } from "./persistence";
import { SUPPORTED_COUNTRIES as DEFAULT_COUNTRIES, type Country } from "./countries";

// Ré-exporter le type Country
export type { Country };

type GlobalStore = {
  _icdCountries?: Country[];
  _icdCountriesLoaded?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

// Initialiser le store depuis le fichier
if (!globalStore._icdCountries) {
  globalStore._icdCountries = [];
  globalStore._icdCountriesLoaded = false;
  
  // Charger les données au démarrage (asynchrone)
  loadFromFile<Country>("countries.json").then((data) => {
    const isBuildTime = typeof process !== "undefined" && (
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.NEXT_PHASE === "phase-development-build"
    );
    
    if (data.length > 0) {
      globalStore._icdCountries = data;
      if (!isBuildTime) {
        console.log(`✅ ${data.length} pays chargé(s) depuis le fichier`);
      }
    } else {
      // Si aucun fichier, initialiser avec les pays par défaut
      globalStore._icdCountries = DEFAULT_COUNTRIES;
      saveCountries(); // Sauvegarder les pays par défaut
      // Ne logger qu'une seule fois au démarrage runtime, pas pendant le build
      if (!isBuildTime && !globalThis._icdCountriesInitShown) {
        console.log(`✅ Pays initialisés avec les valeurs par défaut`);
        globalThis._icdCountriesInitShown = true;
      }
    }
    globalStore._icdCountriesLoaded = true;
  }).catch((error) => {
    const isBuildTime = typeof process !== "undefined" && (
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.NEXT_PHASE === "phase-development-build"
    );
    if (!isBuildTime) {
      console.error("Erreur lors du chargement des pays:", error);
    }
    // En cas d'erreur, utiliser les valeurs par défaut
    globalStore._icdCountries = DEFAULT_COUNTRIES;
    globalStore._icdCountriesLoaded = true;
  });
}

export const countriesStore = globalStore._icdCountries;

// Fonction pour sauvegarder les pays
function saveCountries() {
  saveToFileAsync("countries.json", countriesStore);
}

// Fonction exportée pour sauvegarder (utilisée par les API routes)
export function saveCountriesToFile() {
  saveCountries();
}

// Obtenir tous les pays actifs
export function getActiveCountries(): Country[] {
  return countriesStore.filter((c) => c.enabled);
}

// Obtenir tous les pays (actifs et inactifs)
export function getAllCountries(): Country[] {
  return countriesStore;
}

// Obtenir un pays par code
export function getCountryByCode(code: string): Country | undefined {
  return countriesStore.find((c) => c.code === code);
}

// Activer/désactiver un pays
export function toggleCountry(code: string, enabled: boolean): Country | null {
  const country = getCountryByCode(code);
  if (!country) return null;

  country.enabled = enabled;
  saveCountries();
  return country;
}

// Mettre à jour un pays
export function updateCountry(code: string, updates: Partial<Country>): Country | null {
  const country = getCountryByCode(code);
  if (!country) return null;

  Object.assign(country, updates);
  saveCountries();
  return country;
}

// Ajouter un nouveau pays (si nécessaire)
export function addCountry(country: Country): Country | null {
  if (getCountryByCode(country.code)) {
    return null; // Existe déjà
  }

  countriesStore.push(country);
  saveCountries();
  return country;
}

