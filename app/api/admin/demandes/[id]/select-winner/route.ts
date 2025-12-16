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
    const demandeId = parseInt(resolvedParams.id);
    if (isNaN(demandeId)) {
      return NextResponse.json(
        { error: "ID de demande invalide." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { missionId } = body;

    if (!missionId || isNaN(parseInt(String(missionId)))) {
      return NextResponse.json(
        { error: "ID de mission invalide." },
        { status: 400 }
      );
    }

    const missionIdNum = parseInt(String(missionId));
    const mission = await getMissionById(missionIdNum);

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

    if (mission.internalState !== "PROVIDER_ESTIMATED") {
      return NextResponse.json(
        { error: "La mission doit avoir une estimation pour être sélectionnée." },
        { status: 400 }
      );
    }
    
    // Vérifier si un devis a déjà été généré pour une mission de cette demande
    const allMissionsForDemandeCheck = await getMissionsByDemandeId(demandeId);
    const missionsWithDevis = allMissionsForDemandeCheck.filter(
      (m) => m.devisGenere
    );
    
    if (missionsWithDevis.length > 0) {
      return NextResponse.json(
        { error: "Impossible de changer le prestataire gagnant. Un devis a déjà été généré et envoyé au client." },
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

    // Récupérer toutes les missions de cette demande avec des estimations
    const allMissionsForDemandeRaw = await getMissionsByDemandeId(demandeId);
    const allMissionsForDemande = allMissionsForDemandeRaw.filter(
      (m) => m.internalState === "PROVIDER_ESTIMATED"
    );

    // Récupérer toutes les propositions pour cette demande
    let propositions = await getPropositionsByDemandeId(demandeId);

    // Si aucune proposition n'existe, créer des propositions pour toutes les missions avec estimations
    if (propositions.length === 0) {
      for (const m of allMissionsForDemande) {
        if (m.estimationPartenaire && m.prestataireId) {
          await createProposition({
            demandeId: demandeId,
            prestataireId: m.prestataireId,
            prix_prestataire: m.estimationPartenaire.prixFournisseur,
            delai_estime: m.estimationPartenaire.delaisEstimes,
            commentaire: m.estimationPartenaire.noteExplication || "",
            difficulte_estimee: 3, // Valeur par défaut
          });
        }
      }
      // Recharger les propositions après création
      propositions = await getPropositionsByDemandeId(demandeId);
    }

    // Accepter la proposition du gagnant
    let winningProposition = propositions.find(
      (p) => p.prestataireId === mission.prestataireId
    );

    // Si la proposition n'existe pas, la créer
    if (!winningProposition && mission.prestataireId && mission.estimationPartenaire) {
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
    }

    if (winningProposition && winningProposition.statut !== "acceptee") {
      await updatePropositionStatut(winningProposition.id, "acceptee", userEmail, missionIdNum);
    }

    // Refuser toutes les autres propositions
    for (const prop of propositions) {
      if (
        prop.prestataireId !== mission.prestataireId &&
        prop.statut !== "refusee"
      ) {
        await updatePropositionStatut(prop.id, "refusee", userEmail, undefined, "Non sélectionné par l'administrateur");
      }
    }

    // Archiver les missions des prestataires non sélectionnés
    const now = new Date().toISOString();
    for (const m of allMissionsForDemande) {
      if (m.id !== missionIdNum) {
        // Archiver la mission du prestataire non sélectionné
        m.archived = true;
        m.archivedAt = now;
        m.archivedBy = "admin";
        
        // Ajouter une mise à jour pour tracer l'archivage
        await addMissionUpdate(m.id, {
          type: "status_change",
          author: "admin",
          authorEmail: userEmail,
          content: `Mission archivée : prestataire non sélectionné comme gagnant.`,
        });
      }
    }
    
    // Sauvegarder les missions archivées
    await saveMissions();

    // Mettre à jour le statut de la demande pour indiquer qu'un prestataire a été assigné
    if (mission.prestataireId) {
      const prestataire = await getPrestataireById(mission.prestataireId);
      if (prestataire && demandeId) {
        await updateDemandeStatus(demandeId, "acceptee");
      }
      // Le statut "prestataire assigné : [nom]" sera géré par le composant DemandeAssignmentStatus
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

