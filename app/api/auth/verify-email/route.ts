// app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server";
import { getUserByEmail, setVerificationCode, verifyEmail } from "@/lib/dataAccess";
import { generateVerificationCode, sendVerificationEmail } from "@/lib/emailService";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const email = (data.email as string)?.trim()?.toLowerCase() || "";
    const code = (data.code as string)?.trim() || "";

    console.log("=".repeat(80));
    console.log("🔍 VÉRIFICATION EMAIL - DEBUG");
    console.log("=".repeat(80));
    console.log(`📧 Email reçu: "${email}"`);
    console.log(`🔐 Code reçu: "${code}"`);
    console.log(`📏 Longueur email: ${email.length}`);

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email et code requis." },
        { status: 400 }
      );
    }

    console.log(`🔍 Recherche de l'utilisateur avec email: "${email}"`);
    console.log(`   USE_DB: ${process.env.USE_DB}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? "définie" : "non définie"}`);
    console.log(`   PRISMA_DATABASE_URL: ${process.env.PRISMA_DATABASE_URL ? "définie" : "non définie"}`);
    
    // Vérifier si Prisma est disponible
    try {
      const { prisma } = await import("@/lib/db");
      console.log(`   Prisma disponible: ${prisma ? "OUI" : "NON"}`);
      if (prisma) {
        // Essayer de lister les utilisateurs pour debug
        try {
          const allUsers = await (prisma as any).user.findMany({
            select: { email: true, id: true },
            take: 5,
          });
          console.log(`   Utilisateurs dans DB (max 5): ${allUsers.map((u: any) => u.email).join(", ") || "aucun"}`);
        } catch (listError: any) {
          console.error(`   Erreur lors de la liste des utilisateurs: ${listError?.message || listError}`);
        }
      }
    } catch (prismaError: any) {
      console.error(`   Erreur import Prisma: ${prismaError?.message || prismaError}`);
    }
    
    const user = await getUserByEmail(email);
    
    if (!user) {
      console.error("❌ Utilisateur non trouvé");
      console.error(`   Email recherché: "${email}"`);
      console.error(`   Type: ${typeof email}`);
      
      // Essayer de chercher avec différentes variantes pour debug
      if (email.includes("@")) {
        const [localPart, domain] = email.split("@");
        console.error(`   Tentative alternative 1: ${localPart.toLowerCase()}@${domain.toLowerCase()}`);
        console.error(`   Tentative alternative 2: ${email.replace(/\s/g, "")}`);
      }
      
      console.log("=".repeat(80));
      return NextResponse.json(
        { error: "Utilisateur non trouvé. Vérifiez que vous avez bien créé votre compte." },
        { status: 404 }
      );
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email vérifié: ${user.emailVerified}`);
    console.log(`   Code de vérification: ${user.verificationCode || "non défini"}`);
    console.log("=".repeat(80));

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Cet email est déjà vérifié." },
        { status: 400 }
      );
    }

    // Vérifier le code
    const isValid = await verifyEmail(email, code);

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

    const user = await getUserByEmail(email);
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
    await setVerificationCode(email, verificationCode);
    
    const emailResult = await sendVerificationEmail(email, verificationCode, user.fullName);
    
    if (!emailResult.success) {
      console.error("Échec renvoi code de vérification:", emailResult.error);
      return NextResponse.json(
        { 
          error: "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard.",
          errorCode: emailResult.errorCode,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Un nouveau code de vérification a été envoyé à votre adresse email.",
        emailSent: true,
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

