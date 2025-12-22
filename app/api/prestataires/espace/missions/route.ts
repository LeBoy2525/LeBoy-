import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionsByPrestataire, getPrestataireByEmail } from "@/lib/dataAccess";

export async function GET() {
  const traceId = `PREST-${Date.now()}`;
  
  try {
    console.log(`[${traceId}] ========================================`);
    console.log(`[${traceId}] 🔍 DIAGNOSTIC API PRESTATAIRE MISSIONS`);
    console.log(`[${traceId}] ========================================`);
    
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      console.error(`[${traceId}] ❌ Non authentifié`);
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    console.log(`[${traceId}] 📧 Email prestataire (session): ${userEmail}`);

    // Trouver le prestataire par email
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire) {
      console.error(`[${traceId}] ❌ Prestataire non trouvé pour email: ${userEmail}`);
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    // ============================================
    // DIAGNOSTIC 1: PRESTATAIRE COURANT
    // ============================================
    console.log(`[${traceId}] ✅ Prestataire trouvé:`);
    console.log(`[${traceId}]   - email: ${prestataire.email}`);
    console.log(`[${traceId}]   - id (numérique): ${prestataire.id} (type: ${typeof prestataire.id})`);
    console.log(`[${traceId}]   - ref: ${prestataire.ref}`);
    
    // ============================================
    // DIAGNOSTIC 2: QUERY PRISMA UTILISÉE
    // ============================================
    console.log(`[${traceId}] 🔍 Query Prisma: getMissionsByPrestataire(${prestataire.id})`);
    console.log(`[${traceId}]   WHERE prestataireId = ${prestataire.id} AND deleted = false`);
    
    // Récupérer toutes les missions (y compris celles qui pourraient être filtrées)
    const allMissions = await getMissionsByPrestataire(prestataire.id);
    
    // ============================================
    // DIAGNOSTIC 3: NOMBRE DE MISSIONS RENVOYÉES
    // ============================================
    console.log(`[${traceId}] 📋 Total missions récupérées (avant filtrage): ${allMissions.length}`);
    
    // ============================================
    // DIAGNOSTIC 4: STATUTS RENVOYÉS
    // ============================================
    const statutsCount: Record<string, number> = {};
    allMissions.forEach((m, idx) => {
      const statut = m.status || "unknown";
      statutsCount[statut] = (statutsCount[statut] || 0) + 1;
      
      console.log(`[${traceId}]   ${idx + 1}. Mission ${m.ref}:`);
      console.log(`[${traceId}]      - prestataireId: ${m.prestataireId} (type: ${typeof m.prestataireId})`);
      console.log(`[${traceId}]      - status: ${m.status}`);
      console.log(`[${traceId}]      - internalState: ${m.internalState}`);
      console.log(`[${traceId}]      - deleted: ${m.deleted}`);
      console.log(`[${traceId}]      - archived: ${m.archived}`);
      
      // Vérifier match prestataireId
      const match = m.prestataireId === prestataire.id;
      if (!match) {
        console.warn(`[${traceId}]      ⚠️ prestataireId mismatch! Attendu: ${prestataire.id}, Reçu: ${m.prestataireId}`);
      }
    });
    
    console.log(`[${traceId}] 📊 Répartition par statut:`);
    Object.entries(statutsCount).forEach(([statut, count]) => {
      console.log(`[${traceId}]   - ${statut}: ${count}`);
    });
    
    // Filtrer les missions non supprimées et non archivées
    const missions = allMissions.filter(
      (m) => !m.deleted && !m.archived
    );
    
    console.log(`[${traceId}] ✅ Missions après filtrage (non supprimées, non archivées): ${missions.length}`);
    
    // Vérifier aussi les missions qui ne matchent pas le prestataireId
    const missionsNonMatch = allMissions.filter(
      (m) => m.prestataireId !== prestataire.id && !m.deleted && !m.archived
    );
    if (missionsNonMatch.length > 0) {
      console.warn(`[${traceId}] ⚠️ ${missionsNonMatch.length} mission(s) avec prestataireId différent:`);
      missionsNonMatch.forEach((m) => {
        console.warn(`[${traceId}]   - ${m.ref} - prestataireId: ${m.prestataireId} (attendu: ${prestataire.id})`);
      });
    }
    
    console.log(`[${traceId}] ========================================`);

    return NextResponse.json(
      {
        missions,
        prestataire: {
          id: prestataire.id,
          ref: prestataire.ref,
          nomEntreprise: prestataire.nomEntreprise,
        },
      },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
