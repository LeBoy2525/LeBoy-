// lib/emailService.ts
// Service d'envoi d'email avec Resend

import { Resend } from "resend";
import { enqueueEmailSend } from "./email/rateLimit";

// Initialiser Resend avec la clé API depuis les variables d'environnement
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Email de l'expéditeur (doit être vérifié dans Resend)
// Pour le développement/staging, utiliser onboarding@resend.dev (domaine de test fourni par Resend)
// Pour la production, utiliser un domaine vérifié (ex: noreply@leboy.com)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
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
 * Résultat détaillé de l'envoi d'email
 */
export type EmailSendResult = {
  success: boolean;
  error?: string;
  errorCode?: string;
  emailId?: string;
  recipient?: string;
  redirected?: boolean;
};

/**
 * Vérifie la configuration email et retourne un diagnostic
 */
export function checkEmailConfig(): {
  configured: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!process.env.RESEND_API_KEY) {
    issues.push("RESEND_API_KEY n'est pas définie dans les variables d'environnement");
  } else if (!process.env.RESEND_API_KEY.startsWith("re_")) {
    warnings.push("Format de RESEND_API_KEY suspect (devrait commencer par 're_')");
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  if (fromEmail === "onboarding@resend.dev" && !process.env.RESEND_FROM_EMAIL) {
    warnings.push("FROM_EMAIL utilise le domaine de test 'onboarding@resend.dev' - pour la production, configurez RESEND_FROM_EMAIL avec un domaine vérifié");
  } else if (fromEmail.includes("@leboy.com") && !process.env.RESEND_FROM_EMAIL) {
    warnings.push("FROM_EMAIL utilise 'noreply@leboy.com' - vérifiez que le domaine leboy.com est vérifié dans Resend");
  }

  const emailMode = process.env.EMAIL_MODE || "normal";
  if (emailMode === "safe") {
    if (!process.env.EMAIL_REDIRECT_TO) {
      issues.push("EMAIL_MODE=safe mais EMAIL_REDIRECT_TO n'est pas défini");
    } else {
      warnings.push(`Mode SAFE activé: tous les emails seront redirigés vers ${process.env.EMAIL_REDIRECT_TO}`);
    }
  }

  return {
    configured: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Envoie un email de vérification avec Resend
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  fullName: string
): Promise<EmailSendResult> {
  try {
    // Vérifier la configuration Resend
    const hasResendKey = !!process.env.RESEND_API_KEY;
    const resendConfigured = !!resend;

    if (!hasResendKey || !resendConfigured) {
      const errorMsg = "RESEND_API_KEY non configurée dans les variables d'environnement";
      console.error("=".repeat(80));
      console.error("❌ ERREUR CONFIGURATION EMAIL");
      console.error("=".repeat(80));
      console.error(`📧 Email destinataire: ${email}`);
      console.error(`👤 Nom: ${fullName}`);
      console.error(`🔐 Code de vérification: ${code}`);
      console.error(`⚠️ ${errorMsg}`);
      console.error("=".repeat(80));
      console.error("💡 SOLUTION:");
      console.error("   1. Aller dans Vercel → Settings → Environment Variables");
      console.error("   2. Ajouter RESEND_API_KEY avec votre clé API Resend");
      console.error("   3. Redéployer l'application");
      console.error("=".repeat(80));
      
      return {
        success: false,
        error: errorMsg,
        errorCode: "RESEND_NOT_CONFIGURED",
        recipient: email,
      };
    }

    // Appliquer le mode safe si activé
    const safeEmail = getSafeRecipient(email);
    const isRedirected = safeEmail !== email.toLowerCase();

    if (isRedirected) {
      console.log(`[EMAIL SAFE MODE] Email redirigé: ${email} → ${safeEmail}`);
    }

    console.log(`[EMAIL] Tentative d'envoi à ${safeEmail} depuis ${FROM_EMAIL}`);

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
      const errorDetails = typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error);
      console.error("=".repeat(80));
      console.error("❌ ERREUR ENVOI EMAIL RESEND");
      console.error("=".repeat(80));
      console.error(`📧 Destinataire: ${email}${isRedirected ? ` (redirigé vers ${safeEmail})` : ''}`);
      console.error(`📤 Expéditeur: ${FROM_EMAIL}`);
      console.error(`🔐 Code: ${code}`);
      console.error(`❌ Erreur:`, errorDetails);
      console.error("=".repeat(80));
      console.error("💡 CAUSES POSSIBLES:");
      console.error("   1. RESEND_API_KEY invalide ou expirée");
      console.error("   2. FROM_EMAIL non vérifié dans Resend");
      console.error("   3. Domaine non vérifié dans Resend");
      console.error("   4. Limite de quota Resend atteinte");
      console.error("=".repeat(80));
      
      return {
        success: false,
        error: `Erreur Resend: ${errorDetails}`,
        errorCode: "RESEND_ERROR",
        recipient: safeEmail,
        redirected: isRedirected,
      };
    }

    console.log(`✅ Email de vérification envoyé avec succès`);
    console.log(`   📧 Destinataire: ${email}${isRedirected ? ` (redirigé vers ${safeEmail})` : ''}`);
    console.log(`   📤 Expéditeur: ${FROM_EMAIL}`);
    console.log(`   🆔 Email ID: ${data?.id}`);
    
    return {
      success: true,
      emailId: data?.id,
      recipient: safeEmail,
      redirected: isRedirected,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error("=".repeat(80));
    console.error("❌ EXCEPTION LORS DE L'ENVOI D'EMAIL");
    console.error("=".repeat(80));
    console.error(`📧 Destinataire: ${email}`);
    console.error(`🔐 Code: ${code}`);
    console.error(`❌ Exception:`, errorMsg);
    console.error(`📚 Stack:`, error?.stack);
    console.error("=".repeat(80));
    
    return {
      success: false,
      error: `Exception: ${errorMsg}`,
      errorCode: "EMAIL_EXCEPTION",
      recipient: email,
    };
  }
}

/**
 * Envoie une notification email générique avec rate limiting
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

    // Utiliser le rate limiter pour éviter les erreurs 429
    try {
      await enqueueEmailSend(async () => {
        const { error } = await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [safeEmail],
          subject,
          html,
        });

        if (error) {
          // Propager l'erreur pour que le rate limiter puisse gérer le retry
          throw error;
        }
      });

      return true;
    } catch (error: any) {
      // Si c'est une erreur 429 après retry, loguer mais ne pas bloquer
      if (error?.statusCode === 429) {
        console.error(`[email] Erreur Resend 429 (après retry) pour ${safeEmail}:`, error);
        return false;
      }
      // Autres erreurs
      console.error("Erreur Resend:", error);
      return false;
    }
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
    "provider-validated": {
      fr: "Félicitations ! Votre compte prestataire est activé - LeBoy",
      en: "Congratulations! Your provider account is activated - LeBoy",
    },
    "password-reset": {
      fr: "Réinitialisation de votre mot de passe - LeBoy",
      en: "Reset your password - LeBoy",
    },
    "mission-not-selected": {
      fr: "Mission non retenue - LeBoy",
      en: "Mission not selected - LeBoy",
    },
    "admin-message": {
      fr: "Nouveau message de l'administrateur - LeBoy",
      en: "New message from administrator - LeBoy",
    },
    "advance-sent": {
      fr: "Avance reçue - LeBoy",
      en: "Advance received - LeBoy",
    },
    "payment-complete": {
      fr: "Paiement complet reçu - LeBoy",
      en: "Full payment received - LeBoy",
    },
    "mission-completed": {
      fr: "Mission terminée - LeBoy",
      en: "Mission completed - LeBoy",
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
          <a href="${data.platformUrl || (process.env.NEXT_PUBLIC_APP_URL || "https://leboy.com")}/connexion" style="background: #D4A657; color: #0B2135; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Se connecter à mon espace admin
          </a>
        </p>
      `;
      break;
    case "provider-validated":
      let passwordSection = "";
      if (data.hasTempPassword && data.tempPassword) {
        passwordSection = `
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0 0 12px 0; font-weight: bold; color: #92400E;">
              🔑 Mot de passe temporaire
            </p>
            <p style="margin: 0 0 8px 0; color: #78350F;">
              Votre mot de passe temporaire est : <strong style="font-family: monospace; background: #FDE68A; padding: 4px 8px; border-radius: 4px;">${data.tempPassword}</strong>
            </p>
            <p style="margin: 8px 0 0 0; color: #78350F; font-size: 13px;">
              ⚠️ <strong>Important :</strong> Veuillez changer ce mot de passe lors de votre première connexion pour des raisons de sécurité.
            </p>
          </div>
        `;
      }
      
      content = `
        <p style="font-size: 18px; color: #10B981; font-weight: bold; margin-bottom: 20px;">
          🎉 Félicitations ! Votre compte prestataire a été validé avec succès.
        </p>
        <p>Votre compte prestataire LeBoy (<strong>${data.providerRef || "N/A"}</strong>) a été activé par notre équipe.</p>
        <p>Vous pouvez maintenant vous connecter à votre espace prestataire et commencer à recevoir des missions.</p>
        ${passwordSection}
        <p style="margin-top: 30px;">
          <a href="${data.loginUrl || (data.platformUrl ? `${data.platformUrl}/prestataires/connexion` : "/prestataires/connexion")}" style="background: #D4A657; color: #0B2135; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
            Se connecter à mon espace
          </a>
        </p>
        <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
          Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@leboy.com" style="color: #D4A657;">contact@leboy.com</a>
        </p>
      `;
      break;
    case "password-reset":
      content = `
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
        <p style="margin-top: 30px;">
          <a href="${data.resetUrl || (data.platformUrl ? `${data.platformUrl}/reset-password?token=${data.token || ""}` : "/reset-password")}" style="background: #D4A657; color: #0B2135; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
          ⚠️ <strong>Important :</strong> Ce lien est valide pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
        <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
          Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@leboy.com" style="color: #D4A657;">contact@leboy.com</a>
        </p>
      `;
      break;
    case "mission-not-selected":
      const platformUrl = data.platformUrl || (process.env.NEXT_PUBLIC_APP_URL || "https://leboy.com");
      content = `
        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #92400E; font-size: 16px;">
            ℹ️ Information importante
          </p>
          <p style="margin: 0; color: #78350F;">
            Votre mission <strong>${data.missionRef || "N/A"}</strong> n'a pas été retenue pour cette demande.
          </p>
        </div>
        <p>Bonjour ${name},</p>
        <p>Nous vous informons que votre mission <strong>${data.missionRef || "N/A"}</strong> pour la demande <strong>${data.demandeRef || "N/A"}</strong> n'a pas été sélectionnée par notre équipe.</p>
        <p>Un autre prestataire a été choisi pour cette mission selon les critères de qualité, prix et délai.</p>
        ${data.estimationPrix ? `
        <div style="background: #F9FAFB; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;"><strong>Votre estimation :</strong></p>
          <ul style="margin: 0; padding-left: 20px; color: #4B5563;">
            <li>Prix proposé : <strong>${data.estimationPrix.toLocaleString()} FCFA</strong></li>
            ${data.estimationDelai ? `<li>Délai estimé : <strong>${data.estimationDelai} heures</strong></li>` : ""}
          </ul>
        </div>
        ` : ""}
        <p style="margin-top: 30px;">Nous vous remercions pour votre intérêt et votre participation. Nous espérons avoir l'occasion de collaborer avec vous sur de futures missions.</p>
        <p style="margin-top: 20px;">
          <a href="${platformUrl}/prestataires/connexion" style="background: #D4A657; color: #0B2135; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Se connecter à mon espace prestataire
          </a>
        </p>
        <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
          Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@leboy.com" style="color: #D4A657;">contact@leboy.com</a>
        </p>
      `;
      break;
    case "admin-message":
      const loginUrl = data.platformUrl || (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/prestataires/connexion` : "/prestataires/connexion");
      content = `
        <p>Bonjour ${name},</p>
        <p>Vous avez reçu un message de l'administrateur LeBoy concernant votre mission <strong>${data.missionRef || "N/A"}</strong>.</p>
        ${data.missionTitre ? `<p><strong>Mission:</strong> ${data.missionTitre}</p>` : ""}
        <div style="background: #F9FAFB; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;"><strong>Message de l'administrateur :</strong></p>
          <p style="margin: 0; color: #4B5563;">${(data.messageContent || "").split('\n').map((line: string) => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')).join('<br>')}</p>
        </div>
        <p style="margin-top: 30px;">Veuillez vous connecter à votre espace prestataire pour répondre à ce message.</p>
        <p style="margin-top: 20px;">
          <a href="${loginUrl}" style="background: #D4A657; color: #0B2135; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
            Se connecter à mon espace prestataire
          </a>
        </p>
        <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
          Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@leboy.com" style="color: #D4A657;">contact@leboy.com</a>
        </p>
      `;
      break;
    case "advance-sent":
      const loginUrlAdvance = data.platformUrl ? `${data.platformUrl}/prestataires/connexion` : (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/prestataires/connexion` : "/prestataires/connexion");
      const avancePercentage = data.avancePercentage || 50;
      content = `
        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #92400E; font-size: 16px;">
            💰 Avance partielle reçue
          </p>
          <p style="margin: 0; color: #78350F;">
            Vous avez reçu une avance de <strong>${avancePercentage}%</strong> pour la mission <strong>${data.missionRef || "N/A"}</strong>.
          </p>
        </div>
        <p>Bonjour ${name},</p>
        <p>Nous vous informons qu'une avance de <strong>${avancePercentage}%</strong> a été versée pour votre mission <strong>${data.missionRef || "N/A"}</strong>.</p>
        <div style="background: #F9FAFB; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;"><strong>Détails du paiement :</strong></p>
          <ul style="margin: 0; padding-left: 20px; color: #4B5563;">
            <li>Montant de l'avance : <strong>${(data.montantAvance || 0).toLocaleString()} FCFA</strong></li>
            <li>Pourcentage : <strong>${avancePercentage}%</strong></li>
            <li>Service : <strong>${data.serviceType || "N/A"}</strong></li>
          </ul>
        </div>
        <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
          ⚠️ <strong>Important :</strong> Le solde restant (${100 - avancePercentage}%) vous sera versé après validation de la mission par l'administrateur.
        </p>
        <p style="margin-top: 30px;">Vous pouvez maintenant prendre en charge la mission et commencer le travail.</p>
        <p style="margin-top: 20px;">
          <a href="${loginUrlAdvance}" style="background: #D4A657; color: #0B2135; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
            Se connecter à mon espace prestataire
          </a>
        </p>
        <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
          Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@leboy.com" style="color: #D4A657;">contact@leboy.com</a>
        </p>
      `;
      break;
    case "payment-complete":
      const loginUrlComplete = data.platformUrl ? `${data.platformUrl}/prestataires/connexion` : (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/prestataires/connexion` : "/prestataires/connexion");
      content = `
        <div style="background: #D1FAE5; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #065F46; font-size: 18px;">
            ✅ Paiement complet reçu
          </p>
          <p style="margin: 0; color: #047857; font-size: 16px;">
            Le paiement intégral (100%) a été effectué pour la mission <strong>${data.missionRef || "N/A"}</strong>.
          </p>
        </div>
        <p>Bonjour ${name},</p>
        <p style="font-size: 16px; color: #10B981; font-weight: bold; margin-bottom: 20px;">
          🎉 Excellente nouvelle ! Le paiement complet a été effectué pour votre mission.
        </p>
        <p>Nous vous informons que le <strong>paiement intégral (100%)</strong> a été versé pour votre mission <strong>${data.missionRef || "N/A"}</strong>.</p>
        <div style="background: #F9FAFB; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;"><strong>Détails du paiement :</strong></p>
          <ul style="margin: 0; padding-left: 20px; color: #4B5563;">
            <li>Montant total : <strong>${(data.montantAvance || data.montantTotal || 0).toLocaleString()} FCFA</strong></li>
            <li>Pourcentage : <strong>100%</strong></li>
            <li>Service : <strong>${data.serviceType || "N/A"}</strong></li>
          </ul>
        </div>
        <p style="margin-top: 20px; color: #10B981; font-size: 14px; font-weight: bold;">
          ✅ Aucun solde restant - Le paiement est complet.
        </p>
        <p style="margin-top: 30px;">Vous pouvez maintenant prendre en charge la mission et commencer le travail.</p>
        <p style="margin-top: 20px;">
          <a href="${loginUrlComplete}" style="background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
            Se connecter à mon espace prestataire
          </a>
        </p>
        <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
          Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@leboy.com" style="color: #D4A657;">contact@leboy.com</a>
        </p>
      `;
      break;
    case "mission-completed":
      const loginUrlClient = data.platformUrl ? `${data.platformUrl}/connexion` : (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/connexion` : "/connexion");
      content = `
        <p style="font-size: 18px; color: #10B981; font-weight: bold; margin-bottom: 20px;">
          🎉 Félicitations ! Votre mission est terminée.
        </p>
        <p>Bonjour ${name},</p>
        <p>Nous avons le plaisir de vous informer que votre mission <strong>${data.missionRef || "N/A"}</strong> a été complétée avec succès.</p>
        <div style="background: #F9FAFB; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;"><strong>Détails de la mission :</strong></p>
          <ul style="margin: 0; padding-left: 20px; color: #4B5563;">
            <li>Référence : <strong>${data.missionRef || "N/A"}</strong></li>
            <li>Service : <strong>${data.serviceType || "N/A"}</strong></li>
            <li>Date de clôture : <strong>${data.dateCloture ? new Date(data.dateCloture).toLocaleDateString("fr-FR") : "N/A"}</strong></li>
          </ul>
        </div>
        <p style="margin-top: 30px;">Vous pouvez maintenant consulter les preuves d'accomplissement et télécharger le rapport de mission.</p>
        <p style="margin-top: 20px;">
          <a href="${loginUrlClient}" style="background: #D4A657; color: #0B2135; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
            Se connecter à mon espace client
          </a>
        </p>
        <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
          Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@leboy.com" style="color: #D4A657;">contact@leboy.com</a>
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
