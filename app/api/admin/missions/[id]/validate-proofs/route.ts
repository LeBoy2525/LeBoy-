import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, saveMissions, updateMissionInternalState, addMissionUpdate } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { getDemandeById } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST: Valider les preuves et donner accès au client (admin uniquement)
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
    const mission = await getMissionById(missionId);

    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    if (!mission.proofs || mission.proofs.length === 0) {
      return NextResponse.json(
        { error: "Aucune preuve à valider." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { validate, rejectReason, validateForClient } = body;

    // Si c'est un paiement à 100%, validation automatique des preuves
    // Note: La validation automatique devrait normalement avoir déjà été faite dans submit-validation
    // Mais si l'admin appelle cette route manuellement, on s'assure que ça fonctionne aussi
    const isFullPayment = mission.avancePercentage === 100;
    
    // Pour 100%, on valide automatiquement et on donne accès au client directement
    // Sauf si validate === false (rejet explicite)
    const shouldAutoValidate = isFullPayment && validate !== false;

    if (validate === true || shouldAutoValidate) {
      // Valider toutes les preuves
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

      // Si validateForClient est true OU si c'est un paiement 100%, donner accès au client et valider la mission
      if (validateForClient === true || shouldAutoValidate) {
        mission.proofValidatedForClient = true;
        mission.proofValidatedForClientAt = new Date().toISOString(); // Enregistrer la date pour calculer les 24h
        // Changer l'état interne vers ADMIN_CONFIRMED
        await updateMissionInternalState(missionId, "ADMIN_CONFIRMED", userEmail);
        
        // Créer une mise à jour pour le client
        await addMissionUpdate(missionId, {
          type: "status_change",
          author: "admin",
          authorEmail: userEmail,
          content: "✅ Mission validée ! Vous pouvez maintenant consulter les preuves d'accomplissement et télécharger le rapport de mission.",
        });
        
        // Envoyer une notification email au client
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
          // Ne pas bloquer la validation si l'email échoue
        }
      } else {
        // Juste valider les preuves, mais ne pas donner accès au client encore
        mission.proofValidatedForClient = false;
        // Le statut reste "PROVIDER_VALIDATION_SUBMITTED"
      }
    } else {
      // Rejeter les preuves
      mission.proofs.forEach((proof) => {
        proof.validatedByAdmin = false;
        proof.validatedAt = undefined;
      });

      mission.proofValidatedByAdmin = false;
      mission.proofValidatedAt = undefined;
      mission.proofValidatedForClient = false;

      // Remettre l'état interne à IN_PROGRESS pour que le prestataire puisse corriger
      await updateMissionInternalState(missionId, "IN_PROGRESS", userEmail);
    }

    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        message: validate
          ? "Preuves validées. Le client peut maintenant les consulter."
          : "Preuves rejetées. Le prestataire peut les corriger.",
        mission,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/[id]/validate-proofs:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

