// lib/africaCountries.ts
// Liste des pays d'Afrique centrale et de l'Ouest pour les prestataires

export interface AfricaCountry {
  code: string;
  nameFr: string;
  nameEn: string;
}

export const AFRICA_CENTRAL_WEST_COUNTRIES: AfricaCountry[] = [
  // Afrique de l'Ouest
  { code: "CM", nameFr: "Cameroun", nameEn: "Cameroon" },
  { code: "CI", nameFr: "Côte d'Ivoire", nameEn: "Ivory Coast" },
  { code: "SN", nameFr: "Sénégal", nameEn: "Senegal" },
  { code: "TG", nameFr: "Togo", nameEn: "Togo" },
  { code: "BJ", nameFr: "Bénin", nameEn: "Benin" },
  { code: "ML", nameFr: "Mali", nameEn: "Mali" },
  { code: "BF", nameFr: "Burkina Faso", nameEn: "Burkina Faso" },
  { code: "NE", nameFr: "Niger", nameEn: "Niger" },
  { code: "GN", nameFr: "Guinée", nameEn: "Guinea" },
  { code: "GW", nameFr: "Guinée-Bissau", nameEn: "Guinea-Bissau" },
  { code: "SL", nameFr: "Sierra Leone", nameEn: "Sierra Leone" },
  { code: "LR", nameFr: "Liberia", nameEn: "Liberia" },
  { code: "GH", nameFr: "Ghana", nameEn: "Ghana" },
  { code: "NG", nameFr: "Nigeria", nameEn: "Nigeria" },
  { code: "TD", nameFr: "Tchad", nameEn: "Chad" },
  { code: "CF", nameFr: "République centrafricaine", nameEn: "Central African Republic" },
  { code: "GA", nameFr: "Gabon", nameEn: "Gabon" },
  { code: "CG", nameFr: "Congo", nameEn: "Congo" },
  { code: "CD", nameFr: "RD Congo", nameEn: "DR Congo" },
  { code: "GQ", nameFr: "Guinée équatoriale", nameEn: "Equatorial Guinea" },
  { code: "ST", nameFr: "São Tomé-et-Príncipe", nameEn: "São Tomé and Príncipe" },
  { code: "AO", nameFr: "Angola", nameEn: "Angola" },
  { code: "MR", nameFr: "Mauritanie", nameEn: "Mauritania" },
  { code: "GM", nameFr: "Gambie", nameEn: "Gambia" },
  { code: "CV", nameFr: "Cap-Vert", nameEn: "Cape Verde" },
];

// Trier les pays par ordre alphabétique français
export const SORTED_AFRICA_COUNTRIES = [...AFRICA_CENTRAL_WEST_COUNTRIES].sort((a, b) => 
  a.nameFr.localeCompare(b.nameFr, 'fr')
);

