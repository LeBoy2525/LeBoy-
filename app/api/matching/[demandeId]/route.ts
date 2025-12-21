import { NextResponse } from "next/server";
import { getDemandeById, getAllPrestataires } from "@/lib/dataAccess";
import { matchDemandeToPrestataires } from "@/lib/matching";

type RouteParams = {
  params: Promise<{ demandeId: string }>;
};

export async function GET(
  _req: Request,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const demandeId = parseInt(resolvedParams.demandeId);
    if (isNaN(demandeId)) {
      return NextResponse.json(
        { error: "ID de demande invalide." },
        { status: 400 }
      );
    }

    const demande = await getDemandeById(demandeId);
    if (!demande) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // Récupérer tous les prestataires depuis la DB
    const allPrestataires = await getAllPrestataires();
    console.log(`[API MATCHING] Prestataires récupérés depuis DB: ${allPrestataires.length}`);
    console.log(`[API MATCHING] Prestataires actifs: ${allPrestataires.filter(p => p.statut === "actif").length}`);
    
    // Passer les prestataires à la fonction de matching
    const matches = matchDemandeToPrestataires(demande, allPrestataires);

    // Séparer les prestataires suggérés (avec score > 0) des autres
    const suggestedMatches = matches.filter(m => m.score > 0);
    const suggestedIds = new Set(suggestedMatches.map(m => m.prestataire.id));
    
    // Les autres prestataires sont TOUS les prestataires actifs qui ne sont pas dans les suggestions
    // L'admin peut assigner même si la catégorie ne correspond pas exactement
    // On inclut uniquement les prestataires actifs (pas en_attente) pour cette section
    const otherPrestataires = allPrestataires
      .filter(p => 
        !suggestedIds.has(p.id) && // Ne pas inclure ceux déjà suggérés
        p.statut === "actif" && // Uniquement les prestataires actifs
        !p.deletedAt
      )
      .map(p => ({
        prestataire: p,
        score: 0,
        reasons: ["Prestataire actif disponible"],
      }));
    
    console.log(`[API MATCHING] Prestataires actifs disponibles: ${allPrestataires.filter(p => p.statut === "actif" && !p.deletedAt).length}`);
    console.log(`[API MATCHING] Autres prestataires (actifs, non suggérés): ${otherPrestataires.length}`);

    console.log("🔍 API Matching - Résultats:", {
      demandeId: demande.id,
      serviceType: demande.serviceType,
      suggestedMatchesCount: suggestedMatches.length,
      otherPrestatairesCount: otherPrestataires.length,
      suggestedMatches: suggestedMatches.map(m => ({
        id: m.prestataire.id,
        nom: m.prestataire.nomEntreprise,
        statut: m.prestataire.statut,
        score: m.score,
      })),
    });

    return NextResponse.json(
      {
        demande: {
          id: demande.id,
          ref: demande.ref,
          serviceType: demande.serviceType,
          lieu: demande.lieu,
        },
        matches: suggestedMatches,
        otherPrestataires: otherPrestataires,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/matching/[demandeId]:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
