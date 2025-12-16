import { NextResponse } from "next/server";
import { createResetToken } from "@/lib/passwordResetStore";
import { getUserByEmail } from "@/lib/usersStore";
import { prestatairesStore } from "@/lib/prestatairesStore";
import { getUserRole } from "@/lib/auth";

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
    const role = getUserRole(emailLower);

    // Vérifier que l'utilisateur existe
    let userExists = false;
    if (role === "client") {
      userExists = !!getUserByEmail(emailLower);
    } else if (role === "prestataire") {
      userExists = prestatairesStore.some(
        (p) => p.email.toLowerCase() === emailLower && p.statut !== "rejete"
      );
    } else if (role === "admin") {
      // Pour les admins, on peut permettre la réinitialisation
      // mais il faudra une validation supplémentaire
      userExists = true;
    }

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

    // TODO: Envoyer l'email avec le lien de réinitialisation
    // Pour l'instant, on log le token (à retirer en production)
    console.log(`🔐 Token de réinitialisation pour ${emailLower}: ${token}`);
    console.log(`🔗 Lien: /reset-password?token=${token}`);

    return NextResponse.json(
      {
        success: true,
        message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
        // En développement, retourner le token (à retirer en production)
        ...(process.env.NODE_ENV === "development" && { token }),
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
