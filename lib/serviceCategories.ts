// lib/serviceCategories.ts
// Structure des 6 grandes catégories de services LeBoy

export type ServiceCategoryId = 
  | "administratif_government"
  | "immobilier_foncier"
  | "financier_fiscal"
  | "sante_assistance"
  | "logistique_livraison"
  | "entrepreneuriat_projets";

export interface ServiceSubcategory {
  id: string;
  nameFr: string;
  nameEn: string;
  descriptionFr?: string;
  descriptionEn?: string;
  minPrice?: number; // Prix minimum optionnel en FCFA
  requiredDocuments?: string[]; // Liste des documents requis
  enabled: boolean; // Actif ou non
}

export interface ServiceCategory {
  id: ServiceCategoryId;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  icon: string; // Nom d'icône (pour lucide-react)
  subcategories: ServiceSubcategory[];
  enabled: boolean;
}

// Catégories par défaut avec sous-services prédéfinis
export const DEFAULT_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "administratif_government",
    nameFr: "Services Administratifs & Gouvernementaux",
    nameEn: "Administrative & Government Services",
    descriptionFr: "Gestion de vos démarches administratives et documents officiels",
    descriptionEn: "Management of your administrative procedures and official documents",
    icon: "FileText",
    enabled: true,
    subcategories: [
      {
        id: "acte_naissance",
        nameFr: "Acte de naissance",
        nameEn: "Birth certificate",
        enabled: true,
      },
      {
        id: "casier_judiciaire",
        nameFr: "Casier judiciaire",
        nameEn: "Criminal record",
        enabled: true,
      },
      {
        id: "certificat_celibat",
        nameFr: "Certificat de célibat",
        nameEn: "Single status certificate",
        enabled: true,
      },
      {
        id: "passeport_cnib",
        nameFr: "Passeport / CNIB / Document ID",
        nameEn: "Passport / ID Card / ID Document",
        enabled: true,
      },
      {
        id: "validation_dossier",
        nameFr: "Validation de dossier",
        nameEn: "Document validation",
        enabled: true,
      },
      {
        id: "demarches_judiciaires",
        nameFr: "Démarches judiciaires non sensibles",
        nameEn: "Non-sensitive legal procedures",
        enabled: true,
      },
      {
        id: "depot_retrait_admin",
        nameFr: "Dépôt/Retrait dans les administrations",
        nameEn: "Filing/Retrieval in government offices",
        enabled: true,
      },
    ],
  },
  {
    id: "immobilier_foncier",
    nameFr: "Services Immobiliers & Foncier",
    nameEn: "Real Estate & Land Services",
    descriptionFr: "Gestion immobilière et foncière, vérifications et suivi",
    descriptionEn: "Real estate and land management, verifications and follow-up",
    icon: "Building2",
    enabled: true,
    subcategories: [
      {
        id: "verification_terrain",
        nameFr: "Vérification de terrain",
        nameEn: "Land verification",
        enabled: true,
      },
      {
        id: "achat_negociation",
        nameFr: "Achat / négociation / contrôle",
        nameEn: "Purchase / negotiation / control",
        enabled: true,
      },
      {
        id: "controle_titrage",
        nameFr: "Contrôle de titrage",
        nameEn: "Title verification",
        enabled: true,
      },
      {
        id: "suivi_chantier",
        nameFr: "Suivi de chantier",
        nameEn: "Construction site monitoring",
        enabled: true,
      },
      {
        id: "gestion_locative",
        nameFr: "Gestion locative",
        nameEn: "Rental management",
        enabled: true,
      },
      {
        id: "etat_lieux",
        nameFr: "État des lieux",
        nameEn: "Property condition report",
        enabled: true,
      },
      {
        id: "photos_visites",
        nameFr: "Photos, vidéos, visites virtuelles",
        nameEn: "Photos, videos, virtual tours",
        enabled: true,
      },
    ],
  },
  {
    id: "financier_fiscal",
    nameFr: "Services Financiers & Fiscaux",
    nameEn: "Financial & Tax Services",
    descriptionFr: "Gestion fiscale, paiements et suivi financier",
    descriptionEn: "Tax management, payments and financial follow-up",
    icon: "Calculator",
    enabled: true,
    subcategories: [
      {
        id: "paiement_impots",
        nameFr: "Paiement d'impôts",
        nameEn: "Tax payment",
        enabled: true,
      },
      {
        id: "recuperation_quittances",
        nameFr: "Récupération de quittances",
        nameEn: "Receipt retrieval",
        enabled: true,
      },
      {
        id: "suivi_fiscal",
        nameFr: "Suivi fiscal",
        nameEn: "Tax follow-up",
        enabled: true,
      },
      {
        id: "creation_entreprise",
        nameFr: "Création d'entreprise",
        nameEn: "Business creation",
        enabled: true,
      },
      {
        id: "comptabilite_base",
        nameFr: "Comptabilité de base",
        nameEn: "Basic accounting",
        enabled: true,
      },
      {
        id: "domiciliation_entreprise",
        nameFr: "Domiciliation d'entreprise",
        nameEn: "Business domiciliation",
        enabled: true,
      },
    ],
  },
  {
    id: "sante_assistance",
    nameFr: "Santé & Assistance Familiale",
    nameEn: "Health & Family Assistance",
    descriptionFr: "Services de santé, assistance familiale et urgences médicales",
    descriptionEn: "Health services, family assistance and medical emergencies",
    icon: "Heart",
    enabled: true,
    subcategories: [
      {
        id: "transport_malade",
        nameFr: "Transport d'un malade vers l'hôpital",
        nameEn: "Transport of a patient to hospital",
        enabled: true,
      },
      {
        id: "achat_medicaments",
        nameFr: "Achat de médicaments à distance",
        nameEn: "Remote medication purchase",
        enabled: true,
      },
      {
        id: "verification_etat_proche",
        nameFr: "Vérification de l'état d'un proche",
        nameEn: "Checking on a relative's condition",
        enabled: true,
      },
      {
        id: "assistance_hospitaliere",
        nameFr: "Assistance hospitalière (accompagnement)",
        nameEn: "Hospital assistance (companionship)",
        enabled: true,
      },
      {
        id: "livraison_articles_medicaux",
        nameFr: "Livraison urgente d'articles médicaux",
        nameEn: "Urgent delivery of medical supplies",
        enabled: true,
      },
    ],
  },
  {
    id: "logistique_livraison",
    nameFr: "Logistique & Livraison",
    nameEn: "Logistics & Delivery",
    descriptionFr: "Livraisons, courses et services logistiques",
    descriptionEn: "Deliveries, shopping and logistics services",
    icon: "Truck",
    enabled: true,
    subcategories: [
      {
        id: "courses_urgentes",
        nameFr: "Courses urgentes",
        nameEn: "Urgent shopping",
        enabled: true,
      },
      {
        id: "livraison_domicile",
        nameFr: "Livraison à domicile",
        nameEn: "Home delivery",
        enabled: true,
      },
      {
        id: "recuperation_colis",
        nameFr: "Récupération de colis",
        nameEn: "Package pickup",
        enabled: true,
      },
      {
        id: "transport_personne",
        nameFr: "Transport de personne",
        nameEn: "Person transport",
        enabled: true,
      },
      {
        id: "accompagnement_divers",
        nameFr: "Accompagnement divers",
        nameEn: "Various accompaniment",
        enabled: true,
      },
    ],
  },
  {
    id: "entrepreneuriat_projets",
    nameFr: "Entrepreneuriat & Projets",
    nameEn: "Entrepreneurship & Projects",
    descriptionFr: "Création d'entreprise, études de marché et projets d'affaires",
    descriptionEn: "Business creation, market studies and business projects",
    icon: "Briefcase",
    enabled: true,
    subcategories: [
      {
        id: "creation_entreprise",
        nameFr: "Création d'entreprise",
        nameEn: "Business creation",
        enabled: true,
      },
      {
        id: "etude_marche",
        nameFr: "Étude de marché locale simple",
        nameEn: "Simple local market study",
        enabled: true,
      },
      {
        id: "recherche_prestataires",
        nameFr: "Recherche de prestataires spécialisés",
        nameEn: "Search for specialized providers",
        enabled: true,
      },
      {
        id: "visites_terrain_projet",
        nameFr: "Visites de terrain pour projet d'affaires",
        nameEn: "Site visits for business project",
        enabled: true,
      },
      {
        id: "collecte_informations",
        nameFr: "Collecte d'informations stratégiques",
        nameEn: "Strategic information gathering",
        enabled: true,
      },
    ],
  },
];

// Note: Les fonctions getCategoryById et getSubcategoryById sont maintenant dans serviceCategoriesStore.ts
// pour utiliser les catégories persistantes et configurables par l'admin

