import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrestataireByEmail, convertPrismaMissionToJSON } from "@/lib/dataAccess";
import { getMissionById } from "@/repositories/missionsRepo";
import { prisma } from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const missionUuid = resolvedParams.id; // UUID string (pas de parseInt)

    // Valider que c'est un UUID (format basique)
    if (!missionUuid || typeof missionUuid !== "string" || missionUuid.length < 30) {
      return NextResponse.json(
        { error: "UUID invalide." },
        { status: 400 }
      );
    }

    console.log("🔍 Recherche mission UUID:", missionUuid);

    // Utiliser Prisma directement avec l'UUID (pas de conversion hash)
    if (!prisma) {
      return NextResponse.json(
        { error: "Base de données non disponible." },
        { status: 500 }
      );
    }

    const missionPrisma = await getMissionById(missionUuid);
    if (!missionPrisma) {
      console.log("❌ Mission non trouvée pour UUID:", missionUuid);
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    console.log("✅ Mission trouvée:", missionPrisma.ref, "prestataireId:", missionPrisma.prestataireId);

    // Vérifier que le prestataire a accès à cette mission
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire) {
      console.log("❌ Prestataire non trouvé pour email:", userEmail);
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    console.log("✅ Prestataire trouvé:", prestataire.ref, "ID:", prestataire.id);

    // Convertir la mission Prisma en Mission JSON
    const mission = convertPrismaMissionToJSON(missionPrisma);

    // Vérifier l'accès avec l'ID numérique converti (pour compatibilité)
    if (mission.prestataireId !== prestataire.id) {
      console.log("❌ Accès refusé - mission.prestataireId:", mission.prestataireId, "prestataire.id:", prestataire.id);
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 403 }
      );
    }

    console.log("✅ Accès autorisé, retour de la mission");
    return NextResponse.json(
      { mission },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
