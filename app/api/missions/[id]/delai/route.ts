import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, updateMissionStatus, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PATCH: Définir le délai maximal
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
    const mission = await getMissionById(missionId);

    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { delaiMaximal } = body;

    if (!delaiMaximal || delaiMaximal <= 0) {
      return NextResponse.json(
        { error: "Délai invalide." },
        { status: 400 }
      );
    }

    mission.delaiMaximal = delaiMaximal;

    // Calculer la date limite à partir de la date de prise en charge
    if (mission.datePriseEnCharge) {
      const datePriseEnCharge = new Date(mission.datePriseEnCharge);
      datePriseEnCharge.setHours(datePriseEnCharge.getHours() + delaiMaximal);
      mission.dateLimiteMission = datePriseEnCharge.toISOString();
    }

    await updateMissionStatus(missionId, mission.status, userEmail);
    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        mission,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/missions/[id]/delai PATCH:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

