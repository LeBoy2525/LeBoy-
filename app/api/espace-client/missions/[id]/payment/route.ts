import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMissionInternalState, getMissionById, saveMissions } from "@/lib/dataAccess";

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

    // Vérifier que l'utilisateur est le client de cette mission
    if (mission.clientEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à payer cette mission." },
        { status: 403 }
      );
    }

    // Vérifier que la mission est dans l'état WAITING_CLIENT_PAYMENT
    if (mission.internalState !== "WAITING_CLIENT_PAYMENT") {
      return NextResponse.json(
        { error: "La mission n'est pas en attente de paiement." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { paymentIntentId, paymentMethod } = body;

    // TODO: Vérifier le paiement Stripe avec paymentIntentId
    // Pour l'instant, on simule le paiement réussi
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "ID de paiement requis." },
        { status: 400 }
      );
    }

    // Mettre à jour la mission via Prisma avec le paiement
    const { updateMission } = await import("@/repositories/missionsRepo");
    const { mapInternalStateToStatus } = await import("@/lib/types");
    const now = new Date();
    const newInternalState = "PAID_WAITING_TAKEOVER";
    
    const updatedMissionPrisma = await updateMission(missionUuid, {
      paiementEffectue: true,
      paiementEffectueAt: now,
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

    // Ajouter une notification pour l'admin
    try {
      const { addAdminNotification } = await import("@/lib/adminNotificationsStore");
      const { getDemandeById } = await import("@/lib/dataAccess");
      const demande = await getDemandeById(updatedMissionPrisma.demandeId);
      
      if (demande) {
        addAdminNotification({
          type: "mission_paid",
          title: "Paiement reçu",
          message: `Le client ${demande.fullName} a effectué le paiement de ${(updated.tarifTotal || 0).toLocaleString()} FCFA pour la mission ${updatedMissionPrisma.ref}.`,
          missionId: missionUuid, // Utiliser l'UUID
          missionRef: updatedMissionPrisma.ref,
          demandeId: updatedMissionPrisma.demandeId,
          clientEmail: updatedMissionPrisma.clientEmail,
        });
      }
    } catch (error) {
      console.error("Erreur ajout notification admin:", error);
      // Ne pas bloquer le paiement si la notification échoue
    }

    // Envoyer une notification email à l'admin
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const { getAdminEmail } = await import("@/lib/auth");
      const { getDemandeById } = await import("@/lib/dataAccess");
      const demande = await getDemandeById(updatedMissionPrisma.demandeId);
      
      if (demande) {
        await sendNotificationEmail(
          "payment-received",
          { email: getAdminEmail() },
          {
            missionRef: updatedMissionPrisma.ref,
            montant: updated.tarifTotal || 0,
            clientName: demande.fullName,
            clientEmail: demande.email,
          },
          "fr"
        );
      }
    } catch (error) {
      console.error("Erreur envoi email notification admin:", error);
      // Ne pas bloquer le paiement si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        mission: updated,
        payment: {
          paymentIntentId,
          amount: updated.tarifTotal,
          paidAt: updated.paiementEffectueAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/espace-client/missions/[id]/payment:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

