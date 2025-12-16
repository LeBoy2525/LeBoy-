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

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé. Seuls les administrateurs peuvent noter un prestataire." },
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

    // Vérifier que la mission est validée et que le solde est payé
    if (mission.internalState !== "ADMIN_CONFIRMED" && mission.internalState !== "COMPLETED") {
      return NextResponse.json(
        { error: "Vous ne pouvez noter qu'un prestataire pour une mission validée." },
        { status: 400 }
      );
    }

    if (!mission.soldeVersee) {
      return NextResponse.json(
        { error: "Vous ne pouvez noter un prestataire qu'après le paiement complet." },
        { status: 400 }
      );
    }

    if (!mission.prestataireId) {
      return NextResponse.json(
        { error: "Aucun prestataire assigné à cette mission." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { noteAdminPourPrestataire, commentaireAdminPourPrestataire } = body;

    if (!noteAdminPourPrestataire || noteAdminPourPrestataire < 1 || noteAdminPourPrestataire > 5) {
      return NextResponse.json(
        { error: "La note doit être comprise entre 1 et 5." },
        { status: 400 }
      );
    }

    // Enregistrer la note
    mission.noteAdminPourPrestataire = noteAdminPourPrestataire;
    mission.commentaireAdminPourPrestataire = commentaireAdminPourPrestataire || undefined;

    // Mettre à jour la note moyenne du prestataire
    try {
      const { recalculatePrestataireRating } = await import("@/lib/dataAccess");
      if (mission.prestataireId) {
        await recalculatePrestataireRating(mission.prestataireId);
      }
    } catch (error) {
      console.error("Erreur mise à jour note moyenne prestataire:", error);
      // Ne pas bloquer l'enregistrement de la note si cette mise à jour échoue
    }

    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        message: "Note enregistrée avec succès.",
        mission,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/[id]/rate-provider:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

