/**
 * Helper pour logger les erreurs Prisma avec tous les détails
 * Particulièrement utile pour identifier les colonnes manquantes (P2022)
 */

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export interface PrismaErrorDetails {
  code?: string;
  meta?: any;
  message: string;
  columnName?: string;
  tableName?: string;
}

/**
 * Extrait les détails d'une erreur Prisma
 */
export function extractPrismaErrorDetails(error: any): PrismaErrorDetails {
  const details: PrismaErrorDetails = {
    message: error?.message || String(error || ""),
  };

  if (error instanceof PrismaClientKnownRequestError) {
    details.code = error.code;
    details.meta = error.meta;

    // Pour P2022 (colonne manquante), extraire le nom de la colonne
    if (error.code === "P2022") {
      const meta = error.meta as any;
      if (meta) {
        details.columnName = meta.column || meta.target?.[0] || "unknown";
        details.tableName = meta.table || "unknown";
      }
    }

    // Pour P2002 (contrainte unique), extraire les champs
    if (error.code === "P2002") {
      const meta = error.meta as any;
      if (meta) {
        details.columnName = meta.target?.[0] || "unknown";
        details.tableName = meta.model || "unknown";
      }
    }

    // Pour P2003 (clé étrangère), extraire les détails
    if (error.code === "P2003") {
      const meta = error.meta as any;
      if (meta) {
        details.columnName = meta.field_name || "unknown";
        details.tableName = meta.table || "unknown";
      }
    }
  }

  return details;
}

/**
 * Log une erreur Prisma avec tous les détails
 */
export function logPrismaError(
  context: string,
  error: any,
  additionalInfo?: Record<string, any>
): void {
  const details = extractPrismaErrorDetails(error);

  console.error(`[${context}] ❌ Erreur Prisma:`);
  console.error(`   Code: ${details.code || "N/A"}`);
  console.error(`   Message: ${details.message}`);
  
  if (details.columnName) {
    console.error(`   Colonne: ${details.columnName}`);
  }
  
  if (details.tableName) {
    console.error(`   Table: ${details.tableName}`);
  }

  if (details.meta) {
    console.error(`   Meta (détails complets):`, JSON.stringify(details.meta, null, 2));
  }

  if (additionalInfo) {
    console.error(`   Informations supplémentaires:`, JSON.stringify(additionalInfo, null, 2));
  }

  // Pour P2022, donner des instructions spécifiques
  if (details.code === "P2022") {
    console.error(`\n   💡 ACTION REQUISE:`);
    console.error(`   La colonne "${details.columnName}" n'existe pas dans la table "${details.tableName}"`);
    console.error(`   1. Vérifiez le schéma Prisma: prisma/schema.prisma`);
    console.error(`   2. Exécutez: npx prisma migrate deploy`);
    console.error(`   3. Ou créez une migration: npx prisma migrate dev --name add_${details.columnName}_to_${details.tableName}`);
  }
}

