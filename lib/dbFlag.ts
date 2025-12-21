/**
 * Flag pour forcer l'utilisation de la base de données même en développement local
 * 
 * Si USE_DB=true dans .env.local, toutes les routes utiliseront PostgreSQL
 * Sinon, le système utilisera le stockage JSON (développement uniquement)
 * 
 * IMPORTANT: USE_DB sera false si DATABASE_URL n'est pas définie ou si Prisma n'est pas initialisé
 * Cela garantit que le fallback JSON fonctionne même si USE_DB=true mais que la DB n'est pas disponible
 */

// Vérifier si une URL de base de données est disponible
// Support pour POSTGRES_PRISMA_URL, PRISMA_DATABASE_URL, DATABASE_URL, POSTGRES_URL
const hasDatabaseUrl = !!(
  process.env.POSTGRES_PRISMA_URL ||
  process.env.PRISMA_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL
);

// USE_DB est true seulement si :
// 1. USE_DB=true est explicitement défini OU NODE_ENV=production
// 2. ET une URL de base de données est définie (POSTGRES_PRISMA_URL, PRISMA_DATABASE_URL, DATABASE_URL, ou POSTGRES_URL)
// Si Prisma n'est pas initialisé, le fallback JSON sera utilisé automatiquement dans dataAccess
const explicitUseDB = process.env.USE_DB === "true";
const isProduction = process.env.NODE_ENV === "production";

export const USE_DB = (explicitUseDB || isProduction) && hasDatabaseUrl;

export function shouldUseDB(): boolean {
  // Vérifier dynamiquement si Prisma est disponible
  try {
    // Import dynamique pour éviter les dépendances circulaires
    const { prisma } = require("./db");
    return USE_DB && !!prisma;
  } catch {
    return false;
  }
}

