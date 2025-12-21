import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionsByPrestataire, getPrestataireByEmail } from "@/lib/dataAccess";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    // Trouver le prestataire par email
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire) {
      console.error(`[API MISSIONS] ❌ Prestataire non trouvé pour email: ${userEmail}`);
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    console.log(`[API MISSIONS] 🔍 Prestataire trouvé: ${prestataire.email} (ID numérique: ${prestataire.id}, type: ${typeof prestataire.id})`);
    
    // Récupérer toutes les missions (y compris celles qui pourraient être filtrées)
    const allMissions = await getMissionsByPrestataire(prestataire.id);
    console.log(`[API MISSIONS] 📋 Total missions récupérées (avant filtrage): ${allMissions.length}`);
    allMissions.forEach((m, idx) => {
      console.log(`[API MISSIONS]   ${idx + 1}. Mission ${m.ref} - prestataireId: ${m.prestataireId}, deleted: ${m.deleted}, archived: ${m.archived}, status: ${m.status}`);
    });
    
    const missions = allMissions.filter(
      (m) => !m.deleted && !m.archived
    );
    
    console.log(`[API MISSIONS] ✅ Missions après filtrage (non supprimées, non archivées): ${missions.length}`);
    missions.forEach((m) => {
      console.log(`[API MISSIONS]   - ${m.ref} (${m.status}, prestataireId: ${m.prestataireId})`);
    });

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
