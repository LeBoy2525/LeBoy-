// lib/financeValidation.ts
// Schémas de validation Zod pour le système financier

import { z } from "zod";

// Schéma pour Currency
export const CurrencySchema = z.enum(["XAF", "CAD", "USD", "EUR"]);

// Schéma pour ExchangeRate
export const ExchangeRateSchema = z.object({
  baseCurrency: z.literal("XAF"),
  quoteCurrency: CurrencySchema,
  rate: z.number().positive().max(1000000), // Limite raisonnable
  source: z.enum(["auto", "manual"]),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Format ISO date
});

// Schéma pour BillingAddress
export const BillingAddressSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(255),
  phone: z.string().max(50).nullable().optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).nullable().optional(),
  city: z.string().min(1).max(100),
  region: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  country: z.string().length(2), // ISO2 code
});

// Schéma pour Quote
export const QuoteCreateSchema = z.object({
  requestId: z.number().int().positive().nullable().optional(),
  providerId: z.number().int().positive().nullable().optional(),
  serviceCategoryCode: z.enum([
    "ADMIN_DOCS",
    "DELIVERY_PURCHASES",
    "CONSULTING_ONSITE",
    "REAL_ESTATE_LAND",
    "CONSTRUCTION_SITE",
  ]),
  amountXaf: z.number().positive().max(1000000000), // 1 milliard max
  clientCurrency: CurrencySchema,
  transferFeeClient: z.number().min(0).max(1000000).default(0),
});

// Schéma pour Payment
export const PaymentCreateSchema = z.object({
  quoteId: z.string().uuid(),
  billingAddressId: z.string().uuid(),
  stripePaymentIntentId: z.string().min(1).max(255),
  amountPaid: z.number().positive().max(1000000000),
  currency: CurrencySchema,
  paymentMethod: z.enum(["card", "bank_transfer", "other"]),
});

// Schéma pour Payout
export const PayoutCreateSchema = z.object({
  quoteId: z.string().uuid(),
  providerId: z.number().int().positive(),
  amountXaf: z.number().positive().max(1000000000),
  method: z.enum(["MANUAL", "PARTNER_TRANSFER"]),
  partnerName: z.string().max(200).nullable().optional(),
  partnerReference: z.string().max(200).nullable().optional(),
  feeXaf: z.number().min(0).max(1000000).default(0),
  status: z.enum(["PENDING", "SENT", "CONFIRMED", "FAILED"]).default("PENDING"),
});

// Schéma pour ExchangeRateUpdate (manuel)
export const ExchangeRateManualUpdateSchema = z.object({
  quoteCurrency: CurrencySchema,
  rate: z.number().positive().max(1000000),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Schéma pour FinanceExport
export const FinanceExportCreateSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Schéma pour AdminSettings
export const AdminSettingsUpdateSchema = z.object({
  accountantEmail: z.string().email().max(255),
  timezone: z.string().max(100),
  defaultClientCurrencyByCountry: z.record(z.string(), CurrencySchema).optional(),
  transferFeePolicy: z.enum(["CLIENT_PAYS", "INCLUDED"]).optional(),
  companyLegalName: z.string().min(1).max(200),
  companyAddressLine1: z.string().min(1).max(200),
  companyAddressLine2: z.string().max(200).nullable().optional(),
  companyCity: z.string().min(1).max(100),
  companyRegion: z.string().min(1).max(100),
  companyPostalCode: z.string().min(1).max(20),
  companyCountry: z.string().length(2),
  gstNumber: z.string().max(50).optional(),
  qstNumber: z.string().max(50).optional(),
});

// Schéma pour calcul de taxes
export const CalculateTaxesSchema = z.object({
  amountXaf: z.number().positive().max(1000000000),
  clientCurrency: CurrencySchema,
  billingCountry: z.string().length(2),
  billingRegion: z.string().max(100).nullable().optional(),
  serviceCategoryCode: z.enum([
    "ADMIN_DOCS",
    "DELIVERY_PURCHASES",
    "CONSULTING_ONSITE",
    "REAL_ESTATE_LAND",
    "CONSTRUCTION_SITE",
  ]),
  transferFeeClient: z.number().min(0).max(1000000).default(0),
});

// Schéma pour les query params de recherche de transactions
export const TransactionsQuerySchema = z.object({
  status: z.enum(["PAID", "FAILED", "REQUIRES_PAYMENT", "REFUNDED"]).optional(),
  currency: CurrencySchema.optional(),
  taxDecision: z.enum([
    "TAXABLE_CA_QC",
    "TAXABLE_CA_ROC",
    "ZERO_RATED_EXPORT",
    "REVIEW_REQUIRED",
  ]).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// Schéma pour les query params de recherche de logs d'audit
export const AuditLogsQuerySchema = z.object({
  userId: z.string().email().optional(),
  action: z.string().optional(),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

// Helper pour valider une requête
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((e) => {
        const path = e.path.join(".");
        return `${path}: ${e.message}`;
      });
      return {
        success: false,
        error: `Validation échouée: ${errorMessages.join(", ")}`,
        details: error,
      };
    }
    return {
      success: false,
      error: "Erreur de validation inconnue",
    };
  }
}

// Helper pour valider les paramètres de route
export function validateRouteParams<T>(
  schema: z.ZodSchema<T>,
  params: unknown
): { success: true; data: T } | { success: false; error: string } {
  return validateRequest(schema, params);
}

// Helper pour valider le body d'une requête
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string; details?: z.ZodError } {
  return validateRequest(schema, body);
}

