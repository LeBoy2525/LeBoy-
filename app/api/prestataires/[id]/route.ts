import { NextResponse } from "next/server";
import { getPrestataireById } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const prestataireUuid = resolvedParams.id;

    // Validation UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!prestataireUuid || typeof prestataireUuid !== "string" || !UUID_REGEX.test(prestataireUuid)) {
      return NextResponse.json(
        { error: "UUID invalide." },
        { status: 400 }
      );
    }

    const prestataire = await getPrestataireById(prestataireUuid);
    
    if (!prestataire) {
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        prestataire,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

