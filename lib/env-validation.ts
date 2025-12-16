// lib/env-validation.ts
// Validation des variables d'environnement au démarrage

const APP_ENV = process.env.APP_ENV || "local";

/**
 * Valide les variables d'environnement critiques pour le staging
 */
export function validateStagingEnv() {
  if (APP_ENV !== "staging") {
    return; // Pas de validation stricte en local/production
  }

  const errors: string[] = [];

  // Vérifier les variables obligatoires
  if (!process.env.USE_DB) {
    errors.push("USE_DB doit être défini en staging");
  }

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL doit être défini en staging");
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push("NEXT_PUBLIC_APP_URL doit être défini en staging");
  }

  // Vérifier Stripe TEST
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    errors.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY doit être défini");
  } else if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_live")) {
    errors.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ne peut pas être une clé LIVE en staging");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push("STRIPE_SECRET_KEY doit être défini");
  } else if (process.env.STRIPE_SECRET_KEY.startsWith("sk_live")) {
    errors.push("STRIPE_SECRET_KEY ne peut pas être une clé LIVE en staging");
  }

  // Vérifier le code d'accès staging
  if (!process.env.STAGING_ACCESS_CODE) {
    console.warn("[ENV VALIDATION] ⚠️ STAGING_ACCESS_CODE non défini - l'accès sera ouvert");
  }

  // Vérifier la session secret
  if (!process.env.SESSION_SECRET) {
    errors.push("SESSION_SECRET doit être défini en staging");
  }

  if (errors.length > 0) {
    console.error("[ENV VALIDATION] ❌ Erreurs de configuration:");
    errors.forEach((error) => console.error(`  - ${error}`));
    
    // En staging, on peut être strict
    if (process.env.NODE_ENV === "production" || APP_ENV === "staging") {
      throw new Error(`Configuration invalide: ${errors.join(", ")}`);
    }
  } else {
    console.log("[ENV VALIDATION] ✅ Configuration staging valide");
  }
}

// Exécuter la validation au chargement du module (si en staging)
if (APP_ENV === "staging" && typeof window === "undefined") {
  try {
    validateStagingEnv();
  } catch (error) {
    console.error("[ENV VALIDATION] Erreur critique:", error);
    // Ne pas bloquer le démarrage en développement
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}

