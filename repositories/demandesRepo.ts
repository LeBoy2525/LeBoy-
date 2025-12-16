import { prisma } from "@/lib/db";
import type { DemandeICD } from "@/lib/demandesStore";

export async function getAllDemandes() {
  // @ts-ignore - Le client Prisma est généré mais TypeScript peut ne pas le reconnaître immédiatement
  return (prisma as any).demande.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getDemandeById(id: string) {
  // @ts-ignore
  return (prisma as any).demande.findUnique({
    where: { id },
  });
}

export async function getDemandeByRef(ref: string) {
  // @ts-ignore
  return (prisma as any).demande.findUnique({
    where: { ref },
  });
}

export async function createDemande(data: Omit<DemandeICD, "id">) {
  // @ts-ignore - Le client Prisma est généré mais TypeScript peut ne pas le reconnaître immédiatement
  return (prisma as any).demande.create({
    data: {
      ref: data.ref,
      createdAt: new Date(data.createdAt),
      deviceId: data.deviceId || null,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      serviceType: data.serviceType,
      serviceSubcategory: data.serviceSubcategory || null,
      serviceAutre: data.serviceAutre || null,
      country: data.country || null,
      description: data.description,
      lieu: data.lieu || null,
      budget: data.budget || null,
      urgence: data.urgence,
      fileIds: data.fileIds || [],
      statut: data.statut || "en_attente",
      rejeteeAt: data.rejeteeAt ? new Date(data.rejeteeAt) : null,
      rejeteeBy: data.rejeteeBy || null,
      raisonRejet: data.raisonRejet || null,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
      deletedBy: data.deletedBy || null,
    },
  });
}

export async function updateDemande(id: string, data: Partial<DemandeICD>) {
  // @ts-ignore
  return (prisma as any).demande.update({
    where: { id },
    data: {
      ...(data.statut !== undefined && { statut: data.statut }),
      ...(data.rejeteeAt !== undefined && { rejeteeAt: data.rejeteeAt ? new Date(data.rejeteeAt) : null }),
      ...(data.rejeteeBy !== undefined && { rejeteeBy: data.rejeteeBy }),
      ...(data.raisonRejet !== undefined && { raisonRejet: data.raisonRejet }),
      ...(data.deletedAt !== undefined && { deletedAt: data.deletedAt ? new Date(data.deletedAt) : null }),
      ...(data.deletedBy !== undefined && { deletedBy: data.deletedBy }),
    },
  });
}

export async function softDeleteDemande(id: string, deletedBy: string) {
  // @ts-ignore
  return (prisma as any).demande.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy,
    },
  });
}

export async function restoreDemande(id: string) {
  // @ts-ignore
  return (prisma as any).demande.update({
    where: { id },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  });
}

export async function getDeletedDemandes() {
  // @ts-ignore
  return (prisma as any).demande.findMany({
    where: {
      deletedAt: { not: null },
    },
    orderBy: {
      deletedAt: "desc",
    },
  });
}
