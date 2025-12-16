// lib/exchangeRateService.ts
// Service pour récupérer les taux de change depuis des APIs publiques

/**
 * Récupère le taux de change depuis exchangerate-api.com
 */
export async function fetchExchangeRateFromAPI1(
  baseCurrency: string,
  targetCurrency: string
): Promise<number | null> {
  try {
    // Note: Cette API nécessite une clé API gratuite
    // Pour l'instant, on utilise une API sans clé
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );
    const data = await response.json();
    return data.rates?.[targetCurrency] || null;
  } catch (error) {
    console.error("Erreur lors de la récupération du taux depuis API1:", error);
    return null;
  }
}

/**
 * Récupère le taux de change depuis exchangerate.host
 */
export async function fetchExchangeRateFromAPI2(
  baseCurrency: string,
  targetCurrency: string
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.exchangerate.host/latest?base=${baseCurrency}&symbols=${targetCurrency}`
    );
    const data = await response.json();
    return data.rates?.[targetCurrency] || null;
  } catch (error) {
    console.error("Erreur lors de la récupération du taux depuis API2:", error);
    return null;
  }
}

/**
 * Récupère les derniers taux de change pour CAD, USD, EUR vs XAF
 * Essaie plusieurs sources et retourne le premier résultat valide
 */
export async function fetchLatestExchangeRates(): Promise<{
  CAD?: number;
  USD?: number;
  EUR?: number;
}> {
  const rates: { CAD?: number; USD?: number; EUR?: number } = {};

  // Pour XAF, on doit inverser la logique car la plupart des APIs ne supportent pas XAF directement
  // On récupère USD/XAF, CAD/XAF, EUR/XAF depuis des sources spécialisées ou on calcule via USD

  // Essayer de récupérer via USD comme base
  try {
    // Note: En production, utiliser une API spécialisée pour XAF
    // Pour l'instant, valeurs par défaut approximatives
    // 1 USD ≈ 600 XAF, 1 CAD ≈ 450 XAF, 1 EUR ≈ 650 XAF
    
    // Essayer API1
    const usdToXaf = await fetchExchangeRateFromAPI1("USD", "XAF");
    if (usdToXaf) {
      rates.USD = usdToXaf;
      // Estimer CAD et EUR depuis USD
      const cadToUsd = await fetchExchangeRateFromAPI1("CAD", "USD");
      const eurToUsd = await fetchExchangeRateFromAPI1("EUR", "USD");
      if (cadToUsd) rates.CAD = usdToXaf / cadToUsd;
      if (eurToUsd) rates.EUR = usdToXaf / eurToUsd;
      return rates;
    }

    // Essayer API2
    const usdToXaf2 = await fetchExchangeRateFromAPI2("USD", "XAF");
    if (usdToXaf2) {
      rates.USD = usdToXaf2;
      const cadToUsd2 = await fetchExchangeRateFromAPI2("CAD", "USD");
      const eurToUsd2 = await fetchExchangeRateFromAPI2("EUR", "USD");
      if (cadToUsd2) rates.CAD = usdToXaf2 / cadToUsd2;
      if (eurToUsd2) rates.EUR = usdToXaf2 / eurToUsd2;
      return rates;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des taux:", error);
  }

  // Si aucune API ne fonctionne, retourner des valeurs par défaut (à utiliser avec précaution)
  console.warn("Utilisation de taux de change par défaut (non mis à jour)");
  return {
    CAD: 450, // 1 CAD = 450 XAF (approximatif)
    USD: 600, // 1 USD = 600 XAF (approximatif)
    EUR: 650, // 1 EUR = 650 XAF (approximatif)
  };
}

