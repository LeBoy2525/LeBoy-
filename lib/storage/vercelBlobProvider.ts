/**
 * Provider de stockage Vercel Blob (staging/production)
 * Utilise @vercel/blob pour un stockage persistant
 */

import { put, del, head } from "@vercel/blob";
import type { StorageProvider } from "./provider";

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Helper pour détecter si on est en build Next.js
const isBuildTime = typeof process !== "undefined" && (
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development-build"
);

// Ne logger qu'en runtime, pas pendant le build, et seulement si vraiment nécessaire
if (!BLOB_READ_WRITE_TOKEN && !isBuildTime && typeof window === "undefined") {
  const isProduction = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production" || process.env.APP_ENV === "staging";
  if (isProduction && !globalThis._icdBlobTokenWarningShown) {
    console.warn("⚠️ BLOB_READ_WRITE_TOKEN non défini - Vercel Blob ne fonctionnera pas en production");
    globalThis._icdBlobTokenWarningShown = true;
  }
}

export class VercelBlobProvider implements StorageProvider {
  async saveFile(
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
    if (!BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN n'est pas configuré");
    }

    // Construire le chemin dans Blob
    const folder = options.folder || "temp";
    const blobPath = `${folder}/${options.filename}`;

    // Upload vers Vercel Blob
    const blob = await put(blobPath, buffer, {
      access: "public", // Fichiers publics accessibles via URL
      contentType: options.contentType,
      token: BLOB_READ_WRITE_TOKEN,
    });

    return {
      key: blob.url, // Utiliser l'URL complète comme clé (plus fiable)
      url: blob.url, // URL publique Vercel Blob
      size: buffer.length,
    };
  }

  async getFile(key: string): Promise<{
    buffer: Buffer;
    contentType: string;
  }> {
    if (!BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN n'est pas configuré");
    }

    // La clé peut être soit une URL complète, soit un pathname
    // Si c'est déjà une URL, l'utiliser directement
    let blobUrl: string;
    if (key.startsWith("http://") || key.startsWith("https://")) {
      blobUrl = key;
    } else {
      // Sinon, construire l'URL depuis le pathname
      // Note: Vercel Blob retourne une URL complète dans put(), donc normalement key devrait être une URL
      blobUrl = `https://${process.env.VERCEL_BLOB_STORE_ID || "public"}.public.blob.vercel-storage.com/${key}`;
    }

    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Fichier non trouvé: ${key}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    return {
      buffer,
      contentType,
    };
  }

  async deleteFile(key: string): Promise<void> {
    if (!BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN n'est pas configuré");
    }

    // La clé peut être soit une URL complète, soit un pathname
    let blobUrl: string;
    if (key.startsWith("http://") || key.startsWith("https://")) {
      blobUrl = key;
    } else {
      blobUrl = `https://${process.env.VERCEL_BLOB_STORE_ID || "public"}.public.blob.vercel-storage.com/${key}`;
    }

    try {
      await del(blobUrl, {
        token: BLOB_READ_WRITE_TOKEN,
      });
    } catch (error: any) {
      // Ignorer si le fichier n'existe pas
      if (error.status !== 404) {
        throw error;
      }
    }
  }

  async fileExists(key: string): Promise<boolean> {
    if (!BLOB_READ_WRITE_TOKEN) {
      return false;
    }

    try {
      let blobUrl: string;
      if (key.startsWith("http://") || key.startsWith("https://")) {
        blobUrl = key;
      } else {
        blobUrl = `https://${process.env.VERCEL_BLOB_STORE_ID || "public"}.public.blob.vercel-storage.com/${key}`;
      }
      await head(blobUrl, {
        token: BLOB_READ_WRITE_TOKEN,
      });
      return true;
    } catch {
      return false;
    }
  }

  getFileUrl(key: string): string {
    // Si c'est déjà une URL complète, la retourner
    if (key.startsWith("http://") || key.startsWith("https://")) {
      return key;
    }
    // Sinon, construire l'URL depuis le pathname
    return `https://${process.env.VERCEL_BLOB_STORE_ID || "public"}.public.blob.vercel-storage.com/${key}`;
  }
}

