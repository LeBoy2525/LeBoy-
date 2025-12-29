import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, updateMissionStatus, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import type { ExecutionPhase } from "@/lib/types";
import { validateUUID } from "@/lib/uuidValidation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST: Ajouter une phase
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

    const body = await req.json();
    const { phase } = body;

    if (!mission.phases) {
      mission.phases = [];
    }

    mission.phases.push(phase);
    await updateMissionStatus(missionUuid, mission.status, userEmail);
    await saveMissions();

    return NextResponse.json({ phase }, { status: 201 });
  } catch (error) {
    console.error("Erreur /api/missions/[id]/phases POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

