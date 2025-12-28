import { NextResponse } from "next/server";
import { getAllPrestataires, getPrestatairesActifs } from "@/lib/dataAccess";

export async function GET() {
  try {
    // En production, ajouter une vérification d'authentification admin
    // Pour l'instant, on permet l'accès en développement
    
    console.log("[API Prestataires] 🔍 Récupération de tous les prestataires...");
    console.log("[API Prestataires] USE_DB:", process.env.USE_DB);
    console.log("[API Prestataires] DATABASE_URL:", process.env.DATABASE_URL ? "définie" : "non définie");
    
    let allPrestataires: any[] = [];
    let errorOccurred = false;
    let errorMessage = "";
    
    try {
      allPrestataires = await getAllPrestataires();
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
      } else {
        console.warn("[API Prestataires] ⚠️ Aucun prestataire trouvé dans la base de données");
      }
    } catch (error: any) {
      errorOccurred = true;
      errorMessage = error?.message || "Erreur inconnue";
      console.error("[API Prestataires] ❌ Erreur lors de getAllPrestataires:", error);
      console.error("[API Prestataires] Code erreur:", error?.code);
      console.error("[API Prestataires] Stack:", error?.stack?.substring(0, 500));
      
      // Si c'est une erreur Prisma (colonne manquante), retourner une réponse avec l'erreur
      if (error?.code === "P2022" || error?.code === "P2021") {
        return NextResponse.json(
          {
            error: "Erreur de base de données",
            message: "Les migrations Prisma n'ont pas été appliquées. Veuillez exécuter 'prisma migrate deploy' en production.",
            code: error.code,
            prestataires: [],
            stats: {
              total: 0,
              actifs: 0,
              enAttente: 0,
              suspendus: 0,
              rejetes: 0,
            },
          },
          {
            status: 503,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              "Pragma": "no-cache",
              "Expires": "0",
            },
          }
        );
      }
    }
    
    if (errorOccurred) {
      // Si erreur non gérée, retourner une réponse d'erreur
      return NextResponse.json(
        {
          error: "Erreur serveur lors de la récupération des prestataires",
          message: errorMessage,
          prestataires: [],
          stats: {
            total: 0,
            actifs: 0,
            enAttente: 0,
            suspendus: 0,
            rejetes: 0,
          },
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
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
    console.error("[API Prestataires] ❌ Erreur globale:", error);
    console.error("[API Prestataires] Stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Erreur serveur.",
        message: error?.message,
        code: error?.code,
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
        prestataires: [],
        stats: {
          total: 0,
          actifs: 0,
          enAttente: 0,
          suspendus: 0,
          rejetes: 0,
        },
      },
      { status: 500 }
    );
  }
}
