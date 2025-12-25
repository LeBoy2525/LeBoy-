import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { getPrestataireByEmail } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "prestataire") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
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

    // Vérifier que c'est bien le prestataire de la mission
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire || prestataire.id !== mission.prestataireId) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 403 }
      );
    }

    // Archiver la mission via Prisma
    const { archiveMission } = await import("@/repositories/missionsRepo");
    const archivedMission = await archiveMission(missionUuid, userEmail);
    
    if (!archivedMission) {
      return NextResponse.json(
        { error: "Erreur lors de l'archivage." },
        { status: 500 }
      );
    }
    
    const { convertPrismaMissionToJSON } = await import("@/lib/dataAccess");
    const missionArchived = convertPrismaMissionToJSON(archivedMission);

    return NextResponse.json(
      {
        success: true,
        message: "Mission archivée avec succès.",
        mission: missionArchived,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]/archive:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "prestataire") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
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

    // Vérifier que c'est bien le prestataire de la mission
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire || prestataire.id !== mission.prestataireId) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 403 }
      );
    }

    // Soft delete de la mission via Prisma
    const { updateMission } = await import("@/repositories/missionsRepo");
    const now = new Date();
    const deletedMission = await updateMission(missionUuid, {
      deleted: true,
      deletedAt: now,
      deletedBy: "prestataire",
    } as any);
    
    if (!deletedMission) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Mission supprimée avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]/archive DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

