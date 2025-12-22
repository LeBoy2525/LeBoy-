import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  softDeleteDemande,
  restoreDemande,
  getDemandeById,
  rejectDemande,
} from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { getMissionsByDemandeId } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// DELETE : Supprimer une demande (soft delete)
export async function DELETE(_req: Request, { params }: RouteParams) {
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
        { error: "ID invalide." },
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

    if (demande.deletedAt) {
      return NextResponse.json(
        { error: "Cette demande est déjà supprimée." },
        { status: 400 }
      );
    }

    // Permettre la suppression si la demande est rejetée ou en attente
    // Les demandes acceptées avec des missions en cours ne peuvent pas être supprimées directement
    if (demande.statut === "acceptee") {
      // Vérifier s'il y a des missions actives (non terminées)
      const missions = await getMissionsByDemandeId(demandeId);
      
      // Une mission est considérée comme active si elle n'est pas terminée, pas supprimée, et pas archivée
      const hasActiveMissions = missions.some((m) => {
        // Exclure les missions supprimées ou archivées
        if (m.deleted || m.archived) {
          return false;
        }
        
        // Vérifier si la mission est terminée
        const isCompleted = m.internalState === "COMPLETED" || 
                           m.internalState === "ADMIN_CONFIRMED" ||
                           m.status === "termine_icd_canada" || 
                           m.status === "cloture";
        
        // Si la mission n'est pas terminée, elle est active
        return !isCompleted;
      });
      
      if (hasActiveMissions) {
        return NextResponse.json(
          { error: "Impossible de supprimer une demande avec des missions actives." },
          { status: 400 }
        );
      }
    }

    const deleted = await softDeleteDemande(demandeId, userEmail);
    if (!deleted) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        demande: deleted,
        message: "Demande supprimée avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/demandes/[id] DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

// POST : Restaurer une demande
export async function POST(_req: Request, { params }: RouteParams) {
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
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    const restored = await restoreDemande(demandeId);
    if (!restored) {
      const demande = await getDemandeById(demandeId);
      if (!demande) {
        return NextResponse.json(
          { error: "Demande non trouvée." },
          { status: 404 }
        );
      }
      if (!demande.deletedAt) {
        return NextResponse.json(
          { error: "Cette demande n'est pas supprimée." },
          { status: 400 }
        );
      }
      // Vérifier si c'est trop tard
      const deletedDate = new Date(demande.deletedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) {
        return NextResponse.json(
          { error: "Cette demande ne peut plus être restaurée (plus de 30 jours)." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Erreur lors de la restauration." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        demande: restored,
        message: "Demande restaurée avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/demandes/[id] POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

// PATCH : Rejeter une demande
export async function PATCH(req: Request, { params }: RouteParams) {
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
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { action, raisonRejet } = body;

    if (action !== "rejeter") {
      return NextResponse.json(
        { error: "Action invalide." },
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

    if (demande.statut === "rejetee") {
      return NextResponse.json(
        { error: "Cette demande est déjà rejetée." },
        { status: 400 }
      );
    }

    if (demande.deletedAt) {
      return NextResponse.json(
        { error: "Impossible de rejeter une demande supprimée." },
        { status: 400 }
      );
    }

    const rejected = await rejectDemande(demandeId, userEmail, raisonRejet);
    if (!rejected) {
      return NextResponse.json(
        { error: "Erreur lors du rejet." },
        { status: 500 }
      );
    }

    // Envoyer un email au client pour l'informer du refus
    try {
      const { sendEmail } = await import("@/lib/emailService");
      
      const emailSubject = `Votre demande ${rejected.ref} - LeBoy`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0A1B2A; margin-bottom: 20px;">Demande non retenue</h2>
          <p style="color: #4B4F58; line-height: 1.6;">
            Bonjour ${rejected.fullName},
          </p>
          <p style="color: #4B4F58; line-height: 1.6;">
            Nous avons examiné votre demande <strong>${rejected.ref}</strong> concernant "${rejected.serviceType}".
          </p>
          <p style="color: #4B4F58; line-height: 1.6;">
            Après analyse, nous ne sommes malheureusement pas en mesure de prendre en charge cette demande dans le cadre actuel de nos services.
          </p>
          ${raisonRejet ? `
            <div style="background-color: #F9F9FB; border-left: 4px solid #D4A657; padding: 15px; margin: 20px 0;">
              <p style="color: #0A1B2A; margin: 0; font-weight: 600; margin-bottom: 10px;">Raison :</p>
              <p style="color: #4B4F58; margin: 0; line-height: 1.6;">${raisonRejet.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}
          <p style="color: #4B4F58; line-height: 1.6;">
            Nous vous remercions de votre confiance et restons à votre disposition pour d'autres demandes qui pourraient entrer dans notre périmètre d'intervention.
          </p>
          <p style="color: #4B4F58; line-height: 1.6; margin-top: 30px;">
            Cordialement,<br>
            L'équipe LeBoy
          </p>
        </div>
      `;
      
      await sendEmail(rejected.email, emailSubject, emailHtml);
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de refus:", emailError);
      // Ne pas bloquer le rejet si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        demande: rejected,
        message: "Demande rejetée avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/demandes/[id] PATCH:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

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

    return NextResponse.json(
      { demande },
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
    console.error("Erreur /api/admin/demandes/[id]:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
