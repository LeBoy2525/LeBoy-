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
    const missionId = parseInt(resolvedParams.id);
    if (isNaN(missionId)) {
      return NextResponse.json(
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionId);
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

    // Archiver la mission
    mission.archived = true;
    mission.archivedAt = new Date().toISOString();
    mission.archivedBy = "prestataire";

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
    const missionId = parseInt(resolvedParams.id);
    if (isNaN(missionId)) {
      return NextResponse.json(
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionId);
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

    // Soft delete de la mission
    mission.deleted = true;
    mission.deletedAt = new Date().toISOString();
    mission.deletedBy = "prestataire";

    await saveMissions();

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

