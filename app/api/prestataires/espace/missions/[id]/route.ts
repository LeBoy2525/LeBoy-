import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById } from "@/lib/dataAccess";
import { getPrestataireByEmail } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const missionId = parseInt(resolvedParams.id);
    if (isNaN(missionId)) {
      return NextResponse.json(
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    console.log("🔍 Recherche mission ID:", missionId);
    const mission = await getMissionById(missionId);
    if (!mission) {
      console.log("❌ Mission non trouvée pour ID:", missionId);
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    console.log("✅ Mission trouvée:", mission.ref, "prestataireId:", mission.prestataireId);

    // Vérifier que le prestataire a accès à cette mission
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire) {
      console.log("❌ Prestataire non trouvé pour email:", userEmail);
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    console.log("✅ Prestataire trouvé:", prestataire.ref, "ID:", prestataire.id);

    if (mission.prestataireId !== prestataire.id) {
      console.log("❌ Accès refusé - mission.prestataireId:", mission.prestataireId, "prestataire.id:", prestataire.id);
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 403 }
      );
    }

    console.log("✅ Accès autorisé, retour de la mission");
    return NextResponse.json({ mission }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
