/**
 * Provider de stockage local (développement uniquement)
 * Utilise le système de fichiers local
 */

import fs from "fs/promises";
import path from "path";
import type { StorageProvider } from "./provider";

const STORAGE_PATH = process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
const STORAGE_URL = process.env.STORAGE_URL || "/api/files";

export class LocalStorageProvider implements StorageProvider {
  private async ensureStorageDir() {
    try {
      await fs.access(STORAGE_PATH);
    } catch {
      await fs.mkdir(STORAGE_PATH, { recursive: true });
    }

    // Créer les sous-dossiers
    const subdirs = ["missions", "demandes", "preuves", "invoices", "temp"];
    for (const subdir of subdirs) {
      const subdirPath = path.join(STORAGE_PATH, subdir);
      try {
        await fs.access(subdirPath);
      } catch {
        await fs.mkdir(subdirPath, { recursive: true });
      }
    }
  }

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
    await this.ensureStorageDir();

    const category = options.folder || "temp";
    const categoryPath = path.join(STORAGE_PATH, category);

    // Créer le sous-dossier si nécessaire
    try {
      await fs.access(categoryPath);
    } catch {
      await fs.mkdir(categoryPath, { recursive: true });
    }

    const filePath = path.join(categoryPath, options.filename);
    await fs.writeFile(filePath, buffer);

    const relativePath = path.relative(STORAGE_PATH, filePath);
    const key = relativePath.replace(/\\/g, "/");
    const url = `${STORAGE_URL}/${key}`;

    return {
      key,
      url,
      size: buffer.length,
    };
  }

  async getFile(key: string): Promise<{
    buffer: Buffer;
    contentType: string;
  }> {
    const filePath = path.join(STORAGE_PATH, key);
    const buffer = await fs.readFile(filePath);

    // Déterminer le type MIME depuis l'extension
    const ext = path.extname(key).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    return {
      buffer,
      contentType,
    };
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const filePath = path.join(STORAGE_PATH, key);
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const filePath = path.join(STORAGE_PATH, key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getFileUrl(key: string): string {
    return `${STORAGE_URL}/${key}`;
  }
}

