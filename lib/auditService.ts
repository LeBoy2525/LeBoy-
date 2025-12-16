// lib/auditService.ts
// Service pour créer des logs d'audit

import { addAuditLog } from "./auditStore";
import type {
  AuditActionType,
  AuditSeverity,
  AuditLog,
} from "./auditTypes";
import type { UserRole } from "./types";

interface CreateAuditLogParams {
  userId: string | null;
  userRole: UserRole | "system";
  action: AuditActionType;
  severity?: AuditSeverity;
  resourceType: string;
  resourceId?: string | null;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  errorMessage?: string | null;
}

/**
 * Crée un log d'audit
 */
export function createAuditLog(params: CreateAuditLogParams): AuditLog {
  return addAuditLog({
    userId: params.userId,
    userRole: params.userRole,
    action: params.action,
    severity: params.severity || "INFO",
    resourceType: params.resourceType,
    resourceId: params.resourceId || null,
    description: params.description,
    metadata: params.metadata || {},
    ipAddress: params.ipAddress || null,
    userAgent: params.userAgent || null,
    success: params.success ?? true,
    errorMessage: params.errorMessage || null,
  });
}

/**
 * Helper pour logger une action financière
 */
export function logFinancialAction(
  userId: string | null,
  userRole: UserRole,
  action: AuditActionType,
  resourceType: string,
  resourceId: string | null,
  description: string,
  metadata?: Record<string, any>,
  success: boolean = true,
  errorMessage?: string | null
): AuditLog {
  return createAuditLog({
    userId,
    userRole,
    action,
    severity: success ? "INFO" : "ERROR",
    resourceType,
    resourceId,
    description,
    metadata,
    success,
    errorMessage,
  });
}

/**
 * Helper pour logger une action admin
 */
export function logAdminAction(
  userId: string,
  action: AuditActionType,
  resourceType: string,
  resourceId: string | null,
  description: string,
  metadata?: Record<string, any>
): AuditLog {
  return createAuditLog({
    userId,
    userRole: "admin",
    action: "ADMIN_ACTION",
    severity: "INFO",
    resourceType,
    resourceId,
    description,
    metadata: {
      ...metadata,
      originalAction: action,
    },
  });
}

/**
 * Helper pour logger une alerte de sécurité
 */
export function logSecurityAlert(
  userId: string | null,
  userRole: UserRole | "system",
  description: string,
  metadata?: Record<string, any>,
  severity: AuditSeverity = "WARNING"
): AuditLog {
  return createAuditLog({
    userId,
    userRole,
    action: "SECURITY_ALERT",
    severity,
    resourceType: "security",
    resourceId: null,
    description,
    metadata,
  });
}

