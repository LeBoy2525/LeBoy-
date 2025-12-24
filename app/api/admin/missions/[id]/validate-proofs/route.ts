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

    // Récupérer la mission Prisma pour mettre à jour
    const { getMissionById: getMissionByIdDB, updateMission } = await import("@/repositories/missionsRepo");
    const { mapInternalStateToStatus } = await import("@/lib/types");
    const missionPrisma = await getMissionByIdDB(missionUuid);
    
    if (!missionPrisma) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    if (validate === true || shouldAutoValidate) {
      // Valider toutes les preuves
      const proofs = missionPrisma.proofs ? JSON.parse(JSON.stringify(missionPrisma.proofs)) : [];
      proofs.forEach((proof: any) => {
        proof.validatedByAdmin = true;
        proof.validatedAt = new Date().toISOString();
        // Calculer la date d'archivage (3 mois après validation)
        const archiveDate = new Date();
        archiveDate.setMonth(archiveDate.getMonth() + 3);
        proof.archivedAt = archiveDate.toISOString();
      });

      const updateData: any = {
        proofs: proofs,
        proofValidatedByAdmin: true,
        proofValidatedAt: new Date(),
      };

      // Si validateForClient est true OU si c'est un paiement 100%, donner accès au client et valider la mission
      if (validateForClient === true || shouldAutoValidate) {
        updateData.proofValidatedForClient = true;
        updateData.proofValidatedForClientAt = new Date();
        updateData.internalState = "ADMIN_CONFIRMED" as any;
        updateData.status = mapInternalStateToStatus("ADMIN_CONFIRMED" as any);
        
        const updatedMissionPrisma = await updateMission(missionUuid, updateData);
        
        // Créer une mise à jour pour le client
        await addMissionUpdate(missionUuid, {
          type: "status_change",
          author: "admin",
          authorEmail: userEmail,
          content: "✅ Mission validée ! Vous pouvez maintenant consulter les preuves d'accomplissement et télécharger le rapport de mission.",
        });
        
        // Envoyer une notification email au client
        try {
          const { sendNotificationEmail } = await import("@/lib/emailService");
          const demande = await getDemandeById(updatedMissionPrisma.demandeId);
          const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
          const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
          
          if (demande && updatedMissionPrisma) {
            await sendNotificationEmail(
              "mission-completed",
              { email: demande.email, name: demande.fullName },
              {
                missionRef: updatedMissionPrisma.ref,
                clientName: demande.fullName,
                serviceType: updatedMissionPrisma.serviceType,
                dateCloture: updatedMissionPrisma.dateFin?.toISOString() || new Date().toISOString(),
                platformUrl,
                missionId: missionUuid, // Utiliser l'UUID
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
        updateData.proofValidatedForClient = false;
        await updateMission(missionUuid, updateData);
        // Le statut reste "PROVIDER_VALIDATION_SUBMITTED"
      }
    } else {
      // Rejeter les preuves
      const proofs = missionPrisma.proofs ? JSON.parse(JSON.stringify(missionPrisma.proofs)) : [];
      proofs.forEach((proof: any) => {
        proof.validatedByAdmin = false;
        proof.validatedAt = undefined;
      });

      await updateMission(missionUuid, {
        proofs: proofs,
        proofValidatedByAdmin: false,
        proofValidatedAt: null,
        proofValidatedForClient: false,
        internalState: "IN_PROGRESS" as any,
        status: mapInternalStateToStatus("IN_PROGRESS" as any),
      });
    }

    // Recharger la mission mise à jour pour la réponse
    const updatedMissionPrisma = await getMissionByIdDB(missionUuid);
    const { convertPrismaMissionToJSON } = await import("@/lib/dataAccess");
    const updatedMission = updatedMissionPrisma ? convertPrismaMissionToJSON(updatedMissionPrisma) : mission;

    return NextResponse.json(
      {
        success: true,
        message: validate
          ? "Preuves validées. Le client peut maintenant les consulter."
          : "Preuves rejetées. Le prestataire peut les corriger.",
        mission: updatedMission,
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

