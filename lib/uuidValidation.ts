/**
 * Utilitaire pour valider les UUIDs dans les routes API
 */

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valide un UUID et retourne une erreur si invalide
 */
export function validateUUID(id: string | undefined, fieldName: string = "ID"): { valid: boolean; error?: string } {
  if (!id || typeof id !== "string") {
    return { valid: false, error: `${fieldName} invalide (manquant ou type incorrect).` };
  }
  
  if (!UUID_REGEX.test(id)) {
    return { valid: false, error: `${fieldName} invalide (format UUID attendu).` };
  }
  
  return { valid: true };
}

