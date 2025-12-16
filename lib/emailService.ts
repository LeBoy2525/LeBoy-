// lib/emailService.ts
// Service d'envoi d'email avec Resend

import { Resend } from "resend";

// Initialiser Resend avec la clé API depuis les variables d'environnement
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Email de l'expéditeur (doit être vérifié dans Resend)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@leboy.com";
const FROM_NAME = "LeBoy";

// Configuration mode "safe" pour staging
const EMAIL_MODE = process.env.EMAIL_MODE || "normal";
const EMAIL_REDIRECT_TO = process.env.EMAIL_REDIRECT_TO;
const EMAIL_ALLOWLIST = process.env.EMAIL_ALLOWLIST
  ? process.env.EMAIL_ALLOWLIST.split(",").map((e) => e.trim().toLowerCase())
  : [];
const STAGING_EMAIL_ALLOWLIST = process.env.STAGING_EMAIL_ALLOWLIST
  ? process.env.STAGING_EMAIL_ALLOWLIST.split(",").map((e) => e.trim().toLowerCase())
  : [];

/**
 * Détermine le destinataire réel selon le mode email
 */
function getSafeRecipient(originalEmail: string): string {
  // Si mode safe activé, rediriger vers EMAIL_REDIRECT_TO
  if (EMAIL_MODE === "safe" && EMAIL_REDIRECT_TO) {
    console.log(`[EMAIL SAFE MODE] Redirection: ${originalEmail} → ${EMAIL_REDIRECT_TO}`);
    return EMAIL_REDIRECT_TO;
  }

  // Si whitelist activée, vérifier l'email
  const allowlist = STAGING_EMAIL_ALLOWLIST.length > 0 ? STAGING_EMAIL_ALLOWLIST : EMAIL_ALLOWLIST;
  if (allowlist.length > 0) {
    const emailLower = originalEmail.toLowerCase();
    if (!allowlist.includes(emailLower)) {
      // Si pas dans la whitelist, rediriger vers EMAIL_REDIRECT_TO ou bloquer
      if (EMAIL_REDIRECT_TO) {
        console.log(`[EMAIL SAFE MODE] Email ${originalEmail} non autorisé, redirection vers ${EMAIL_REDIRECT_TO}`);
        return EMAIL_REDIRECT_TO;
      } else {
        console.warn(`[EMAIL SAFE MODE] Email ${originalEmail} bloqué (non dans whitelist)`);
        throw new Error(`Email ${originalEmail} non autorisé en mode safe`);
      }
    }
  }

  return originalEmail;
}

/**
 * Génère un code de vérification à 6 chiffres
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envoie un email de vérification avec Resend
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  fullName: string
): Promise<boolean> {
  try {
    // Si Resend n'est pas configuré, logger le code (mode développement)
    if (!resend || !process.env.RESEND_API_KEY) {
      console.log("=".repeat(60));
      console.log(`📧 EMAIL DE VÉRIFICATION POUR: ${email}`);
      console.log(`👤 Nom: ${fullName}`);
      console.log(`🔐 Code de vérification: ${code}`);
      console.log("=".repeat(60));
      console.log("⚠️ Resend n'est pas configuré. Ajoutez RESEND_API_KEY dans .env.local");
      return true; // On retourne true pour ne pas bloquer le processus
    }

    // Appliquer le mode safe si activé
    const safeEmail = getSafeRecipient(email);

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [safeEmail],
      subject: "Vérifiez votre adresse email - LeBoy",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0B2135 0%, #1F4E79 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #D4A657; margin: 0; font-size: 28px;">LeBoy</h1>
              <p style="color: #F2F2F2; margin: 10px 0 0 0; font-size: 14px;">Votre partenaire de confiance au pays</p>
            </div>
            
            <div style="background: #FFFFFF; padding: 40px; border: 1px solid #E2E2E8; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #0B2135; margin-top: 0;">Bonjour ${fullName},</h2>
              
              <p style="color: #4B4F58; font-size: 16px;">
                Merci de vous être inscrit sur LeBoy. Pour activer votre compte, veuillez utiliser le code de vérification ci-dessous :
              </p>
              
              <div style="background: #F9F9FB; border: 2px solid #D4A657; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #4B4F58; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Code de vérification</p>
                <p style="margin: 0; font-size: 36px; font-weight: bold; color: #0B2135; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</p>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                Ce code est valide pendant <strong>24 heures</strong>. Si vous n'avez pas créé de compte sur LeBoy, vous pouvez ignorer cet email.
              </p>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E2E8;">
                <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                  Si vous avez des questions, contactez-nous à <a href="mailto:contact@leboy.com" style="color: #D4A657;">contact@leboy.com</a>
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9CA3AF; font-size: 12px;">
              <p>© ${new Date().getFullYear()} LeBoy. Tous droits réservés.</p>
            </div>
          </body>
        </html>
      `,
      text: `
Bonjour ${fullName},

Merci de vous être inscrit sur LeBoy. Pour activer votre compte, veuillez utiliser le code de vérification suivant :

Code de vérification: ${code}

Ce code est valide pendant 24 heures. Si vous n'avez pas créé de compte sur LeBoy, vous pouvez ignorer cet email.

Si vous avez des questions, contactez-nous à contact@leboy.com

© ${new Date().getFullYear()} LeBoy. Tous droits réservés.
      `,
    });

    if (error) {
      console.error("Erreur Resend:", error);
      // En développement, logger quand même le code
      console.log(`📧 Code de vérification (fallback): ${code}`);
      return false;
    }

    console.log(`✅ Email de vérification envoyé à ${email} (ID: ${data?.id})`);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    // En développement, logger le code même en cas d'erreur
    console.log(`📧 Code de vérification (fallback): ${code}`);
    return false;
  }
}

/**
 * Envoie une notification email générique
 */
export async function sendNotificationEmail(
  type: string,
  recipient: { email: string; name?: string },
  data: Record<string, any>,
  lang: "fr" | "en" = "fr"
): Promise<boolean> {
  try {
    if (!resend || !process.env.RESEND_API_KEY) {
      console.log(`📧 Notification ${type} pour ${recipient.email}:`, data);
      return true;
    }

    const subject = getNotificationSubject(type, lang);
    const html = getNotificationHTML(type, recipient, data, lang);

    // Appliquer le mode safe si activé
    const safeEmail = getSafeRecipient(recipient.email);

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [safeEmail],
      subject,
      html,
    });

    if (error) {
      console.error("Erreur Resend:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification:", error);
    return false;
  }
}

/**
 * Fonction générique pour envoyer un email
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    if (!resend || !process.env.RESEND_API_KEY) {
      console.log(`📧 Email à ${Array.isArray(to) ? to.join(", ") : to}: ${subject}`);
      return true;
    }

    // Appliquer le mode safe si activé
    const recipients = Array.isArray(to) ? to : [to];
    const safeRecipients = recipients.map((email) => getSafeRecipient(email));

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: safeRecipients,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Erreur Resend:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return false;
  }
}

// Fonctions helper pour les notifications
function getNotificationSubject(type: string, lang: "fr" | "en"): string {
  const subjects: Record<string, { fr: string; en: string }> = {
    "demande-created": {
      fr: "Nouvelle demande reçue - LeBoy",
      en: "New request received - LeBoy",
    },
    "mission-assigned": {
      fr: "Nouvelle mission assignée - LeBoy",
      en: "New mission assigned - LeBoy",
    },
    "mission-update": {
      fr: "Mise à jour de mission - LeBoy",
      en: "Mission update - LeBoy",
    },
    "payment-received": {
      fr: "Paiement reçu - LeBoy",
      en: "Payment received - LeBoy",
    },
    "proposition-submitted": {
      fr: "Nouvelle proposition reçue - LeBoy",
      en: "New proposal received - LeBoy",
    },
  };

  return subjects[type]?.[lang] || "Notification LeBoy";
}

function getNotificationHTML(
  type: string,
  recipient: { email: string; name?: string },
  data: Record<string, any>,
  lang: "fr" | "en"
): string {
  const name = recipient.name || recipient.email.split("@")[0];
  
  // Template de base
  let content = "";
  
  switch (type) {
    case "demande-created":
      content = `
        <p>Une nouvelle demande a été créée :</p>
        <ul>
          <li><strong>Référence:</strong> ${data.ref}</li>
          <li><strong>Client:</strong> ${data.clientName}</li>
          <li><strong>Service:</strong> ${data.serviceType}</li>
          <li><strong>Email client:</strong> ${data.clientEmail}</li>
        </ul>
      `;
      break;
    case "mission-assigned":
      content = `
        <p>Une nouvelle mission vous a été assignée :</p>
        <ul>
          <li><strong>Référence:</strong> ${data.missionRef}</li>
          <li><strong>Titre:</strong> ${data.missionTitre}</li>
        </ul>
      `;
      break;
    case "proposition-submitted":
      content = `
        <p>Une nouvelle proposition a été soumise pour la demande ${data.demandeRef} :</p>
        <ul>
          <li><strong>Référence proposition:</strong> ${data.propositionRef}</li>
          <li><strong>Prestataire:</strong> ${data.prestataireNom}</li>
          <li><strong>Prix proposé:</strong> ${data.prix} FCFA</li>
          <li><strong>Délai estimé:</strong> ${data.delai} jour(s)</li>
        </ul>
        <p style="margin-top: 20px;">
          <a href="${data.platformUrl}/admin/demandes/${data.demandeId}" style="background: #D4A657; color: #0B2135; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Voir la proposition
          </a>
        </p>
      `;
      break;
    default:
      content = `<p>Vous avez reçu une notification de LeBoy.</p>`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0B2135 0%, #1F4E79 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #D4A657; margin: 0; font-size: 28px;">LeBoy</h1>
        </div>
        <div style="background: #FFFFFF; padding: 40px; border: 1px solid #E2E2E8; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #0B2135; margin-top: 0;">Bonjour ${name},</h2>
          ${content}
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E2E8;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
              <a href="mailto:contact@leboy.com" style="color: #D4A657;">contact@leboy.com</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
