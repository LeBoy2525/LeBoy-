import type { UserRole } from "./types";

// Définir les emails/rôles
// Option 1 : Depuis les variables d'environnement
const ADMIN_EMAILS_ENV = process.env.ICD_ADMIN_EMAILS
  ? process.env.ICD_ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
  : [];

// Option 2 : Liste par défaut (inclut l'ancien email pour rétrocompatibilité)
const ADMIN_EMAILS_DEFAULT = [
  "contact@leboy.com",
  "contact.icd-relay@gmail.com", // Ancien email admin (rétrocompatibilité)
].map(e => e.toLowerCase());

// Option 3 : Depuis ICD_ADMIN_EMAIL (variable unique)
const ADMIN_EMAIL_SINGLE = process.env.ICD_ADMIN_EMAIL
  ? [process.env.ICD_ADMIN_EMAIL.toLowerCase()]
  : [];

// Combiner les trois
const ADMIN_EMAILS = [
  ...ADMIN_EMAILS_DEFAULT,
  ...ADMIN_EMAILS_ENV,
  ...ADMIN_EMAIL_SINGLE,
].filter(Boolean);

// Fonction pour déterminer le rôle d'un utilisateur (version synchrone - legacy)
// ⚠️ Utilise directement prestatairesStore pour compatibilité avec code existant
export function getUserRole(email: string): UserRole {
  if (!email) return "client";
  
  const emailLower = email.toLowerCase();
  
  // Debug: afficher les emails admin configurés
  if (ADMIN_EMAILS.length > 0) {
    console.log(`[AUTH] Emails admin configurés: ${ADMIN_EMAILS.join(", ")}`);
  }
  
  if (ADMIN_EMAILS.includes(emailLower)) {
    console.log(`[AUTH] ✅ Email ${emailLower} reconnu comme admin`);
    return "admin";
  }
  
  // Vérifier si c'est un prestataire (tous les statuts sauf rejeté)
  // Utilisation directe de prestatairesStore pour compatibilité synchrone
  try {
    const { prestatairesStore } = require("./prestatairesStore");
    if (prestatairesStore && Array.isArray(prestatairesStore) && prestatairesStore.length > 0) {
      const prestataire = prestatairesStore.find(
        (p) => p && p.email && p.email.toLowerCase() === emailLower && p.statut !== "rejete"
      );
      
      if (prestataire) {
        return "prestataire";
      }
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du prestataire:", error);
    // En cas d'erreur, continuer comme client
  }
  
  // Par défaut, c'est un client
  return "client";
}

// Fonction pour déterminer le rôle d'un utilisateur (version asynchrone - nouvelle)
// Utilise dataAccess pour basculer entre JSON et DB selon USE_DB
export async function getUserRoleAsync(email: string): Promise<UserRole> {
  if (!email) return "client";
  
  const emailLower = email.toLowerCase();
  
  // Vérifier si c'est un admin
  if (ADMIN_EMAILS.includes(emailLower)) {
    console.log(`[AUTH] ✅ Email ${emailLower} reconnu comme admin`);
    return "admin";
  }
  
  // Vérifier si c'est un prestataire (tous les statuts sauf rejeté)
  try {
    const { getPrestataireByEmail } = await import("./dataAccess");
    const prestataire = await getPrestataireByEmail(emailLower);
    
    console.log(`[AUTH ASYNC] Vérification prestataire pour ${emailLower}:`, prestataire ? { id: prestataire.id, email: prestataire.email, statut: prestataire.statut } : null);
    
    if (prestataire && prestataire.statut !== "rejete") {
      console.log(`[AUTH ASYNC] ✅ Rôle détecté: prestataire pour ${emailLower}`);
      return "prestataire";
    } else {
      console.log(`[AUTH ASYNC] ❌ Pas de prestataire valide pour ${emailLower}`);
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du prestataire (async):", error);
    // En cas d'erreur, continuer comme client
  }
  
  // Par défaut, c'est un client
  return "client";
}

// Fonction pour vérifier si un utilisateur a un rôle spécifique
export function hasRole(email: string, role: UserRole): boolean {
  return getUserRole(email) === role;
}

// Fonction pour obtenir l'email de l'admin (premier email de la liste)
export function getAdminEmail(): string {
  return ADMIN_EMAILS.length > 0 ? ADMIN_EMAILS[0] : "contact@leboy.com";
}

export function isAdmin(email: string): boolean {
  return hasRole(email, "admin");
}

export function isPrestataire(email: string): boolean {
  return hasRole(email, "prestataire");
}

export async function isPrestataireAsync(email: string): Promise<boolean> {
  const role = await getUserRoleAsync(email);
  return role === "prestataire";
}

export function isClient(email: string): boolean {
  return hasRole(email, "client");
}
