// repositories/propositionsRepo.ts

import { prisma } from "@/lib/db";

export type PropositionCreateInput = {
  ref: string;
  demandeId: string;
  prestataireId: string;
  prix_prestataire: number;
  delai_estime: number;
  commentaire: string;
  difficulte_estimee: number;
};

export type PropositionUpdateInput = {
  statut?: "en_attente" | "acceptee" | "refusee";
  accepteeAt?: Date | null;
  refuseeAt?: Date | null;
  accepteeBy?: string | null;
  refuseeBy?: string | null;
  raisonRefus?: string | null;
  missionId?: string | null;
};

/**
 * Créer une nouvelle proposition
 */
export async function createProposition(data: PropositionCreateInput) {
  // @ts-ignore - Prisma client type issues
  return await (prisma as any).proposition.create({
    data: {
      ref: data.ref,
      demandeId: data.demandeId,
      prestataireId: data.prestataireId,
      prix_prestataire: data.prix_prestataire,
      delai_estime: data.delai_estime,
      commentaire: data.commentaire,
      difficulte_estimee: data.difficulte_estimee,
      statut: "en_attente",
    },
  });
}

/**
 * Récupérer une proposition par ID
 */
export async function getPropositionById(id: string) {
  // @ts-ignore - Prisma client type issues
  return await (prisma as any).proposition.findUnique({
    where: { id },
  });
}

/**
 * Récupérer une proposition par ref
 */
export async function getPropositionByRef(ref: string) {
  // @ts-ignore - Prisma client type issues
  return await (prisma as any).proposition.findUnique({
    where: { ref },
  });
}

/**
 * Récupérer toutes les propositions pour une demande
 */
export async function getPropositionsByDemandeId(demandeId: string) {
  // @ts-ignore - Prisma client type issues
  return await (prisma as any).proposition.findMany({
    where: { demandeId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Récupérer toutes les propositions pour un prestataire
 */
export async function getPropositionsByPrestataireId(prestataireId: string) {
  // @ts-ignore - Prisma client type issues
  return await (prisma as any).proposition.findMany({
    where: { prestataireId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Mettre à jour le statut d'une proposition
 */
export async function updatePropositionStatus(
  id: string,
  data: PropositionUpdateInput
) {
  // @ts-ignore - Prisma client type issues
  return await (prisma as any).proposition.update({
    where: { id },
    data,
  });
}

/**
 * Vérifier si une proposition existe pour une demande et un prestataire
 */
export async function propositionExistsForDemandeAndPrestataire(
  demandeId: string,
  prestataireId: string
): Promise<boolean> {
  // @ts-ignore - Prisma client type issues
  const count = await (prisma as any).proposition.count({
    where: {
      demandeId,
      prestataireId,
      statut: "en_attente",
    },
  });
  return count > 0;
}
