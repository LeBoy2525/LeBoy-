import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuration Prisma avec gestion de DATABASE_URL
// Prisma 7.x nécessite DATABASE_URL pour fonctionner correctement
const prismaConfig: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
};

// Helper pour détecter si on est en build Next.js
const isBuildTime = typeof process !== "undefined" && (
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development-build"
);

// Initialiser Prisma seulement si DATABASE_URL est défini
// Sinon, le fallback JSON sera utilisé via USE_DB flag
let prismaInstance: PrismaClient | undefined;

if (process.env.DATABASE_URL) {
  try {
    prismaInstance = new PrismaClient(prismaConfig);
    // Tester la connexion immédiatement pour détecter les erreurs tôt
    // Mais seulement en runtime, pas pendant le build
    if (!isBuildTime && typeof window === "undefined") {
      prismaInstance.$connect().catch((connectError: any) => {
        console.error("❌ Erreur de connexion Prisma:", connectError?.message || connectError);
        console.error("   → Le système utilisera le fallback JSON");
        prismaInstance = undefined;
      });
    }
  } catch (error: any) {
    console.error("❌ Erreur lors de l'initialisation de Prisma:");
    console.error("   Message:", error?.message || error);
    console.error("   Code:", error?.code);
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
      console.warn("⚠️ DATABASE_URL non définie alors que USE_DB=true ou en production");
      console.warn("   → Le système utilisera le fallback JSON");
      console.warn("   → Pour utiliser PostgreSQL, configurez DATABASE_URL dans Vercel → Settings → Environment Variables");
    } else {
      // En développement local avec USE_DB=false, c'est normal
      const globalStore = globalThis as typeof globalThis & { _icdDbUrlWarningShown?: boolean };
      if (!globalStore._icdDbUrlWarningShown) {
        console.log("ℹ️  DATABASE_URL non définie - Utilisation du stockage JSON (normal en développement)");
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

