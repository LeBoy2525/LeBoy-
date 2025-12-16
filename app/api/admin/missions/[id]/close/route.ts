import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMissionInternalState, getMissionById, saveMissions, addMissionUpdate } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { getDemandeById } from "@/lib/dataAccess";

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

    // Vérifier que la mission est dans l'état ADMIN_CONFIRMED et que le solde est payé
    if (mission.internalState !== "ADMIN_CONFIRMED") {
      return NextResponse.json(
        { error: "La mission doit être validée avant d'être clôturée." },
        { status: 400 }
      );
    }

    if (!mission.soldeVersee) {
      return NextResponse.json(
        { error: "Le solde doit être versé avant de clôturer la mission." },
        { status: 400 }
      );
    }

    // S'assurer que les preuves sont validées pour le client
    if (!mission.proofValidatedForClient) {
      mission.proofValidatedForClient = true;
      mission.proofValidatedForClientAt = new Date().toISOString();
    }

    // Vérifier si la mission n'est pas déjà fermée par le client
    if (mission.closedBy === "client" && mission.closedAt) {
      return NextResponse.json(
        { error: "Cette mission a déjà été fermée par le client." },
        { status: 400 }
      );
    }

    // Marquer la mission comme fermée par l'admin
    mission.closedBy = "admin";
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
    updated.archivedBy = "admin";

    // Ajouter une mise à jour pour informer que la mission a été fermée et archivée
    await addMissionUpdate(missionId, {
      type: "status_change",
      author: "admin",
      authorEmail: userEmail,
      content: "Mission fermée et archivée par l'administrateur.",
    });

    // Envoyer un email au client
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const demande = await getDemandeById(mission.demandeId);
      const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
      
      if (demande) {
        await sendNotificationEmail(
          "mission-completed",
          { email: demande.email, name: demande.fullName },
          {
            missionRef: mission.ref,
            clientName: demande.fullName,
            serviceType: mission.serviceType,
            dateCloture: mission.dateFin || new Date().toISOString(),
            platformUrl,
            missionId: mission.id,
          },
          "fr"
        );
      }
    } catch (error) {
      console.error("Erreur envoi email notification client:", error);
      // Ne pas bloquer la clôture si l'email échoue
    }

    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        message: "Mission clôturée avec succès. Le rapport est maintenant disponible pour le client.",
        mission: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/[id]/close:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

