import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuration Prisma avec gestion de DATABASE_URL
// Prisma 7.x nécessite DATABASE_URL pour fonctionner correctement
const prismaConfig: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
};

// Initialiser Prisma seulement si DATABASE_URL est défini
// Sinon, le fallback JSON sera utilisé via USE_DB flag
let prismaInstance: PrismaClient | undefined;

if (process.env.DATABASE_URL) {
  try {
    prismaInstance = new PrismaClient(prismaConfig);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de Prisma:", error);
    prismaInstance = undefined;
  }
} else {
  console.warn("⚠️ DATABASE_URL non définie - Prisma ne sera pas initialisé (fallback JSON activé)");
}

export const prisma =
  globalForPrisma.prisma ?? prismaInstance;

if (process.env.NODE_ENV !== "production" && prismaInstance) {
  globalForPrisma.prisma = prismaInstance;
}

