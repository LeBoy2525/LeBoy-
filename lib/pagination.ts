// lib/pagination.ts
// Utilitaires pour la pagination des listes

import { z } from "zod";

/**
 * Paramètres de pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Options de pagination avec valeurs par défaut
 */
export interface PaginationOptions {
  defaultLimit: number;
  maxLimit: number;
  defaultPage: number;
}

const DEFAULT_OPTIONS: PaginationOptions = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultPage: 1,
};

/**
 * Normalise les paramètres de pagination
 */
export function normalizePagination(
  params: PaginationParams,
  options: Partial<PaginationOptions> = {}
): {
  page: number;
  limit: number;
  offset: number;
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Utiliser offset si fourni, sinon calculer depuis page
  if (params.offset !== undefined) {
    const limit = Math.min(
      Math.max(1, params.limit || opts.defaultLimit),
      opts.maxLimit
    );
    const offset = Math.max(0, params.offset);
    const page = Math.floor(offset / limit) + 1;
    
    return { page, limit, offset };
  }
  
  // Sinon, utiliser page
  const page = Math.max(1, params.page || opts.defaultPage);
  const limit = Math.min(
    Math.max(1, params.limit || opts.defaultLimit),
    opts.maxLimit
  );
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

/**
 * Applique la pagination à une liste
 */
export function paginate<T>(
  items: T[],
  params: PaginationParams,
  options: Partial<PaginationOptions> = {}
): PaginatedResult<T> {
  const { page, limit, offset } = normalizePagination(params, options);
  
  const total = items.length;
  const paginatedItems = items.slice(offset, offset + limit);
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Crée une réponse paginée pour une API
 */
export function createPaginatedResponse<T>(
  items: T[],
  params: PaginationParams,
  options: Partial<PaginationOptions> = {}
) {
  return paginate(items, params, options);
}

/**
 * Schéma Zod pour valider les paramètres de pagination
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * Extrait les paramètres de pagination depuis les query params
 */
export function extractPaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");
  
  return {
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
  };
}

