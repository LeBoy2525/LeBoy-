import { prisma } from "@/lib/db";
import type { Prestataire } from "@/lib/prestatairesStore";

export async function getAllPrestataires() {
  return prisma.prestataire.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPrestataireById(id: string) {
  return prisma.prestataire.findUnique({
    where: { id },
  });
}

export async function getPrestataireByEmail(email: string) {
  return prisma.prestataire.findFirst({
    where: { 
      email: email.toLowerCase(),
      deletedAt: null, // Exclure les prestataires supprimés
    },
  });
}

export async function createPrestataire(data: Omit<Prestataire, "id">) {
  return prisma.prestataire.create({
    data: {
      ref: data.ref,
      createdAt: new Date(data.createdAt),
      nomEntreprise: data.nomEntreprise,
      nomContact: data.nomContact,
      email: data.email,
      phone: data.phone,
      adresse: data.adresse,
      ville: data.ville,
      specialites: data.specialites || [],
      zonesIntervention: data.zonesIntervention || [],
      statut: data.statut || "en_attente",
      actifAt: data.dateValidation ? new Date(data.dateValidation) : null,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
      deletedBy: data.deletedBy || null,
    },
  });
}

export async function updatePrestataire(id: string, data: Partial<Prestataire>) {
  const updateData: any = {};
  
  if (data.statut !== undefined) updateData.statut = data.statut;
  if (data.dateValidation !== undefined) updateData.actifAt = data.dateValidation ? new Date(data.dateValidation) : null;
  // Note: suspenduAt et rejeteAt ne sont pas dans le type Prestataire JSON, ils sont gérés via statut
  if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;
  if (data.deletedBy !== undefined) updateData.deletedBy = data.deletedBy;
  
  return prisma.prestataire.update({
    where: { id },
    data: updateData,
  });
}

export async function softDeletePrestataire(id: string, deletedBy: string) {
  return prisma.prestataire.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy,
    },
  });
}

