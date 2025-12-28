import { NextResponse } from "next/server";
import { getAllPrestataires, getPrestatairesActifs } from "@/lib/dataAccess";

export async function GET() {
  try {
    // En production, ajouter une vérification d'authentification admin
    // Pour l'instant, on permet l'accès en développement
    
    console.log("[API Prestataires] 🔍 Récupération de tous les prestataires...");
    const allPrestataires = await getAllPrestataires();
    console.log(`[API Prestataires] 📊 Total prestataires récupérés: ${allPrestataires.length}`);
    
    if (allPrestataires.length > 0) {
      console.log(`[API Prestataires] 📋 Premiers prestataires:`, allPrestataires.slice(0, 3).map(p => ({
        id: p.id,
        ref: p.ref,
        email: p.email,
        statut: p.statut,
        deletedAt: p.deletedAt,
        typeId: typeof p.id,
      })));
    }
    
    const actifs = await getPrestatairesActifs();
    const enAttente = allPrestataires.filter((p) => p.statut === "en_attente" && !p.deletedAt);
    
    // Exclure les prestataires supprimés de la liste principale
    const prestatairesNonSupprimes = allPrestataires.filter((p) => !p.deletedAt);
    
    console.log(`[API Prestataires] ✅ Prestataires non supprimés: ${prestatairesNonSupprimes.length}`);
    console.log(`[API Prestataires] 📊 Stats:`, {
      total: allPrestataires.length,
      actifs: actifs.length,
      enAttente: enAttente.length,
      suspendus: allPrestataires.filter((p) => p.statut === "suspendu" && !p.deletedAt).length,
      rejetes: allPrestataires.filter((p) => p.statut === "rejete" && !p.deletedAt).length,
    });

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
  } catch (error: any) {
    console.error("[API Prestataires] ❌ Erreur:", error);
    console.error("[API Prestataires] Stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Erreur serveur.",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
