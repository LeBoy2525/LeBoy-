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
  console.log(`[API PATCH] /api/admin/prestataires/[id] appelé`);
  
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;
    
    console.log(`[API PATCH] Email utilisateur: ${userEmail || "non défini"}`);

    if (!userEmail) {
      console.error(`[API PATCH] ❌ Non authentifié`);
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }
    
    const userRole = await getUserRoleAsync(userEmail);
    console.log(`[API PATCH] Rôle utilisateur: ${userRole}`);
    
    if (userRole !== "admin") {
      console.error(`[API PATCH] ❌ Non autorisé (rôle: ${userRole})`);
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const idParam = resolvedParams.id;
    
    console.log(`[API PATCH] ID reçu (param): "${idParam}"`);
    
    // L'ID peut être un nombre (JSON) ou un UUID (Prisma)
    // Essayer de parser comme nombre d'abord
    let id: number;
    if (idParam.includes("-")) {
      // C'est probablement un UUID, on doit le convertir en ID numérique
      // Pour l'instant, on essaie de trouver le prestataire par email ou autre identifiant
      // Mais normalement le frontend devrait envoyer l'ID numérique
      console.error(`[API PATCH] ❌ Format UUID détecté: "${idParam}"`);
      return NextResponse.json(
        { error: "Format d'ID invalide. Attendu: ID numérique." },
        { status: 400 }
      );
    }
    
    id = parseInt(idParam);
    
    if (isNaN(id)) {
      console.error(`[API PATCH] ❌ ID invalide reçu: "${idParam}" (parseInt = NaN)`);
      return NextResponse.json(
        { error: "ID invalide." },
        { status: 400 }
      );
    }
    
    console.log(`[API PATCH] ✅ ID numérique parsé: ${id}`);

    const body = await req.json();
    const { action } = body;
    
    console.log(`[API PATCH] Action demandée: "${action}"`);
    
    // Vérifier que le prestataire existe avant de le mettre à jour
    console.log(`[API PATCH] Recherche du prestataire avec ID: ${id}`);
    const existingPrestataire = await getPrestataireById(id);
    if (!existingPrestataire) {
      console.error(`[API PATCH] ❌ Prestataire non trouvé avec ID: ${id}`);
      return NextResponse.json(
        { error: `Prestataire non trouvé avec l'ID ${id}.` },
        { status: 404 }
      );
    }
    
    console.log(`[API PATCH] ✅ Prestataire trouvé: ${existingPrestataire.email} (statut actuel: ${existingPrestataire.statut})`);

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

    console.log(`[API PATCH] Mise à jour du prestataire avec:`, statutUpdate);
    const updated = await updatePrestataire(id, statutUpdate);

    if (!updated) {
      console.error(`[API PATCH] ❌ updatePrestataire a retourné null pour ID: ${id}`);
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour du prestataire (ID: ${id}).` },
        { status: 404 }
      );
    }
    
    console.log(`[API PATCH] ✅ Prestataire mis à jour avec succès: ${updated.email} (nouveau statut: ${updated.statut})`);

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
  } catch (error: any) {
    console.error("❌ Erreur /api/admin/prestataires/[id] PATCH:", error);
    console.error("   Message:", error?.message);
    console.error("   Stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Erreur serveur.",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: Request,
  { params }: RouteParams
) {
  console.log(`[API GET] /api/admin/prestataires/[id] appelé`);
  
  try {
    const resolvedParams = await params;
    const idParam = resolvedParams.id;
    console.log(`[API GET] ID reçu: "${idParam}"`);
    
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      console.error(`[API GET] ❌ ID invalide: "${idParam}"`);
      return NextResponse.json(
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    console.log(`[API GET] Recherche prestataire avec ID: ${id}`);
    const prestataire = await getPrestataireById(id);
    if (!prestataire) {
      console.error(`[API GET] ❌ Prestataire non trouvé avec ID: ${id}`);
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    console.log(`[API GET] ✅ Prestataire trouvé: ${prestataire.email}`);
    return NextResponse.json({ prestataire }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Erreur /api/admin/prestataires/[id] GET:", error);
    console.error("   Message:", error?.message);
    console.error("   Stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Erreur serveur.",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
