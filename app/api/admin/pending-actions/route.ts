import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";
import { getAllDemandes, getAllPrestataires } from "@/lib/dataAccess";
import { adminNotificationsStore } from "@/lib/adminNotificationsStore";

export async function GET() {
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

    // Récupérer toutes les données (filtrer les supprimées avec deletedAt)
    const allDemandes = await getAllDemandes();
    const demandes = allDemandes.filter((d) => !d.deletedAt);
    const allPrestataires = await getAllPrestataires();
    const prestataires = allPrestataires.filter((p) => !p.deletedAt);
    
    // Pour les missions et propositions, utiliser les stores JSON directement pour cette route de lecture
    // car getAllMissions/getAllPropositions ne sont pas encore implémentées dans dataAccess
    const { missionsStore } = await import("@/lib/missionsStore");
    const missions = missionsStore || [];
    const { propositionsStore } = await import("@/lib/propositionsStore");
    const propositions = propositionsStore || [];

    // Compter les actions en attente pour les demandes
    let demandesEnAttente = 0;
    
    for (const demande of demandes) {
      // Nouvelles demandes non assignées
      const missionsPourDemande = missions.filter(
        (m) => m.demandeId === demande.id && !m.deleted && !m.archived
      );
      
      if (missionsPourDemande.length === 0) {
        // Pas de mission = demande non assignée
        demandesEnAttente++;
        continue;
      }

      // Vérifier s'il y a des missions en attente d'avance (PAID_WAITING_TAKEOVER)
      // Cela signifie que le client a payé et l'admin doit envoyer l'avance au prestataire
      const missionsEnAttenteAvance = missionsPourDemande.filter(
        (m) => m.internalState === "PAID_WAITING_TAKEOVER"
      );

      if (missionsEnAttenteAvance.length > 0) {
        // Vérifier si l'admin a déjà vu la notification de paiement
        const hasUnreadPaymentNotification = missionsEnAttenteAvance.some((m) => {
          const notification = adminNotificationsStore.find(
            (n) => n.type === "mission_paid" && n.missionId === m.id && !n.read
          );
          return notification !== undefined;
        });

        // Si aucune notification non lue, l'admin a déjà pris note
        if (hasUnreadPaymentNotification) {
          // Le client a payé, l'admin doit envoyer l'avance
          demandesEnAttente++;
          continue;
        }
      }

      // Vérifier s'il y a des missions en cours (IN_PROGRESS) qui nécessitent un suivi
      // Cela signifie que le prestataire a pris en charge la mission et travaille dessus
      const missionsEnCours = missionsPourDemande.filter(
        (m) => m.internalState === "IN_PROGRESS"
      );

      if (missionsEnCours.length > 0) {
        // Vérifier si l'admin a déjà vu la notification de prise en charge
        const hasUnreadTakeoverNotification = missionsEnCours.some((m) => {
          const notification = adminNotificationsStore.find(
            (n) => (n.type === "mission_taken_over" || n.type === "mission_started") && 
                   n.missionId === m.id && !n.read
          );
          return notification !== undefined;
        });

        // Si aucune notification non lue, l'admin a déjà pris note de la prise en charge
        // L'alerte disparaît car l'admin est au courant
        if (hasUnreadTakeoverNotification) {
          // Mission en cours - l'admin doit être informé de la prise en charge
          demandesEnAttente++;
          continue;
        }
      }

      // Vérifier s'il y a des missions avec preuves soumises (PROVIDER_VALIDATION_SUBMITTED)
      // Cela signifie que le prestataire a soumis les preuves et l'admin doit valider
      const missionsAvecPreuves = missionsPourDemande.filter(
        (m) => m.internalState === "PROVIDER_VALIDATION_SUBMITTED"
      );

      if (missionsAvecPreuves.length > 0) {
        // Vérifier si l'admin a déjà vu la notification de validation soumise
        const hasUnreadValidationNotification = missionsAvecPreuves.some((m) => {
          const notification = adminNotificationsStore.find(
            (n) => n.type === "mission_validation_submitted" && n.missionId === m.id && !n.read
          );
          return notification !== undefined;
        });

        // Si aucune notification non lue, l'admin a déjà pris note
        if (hasUnreadValidationNotification) {
          // Des preuves ont été soumises, l'admin doit valider
          demandesEnAttente++;
          continue;
        }
      }

      // Vérifier s'il y a des missions avec estimations reçues (PROVIDER_ESTIMATED)
      // mais pas encore de proposition acceptée
      const missionsAvecEstimations = missionsPourDemande.filter(
        (m) => m.internalState === "PROVIDER_ESTIMATED" && m.estimationPartenaire
      );

      if (missionsAvecEstimations.length > 0) {
        // Il y a des estimations reçues, vérifier si une proposition a été acceptée
        const propositionsPourDemande = propositions.filter(
          (p) => p.demandeId === demande.id
        );

        const propositionAcceptee = propositionsPourDemande.find(
          (p) => p.statut === "acceptee"
        );

        if (!propositionAcceptee) {
          // Des estimations ont été reçues mais aucune proposition n'a été acceptée
          // Vérifier si l'admin a déjà vu les notifications d'estimation
          const hasUnreadEstimationNotification = missionsAvecEstimations.some((m) => {
            const notification = adminNotificationsStore.find(
              (n) => n.type === "mission_estimated" && n.missionId === m.id && !n.read
            );
            return notification !== undefined;
          });

          // Si l'admin a vu toutes les notifications d'estimation, ne pas compter comme en attente
          // (l'admin peut prendre son temps pour sélectionner)
          if (hasUnreadEstimationNotification) {
            // L'admin doit sélectionner un gagnant ou générer un devis
            demandesEnAttente++;
            continue;
          }
        }

        // Si une proposition est acceptée, vérifier si le devis a été généré
        const missionAcceptee = missionsPourDemande.find(
          (m) => m.prestataireId === propositionAcceptee?.prestataireId &&
                 m.internalState === "PROVIDER_ESTIMATED"
        );

        if (missionAcceptee && !missionAcceptee.devisGenere) {
          // Proposition acceptée mais devis non généré
          demandesEnAttente++;
          continue;
        }
      }

      // Vérifier s'il y a des propositions en attente de sélection
      const propositionsPourDemande = propositions.filter(
        (p) => p.demandeId === demande.id
      );

      const propositionsEnAttente = propositionsPourDemande.filter(
        (p) => p.statut === "en_attente"
      );

      if (propositionsEnAttente.length > 0) {
        // Il y a des propositions en attente de sélection
        demandesEnAttente++;
        continue;
      }
    }

    // Compter les prestataires en attente de validation
    const prestatairesEnAttente = prestataires.filter(
      (p) => p.statut === "en_attente"
    ).length;

    return NextResponse.json({
      demandes: demandesEnAttente,
      prestataires: prestatairesEnAttente,
    });
  } catch (error) {
    console.error("Erreur /api/admin/pending-actions:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

