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
    const email = (data.get("email") as string)?.trim()?.toLowerCase() || "";
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

    console.log("=".repeat(80));
    console.log("📝 CRÉATION UTILISATEUR - DEBUG");
    console.log("=".repeat(80));
    console.log(`📧 Email normalisé: "${email}"`);
    console.log(`👤 Nom: "${fullName}"`);
    console.log(`🌍 Pays: "${country}"`);
    console.log(`💾 USE_DB: ${process.env.USE_DB}`);
    console.log(`💾 DATABASE_URL: ${process.env.DATABASE_URL ? "définie" : "non définie"}`);

    // Créer l'utilisateur (non vérifié)
    const user = await createUser(email, passwordHash, fullName, country);
    
    console.log(`✅ Utilisateur créé avec succès`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email vérifié: ${user.emailVerified}`);

    // Générer et envoyer le code de vérification
    const verificationCode = generateVerificationCode();
    console.log(`🔐 Code généré: ${verificationCode}`);
    
    await setVerificationCode(email, verificationCode);
    
    // Vérifier que l'utilisateur peut être retrouvé
    const verifyUser = await getUserByEmail(email);
    if (verifyUser) {
      console.log(`✅ Vérification: Utilisateur retrouvable après création`);
      console.log(`   Code sauvegardé: ${verifyUser.verificationCode || "NON"}`);
    } else {
      console.error(`❌ ERREUR: Utilisateur non retrouvable après création!`);
      console.error(`   Email recherché: "${email}"`);
    }
    console.log("=".repeat(80));
    
    const emailResult = await sendVerificationEmail(email, verificationCode, fullName);
    
    // Si l'email n'a pas pu être envoyé, informer l'utilisateur mais continuer
    if (!emailResult.success) {
      console.error("=".repeat(80));
      console.error("⚠️ ÉCHEC ENVOI EMAIL DE VÉRIFICATION");
      console.error("=".repeat(80));
      console.error(`Email: ${email}`);
      console.error(`Code: ${verificationCode}`);
      console.error(`Erreur: ${emailResult.error}`);
      console.error(`Code erreur: ${emailResult.errorCode}`);
      console.error("=".repeat(80));
      console.error("💡 Le code est sauvegardé et peut être réenvoyé via la page de vérification");
      console.error("=".repeat(80));
    }

    // Construire le message de réponse
    let message = "Compte créé. Veuillez vérifier votre email pour activer votre compte.";
    if (!emailResult.success) {
      // En cas d'échec, informer l'utilisateur mais ne pas bloquer
      message += " Si vous ne recevez pas l'email, vous pouvez demander un nouveau code sur la page de vérification.";
    }

    return NextResponse.json(
      {
        success: true,
        message,
        requiresVerification: true,
        emailSent: emailResult.success,
        emailError: emailResult.success ? undefined : emailResult.errorCode,
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
