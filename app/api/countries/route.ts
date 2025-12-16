// app/api/countries/route.ts
import { NextResponse } from "next/server";
import { getActiveCountries, getAllCountries } from "@/lib/countriesStore";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true"; // Pour obtenir tous les pays (admin)
    
    let countries = all ? getAllCountries() : getActiveCountries();
    
    // Si aucun pays n'est chargé (store pas encore initialisé), utiliser les pays par défaut
    if (!countries || countries.length === 0) {
      console.log("Aucun pays dans le store, utilisation des pays par défaut");
      countries = all ? SUPPORTED_COUNTRIES : SUPPORTED_COUNTRIES.filter(c => c.enabled);
    }
    
    console.log(`API /countries: ${countries.length} pays retournés (all=${all})`);
    return NextResponse.json({ countries }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des pays:", error);
    // En cas d'erreur, retourner les pays par défaut activés
    const fallbackCountries = SUPPORTED_COUNTRIES.filter(c => c.enabled);
    return NextResponse.json({ countries: fallbackCountries }, { status: 200 });
  }
}
