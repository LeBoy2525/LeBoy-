// app/api/service-categories/route.ts
import { NextResponse } from "next/server";
import { getCategoriesWithActiveSubcategories, waitForServiceCategoriesLoad } from "@/lib/serviceCategoriesStore";
import { DEFAULT_SERVICE_CATEGORIES } from "@/lib/serviceCategories";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Attendre que le store soit chargé
    await waitForServiceCategoriesLoad();
    
    let categories = getCategoriesWithActiveSubcategories();
    
    // Si le store est toujours vide, utiliser les catégories par défaut
    if (!categories || categories.length === 0) {
      console.warn("⚠️ Store vide après attente, utilisation des catégories par défaut");
      categories = DEFAULT_SERVICE_CATEGORIES.filter((cat) => cat.enabled).map((category) => ({
        ...category,
        subcategories: category.subcategories.filter((sub) => sub.enabled),
      }));
    }
    
    console.log(`✅ API retourne ${categories.length} catégorie(s)`);
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    // En cas d'erreur, retourner les catégories par défaut
    const fallbackCategories = DEFAULT_SERVICE_CATEGORIES.filter((cat) => cat.enabled).map((category) => ({
      ...category,
      subcategories: category.subcategories.filter((sub) => sub.enabled),
    }));
    return NextResponse.json({ categories: fallbackCategories }, { status: 200 });
  }
}
