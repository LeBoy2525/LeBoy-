import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { validateUUID } from "@/lib/uuidValidation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
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

    // Archiver la mission (admin peut archiver n'importe quelle mission)
    mission.archived = true;
    mission.archivedAt = new Date().toISOString();
    mission.archivedBy = "admin";

    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        message: "Mission archivée avec succès.",
        mission,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/[id]/archive:", error);
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

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
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

    // Soft delete de la mission (admin peut supprimer n'importe quelle mission)
    mission.deleted = true;
    mission.deletedAt = new Date().toISOString();
    mission.deletedBy = "admin";

    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        message: "Mission supprimée avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/[id]/archive DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

