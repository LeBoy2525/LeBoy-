/**
 * Flag pour forcer l'utilisation de la base de données même en développement local
 * 
 * Si USE_DB=true dans .env.local, toutes les routes utiliseront PostgreSQL
 * Sinon, le système utilisera le stockage JSON (développement uniquement)
 */

export const USE_DB = process.env.USE_DB === "true" || process.env.NODE_ENV === "production";

export function shouldUseDB(): boolean {
  return USE_DB;
}

