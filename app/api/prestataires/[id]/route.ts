import { NextResponse } from "next/server";
import { getPrestataireById } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const prestataireUuid = resolvedParams.id;

    console.log(`[API GET /prestataires/[id]] UUID reçu: ${prestataireUuid}`);

    // Validation UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!prestataireUuid || typeof prestataireUuid !== "string" || !UUID_REGEX.test(prestataireUuid)) {
      console.error(`[API GET /prestataires/[id]] ❌ UUID invalide: ${prestataireUuid}`);
      return NextResponse.json(
        { error: "UUID invalide." },
        { status: 400 }
      );
    }

    console.log(`[API GET /prestataires/[id]] ✅ UUID valide, recherche prestataire...`);
    const prestataire = await getPrestataireById(prestataireUuid);
    
    if (!prestataire) {
      console.error(`[API GET /prestataires/[id]] ❌ Prestataire non trouvé pour UUID: ${prestataireUuid}`);
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    console.log(`[API GET /prestataires/[id]] ✅ Prestataire trouvé: ${prestataire.email} (ID: ${prestataire.id})`);
    return NextResponse.json(
      {
        prestataire,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API GET /prestataires/[id]] ❌ Erreur:", error);
    console.error("[API GET /prestataires/[id]] Code erreur:", error?.code);
    console.error("[API GET /prestataires/[id]] Message:", error?.message);
    
    // Si erreur Prisma (migration manquante), retourner une réponse d'erreur explicite
    if (error?.code === "P2022" || error?.code === "P2021") {
      return NextResponse.json(
        {
          error: "Erreur de base de données",
          message: "Les migrations Prisma n'ont pas été appliquées. Veuillez exécuter 'prisma migrate deploy' en production.",
          code: error.code,
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Erreur serveur.", message: error?.message },
      { status: 500 }
    );
  }
}

