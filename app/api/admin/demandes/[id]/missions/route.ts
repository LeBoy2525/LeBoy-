import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDemandeById } from "@/lib/dataAccess";
import { getMissionsByClient } from "@/lib/dataAccess";
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
    const demandeId = parseInt(resolvedParams.id);

    if (isNaN(demandeId)) {
      return NextResponse.json(
        { error: "ID de demande invalide." },
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

    // Récupérer toutes les missions pour ce client
    const missions = await getMissionsByClient(demande.email);

    // Filtrer pour ne garder que celles liées à cette demande et non archivées/supprimées
    const missionsLinked = missions.filter(
      (m) => m.demandeId === demandeId && !m.deleted && !m.archived
    );

    return NextResponse.json({ missions: missionsLinked }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/admin/demandes/[id]/missions:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

