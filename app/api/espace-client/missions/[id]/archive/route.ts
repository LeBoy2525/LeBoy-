import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { getDemandeById } from "@/lib/dataAccess";
import { validateUUID } from "@/lib/uuidValidation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "client") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const missionUuid = resolvedParams.id;
    
    const uuidValidation = validateUUID(missionUuid, "Mission ID");
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { error: uuidValidation.error },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionUuid);
    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier que c'est bien le client de la mission
    if (mission.clientEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 403 }
      );
    }

    // Vérifier si la mission est déjà archivée
    if (mission.archived && mission.archivedBy === "client") {
      return NextResponse.json(
        { error: "Cette mission est déjà archivée." },
        { status: 400 }
      );
    }

    // Archiver la mission (même si déjà archivée automatiquement, on met à jour la date)
    mission.archived = true;
    mission.archivedAt = new Date().toISOString();
    mission.archivedBy = "client";

    await saveMissions();

    // Créer une notification pour l'admin
    try {
      const { addAdminNotification } = await import("@/lib/adminNotificationsStore");
      const demande = await getDemandeById(mission.demandeId);
      
      addAdminNotification({
        type: "mission_archived",
        title: "Mission archivée par le client",
        message: `Le client ${demande?.fullName || mission.clientEmail} a archivé la mission ${mission.ref}.`,
        missionId: mission.id,
        missionRef: mission.ref,
        demandeId: mission.demandeId,
        clientEmail: mission.clientEmail,
      });
    } catch (error) {
      console.error("Erreur création notification admin:", error);
      // Ne pas bloquer l'archivage si la notification échoue
    }

    return NextResponse.json(
      {
        success: true,
        message: "Mission archivée avec succès.",
        mission,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/espace-client/missions/[id]/archive:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "client") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const missionUuid = resolvedParams.id;
    
    const uuidValidation = validateUUID(missionUuid, "Mission ID");
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { error: uuidValidation.error },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionUuid);
    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier que c'est bien le client de la mission
    if (mission.clientEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 403 }
      );
    }

    // Vérifier si la mission est déjà supprimée
    if (mission.deleted) {
      return NextResponse.json(
        { error: "Cette mission est déjà supprimée." },
        { status: 400 }
      );
    }

    // Permettre la suppression des missions terminées (COMPLETED) ou validées (ADMIN_CONFIRMED)
    // Les missions en cours ne peuvent pas être supprimées, seulement archivées
    const canDelete = mission.internalState === "COMPLETED" || 
                      mission.internalState === "ADMIN_CONFIRMED" ||
                      mission.status === "termine_icd_canada" ||
                      mission.status === "cloture";

    if (!canDelete) {
      return NextResponse.json(
        { error: "Vous ne pouvez supprimer que les missions terminées. Utilisez 'Archiver' pour les missions en cours." },
        { status: 400 }
      );
    }

    // Soft delete de la mission (mettre dans la corbeille)
    mission.deleted = true;
    mission.deletedAt = new Date().toISOString();
    mission.deletedBy = "client";
    
    // S'assurer que la mission est aussi archivée
    if (!mission.archived) {
      mission.archived = true;
      mission.archivedAt = new Date().toISOString();
      mission.archivedBy = "client";
    }

    await saveMissions();

    // Créer une notification pour l'admin
    try {
      const { addAdminNotification } = await import("@/lib/adminNotificationsStore");
      const demande = await getDemandeById(mission.demandeId);
      
      addAdminNotification({
        type: "mission_deleted",
        title: "Mission supprimée par le client",
        message: `Le client ${demande?.fullName || mission.clientEmail} a supprimé la mission ${mission.ref}.`,
        missionId: mission.id,
        missionRef: mission.ref,
        demandeId: mission.demandeId,
        clientEmail: mission.clientEmail,
      });
    } catch (error) {
      console.error("Erreur création notification admin:", error);
      // Ne pas bloquer la suppression si la notification échoue
    }

    return NextResponse.json(
      {
        success: true,
        message: "Mission supprimée avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/espace-client/missions/[id]/archive DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

