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

    // Vérifier que la mission est archivée
    if (!mission.archived) {
      return NextResponse.json(
        { error: "Cette mission n'est pas archivée." },
        { status: 400 }
      );
    }

    // Vérifier que la mission n'a pas été archivée depuis plus de 30 jours
    if (mission.archivedAt) {
      const archivedDate = new Date(mission.archivedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        return NextResponse.json(
          { error: "Cette mission ne peut plus être restaurée (plus de 30 jours)." },
          { status: 400 }
        );
      }
    }

    // Restaurer la mission
    mission.archived = false;
    mission.archivedAt = undefined;
    mission.archivedBy = undefined;

    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        message: "Mission restaurée avec succès.",
        mission,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]/restore:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

