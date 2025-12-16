// lib/apiErrorHandler.ts
// Helper pour gérer les erreurs API de manière cohérente

/**
 * Gère une réponse API et détermine si c'est une erreur d'authentification
 */
export async function handleApiResponse<T>(
  response: Response
): Promise<{ success: true; data: T } | { success: false; error: string; isAuthError: boolean }> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const isAuthError = response.status === 401 || response.status === 403;
    return {
      success: false,
      error: data?.error || `Erreur ${response.status}`,
      isAuthError,
    };
  }

  return {
    success: true,
    data: data as T,
  };
}

/**
 * Gère une erreur API sans rediriger automatiquement
 * Retourne juste le message d'erreur
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Une erreur est survenue";
}

/**
 * Vérifie si une erreur est une erreur d'authentification
 */
export function isAuthError(status: number): boolean {
  return status === 401 || status === 403;
}

