import { NextResponse } from "next/server";
import { getAllPrestataires, getPrestatairesActifs } from "@/lib/dataAccess";

export async function GET() {
  try {
    // En production, ajouter une vérification d'authentification admin
    // Pour l'instant, on permet l'accès en développement
    
    const allPrestataires = await getAllPrestataires();
    const actifs = await getPrestatairesActifs();
    const enAttente = allPrestataires.filter((p) => p.statut === "en_attente" && !p.deletedAt);
    
    // Exclure les prestataires supprimés de la liste principale
    const prestatairesNonSupprimes = allPrestataires.filter((p) => !p.deletedAt);

    return NextResponse.json(
      {
        prestataires: prestatairesNonSupprimes,
        stats: {
          total: allPrestataires.length,
          actifs: actifs.length,
          enAttente: enAttente.length,
          suspendus: allPrestataires.filter((p) => p.statut === "suspendu" && !p.deletedAt).length,
          rejetes: allPrestataires.filter((p) => p.statut === "rejete" && !p.deletedAt).length,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
