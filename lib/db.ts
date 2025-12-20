import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuration Prisma avec gestion de DATABASE_URL
// Prisma 7.x nécessite DATABASE_URL pour fonctionner correctement
// Pour PostgreSQL standard, ne pas spécifier d'adapter ou accelerateUrl
const prismaConfig: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
};

// Helper pour détecter si on est en build Next.js
const isBuildTime = typeof process !== "undefined" && (
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development-build"
);

// Initialiser Prisma seulement si DATABASE_URL, PRISMA_DATABASE_URL ou POSTGRES_URL est défini
// Prisma utilise DATABASE_URL par défaut (défini dans schema.prisma)
// Mais peut aussi utiliser PRISMA_DATABASE_URL si présent (pour Prisma Accelerate)
// Sinon, le fallback JSON sera utilisé via USE_DB flag
let prismaInstance: PrismaClient | undefined;

// Vérifier quelle variable d'environnement est disponible
// Prisma lit DATABASE_URL depuis schema.prisma, mais on peut aussi avoir PRISMA_DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || process.env.POSTGRES_URL;

if (databaseUrl) {
  try {
    // Vérifier le format de l'URL
    const isPrismaAccelerate = databaseUrl.startsWith("prisma+postgres://") || databaseUrl.startsWith("prisma+postgresql://");
    const isPostgres = databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");
    
    if (!isBuildTime && typeof window === "undefined") {
      console.log(`[db] URL de base de données détectée:`);
      console.log(`   Format: ${isPrismaAccelerate ? "Prisma Accelerate" : isPostgres ? "PostgreSQL standard" : "autre"}`);
      console.log(`   Source: ${process.env.DATABASE_URL ? "DATABASE_URL" : process.env.PRISMA_DATABASE_URL ? "PRISMA_DATABASE_URL" : "POSTGRES_URL"}`);
      console.log(`   URL (masquée): ${databaseUrl.substring(0, 30)}...`);
    }
    
    // Pour Prisma 7.x :
    // - Si c'est une URL Prisma Accelerate (prisma+postgres://), Prisma la détecte automatiquement via DATABASE_URL
    // - Si c'est une URL PostgreSQL standard, Prisma l'utilise aussi automatiquement
    // - Ne pas spécifier d'adapter ou accelerateUrl dans la config
    // IMPORTANT: Prisma lit DATABASE_URL depuis schema.prisma, donc si PRISMA_DATABASE_URL est utilisé,
    // il faut s'assurer que DATABASE_URL pointe vers la même valeur (ou utiliser PRISMA_DATABASE_URL comme DATABASE_URL)
    prismaInstance = new PrismaClient(prismaConfig);
    
    // Ne pas tester la connexion immédiatement - laisser Prisma se connecter à la demande
    // Cela évite les erreurs d'initialisation prématurées
  } catch (error: any) {
    console.error("❌ Erreur lors de l'initialisation de Prisma:");
    console.error("   Message:", error?.message || error);
    console.error("   Code:", error?.code);
    if (error?.stack) {
      console.error("   Stack:", error.stack.substring(0, 500));
    }
    console.error("   → Le système utilisera le fallback JSON");
    prismaInstance = undefined;
  }
} else {
  // Ne logger qu'en runtime, pas pendant le build
  if (!isBuildTime && typeof window === "undefined") {
    const isProduction = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production" || process.env.APP_ENV === "staging";
    const useDB = process.env.USE_DB === "true";
    
    if (isProduction || useDB) {
      // En production ou si USE_DB=true, DATABASE_URL est requise
      console.warn("⚠️ Aucune URL de base de données détectée (DATABASE_URL, PRISMA_DATABASE_URL ou POSTGRES_URL)");
      console.warn("   → Le système utilisera le fallback JSON");
      console.warn("   → Pour utiliser PostgreSQL, configurez DATABASE_URL dans Vercel → Settings → Environment Variables");
    } else {
      // En développement local avec USE_DB=false, c'est normal
      const globalStore = globalThis as typeof globalThis & { _icdDbUrlWarningShown?: boolean };
      if (!globalStore._icdDbUrlWarningShown) {
        console.log("ℹ️  Aucune URL de base de données - Utilisation du stockage JSON (normal en développement)");
        globalStore._icdDbUrlWarningShown = true;
      }
    }
  }
}

export const prisma =
  globalForPrisma.prisma ?? prismaInstance;

if (process.env.NODE_ENV !== "production" && prismaInstance) {
  globalForPrisma.prisma = prismaInstance;
}

