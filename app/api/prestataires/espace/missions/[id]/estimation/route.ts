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
        { error: "Vous n'êtes pas autorisé à soumettre une estimation pour cette mission." },
        { status: 403 }
      );
    }

    // Vérifier que la mission est dans l'état ASSIGNED_TO_PROVIDER
    if (mission.internalState !== "ASSIGNED_TO_PROVIDER") {
      return NextResponse.json(
        { error: "La mission doit être assignée et en attente d'estimation pour soumettre une estimation." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { prixFournisseur, delaisEstimes, noteExplication, fraisExternes } = body;

    // Validation
    if (!prixFournisseur || isNaN(parseFloat(String(prixFournisseur))) || parseFloat(String(prixFournisseur)) <= 0) {
      return NextResponse.json(
        { error: "Prix fournisseur invalide." },
        { status: 400 }
      );
    }

    if (!delaisEstimes || isNaN(parseFloat(String(delaisEstimes))) || parseFloat(String(delaisEstimes)) <= 0) {
      return NextResponse.json(
        { error: "Délais estimés invalides." },
        { status: 400 }
      );
    }

    // Enregistrer l'estimation et mettre à jour le tarif prestataire
    const prixFournisseurNum = parseFloat(String(prixFournisseur));
    const now = new Date().toISOString();
    
    mission.estimationPartenaire = {
      prixFournisseur: prixFournisseurNum,
      delaisEstimes: parseFloat(String(delaisEstimes)),
      noteExplication: noteExplication || undefined,
      fraisExternes: fraisExternes ? parseFloat(String(fraisExternes)) : undefined,
      soumiseAt: now,
    };
    
    // Mettre à jour le tarif prestataire dans la mission (sans commission ICD pour l'instant)
    mission.tarifPrestataire = prixFournisseurNum;
    
    // Enregistrer la date d'acceptation côté prestataire
    mission.dateAcceptation = now;

    // Mettre à jour l'état interne vers PROVIDER_ESTIMATED
    const updated = await updateMissionInternalState(missionId, "PROVIDER_ESTIMATED", userEmail);

    if (!updated) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    await saveMissions();

    // Ajouter une notification pour l'admin
    try {
      const { addAdminNotification } = await import("@/lib/adminNotificationsStore");
      addAdminNotification({
        type: "mission_estimated",
        title: "Estimation reçue",
        message: `Le prestataire ${prestataire.nomEntreprise || prestataire.nomContact || prestataire.nomEntreprise || prestataire.nomContact} a soumis une estimation pour la mission ${mission.ref} (${prixFournisseurNum.toLocaleString()} FCFA, ${parseFloat(String(delaisEstimes))} heures).`,
        missionId: mission.id,
        missionRef: mission.ref,
        demandeId: mission.demandeId,
        prestataireName: prestataire.nomEntreprise || prestataire.nomContact || prestataire.nomEntreprise || prestataire.nomContact,
      });
    } catch (error) {
      console.error("Erreur ajout notification admin:", error);
      // Ne pas bloquer la soumission si la notification échoue
    }

    // Envoyer une notification email à l'administrateur
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const { getAdminEmail } = await import("@/lib/auth");
      
      await sendNotificationEmail(
        "estimation-submitted",
        { email: getAdminEmail() },
        {
          missionRef: mission.ref,
          providerName: prestataire.nomEntreprise || prestataire.nomContact || prestataire.nomEntreprise || prestataire.nomContact,
          prixFournisseur: prixFournisseurNum,
          delaisEstimes: parseFloat(String(delaisEstimes)),
          note: noteExplication || undefined,
        },
        "fr"
      );
    } catch (error) {
      console.error("Erreur envoi email notification admin:", error);
      // Ne pas bloquer la soumission si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        mission: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]/estimation:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

