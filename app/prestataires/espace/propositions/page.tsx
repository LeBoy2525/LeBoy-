// app/prestataires/espace/propositions/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../../components/LanguageProvider";
import { FileText, Plus, CheckCircle2, Clock, DollarSign, MessageSquare, Star, AlertCircle } from "lucide-react";
import Link from "next/link";
import BackToHomeLink from "../../../components/BackToHomeLink";
import { formatDateWithTimezones } from "@/lib/dateUtils";

const TEXT = {
  fr: {
    title: "Soumettre une proposition",
    subtitle: "Consultez les demandes disponibles et soumettez vos propositions",
    demandesDisponibles: "Demandes disponibles",
    aucuneDemande: "Aucune demande disponible pour le moment",
    soumettreProposition: "Soumettre une proposition",
    montantPropose: "Montant proposé (FCFA) *",
    delaiEstime: "Délai estimé (jours) *",
    difficulteEstimee: "Niveau de difficulté estimé *",
    commentaire: "Note explicative *",
    commentairePlaceholder: "Expliquez votre approche, les étapes prévues, les risques identifiés...",
    soumettre: "Soumettre la proposition",
    soumettant: "Envoi en cours...",
    propositionSoumise: "Proposition soumise avec succès !",
    erreur: "Erreur lors de la soumission",
    fermer: "Fermer",
    voirDetails: "Voir les détails",
    service: "Service",
    lieu: "Lieu",
    urgence: "Urgence",
    budget: "Budget",
    dateReception: "Date de réception",
    delaiRestant: "Délai restant",
    delaiExpire: "Délai expiré",
    normal: "Normal",
    urgent: "Urgent",
    tresUrgent: "Très urgent",
  },
  en: {
    title: "Submit a proposal",
    subtitle: "Browse available requests and submit your proposals",
    demandesDisponibles: "Available requests",
    aucuneDemande: "No requests available at this time",
    soumettreProposition: "Submit a proposal",
    montantPropose: "Proposed amount (FCFA) *",
    delaiEstime: "Estimated delay (days) *",
    difficulteEstimee: "Estimated difficulty level *",
    commentaire: "Explanatory note *",
    commentairePlaceholder: "Explain your approach, planned steps, identified risks...",
    soumettre: "Submit proposal",
    soumettant: "Submitting...",
    propositionSoumise: "Proposal submitted successfully!",
    erreur: "Error submitting",
    fermer: "Close",
    voirDetails: "View details",
    service: "Service",
    lieu: "Location",
    urgence: "Urgency",
    budget: "Budget",
    dateReception: "Reception date",
    delaiRestant: "Time remaining",
    delaiExpire: "Deadline expired",
    normal: "Normal",
    urgent: "Urgent",
    tresUrgent: "Very urgent",
  },
} as const;

const URGENCE_COLORS = {
  normal: "bg-blue-100 text-blue-800",
  urgent: "bg-orange-100 text-orange-800",
  "tres-urgent": "bg-red-100 text-red-800",
};

type DemandeDisponible = {
  id: number;
  ref: string;
  createdAt: string;
  serviceType: string;
  serviceSubcategory?: string;
  description: string;
  lieu?: string | null;
  urgence: string;
  budget?: string | null;
  missionId?: number;
  dateLimiteProposition?: string;
  dateAssignation?: string;
};

export default function PropositionsPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [demandes, setDemandes] = useState<DemandeDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState<DemandeDisponible | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [prix_prestataire, setPrix_prestataire] = useState("");
  const [delai_estime, setDelai_estime] = useState("");
  const [difficulte_estimee, setDifficulte_estimee] = useState<number>(3);
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    async function fetchDemandes() {
      try {
        const res = await fetch("/api/prestataires/espace/demandes-disponibles", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setDemandes(data.demandes || []);
        }
      } catch (err) {
        console.error("Erreur chargement demandes:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDemandes();
    
    // Rafraîchir toutes les 5 minutes pour retirer les demandes expirées
    const interval = setInterval(fetchDemandes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fonction pour calculer le temps restant
  const getTempsRestant = (dateLimite?: string): { heures: number; minutes: number; expire: boolean } | null => {
    if (!dateLimite) return null;
    const maintenant = new Date();
    const limite = new Date(dateLimite);
    const diff = limite.getTime() - maintenant.getTime();
    
    if (diff <= 0) {
      return { heures: 0, minutes: 0, expire: true };
    }
    
    const heures = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { heures, minutes, expire: false };
  };

  const handleOpenModal = (demande: DemandeDisponible) => {
    setSelectedDemande(demande);
    setPrix_prestataire("");
    setDelai_estime("");
    setDifficulte_estimee(3);
    setCommentaire("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemande) return;

    if (!prix_prestataire || !delai_estime || !commentaire) {
      alert(lang === "fr" ? "Veuillez remplir tous les champs requis." : "Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/prestataires/espace/propositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandeId: selectedDemande.id,
          prix_prestataire: parseFloat(prix_prestataire),
          delai_estime: parseInt(delai_estime),
          difficulte_estimee,
          commentaire: commentaire.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(t.propositionSoumise);
        setShowModal(false);
        // Retirer la demande de la liste
        setDemandes(demandes.filter((d) => d.id !== selectedDemande.id));
      } else {
        alert(data.error || t.erreur);
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(t.erreur);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="bg-[#F2F2F5] min-h-screen">
        <BackToHomeLink backTo="prestataire" />
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
          <p className="text-sm text-[#6B7280]">{lang === "fr" ? "Chargement..." : "Loading..."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <BackToHomeLink />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="space-y-2 mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
            {t.title}
          </h1>
          <p className="text-sm md:text-base text-[#4B4F58]">{t.subtitle}</p>
        </div>

        {demandes.length === 0 ? (
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-12 text-center text-[#4B4F58]">
            {t.aucuneDemande}
          </div>
        ) : (
          <div className="space-y-4">
            {demandes.map((demande) => (
              <div
                key={demande.id}
                className="bg-white border border-[#DDDDDD] rounded-xl p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-[#6B7280]">{demande.ref}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          URGENCE_COLORS[demande.urgence as keyof typeof URGENCE_COLORS] ||
                          URGENCE_COLORS.normal
                        }`}
                      >
                        {t[demande.urgence as keyof typeof t] || demande.urgence}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-[#0A1B2A] mb-2">
                      {demande.serviceType}
                      {demande.serviceSubcategory && (
                        <span className="text-xs text-[#6B7280] ml-2">
                          ({demande.serviceSubcategory})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-[#4B4F58] mb-4 line-clamp-2">{demande.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-[#6B7280]">
                      {demande.lieu && (
                        <div>
                          <span className="font-medium">{t.lieu}:</span> {demande.lieu}
                        </div>
                      )}
                      {demande.budget && (
                        <div>
                          <span className="font-medium">{t.budget}:</span> {demande.budget} FCFA
                        </div>
                      )}
                      <div>
                        <span className="font-medium">{t.dateReception}:</span>{" "}
                        {formatDateWithTimezones(demande.createdAt).cameroon}
                      </div>
                      {demande.dateLimiteProposition && (() => {
                        const tempsRestant = getTempsRestant(demande.dateLimiteProposition);
                        if (tempsRestant) {
                          if (tempsRestant.expire) {
                            return (
                              <div className="flex items-center gap-1 text-red-600 font-semibold">
                                <AlertCircle className="w-3 h-3" />
                                {t.delaiExpire}
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center gap-1 text-[#D4A657] font-semibold">
                              <Clock className="w-3 h-3" />
                              {t.delaiRestant}: {tempsRestant.heures}h {tempsRestant.minutes}min
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenModal(demande)}
                    className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-[#D4A657] text-[#0A1B2A] text-sm font-semibold rounded-md hover:bg-[#B8944F] transition"
                  >
                    <Plus className="w-4 h-4" />
                    {t.soumettreProposition}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de soumission */}
        {showModal && selectedDemande && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#E2E2E8]">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-semibold text-[#0A1B2A]">
                    {t.soumettreProposition}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-[#6B7280] hover:text-[#0A1B2A] text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#6B7280]">{selectedDemande.ref}</p>
                  {selectedDemande.dateLimiteProposition && (() => {
                    const tempsRestant = getTempsRestant(selectedDemande.dateLimiteProposition);
                    if (tempsRestant) {
                      if (tempsRestant.expire) {
                        return (
                          <div className="flex items-center gap-2 text-red-600 text-xs font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            {t.delaiExpire}
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2 text-[#D4A657] text-xs font-semibold">
                          <Clock className="w-4 h-4" />
                          {t.delaiRestant}: {tempsRestant.heures}h {tempsRestant.minutes}min
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0A1B2A] mb-1">
                    {t.montantPropose}
                  </label>
                  <input
                    type="number"
                    value={prix_prestataire}
                    onChange={(e) => setPrix_prestataire(e.target.value)}
                    required
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-[#DDDDDD] rounded-md text-sm focus:outline-none focus:border-[#0A1B2A]"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0A1B2A] mb-1">
                    {t.delaiEstime}
                  </label>
                  <input
                    type="number"
                    value={delai_estime}
                    onChange={(e) => setDelai_estime(e.target.value)}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-[#DDDDDD] rounded-md text-sm focus:outline-none focus:border-[#0A1B2A]"
                    placeholder="7"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0A1B2A] mb-1">
                    {t.difficulteEstimee}
                  </label>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDifficulte_estimee(i + 1)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
                          i < difficulte_estimee
                            ? "bg-[#D4A657] text-[#0A1B2A]"
                            : "bg-[#F9F9FB] text-[#6B7280] border border-[#DDDDDD]"
                        }`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            i < difficulte_estimee ? "fill-current" : ""
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-[#6B7280] ml-2">
                      ({difficulte_estimee}/5)
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0A1B2A] mb-1">
                    {t.commentaire}
                  </label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    required
                    rows={5}
                    className="w-full px-3 py-2 border border-[#DDDDDD] rounded-md text-sm focus:outline-none focus:border-[#0A1B2A] resize-y"
                    placeholder={t.commentairePlaceholder}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-[#DDDDDD] text-[#4B4F58] text-sm font-semibold rounded-md hover:bg-[#F9F9FB] transition"
                  >
                    {t.fermer}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-[#D4A657] text-[#0A1B2A] text-sm font-semibold rounded-md hover:bg-[#B8944F] transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? t.soumettant : t.soumettre}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

