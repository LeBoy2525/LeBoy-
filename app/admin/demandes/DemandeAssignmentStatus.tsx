"use client";

import { useState, useEffect } from "react";
import { UserPlus, User, CheckCircle } from "lucide-react";
import type { DemandeICD } from "@/lib/demandesStore";
import type { Mission } from "@/lib/types";

interface DemandeAssignmentStatusProps {
  demande: DemandeICD;
  missions: Mission[];
  onAssignClick: () => void;
  lang: "fr" | "en";
  t: any;
}

export function DemandeAssignmentStatus({ 
  demande, 
  missions, 
  onAssignClick, 
  lang, 
  t 
}: DemandeAssignmentStatusProps) {
  const [prestataire, setPrestataire] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [propositions, setPropositions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      if (missions.length === 0) {
        setPrestataire(null);
        setPropositions([]);
        setLoading(false);
        return;
      }

      // Charger les propositions pour cette demande d'abord
      try {
        const propRes = await fetch(`/api/admin/demandes/${demande.id}/propositions`, { cache: "no-store" });
        if (propRes.ok) {
          const propData = await propRes.json();
          setPropositions(propData.propositions || []);
          
          // Vérifier s'il y a une proposition acceptée
          const propositionAcceptee = propData.propositions?.find(
            (p: any) => p.proposition?.statut === "acceptee"
          );
          
          // Si une proposition est acceptée, trouver la mission correspondante et charger le prestataire
          if (propositionAcceptee && propositionAcceptee.proposition?.prestataireId) {
            const missionAcceptee = missions.find(
              (m) => m.prestataireId === propositionAcceptee.proposition.prestataireId && 
                     m.internalState !== "ASSIGNED_TO_PROVIDER" && 
                     m.internalState !== "CREATED"
            );
            
            if (missionAcceptee && missionAcceptee.prestataireId) {
              try {
                const res = await fetch(`/api/prestataires/${missionAcceptee.prestataireId}`, { cache: "no-store" });
                if (res.ok) {
                  const data = await res.json();
                  setPrestataire(data.prestataire);
                }
              } catch (err) {
                console.error("Erreur récupération prestataire:", err);
              }
            }
          } else {
            // Si pas de proposition acceptée mais qu'il y a des missions, charger le premier prestataire assigné
            const firstMission = missions.find(m => m.prestataireId);
            if (firstMission && firstMission.prestataireId) {
              try {
                const res = await fetch(`/api/prestataires/${firstMission.prestataireId}`, { cache: "no-store" });
                if (res.ok) {
                  const data = await res.json();
                  setPrestataire(data.prestataire);
                }
              } catch (err) {
                console.error("Erreur récupération prestataire:", err);
              }
            }
          }
        }
      } catch (err) {
        console.error("Erreur récupération propositions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [demande.id, missions]);, [missions, demande.id]);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6B7280] border border-[#DDDDDD] rounded-md">
        <span>{lang === "fr" ? "Chargement..." : "Loading..."}</span>
      </div>
    );
  }

  // Pas de mission = en attente d'assignation
  if (missions.length === 0) {
    return (
      <button
        onClick={onAssignClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition"
      >
        <UserPlus className="w-3.5 h-3.5" />
        {lang === "fr" ? "Assigner un ou plusieurs prestataires" : "Assign one or more providers"}
      </button>
    );
  }

  // Vérifier s'il y a une proposition acceptée dans les propositions chargées
  const propositionAcceptee = propositions.find(
    (p: any) => p.proposition?.statut === "acceptee"
  );

  // Si une proposition est acceptée, trouver la mission correspondante
  let missionAcceptee: Mission | undefined;
  if (propositionAcceptee && propositionAcceptee.proposition?.prestataireId) {
    missionAcceptee = missions.find(
      (m) => m.prestataireId === propositionAcceptee.proposition.prestataireId &&
             (m.internalState === "PROVIDER_ESTIMATED" || 
              m.internalState === "WAITING_CLIENT_PAYMENT" ||
              m.internalState === "PAID_WAITING_TAKEOVER" ||
              m.internalState === "ADVANCE_SENT" ||
              m.internalState === "IN_PROGRESS" ||
              m.internalState === "PROVIDER_VALIDATION_SUBMITTED" ||
              m.internalState === "ADMIN_CONFIRMED" ||
              m.internalState === "COMPLETED")
    );
  }

  // Si toutes les missions sont en ASSIGNED_TO_PROVIDER ou CREATED
  const toutesEnAttente = missions.every(
    (m) => m.internalState === "ASSIGNED_TO_PROVIDER" || m.internalState === "CREATED"
  );

  // Si aucune proposition n'est acceptée ET toutes les missions sont en attente → "En attente d'estimation"
  if (!propositionAcceptee && toutesEnAttente) {
    // Vérifier si le délai de 24h est expiré
    const maintenant = new Date();
    const missionsEnAttente = missions.filter((m) => m.dateLimiteProposition);
    const toutesExpirees = missionsEnAttente.length > 0 && missionsEnAttente.every((m) => {
      if (!m.dateLimiteProposition) return false;
      return new Date(m.dateLimiteProposition) < maintenant;
    });

    if (toutesExpirees) {
      // Toutes les missions ont expiré, mais aucune proposition acceptée
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
          <UserPlus className="w-3.5 h-3.5" />
          <span>{lang === "fr" ? "Délai d'estimation expiré" : "Estimation deadline expired"}</span>
        </div>
      );
    }

    // En attente d'estimation des prestataires
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-md">
        <UserPlus className="w-3.5 h-3.5" />
        <span>{lang === "fr" ? "En attente d'estimation" : "Waiting for estimation"}</span>
        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px]">
          {missions.length} {lang === "fr" ? "prestataire(s)" : "provider(s)"}
        </span>
      </div>
    );
  }

  // Une proposition a été acceptée, afficher le prestataire assigné
  const mission = missionAcceptee || missions[0];
  
  if (!mission) {
    return null;
  }
  
  // Mission terminée
  if (mission.status === "termine_icd_canada" || mission.status === "cloture") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-md">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>
          {t.prestataireAssigne}: {prestataire?.nomEntreprise || mission.prestataireRef || "N/A"}
        </span>
        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px]">
          {t.terminee}
        </span>
      </div>
    );
  }

  // Mission refusée/annulée
  if (mission.status === "annulee") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-md">
        <User className="w-3.5 h-3.5" />
        <span>
          {t.prestataireAssigne}: {prestataire?.nomEntreprise || mission.prestataireRef || "N/A"}
        </span>
        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px]">
          {lang === "fr" ? "Refusée" : "Refused"}
        </span>
      </div>
    );
  }

  // Mission avec estimation reçue mais devis pas encore généré (nécessite action admin pour générer devis)
  if (mission.internalState === "PROVIDER_ESTIMATED" && !mission.devisGenere) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border-2 border-orange-400 rounded-md">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>
          {lang === "fr" ? "Estimation reçue" : "Estimation received"}
        </span>
        <span className="ml-2 px-2 py-0.5 bg-orange-600 text-white rounded-full text-[10px] font-bold animate-pulse">
          📋 {lang === "fr" ? "Générer le devis" : "Generate quote"}
        </span>
      </div>
    );
  }

  // Mission avec paiement reçu, en attente d'envoi avance
  if (mission.internalState === "PAID_WAITING_TAKEOVER") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border-2 border-orange-400 rounded-md">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>
          {t.prestataireAssigne}: {prestataire?.nomEntreprise || mission.prestataireRef || "N/A"}
        </span>
        <span className="ml-2 px-2 py-0.5 bg-orange-600 text-white rounded-full text-[10px] font-bold animate-pulse">
          💰 {lang === "fr" ? "Envoi avance requis" : "Advance payment required"}
        </span>
      </div>
    );
  }

  // Mission avec preuves soumises, en attente validation
  if (mission.internalState === "PROVIDER_VALIDATION_SUBMITTED") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border-2 border-purple-400 rounded-md">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>
          {t.prestataireAssigne}: {prestataire?.nomEntreprise || mission.prestataireRef || "N/A"}
        </span>
        <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white rounded-full text-[10px] font-bold animate-pulse">
          ✅ {lang === "fr" ? "Validation requise" : "Validation required"}
        </span>
      </div>
    );
  }

  // Mission avec devis généré (WAITING_CLIENT_PAYMENT) ou état ultérieur - Prestataire assigné définitivement
  // Note: PROVIDER_VALIDATION_SUBMITTED, PAID_WAITING_TAKEOVER, PROVIDER_ESTIMATED sont déjà gérés ci-dessus
  const state = mission.internalState;
  if (state === "WAITING_CLIENT_PAYMENT" || 
      state === "ADVANCE_SENT" ||
      state === "IN_PROGRESS" ||
      state === "ADMIN_CONFIRMED" ||
      state === "COMPLETED") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-md">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>
          {t.prestataireAssigne}: {prestataire?.nomEntreprise || mission.prestataireRef || "N/A"}
        </span>
      </div>
    );
  }

  // Mission avec estimation acceptée mais devis pas encore généré (PROVIDER_ESTIMATED avec devisGenere)
  if (mission.internalState === "PROVIDER_ESTIMATED" && mission.devisGenere) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-md">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>
          {t.prestataireAssigne}: {prestataire?.nomEntreprise || mission.prestataireRef || "N/A"}
        </span>
      </div>
    );
  }

  // Par défaut, ne devrait pas arriver ici
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
      <User className="w-3.5 h-3.5" />
      <span>{lang === "fr" ? "Statut inconnu" : "Unknown status"}</span>
    </div>
  );
}

