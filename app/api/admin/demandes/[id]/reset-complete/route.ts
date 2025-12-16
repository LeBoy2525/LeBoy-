import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";
import { getDemandeById, softDeleteDemande } from "@/lib/dataAccess";
import { getMissionsByDemandeId, saveMissions } from "@/lib/dataAccess";
import { getPropositionsByDemandeId, updatePropositionStatut } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
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

    // 1. Supprimer toutes les missions associées à cette demande
    const missionsToDelete = await getMissionsByDemandeId(demandeId);
    
    for (const mission of missionsToDelete) {
      mission.deleted = true;
      mission.deletedAt = new Date().toISOString();
      mission.deletedBy = "admin"; // L'admin supprime la mission
    }

    // 2. Marquer toutes les propositions comme refusées (soft delete via statut)
    const propositions = await getPropositionsByDemandeId(demandeId);
    
    for (const prop of propositions) {
      if (prop.statut !== "refusee") {
        await updatePropositionStatut(prop.id, "refusee", userEmail, undefined, "Demande supprimée");
      }
    }

    // 3. Supprimer la demande elle-même (soft delete)
    await softDeleteDemande(demandeId, userEmail);

    // 4. Sauvegarder toutes les modifications
    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        message: `Tout a été supprimé avec succès : ${missionsToDelete.length} mission(s) et ${propositions.length} proposition(s).`,
        missionsDeleted: missionsToDelete.length,
        propositionsDeleted: propositions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/demandes/[id]/reset-complete:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

