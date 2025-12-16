// lib/errorHandler.ts
// Helpers pour gérer et formater les erreurs

import { NextResponse } from "next/server";
import {
  AppError,
  ErrorCode,
  ErrorSeverity,
  ErrorMessages,
  type ApiError,
  type ErrorResponse,
} from "./errorTypes";
import { v4 as uuidv4 } from "uuid";

/**
 * Génère un ID unique pour chaque requête
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${uuidv4().substring(0, 8)}`;
}

/**
 * Crée une réponse d'erreur standardisée
 */
export function createErrorResponse(
  error: AppError | Error,
  requestId?: string,
  lang: "fr" | "en" = "fr"
): NextResponse<ErrorResponse> {
  let apiError: ApiError;

  if (error instanceof AppError) {
    apiError = error.toApiError(requestId);
  } else {
    // Erreur générique
    apiError = {
      code: ErrorCode.INTERNAL_ERROR,
      message: ErrorMessages[lang][ErrorCode.INTERNAL_ERROR],
      severity: ErrorSeverity.HIGH,
      details: {
        originalError: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  return NextResponse.json(
    {
      error: apiError,
      success: false,
    },
    { status: error instanceof AppError ? error.statusCode : 500 }
  );
}

/**
 * Crée une erreur de validation
 */
export function createValidationError(
  message: string,
  field?: string,
  details?: Record<string, any>
): AppError {
  return new AppError(
    ErrorCode.VALIDATION_ERROR,
    message,
    ErrorSeverity.LOW,
    details,
    field
  );
}

/**
 * Crée une erreur de ressource non trouvée
 */
export function createNotFoundError(
  resourceType: string,
  resourceId?: string
): AppError {
  return new AppError(
    ErrorCode.RESOURCE_NOT_FOUND,
    `${resourceType} non trouvé${resourceId ? `: ${resourceId}` : ""}`,
    ErrorSeverity.MEDIUM,
    { resourceType, resourceId }
  );
}

/**
 * Crée une erreur d'authentification
 */
export function createUnauthorizedError(message?: string): AppError {
  return new AppError(
    ErrorCode.UNAUTHORIZED,
    message || "Non authentifié",
    ErrorSeverity.MEDIUM
  );
}

/**
 * Crée une erreur d'accès refusé
 */
export function createForbiddenError(message?: string): AppError {
  return new AppError(
    ErrorCode.FORBIDDEN,
    message || "Accès refusé",
    ErrorSeverity.MEDIUM
  );
}

/**
 * Wrapper pour gérer les erreurs dans les routes API
 */
export function withErrorHandler<T>(
  handler: (req: Request, ...args: any[]) => Promise<NextResponse<T>>,
  lang: "fr" | "en" = "fr"
) {
  return async (req: Request, ...args: any[]): Promise<NextResponse<T | ErrorResponse>> => {
    const requestId = generateRequestId();

    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error(`[${requestId}] Erreur non gérée:`, error);

      // Logger l'erreur dans le système d'audit
      try {
        const { createAuditLog } = await import("./auditService");
        const { extractIpAddress, extractUserAgent } = await import("./financeSecurity");
        const { cookies } = await import("next/headers");
        const { getUserRole } = await import("./auth");

        const cookieStore = await cookies();
        const userEmail = cookieStore.get("icd_user_email")?.value;

        createAuditLog({
          userId: userEmail || null,
          userRole: getUserRole(userEmail || "") || "system",
          action: "SECURITY_ALERT",
          resourceType: "api",
          resourceId: requestId,
          description: `Erreur non gérée: ${error instanceof Error ? error.message : String(error)}`,
          metadata: {
            path: req.url,
            method: req.method,
            error: error instanceof Error ? error.stack : String(error),
          },
          ipAddress: extractIpAddress(req),
          userAgent: extractUserAgent(req),
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      } catch (auditError) {
        console.error("Erreur lors du logging d'audit:", auditError);
      }

      return createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        requestId,
        lang
      );
    }
  };
}

/**
 * Convertit une erreur Zod en AppError
 */
export function zodErrorToAppError(zodError: any, lang: "fr" | "en" = "fr"): AppError {
  const errors = zodError.errors || [];
  const firstError = errors[0];
  const field = firstError?.path?.join(".");

  return new AppError(
    ErrorCode.VALIDATION_ERROR,
    `Validation échouée${field ? ` pour le champ "${field}"` : ""}: ${firstError?.message || "Erreur de validation"}`,
    ErrorSeverity.LOW,
    {
      zodErrors: errors.map((e: any) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    },
    field
  );
}

