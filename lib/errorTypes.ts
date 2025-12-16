// lib/errorTypes.ts
// Types et codes d'erreur standardisés pour le système financier

/**
 * Codes d'erreur standardisés
 */
export enum ErrorCode {
  // Erreurs d'authentification (1000-1099)
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",

  // Erreurs de validation (1100-1199)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  INVALID_CURRENCY = "INVALID_CURRENCY",
  INVALID_DATE = "INVALID_DATE",
  INVALID_EMAIL = "INVALID_EMAIL",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Erreurs de ressources (1200-1299)
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",

  // Erreurs financières (1300-1399)
  EXCHANGE_RATE_NOT_FOUND = "EXCHANGE_RATE_NOT_FOUND",
  EXCHANGE_RATE_INVALID = "EXCHANGE_RATE_INVALID",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_ALREADY_PROCESSED = "PAYMENT_ALREADY_PROCESSED",
  INVALID_PAYMENT_METHOD = "INVALID_PAYMENT_METHOD",
  QUOTE_EXPIRED = "QUOTE_EXPIRED",
  QUOTE_ALREADY_ACCEPTED = "QUOTE_ALREADY_ACCEPTED",

  // Erreurs Stripe (1400-1499)
  STRIPE_ERROR = "STRIPE_ERROR",
  STRIPE_WEBHOOK_ERROR = "STRIPE_WEBHOOK_ERROR",
  STRIPE_CHECKOUT_FAILED = "STRIPE_CHECKOUT_FAILED",

  // Erreurs de système (1500-1599)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  FILE_STORAGE_ERROR = "FILE_STORAGE_ERROR",
  EMAIL_SEND_ERROR = "EMAIL_SEND_ERROR",
  PDF_GENERATION_ERROR = "PDF_GENERATION_ERROR",

  // Erreurs de configuration (1600-1699)
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  ADMIN_SETTINGS_NOT_FOUND = "ADMIN_SETTINGS_NOT_FOUND",
  ACCOUNTANT_EMAIL_NOT_CONFIGURED = "ACCOUNTANT_EMAIL_NOT_CONFIGURED",

  // Erreurs de rate limiting (1700-1799)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
}

/**
 * Niveaux de sévérité des erreurs
 */
export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

/**
 * Structure standardisée d'une erreur API
 */
export interface ApiError {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  details?: Record<string, any>;
  field?: string; // Pour les erreurs de validation de champ spécifique
  timestamp: string;
  requestId?: string; // ID unique de la requête pour le tracking
}

/**
 * Réponse d'erreur standardisée
 */
export interface ErrorResponse {
  error: ApiError;
  success: false;
}

/**
 * Classe d'erreur personnalisée
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly details?: Record<string, any>;
  public readonly field?: string;
  public readonly statusCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    details?: Record<string, any>,
    field?: string
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.severity = severity;
    this.details = details;
    this.field = field;

    // Déterminer le status code HTTP selon le code d'erreur
    this.statusCode = getStatusCodeForError(code);
  }

  /**
   * Convertit l'erreur en format ApiError
   */
  toApiError(requestId?: string): ApiError {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      details: this.details,
      field: this.field,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
}

/**
 * Détermine le status code HTTP selon le code d'erreur
 */
function getStatusCodeForError(code: ErrorCode): number {
  if (code >= ErrorCode.UNAUTHORIZED && code <= ErrorCode.SESSION_EXPIRED) {
    return 401;
  }
  if (code === ErrorCode.FORBIDDEN) {
    return 403;
  }
  if (code >= ErrorCode.VALIDATION_ERROR && code <= ErrorCode.MISSING_REQUIRED_FIELD) {
    return 400;
  }
  if (code >= ErrorCode.RESOURCE_NOT_FOUND && code <= ErrorCode.RESOURCE_CONFLICT) {
    if (code === ErrorCode.RESOURCE_NOT_FOUND) {
      return 404;
    }
    if (code === ErrorCode.RESOURCE_ALREADY_EXISTS) {
      return 409;
    }
    return 409;
  }
  if (code >= ErrorCode.RATE_LIMIT_EXCEEDED && code <= ErrorCode.TOO_MANY_REQUESTS) {
    return 429;
  }
  // Par défaut, erreur serveur
  return 500;
}

/**
 * Messages d'erreur traduits
 */
export const ErrorMessages = {
  fr: {
    [ErrorCode.UNAUTHORIZED]: "Non authentifié",
    [ErrorCode.FORBIDDEN]: "Accès refusé",
    [ErrorCode.INVALID_CREDENTIALS]: "Identifiants invalides",
    [ErrorCode.SESSION_EXPIRED]: "Session expirée",
    [ErrorCode.VALIDATION_ERROR]: "Erreur de validation",
    [ErrorCode.INVALID_AMOUNT]: "Montant invalide",
    [ErrorCode.INVALID_CURRENCY]: "Devise invalide",
    [ErrorCode.INVALID_DATE]: "Date invalide",
    [ErrorCode.INVALID_EMAIL]: "Email invalide",
    [ErrorCode.MISSING_REQUIRED_FIELD]: "Champ obligatoire manquant",
    [ErrorCode.RESOURCE_NOT_FOUND]: "Ressource non trouvée",
    [ErrorCode.RESOURCE_ALREADY_EXISTS]: "Ressource déjà existante",
    [ErrorCode.RESOURCE_CONFLICT]: "Conflit de ressource",
    [ErrorCode.EXCHANGE_RATE_NOT_FOUND]: "Taux de change non trouvé",
    [ErrorCode.EXCHANGE_RATE_INVALID]: "Taux de change invalide",
    [ErrorCode.INSUFFICIENT_FUNDS]: "Fonds insuffisants",
    [ErrorCode.PAYMENT_FAILED]: "Paiement échoué",
    [ErrorCode.PAYMENT_ALREADY_PROCESSED]: "Paiement déjà traité",
    [ErrorCode.INVALID_PAYMENT_METHOD]: "Méthode de paiement invalide",
    [ErrorCode.QUOTE_EXPIRED]: "Devis expiré",
    [ErrorCode.QUOTE_ALREADY_ACCEPTED]: "Devis déjà accepté",
    [ErrorCode.STRIPE_ERROR]: "Erreur Stripe",
    [ErrorCode.STRIPE_WEBHOOK_ERROR]: "Erreur webhook Stripe",
    [ErrorCode.STRIPE_CHECKOUT_FAILED]: "Échec du checkout Stripe",
    [ErrorCode.INTERNAL_ERROR]: "Erreur interne",
    [ErrorCode.DATABASE_ERROR]: "Erreur de base de données",
    [ErrorCode.FILE_STORAGE_ERROR]: "Erreur de stockage de fichier",
    [ErrorCode.EMAIL_SEND_ERROR]: "Erreur d'envoi d'email",
    [ErrorCode.PDF_GENERATION_ERROR]: "Erreur de génération PDF",
    [ErrorCode.CONFIGURATION_ERROR]: "Erreur de configuration",
    [ErrorCode.ADMIN_SETTINGS_NOT_FOUND]: "Paramètres admin non trouvés",
    [ErrorCode.ACCOUNTANT_EMAIL_NOT_CONFIGURED]: "Email du cabinet comptable non configuré",
    [ErrorCode.RATE_LIMIT_EXCEEDED]: "Limite de requêtes dépassée",
    [ErrorCode.TOO_MANY_REQUESTS]: "Trop de requêtes",
  },
  en: {
    [ErrorCode.UNAUTHORIZED]: "Unauthorized",
    [ErrorCode.FORBIDDEN]: "Forbidden",
    [ErrorCode.INVALID_CREDENTIALS]: "Invalid credentials",
    [ErrorCode.SESSION_EXPIRED]: "Session expired",
    [ErrorCode.VALIDATION_ERROR]: "Validation error",
    [ErrorCode.INVALID_AMOUNT]: "Invalid amount",
    [ErrorCode.INVALID_CURRENCY]: "Invalid currency",
    [ErrorCode.INVALID_DATE]: "Invalid date",
    [ErrorCode.INVALID_EMAIL]: "Invalid email",
    [ErrorCode.MISSING_REQUIRED_FIELD]: "Missing required field",
    [ErrorCode.RESOURCE_NOT_FOUND]: "Resource not found",
    [ErrorCode.RESOURCE_ALREADY_EXISTS]: "Resource already exists",
    [ErrorCode.RESOURCE_CONFLICT]: "Resource conflict",
    [ErrorCode.EXCHANGE_RATE_NOT_FOUND]: "Exchange rate not found",
    [ErrorCode.EXCHANGE_RATE_INVALID]: "Invalid exchange rate",
    [ErrorCode.INSUFFICIENT_FUNDS]: "Insufficient funds",
    [ErrorCode.PAYMENT_FAILED]: "Payment failed",
    [ErrorCode.PAYMENT_ALREADY_PROCESSED]: "Payment already processed",
    [ErrorCode.INVALID_PAYMENT_METHOD]: "Invalid payment method",
    [ErrorCode.QUOTE_EXPIRED]: "Quote expired",
    [ErrorCode.QUOTE_ALREADY_ACCEPTED]: "Quote already accepted",
    [ErrorCode.STRIPE_ERROR]: "Stripe error",
    [ErrorCode.STRIPE_WEBHOOK_ERROR]: "Stripe webhook error",
    [ErrorCode.STRIPE_CHECKOUT_FAILED]: "Stripe checkout failed",
    [ErrorCode.INTERNAL_ERROR]: "Internal error",
    [ErrorCode.DATABASE_ERROR]: "Database error",
    [ErrorCode.FILE_STORAGE_ERROR]: "File storage error",
    [ErrorCode.EMAIL_SEND_ERROR]: "Email send error",
    [ErrorCode.PDF_GENERATION_ERROR]: "PDF generation error",
    [ErrorCode.CONFIGURATION_ERROR]: "Configuration error",
    [ErrorCode.ADMIN_SETTINGS_NOT_FOUND]: "Admin settings not found",
    [ErrorCode.ACCOUNTANT_EMAIL_NOT_CONFIGURED]: "Accountant email not configured",
    [ErrorCode.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded",
    [ErrorCode.TOO_MANY_REQUESTS]: "Too many requests",
  },
} as const;

