/**
 * Helper pour retry des opérations Prisma en cas d'erreur réseau
 * Utile pour les environnements serverless où les connexions peuvent être instables
 */

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { logPrismaError } from "./prisma-error-logger";

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 1,
  retryDelay: 500,
  retryableErrors: [
    "fetch failed",
    "UND_ERR_SOCKET",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ECONNREFUSED",
  ],
};

/**
 * Vérifie si une erreur est retryable (erreur réseau)
 */
function isRetryableError(error: any): boolean {
  const errorMessage = error?.message || String(error || "");
  const errorCode = error?.code || "";
  
  return DEFAULT_OPTIONS.retryableErrors.some(
    (retryableError) =>
      errorMessage.includes(retryableError) ||
      errorCode.includes(retryableError)
  );
}

/**
 * Retry une opération Prisma avec gestion des erreurs réseau
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Si c'est une erreur Prisma (P2022, P2002, etc.), logger avec détails complets
      if (error instanceof PrismaClientKnownRequestError) {
        logPrismaError("db-retry", error, {
          attempt: attempt + 1,
          maxRetries: opts.maxRetries + 1,
        });
      }

      // Si ce n'est pas une erreur retryable, on arrête immédiatement
      if (!isRetryableError(error)) {
        throw error;
      }

      // Si on a atteint le max de retries, on arrête
      if (attempt >= opts.maxRetries) {
        console.error(
          `[db-retry] ❌ Échec après ${attempt + 1} tentative(s):`,
          error?.message || error
        );
        throw error;
      }

      // Attendre avant de retry
      console.warn(
        `[db-retry] ⚠️ Erreur réseau (tentative ${attempt + 1}/${opts.maxRetries + 1}):`,
        error?.message || error
      );
      await new Promise((resolve) => setTimeout(resolve, opts.retryDelay));
    }
  }

  throw lastError;
}

