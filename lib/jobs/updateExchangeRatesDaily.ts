// lib/jobs/updateExchangeRatesDaily.ts
// Job quotidien pour mettre à jour les taux de change

import { fetchLatestExchangeRates } from "../exchangeRateService";
import {
  addExchangeRate,
  getExchangeRate,
  exchangeRatesStore,
} from "../financeStores";
import { format } from "date-fns-tz";

/**
 * Met à jour les taux de change pour aujourd'hui
 * Ne remplace pas les taux manuels existants
 */
export async function updateExchangeRatesDaily(): Promise<void> {
  const timezone = "America/Toronto";
  const today = format(new Date(), "yyyy-MM-dd", { timeZone: timezone });

  console.log(`[UPDATE_EXCHANGE_RATES] Mise à jour des taux pour ${today}`);

  try {
    const rates = await fetchLatestExchangeRates();

    // Mettre à jour chaque devise
    for (const [currency, rate] of Object.entries(rates)) {
      if (!rate) continue;

      // Vérifier si un taux manuel existe déjà pour aujourd'hui
      const existingRate = getExchangeRate(currency, today);
      if (existingRate && existingRate.source === "manual") {
        console.log(
          `[UPDATE_EXCHANGE_RATES] Taux manuel existant pour ${currency} le ${today}, ignoré`
        );
        continue;
      }

      // Si un taux auto existe déjà, le mettre à jour
      if (existingRate && existingRate.source === "auto") {
        existingRate.rate = rate;
        existingRate.updatedAt = new Date().toISOString();
        // Sauvegarder sera fait automatiquement par le store
        console.log(
          `[UPDATE_EXCHANGE_RATES] Taux auto mis à jour pour ${currency}: ${rate}`
        );
        continue;
      }

      // Créer un nouveau taux
      addExchangeRate({
        baseCurrency: "XAF",
        quoteCurrency: currency as "CAD" | "USD" | "EUR",
        rate,
        source: "auto",
        effectiveDate: today,
      });

      console.log(
        `[UPDATE_EXCHANGE_RATES] Nouveau taux ajouté pour ${currency}: ${rate}`
      );
    }

    console.log("[UPDATE_EXCHANGE_RATES] Mise à jour terminée avec succès");
  } catch (error) {
    console.error("[UPDATE_EXCHANGE_RATES] Erreur lors de la mise à jour:", error);
    throw error;
  }
}

