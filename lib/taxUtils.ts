// lib/taxUtils.ts
// Utilitaires pour le calcul des taxes selon la matrice Tax Decision

import type {
  TaxDecision,
  ServiceCategoryCode,
  Currency,
} from "./financeTypes";
import { getServiceCategoryByCode } from "./financeStores";
import { roundByCurrency } from "./fxUtils";

/**
 * Calcule la décision fiscale selon la matrice
 */
export function computeTaxDecision(
  billingCountry: string,
  billingRegion: string | null,
  serviceCategoryCode: ServiceCategoryCode
): TaxDecision {
  // Règle 1: CA/QC
  if (billingCountry === "CA" && billingRegion === "QC") {
    return "TAXABLE_CA_QC";
  }

  // Règle 2: CA mais pas QC
  if (billingCountry === "CA" && billingRegion !== "QC") {
    return "TAXABLE_CA_ROC";
  }

  // Règle 3: Hors Canada
  if (billingCountry !== "CA") {
    const category = getServiceCategoryByCode(serviceCategoryCode);
    if (category?.isRealPropertyRelated) {
      return "REVIEW_REQUIRED";
    }
    return "ZERO_RATED_EXPORT";
  }

  // Par défaut
  return "ZERO_RATED_EXPORT";
}

/**
 * Calcule les montants de taxes selon la décision fiscale
 */
export function computeTaxAmounts(
  subtotalClient: number,
  taxDecision: TaxDecision,
  clientCurrency: Currency
): {
  gstRate: number;
  qstRate: number;
  gstAmount: number;
  qstAmount: number;
} {
  let gstRate = 0;
  let qstRate = 0;

  if (taxDecision === "TAXABLE_CA_QC") {
    gstRate = 0.05; // TPS
    qstRate = 0.09975; // TVQ
  } else if (taxDecision === "TAXABLE_CA_ROC") {
    gstRate = 0.05; // TPS seulement
    qstRate = 0;
  } else {
    // ZERO_RATED_EXPORT ou REVIEW_REQUIRED
    gstRate = 0;
    qstRate = 0;
  }

  const gstAmount = roundByCurrency(subtotalClient * gstRate, clientCurrency);
  const qstAmount = roundByCurrency(subtotalClient * qstRate, clientCurrency);

  return {
    gstRate,
    qstRate,
    gstAmount,
    qstAmount,
  };
}

/**
 * Calcule les totaux complets d'un devis
 */
export function computeQuoteTotals(
  amountXaf: number,
  clientCurrency: Currency,
  fxRate: number,
  transferFeeClient: number,
  billingCountry: string,
  billingRegion: string | null,
  serviceCategoryCode: ServiceCategoryCode
): {
  amountClientBeforeTax: number;
  subtotalClient: number;
  taxDecision: TaxDecision;
  gstRate: number;
  qstRate: number;
  gstAmount: number;
  qstAmount: number;
  totalClient: number;
} {
  // Conversion XAF -> devise client
  const amountClientBeforeTax = roundByCurrency(
    amountXaf / fxRate,
    clientCurrency
  );

  // Sous-total (montant + frais de transfert)
  const subtotalClient = roundByCurrency(
    amountClientBeforeTax + transferFeeClient,
    clientCurrency
  );

  // Décision fiscale
  const taxDecision = computeTaxDecision(
    billingCountry,
    billingRegion,
    serviceCategoryCode
  );

  // Calcul des taxes
  const { gstRate, qstRate, gstAmount, qstAmount } = computeTaxAmounts(
    subtotalClient,
    taxDecision,
    clientCurrency
  );

  // Total final
  const totalClient = roundByCurrency(
    subtotalClient + gstAmount + qstAmount,
    clientCurrency
  );

  return {
    amountClientBeforeTax,
    subtotalClient,
    taxDecision,
    gstRate,
    qstRate,
    gstAmount,
    qstAmount,
    totalClient,
  };
}

/**
 * Vérifie si une révision fiscale est requise
 */
export function requiresTaxReview(taxDecision: TaxDecision): boolean {
  return taxDecision === "REVIEW_REQUIRED";
}

/**
 * Obtient le label de la décision fiscale
 */
export function getTaxDecisionLabel(
  taxDecision: TaxDecision,
  lang: "fr" | "en" = "fr"
): string {
  const labels: Record<TaxDecision, { fr: string; en: string }> = {
    TAXABLE_CA_QC: {
      fr: "Taxable (CA/QC) - TPS + TVQ",
      en: "Taxable (CA/QC) - GST + QST",
    },
    TAXABLE_CA_ROC: {
      fr: "Taxable (CA hors QC) - TPS uniquement",
      en: "Taxable (CA non-QC) - GST only",
    },
    ZERO_RATED_EXPORT: {
      fr: "Export exonéré (0%)",
      en: "Zero-rated export (0%)",
    },
    REVIEW_REQUIRED: {
      fr: "Révision fiscale requise",
      en: "Tax review required",
    },
  };

  return labels[taxDecision][lang];
}

