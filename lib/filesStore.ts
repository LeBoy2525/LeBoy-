// lib/filesStore.ts
// Système de stockage de fichiers avec support Vercel Blob (staging/prod) et local (dev)

import { loadFromFile, saveToFileAsync } from "./persistence";
import { saveFile as saveFileStorage, getFile as getFileStorage } from "./storage/index";
import { USE_DB } from "./dbFlag";

export type StoredFile = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number; // en bytes
  data?: string; // Base64 (déprécié, utilisé uniquement pour compatibilité)
  storageKey?: string; // Clé de stockage (Blob ou local)
  storageUrl?: string; // URL publique du fichier
  uploadedAt: string; // ISO date
  uploadedBy: string; // Email du prestataire
};

type GlobalStore = {
  _icdFiles?: StoredFile[];
  _icdFilesLoaded?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

// Initialiser le store depuis le fichier (uniquement si USE_DB=false)
if (!globalStore._icdFiles && !USE_DB) {
  globalStore._icdFiles = [];
  globalStore._icdFilesLoaded = false;
  
  // Charger les données au démarrage (asynchrone)
  loadFromFile<StoredFile>("files.json").then((data) => {
    if (data.length > 0) {
      globalStore._icdFiles = data;
      console.log(`✅ ${data.length} fichier(s) chargé(s) depuis le fichier`);
    }
    globalStore._icdFilesLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des fichiers:", error);
    globalStore._icdFilesLoaded = true;
  });
} else if (USE_DB) {
  globalStore._icdFiles = [];
  globalStore._icdFilesLoaded = true;
}

export const filesStore = globalStore._icdFiles || [];

// Fonction pour sauvegarder les fichiers (uniquement si USE_DB=false)
function saveFiles() {
  if (!USE_DB) {
    saveToFileAsync("files.json", filesStore);
  }
}

/**
 * Stocke un fichier dans le système de stockage (Blob ou local)
 * @param file Données du fichier
 * @returns StoredFile avec storageKey et storageUrl
 */
export async function storeFile(
  file: {
    originalName: string;
    mimeType: string;
    size: number;
    data: string; // Base64 ou Buffer converti
    uploadedBy: string;
  }
): Promise<StoredFile> {
  const id = `file-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // Convertir base64 en Buffer
  let buffer: Buffer;
  if (file.data.startsWith("data:")) {
    // Format data URL (data:mime;base64,...)
    const base64Data = file.data.split(",")[1];
    buffer = Buffer.from(base64Data, "base64");
  } else {
    // Déjà en base64 pur
    buffer = Buffer.from(file.data, "base64");
  }

  // Déterminer le dossier selon le contexte
  const folder = "temp"; // Par défaut, peut être ajusté selon le contexte

  // Sauvegarder dans le système de stockage (Blob ou local)
  const storageResult = await saveFileStorage(buffer, {
    contentType: file.mimeType,
    filename: `${id}-${file.originalName}`,
    folder,
  });

  const stored: StoredFile = {
    id,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    storageKey: storageResult.key, // Clé de stockage (Blob ou chemin local)
    storageUrl: storageResult.url, // URL publique
    uploadedAt: new Date().toISOString(),
    uploadedBy: file.uploadedBy,
    // Conserver data pour compatibilité avec l'ancien système (déprécié)
    data: file.data,
  };

  // Si USE_DB=false, sauvegarder dans le store JSON
  if (!USE_DB) {
    filesStore.push(stored);
    saveFiles();
  }

  return stored;
}

export function getFileById(id: string): StoredFile | undefined {
  return filesStore.find((f) => f.id === id);
}

export function getFilesByUploader(email: string): StoredFile[] {
  return filesStore.filter((f) => f.uploadedBy.toLowerCase() === email.toLowerCase());
}

/**
 * Récupère le buffer d'un fichier depuis le stockage
 * @param storedFile Fichier stocké
 * @returns Buffer du fichier
 */
export async function getFileBuffer(storedFile: StoredFile): Promise<Buffer> {
  // Si on a une storageKey, utiliser le nouveau système
  if (storedFile.storageKey) {
    const result = await getFileStorage(storedFile.storageKey);
    return result.buffer;
  }

  // Fallback vers l'ancien système (base64)
  if (storedFile.data) {
    const base64Data = storedFile.data.startsWith("data:")
      ? storedFile.data.split(",")[1]
      : storedFile.data;
    return Buffer.from(base64Data, "base64");
  }

  throw new Error(`Fichier ${storedFile.id} n'a pas de données disponibles`);
}

