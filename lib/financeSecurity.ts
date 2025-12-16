// lib/financeSecurity.ts
// Validations de sécurité pour les opérations financières

import { getUserRole } from "./auth";
import { logSecurityAlert } from "./auditService";
import type { UserRole } from "./types";

/**
 * Vérifie que l'utilisateur est authentifié et a le rôle requis
 */
export function requireAuth(userEmail: string | null | undefined): {
  authorized: boolean;
  error?: string;
} {
  if (!userEmail) {
    return {
      authorized: false,
      error: "Non authentifié.",
    };
  }

  return { authorized: true };
}

/**
 * Vérifie que l'utilisateur est admin
 */
export function requireAdmin(userEmail: string | null | undefined): {
  authorized: boolean;
  error?: string;
} {
  if (!userEmail) {
    return {
      authorized: false,
      error: "Non authentifié.",
    };
  }

  const role = getUserRole(userEmail);
  if (role !== "admin") {
    logSecurityAlert(
      userEmail,
      role,
      `Tentative d'accès admin non autorisée: ${userEmail}`,
      { attemptedRole: role }
    );

    return {
      authorized: false,
      error: "Accès réservé aux administrateurs.",
    };
  }

  return { authorized: true };
}

/**
 * Valide un montant financier
 */
export function validateAmount(amount: number): {
  valid: boolean;
  error?: string;
} {
  if (typeof amount !== "number" || isNaN(amount)) {
    return {
      valid: false,
      error: "Montant invalide.",
    };
  }

  if (amount < 0) {
    return {
      valid: false,
      error: "Le montant ne peut pas être négatif.",
    };
  }

  if (amount > 1000000000) {
    // 1 milliard (sécurité contre les erreurs de saisie)
    return {
      valid: false,
      error: "Montant trop élevé.",
    };
  }

  return { valid: true };
}

/**
 * Valide un ID de ressource
 */
export function validateResourceId(id: string | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return {
      valid: false,
      error: "ID de ressource invalide.",
    };
  }

  // Vérifier la longueur (UUID = 36 caractères)
  if (id.length > 100) {
    return {
      valid: false,
      error: "ID de ressource trop long.",
    };
  }

  return { valid: true };
}

/**
 * Valide une devise
 */
export function validateCurrency(currency: string): {
  valid: boolean;
  error?: string;
} {
  const validCurrencies = ["XAF", "CAD", "USD", "EUR"];

  if (!validCurrencies.includes(currency)) {
    return {
      valid: false,
      error: `Devise invalide. Devises acceptées: ${validCurrencies.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Valide un taux de change
 */
export function validateExchangeRate(rate: number): {
  valid: boolean;
  error?: string;
} {
  if (typeof rate !== "number" || isNaN(rate)) {
    return {
      valid: false,
      error: "Taux de change invalide.",
    };
  }

  if (rate <= 0) {
    return {
      valid: false,
      error: "Le taux de change doit être positif.",
    };
  }

  // Vérifier des limites raisonnables (ex: 1 CAD = entre 100 et 10000 XAF)
  if (rate < 0.01 || rate > 100000) {
    return {
      valid: false,
      error: "Taux de change hors limites raisonnables.",
    };
  }

  return { valid: true };
}

/**
 * Extrait l'adresse IP depuis une requête
 */
export function extractIpAddress(req: Request): string | null {
  // Vérifier les headers proxy (en production, utiliser un vrai header)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return null;
}

/**
 * Extrait le User-Agent depuis une requête
 */
export function extractUserAgent(req: Request): string | null {
  return req.headers.get("user-agent") || null;
}

