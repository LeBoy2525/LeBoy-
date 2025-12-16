import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMissionInternalState, getMissionById, saveMissions, addMissionUpdate } from "@/lib/dataAccess";
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
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est un client
    const role = await getUserRoleAsync(userEmail);
    if (role !== "client") {
      return NextResponse.json(
        { error: "Accès réservé aux clients." },
        { status: 403 }
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

    // Vérifier que le client est bien le propriétaire de la mission
    if (mission.clientEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à fermer cette mission." },
        { status: 403 }
      );
    }

    // Vérifier que la mission est dans l'état ADMIN_CONFIRMED et que les preuves sont validées pour le client
    if (mission.internalState !== "ADMIN_CONFIRMED") {
      return NextResponse.json(
        { error: "La mission doit être validée par l'administrateur avant d'être fermée." },
        { status: 400 }
      );
    }

    if (!mission.proofValidatedForClient) {
      return NextResponse.json(
        { error: "Les preuves doivent être validées avant de fermer la mission." },
        { status: 400 }
      );
    }

    // Vérifier que la mission n'est pas déjà fermée
    if (mission.closedAt) {
      return NextResponse.json(
        { error: "Cette mission est déjà fermée." },
        { status: 400 }
      );
    }

    // S'assurer que le solde est payé (vérification de sécurité)
    if (!mission.soldeVersee) {
      return NextResponse.json(
        { error: "Le solde doit être versé avant de fermer la mission." },
        { status: 400 }
      );
    }

    // Marquer la mission comme fermée par le client
    mission.closedBy = "client";
    mission.closedAt = new Date().toISOString();

    // Mettre à jour l'état interne vers COMPLETED
    const updated = await updateMissionInternalState(missionId, "COMPLETED", userEmail);

    if (!updated) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    // Archiver automatiquement la mission terminée
    updated.archived = true;
    updated.archivedAt = new Date().toISOString();
    updated.archivedBy = "client";

    // Ajouter une mise à jour pour informer que le client a fermé la mission
    await addMissionUpdate(missionId, {
      type: "status_change",
      author: "client",
      authorEmail: userEmail,
      content: "Mission fermée et archivée par le client.",
    });

    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        message: "Mission fermée avec succès.",
        mission: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/espace-client/missions/[id]/close:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

