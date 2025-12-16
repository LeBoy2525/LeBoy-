/**
 * Gestion du stockage des fichiers
 * 
 * ⚠️ DEPRECATED - Utiliser lib/storage/index.ts à la place
 * Ce fichier est conservé pour compatibilité mais redirige vers le nouveau système
 */

// Réexporter depuis le nouveau système de stockage
export {
  saveFile as saveFileStorage,
  getFile as readFile,
  deleteFile,
  fileExists,
  getFileUrl,
} from "./storage";

// Fonctions de compatibilité pour l'ancienne API
import { saveFile as saveFileNew, getFileUrl as getFileUrlNew } from "./storage";

/**
 * @deprecated Utiliser saveFileStorage directement
 */
export async function saveFile(
  file: Buffer,
  filename: string,
  category: "missions" | "demandes" | "preuves" | "invoices" | "temp",
  subfolder?: string
): Promise<string> {
  const folder = subfolder ? `${category}/${subfolder}` : category;
  const result = await saveFileNew(file, {
    contentType: "application/octet-stream", // Déterminer depuis l'extension si nécessaire
    filename,
    folder,
  });
  
  // Retourner la clé (compatible avec l'ancienne API qui retournait le chemin)
  return result.key;
}

/**
 * @deprecated Utiliser getFileUrl directement
 */
export function getFileUrl(filePath: string): string {
  // Si c'est déjà une URL complète (Blob), la retourner telle quelle
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  
  // Sinon, utiliser la clé pour obtenir l'URL
  return getFileUrlNew(filePath);
}

