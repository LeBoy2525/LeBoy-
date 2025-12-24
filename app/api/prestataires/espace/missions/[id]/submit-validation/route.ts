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
      await addMissionUpdate(missionUuid, {
        type: "note",
        author: "prestataire",
        authorEmail: userEmail,
        content: `Résumé du travail effectué: ${commentaireFinal.trim()}`,
      });
    }

    // Mettre à jour la mission via Prisma avec la date de soumission et l'état
    const { updateMission } = await import("@/repositories/missionsRepo");
    const { mapInternalStateToStatus } = await import("@/lib/types");
    const now = new Date();
    const newInternalState = "PROVIDER_VALIDATION_SUBMITTED";
    
    // Récupérer la mission Prisma pour mettre à jour les preuves
    const { getMissionById: getMissionByIdDB } = await import("@/repositories/missionsRepo");
    const missionPrisma = await getMissionByIdDB(missionUuid);
    
    if (!missionPrisma) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    // Mettre à jour les preuves avec le commentaire si nécessaire
    const proofs = missionPrisma.proofs ? JSON.parse(JSON.stringify(missionPrisma.proofs)) : [];
    const updatedMissionPrisma = await updateMission(missionUuid, {
      commentairePrestataire: commentaireFinal && commentaireFinal.trim() ? commentaireFinal.trim() : undefined,
      proofSubmissionDate: now.toISOString(),
      proofs: proofs.length > 0 ? proofs : undefined,
      internalState: newInternalState as any,
      status: mapInternalStateToStatus(newInternalState as any),
    });

    if (!updatedMissionPrisma) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    // Convertir en JSON pour la réponse
    const { convertPrismaMissionToJSON } = await import("@/lib/dataAccess");
    const updated = convertPrismaMissionToJSON(updatedMissionPrisma);

    // Plus besoin de saveMissions() car on utilise Prisma directement

    // Si c'est un paiement à 100%, validation automatique des preuves
    if (updatedMissionPrisma.avancePercentage === 100) {
      try {
        // Valider automatiquement toutes les preuves
        const proofs = updatedMissionPrisma.proofs ? JSON.parse(JSON.stringify(updatedMissionPrisma.proofs)) : [];
        proofs.forEach((proof: any) => {
          proof.validatedByAdmin = true;
          proof.validatedAt = new Date().toISOString();
          // Calculer la date d'archivage (3 mois après validation)
          const archiveDate = new Date();
          archiveDate.setMonth(archiveDate.getMonth() + 3);
          proof.archivedAt = archiveDate.toISOString();
        });

        // Mettre à jour la mission avec validation automatique
        const validatedMissionPrisma = await updateMission(missionUuid, {
          proofs: proofs,
          proofValidatedByAdmin: true,
          proofValidatedAt: new Date(),
          proofValidatedForClient: true,
          proofValidatedForClientAt: new Date(),
          internalState: "ADMIN_CONFIRMED" as any,
          status: mapInternalStateToStatus("ADMIN_CONFIRMED" as any),
        });

        // Créer une mise à jour pour le client
        const { addMissionUpdate } = await import("@/lib/dataAccess");
        await addMissionUpdate(missionUuid, {
          type: "status_change",
          author: "admin",
          authorEmail: "system", // Système automatique
          content: "✅ Mission validée automatiquement (paiement 100%) ! Vous pouvez maintenant consulter les preuves d'accomplissement et télécharger le rapport de mission.",
        });

        // Envoyer une notification email au client
        try {
          const { sendNotificationEmail } = await import("@/lib/emailService");
          const { getDemandeById } = await import("@/lib/dataAccess");
          const demande = await getDemandeById(updatedMissionPrisma.demandeId);
          const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
          const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
          
          if (demande && validatedMissionPrisma) {
            await sendNotificationEmail(
              "mission-completed",
              { email: demande.email, name: demande.fullName },
              {
                missionRef: validatedMissionPrisma.ref,
                clientName: demande.fullName,
                serviceType: validatedMissionPrisma.serviceType,
                dateCloture: validatedMissionPrisma.dateFin?.toISOString() || new Date().toISOString(),
                platformUrl,
                missionId: missionUuid, // Utiliser l'UUID
              },
              "fr"
            );
          }
        } catch (error) {
          console.error("Erreur envoi email notification client (100%):", error);
          // Ne pas bloquer la validation si l'email échoue
        }
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
          missionId: missionUuid, // Utiliser l'UUID
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

