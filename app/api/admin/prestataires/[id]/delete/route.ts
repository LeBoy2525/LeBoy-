// app/api/admin/prestataires/[id]/delete/route.ts
// API pour supprimer un prestataire rejeté

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";
import {
  getPrestataireById,
  softDeletePrestataire,
} from "@/lib/dataAccess";
import { validateUUID } from "@/lib/uuidValidation";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const prestataireUuid = resolvedParams.id;
    
    const uuidValidation = validateUUID(prestataireUuid, "Prestataire ID");
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { error: uuidValidation.error },
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

    // Vérifier que le prestataire est rejeté
    if (prestataire.statut !== "rejete") {
      return NextResponse.json(
        { error: "Seuls les prestataires rejetés peuvent être supprimés." },
        { status: 400 }
      );
    }

    // Vérifier qu'il n'est pas déjà supprimé
    if (prestataire.deletedAt) {
      return NextResponse.json(
        { error: "Ce prestataire est déjà supprimé." },
        { status: 400 }
      );
    }

    const deleted = await softDeletePrestataire(prestataireUuid, userEmail);
    if (!deleted) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        prestataire: deleted,
        message: "Prestataire supprimé avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/prestataires/[id]/delete:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

