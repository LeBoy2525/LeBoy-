import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est bien le client de cette mission
    const role = await getUserRoleAsync(userEmail);
    if (role !== "client") {
      return NextResponse.json(
        { error: "Seuls les clients peuvent noter une mission." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const missionUuid = resolvedParams.id;
    
    // Validation UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!missionUuid || typeof missionUuid !== "string" || !UUID_REGEX.test(missionUuid)) {
      return NextResponse.json(
        { error: "UUID invalide." },
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

    // Vérifier que l'utilisateur est bien le client de cette mission
    if (mission.clientEmail !== userEmail) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à noter cette mission." },
        { status: 403 }
      );
    }

    // Vérifier que la mission est terminée
    if (mission.internalState !== "COMPLETED" && mission.internalState !== "ADMIN_CONFIRMED") {
      return NextResponse.json(
        { error: "Vous ne pouvez noter qu'une mission terminée." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { noteICD, commentaireICD } = body;

    if (!noteICD || noteICD < 1 || noteICD > 5) {
      return NextResponse.json(
        { error: "La note doit être comprise entre 1 et 5." },
        { status: 400 }
      );
    }

    // Enregistrer la note via Prisma
    const { updateMission } = await import("@/repositories/missionsRepo");
    const updatedMissionPrisma = await updateMission(missionUuid, {
      noteICD: noteICD,
      commentaireICD: commentaireICD || null,
      noteClient: noteICD, // Pour compatibilité
    } as any);

    if (!updatedMissionPrisma) {
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement de la note." },
        { status: 500 }
      );
    }

    // Convertir en JSON pour la réponse
    const { convertPrismaMissionToJSON } = await import("@/lib/dataAccess");
    const missionUpdated = convertPrismaMissionToJSON(updatedMissionPrisma);

    return NextResponse.json(
      {
        success: true,
        message: "Note enregistrée avec succès.",
        mission: missionUpdated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/espace-client/missions/[id]/rate:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

