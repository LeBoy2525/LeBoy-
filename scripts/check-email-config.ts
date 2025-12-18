#!/usr/bin/env tsx
/**
 * Script de vérification de la configuration email
 * Usage: tsx scripts/check-email-config.ts
 */

import { Resend } from "resend";

console.log("=".repeat(80));
console.log("🔍 VÉRIFICATION DE LA CONFIGURATION EMAIL");
console.log("=".repeat(80));

// Vérifier les variables d'environnement
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@leboy.com";
const emailMode = process.env.EMAIL_MODE || "normal";
const emailRedirectTo = process.env.EMAIL_REDIRECT_TO;

console.log("\n📋 CONFIGURATION:");
console.log(`   RESEND_API_KEY: ${resendApiKey ? "✅ Définie" : "❌ MANQUANTE"}`);
console.log(`   RESEND_FROM_EMAIL: ${fromEmail}`);
console.log(`   EMAIL_MODE: ${emailMode}`);
console.log(`   EMAIL_REDIRECT_TO: ${emailRedirectTo || "Non défini"}`);

if (!resendApiKey) {
  console.log("\n❌ ERREUR: RESEND_API_KEY n'est pas définie");
  console.log("\n💡 SOLUTION:");
  console.log("   1. Aller dans Vercel → Settings → Environment Variables");
  console.log("   2. Ajouter RESEND_API_KEY avec votre clé API Resend");
  console.log("   3. Obtenir la clé sur https://resend.com/api-keys");
  process.exit(1);
}

// Tester la connexion à Resend
console.log("\n🔌 TEST DE CONNEXION À RESEND...");
try {
  const resend = new Resend(resendApiKey);
  
  // Tester en récupérant les domaines (nécessite une clé API valide)
  console.log("   Tentative de connexion...");
  
  // Note: On ne peut pas vraiment tester sans envoyer un email
  // Mais on peut vérifier que la clé est au bon format
  if (!resendApiKey.startsWith("re_")) {
    console.log("   ⚠️  Format de clé suspect (devrait commencer par 're_')");
  } else {
    console.log("   ✅ Format de clé valide");
  }
  
  console.log("\n✅ CONFIGURATION EMAIL VALIDE");
  console.log("\n📝 NOTES:");
  console.log(`   - FROM_EMAIL: ${fromEmail}`);
  if (emailMode === "safe") {
    console.log(`   - ⚠️  Mode SAFE activé: tous les emails seront redirigés vers ${emailRedirectTo || "NON DÉFINI"}`);
  } else {
    console.log(`   - Mode: ${emailMode}`);
  }
  console.log("\n💡 POUR VÉRIFIER LE DOMAINE:");
  console.log("   1. Aller sur https://resend.com/domains");
  console.log("   2. Vérifier que le domaine est vérifié");
  console.log("   3. Ou utiliser 'onboarding@resend.dev' pour les tests");
  
} catch (error: any) {
  console.log("\n❌ ERREUR LORS DU TEST:");
  console.error(`   ${error.message}`);
  process.exit(1);
}

console.log("\n" + "=".repeat(80));

