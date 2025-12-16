/**
 * Router de stockage - Sélectionne automatiquement le provider selon l'environnement
 * 
 * En production/staging : Vercel Blob
 * En développement : Stockage local
 */

import { LocalStorageProvider } from "./localProvider";
import { VercelBlobProvider } from "./vercelBlobProvider";
import type { StorageProvider } from "./provider";

let storageProvider: StorageProvider | null = null;

/**
 * Obtient le provider de stockage approprié
 */
function getStorageProvider(): StorageProvider {
  if (storageProvider) {
    return storageProvider;
  }

  const NODE_ENV = process.env.NODE_ENV || "development";
  const APP_ENV = process.env.APP_ENV || "local";
  const STORAGE_DRIVER = process.env.STORAGE_DRIVER || (NODE_ENV === "production" || APP_ENV === "staging" ? "blob" : "local");

  if (STORAGE_DRIVER === "blob" || NODE_ENV === "production" || APP_ENV === "staging") {
    // En production/staging, forcer Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("❌ BLOB_READ_WRITE_TOKEN non défini en production/staging !");
      throw new Error("BLOB_READ_WRITE_TOKEN doit être configuré en production/staging");
    }
    storageProvider = new VercelBlobProvider();
    console.log("✅ Stockage: Vercel Blob");
  } else {
    storageProvider = new LocalStorageProvider();
    console.log("✅ Stockage: Local (développement)");
  }

  return storageProvider;
}

// Export des fonctions de l'interface StorageProvider
export async function saveFile(
  buffer: Buffer,
  options: {
    contentType: string;
    filename: string;
    folder?: string;
  }
): Promise<{
  key: string;
  url: string;
  size: number;
}> {
  const provider = getStorageProvider();
  return provider.saveFile(buffer, options);
}

export async function getFile(key: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const provider = getStorageProvider();
  return provider.getFile(key);
}

export async function deleteFile(key: string): Promise<void> {
  const provider = getStorageProvider();
  return provider.deleteFile(key);
}

export async function fileExists(key: string): Promise<boolean> {
  const provider = getStorageProvider();
  return provider.fileExists(key);
}

export function getFileUrl(key: string): string {
  const provider = getStorageProvider();
  return provider.getFileUrl(key);
}

// Export du provider pour usage avancé
export function getProvider(): StorageProvider {
  return getStorageProvider();
}
