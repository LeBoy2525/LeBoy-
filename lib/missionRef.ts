// lib/missionRef.ts
// Génération atomique de références de missions via compteur DB
// Garantit l'unicité même en cas de création concurrente

import { PrismaClient } from "@prisma/client";

/**
 * Génère une référence de mission unique de manière atomique
 * Utilise une transaction DB pour garantir l'unicité même en cas de création concurrente
 * 
 * @param prisma - Instance PrismaClient
 * @param now - Date optionnelle (par défaut: maintenant)
 * @returns Référence unique au format M-YYYY-XXX (ex: M-2025-001)
 */
export async function generateMissionRef(
  prisma: PrismaClient,
  now: Date = new Date()
): Promise<string> {
  const year = now.getFullYear();
  
  // Transaction atomique : upsert + increment + read
  const counter = await prisma.$transaction(async (tx) => {
    // 1. Upsert le compteur pour l'année (crée si absent avec lastNumber=0)
    await tx.missionRefCounter.upsert({
      where: { year },
      create: {
        year,
        lastNumber: 0,
      },
      update: {}, // Pas de mise à jour, on va juste incrémenter
    });
    
    // 2. Incrémenter atomiquement le compteur
    const updated = await tx.missionRefCounter.update({
      where: { year },
      data: {
        lastNumber: {
          increment: 1,
        },
      },
    });
    
    return updated;
  });
  
  // 3. Générer la référence avec padding à 3 chiffres
  const refNumber = counter.lastNumber;
  const ref = `M-${year}-${String(refNumber).padStart(3, "0")}`;
  
  console.log(`[generateMissionRef] ✅ Référence générée atomiquement: ${ref} (année: ${year}, numéro: ${refNumber})`);
  
  return ref;
}

/**
 * Script de réparation : reconstruit les compteurs à partir des missions existantes
 * Utile si les compteurs sont cassés ou après migration
 */
export async function rebuildMissionRefCounters(prisma: PrismaClient): Promise<void> {
  console.log("[rebuildMissionRefCounters] 🔧 Début reconstruction des compteurs...");
  
  // Récupérer toutes les missions
  const missions = await prisma.mission.findMany({
    select: {
      ref: true,
    },
  });
  
  // Grouper par année et trouver le numéro max pour chaque année
  const maxByYear = new Map<number, number>();
  
  for (const mission of missions) {
    const match = mission.ref.match(/^M-(\d{4})-(\d+)$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const number = parseInt(match[2], 10);
      
      const currentMax = maxByYear.get(year) || 0;
      if (number > currentMax) {
        maxByYear.set(year, number);
      }
    }
  }
  
  // Mettre à jour ou créer les compteurs
  for (const [year, maxNumber] of maxByYear.entries()) {
    await prisma.missionRefCounter.upsert({
      where: { year },
      create: {
        year,
        lastNumber: maxNumber,
      },
      update: {
        lastNumber: maxNumber,
      },
    });
    
    console.log(`[rebuildMissionRefCounters] ✅ Année ${year}: compteur mis à ${maxNumber}`);
  }
  
  console.log(`[rebuildMissionRefCounters] ✅ Reconstruction terminée pour ${maxByYear.size} année(s)`);
}

