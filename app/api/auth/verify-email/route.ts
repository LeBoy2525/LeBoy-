// app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server";
import { verifyEmail, getUserByEmail, setVerificationCode } from "@/lib/usersStore";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/emailService";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const email = (data.email as string)?.trim()?.toLowerCase() || "";
    const code = (data.code as string)?.trim() || "";

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email et code requis." },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Cet email est déjà vérifié." },
        { status: 400 }
      );
    }

    // Vérifier le code
    const isValid = verifyEmail(email, code);

    if (!isValid) {
      return NextResponse.json(
        { error: "Code de vérification invalide ou expiré." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email vérifié avec succès. Vous pouvez maintenant vous connecter.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la vérification de l'email:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification de l'email." },
      { status: 500 }
    );
  }
}

// Route pour renvoyer le code de vérification
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const email = (data.email as string)?.trim()?.toLowerCase() || "";

    if (!email) {
      return NextResponse.json(
        { error: "Email requis." },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Cet email est déjà vérifié." },
        { status: 400 }
      );
    }

    // Générer un nouveau code
    const verificationCode = generateVerificationCode();
    setVerificationCode(email, verificationCode);
    
    const emailSent = await sendVerificationEmail(email, verificationCode, user.fullName);
    
    if (!emailSent) {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Un nouveau code de vérification a été envoyé à votre adresse email.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors du renvoi du code:", error);
    return NextResponse.json(
      { error: "Erreur lors du renvoi du code." },
      { status: 500 }
    );
  }
}

