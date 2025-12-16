// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true }, { status: 200 });

    // On supprime le cookie avec les mêmes options que lors de la création
    const isProduction = process.env.NODE_ENV === "production";
    res.cookies.set("icd_auth", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("Erreur lors de la déconnexion:", err);
    return NextResponse.json(
      { error: "Erreur lors de la déconnexion." },
      { status: 500 }
    );
  }
}
