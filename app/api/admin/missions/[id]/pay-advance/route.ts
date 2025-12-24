import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMissionInternalState, getMissionById, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { getPrestataireById } from "@/lib/dataAccess";

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

    // Vérifier que la mission est dans l'état PAID_WAITING_TAKEOVER
    if (mission.internalState !== "PAID_WAITING_TAKEOVER") {
      return NextResponse.json(
        { error: "La mission doit être payée et en attente de démarrage pour verser l'avance." },
        { status: 400 }
      );
    }

    if (!mission.paiementEffectue) {
      return NextResponse.json(
        { error: "Le paiement client n'a pas été effectué." },
        { status: 400 }
      );
    }

    if (!mission.tarifPrestataire) {
      return NextResponse.json(
        { error: "Le tarif prestataire n'est pas défini." },
        { status: 400 }
      );
    }

    // Récupérer le pourcentage d'avance depuis le body (25, 50 ou 100)
    const body = await req.json().catch(() => ({}));
    const avancePercentage = body.avancePercentage || 50;
    
    if (avancePercentage !== 25 && avancePercentage !== 50 && avancePercentage !== 100) {
      return NextResponse.json(
        { error: "Le pourcentage d'avance doit être 25, 50 ou 100." },
        { status: 400 }
      );
    }

    // Calculer l'avance selon le pourcentage choisi
    const avance = (mission.tarifPrestataire * avancePercentage) / 100;
    const now = new Date().toISOString();

    // Mettre à jour la mission via Prisma avec l'avance
    const { updateMission } = await import("@/repositories/missionsRepo");
    const { mapInternalStateToStatus } = await import("@/lib/types");
    const newInternalState = "ADVANCE_SENT";
    
    const updateData: any = {
      avanceVersee: true,
      avanceVerseeAt: new Date(now),
      avancePercentage: avancePercentage,
      internalState: newInternalState as any,
      status: mapInternalStateToStatus(newInternalState as any),
    };
    
    // Si 100%, marquer aussi le solde comme versé (puisqu'il n'y en a pas)
    if (avancePercentage === 100) {
      updateData.soldeVersee = true;
      updateData.soldeVerseeAt = new Date(now);
    }

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

    // Plus besoin de saveMissions() car on utilise Prisma directement

    // Envoyer une notification email au prestataire
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const prestataire = updatedMissionPrisma.prestataireId ? await getPrestataireById(updatedMissionPrisma.prestataireId) : null;
      const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
      
      if (prestataire) {
        await sendNotificationEmail(
          "advance-sent",
          { email: prestataire.email, name: prestataire.nomEntreprise || prestataire.nomContact },
          {
            missionRef: updatedMissionPrisma.ref,
            providerName: prestataire.nomEntreprise || prestataire.nomContact,
            montantAvance: avance,
            serviceType: updatedMissionPrisma.serviceType,
            platformUrl,
            missionId: missionUuid, // Utiliser l'UUID
          },
          "fr"
        );
      }
    } catch (error) {
      console.error("Erreur envoi email notification prestataire:", error);
      // Ne pas bloquer l'envoi de l'avance si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        mission: updated,
        advance: {
          amount: avance,
          percentage: avancePercentage,
          paidAt: updated.avanceVerseeAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/[id]/pay-advance:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

