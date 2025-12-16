import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const STAGING_ACCESS_CODE = process.env.STAGING_ACCESS_CODE;
const APP_ENV = process.env.APP_ENV || "local";

export async function POST(req: Request) {
  // Vérifier que nous sommes bien en staging
  if (APP_ENV !== "staging") {
    return NextResponse.json(
      { error: "Cette route n'est disponible qu'en staging." },
      { status: 403 }
    );
  }

  // Vérifier que le code d'accès est configuré
  if (!STAGING_ACCESS_CODE) {
    console.error("[STAGING ACCESS] STAGING_ACCESS_CODE non configuré");
    return NextResponse.json(
      { error: "Configuration manquante." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Code requis." },
        { status: 400 }
      );
    }

    // Vérifier le code
    if (code === STAGING_ACCESS_CODE) {
      // Définir le cookie d'accès (httpOnly, secure en production, maxAge 7 jours)
      const cookieStore = await cookies();
      cookieStore.set("staging_ok", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 jours
        path: "/",
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Code incorrect." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("[STAGING ACCESS] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

