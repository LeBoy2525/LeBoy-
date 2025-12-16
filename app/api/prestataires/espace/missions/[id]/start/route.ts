import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMissionInternalState, getMissionById, saveMissions } from "@/lib/dataAccess";
import { getPrestataireByEmail } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST: Passer de "prise_en_charge" à "en_cours"
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
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

    // Vérifier que le prestataire est bien assigné à cette mission
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire || mission.prestataireId !== prestataire.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier cette mission." },
        { status: 403 }
      );
    }

    // Vérifier que la mission est dans l'état ADVANCE_SENT
    if (mission.internalState !== "ADVANCE_SENT") {
      return NextResponse.json(
        { error: "La mission doit avoir reçu l'avance pour être prise en charge." },
        { status: 400 }
      );
    }

    // Mettre à jour l'état interne vers IN_PROGRESS
    const updated = await updateMissionInternalState(missionId, "IN_PROGRESS", userEmail);

    if (!updated) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    await saveMissions();

    // Ajouter une notification pour l'admin
    try {
      const { addAdminNotification } = await import("@/lib/adminNotificationsStore");
      const notification = addAdminNotification({
        type: "mission_taken_over",
        title: "Mission prise en charge",
        message: `Le prestataire ${prestataire.nomEntreprise || prestataire.nomContact} a pris en charge la mission ${mission.ref}. La mission est maintenant en cours d'exécution.`,
        missionId: mission.id,
        missionRef: mission.ref,
        demandeId: mission.demandeId,
        prestataireName: prestataire.nomEntreprise || prestataire.nomContact,
      });
      console.log("✅ Notification admin créée:", notification);
    } catch (error) {
      console.error("❌ Erreur ajout notification admin:", error);
      // Ne pas bloquer la prise en charge si la notification échoue
    }

    return NextResponse.json(
      {
        success: true,
        mission: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]/start:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

