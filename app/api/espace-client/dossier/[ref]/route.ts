// app/api/espace-client/dossier/[ref]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDemandeByRef, getMissionsByDemandeId, getPropositionsByDemandeId } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ ref: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("icd_auth")?.value;
    const userEmail = cookieStore.get("icd_user_email")?.value;
    
    // Vérifier l'authentification
    if (!authCookie || authCookie !== "1" || !userEmail) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const raw = resolvedParams.ref ?? "";
    
    // Validation de la référence
    if (!raw || raw.length > 50) {
      return NextResponse.json(
        { error: "Référence invalide." },
        { status: 400 }
      );
    }

    const refFromUrl = decodeURIComponent(raw).toLowerCase();

    const dossier = await getDemandeByRef(refFromUrl);

    if (!dossier || dossier.deletedAt) {
      return NextResponse.json({ dossier: null }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à ce dossier
    const email = userEmail.toLowerCase();
    if (dossier.email.toLowerCase() !== email) {
      return NextResponse.json(
        { error: "Accès non autorisé à ce dossier." },
        { status: 403 }
      );
    }

    // Récupérer les missions associées à cette demande
    const allMissions = (await getMissionsByDemandeId(dossier.id)).filter(
      (m) => !m.deleted && !m.archived
    );

    // Filtrer pour ne garder que la mission du prestataire gagnant
    // Le client ne doit voir les missions que lorsque le gagnant est sélectionné
    let missions: typeof allMissions = [];
    
    if (allMissions.length > 0) {
      // Récupérer les propositions pour cette demande
      const propositions = await getPropositionsByDemandeId(dossier.id);
      
      // Chercher la proposition acceptée (prestataire gagnant)
      const propositionAcceptee = propositions.find(
        (p) => p.statut === "acceptee"
      );

      if (propositionAcceptee) {
        // Si une proposition est acceptée, ne garder que la mission du prestataire gagnant
        const winningMission = allMissions.find(
          (m) => m.prestataireId === propositionAcceptee.prestataireId
        );
        if (winningMission) {
          missions = [winningMission];
        }
        // Si la mission gagnante n'existe pas encore, missions reste vide
      }
      // Si aucune proposition n'est acceptée, missions reste vide
      // Le client ne doit voir sa mission qu'une fois que l'admin a sélectionné le prestataire gagnant
    }

    return NextResponse.json({ 
      dossier,
      missions 
    }, { status: 200 });
  } catch (error) {
    console.error("ERREUR /api/espace-client/dossier/[ref] :", error);
    return NextResponse.json(
      { dossier: null, error: "Erreur serveur lors du chargement du dossier." },
      { status: 500 }
    );
  }
}
