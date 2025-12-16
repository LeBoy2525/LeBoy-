import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionsByClient, checkAndAutoCloseMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { getPropositionsByDemandeId } from "@/lib/dataAccess";

export async function GET() {
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

    // Vérifier et fermer automatiquement les missions après 24h
    await checkAndAutoCloseMissions();

    // Inclure les missions archivées pour les afficher dans "Missions terminées"
    // Mais exclure les missions supprimées
    const allMissions = (await getMissionsByClient(userEmail)).filter(
      (m) => !m.deleted
    );

    // Grouper les missions par demandeId
    const missionsByDemande = new Map<number, typeof allMissions>();
    for (const mission of allMissions) {
      if (!missionsByDemande.has(mission.demandeId)) {
        missionsByDemande.set(mission.demandeId, []);
      }
      missionsByDemande.get(mission.demandeId)!.push(mission);
    }

    // Pour chaque demande, ne garder que la mission du prestataire gagnant
    const filteredMissions: typeof allMissions = [];
    
    for (const [demandeId, missions] of missionsByDemande.entries()) {
      // Récupérer les propositions pour cette demande
      const propositions = await getPropositionsByDemandeId(demandeId);
      
      // Chercher la proposition acceptée (prestataire gagnant)
      const propositionAcceptee = propositions.find(
        (p) => p.statut === "acceptee"
      );

      if (propositionAcceptee) {
        // Si une proposition est acceptée, ne garder que la mission du prestataire gagnant
        const winningMission = missions.find(
          (m) => m.prestataireId === propositionAcceptee.prestataireId
        );
        if (winningMission) {
          filteredMissions.push(winningMission);
        }
        // Si la mission gagnante n'existe pas encore, ne rien afficher
        // (le client ne doit voir que la mission finale une fois le gagnant sélectionné)
      }
      // Si aucune proposition n'est acceptée, ne rien afficher au client
      // Le client ne doit voir sa mission qu'une fois que l'admin a sélectionné le prestataire gagnant
    }

    return NextResponse.json({ missions: filteredMissions }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/espace-client/missions:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

