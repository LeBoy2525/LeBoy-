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

    // Enregistrer le paiement
    const now = new Date().toISOString();
    mission.paiementEffectue = true;
    mission.paiementEffectueAt = now;

    // TODO: Enregistrer la transaction dans la table des paiements
    // const transaction = {
    //   id: generateId(),
    //   missionId: mission.id,
    //   clientEmail: mission.clientEmail,
    //   amount: mission.tarifTotal,
    //   paymentIntentId,
    //   paymentMethod,
    //   status: "succeeded",
    //   createdAt: now,
    // };

    // Mettre à jour l'état interne vers PAID_WAITING_TAKEOVER
    const updated = await updateMissionInternalState(missionId, "PAID_WAITING_TAKEOVER", userEmail);

    if (!updated) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    saveMissions();

    // Ajouter une notification pour l'admin
    try {
      const { addAdminNotification } = await import("@/lib/adminNotificationsStore");
      const { demandesStore } = await import("@/lib/demandesStore");
      const demande = demandesStore.find((d) => d.id === mission.demandeId);
      
      if (demande) {
        addAdminNotification({
          type: "mission_paid",
          title: "Paiement reçu",
          message: `Le client ${demande.fullName} a effectué le paiement de ${(mission.tarifTotal || 0).toLocaleString()} FCFA pour la mission ${mission.ref}.`,
          missionId: mission.id,
          missionRef: mission.ref,
          demandeId: mission.demandeId,
          clientEmail: mission.clientEmail,
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
      const { demandesStore } = await import("@/lib/demandesStore");
      const demande = demandesStore.find((d) => d.id === mission.demandeId);
      
      if (demande) {
        await sendNotificationEmail(
          "payment-received",
          { email: getAdminEmail() },
          {
            missionRef: mission.ref,
            montant: mission.tarifTotal || 0,
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
          amount: mission.tarifTotal,
          paidAt: mission.paiementEffectueAt,
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

