import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrestataireByEmail } from "@/lib/dataAccess";
import { getMissionById } from "@/repositories/missionsRepo";
import { convertPrismaMissionToJSON } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const resolvedParams = await params;
    const missionUuid = resolvedParams.id;

    console.log(`[GET /api/prestataires/espace/missions/[id]] Mission UUID reçu: ${missionUuid} (type: ${typeof missionUuid})`);
    
    if (!missionUuid || typeof missionUuid !== "string") {
      console.error(`[GET /api/prestataires/espace/missions/[id]] ❌ UUID manquant ou type invalide: ${missionUuid}`);
      return NextResponse.json({ error: "UUID invalide." }, { status: 400 });
    }
    
    if (!UUID_REGEX.test(missionUuid)) {
      console.error(`[GET /api/prestataires/espace/missions/[id]] ❌ UUID ne correspond pas au format attendu: ${missionUuid}`);
      return NextResponse.json({ error: "UUID invalide." }, { status: 400 });
    }
    
    console.log(`[GET /api/prestataires/espace/missions/[id]] ✅ UUID valide: ${missionUuid}`);

    // 1) Mission UUID direct
    const missionPrisma = await getMissionById(missionUuid);
    if (!missionPrisma) {
      return NextResponse.json({ error: "Mission non trouvée." }, { status: 404 });
    }

    // 2) Prestataire connecté
    const prestataire = await getPrestataireByEmail(userEmail);
    if (!prestataire) {
      return NextResponse.json({ error: "Prestataire non trouvé." }, { status: 404 });
    }

    // 3) Contrôle d'accès: comparer les UUID (pas les IDs numériques)
    if (!missionPrisma.prestataireId || missionPrisma.prestataireId !== prestataire.id) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    // 4) Réponse
    const mission = convertPrismaMissionToJSON(missionPrisma);

    return NextResponse.json(
      { mission },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/missions/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
