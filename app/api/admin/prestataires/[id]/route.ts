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
  console.log(`========================================`);
  console.log(`[API PATCH] /api/admin/prestataires/[id] DÉBUT`);
  console.log(`[API PATCH] Timestamp: ${new Date().toISOString()}`);
  console.log(`========================================`);
  
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
    console.log(`[API PATCH] ========================================`);
    console.log(`[API PATCH] Recherche du prestataire avec ID: ${id}`);
    console.log(`[API PATCH] Type ID: ${typeof id}, Valeur: ${id}`);
    console.log(`[API PATCH] ========================================`);
    
    // Lister tous les prestataires disponibles pour diagnostic
    const { getAllPrestataires } = await import("@/lib/dataAccess");
    const allPrestataires = await getAllPrestataires();
    console.log(`[API PATCH] 📊 Total prestataires dans la DB: ${allPrestataires.length}`);
    console.log(`[API PATCH] 📋 IDs disponibles (premiers 5):`, allPrestataires.slice(0, 5).map(p => ({
      id: p.id,
      email: p.email,
      ref: p.ref,
      statut: p.statut
    })));
    
    const existingPrestataire = await getPrestataireById(id);
    if (!existingPrestataire) {
      console.error(`[API PATCH] ❌❌❌ PRESTATAIRE NON TROUVÉ ❌❌❌`);
      console.error(`[API PATCH] ID recherché: ${id}`);
      console.error(`[API PATCH] IDs disponibles:`, allPrestataires.map(p => p.id).join(", "));
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
    let tempPassword: string | null = null; // Stocker le mot de passe temporaire pour l'email
    
    if (action === "valider") {
      // Vérifier si le prestataire a un passwordHash
      const hasPassword = !!existingPrestataire.passwordHash;
      console.log(`[API PATCH] Prestataire a passwordHash: ${hasPassword}`);
      
      statutUpdate = {
        statut: "actif" as const,
        dateValidation: new Date().toISOString(),
        documentsVerifies: true,
      };
      
      // Si le prestataire n'a pas de passwordHash, générer un mot de passe temporaire
      // Le prestataire devra le changer lors de la première connexion
      if (!hasPassword) {
        console.log(`[API PATCH] ⚠️ Prestataire sans passwordHash, génération mot de passe temporaire...`);
        const bcrypt = await import("bcryptjs");
        // Générer un mot de passe temporaire basé sur l'email et la date
        tempPassword = `Temp${existingPrestataire.email.split("@")[0]}${new Date().getFullYear()}`;
        const tempPasswordHash = await bcrypt.hash(tempPassword, 10);
        statutUpdate.passwordHash = tempPasswordHash;
        console.log(`[API PATCH] ✅ Mot de passe temporaire généré pour ${existingPrestataire.email}`);
        console.log(`[API PATCH] 📧 Le prestataire recevra ce mot de passe temporaire dans l'email de validation`);
      }
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
      // Réactiver un prestataire suspendu
      // Note: disponibilite n'existe pas dans Prisma, seul le statut compte
      statutUpdate = {
        statut: "actif" as const,
        // Réinitialiser suspenduAt si nécessaire
        suspenduAt: null,
      };
      console.log(`[API PATCH] Réactivation du prestataire ${existingPrestataire.email}`);
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
      try {
        const { sendNotificationEmail } = await import("@/lib/emailService");
        const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
        const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
        // S'assurer que loginUrl pointe bien vers la page de connexion prestataire
        const loginUrl = platformUrl.endsWith("/") 
          ? `${platformUrl}prestataires/connexion`
          : `${platformUrl}/prestataires/connexion`;
        
        console.log(`[API PATCH] 📧 Envoi email de validation à ${updated.email}...`);
        console.log(`[API PATCH] 🔗 Lien de connexion: ${loginUrl}`);
        
        // Préparer les données pour l'email
        const emailData: any = {
          providerRef: updated.ref,
          providerName: updated.nomEntreprise || updated.nomContact,
          platformUrl,
          loginUrl, // Utiliser loginUrl en priorité pour le lien
        };
        
        // Si un mot de passe temporaire a été généré, l'inclure dans l'email
        if (tempPassword) {
          emailData.tempPassword = tempPassword;
          emailData.hasTempPassword = true;
          console.log(`[API PATCH] 📧 Mot de passe temporaire inclus dans l'email: ${tempPassword}`);
        }
        
        const emailSent = await sendNotificationEmail(
          "provider-validated",
          { 
            email: updated.email, 
            name: updated.nomEntreprise || updated.nomContact 
          },
          emailData,
          "fr"
        );
        
        if (emailSent) {
          console.log(`[API PATCH] ✅ Email de validation envoyé avec succès à ${updated.email}`);
        } else {
          console.error(`[API PATCH] ⚠️ Échec de l'envoi de l'email de validation à ${updated.email}`);
        }
      } catch (error) {
        console.error(`[API PATCH] ❌ Erreur lors de l'envoi de l'email de validation:`, error);
        // Ne pas bloquer la validation si l'email échoue
      }
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
