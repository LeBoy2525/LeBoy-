import { NextResponse } from "next/server";
import { createResetToken } from "@/lib/passwordResetStore";
import { getUserByEmail } from "@/lib/dataAccess";
import { getPrestataireByEmail } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email as string)?.trim() || "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email invalide." },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();
    const role = await getUserRoleAsync(emailLower);
    
    console.log(`[FORGOT PASSWORD] Rôle détecté pour ${emailLower}: ${role}`);

    // Vérifier que l'utilisateur existe dans la DB
    let userExists = false;
    let userName = "";
    
    if (role === "client") {
      const user = await getUserByEmail(emailLower);
      userExists = !!user;
      userName = user?.fullName || "";
    } else if (role === "prestataire") {
      const prestataire = await getPrestataireByEmail(emailLower);
      userExists = !!prestataire && prestataire.statut !== "rejete";
      userName = prestataire?.nomEntreprise || prestataire?.nomContact || "";
    } else if (role === "admin") {
      // Pour les admins, on peut permettre la réinitialisation
      // mais il faudra une validation supplémentaire
      userExists = true;
      userName = "Administrateur";
    }

    console.log(`[FORGOT PASSWORD] Utilisateur existe: ${userExists} (${role})`);

    if (!userExists) {
      // Pour la sécurité, on retourne toujours un succès
      // même si l'email n'existe pas
      return NextResponse.json(
        {
          success: true,
          message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
        },
        { status: 200 }
      );
    }

    // Créer le token
    const token = createResetToken(emailLower);
    
    // Construire le lien de réinitialisation
    const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
    const resetUrl = `${platformUrl}/reset-password?token=${token}`;
    
    console.log(`[FORGOT PASSWORD] 🔐 Token créé pour ${emailLower}`);
    console.log(`[FORGOT PASSWORD] 🔗 Lien: ${resetUrl}`);

    // Envoyer l'email avec le lien de réinitialisation
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      
      const emailSent = await sendNotificationEmail(
        "password-reset",
        { 
          email: emailLower, 
          name: userName || emailLower.split("@")[0]
        },
        {
          resetUrl,
          platformUrl,
          userName: userName || emailLower.split("@")[0],
        },
        "fr"
      );
      
      if (emailSent) {
        console.log(`[FORGOT PASSWORD] ✅ Email de réinitialisation envoyé à ${emailLower}`);
      } else {
        console.error(`[FORGOT PASSWORD] ⚠️ Échec de l'envoi de l'email à ${emailLower}`);
      }
    } catch (emailError) {
      console.error(`[FORGOT PASSWORD] ❌ Erreur lors de l'envoi de l'email:`, emailError);
      // Ne pas bloquer la requête si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
        // En développement, retourner le token (à retirer en production)
        ...(process.env.NODE_ENV === "development" && { token, resetUrl }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/auth/forgot-password:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
