import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMissionStatus, getMissionById } from "@/lib/dataAccess";
import { getPrestataireByEmail } from "@/lib/dataAccess";
import { validateUUID } from "@/lib/uuidValidation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, { params }: RouteParams) {
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

    // Vérifier que le prestataire est bien assigné à cette mission
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire || mission.prestataireId !== prestataire.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à prendre en charge cette mission." },
        { status: 403 }
      );
    }

    // Vérifier que la mission a reçu l'avance
    if (mission.status !== "avance_versee_partenaire") {
      return NextResponse.json(
        { error: "La mission doit avoir reçu l'avance avant d'être prise en charge." },
        { status: 400 }
      );
    }

    // Mettre à jour le statut vers "en_cours_partenaire"
    const updated = await updateMissionStatus(missionUuid, "en_cours_partenaire", userEmail);

    if (!updated) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    // TODO: Envoyer une notification au client et à l'admin

    return NextResponse.json(
      {
        success: true,
        mission: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]/take-charge:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

