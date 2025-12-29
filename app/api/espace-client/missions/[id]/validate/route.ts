


import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMissionStatus, getMissionById } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { validateUUID } from "@/lib/uuidValidation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "client") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const missionUuid = resolvedParams.id;
    
    const uuidValidation = validateUUID(missionUuid, "Mission ID");
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { error: uuidValidation.error },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionUuid);
    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    if (mission.clientEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 403 }
      );
    }

    // Le client ne valide plus la mission, c'est l'admin qui valide
    // Cette route peut être supprimée ou utilisée pour autre chose
    return NextResponse.json(
      { error: "La validation de la mission est effectuée par l'administrateur." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur /api/espace-client/missions/[id]/validate:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}