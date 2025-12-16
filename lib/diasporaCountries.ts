// lib/diasporaCountries.ts
// Liste étendue des pays de résidence pour la diaspora

export interface DiasporaCountry {
  code: string;
  nameFr: string;
  nameEn: string;
}

export const DIASPORA_COUNTRIES: DiasporaCountry[] = [
  // Europe
  { code: "FR", nameFr: "France", nameEn: "France" },
  { code: "BE", nameFr: "Belgique", nameEn: "Belgium" },
  { code: "DE", nameFr: "Allemagne", nameEn: "Germany" },
  { code: "IT", nameFr: "Italie", nameEn: "Italy" },
  { code: "ES", nameFr: "Espagne", nameEn: "Spain" },
  { code: "GB", nameFr: "Royaume-Uni", nameEn: "United Kingdom" },
  { code: "CH", nameFr: "Suisse", nameEn: "Switzerland" },
  { code: "NL", nameFr: "Pays-Bas", nameEn: "Netherlands" },
  { code: "PT", nameFr: "Portugal", nameEn: "Portugal" },
  { code: "AT", nameFr: "Autriche", nameEn: "Austria" },
  { code: "SE", nameFr: "Suède", nameEn: "Sweden" },
  { code: "NO", nameFr: "Norvège", nameEn: "Norway" },
  { code: "DK", nameFr: "Danemark", nameEn: "Denmark" },
  { code: "FI", nameFr: "Finlande", nameEn: "Finland" },
  { code: "IE", nameFr: "Irlande", nameEn: "Ireland" },
  { code: "PL", nameFr: "Pologne", nameEn: "Poland" },
  { code: "GR", nameFr: "Grèce", nameEn: "Greece" },
  { code: "LU", nameFr: "Luxembourg", nameEn: "Luxembourg" },
  
  // Amérique du Nord
  { code: "US", nameFr: "États-Unis", nameEn: "United States" },
  { code: "CA", nameFr: "Canada", nameEn: "Canada" },
  { code: "MX", nameFr: "Mexique", nameEn: "Mexico" },
  
  // Amérique du Sud et Centrale
  { code: "BR", nameFr: "Brésil", nameEn: "Brazil" },
  { code: "AR", nameFr: "Argentine", nameEn: "Argentina" },
  { code: "CO", nameFr: "Colombie", nameEn: "Colombia" },
  { code: "VE", nameFr: "Venezuela", nameEn: "Venezuela" },
  { code: "CL", nameFr: "Chili", nameEn: "Chile" },
  { code: "PE", nameFr: "Pérou", nameEn: "Peru" },
  
  // Afrique
  { code: "ZA", nameFr: "Afrique du Sud", nameEn: "South Africa" },
  { code: "MA", nameFr: "Maroc", nameEn: "Morocco" },
  { code: "TN", nameFr: "Tunisie", nameEn: "Tunisia" },
  { code: "DZ", nameFr: "Algérie", nameEn: "Algeria" },
  { code: "EG", nameFr: "Égypte", nameEn: "Egypt" },
  { code: "NG", nameFr: "Nigeria", nameEn: "Nigeria" },
  { code: "KE", nameFr: "Kenya", nameEn: "Kenya" },
  { code: "GH", nameFr: "Ghana", nameEn: "Ghana" },
  { code: "ET", nameFr: "Éthiopie", nameEn: "Ethiopia" },
  
  // Asie
  { code: "CN", nameFr: "Chine", nameEn: "China" },
  { code: "IN", nameFr: "Inde", nameEn: "India" },
  { code: "JP", nameFr: "Japon", nameEn: "Japan" },
  { code: "KR", nameFr: "Corée du Sud", nameEn: "South Korea" },
  { code: "SG", nameFr: "Singapour", nameEn: "Singapore" },
  { code: "AE", nameFr: "Émirats arabes unis", nameEn: "United Arab Emirates" },
  { code: "SA", nameFr: "Arabie saoudite", nameEn: "Saudi Arabia" },
  { code: "QA", nameFr: "Qatar", nameEn: "Qatar" },
  { code: "TR", nameFr: "Turquie", nameEn: "Turkey" },
  
  // Océanie
  { code: "AU", nameFr: "Australie", nameEn: "Australia" },
  { code: "NZ", nameFr: "Nouvelle-Zélande", nameEn: "New Zealand" },
  
  // Autres pays européens
  { code: "RU", nameFr: "Russie", nameEn: "Russia" },
  { code: "UA", nameFr: "Ukraine", nameEn: "Ukraine" },
  { code: "CZ", nameFr: "République tchèque", nameEn: "Czech Republic" },
  { code: "HU", nameFr: "Hongrie", nameEn: "Hungary" },
  { code: "RO", nameFr: "Roumanie", nameEn: "Romania" },
];

// Trier les pays par ordre alphabétique français
export const SORTED_DIASPORA_COUNTRIES = [...DIASPORA_COUNTRIES].sort((a, b) => 
  a.nameFr.localeCompare(b.nameFr, 'fr')
);

