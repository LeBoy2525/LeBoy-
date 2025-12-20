import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  validateResetToken,
  markTokenAsUsed,
} from "@/lib/passwordResetStore";
import { getUserByEmail } from "@/lib/dataAccess";
import { updatePrestataire } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = (body.token as string)?.trim() || "";
    const newPassword = (body.password as string) || "";

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token et mot de passe requis." },
        { status: 400 }
      );
    }

    if (!isValidPassword(newPassword)) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    // Valider le token
    const email = validateResetToken(token);
    if (!email) {
      return NextResponse.json(
        { error: "Token invalide ou expiré." },
        { status: 400 }
      );
    }

    console.log(`[RESET PASSWORD] Réinitialisation pour: ${email}`);

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Mettre à jour selon le rôle (utiliser les fonctions DB)
    const role = await getUserRoleAsync(email);
    let updated = false;

    console.log(`[RESET PASSWORD] Rôle détecté: ${role}`);

    if (role === "client") {
      const user = await getUserByEmail(email);
      if (user) {
        const { updateUser } = await import("@/repositories/usersRepo");
        await updateUser(user.id, { passwordHash });
        updated = true;
        console.log(`[RESET PASSWORD] ✅ Mot de passe client mis à jour`);
      }
    } else if (role === "prestataire") {
      const { getPrestataireByEmail } = await import("@/lib/dataAccess");
      const prestataire = await getPrestataireByEmail(email);
      if (prestataire) {
        await updatePrestataire(prestataire.id, { passwordHash });
        updated = true;
        console.log(`[RESET PASSWORD] ✅ Mot de passe prestataire mis à jour`);
      }
    } else if (role === "admin") {
      // Pour les admins, on ne peut pas changer le mot de passe via ce système
      // Il faut le changer dans les variables d'environnement
      return NextResponse.json(
        {
          error: "Pour les administrateurs, contactez le support technique.",
        },
        { status: 403 }
      );
    }

    if (!updated) {
      console.error(`[RESET PASSWORD] ❌ Utilisateur non trouvé pour ${email}`);
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }

    // Marquer le token comme utilisé
    markTokenAsUsed(token);

    return NextResponse.json(
      {
        success: true,
        message: "Mot de passe réinitialisé avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/auth/reset-password:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
