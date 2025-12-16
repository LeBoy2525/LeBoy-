import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail, setVerificationCode } from "@/lib/dataAccess";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/emailService";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const fullName = (data.get("fullName") as string)?.trim() || "";
    const email = (data.get("email") as string)?.trim() || "";
    const password = (data.get("password") as string) || "";
    const country = (data.get("country") as string)?.trim() || "";

    // Validation
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide." },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    if (fullName.length > 100 || email.length > 255) {
      return NextResponse.json(
        { error: "Données invalides." },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur (non vérifié)
    const user = await createUser(email, passwordHash, fullName, country);

    // Générer et envoyer le code de vérification
    const verificationCode = generateVerificationCode();
    await setVerificationCode(email, verificationCode);
    
    const emailSent = await sendVerificationEmail(email, verificationCode, fullName);
    
    if (!emailSent) {
      console.error("Échec de l'envoi de l'email de vérification");
      // On continue quand même, le code est sauvegardé et peut être réenvoyé
    }

    return NextResponse.json(
      {
        success: true,
        message: "Compte créé. Veuillez vérifier votre email pour activer votre compte.",
        requiresVerification: true,
        user: {
          email: user.email,
          fullName: user.fullName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la création du compte:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte." },
      { status: 500 }
    );
  }
}
