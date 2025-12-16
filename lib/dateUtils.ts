


// lib/dateUtils.ts

// Fuseaux horaires principaux utilisés dans l'application
export type TimezoneKey = "cameroon" | "canada" | "france" | "spain" | "india";

export interface TimezoneFormats {
  cameroon: string;
  canada: string;
  france?: string;
  spain?: string;
  india?: string;
}

export function formatDateWithTimezones(
  dateString: string,
  includeAll?: boolean
): TimezoneFormats {
  const date = new Date(dateString);
  
  // Format pour le Cameroun (UTC+1 - Africa/Douala)
  const cameroon = date.toLocaleString("fr-FR", {
    timeZone: "Africa/Douala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Format pour le Canada (America/Toronto - UTC-5 à UTC-8 selon la saison)
  const canada = date.toLocaleString("fr-FR", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const result: TimezoneFormats = { cameroon, canada };

  // Si includeAll est true, inclure les autres fuseaux horaires
  if (includeAll) {
    // France (Europe/Paris - UTC+1 à UTC+2 selon la saison)
    result.france = date.toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Espagne (Europe/Madrid - UTC+1 à UTC+2 selon la saison)
    result.spain = date.toLocaleString("fr-FR", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Inde (Asia/Kolkata - UTC+5:30)
    result.india = date.toLocaleString("fr-FR", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return result;
}

// Fonction pour obtenir le fuseau horaire en fonction du pays (à déterminer depuis le lieu ou le profil client)
export function getTimezoneByCountry(country?: string): string {
  if (!country) return "Africa/Douala"; // Par défaut Cameroun
  
  const countryLower = country.toLowerCase();
  
  if (countryLower.includes("cameroun") || countryLower.includes("cameroon")) {
    return "Africa/Douala";
  }
  if (countryLower.includes("canada") || countryLower.includes("quebec") || countryLower.includes("québec")) {
    return "America/Toronto";
  }
  if (countryLower.includes("france")) {
    return "Europe/Paris";
  }
  if (countryLower.includes("espagne") || countryLower.includes("spain")) {
    return "Europe/Madrid";
  }
  if (countryLower.includes("inde") || countryLower.includes("india")) {
    return "Asia/Kolkata";
  }
  
  return "Africa/Douala"; // Par défaut
}

// Fonction pour formater la date selon le fuseau horaire du pays
export function formatDateByTimezone(dateString: string, country?: string, lang: "fr" | "en" = "fr"): string {
  const date = new Date(dateString);
  const timezone = getTimezoneByCountry(country);
  
  return date.toLocaleString(lang === "fr" ? "fr-FR" : "en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}