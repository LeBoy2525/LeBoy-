// lib/serviceCategoriesStore.ts
// Store pour gérer les catégories et sous-services de manière persistante et configurable par l'admin

import { loadFromFile, saveToFileAsync } from "./persistence";
import { DEFAULT_SERVICE_CATEGORIES, type ServiceCategory, type ServiceCategoryId, type ServiceSubcategory } from "./serviceCategories";

// Ré-exporter les types pour faciliter l'importation
export type { ServiceCategory, ServiceCategoryId, ServiceSubcategory };

type GlobalStore = {
  _icdServiceCategories?: ServiceCategory[];
  _icdServiceCategoriesLoaded?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

// Initialiser le store depuis le fichier
if (!globalStore._icdServiceCategories) {
  // Commencer avec les catégories par défaut pour éviter un tableau vide
  globalStore._icdServiceCategories = DEFAULT_SERVICE_CATEGORIES;
  globalStore._icdServiceCategoriesLoaded = false;
  
  // Charger les données au démarrage (asynchrone)
  loadFromFile<ServiceCategory>("serviceCategories.json").then((data) => {
    if (data && data.length > 0) {
      globalStore._icdServiceCategories = data;
      console.log(`✅ ${data.length} catégorie(s) de service(s) chargée(s) depuis le fichier`);
    } else {
      // Si aucun fichier ou fichier vide, utiliser les catégories par défaut
      globalStore._icdServiceCategories = DEFAULT_SERVICE_CATEGORIES;
      saveServiceCategories(); // Sauvegarder les catégories par défaut
      console.log(`✅ Catégories de services initialisées avec les valeurs par défaut`);
    }
    globalStore._icdServiceCategoriesLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des catégories:", error);
    // En cas d'erreur, utiliser les valeurs par défaut
    globalStore._icdServiceCategories = DEFAULT_SERVICE_CATEGORIES;
    globalStore._icdServiceCategoriesLoaded = true;
  });
}

export const serviceCategoriesStore = globalStore._icdServiceCategories;

// Fonction pour attendre que le store soit chargé
export async function waitForServiceCategoriesLoad(): Promise<void> {
  if (globalStore._icdServiceCategoriesLoaded) {
    return;
  }
  
  // Attendre jusqu'à 5 secondes que le store soit chargé
  const maxWait = 5000;
  const startTime = Date.now();
  
  while (!globalStore._icdServiceCategoriesLoaded && (Date.now() - startTime) < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Si toujours pas chargé, initialiser avec les valeurs par défaut
  if (!globalStore._icdServiceCategoriesLoaded || !globalStore._icdServiceCategories || globalStore._icdServiceCategories.length === 0) {
    globalStore._icdServiceCategories = DEFAULT_SERVICE_CATEGORIES;
    globalStore._icdServiceCategoriesLoaded = true;
    saveServiceCategories();
  }
}

// Fonction pour sauvegarder les catégories
function saveServiceCategories() {
  saveToFileAsync("serviceCategories.json", serviceCategoriesStore);
}

// Fonction exportée pour sauvegarder (utilisée par les API routes)
export function saveServiceCategoriesToFile() {
  saveServiceCategories();
}

// Obtenir toutes les catégories actives
export function getActiveCategories(): ServiceCategory[] {
  return serviceCategoriesStore.filter((cat) => cat.enabled);
}

// Obtenir une catégorie par ID
export function getCategoryById(id: ServiceCategoryId): ServiceCategory | undefined {
  return serviceCategoriesStore.find((cat) => cat.id === id);
}

// Obtenir une sous-catégorie par ID
export function getSubcategoryById(
  categoryId: ServiceCategoryId,
  subcategoryId: string
): ServiceSubcategory | undefined {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find((sub) => sub.id === subcategoryId);
}

// Mettre à jour une catégorie (utilisé par l'admin)
export function updateCategory(
  categoryId: ServiceCategoryId,
  updates: Partial<ServiceCategory>
): ServiceCategory | null {
  const index = serviceCategoriesStore.findIndex((cat) => cat.id === categoryId);
  if (index === -1) return null;

  serviceCategoriesStore[index] = { ...serviceCategoriesStore[index], ...updates };
  saveServiceCategories();
  return serviceCategoriesStore[index];
}

// Ajouter une sous-catégorie à une catégorie (utilisé par l'admin)
export function addSubcategory(
  categoryId: ServiceCategoryId,
  subcategory: ServiceSubcategory
): ServiceSubcategory | null {
  const category = getCategoryById(categoryId);
  if (!category) return null;

  // Vérifier si la sous-catégorie existe déjà
  if (category.subcategories.some((sub) => sub.id === subcategory.id)) {
    return null; // Existe déjà
  }

  category.subcategories.push(subcategory);
  saveServiceCategories();
  return subcategory;
}

// Mettre à jour une sous-catégorie (utilisé par l'admin)
export function updateSubcategory(
  categoryId: ServiceCategoryId,
  subcategoryId: string,
  updates: Partial<ServiceSubcategory>
): ServiceSubcategory | null {
  const category = getCategoryById(categoryId);
  if (!category) return null;

  const subIndex = category.subcategories.findIndex((sub) => sub.id === subcategoryId);
  if (subIndex === -1) return null;

  category.subcategories[subIndex] = {
    ...category.subcategories[subIndex],
    ...updates,
  };
  saveServiceCategories();
  return category.subcategories[subIndex];
}

// Supprimer une sous-catégorie (désactivation plutôt que suppression réelle)
export function deleteSubcategory(
  categoryId: ServiceCategoryId,
  subcategoryId: string
): boolean {
  const subcategory = getSubcategoryById(categoryId, subcategoryId);
  if (!subcategory) return false;

  subcategory.enabled = false;
  saveServiceCategories();
  return true;
}

// Obtenir toutes les catégories avec leurs sous-catégories actives uniquement
export function getCategoriesWithActiveSubcategories(): ServiceCategory[] {
  return serviceCategoriesStore.map((category) => ({
    ...category,
    subcategories: category.subcategories.filter((sub) => sub.enabled),
  })).filter((category) => category.enabled || category.subcategories.length > 0);
}

