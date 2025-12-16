import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string; phaseId: string }>;
};

// PATCH: Mettre à jour une phase
export async function PATCH(req: Request, { params }: RouteParams) {
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
    const phaseId = resolvedParams.phaseId;
    const mission = await getMissionById(missionId);

    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { phase: updatedPhase } = body;

    if (!mission.phases) {
      mission.phases = [];
    }

    const phaseIndex = mission.phases.findIndex((p) => p.id === phaseId);
    if (phaseIndex === -1) {
      return NextResponse.json(
        { error: "Phase non trouvée." },
        { status: 404 }
      );
    }

    mission.phases[phaseIndex] = updatedPhase;

    // Recalculer la progression basée sur les phases
    const completedPhases = mission.phases.filter((p) => p.completed).length;
    const totalPhases = mission.phases.length;
    
    // Progression de base (20% pour prise en charge/en cours) + progression des phases (20% à 80%)
    const baseProgress = (mission.internalState === "ADVANCE_SENT" || mission.internalState === "IN_PROGRESS") ? 20 : 10;
    const phasesProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 80) : 0;
    mission.currentProgress = Math.min(baseProgress + phasesProgress, 100);

    // Sauvegarder sans changer le statut
    await saveMissions();

    return NextResponse.json({ phase: updatedPhase }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/missions/[id]/phases/[phaseId] PATCH:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

// DELETE: Supprimer une phase
export async function DELETE(_req: Request, { params }: RouteParams) {
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
    const phaseId = resolvedParams.phaseId;
    const mission = await getMissionById(missionId);

    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    if (!mission.phases) {
      return NextResponse.json(
        { error: "Phase non trouvée." },
        { status: 404 }
      );
    }

    mission.phases = mission.phases.filter((p) => p.id !== phaseId);

    // Recalculer la progression basée sur les phases
    const completedPhases = mission.phases.filter((p) => p.completed).length;
    const totalPhases = mission.phases.length;
    
    // Progression de base (20% pour prise en charge/en cours) + progression des phases (20% à 80%)
    const baseProgress = (mission.internalState === "ADVANCE_SENT" || mission.internalState === "IN_PROGRESS") ? 20 : 10;
    const phasesProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 80) : 0;
    mission.currentProgress = Math.min(baseProgress + phasesProgress, 100);

    // Sauvegarder sans changer le statut
    await saveMissions();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/missions/[id]/phases/[phaseId] DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

