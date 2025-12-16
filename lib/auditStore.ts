// lib/auditStore.ts
// Store pour les logs d'audit

import { loadFromFile, saveToFileAsync } from "./persistence";
import { v4 as uuidv4 } from "uuid";
import type { AuditLog, AuditActionType, AuditSeverity } from "./auditTypes";

type AuditStore = {
  _auditLogs?: AuditLog[];
  _auditLogsLoaded?: boolean;
};

const auditStore = globalThis as typeof globalThis & AuditStore;

if (!auditStore._auditLogs) {
  auditStore._auditLogs = [];
  auditStore._auditLogsLoaded = false;

  loadFromFile<AuditLog>("auditLogs.json")
    .then((data) => {
      if (data.length > 0) {
        auditStore._auditLogs = data;
      }
      auditStore._auditLogsLoaded = true;
    })
    .catch((error) => {
      console.error("Erreur lors du chargement des logs d'audit:", error);
      auditStore._auditLogsLoaded = true;
    });
}

export const auditLogsStore = auditStore._auditLogs!;

function saveAuditLogs() {
  saveToFileAsync("auditLogs.json", auditLogsStore);
}

/**
 * Ajoute un log d'audit
 */
export function addAuditLog(
  log: Omit<
    AuditLog,
    "id" | "timestamp" | "success" | "errorMessage"
  > & {
    success?: boolean;
    errorMessage?: string | null;
  }
): AuditLog {
  const newLog: AuditLog = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    success: log.success ?? true,
    errorMessage: log.errorMessage || null,
    ...log,
  };

  auditLogsStore.push(newLog);

  // Limiter à 10 000 logs (garder les plus récents)
  if (auditLogsStore.length > 10000) {
    auditLogsStore.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    auditLogsStore.splice(10000);
  }

  saveAuditLogs();
  return newLog;
}

/**
 * Récupère les logs d'audit avec filtres
 */
export function getAuditLogs(filters?: {
  userId?: string;
  action?: AuditActionType;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): AuditLog[] {
  let logs = [...auditLogsStore];

  if (filters?.userId) {
    logs = logs.filter((l) => l.userId === filters.userId);
  }

  if (filters?.action) {
    logs = logs.filter((l) => l.action === filters.action);
  }

  if (filters?.severity) {
    logs = logs.filter((l) => l.severity === filters.severity);
  }

  if (filters?.resourceType) {
    logs = logs.filter((l) => l.resourceType === filters.resourceType);
  }

  if (filters?.resourceId) {
    logs = logs.filter((l) => l.resourceId === filters.resourceId);
  }

  if (filters?.startDate) {
    logs = logs.filter(
      (l) => new Date(l.timestamp) >= new Date(filters.startDate!)
    );
  }

  if (filters?.endDate) {
    logs = logs.filter(
      (l) => new Date(l.timestamp) <= new Date(filters.endDate!)
    );
  }

  // Trier par date décroissante
  logs.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Limiter les résultats
  if (filters?.limit) {
    logs = logs.slice(0, filters.limit);
  }

  return logs;
}

/**
 * Récupère un log d'audit par ID
 */
export function getAuditLogById(id: string): AuditLog | undefined {
  return auditLogsStore.find((l) => l.id === id);
}

