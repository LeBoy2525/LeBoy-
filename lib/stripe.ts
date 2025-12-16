// lib/stripe.ts
// Configuration Stripe avec protection contre les clés live en staging

import Stripe from "stripe";

const APP_ENV = process.env.APP_ENV || "local";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * Vérifie que les clés Stripe sont en mode TEST en staging
 * Bloque le démarrage si des clés LIVE sont détectées en staging
 */
function validateStripeKeys() {
  if (APP_ENV === "production") {
    // En production, on accepte les clés live
    return;
  }

  // En staging/local, on refuse les clés live
  if (STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.startsWith("sk_live")) {
    throw new Error(
      `❌ ERREUR CRITIQUE: Clé Stripe LIVE détectée en environnement ${APP_ENV}!\n` +
      `La variable STRIPE_SECRET_KEY commence par "sk_live" ce qui est interdit en staging.\n` +
      `Utilisez uniquement des clés TEST (sk_test_...) en staging.`
    );
  }

  if (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_live")) {
    throw new Error(
      `❌ ERREUR CRITIQUE: Clé Stripe PUBLISHABLE LIVE détectée en environnement ${APP_ENV}!\n` +
      `La variable NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY commence par "pk_live" ce qui est interdit en staging.\n` +
      `Utilisez uniquement des clés TEST (pk_test_...) en staging.`
    );
  }

  // Si DISABLE_LIVE_STRIPE est activé, forcer le blocage même en production
  if (process.env.DISABLE_LIVE_STRIPE === "true" && STRIPE_SECRET_KEY?.startsWith("sk_live")) {
    throw new Error(
      `❌ ERREUR CRITIQUE: DISABLE_LIVE_STRIPE=true mais clé LIVE détectée!\n` +
      `Cette configuration est contradictoire et dangereuse.`
    );
  }
}

// Valider les clés au chargement du module
try {
  validateStripeKeys();
} catch (error) {
  console.error(error);
  // En développement, on peut permettre le démarrage mais logger l'erreur
  // En production/staging, on devrait faire échouer le build
  if (process.env.NODE_ENV === "production" || APP_ENV === "staging") {
    throw error;
  }
}

// Initialiser Stripe uniquement si la clé secrète est présente
export const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
}) : null;

export const stripePublishableKey = NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;

/**
 * Vérifie si Stripe est configuré
 */
export function isStripeConfigured(): boolean {
  return stripe !== null && stripePublishableKey !== null;
}

/**
 * Vérifie si on est en mode TEST
 */
export function isStripeTestMode(): boolean {
  return STRIPE_SECRET_KEY?.startsWith("sk_test") === true;
}

/**
 * Vérifie si les payouts sont désactivés (staging)
 */
export function arePayoutsDisabled(): boolean {
  return APP_ENV === "staging" || process.env.DISABLE_PAYOUTS === "true";
}

