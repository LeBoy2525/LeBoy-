import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDemandeById } from "@/lib/dataAccess";
import { getFileById, filesStore } from "@/lib/filesStore";
import { getUserRoleAsync } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    const demande = await getDemandeById(id);
    
    if (!demande) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // Récupérer les fichiers de la demande
    const files = demande.fileIds
      ? demande.fileIds
          .map((fileId) => {
            const file = getFileById(fileId);
            if (!file) return null;
            return {
              id: file.id,
              name: file.originalName,
              type: file.mimeType,
              size: file.size,
              uploadedAt: file.uploadedAt,
              url: file.storageUrl || `/api/files/${file.id}`, // URL publique Blob ou fallback API
            };
          })
          .filter(Boolean)
      : [];

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/admin/demandes/[id]/files:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

