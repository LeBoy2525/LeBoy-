// app/api/espace-client/dossier/[ref]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDemandeByRef } from "@/lib/dataAccess";
import { getMissionsByDemandeId } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ ref: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("icd_auth")?.value;
    const userEmail = cookieStore.get("icd_user_email")?.value;
    
    // Vérifier l'authentification
    if (!authCookie || authCookie !== "1" || !userEmail) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const raw = resolvedParams.ref ?? "";
    
    // Validation de la référence
    if (!raw || raw.length > 50) {
      return NextResponse.json(
        { error: "Référence invalide." },
        { status: 400 }
      );
    }

    const refFromUrl = decodeURIComponent(raw).toLowerCase();

    const dossier = await getDemandeByRef(refFromUrl);

    if (!dossier || dossier.deletedAt) {
      return NextResponse.json({ dossier: null }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à ce dossier
    const email = userEmail.toLowerCase();
    if (dossier.email.toLowerCase() !== email) {
      return NextResponse.json(
        { error: "Accès non autorisé à ce dossier." },
        { status: 403 }
      );
    }

    // Récupérer les missions associées à cette demande
    const missions = (await getMissionsByDemandeId(dossier.id)).filter(
      (m) => !m.deleted && !m.archived
    );

    return NextResponse.json({ 
      dossier,
      missions 
    }, { status: 200 });
  } catch (error) {
    console.error("ERREUR /api/espace-client/dossier/[ref] :", error);
    return NextResponse.json(
      { dossier: null, error: "Erreur serveur lors du chargement du dossier." },
      { status: 500 }
    );
  }
}
