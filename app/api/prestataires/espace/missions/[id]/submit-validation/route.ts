import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMissionInternalState, getMissionById, saveMissions } from "@/lib/dataAccess";
import { getPrestataireByEmail } from "@/lib/dataAccess";

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
        { error: "Vous n'êtes pas autorisé à soumettre cette mission pour validation." },
        { status: 403 }
      );
    }

    // Vérifier que la mission est en cours
    if (mission.internalState !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "La mission doit être en cours pour être soumise pour validation." },
        { status: 400 }
      );
    }

    // Vérifier que des preuves ont été uploadées
    if (!mission.proofs || mission.proofs.length === 0) {
      return NextResponse.json(
        { error: "Veuillez uploader au moins une preuve avant de soumettre pour validation." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { commentaire, commentairePrestataire } = body;

    // Enregistrer le commentaire du prestataire si fourni (supporter les deux formats)
    const commentaireFinal = commentairePrestataire || commentaire;
    if (commentaireFinal && commentaireFinal.trim()) {
      mission.commentairePrestataire = commentaireFinal.trim();
      // Stocker également dans une mise à jour de type "note"
      const { addMissionUpdate } = await import("@/lib/dataAccess");
      await addMissionUpdate(missionId, {
        type: "note",
        author: "prestataire",
        authorEmail: userEmail,
        content: `Résumé du travail effectué: ${commentaireFinal.trim()}`,
      });
    }

    // Mettre à jour la date de soumission des preuves
    const now = new Date().toISOString();
    if (!mission.proofSubmissionDate) {
      mission.proofSubmissionDate = now;
    }

    // Mettre à jour l'état interne vers PROVIDER_VALIDATION_SUBMITTED
    const updated = await updateMissionInternalState(missionId, "PROVIDER_VALIDATION_SUBMITTED", userEmail);

    if (!updated) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    await saveMissions();

    // Si c'est un paiement à 100%, validation automatique des preuves
    if (mission.avancePercentage === 100) {
      try {
        // Valider automatiquement toutes les preuves
        mission.proofs.forEach((proof) => {
          proof.validatedByAdmin = true;
          proof.validatedAt = new Date().toISOString();
          // Calculer la date d'archivage (3 mois après validation)
          const archiveDate = new Date();
          archiveDate.setMonth(archiveDate.getMonth() + 3);
          proof.archivedAt = archiveDate.toISOString();
        });

        mission.proofValidatedByAdmin = true;
        mission.proofValidatedAt = new Date().toISOString();
        mission.proofValidatedForClient = true;
        mission.proofValidatedForClientAt = new Date().toISOString();

        // Changer l'état interne vers ADMIN_CONFIRMED
        await updateMissionInternalState(missionId, "ADMIN_CONFIRMED", userEmail);

        // Créer une mise à jour pour le client
        const { addMissionUpdate } = await import("@/lib/dataAccess");
        await addMissionUpdate(missionId, {
          type: "status_change",
          author: "admin",
          authorEmail: "system", // Système automatique
          content: "✅ Mission validée automatiquement (paiement 100%) ! Vous pouvez maintenant consulter les preuves d'accomplissement et télécharger le rapport de mission.",
        });

        // Envoyer une notification email au client
        try {
          const { sendNotificationEmail } = await import("@/lib/emailService");
          const { getDemandeById } = await import("@/lib/dataAccess");
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
          console.error("Erreur envoi email notification client (100%):", error);
          // Ne pas bloquer la validation si l'email échoue
        }

        await saveMissions();
      } catch (error) {
        console.error("Erreur validation automatique (100%):", error);
        // Ne pas bloquer la soumission si la validation automatique échoue
      }
    }

    // Ajouter une notification pour l'admin
    try {
      const { addAdminNotification } = await import("@/lib/adminNotificationsStore");
      
      if (prestataire) {
        addAdminNotification({
          type: "mission_validation_submitted",
          title: "Preuves soumises pour validation",
          message: `Le prestataire ${prestataire.nomEntreprise || prestataire.nomContact} a soumis ${mission.proofs?.length || 0} preuve(s) pour la mission ${mission.ref}.`,
          missionId: mission.id,
          missionRef: mission.ref,
          demandeId: mission.demandeId,
          prestataireName: prestataire.nomEntreprise || prestataire.nomContact,
        });
      }
    } catch (error) {
      console.error("Erreur ajout notification admin:", error);
      // Ne pas bloquer la soumission si la notification échoue
    }

    // Envoyer une notification email à l'admin
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const { getAdminEmail } = await import("@/lib/auth");
      
      if (prestataire) {
        await sendNotificationEmail(
          "proofs-submitted",
          { email: getAdminEmail() },
          {
            missionRef: mission.ref,
            providerName: prestataire.nomEntreprise || prestataire.nomContact,
            nombrePreuves: mission.proofs?.length || 0,
            commentaire: commentaireFinal || undefined,
          },
          "fr"
        );
      }
    } catch (error) {
      console.error("Erreur envoi email notification admin:", error);
      // Ne pas bloquer la soumission si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        mission: updated,
        message: "Mission soumise pour validation avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]/submit-validation:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

