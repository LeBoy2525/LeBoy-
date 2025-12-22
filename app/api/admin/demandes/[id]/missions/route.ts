import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDemandeById, getMissionsByDemandeId } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const demandeId = resolvedParams.id; // UUID string (pas de parseInt)
    
    // Valider que c'est un UUID (format basique)
    if (!demandeId || typeof demandeId !== "string" || demandeId.length < 30) {
      return NextResponse.json(
        { error: "UUID de demande invalide." },
        { status: 400 }
      );
    }

    const demande = await getDemandeById(demandeId);
    if (!demande) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // CORRECTION: Utiliser getMissionsByDemandeId directement au lieu de getMissionsByClient
    // Cela garantit que nous récupérons uniquement les missions pour cette demande spécifique
    const missions = await getMissionsByDemandeId(demandeId);

    // Filtrer pour ne garder que celles non archivées/supprimées
    const missionsLinked = missions.filter(
      (m) => !m.deleted && !m.archived
    );

    console.log(`[API MISSIONS] Missions récupérées pour demande ${demandeId}: ${missionsLinked.length} missions`);
    if (missionsLinked.length > 0) {
      console.log(`[API MISSIONS] Prestataires: ${missionsLinked.map(m => m.prestataireId).join(", ")}`);
    }

    return NextResponse.json(
      { missions: missionsLinked }, 
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
    console.error("Erreur /api/admin/demandes/[id]/missions:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

