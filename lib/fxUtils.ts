// lib/fxUtils.ts
// Utilitaires pour les conversions de devises et le formatage

import type { Currency } from "./financeTypes";
import { getLatestExchangeRate } from "./financeStores";

/**
 * Convertit un montant XAF vers la devise du client
 */
export function convertXafToClientCurrency(
  amountXaf: number,
  clientCurrency: Currency,
  fxRate?: number
): number {
  if (clientCurrency === "XAF") return amountXaf;

  // Si un taux est fourni, l'utiliser
  if (fxRate !== undefined) {
    return amountXaf / fxRate;
  }

  // Sinon, récupérer le dernier taux disponible
  const rate = getLatestExchangeRate(clientCurrency);
  if (!rate) {
    console.warn(`Taux de change non trouvé pour ${clientCurrency}, utilisation de 1.0`);
    return amountXaf;
  }

  return amountXaf / rate.rate;
}

/**
 * Convertit un montant de la devise du client vers XAF
 */
export function convertClientCurrencyToXaf(
  amount: number,
  clientCurrency: Currency,
  fxRate?: number
): number {
  if (clientCurrency === "XAF") return amount;

  // Si un taux est fourni, l'utiliser
  if (fxRate !== undefined) {
    return amount * fxRate;
  }

  // Sinon, récupérer le dernier taux disponible
  const rate = getLatestExchangeRate(clientCurrency);
  if (!rate) {
    console.warn(`Taux de change non trouvé pour ${clientCurrency}, utilisation de 1.0`);
    return amount;
  }

  return amount * rate.rate;
}

/**
 * Arrondit un montant selon les règles de la devise
 */
export function roundByCurrency(amount: number, currency: Currency): number {
  // XAF : arrondi à l'unité
  if (currency === "XAF") {
    return Math.round(amount);
  }

  // CAD, USD, EUR : arrondi à 2 décimales
  return Math.round(amount * 100) / 100;
}

/**
 * Formate un montant pour l'affichage selon la devise
 */
export function formatCurrency(amount: number, currency: Currency, lang: "fr" | "en" = "fr"): string {
  const rounded = roundByCurrency(amount, currency);

  // Formater selon la devise
  switch (currency) {
    case "CAD":
      return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rounded);

    case "USD":
      return new Intl.NumberFormat(lang === "fr" ? "fr-US" : "en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rounded);

    case "EUR":
      return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-EU", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(rounded);

    case "XAF":
      return `${Math.round(rounded).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")} FCFA`;

    default:
      return `${rounded.toFixed(2)} ${currency}`;
  }
}

/**
 * Formate un taux de change pour l'affichage
 */
export function formatExchangeRate(rate: number, quoteCurrency: Currency): string {
  return `1 ${quoteCurrency} = ${Math.round(rate).toLocaleString()} XAF`;
}

/**
 * Formate un montant XAF pour l'affichage
 */
export function formatXafAmount(amount: number, lang: "fr" | "en" = "fr"): string {
  return `${Math.round(amount).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")} FCFA`;
}

/**
 * Calcule les montants d'un devis avant taxes
 */
export function calculateQuoteAmounts(
  amountXaf: number,
  clientCurrency: Currency,
  fxRate: number,
  transferFeeClient: number = 0
): {
  amountClientBeforeTax: number;
  subtotalClient: number;
} {
  const amountClientBeforeTax = convertXafToClientCurrency(amountXaf, clientCurrency, fxRate);
  const subtotalClient = roundByCurrency(amountClientBeforeTax + transferFeeClient, clientCurrency);

  return {
    amountClientBeforeTax: roundByCurrency(amountClientBeforeTax, clientCurrency),
    subtotalClient,
  };
}

