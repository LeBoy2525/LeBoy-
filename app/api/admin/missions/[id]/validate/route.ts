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

    // Vérifier que la mission est dans l'état PROVIDER_VALIDATION_SUBMITTED
    if (mission.internalState !== "PROVIDER_VALIDATION_SUBMITTED") {
      return NextResponse.json(
        { error: "La mission doit être soumise pour validation par le prestataire." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { validateForClient } = body;

    // Récupérer la mission Prisma pour mettre à jour
    const { getMissionById: getMissionByIdDB, updateMission } = await import("@/repositories/missionsRepo");
    const { mapInternalStateToStatus } = await import("@/lib/types");
    const missionPrisma = await getMissionByIdDB(missionUuid);
    
    if (!missionPrisma) {
      return NextResponse.json(
        { error: "Mission non trouvée dans la base de données." },
        { status: 404 }
      );
    }

    // Valider toutes les preuves
    const proofs = missionPrisma.proofs ? JSON.parse(JSON.stringify(missionPrisma.proofs)) : [];
    if (proofs.length > 0) {
      const now = new Date().toISOString();
      proofs.forEach((proof: any) => {
        proof.validatedByAdmin = true;
        proof.validatedAt = now;
        // Calculer la date d'archivage (3 mois après validation)
        const archiveDate = new Date();
        archiveDate.setMonth(archiveDate.getMonth() + 3);
        proof.archivedAt = archiveDate.toISOString();
      });
    }

    const updateData: any = {
      proofs: proofs,
      proofValidatedByAdmin: true,
      proofValidatedAt: new Date(),
      internalState: "ADMIN_CONFIRMED" as any,
      status: mapInternalStateToStatus("ADMIN_CONFIRMED" as any),
    };

    // Si le client doit voir les preuves
    if (validateForClient) {
      updateData.proofValidatedForClient = true;
      updateData.proofValidatedForClientAt = new Date();
    }

    // Mettre à jour via Prisma
    const updatedMissionPrisma = await updateMission(missionUuid, updateData);

    if (!updatedMissionPrisma) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    // Convertir en JSON pour la réponse
    const { convertPrismaMissionToJSON } = await import("@/lib/dataAccess");
    const updated = convertPrismaMissionToJSON(updatedMissionPrisma);

    // Créer une mise à jour pour le client si validateForClient est true
    if (validateForClient) {
      const { addMissionUpdate } = await import("@/lib/dataAccess");
      
      await addMissionUpdate(missionUuid, {
        type: "status_change",
        author: "admin",
        authorEmail: userEmail,
        content: "✅ Mission validée ! Vous pouvez maintenant consulter les preuves d'accomplissement et télécharger le rapport de mission.",
      });
    }

    // Envoyer une notification email au client si validateForClient est true
    if (validateForClient) {
      try {
        const { sendNotificationEmail } = await import("@/lib/emailService");
        const { getDemandeById } = await import("@/lib/dataAccess");
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

    // Vérifier que la mission est terminée
    if (mission.status !== "termine_icd_canada") {
      return NextResponse.json(
        { error: "La mission doit être terminée pour être clôturée." },
        { status: 400 }
      );
    }

    // Mettre à jour le statut vers "cloture"
    const updated = await updateMissionStatus(missionUuid, "cloture", userEmail);

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

