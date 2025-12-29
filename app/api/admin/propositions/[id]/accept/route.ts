// app/api/admin/propositions/[id]/accept/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";
import { getPropositionById, updatePropositionStatut, getPropositionsByDemandeId } from "@/lib/dataAccess";
import { getDemandeById } from "@/lib/dataAccess";
import { getMissionsByDemandeId, getMissionById, updateMissionInternalState, saveMissions } from "@/lib/missionsStore";
import { getPrestataireByEmail } from "@/lib/dataAccess";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const propositionUuid = resolvedParams.id;
    
    const uuidValidation = validateUUID(propositionUuid, "Proposition ID");
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { error: uuidValidation.error },
        { status: 400 }
      );
    }

    // Récupérer la proposition
    // Note: getPropositionById accepte number pour JSON store, mais UUID pour Prisma
    // On doit utiliser directement le repository Prisma si USE_DB
    const { USE_DB } = await import("@/lib/dbFlag");
    let proposition: any = null;
    
    if (USE_DB) {
      const { getPropositionById } = await import("@/repositories/propositionsRepo");
      const propPrisma = await getPropositionById(propositionUuid);
      if (propPrisma) {
        const { convertPrismaPropositionToJSON } = await import("@/lib/dataAccess");
        proposition = convertPrismaPropositionToJSON(propPrisma);
      }
    } else {
      proposition = await getPropositionById(parseInt(propositionUuid)); // JSON fallback
    }
    if (!proposition) {
      return NextResponse.json(
        { error: "Proposition non trouvée." },
        { status: 404 }
      );
    }

    if (proposition.statut !== "en_attente") {
      return NextResponse.json(
        { error: "Cette proposition a déjà été traitée." },
        { status: 400 }
      );
    }

    // Récupérer la demande
    const demande = await getDemandeById(proposition.demandeId);
    if (!demande) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // Récupérer le prestataire - on doit trouver le prestataire par son ID
    // Pour l'instant, on utilise le fallback JSON car on n'a pas de fonction getPrestataireById dans dataAccess
    const { getAllPrestataires } = await import("@/repositories/prestatairesRepo");
    const { USE_DB } = await import("@/lib/dbFlag");
    let prestataire: any = null;

    if (USE_DB) {
      try {
        const allPrestataires = await getAllPrestataires();
        prestataire = allPrestataires.find((p: any) => {
          if (typeof p.id === "string" && p.id.includes("-")) {
            const hash = p.id.split("").reduce((acc: number, char: string) => {
              return ((acc << 5) - acc) + char.charCodeAt(0);
            }, 0);
            const idNumber = Math.abs(hash) % 1000000;
            return idNumber === proposition.prestataireId;
          }
          return parseInt(String(p.id)) === proposition.prestataireId;
        });
      } catch (error) {
        console.error("Erreur recherche prestataire (DB):", error);
        const { prestatairesStore } = await import("@/lib/prestatairesStore");
        prestataire = prestatairesStore.find((p) => p.id === proposition.prestataireId);
      }
    } else {
      const { prestatairesStore } = await import("@/lib/prestatairesStore");
      prestataire = prestatairesStore.find((p) => p.id === proposition.prestataireId);
    }

    if (!prestataire) {
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    // Trouver la mission existante pour cette demande et ce prestataire
    const missions = await getMissionsByDemandeId(demande.id);
    const mission = missions.find((m) => m.prestataireId === proposition.prestataireId);

    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée pour ce prestataire et cette demande." },
        { status: 404 }
      );
    }

    // Mettre à jour la mission avec les informations de la proposition
    mission.tarifPrestataire = proposition.prix_prestataire;
    
    // Définir le délai maximal basé sur la proposition
    if (proposition.delai_estime) {
      mission.delaiMaximal = proposition.delai_estime * 24; // Convertir jours en heures
      const dateLimite = new Date();
      dateLimite.setHours(dateLimite.getHours() + mission.delaiMaximal);
      mission.dateLimiteMission = dateLimite.toISOString();
    }

    // Ajouter l'estimation du partenaire
    mission.estimationPartenaire = {
      prixFournisseur: proposition.prix_prestataire,
      delaisEstimes: proposition.delai_estime * 24, // Convertir jours en heures
      noteExplication: proposition.commentaire,
      soumiseAt: proposition.createdAt,
    };

    // Mettre à jour l'état interne vers PROVIDER_ESTIMATED (le prestataire a soumis son estimation)
    updateMissionInternalState(mission.id, "PROVIDER_ESTIMATED", userEmail);
    saveMissions();

    // Mettre à jour le statut de la proposition acceptée
    await updatePropositionStatut(propositionUuid, "acceptee", userEmail, mission.id);

    // Refuser automatiquement toutes les autres propositions pour cette demande
    const toutesPropositions = await getPropositionsByDemandeId(demande.id);
    for (const prop of toutesPropositions) {
      // Comparer les IDs (peuvent être UUIDs ou numbers selon le store)
      const propId = typeof prop.id === "string" ? prop.id : String(prop.id);
      const currentPropId = typeof propositionUuid === "string" ? propositionUuid : String(propositionUuid);
      if (propId !== currentPropId && prop.statut === "en_attente") {
        await updatePropositionStatut(prop.id, "refusee", userEmail, null, "Proposition non retenue - Autre prestataire sélectionné");
      }
    }

    // Envoyer notification email au prestataire
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
      
      await sendNotificationEmail(
        "mission-assigned",
        { email: prestataire.email, name: prestataire.nomEntreprise || prestataire.nomContact },
        {
          missionRef: mission.ref,
          serviceType: mission.serviceType,
          lieu: mission.lieu || "Non spécifié",
          platformUrl,
          missionId: mission.id,
        },
        "fr"
      );
    } catch (error) {
      console.error("Erreur envoi email notification prestataire:", error);
      // Ne pas bloquer la création de la mission si l'email échoue
    }

    // Récupérer la proposition mise à jour
    let updatedProposition: any = null;
    if (USE_DB) {
      const { getPropositionById } = await import("@/repositories/propositionsRepo");
      const propPrisma = await getPropositionById(propositionUuid);
      if (propPrisma) {
        const { convertPrismaPropositionToJSON } = await import("@/lib/dataAccess");
        updatedProposition = convertPrismaPropositionToJSON(propPrisma);
      }
    } else {
      updatedProposition = await getPropositionById(parseInt(propositionUuid)); // JSON fallback
    }

    return NextResponse.json(
      {
        success: true,
        mission,
        proposition: updatedProposition,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/propositions/[id]/accept:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

