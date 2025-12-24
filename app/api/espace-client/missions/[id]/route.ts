import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, checkAndAutoCloseMissions } from "@/lib/dataAccess";
import { getDemandeById } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { getPropositionsByDemandeId } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    if ((await getUserRoleAsync(userEmail)) !== "client") {
      return NextResponse.json(
        { error: "Accès réservé aux clients." },
        { status: 403 }
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

    // Vérifier et fermer automatiquement les missions après 24h
    await checkAndAutoCloseMissions();

    const mission = await getMissionById(missionUuid);
    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier que le client a accès à cette mission
    if (mission.clientEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 403 }
      );
    }

    // Vérifier que cette mission est celle du prestataire gagnant
    // Le client ne doit voir que la mission du prestataire sélectionné
    if (mission.demandeId) {
      const propositions = await getPropositionsByDemandeId(mission.demandeId);
      const propositionAcceptee = propositions.find(
        (p) => p.statut === "acceptee"
      );

      if (propositionAcceptee) {
        // Si une proposition est acceptée, vérifier que cette mission correspond au prestataire gagnant
        if (mission.prestataireId !== propositionAcceptee.prestataireId) {
          return NextResponse.json(
            { error: "Cette mission n'est plus active. Veuillez consulter votre mission principale." },
            { status: 403 }
          );
        }
      } else {
        // Si aucune proposition n'est acceptée, le client ne doit pas encore voir cette mission
        return NextResponse.json(
          { error: "Mission en cours de traitement. Vous recevrez une notification une fois le prestataire sélectionné." },
          { status: 403 }
        );
      }
    }

    // Récupérer la référence de la demande pour créer le lien vers le dossier
    let demandeRef: string | undefined;
    if (mission.demandeId) {
      const demande = await getDemandeById(mission.demandeId);
      if (demande) {
        demandeRef = demande.ref;
      }
    }

    // Ajouter la référence de la demande à la mission pour le frontend
    const missionWithDemandeRef = {
      ...mission,
      demandeRef,
    };

    return NextResponse.json({ mission: missionWithDemandeRef }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/espace-client/missions/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

