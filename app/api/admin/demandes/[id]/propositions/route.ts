// app/api/admin/demandes/[id]/propositions/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";
import { getPropositionsByDemandeId } from "@/lib/dataAccess";
import { rankPropositions } from "@/lib/propositionsStore";
import { getPrestataireByEmail } from "@/lib/dataAccess";
import { getDemandeById } from "@/lib/dataAccess";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const demandeId = resolvedParams.id; // UUID string (pas de parseInt)
    
    // Valider que c'est un UUID (format basique)
    if (!demandeId || typeof demandeId !== "string" || demandeId.length < 30) {
      return NextResponse.json(
        { error: "UUID invalide." },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe
    const demande = await getDemandeById(demandeId);
    if (!demande) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // Récupérer toutes les propositions pour cette demande
    const propositions = await getPropositionsByDemandeId(demandeId);

    // Fonction pour obtenir la note moyenne d'un prestataire
    const getPrestataireNoteMoyenne = async (prestataireId: string): Promise<number> => {
      // Utiliser getPrestataireById de dataAccess qui gère déjà la conversion
      const { getPrestataireById } = await import("@/lib/dataAccess");
      const prestataire = await getPrestataireById(prestataireId);
      return prestataire?.noteMoyenne || 0;
    };

    // Classer les propositions par score
    const rankedPropositions = rankPropositions(propositions, (id: string) => {
      // Pour la compatibilité synchrone, on utilise une valeur par défaut
      // Dans un vrai cas, on devrait attendre la promesse, mais rankPropositions est synchrone
      return 0; // Valeur par défaut, sera remplacée après
    });

    // Enrichir avec les informations du prestataire
    const { getPrestataireById } = await import("@/lib/dataAccess");
    const enrichedPropositions = await Promise.all(rankedPropositions.map(async (scoreData) => {
      // Obtenir la note moyenne réelle
      const noteMoyenne = await getPrestataireNoteMoyenne(scoreData.proposition.prestataireId);
      
      // Recalculer le score avec la note réelle
      const { calculatePropositionScore } = await import("@/lib/propositionsStore");
      const allPropositions = propositions;
      const scoreDataRecalculated = calculatePropositionScore(
        scoreData.proposition,
        allPropositions,
        noteMoyenne
      );

      // Trouver le prestataire depuis dataAccess (utilise UUID strings maintenant)
      const prestataire = await getPrestataireById(scoreData.proposition.prestataireId);

      return {
        ...scoreDataRecalculated,
        prestataire: prestataire
          ? {
              id: prestataire.id,
              ref: prestataire.ref,
              nomEntreprise: prestataire.nomEntreprise,
              nomContact: prestataire.nomContact,
              email: prestataire.email,
              phone: prestataire.phone,
              ville: prestataire.ville,
              noteMoyenne: prestataire.noteMoyenne || 0,
              nombreMissions: prestataire.nombreMissions || 0,
              tauxReussite: prestataire.tauxReussite || 0,
            }
          : null,
      };
    }));

    // Trier par score composite décroissant
    enrichedPropositions.sort((a, b) => b.score_composite - a.score_composite);

    return NextResponse.json(
      {
        propositions: enrichedPropositions,
        demande: {
          id: demande.id,
          ref: demande.ref,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/demandes/[id]/propositions:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

