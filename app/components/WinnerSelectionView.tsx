"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Trophy, X, MessageSquare } from "lucide-react";
import type { Mission } from "@/lib/types";
import { MissionChat } from "./MissionChat";

interface Prestataire {
  id: string;
  nomEntreprise?: string;
  nomContact?: string;
  email: string;
}

interface WinnerSelectionViewProps {
  missions: Mission[];
  demandeId: string;
  lang?: "fr" | "en";
  onWinnerSelected: () => void;
}

const TEXT = {
  fr: {
    title: "Sélectionner le prestataire gagnant",
    subtitle: "Choisissez le prestataire selon le rapport qualité/prix/délai",
    prix: "Prix",
    delais: "Délais",
    heures: "heures",
    note: "Note",
    selectionner: "Sélectionner ce prestataire",
    selectionEnCours: "Sélection en cours...",
    aucunEstimation: "Aucune estimation reçue",
  },
  en: {
    title: "Select winning provider",
    subtitle: "Choose the provider based on quality/price/deadline ratio",
    prix: "Price",
    delais: "Deadline",
    heures: "hours",
    note: "Note",
    selectionner: "Select this provider",
    selectionEnCours: "Selection in progress...",
    aucunEstimation: "No estimation received",
  },
} as const;

function WinnerSelectionView({
  missions,
  demandeId,
  lang = "fr",
  onWinnerSelected,
}: WinnerSelectionViewProps) {
  const t = TEXT[lang];
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prestataires, setPrestataires] = useState<Map<string, Prestataire>>(new Map());
  const [chatMissionId, setChatMissionId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  // Filtrer les missions avec des estimations VALIDES (double vérification)
  const missionsWithEstimations = missions.filter(
    (m) => 
      !m.archived && // Ne pas inclure les missions archivées
      !m.deleted && // Ne pas inclure les missions supprimées
      m.internalState === "PROVIDER_ESTIMATED" && // Doit avoir soumis une estimation
      m.estimationPartenaire && // L'estimation doit exister
      m.estimationPartenaire.prixFournisseur && // L'estimation doit avoir un prix valide
      !m.devisGenere // Le devis ne doit pas encore être généré
  );

  // Charger l'email de l'utilisateur (admin)
  useEffect(() => {
    async function fetchUserEmail() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserEmail(data.user?.email || "");
        }
      } catch (err) {
        console.error("Erreur chargement email utilisateur:", err);
      }
    }
    fetchUserEmail();
  }, []);

  // Charger les informations des prestataires
  useEffect(() => {
    async function fetchPrestataires() {
      const prestatairesMap = new Map<string, Prestataire>();
      
      for (const mission of missionsWithEstimations) {
        if (mission.prestataireId && !prestatairesMap.has(mission.prestataireId)) {
          try {
            const res = await fetch(`/api/prestataires/${mission.prestataireId}`, {
              cache: "no-store",
            });
            if (res.ok) {
              const data = await res.json();
              if (data.prestataire) {
                prestatairesMap.set(mission.prestataireId, data.prestataire);
              }
            }
          } catch (err) {
            console.error(`Erreur chargement prestataire ${mission.prestataireId}:`, err);
          }
        }
      }
      
      setPrestataires(prestatairesMap);
    }

    if (missionsWithEstimations.length > 0) {
      fetchPrestataires();
    }
  }, [missionsWithEstimations]);
  
  // Vérifier si un devis a déjà été généré pour une des missions
  const devisGenere = missions.some((m) => m.devisGenere);

  if (missionsWithEstimations.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">{t.aucunEstimation}</p>
      </div>
    );
  }
  
  // Si un devis a déjà été généré, ne pas permettre de changer le gagnant
  if (devisGenere) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 font-semibold">
          {lang === "fr" 
            ? "✅ Un devis a déjà été généré. Le prestataire gagnant ne peut plus être modifié."
            : "✅ A quote has already been generated. The winning provider cannot be changed."}
        </p>
      </div>
    );
  }

  const handleSelectWinner = async (missionId: string) => {
    if (submitting || devisGenere) return;

    if (!confirm(lang === "fr" 
      ? "Confirmer la sélection de ce prestataire comme gagnant ? Les autres prestataires seront automatiquement refusés."
      : "Confirm selection of this provider as winner? Other providers will be automatically rejected."
    )) {
      return;
    }

    // Mettre à jour l'état immédiatement pour le feedback UI
    setSubmitting(true);
    setSelectedMissionId(missionId);

    try {
      const res = await fetch(`/api/admin/demandes/${demandeId}/select-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });

      const data = await res.json();

      if (res.ok) {
        // Appeler le callback pour mettre à jour l'état parent
        if (onWinnerSelected) {
          onWinnerSelected();
        }
        // Recharger la page pour mettre à jour l'affichage
        window.location.reload();
      } else {
        alert(data.error || (lang === "fr" ? "Erreur lors de la sélection" : "Error selecting"));
        setSelectedMissionId(null);
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert(lang === "fr" ? "Erreur lors de la sélection" : "Error selecting");
      setSelectedMissionId(null);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-1">
          {t.title}
        </h3>
        <p className="text-sm text-[#6B7280]">{t.subtitle}</p>
      </div>

      <div className="grid gap-4">
        {missionsWithEstimations.map((mission) => {
          const estimation = mission.estimationPartenaire!;
          const isSelected = selectedMissionId === mission.id;

          return (
            <div
              key={mission.id}
              className={`border-2 rounded-lg p-4 transition-all ${
                isSelected
                  ? "border-[#D4A657] bg-[#FFF9EC] shadow-md"
                  : "border-[#E2E2E8] bg-white hover:border-[#D4A657]/50 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const prestataire = mission.prestataireId ? prestataires.get(mission.prestataireId) : null;
                      const prestataireName = prestataire 
                        ? (prestataire.nomEntreprise || prestataire.nomContact || prestataire.email)
                        : (mission.prestataireRef || `Mission ${mission.ref}`);
                      
                      return (
                        <>
                          <p className="font-semibold text-[#0A1B2A]">
                            {prestataireName}
                          </p>
                          {mission.prestataireRef && (
                            <span className="text-xs text-[#6B7280] font-mono">
                              ({mission.prestataireRef})
                            </span>
                          )}
                        </>
                      );
                    })()}
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D4A657] text-white text-xs font-semibold rounded-full">
                        <Trophy className="w-3 h-3" />
                        {lang === "fr" ? "Gagnant" : "Winner"}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-[#6B7280] mb-1">{t.prix}</p>
                      <p className="text-sm font-semibold text-[#0A1B2A]">
                        {estimation.prixFournisseur.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280] mb-1">{t.delais}</p>
                      <p className="text-sm font-semibold text-[#0A1B2A]">
                        {estimation.delaisEstimes} {t.heures}
                      </p>
                    </div>
                    {estimation.noteExplication && (
                      <div>
                        <p className="text-xs text-[#6B7280] mb-1">{t.note}</p>
                        <p className="text-xs text-[#0A1B2A] line-clamp-2">
                          {estimation.noteExplication}
                        </p>
                      </div>
                    )}
                  </div>

                  {estimation.fraisExternes && (
                    <div className="mb-2">
                      <p className="text-xs text-[#6B7280]">
                        {lang === "fr" ? "Frais externes" : "External fees"}:{" "}
                        <span className="font-semibold text-[#0A1B2A]">
                          {estimation.fraisExternes.toLocaleString()} FCFA
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Bouton Chat */}
                  {currentUserEmail && (
                    <button
                      onClick={() => setChatMissionId(mission.id)}
                      className="px-3 py-2 rounded-md text-sm font-semibold transition-all bg-[#C8A55F] text-white hover:bg-[#B8944F] flex items-center gap-2"
                      title={lang === "fr" ? "Écrire au prestataire" : "Write to provider"}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {lang === "fr" ? "Chat" : "Chat"}
                    </button>
                  )}
                  
                  {/* Bouton Sélectionner */}
                  <button
                    onClick={() => handleSelectWinner(mission.id)}
                    disabled={submitting || isSelected || devisGenere}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      isSelected
                        ? "bg-[#D4A657] text-white cursor-default"
                        : submitting || devisGenere
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-[#0A1B2A] text-white hover:bg-[#07121e]"
                    }`}
                  >
                    {submitting && selectedMissionId === mission.id ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        {t.selectionEnCours}
                      </span>
                    ) : isSelected ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {lang === "fr" ? "Sélectionné" : "Selected"}
                      </span>
                    ) : (
                      t.selectionner
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat modal pour le prestataire sélectionné */}
      {chatMissionId && currentUserEmail && (() => {
        const missionForChat = missionsWithEstimations.find(m => m.id === chatMissionId);
        if (!missionForChat) return null;
        return (
          <MissionChat
            mission={missionForChat}
            currentUserEmail={currentUserEmail}
            currentUserRole="admin"
            lang={lang}
            initialRecipient="prestataire"
            autoOpen={true}
          />
        );
      })()}
    </div>
  );
}

export default WinnerSelectionView;
