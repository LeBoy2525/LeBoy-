// Route API pour vérifier la configuration email (admin uniquement)
import { NextResponse } from "next/server";
import { checkEmailConfig } from "@/lib/emailService";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    // Vérifier que l'utilisateur est admin
    const session = await getSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const config = checkEmailConfig();

    return NextResponse.json({
      ...config,
      fromEmail: process.env.RESEND_FROM_EMAIL || "noreply@leboy.com",
      emailMode: process.env.EMAIL_MODE || "normal",
      emailRedirectTo: process.env.EMAIL_REDIRECT_TO || null,
      hasResendKey: !!process.env.RESEND_API_KEY,
    });
  } catch (error: any) {
    console.error("Erreur lors de la vérification de la config email:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}

