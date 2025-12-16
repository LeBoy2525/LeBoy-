import { NextResponse } from "next/server";
import { getDemandeById } from "@/lib/dataAccess";
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

    const matches = matchDemandeToPrestataires(demande);

    console.log("🔍 API Matching - Résultats:", {
      demandeId: demande.id,
      serviceType: demande.serviceType,
      matchesCount: matches.length,
      matches: matches.map(m => ({
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
        matches,
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
