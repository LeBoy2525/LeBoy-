import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMissionInternalState, getMissionById, saveMissions, updateMissionStatus } from "@/lib/dataAccess";
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

    // Vérifier que la mission est dans l'état PROVIDER_VALIDATION_SUBMITTED
    if (mission.internalState !== "PROVIDER_VALIDATION_SUBMITTED") {
      return NextResponse.json(
        { error: "La mission doit être soumise pour validation par le prestataire." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { validateForClient } = body;

    // Valider toutes les preuves
    if (mission.proofs && mission.proofs.length > 0) {
      const now = new Date().toISOString();
      mission.proofs.forEach((proof) => {
        proof.validatedByAdmin = true;
        proof.validatedAt = now;
        // Calculer la date d'archivage (3 mois après validation)
        const archiveDate = new Date();
        archiveDate.setMonth(archiveDate.getMonth() + 3);
        proof.archivedAt = archiveDate.toISOString();
      });
    }

    mission.proofValidatedByAdmin = true;
    mission.proofValidatedAt = new Date().toISOString();

    // Si le client doit voir les preuves
    if (validateForClient) {
      mission.proofValidatedForClient = true;
      mission.proofValidatedForClientAt = new Date().toISOString(); // Enregistrer la date pour calculer les 24h
    }

    // Mettre à jour l'état interne vers ADMIN_CONFIRMED
    const updated = await updateMissionInternalState(missionId, "ADMIN_CONFIRMED", userEmail);

    if (!updated) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    // Créer une mise à jour pour le client si validateForClient est true
    if (validateForClient) {
      const { addMissionUpdate } = await import("@/lib/dataAccess");
      
      await addMissionUpdate(missionId, {
        type: "status_change",
        author: "admin",
        authorEmail: userEmail,
        content: "✅ Mission validée ! Vous pouvez maintenant consulter les preuves d'accomplissement et télécharger le rapport de mission.",
      });
    }

    await saveMissions();

    // Envoyer une notification email au client si validateForClient est true
    if (validateForClient) {
      try {
        const { sendNotificationEmail } = await import("@/lib/emailService");
        const { demandesStore } = await import("@/lib/demandesStore");
        const demande = demandesStore.find((d) => d.id === mission.demandeId);
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
        // Ne pas bloquer la validation si l'email échoue
      }
    }

    return NextResponse.json(
      {
        success: true,
        mission: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/[id]/validate:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

// Route pour clôturer la mission (après que le client ait consulté les preuves)
export async function PATCH(req: Request, { params }: RouteParams) {
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

    // Vérifier que la mission est terminée
    if (mission.status !== "termine_icd_canada") {
      return NextResponse.json(
        { error: "La mission doit être terminée pour être clôturée." },
        { status: 400 }
      );
    }

    // Mettre à jour le statut vers "cloture"
    const updated = await updateMissionStatus(missionId, "cloture", userEmail);

    if (!updated) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        mission: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/[id]/validate PATCH:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

