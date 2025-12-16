// lib/apiValidation.ts
// Middleware et helpers pour valider les requêtes API

import { NextResponse } from "next/server";
import { z } from "zod";
import type { ZodSchema } from "zod";
import {
  createErrorResponse,
  zodErrorToAppError,
  generateRequestId,
} from "./errorHandler";
import { ErrorCode } from "./errorTypes";

/**
 * Wrapper pour valider le body d'une requête API
 */
export async function validateApiRequest<T>(
  req: Request,
  schema: ZodSchema<T>,
  lang: "fr" | "en" = "fr"
): Promise<
  | { success: true; data: T }
  | { success: false; response: NextResponse }
> {
  const requestId = generateRequestId();

  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const appError = zodErrorToAppError(result.error, lang);
      return {
        success: false,
        response: createErrorResponse(appError, requestId, lang),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    // Erreur lors de la lecture du JSON
    const appError = new (await import("./errorTypes")).AppError(
      ErrorCode.VALIDATION_ERROR,
      "Erreur lors de la lecture du body de la requête",
      (await import("./errorTypes")).ErrorSeverity.LOW,
      {
        originalError: error instanceof Error ? error.message : String(error),
      }
    );

    return {
      success: false,
      response: createErrorResponse(appError, requestId, lang),
    };
  }
}

/**
 * Wrapper pour valider les query parameters
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>,
  lang: "fr" | "en" = "fr"
): { success: true; data: T } | { success: false; response: NextResponse } {
  const requestId = generateRequestId();

  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const appError = zodErrorToAppError(result.error, lang);
    return {
      success: false,
      response: createErrorResponse(appError, requestId, lang),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Helper pour créer une réponse d'erreur de validation
 */
export function validationErrorResponse(
  errors: z.ZodError
): NextResponse {
  const errorMessages = errors.issues.map((e) => {
    const path = e.path.join(".");
    return `${path}: ${e.message}`;
  });

  return NextResponse.json(
    {
      error: "Validation échouée",
      details: errorMessages,
    },
    { status: 400 }
  );
}

