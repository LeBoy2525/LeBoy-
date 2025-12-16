// app/api/admin/prestataires/[id]/countries/route.ts
// API route pour gérer les pays d'un prestataire

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";
import { updatePrestataire, getPrestataireById } from "@/lib/dataAccess";
import { getActiveCountries } from "@/lib/countriesStore";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  req: Request,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const prestataireId = parseInt(resolvedParams.id);
    
    // Vérifier l'authentification admin
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { countries } = body;

    // Valider que countries est un tableau de codes valides
    if (!Array.isArray(countries)) {
      return NextResponse.json(
        { error: "countries doit être un tableau" },
        { status: 400 }
      );
    }

    // Vérifier que tous les codes pays sont valides
    const activeCountries = getActiveCountries();
    const validCodes = activeCountries.map((c) => c.code);
    const invalidCodes = countries.filter((code: string) => !validCodes.includes(code));
    
    if (invalidCodes.length > 0) {
      return NextResponse.json(
        { error: `Codes pays invalides: ${invalidCodes.join(", ")}` },
        { status: 400 }
      );
    }

    // Trouver le prestataire
    const prestataire = await getPrestataireById(prestataireId);

    if (!prestataire) {
      return NextResponse.json(
        { error: "Prestataire non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour les pays
    const updated = await updatePrestataire(prestataireId, { countries });

    return NextResponse.json({
      ok: true,
      prestataire: updated,
    });
  } catch (error) {
    console.error("Erreur mise à jour pays prestataire:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

