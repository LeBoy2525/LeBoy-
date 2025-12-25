


import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addMissionUpdate, getMissionById } from "@/lib/dataAccess";
import { getPrestataireByEmail } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "prestataire") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

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

    // Vérifier que le prestataire a accès
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire || mission.prestataireId !== prestataire.id) {
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { type, content, fileUrl } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: "Type et contenu requis." },
        { status: 400 }
      );
    }

    const update = await addMissionUpdate(missionUuid, {
      type,
      author: "prestataire",
      authorEmail: userEmail,
      content,
      fileUrl,
    });

    if (!update) {
      return NextResponse.json(
        { error: "Erreur lors de l'ajout de la mise à jour." },
        { status: 500 }
      );
    }

    // TODO: Envoyer notification au client

    return NextResponse.json(
      {
        success: true,
        update,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]/update:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}