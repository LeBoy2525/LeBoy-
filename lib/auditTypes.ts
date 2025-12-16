// lib/auditTypes.ts
// Types pour le système d'audit

export type AuditActionType =
  | "QUOTE_CREATED"
  | "QUOTE_UPDATED"
  | "PAYMENT_CREATED"
  | "PAYMENT_COMPLETED"
  | "PAYMENT_FAILED"
  | "PAYMENT_REFUNDED"
  | "INVOICE_GENERATED"
  | "PAYOUT_CREATED"
  | "PAYOUT_UPDATED"
  | "EXCHANGE_RATE_UPDATED"
  | "EXCHANGE_RATE_MANUAL_OVERRIDE"
  | "ADMIN_SETTINGS_UPDATED"
  | "TAX_DECISION_REVIEWED"
  | "FINANCE_EXPORT_GENERATED"
  | "FINANCE_EXPORT_SENT"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "ADMIN_ACTION"
  | "SECURITY_ALERT";

export type AuditSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface AuditLog {
  id: string;
  timestamp: string; // ISO date
  userId: string | null; // Email de l'utilisateur
  userRole: "admin" | "prestataire" | "client" | "system";
  action: AuditActionType;
  severity: AuditSeverity;
  resourceType: string; // "quote", "payment", "invoice", etc.
  resourceId: string | null; // ID de la ressource concernée
  description: string;
  metadata: Record<string, any>; // Données supplémentaires
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
}

