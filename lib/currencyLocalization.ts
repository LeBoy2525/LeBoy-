// lib/currencyLocalization.ts
// Service pour détecter et gérer la devise du client selon son pays/région

import type { Currency } from "./financeTypes";
import { adminSettings } from "./financeStores";

/**
 * Mapping par défaut des pays vers devises (si non configuré dans AdminSettings)
 */
const DEFAULT_CURRENCY_BY_COUNTRY: Record<string, Currency> = {
  CA: "CAD", // Canada
  US: "USD", // États-Unis
  FR: "EUR", // France
  BE: "EUR", // Belgique
  CH: "EUR", // Suisse (utilise EUR par défaut)
  DE: "EUR", // Allemagne
  ES: "EUR", // Espagne
  IT: "EUR", // Italie
  PT: "EUR", // Portugal
  NL: "EUR", // Pays-Bas
  AT: "EUR", // Autriche
  LU: "EUR", // Luxembourg
  IE: "EUR", // Irlande
  FI: "EUR", // Finlande
  GR: "EUR", // Grèce
  // Pays africains francophones (utilisent XAF ou EUR selon contexte)
  CM: "XAF", // Cameroun
  CI: "XAF", // Côte d'Ivoire
  SN: "XAF", // Sénégal
  TG: "XAF", // Togo
  BJ: "XAF", // Bénin
  BF: "XAF", // Burkina Faso
  ML: "XAF", // Mali
  NE: "XAF", // Niger
  TD: "XAF", // Tchad
  CF: "XAF", // République centrafricaine
  GA: "XAF", // Gabon
  CG: "XAF", // Congo
  GQ: "XAF", // Guinée équatoriale
  // Par défaut : USD
};

/**
 * Détermine la devise du client selon son pays
 */
export function getClientCurrencyByCountry(
  countryCode: string,
  region?: string | null
): Currency {
  // Si AdminSettings contient une configuration, l'utiliser en priorité
  if (adminSettings?.defaultClientCurrencyByCountry) {
    const configuredCurrency = adminSettings.defaultClientCurrencyByCountry[countryCode];
    if (configuredCurrency) {
      return configuredCurrency;
    }
  }

  // Sinon, utiliser le mapping par défaut
  return DEFAULT_CURRENCY_BY_COUNTRY[countryCode] || "USD";
}

/**
 * Détecte la devise du client depuis son adresse de facturation
 */
export function detectClientCurrencyFromBillingAddress(
  countryCode: string,
  region?: string | null
): Currency {
  return getClientCurrencyByCountry(countryCode, region);
}

/**
 * Détecte la devise du client depuis la géolocalisation du navigateur
 * (fallback si aucune adresse de facturation n'est disponible)
 */
export async function detectClientCurrencyFromGeolocation(): Promise<Currency | null> {
  try {
    // Utiliser une API de géolocalisation IP (ex: ipapi.co, ip-api.com)
    // Pour l'instant, on retourne null car cela nécessite une clé API externe
    // En production, vous pouvez utiliser :
    // const response = await fetch(`https://ipapi.co/json/`);
    // const data = await response.json();
    // return getClientCurrencyByCountry(data.country_code);

    return null;
  } catch (error) {
    console.error("Erreur lors de la détection de géolocalisation:", error);
    return null;
  }
}

/**
 * Obtient le symbole de devise pour l'affichage
 */
export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case "CAD":
      return "$";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "XAF":
      return "FCFA";
    default:
      return currency;
  }
}

/**
 * Obtient le nom complet de la devise
 */
export function getCurrencyName(currency: Currency, lang: "fr" | "en" = "fr"): string {
  const names: Record<Currency, { fr: string; en: string }> = {
    CAD: { fr: "Dollar canadien", en: "Canadian Dollar" },
    USD: { fr: "Dollar américain", en: "US Dollar" },
    EUR: { fr: "Euro", en: "Euro" },
    XAF: { fr: "Franc CFA", en: "CFA Franc" },
  };

  return names[currency][lang];
}

