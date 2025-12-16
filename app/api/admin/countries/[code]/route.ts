// app/api/admin/countries/[code]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { toggleCountry } from "@/lib/countriesStore";
import { getUserRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || getUserRole(userEmail) !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const resolvedParams = await params;

    const code = resolvedParams.code;
    if (!code) {
      return NextResponse.json({ error: "Code pays manquant." }, { status: 400 });
    }

    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Paramètre enabled invalide." }, { status: 400 });
    }

    const updated = toggleCountry(code, enabled);
    if (!updated) {
      return NextResponse.json({ error: "Pays non trouvé." }, { status: 404 });
    }

    return NextResponse.json({ country: updated }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du pays:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
