// app/components/PropositionsList.tsx

"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Star, Clock, DollarSign, MessageSquare, TrendingUp } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type PropositionScore = {
  proposition: {
    id: number;
    ref: string;
    createdAt: string;
    demandeId: number;
    prestataireId: number;
    prix_prestataire: number;
    delai_estime: number;
    commentaire: string;
    difficulte_estimee: number;
    statut: "en_attente" | "acceptee" | "refusee";
  };
  score_prix: number;
  score_reputation: number;
  score_delai: number;
  score_composite: number;
  prestataire: {
    id: number;
    ref: string;
    nomEntreprise: string;
    nomContact: string;
    email: string;
    phone: string;
    ville: string;
    noteMoyenne: number;
    nombreMissions: number;
    tauxReussite: number;
  } | null;
};

const TEXT = {
  fr: {
    title: "Sélection du prestataire",
    propositionsRecues: "Propositions reçues",
    aucuneProposition: "Aucune proposition reçue pour le moment",
    classement: "Classement",
    prestataire: "Prestataire",
    prix: "Prix proposé",
    delai: "Délai estimé",
    difficulte: "Difficulté",
    commentaire: "Commentaire",
    score: "Score",
    scorePrix: "Score prix",
    scoreReputation: "Score réputation",
    scoreDelai: "Score délai",
    scoreComposite: "Score composite",
    choisir: "Choisir ce prestataire",
    choisirConfirmation: "Êtes-vous sûr de vouloir choisir ce prestataire ? Cette action créera une mission et enverra une notification au prestataire.",
    propositionAcceptee: "Proposition acceptée avec succès !",
    erreur: "Erreur lors de l'acceptation de la proposition",
    noteMoyenne: "Note moyenne",
    missions: "Missions",
    tauxReussite: "Taux de réussite",
    ville: "Ville",
    contact: "Contact",
    enAttente: "En attente",
    acceptee: "Acceptée",
    refusee: "Refusée",
  },
  en: {
    title: "Provider selection",
    propositionsRecues: "Received proposals",
    aucuneProposition: "No proposals received yet",
    classement: "Ranking",
    prestataire: "Provider",
    prix: "Proposed price",
    delai: "Estimated delay",
    difficulte: "Difficulty",
    commentaire: "Comment",
    score: "Score",
    scorePrix: "Price score",
    scoreReputation: "Reputation score",
    scoreDelai: "Delay score",
    scoreComposite: "Composite score",
    choisir: "Choose this provider",
    choisirConfirmation: "Are you sure you want to choose this provider? This action will create a mission and send a notification to the provider.",
    propositionAcceptee: "Proposal accepted successfully!",
    erreur: "Error accepting proposal",
    noteMoyenne: "Average rating",
    missions: "Missions",
    tauxReussite: "Success rate",
    ville: "City",
    contact: "Contact",
    enAttente: "Pending",
    acceptee: "Accepted",
    refusee: "Rejected",
  },
} as const;

export function PropositionsList({ demandeId, onPropositionAccepted }: { demandeId: number; onPropositionAccepted?: () => void }) {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [propositions, setPropositions] = useState<PropositionScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPropositions() {
      try {
        const res = await fetch(`/api/admin/demandes/${demandeId}/propositions`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setPropositions(data.propositions || []);
        }
      } catch (err) {
        console.error("Erreur chargement propositions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPropositions();
  }, [demandeId]);

  const handleAccept = async (propositionId: number) => {
    if (!confirm(t.choisirConfirmation)) return;

    setAccepting(propositionId);
    try {
      const res = await fetch(`/api/admin/propositions/${propositionId}/accept`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        alert(t.propositionAcceptee);
        if (onPropositionAccepted) {
          onPropositionAccepted();
        }
        // Recharger les propositions
        const resReload = await fetch(`/api/admin/demandes/${demandeId}/propositions`, {
          cache: "no-store",
        });
        if (resReload.ok) {
          const dataReload = await resReload.json();
          setPropositions(dataReload.propositions || []);
        }
      } else {
        alert(data.error || t.erreur);
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(t.erreur);
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
        <p className="text-sm text-[#6B7280]">{lang === "fr" ? "Chargement..." : "Loading..."}</p>
      </div>
    );
  }

  if (propositions.length === 0) {
    return (
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
        <h3 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">{t.title}</h3>
        <p className="text-sm text-[#6B7280]">{t.aucuneProposition}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
      <h3 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">{t.title}</h3>
      <p className="text-xs text-[#6B7280] mb-6">{t.propositionsRecues} ({propositions.length})</p>

      <div className="space-y-4">
        {propositions.map((item, index) => {
          const { proposition, prestataire, score_composite, score_prix, score_reputation, score_delai } = item;
          const isAccepted = proposition.statut === "acceptee";
          const isRejected = proposition.statut === "refusee";

          return (
            <div
              key={proposition.id}
              className={`border-2 rounded-lg p-5 ${
                index === 0 && !isAccepted && !isRejected
                  ? "border-[#D4A657] bg-[#FFF9EC]"
                  : isAccepted
                  ? "border-green-500 bg-green-50"
                  : isRejected
                  ? "border-red-300 bg-red-50"
                  : "border-[#E2E2E8] bg-white"
              }`}
            >
              {/* En-tête avec classement */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {index === 0 && !isAccepted && !isRejected && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-[#D4A657] text-[#0A1B2A] text-xs font-bold rounded">
                      <TrendingUp className="w-3 h-3" />
                      {t.classement} #1
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#6B7280]">{proposition.ref}</span>
                    {isAccepted && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        {t.acceptee}
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                        {t.refusee}
                      </span>
                    )}
                    {!isAccepted && !isRejected && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                        {t.enAttente}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#0A1B2A]">{score_composite.toFixed(2)}</div>
                  <div className="text-xs text-[#6B7280]">{t.scoreComposite}</div>
                </div>
              </div>

              {/* Informations prestataire */}
              {prestataire && (
                <div className="mb-4 p-3 bg-[#F9F9FB] rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-[#0A1B2A]">{prestataire.nomEntreprise}</h4>
                      <p className="text-xs text-[#6B7280]">{prestataire.nomContact}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-semibold text-[#0A1B2A]">
                        <Star className="w-4 h-4 fill-[#D4A657] text-[#D4A657]" />
                        {prestataire.noteMoyenne > 0 ? prestataire.noteMoyenne.toFixed(1) : "N/A"}
                      </div>
                      <p className="text-xs text-[#6B7280]">{t.noteMoyenne}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-[#6B7280] mt-2 pt-2 border-t border-[#E2E2E8]">
                    <div>
                      <span className="font-medium">{t.missions}:</span> {prestataire.nombreMissions}
                    </div>
                    <div>
                      <span className="font-medium">{t.tauxReussite}:</span> {prestataire.tauxReussite}%
                    </div>
                    <div>
                      <span className="font-medium">{t.ville}:</span> {prestataire.ville}
                    </div>
                  </div>
                </div>
              )}

              {/* Détails de la proposition */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#6B7280]" />
                  <div>
                    <div className="text-xs text-[#6B7280]">{t.prix}</div>
                    <div className="font-semibold text-[#0A1B2A]">{proposition.prix_prestataire.toLocaleString()} FCFA</div>
                    <div className="text-xs text-[#6B7280]">
                      {t.scorePrix}: {score_prix.toFixed(2)}/10
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#6B7280]" />
                  <div>
                    <div className="text-xs text-[#6B7280]">{t.delai}</div>
                    <div className="font-semibold text-[#0A1B2A]">{proposition.delai_estime} jour(s)</div>
                    <div className="text-xs text-[#6B7280]">
                      {t.scoreDelai}: {score_delai.toFixed(2)}/10
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-[#6B7280] mb-1">{t.difficulte}</div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < proposition.difficulte_estimee
                          ? "fill-[#D4A657] text-[#D4A657]"
                          : "fill-[#E2E2E8] text-[#E2E2E8]"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-[#6B7280] ml-2">
                    ({proposition.difficulte_estimee}/5)
                  </span>
                </div>
              </div>

              {proposition.commentaire && (
                <div className="mb-4 p-3 bg-[#F9F9FB] rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-[#6B7280] mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs text-[#6B7280] mb-1">{t.commentaire}</div>
                      <p className="text-sm text-[#0A1B2A]">{proposition.commentaire}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scores détaillés */}
              <div className="mb-4 p-3 bg-[#F9F9FB] rounded-lg">
                <div className="text-xs text-[#6B7280] mb-2">{t.score}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="font-medium text-[#0A1B2A]">{score_prix.toFixed(2)}</div>
                    <div className="text-[#6B7280]">{t.scorePrix}</div>
                  </div>
                  <div>
                    <div className="font-medium text-[#0A1B2A]">{score_reputation.toFixed(2)}</div>
                    <div className="text-[#6B7280]">{t.scoreReputation}</div>
                  </div>
                  <div>
                    <div className="font-medium text-[#0A1B2A]">{score_delai.toFixed(2)}</div>
                    <div className="text-[#6B7280]">{t.scoreDelai}</div>
                  </div>
                </div>
              </div>

              {/* Bouton d'action */}
              {!isAccepted && !isRejected && (
                <button
                  onClick={() => handleAccept(proposition.id)}
                  disabled={accepting === proposition.id}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#D4A657] text-[#0A1B2A] text-sm font-semibold rounded-md hover:bg-[#B8944F] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {accepting === proposition.id ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1B2A] border-t-transparent" />
                      {lang === "fr" ? "Traitement..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {t.choisir}
                    </>
                  )}
                </button>
              )}

              {isAccepted && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-md">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.acceptee}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

