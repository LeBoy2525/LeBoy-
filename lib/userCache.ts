/**
 * Cache en mémoire pour les utilisateurs récemment consultés
 * Réduit les appels à la base de données pour améliorer les performances
 */

import type { User } from "./usersStore";

type CacheEntry = {
  user: User;
  timestamp: number;
};

// Cache avec expiration (5 minutes)
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes en millisecondes
const cache = new Map<string, CacheEntry>();

/**
 * Nettoie le cache des entrées expirées
 */
function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

/**
 * Récupère un utilisateur depuis le cache
 */
export function getCachedUser(email: string): User | null {
  cleanExpiredEntries();
  const entry = cache.get(email.toLowerCase());
  if (entry) {
    return entry.user;
  }
  return null;
}

/**
 * Met un utilisateur en cache
 */
export function cacheUser(email: string, user: User): void {
  cache.set(email.toLowerCase(), {
    user,
    timestamp: Date.now(),
  });
}

/**
 * Invalide le cache pour un utilisateur spécifique
 */
export function invalidateCache(email: string): void {
  cache.delete(email.toLowerCase());
}

/**
 * Vide tout le cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Récupère la taille actuelle du cache
 */
export function getCacheSize(): number {
  cleanExpiredEntries();
  return cache.size;
}

