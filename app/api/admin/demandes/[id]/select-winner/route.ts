import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";
import { getMissionById, saveMissions, getMissionsByDemandeId, addMissionUpdate } from "@/lib/dataAccess";
import { getDemandeById, updateDemandeStatus } from "@/lib/dataAccess";
import { getPrestataireById } from "@/lib/dataAccess";
import { updatePropositionStatut, getPropositionsByDemandeId, createProposition } from "@/lib/dataAccess";
import type { MissionUpdate } from "@/lib/types";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    if ((await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const demandeId = resolvedParams.id; // UUID string (pas de parseInt)
    
    // Valider que c'est un UUID (format basique)
    if (!demandeId || typeof demandeId !== "string" || demandeId.length < 30) {
      return NextResponse.json(
        { error: "UUID de demande invalide." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { missionId } = body;

    // missionId est maintenant un UUID string
    if (!missionId || typeof missionId !== "string" || missionId.length < 30) {
      return NextResponse.json(
        { error: "UUID de mission invalide." },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionId);

    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    if (mission.demandeId !== demandeId) {
      return NextResponse.json(
        { error: "La mission n'appartient pas à cette demande." },
        { status: 400 }
      );
    }

    // Vérifier que la mission a vraiment une estimation soumise
    if (mission.internalState !== "PROVIDER_ESTIMATED") {
      return NextResponse.json(
        { error: "La mission doit avoir une estimation pour être sélectionnée." },
        { status: 400 }
      );
    }
    
    // Vérifier que l'estimation existe vraiment (double vérification)
    if (!mission.estimationPartenaire || !mission.estimationPartenaire.prixFournisseur) {
      return NextResponse.json(
        { error: "Cette mission n'a pas d'estimation valide. Seules les missions avec estimation soumise peuvent être sélectionnées." },
        { status: 400 }
      );
    }
    
    // Récupérer la demande et toutes les missions en parallèle (INCLURE les archivées pour pouvoir les archiver)
    const [demande, allMissionsForDemandeRaw] = await Promise.all([
      getDemandeById(demandeId),
      (async () => {
        // Pour la sélection du gagnant, on doit récupérer TOUTES les missions (y compris archivées)
        // pour pouvoir archiver celles qui ne sont pas gagnantes
        const { getMissionsByDemandeId: getMissionsByDemandeIdDB } = await import("@/repositories/missionsRepo");
        return await getMissionsByDemandeIdDB(demandeId, true); // includeArchived = true
      })().then(missions => missions.map((m: any) => {
        const { convertPrismaMissionToJSON } = require("@/lib/dataAccess");
        return convertPrismaMissionToJSON(m);
      })),
    ]);

    if (!demande) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier si un devis a déjà été généré pour une mission de cette demande
    const missionsWithDevis = allMissionsForDemandeRaw.filter(
      (m) => m.devisGenere
    );
    
    if (missionsWithDevis.length > 0) {
      return NextResponse.json(
        { error: "Impossible de changer le prestataire gagnant. Un devis a déjà été généré et envoyé au client." },
        { status: 400 }
      );
    }

    // Filtrer les missions avec des estimations
    const allMissionsForDemande = allMissionsForDemandeRaw.filter(
      (m) => m.internalState === "PROVIDER_ESTIMATED"
    );

    // Récupérer toutes les propositions pour cette demande
    let propositions = await getPropositionsByDemandeId(demandeId);

    // Si aucune proposition n'existe, créer des propositions pour toutes les missions avec estimations (en parallèle)
    if (propositions.length === 0) {
      const createPromises = allMissionsForDemande
        .filter((m) => m.estimationPartenaire && m.prestataireId)
        .map((m) =>
          createProposition({
            demandeId: demandeId,
            prestataireId: m.prestataireId!,
            prix_prestataire: m.estimationPartenaire!.prixFournisseur,
            delai_estime: m.estimationPartenaire!.delaisEstimes,
            commentaire: m.estimationPartenaire!.noteExplication || "",
            difficulte_estimee: 3, // Valeur par défaut
          })
        );
      
      await Promise.all(createPromises);
      // Recharger les propositions après création
      propositions = await getPropositionsByDemandeId(demandeId);
    }

    // Accepter la proposition du gagnant
    let winningProposition = propositions.find(
      (p) => p.prestataireId === mission.prestataireId
    );

    // Si la proposition n'existe pas, la créer (seulement si l'estimation existe vraiment)
    if (!winningProposition && mission.prestataireId && mission.estimationPartenaire && mission.estimationPartenaire.prixFournisseur) {
      await createProposition({
        demandeId: demandeId,
        prestataireId: mission.prestataireId,
        prix_prestataire: mission.estimationPartenaire.prixFournisseur,
        delai_estime: mission.estimationPartenaire.delaisEstimes,
        commentaire: mission.estimationPartenaire.noteExplication || "",
        difficulte_estimee: 3,
      });
      propositions = await getPropositionsByDemandeId(demandeId);
      winningProposition = propositions.find(
        (p) => p.prestataireId === mission.prestataireId
      );
    } else if (!winningProposition) {
      // Si on ne peut pas créer la proposition car pas d'estimation, erreur
      return NextResponse.json(
        { error: "Impossible de créer la proposition : la mission n'a pas d'estimation valide." },
        { status: 400 }
      );
    }

    if (winningProposition && winningProposition.statut !== "acceptee") {
      await updatePropositionStatut(winningProposition.id, "acceptee", userEmail, missionId);
    }

    // Refuser toutes les autres propositions (en parallèle)
    const rejectPromises = propositions
      .filter(
        (prop) =>
          prop.prestataireId !== mission.prestataireId &&
          prop.statut !== "refusee"
      )
      .map((prop) =>
        updatePropositionStatut(prop.id, "refusee", userEmail, undefined, "Non sélectionné par l'administrateur")
      );
    
    await Promise.all(rejectPromises);

    // Archiver les missions des prestataires non sélectionnés (en parallèle avec Prisma)
    const missionsToArchive = allMissionsForDemande.filter((m) => m.id !== missionId);
    
    console.log(`[SELECT-WINNER] Missions à archiver: ${missionsToArchive.length}`);
    missionsToArchive.forEach(m => {
      console.log(`[SELECT-WINNER]   - Mission ${m.ref} (${m.id}) - Prestataire: ${m.prestataireId}`);
    });
    
    if (missionsToArchive.length > 0) {
      const { archiveMission } = await import("@/repositories/missionsRepo");
      const { USE_DB } = await import("@/lib/dbFlag");
      
      if (USE_DB) {
        // Utiliser Prisma directement pour archiver (plus rapide)
        const archivePromises = missionsToArchive.map(async (m) => {
          try {
            console.log(`[SELECT-WINNER] 🔄 Archivage mission ${m.ref} (${m.id})...`);
            const result = await archiveMission(m.id, userEmail);
            console.log(`[SELECT-WINNER] ✅ Mission ${m.ref} archivée avec succès`);
            return result;
          } catch (error) {
            console.error(`[SELECT-WINNER] ❌ Erreur archivage mission ${m.ref} (${m.id}):`, error);
            throw error;
          }
        });
        
        // Ajouter les mises à jour en parallèle aussi
        const updatePromises = missionsToArchive.map((m) =>
          addMissionUpdate(m.id, {
            type: "status_change",
            author: "admin",
            authorEmail: userEmail,
            content: `Mission archivée : prestataire non sélectionné comme gagnant.`,
          })
        );
        
        await Promise.all([...archivePromises, ...updatePromises]);
        console.log(`[SELECT-WINNER] ✅ ${missionsToArchive.length} mission(s) archivée(s) avec succès`);
        
        // Envoyer des notifications email aux prestataires non sélectionnés (en parallèle)
        const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
        const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
        
        const emailPromises = missionsToArchive.map(async (m) => {
          try {
            const prestataire = m.prestataireId ? await getPrestataireById(m.prestataireId) : null;
            if (prestataire && prestataire.email) {
              const { sendNotificationEmail } = await import("@/lib/emailService");
              await sendNotificationEmail(
                "mission-not-selected",
                { 
                  email: prestataire.email, 
                  name: prestataire.nomEntreprise || prestataire.nomContact || prestataire.email 
                },
                {
                  missionRef: m.ref,
                  demandeRef: demande.ref,
                  estimationPrix: m.estimationPartenaire?.prixFournisseur,
                  estimationDelai: m.estimationPartenaire?.delaisEstimes,
                  platformUrl,
                },
                "fr"
              );
            }
          } catch (error) {
            console.error(`Erreur envoi email notification prestataire ${m.prestataireId}:`, error);
            // Ne pas bloquer le processus si l'email échoue
          }
        });
        
        // Envoyer les emails en parallèle (ne pas attendre pour ne pas bloquer)
        Promise.all(emailPromises).catch((error) => {
          console.error("Erreur lors de l'envoi des emails de notification:", error);
        });
      } else {
        // Fallback JSON (ne devrait plus être utilisé)
        const now = new Date().toISOString();
        for (const m of missionsToArchive) {
          m.archived = true;
          m.archivedAt = now;
          m.archivedBy = "admin";
          await addMissionUpdate(m.id, {
            type: "status_change",
            author: "admin",
            authorEmail: userEmail,
            content: `Mission archivée : prestataire non sélectionné comme gagnant.`,
          });
        }
        await saveMissions();
      }
    }

    // Mettre à jour le statut de la demande pour indiquer qu'un prestataire a été assigné
    // (fait en parallèle avec les autres opérations si possible)
    if (mission.prestataireId) {
      try {
        await updateDemandeStatus(demandeId, "acceptee");
        // Le statut "prestataire assigné : [nom]" sera géré par le composant DemandeAssignmentStatus
      } catch (error) {
        console.error("Erreur mise à jour statut demande:", error);
        // Ne pas bloquer la sélection si la mise à jour du statut échoue
      }
    }

    return NextResponse.json({
      success: true,
      message: "Prestataire gagnant sélectionné avec succès.",
      mission: mission,
    });
  } catch (error) {
    console.error("Erreur /api/admin/demandes/[id]/select-winner:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

