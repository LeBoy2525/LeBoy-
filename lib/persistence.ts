// lib/persistence.ts
// Système de persistance avec fichiers JSON
// ⚠️ DÉSACTIVÉ EN PRODUCTION - Utiliser PostgreSQL avec Prisma

import { promises as fs } from "fs";
import path from "path";

// Helper pour détecter si on est en build Next.js
const isBuildTime = typeof process !== "undefined" && (
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development-build" ||
  (process.env.NODE_ENV === "production" && typeof window === "undefined" && process.env.NEXT_RUNTIME)
);

// Désactiver le stockage JSON en production (seulement si pas en build)
if (process.env.NODE_ENV === "production" && !isBuildTime && typeof window === "undefined") {
  // Ne logger qu'une seule fois au démarrage runtime, pas pendant le build
  const globalStore = globalThis as typeof globalThis & { _icdJsonStorageWarningShown?: boolean };
  if (!globalStore._icdJsonStorageWarningShown) {
    console.warn("⚠️  Le stockage JSON est désactivé en production. Utilisez PostgreSQL avec Prisma.");
    globalStore._icdJsonStorageWarningShown = true;
  }
}

const DATA_DIR = path.join(process.cwd(), "data");

// S'assurer que le dossier data existe
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Charger les données depuis un fichier JSON
export async function loadFromFile<T>(filename: string): Promise<T[]> {
  // Pendant le build uniquement, retourner un tableau vide (les données viennent de la DB)
  // En runtime production, permettre le fallback JSON si Prisma échoue
  if (isBuildTime) {
    return [];
  }
  
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    
    try {
      const data = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(data) as T[];
      console.log(`[persistence] Chargé ${parsed.length} entrée(s) depuis ${filename}`);
      return parsed;
    } catch (error: any) {
      // Si le fichier n'existe pas, retourner un tableau vide
      if (error.code === "ENOENT") {
        console.log(`[persistence] Fichier ${filename} n'existe pas encore`);
        return [];
      }
      throw error;
    }
  } catch (error) {
    console.error(`Erreur lors du chargement de ${filename}:`, error);
    return [];
  }
}

// Sauvegarder les données dans un fichier JSON
export async function saveToFile<T>(filename: string, data: T[]): Promise<void> {
  // Pendant le build uniquement, ne rien faire
  // En runtime production, permettre le fallback JSON si Prisma échoue
  if (isBuildTime) {
    return;
  }
  
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    
    // Créer un backup avant d'écrire (optionnel mais recommandé)
    try {
      const existingData = await fs.readFile(filePath, "utf-8");
      const backupPath = path.join(DATA_DIR, `${filename}.backup`);
      await fs.writeFile(backupPath, existingData, "utf-8");
    } catch {
      // Pas de backup si le fichier n'existe pas
    }
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de ${filename}:`, error);
    throw error;
  }
}

// Fonction helper pour sauvegarder de manière asynchrone (non-bloquante)
export function saveToFileAsync<T>(filename: string, data: T[]): void {
  saveToFile(filename, data).catch((error) => {
    console.error(`Erreur lors de la sauvegarde asynchrone de ${filename}:`, error);
  });
}

