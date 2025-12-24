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

    // Récupérer la mission par UUID
    const mission = await getMissionById(missionUuid);
    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier que le prestataire est bien assigné à cette mission (comparer UUIDs)
    const prestataire = await getPrestataireByEmail(userEmail);
    const missionPrestataireId = (mission as any).dbId ? 
      (await import("@/repositories/missionsRepo")).getMissionById(missionUuid).then(m => m?.prestataireId) :
      mission.prestataireId;

    // Récupérer la mission Prisma pour comparer les UUIDs correctement
    const { getMissionById: getMissionByIdDB } = await import("@/repositories/missionsRepo");
    const missionPrisma = await getMissionByIdDB(missionUuid);
    
    if (!prestataire || !missionPrisma || missionPrisma.prestataireId !== prestataire.id) {
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
    const delaisEstimesNum = parseFloat(String(delaisEstimes));
    const now = new Date();
    
    // Préparer l'objet estimation
    const estimationPartenaire = {
      prixFournisseur: prixFournisseurNum,
      delaisEstimes: delaisEstimesNum,
      noteExplication: noteExplication || undefined,
      fraisExternes: fraisExternes ? parseFloat(String(fraisExternes)) : undefined,
      soumiseAt: now.toISOString(),
    };

    // Mettre à jour la mission via Prisma avec l'estimation et le tarif
    const { updateMission } = await import("@/repositories/missionsRepo");
    const { mapInternalStateToStatus } = await import("@/lib/types");
    const newInternalState = "PROVIDER_ESTIMATED";
    
    const updatedMissionPrisma = await updateMission(missionUuid, {
      estimationPartenaire: estimationPartenaire as any,
      tarifPrestataire: prixFournisseurNum,
      dateAcceptation: now,
      internalState: newInternalState as any,
      status: mapInternalStateToStatus(newInternalState as any),
    });

    if (!updatedMissionPrisma) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour de la mission." },
        { status: 500 }
      );
    }

    // Convertir en JSON pour la réponse
    const { convertPrismaMissionToJSON } = await import("@/lib/dataAccess");
    const updated = convertPrismaMissionToJSON(updatedMissionPrisma);

    // La mission a déjà été mise à jour avec l'estimation ci-dessus
    // Plus besoin de saveMissions() car on utilise Prisma directement

    // Ajouter une notification pour l'admin
    try {
      const { addAdminNotification } = await import("@/lib/adminNotificationsStore");
      addAdminNotification({
        type: "mission_estimated",
        title: "Estimation reçue",
        message: `Le prestataire ${prestataire.nomEntreprise || prestataire.nomContact || prestataire.nomEntreprise || prestataire.nomContact} a soumis une estimation pour la mission ${mission.ref} (${prixFournisseurNum.toLocaleString()} FCFA, ${parseFloat(String(delaisEstimes))} heures).`,
        missionId: missionUuid, // Utiliser l'UUID Prisma
        missionRef: updatedMissionPrisma.ref,
        demandeId: updatedMissionPrisma.demandeId,
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
          missionRef: updatedMissionPrisma.ref,
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

