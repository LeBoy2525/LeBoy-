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
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    const missions = (await getMissionsByPrestataire(prestataire.id)).filter(
      (m) => !m.deleted && !m.archived
    );
    
    console.log(`🔍 Prestataire trouvé: ${prestataire.email} (ID: ${prestataire.id})`);
    console.log(`🔍 Missions trouvées: ${missions.length}`);
    missions.forEach((m) => {
      console.log(`  - ${m.ref} (${m.status})`);
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
