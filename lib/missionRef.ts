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

  try {
    const counter = await prisma.missionRefCounter.upsert({
      where: { year },
      update: { lastNumber: { increment: 1 } },
      create: { year, lastNumber: 1 },
      select: { lastNumber: true },
    });

    const seq = counter.lastNumber;
    return `M-${year}-${String(seq).padStart(3, "0")}`;
  } catch (e: any) {
    // Fallback si table manquante (P2021 / 42P01)
    const msg = String(e?.message || "");
    const code = e?.code;

    const isMissingTable =
      code === "P2021" ||
      msg.includes("does not exist") ||
      msg.includes("mission_ref_counters");

    if (!isMissingTable) throw e;

    // fallback: prendre la dernière ref en DB et incrémenter avec un random pour éviter collisions parallèles
    console.warn(`[generateMissionRef] ⚠️ Table mission_ref_counters absente, utilisation du fallback`);
    
    // Récupérer toutes les refs de l'année pour trouver le max réellement utilisé
    const allMissions = await prisma.mission.findMany({
      where: { ref: { startsWith: `M-${year}-` } },
      select: { ref: true },
      orderBy: { createdAt: "desc" },
      take: 100, // Limiter pour performance
    });

    let maxSeq = 0;
    for (const mission of allMissions) {
      const match = mission.ref.match(/^M-\d{4}-(\d+)$/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }
    
    // Utiliser timestamp + random pour garantir l'unicité même en parallèle
    const timestamp = Date.now() % 100000; // 5 derniers chiffres du timestamp
    const random = Math.floor(Math.random() * 1000); // Random 0-999
    const nextSeq = maxSeq + 1 + (timestamp % 100) + (random % 10);
    
    // S'assurer que le numéro ne dépasse pas 999 (format XXX)
    const finalSeq = Math.min(nextSeq, 999);
    
    const ref = `M-${year}-${String(finalSeq).padStart(3, "0")}`;
    console.warn(`[generateMissionRef] ⚠️ Fallback généré: ${ref} (max trouvé: ${maxSeq}, timestamp: ${timestamp}, random: ${random})`);
    
    return ref;
  }
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
    await (prisma as any).missionRefCounter.upsert({
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

