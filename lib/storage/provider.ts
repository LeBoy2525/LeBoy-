/**
 * Interface abstraite pour le stockage de fichiers
 * Permet de basculer entre stockage local (dev) et Vercel Blob (staging/prod)
 */

export interface StorageProvider {
  /**
   * Sauvegarde un fichier
   * @param buffer Buffer du fichier
   * @param options Options de sauvegarde
   * @returns Clé de stockage et URL publique
   */
  saveFile(
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
  }>;

  /**
   * Récupère un fichier par sa clé
   * @param key Clé de stockage
   * @returns Buffer et type MIME
   */
  getFile(key: string): Promise<{
    buffer: Buffer;
    contentType: string;
  }>;

  /**
   * Supprime un fichier
   * @param key Clé de stockage
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Vérifie si un fichier existe
   * @param key Clé de stockage
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Obtient l'URL publique d'un fichier
   * @param key Clé de stockage
   */
  getFileUrl(key: string): string;
}

