import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updatePrestataire, getPrestataireById } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  req: Request,
  { params }: RouteParams
) {
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

    const body = await req.json();
    const { action } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "Action requise." },
        { status: 400 }
      );
    }

    // Actions possibles : "valider", "rejeter", "suspendre", "reactiver"
    let statutUpdate: any = {};
    
    if (action === "valider") {
      statutUpdate = {
        statut: "actif" as const,
        dateValidation: new Date().toISOString(),
        documentsVerifies: true,
      };
    } else if (action === "rejeter") {
      statutUpdate = {
        statut: "rejete" as const,
      };
    } else if (action === "suspendre") {
      statutUpdate = {
        statut: "suspendu" as const,
        disponibilite: "indisponible" as const,
      };
    } else if (action === "reactiver") {
      statutUpdate = {
        statut: "actif" as const,
        disponibilite: "disponible" as const,
      };
    } else {
      return NextResponse.json(
        { error: "Action invalide." },
        { status: 400 }
      );
    }

    const updated = await updatePrestataire(id, statutUpdate);

    if (!updated) {
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    // Si validation, envoyer email de confirmation
    if (action === "valider") {
      console.log(`📧 Email à envoyer à ${updated.email}: Félicitations, votre compte est activé !`);
      console.log(`📧 Contenu: Votre compte prestataire LeBoy (${updated.ref}) a été validé avec succès. Vous pouvez maintenant vous connecter à votre espace : https://votre-domaine.com/prestataires/connexion`);
      console.log(`📧 Lien de connexion: /prestataires/connexion`);
    }

    return NextResponse.json(
      {
        success: true,
        prestataire: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/prestataires/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: Request,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    const prestataire = await getPrestataireById(id);
    if (!prestataire) {
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    return NextResponse.json({ prestataire }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/admin/prestataires/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
