// lib/financeTypes.ts
// Types pour le système de finance/comptabilité LeBoy

export type Currency = "XAF" | "CAD" | "USD" | "EUR";

export type ExchangeRateSource = "auto" | "manual";

export interface ExchangeRate {
  id: string; // uuid
  baseCurrency: "XAF";
  quoteCurrency: Currency;
  rate: number; // 1 QUOTE = rate XAF (ex: 1 CAD = 450 XAF)
  source: ExchangeRateSource;
  effectiveDate: string; // ISO date (timezone America/Toronto)
  createdAt: string;
  updatedAt: string;
}

export interface TaxProfile {
  id: string;
  country: string; // "CA"
  region: string | null; // "QC"
  gstRate: number; // default 0.05
  qstRate: number; // default 0.09975
  createdAt: string;
  updatedAt: string;
}

export interface AdminSettings {
  id: string;
  accountantEmail: string;
  timezone: string; // default "America/Toronto"
  defaultClientCurrencyByCountry: Record<string, Currency>; // ex: CA->CAD, US->USD, FR->EUR, default->USD
  transferFeePolicy: "CLIENT_PAYS" | "INCLUDED";
  companyLegalName: string;
  companyAddressLine1: string;
  companyAddressLine2: string | null;
  companyCity: string;
  companyRegion: string; // QC
  companyPostalCode: string;
  companyCountry: string; // CA
  gstNumber: string; // TPS
  qstNumber: string; // TVQ
  createdAt: string;
  updatedAt: string;
}

export interface BillingAddress {
  id: string;
  userId: number | null; // si client connecté
  fullName: string;
  email: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null; // province/state (QC, ON, etc.)
  postalCode: string | null;
  country: string; // ISO2 ex: CA, US, FR
  createdAt: string;
  updatedAt: string;
}

export type ServiceCategoryCode =
  | "ADMIN_DOCS"
  | "DELIVERY_PURCHASES"
  | "CONSULTING_ONSITE"
  | "REAL_ESTATE_LAND"
  | "CONSTRUCTION_SITE";

export interface ServiceCategory {
  id: string;
  code: ServiceCategoryCode;
  label: string;
  isRealPropertyRelated: boolean; // default false
  createdAt: string;
  updatedAt: string;
}

export type TaxDecision =
  | "TAXABLE_CA_QC"
  | "TAXABLE_CA_ROC"
  | "ZERO_RATED_EXPORT"
  | "REVIEW_REQUIRED";

export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED";

export interface Quote {
  id: string;
  requestId: number | null;
  providerId: number | null; // prestataire (nullable au moment du devis)
  serviceCategoryCode: ServiceCategoryCode;
  amountXaf: number; // montant prestataire en XAF
  clientCurrency: Currency;
  fxRateUsed: number; // 1 clientCurrency = fxRateUsed XAF
  fxEffectiveDate: string; // ISO date
  amountClientBeforeTax: number; // montant converti dans devise client
  transferFeeClient: number; // default 0
  subtotalClient: number;
  taxDecision: TaxDecision;
  gstRate: number; // default 0
  qstRate: number; // default 0
  gstAmount: number; // default 0
  qstAmount: number; // default 0
  totalClient: number;
  billingAddressId: string | null; // rempli avant paiement
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus =
  | "REQUIRES_PAYMENT"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "DISPUTED";

export interface Payment {
  id: string;
  quoteId: string;
  billingAddressId: string;
  stripePaymentIntentId: string;
  stripeCheckoutSessionId: string | null;
  amountClient: number; // totalClient
  currency: Currency;
  status: PaymentStatus;
  paidAt: string | null;
  providerFee: number | null;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus =
  | "ISSUED"
  | "PAID"
  | "VOID"
  | "REFUND_CREDIT";

export interface Invoice {
  id: string;
  invoiceNumber: string; // LB-YYYY-000001 (unique)
  quoteId: string;
  paymentId: string | null;
  billingAddressId: string;
  currency: Currency;
  amountBeforeTax: number;
  transferFee: number;
  taxDecision: TaxDecision;
  gstRate: number;
  gstAmount: number;
  qstRate: number;
  qstAmount: number;
  total: number;
  amountXafReference: number;
  fxRateUsed: number;
  fxEffectiveDate: string;
  pdfStorageKey: string;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PayoutMethod = "MANUAL" | "PARTNER_TRANSFER";

export type PayoutStatus = "PENDING" | "SENT" | "CONFIRMED" | "FAILED";

export interface Payout {
  id: string;
  quoteId: string;
  providerId: number;
  amountXaf: number;
  method: PayoutMethod;
  partnerName: string | null;
  partnerReference: string | null;
  feeXaf: number; // default 0
  status: PayoutStatus;
  createdAt: string;
  updatedAt: string;
}

export type FinanceExportStatus = "GENERATED" | "SENT" | "FAILED";

export interface FinanceExport {
  id: string;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  csvStorageKey: string;
  zipStorageKey: string;
  sentToEmail: string;
  status: FinanceExportStatus;
  createdAt: string;
  updatedAt: string;
}

