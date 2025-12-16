// lib/countries.ts
// Liste des pays supportés par LeBoy

export interface Country {
  code: string; // Code ISO (ex: "CM", "CI", "SN")
  nameFr: string;
  nameEn: string;
  enabled: boolean;
}

export const SUPPORTED_COUNTRIES: Country[] = [
  { code: "CM", nameFr: "Cameroun", nameEn: "Cameroon", enabled: true },
  { code: "CI", nameFr: "Côte d'Ivoire", nameEn: "Ivory Coast", enabled: true },
  { code: "SN", nameFr: "Sénégal", nameEn: "Senegal", enabled: false },
  { code: "TG", nameFr: "Togo", nameEn: "Togo", enabled: false },
  { code: "BJ", nameFr: "Bénin", nameEn: "Benin", enabled: false },
  { code: "ML", nameFr: "Mali", nameEn: "Mali", enabled: false },
  { code: "HT", nameFr: "Haïti", nameEn: "Haiti", enabled: false },
  { code: "CD", nameFr: "RD Congo", nameEn: "DR Congo", enabled: false },
];

export function getCountryByCode(code: string): Country | undefined {
  return SUPPORTED_COUNTRIES.find((c) => c.code === code);
}

export function getEnabledCountries(): Country[] {
  // Utiliser le store si disponible, sinon retourner la liste statique
  try {
    const { getActiveCountries } = require("./countriesStore");
    return getActiveCountries();
  } catch {
    return SUPPORTED_COUNTRIES.filter((c) => c.enabled);
  }
}

