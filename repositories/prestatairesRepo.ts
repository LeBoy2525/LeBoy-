import { prisma } from "@/lib/db";
import type { Prestataire } from "@/lib/prestatairesStore";

export async function getAllPrestataires() {
  try {
    // Essayer d'abord avec tous les champs (y compris typePrestataire)
    return await prisma.prestataire.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error: any) {
    // Si erreur P2022 (colonne manquante), essayer avec select explicite sans typePrestataire
    if (error.code === "P2022") {
      console.warn("[prestatairesRepo] Colonne typePrestataire manquante, récupération sans ce champ...");
      return await prisma.prestataire.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          ref: true,
          createdAt: true,
          nomEntreprise: true,
          nomContact: true,
          email: true,
          phone: true,
          adresse: true,
          ville: true,
          specialites: true,
          zonesIntervention: true,
          passwordHash: true,
          statut: true,
          actifAt: true,
          suspenduAt: true,
          rejeteAt: true,
          rejeteBy: true,
          raisonRejet: true,
          deletedAt: true,
          deletedBy: true,
          // Ne pas inclure typePrestataire si la colonne n'existe pas
        },
      });
    }
    throw error;
  }
}

export async function getPrestataireById(id: string) {
  return prisma.prestataire.findUnique({
    where: { id },
  });
}

export async function getPrestataireByEmail(email: string) {
  const emailLower = email.toLowerCase();
  console.log(`[prestatairesRepo] Recherche prestataire avec email: "${emailLower}"`);
  
  const prestataire = await prisma.prestataire.findFirst({
    where: { 
      email: emailLower,
      deletedAt: null, // Exclure les prestataires supprimés
    },
  });
  
  if (prestataire) {
    console.log(`[prestatairesRepo] ✅ Prestataire trouvé: ${prestataire.email} (ID: ${prestataire.id}, Statut: ${prestataire.statut})`);
  } else {
    console.log(`[prestatairesRepo] ❌ Aucun prestataire trouvé pour: "${emailLower}"`);
    
    // Diagnostic : vérifier si un prestataire existe avec un email similaire
    const allPrestataires = await prisma.prestataire.findMany({
      select: { email: true, statut: true, deletedAt: true },
      take: 10,
    });
    console.log(`[prestatairesRepo] 🔍 Diagnostic: ${allPrestataires.length} prestataires dans la DB`);
    allPrestataires.forEach((p, idx) => {
      console.log(`[prestatairesRepo]   ${idx + 1}. ${p.email} (statut: ${p.statut}, deleted: ${p.deletedAt ? "oui" : "non"})`);
    });
  }
  
  return prestataire;
}

export async function createPrestataire(data: Omit<Prestataire, "id">) {
  console.log(`[prestatairesRepo] Création prestataire avec email: ${data.email}`);
  console.log(`[prestatairesRepo] passwordHash fourni: ${data.passwordHash ? "oui" : "non"}`);
  
  const prestataire = await prisma.prestataire.create({
    data: {
      ref: data.ref,
      createdAt: new Date(data.createdAt),
      nomEntreprise: data.nomEntreprise,
      nomContact: data.nomContact,
      email: data.email.toLowerCase(), // Normaliser l'email en lowercase
      phone: data.phone,
      adresse: data.adresse,
      ville: data.ville,
      specialites: data.specialites || [],
      zonesIntervention: data.zonesIntervention || [],
      statut: data.statut || "en_attente",
      passwordHash: data.passwordHash || null, // Ajouter passwordHash
      typePrestataire: (data as any).typePrestataire || "freelance", // Type de prestataire
      actifAt: data.dateValidation ? new Date(data.dateValidation) : null,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
      deletedBy: data.deletedBy || null,
    },
  });
  
  console.log(`[prestatairesRepo] ✅ Prestataire créé: ${prestataire.email} (ID: ${prestataire.id}, Statut: ${prestataire.statut})`);
  
  // Vérifier immédiatement que le prestataire peut être retrouvé
  const verifyPrestataire = await getPrestataireByEmail(prestataire.email);
  if (verifyPrestataire) {
    console.log(`[prestatairesRepo] ✅ Vérification: Prestataire retrouvable immédiatement après création`);
  } else {
    console.error(`[prestatairesRepo] ❌ ERREUR: Prestataire non retrouvable immédiatement après création!`);
  }
  
  return prestataire;
}

export async function updatePrestataire(id: string, data: Partial<Prestataire>) {
  console.log(`[prestatairesRepo] updatePrestataire appelé avec ID: ${id}`);
  console.log(`[prestatairesRepo] Données à mettre à jour:`, data);
  
  const updateData: any = {};
  
  if (data.statut !== undefined) {
    updateData.statut = data.statut;
    
    // Gérer les champs de rejet
    if (data.statut === "rejete") {
      updateData.rejeteAt = (data as any).rejeteAt ? new Date((data as any).rejeteAt) : new Date();
      updateData.rejeteBy = (data as any).rejeteBy || undefined;
      updateData.raisonRejet = (data as any).raisonRejet || undefined;
    } else if (data.statut !== "rejete") {
      // Si le statut change et n'est plus "rejete", réinitialiser les champs de rejet
      updateData.rejeteAt = null;
      updateData.rejeteBy = null;
      updateData.raisonRejet = null;
    }
    
    // Mettre à jour les dates selon le statut
    if (data.statut === "actif") {
      if (data.dateValidation) {
        updateData.actifAt = new Date(data.dateValidation);
      } else if (!updateData.actifAt) {
        // Si on réactive et qu'il n'y a pas de date de validation, utiliser maintenant
        updateData.actifAt = new Date();
      }
      // Réinitialiser suspenduAt lors de la réactivation
      updateData.suspenduAt = null;
    } else if (data.statut === "suspendu") {
      updateData.suspenduAt = new Date();
    } else if (data.statut === "rejete") {
      updateData.rejeteAt = new Date();
    }
  }
  // Gérer suspenduAt explicitement si fourni
  if (data.suspenduAt !== undefined) {
    updateData.suspenduAt = data.suspenduAt === null ? null : (data.suspenduAt instanceof Date ? data.suspenduAt : new Date(data.suspenduAt));
  }
  if (data.dateValidation !== undefined) updateData.actifAt = data.dateValidation ? new Date(data.dateValidation) : null;
  if (data.documentsVerifies !== undefined) {
    // documentsVerifies n'existe pas dans le schéma Prisma, on l'ignore
    console.log(`[prestatairesRepo] documentsVerifies ignoré (non présent dans schéma Prisma)`);
  }
  if (data.disponibilite !== undefined) {
    // disponibilite n'existe pas dans le schéma Prisma, on l'ignore
    console.log(`[prestatairesRepo] disponibilite ignoré (non présent dans schéma Prisma)`);
  }
  // Note: suspenduAt et rejeteAt ne sont pas dans le type Prestataire JSON, ils sont gérés via statut
  if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt ? new Date(data.deletedAt) : null;
  if (data.deletedBy !== undefined) updateData.deletedBy = data.deletedBy;
  if (data.passwordHash !== undefined) {
    updateData.passwordHash = data.passwordHash || null;
    console.log(`[prestatairesRepo] passwordHash sera mis à jour: ${data.passwordHash ? "oui" : "null"}`);
  }
  
  const updated = await prisma.prestataire.update({
    where: { id },
    data: updateData,
  });
  
  console.log(`[prestatairesRepo] ✅ Prestataire mis à jour: ${updated.email} (Statut: ${updated.statut})`);
  
  return updated;
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

