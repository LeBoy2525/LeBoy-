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
// IMPORTANT: Si PRISMA_DATABASE_URL est définie avec une URL Accelerate, l'utiliser en priorité
// car Prisma 7.x nécessite soit un adapter, soit accelerateUrl
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

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
    // - Si c'est une URL Prisma Accelerate (prisma+postgres://), utiliser accelerateUrl dans la config
    // - Si c'est une URL PostgreSQL standard (postgresql://), utiliser la config standard sans adapter ni accelerateUrl
    // IMPORTANT: Prisma lit DATABASE_URL depuis schema.prisma
    // Si PRISMA_DATABASE_URL est définie avec une URL Accelerate, utiliser accelerateUrl
    // Sinon, utiliser la config standard (Prisma détecte automatiquement PostgreSQL via DATABASE_URL)
    let finalConfig = { ...prismaConfig };
    
    // Prisma 7.x nécessite soit un adapter, soit accelerateUrl
    // Si PRISMA_DATABASE_URL est définie et contient une URL Accelerate, l'utiliser
    if (process.env.PRISMA_DATABASE_URL && (isPrismaAccelerate || process.env.PRISMA_DATABASE_URL.startsWith("prisma+"))) {
      // Si c'est Prisma Accelerate, utiliser accelerateUrl
      if (!isBuildTime && typeof window === "undefined") {
        console.log(`[db] Utilisation de Prisma Accelerate via accelerateUrl`);
      }
      finalConfig = {
        ...prismaConfig,
        accelerateUrl: process.env.PRISMA_DATABASE_URL,
      };
    } else if (isPostgres && process.env.DATABASE_URL) {
      // PostgreSQL standard - Prisma 7.x nécessite un adapter ou accelerateUrl
      // Si on n'a pas Accelerate, on doit utiliser l'adapter PostgreSQL
      // Pour l'instant, essayer avec DATABASE_URL et voir si ça fonctionne
      if (!isBuildTime && typeof window === "undefined") {
        console.log(`[db] ⚠️ PostgreSQL standard détecté - Prisma 7.x nécessite un adapter ou Accelerate`);
        console.log(`[db] DATABASE_URL format: ${databaseUrl.substring(0, 20)}...`);
        console.log(`[db] Si erreur "adapter required", utilisez PRISMA_DATABASE_URL avec Accelerate ou installez @prisma/adapter-pg`);
      }
      // Ne pas modifier finalConfig - utiliser la config par défaut
      // Si cela échoue, l'erreur sera capturée et expliquée
    }
    
    // Essayer de créer PrismaClient avec la config
    // Prisma 7.x nécessite soit un adapter, soit accelerateUrl pour PostgreSQL
    // Si ce n'est pas Accelerate, on doit utiliser l'adapter PostgreSQL standard
    try {
      prismaInstance = new PrismaClient(finalConfig);
      if (!isBuildTime && typeof window === "undefined") {
        console.log(`[db] ✅ PrismaClient créé avec succès`);
      }
    } catch (createError: any) {
      // Si l'erreur est "adapter or accelerateUrl required", cela signifie que Prisma 7.x
      // nécessite explicitement un adapter pour PostgreSQL standard
      if (createError?.message?.includes("adapter") || createError?.message?.includes("accelerateUrl")) {
        const isProduction = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
        console.error(`[db] ❌ ERREUR CRITIQUE création PrismaClient: ${createError?.message}`);
        console.error(`[db] Prisma 7.x nécessite un adapter PostgreSQL ou Prisma Accelerate`);
        if (isProduction) {
          console.error(`[db] ⚠️ PRODUCTION: Les données seront PERDUES à chaque redéploiement sans Prisma!`);
          console.error(`[db] Solutions:`);
          console.error(`[db]   1. Utiliser Prisma Accelerate: définir PRISMA_DATABASE_URL avec prisma+postgres://accelerate.prisma-data.net/...`);
          console.error(`[db]   2. Installer @prisma/adapter-pg: npm install @prisma/adapter-pg pg`);
        } else {
          console.error(`[db] Options:`);
          console.error(`[db]   1. Utiliser Prisma Accelerate (définir PRISMA_DATABASE_URL avec prisma+postgres://)`);
          console.error(`[db]   2. Installer @prisma/adapter-pg et l'utiliser`);
          console.error(`[db] Pour l'instant, le système utilisera le fallback JSON (développement uniquement)`);
        }
        throw createError; // Re-lancer l'erreur pour que le catch parent la gère
      } else {
        throw createError; // Re-lancer l'erreur si ce n'est pas lié à adapter/accelerateUrl
      }
    }
    
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

