import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionsByPrestataire } from "@/lib/dataAccess";
import { getPrestataireByEmail } from "@/lib/dataAccess";

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

    // Récupérer uniquement les missions archivées (pas supprimées)
    const allMissions = await getMissionsByPrestataire(prestataire.id);
    const archivedMissions = allMissions.filter(
      (m) => m.archived && !m.deleted && m.archivedBy === "prestataire"
    );

    // Filtrer les missions archivées depuis moins de 30 jours
    const now = new Date();
    const missionsInTrash = archivedMissions.filter((m) => {
      if (!m.archivedAt) return false;
      const archivedDate = new Date(m.archivedAt);
      const daysDiff = (now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    return NextResponse.json(
      {
        missions: missionsInTrash,
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
    console.error("Erreur /api/prestataires/espace/missions/archived:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

