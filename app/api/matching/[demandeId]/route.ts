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
    console.log(`[API MATCHING] ========================================`);
    console.log(`[API MATCHING] Demande ID: ${demandeId}, Ref: ${demande.ref}`);
    console.log(`[API MATCHING] Prestataires récupérés depuis DB: ${allPrestataires.length}`);
    console.log(`[API MATCHING] Prestataires par statut:`, {
      actif: allPrestataires.filter(p => p.statut === "actif").length,
      en_attente: allPrestataires.filter(p => p.statut === "en_attente").length,
      suspendu: allPrestataires.filter(p => p.statut === "suspendu").length,
      rejete: allPrestataires.filter(p => p.statut === "rejete").length,
    });
    
    // Détail des prestataires actifs
    const activePrestataires = allPrestataires.filter(p => p.statut === "actif" && !p.deletedAt);
    console.log(`[API MATCHING] Prestataires actifs (détail):`, activePrestataires.map(p => ({
      id: p.id,
      email: p.email,
      nomEntreprise: p.nomEntreprise,
      zonesIntervention: p.zonesIntervention,
      countries: p.countries,
      specialites: p.specialites
    })));
    
    // Passer les prestataires à la fonction de matching
    // Cette fonction filtre par spécialité, ville et pays pour les suggestions
    const matches = matchDemandeToPrestataires(demande, allPrestataires);
    console.log(`[API MATCHING] Matches retournés par matchDemandeToPrestataires: ${matches.length}`);

    // Séparer les prestataires suggérés (avec score > 0) des autres
    const suggestedMatches = matches.filter(m => m.score > 0);
    const suggestedIds = new Set(suggestedMatches.map(m => m.prestataire.id));
    console.log(`[API MATCHING] Prestataires suggérés (score > 0): ${suggestedMatches.length}`);
    console.log(`[API MATCHING] IDs des prestataires suggérés:`, Array.from(suggestedIds));
    
    // IMPORTANT: Les autres prestataires sont TOUS les prestataires actifs disponibles
    // SANS AUCUN FILTRAGE par ville, pays ou spécialité
    // Chaque demande est indépendante - un prestataire peut recevoir plusieurs demandes
    // L'admin peut assigner même si la catégorie/ville/pays ne correspond pas exactement
    const allActivePrestataires = allPrestataires.filter(p => 
      p.statut === "actif" && 
      !p.deletedAt
    );
    
    console.log(`[API MATCHING] Total prestataires actifs disponibles: ${allActivePrestataires.length}`);
    
    const otherPrestataires = allActivePrestataires
      .filter(p => !suggestedIds.has(p.id)) // Ne pas inclure ceux déjà suggérés
      .map(p => ({
        prestataire: p,
        score: 0,
        reasons: ["Prestataire actif disponible"],
      }));
    
    console.log(`[API MATCHING] Autres prestataires (actifs, non suggérés): ${otherPrestataires.length}`);
    console.log(`[API MATCHING] IDs des autres prestataires:`, otherPrestataires.map(p => p.prestataire.id));
    console.log(`[API MATCHING] Détail demande:`, {
      id: demande.id,
      ref: demande.ref,
      serviceType: demande.serviceType,
      lieu: demande.lieu,
      country: demande.country
    });
    console.log(`[API MATCHING] ========================================`);

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
