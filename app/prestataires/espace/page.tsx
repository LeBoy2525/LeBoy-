"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { FileText, CheckCircle2, Clock, XCircle, Bell, Trash2, RotateCcw, Plus, DollarSign, Star, AlertCircle, Archive } from "lucide-react";
import Link from "next/link";
import BackToHomeLink from "../../components/BackToHomeLink";
import type { Mission } from "@/lib/types";
import { formatDateWithTimezones } from "@/lib/dateUtils";

const TEXT = {
  fr: {
    title: "Espace prestataire LeBoy",
    subtitle: "Gérez vos missions et suivez vos mandats",
    welcome: "Bienvenue dans votre espace prestataire",
    missionsEnAttente: "Missions en attente d'acceptation",
    missionsEnCours: "Missions en cours",
    missionsTerminees: "Missions terminées",
    corbeille: "Corbeille",
    missionsArchivees: "Missions archivées",
    restaurer: "Restaurer",
    restaurerConfirmation: "Restaurer cette mission ?",
    noMissionsArchivees: "Aucune mission archivée",
    noMissions: "Aucune mission pour le moment",
    voirDetails: "Voir les détails",
    accepter: "Accepter",
    refuser: "Refuser",
    statut: "Statut",
    dateAssignation: "Assigné le",
    archiver: "Archiver",
    supprimer: "Supprimer",
    archiverConfirmation: "Êtes-vous sûr de vouloir archiver cette mission ?",
    supprimerConfirmation: "Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible.",
    missionsNonRetenues: "Missions non retenues",
    missionsNonRetenuesDesc: "Ces missions n'ont pas été sélectionnées par l'administrateur. Un autre prestataire a été choisi pour ces demandes.",
    voirMissionsNonRetenues: "Voir les missions non retenues",
    masquerMissionsNonRetenues: "Masquer les missions non retenues",
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
    title: "LeBoy Provider Space",
    subtitle: "Manage your missions and track your mandates",
    welcome: "Welcome to your provider space",
    missionsEnAttente: "Missions pending acceptance",
    missionsEnCours: "Missions in progress",
    missionsTerminees: "Completed missions",
    corbeille: "Trash",
    missionsArchivees: "Archived missions",
    restaurer: "Restore",
    restaurerConfirmation: "Restore this mission?",
    noMissionsArchivees: "No archived missions",
    noMissions: "No missions at this time",
    voirDetails: "View details",
    accepter: "Accept",
    refuser: "Refuse",
    statut: "Status",
    dateAssignation: "Assigned on",
    archiver: "Archive",
    supprimer: "Delete",
    archiverConfirmation: "Are you sure you want to archive this mission?",
    supprimerConfirmation: "Are you sure you want to delete this mission? This action is irreversible.",
    missionsNonRetenues: "Missions not selected",
    missionsNonRetenuesDesc: "These missions were not selected by the administrator. Another provider was chosen for these requests.",
    voirMissionsNonRetenues: "View non-selected missions",
    masquerMissionsNonRetenues: "Hide non-selected missions",
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
  dateAssignation?: string;
  dateLimite?: string;
};

const URGENCE_COLORS = {
  normal: "bg-blue-100 text-blue-800",
  urgent: "bg-orange-100 text-orange-800",
  "tres-urgent": "bg-red-100 text-red-800",
};

export default function EspacePrestatairePage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [missions, setMissions] = useState<Mission[]>([]);
  const [archivedMissions, setArchivedMissions] = useState<Mission[]>([]);
  const [rejectedMissions, setRejectedMissions] = useState<Mission[]>([]);
  const [demandesDisponibles, setDemandesDisponibles] = useState<DemandeDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<DemandeDisponible | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prix_prestataire, setPrix_prestataire] = useState("");
  const [delai_estime, setDelai_estime] = useState("");
  const [difficulte_estimee, setDifficulte_estimee] = useState<number>(3);
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    async function fetchMissions() {
      try {
        // Ajouter un timestamp pour éviter le cache
        const timestamp = Date.now();
        const [resMissions, resArchived, resDemandes] = await Promise.all([
          fetch(`/api/prestataires/espace/missions?t=${timestamp}`, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
            },
          }),
          fetch(`/api/prestataires/espace/missions/archived?t=${timestamp}`, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
            },
          }),
          fetch(`/api/prestataires/espace/demandes-disponibles?t=${timestamp}`, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
            },
          }),
        ]);
        
        const dataMissions = await resMissions.json();
        const dataArchived = await resArchived.json();
        const dataDemandes = await resDemandes.json();
        
        console.log("🔍 Réponse API missions:", { status: resMissions.status, ok: resMissions.ok, data: dataMissions });
        if (resMissions.ok) {
          setMissions(dataMissions.missions || []);
          setRejectedMissions(dataMissions.rejectedMissions || []);
          console.log(`✅ ${dataMissions.missions?.length || 0} mission(s) chargée(s)`);
          console.log(`📋 ${dataMissions.rejectedMissions?.length || 0} mission(s) non retenue(s)`);
        } else {
          console.error("❌ Erreur API:", dataMissions.error);
        }
        
        if (resArchived.ok) {
          setArchivedMissions(dataArchived.missions || []);
          console.log(`✅ ${dataArchived.missions?.length || 0} mission(s) archivée(s) chargée(s)`);
        }

        if (resDemandes.ok) {
          setDemandesDisponibles(dataDemandes.demandes || []);
          console.log(`✅ ${dataDemandes.demandes?.length || 0} demande(s) disponible(s)`);
        }
      } catch (err) {
        console.error("❌ Erreur chargement missions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMissions();
    
    // Rafraîchir toutes les 5 minutes pour retirer les demandes expirées
    const interval = setInterval(fetchMissions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const missionsEnAttente = missions.filter(
    (m) => m.internalState === "ASSIGNED_TO_PROVIDER" || m.status === "en_evaluation_partenaire"
  );
  const missionsEnCours = missions.filter(
    (m) => {
      const state = m.internalState || "CREATED";
      return state === "PROVIDER_ESTIMATED" ||
             state === "WAITING_CLIENT_PAYMENT" ||
             state === "PAID_WAITING_TAKEOVER" ||
             state === "ADVANCE_SENT" ||
             state === "IN_PROGRESS" ||
             state === "PROVIDER_VALIDATION_SUBMITTED" ||
             m.status === "evaluation_recue_quebec" || 
             m.status === "en_attente_paiement_client" ||
             m.status === "paye_en_attente_demarrage" ||
             m.status === "avance_versee_partenaire" ||
             m.status === "en_cours_partenaire" ||
             m.status === "en_validation_quebec";
    }
  );
  const missionsTerminees = missions.filter(
    (m) => {
      const state = m.internalState || "CREATED";
      return state === "ADMIN_CONFIRMED" ||
             state === "COMPLETED" ||
             m.status === "termine_icd_canada" || 
             m.status === "cloture" || 
             m.status === "annulee";
    }
  );

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
        // Retirer la demande de la liste et recharger
        setDemandesDisponibles(demandesDisponibles.filter((d) => d.id !== selectedDemande.id));
        // Recharger les missions aussi
        const resMissions = await fetch("/api/prestataires/espace/missions", { cache: "no-store" });
        if (resMissions.ok) {
          const dataMissions = await resMissions.json();
          setMissions(dataMissions.missions || []);
        }
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

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <BackToHomeLink />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="space-y-2 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
                {t.title}
              </h1>
              <p className="text-sm md:text-base text-[#4B4F58]">
                {t.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTrash(!showTrash)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition ${
                  showTrash
                    ? "bg-[#D4A657] text-[#0A1B2A] hover:bg-[#B8944F]"
                    : "bg-white border border-[#DDDDDD] text-[#4B4F58] hover:bg-gray-50"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {t.corbeille} {archivedMissions.length > 0 && `(${archivedMissions.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* Demandes disponibles */}
        <section className="mb-8">
          <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
            {t.demandesDisponibles} ({demandesDisponibles.length})
          </h2>
          {demandesDisponibles.length === 0 ? (
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-12 text-center text-[#4B4F58]">
              {t.aucuneDemande}
            </div>
          ) : (
            <div className="space-y-4">
              {demandesDisponibles.map((demande) => (
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
        </section>

        {/* Missions en attente */}
        {missionsEnAttente.length > 0 && (
          <section className="mb-8">
            <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
              {t.missionsEnAttente} ({missionsEnAttente.length})
            </h2>
            <div className="space-y-3">
                        {missionsEnAttente.map((mission) => (
                          <MissionCard key={mission.id} mission={mission} t={t} lang={lang} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Missions en cours */}
                  {missionsEnCours.length > 0 && (
                    <section className="mb-8">
                      <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
                        {t.missionsEnCours} ({missionsEnCours.length})
                      </h2>
                      <div className="space-y-3">
                        {missionsEnCours.map((mission) => (
                          <MissionCard key={mission.id} mission={mission} t={t} lang={lang} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Missions terminées */}
                  {missionsTerminees.length > 0 && (
                    <section>
                      <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
                        {t.missionsTerminees} ({missionsTerminees.length})
                      </h2>
                      <div className="space-y-3">
                        {missionsTerminees.map((mission) => (
                          <MissionCard key={mission.id} mission={mission} t={t} lang={lang} />
                        ))}
            </div>
          </section>
        )}

        {/* Section Corbeille */}
        {showTrash && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A]">
                {t.missionsArchivees} ({archivedMissions.length})
              </h2>
              <button
                onClick={() => setShowTrash(false)}
                className="text-sm text-[#4B4F58] hover:text-[#0A1B2A] transition"
              >
                {lang === "fr" ? "Fermer" : "Close"}
              </button>
            </div>
            {archivedMissions.length > 0 ? (
              <div className="space-y-3">
                {archivedMissions.map((mission) => (
                  <ArchivedMissionCard 
                    key={mission.id} 
                    mission={mission} 
                    t={t} 
                    lang={lang} 
                    onRestore={async () => {
                      // Recharger les missions après restauration
                      try {
                        const [resMissions, resArchived] = await Promise.all([
                          fetch("/api/prestataires/espace/missions", { cache: "no-store" }),
                          fetch("/api/prestataires/espace/missions/archived", { cache: "no-store" }),
                        ]);
                        const dataMissions = await resMissions.json();
                        const dataArchived = await resArchived.json();
                        if (resMissions.ok) setMissions(dataMissions.missions || []);
                        if (resArchived.ok) setArchivedMissions(dataArchived.missions || []);
                      } catch (error) {
                        console.error("Erreur rechargement missions:", error);
                      }
                    }} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#DDDDDD] rounded-xl p-12 text-center text-[#4B4F58]">
                {t.noMissionsArchivees}
              </div>
            )}
          </section>
        )}

        {/* Section Missions non retenues */}
        {rejectedMissions.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-xl font-semibold text-[#0A1B2A] mb-1">
                  {t.missionsNonRetenues}
                </h2>
                <p className="text-sm text-[#6B7280]">
                  {t.missionsNonRetenuesDesc}
                </p>
              </div>
              <button
                onClick={() => setShowRejected(!showRejected)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition ${
                  showRejected
                    ? "bg-[#F59E0B] text-white hover:bg-[#D97706]"
                    : "bg-white border border-[#DDDDDD] text-[#4B4F58] hover:bg-gray-50"
                }`}
              >
                <XCircle className="w-4 h-4" />
                {showRejected ? t.masquerMissionsNonRetenues : t.voirMissionsNonRetenues} ({rejectedMissions.length})
              </button>
            </div>

            {showRejected && (
              <div className="space-y-3">
                {rejectedMissions.map((mission) => (
                  <MissionCard 
                    key={mission.id} 
                    mission={mission} 
                    t={t} 
                    lang={lang} 
                    isRejected={true}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {!showTrash && !loading && missions.length === 0 && rejectedMissions.length === 0 && demandesDisponibles.length === 0 && (
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-12 text-center text-[#4B4F58]">
            {t.noMissions}
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

function MissionCard({ mission, t, lang, isRejected = false }: { mission: Mission; t: any; lang: "fr" | "en"; isRejected?: boolean }) {
  // Si la mission est rejetée, afficher une carte spéciale non cliquable
  if (isRejected) {
    const missionId = (mission as any).dbId || mission.id;
    
    return (
      <div className="bg-white border-2 border-orange-200 rounded-xl p-5 opacity-90 cursor-not-allowed">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-[#6B7280]">{mission.ref}</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                <XCircle className="w-3 h-3" />
                {lang === "fr" ? "Non retenue" : "Not selected"}
              </span>
            </div>
            <h3 className="font-heading font-semibold text-[#0A1B2A] mb-2">
              {mission.titre}
            </h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-orange-800 font-medium mb-1">
                {lang === "fr" ? "ℹ️ Mission assignée à un autre prestataire" : "ℹ️ Mission assigned to another provider"}
              </p>
              <p className="text-xs text-orange-700">
                {lang === "fr" 
                  ? "Cette mission a été attribuée à un autre prestataire selon les critères de qualité, prix et délai. Vous pouvez archiver cette mission pour libérer votre espace."
                  : "This mission was assigned to another provider based on quality, price and deadline criteria. You can archive this mission to free up your space."}
              </p>
            </div>
            {mission.estimationPartenaire && (
              <div className="mt-3 pt-3 border-t border-orange-100">
                <p className="text-xs text-[#6B7280] mb-1">
                  {lang === "fr" ? "Votre estimation" : "Your estimation"}
                </p>
                <p className="text-sm font-semibold text-[#0A1B2A]">
                  {mission.estimationPartenaire.prixFournisseur.toLocaleString()} FCFA
                </p>
                {mission.estimationPartenaire.delaisEstimes && (
                  <p className="text-xs text-[#6B7280] mt-1">
                    {mission.estimationPartenaire.delaisEstimes} {lang === "fr" ? "jours" : "days"}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm(lang === "fr" ? "Archiver cette mission ?" : "Archive this mission?")) {
                  try {
                    const res = await fetch(`/api/prestataires/espace/missions/${missionId}/archive`, {
                      method: "POST",
                    });
                    if (res.ok) {
                      alert(lang === "fr" ? "✅ Mission archivée avec succès" : "✅ Mission archived successfully");
                      window.location.reload();
                    } else {
                      alert(lang === "fr" ? "❌ Erreur lors de l'archivage" : "❌ Error archiving");
                    }
                  } catch (error) {
                    console.error("Erreur archivage:", error);
                    alert(lang === "fr" ? "❌ Erreur lors de l'archivage" : "❌ Error archiving");
                  }
                }
              }}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 text-xs font-semibold rounded-md hover:bg-orange-200 transition"
            >
              <Archive className="w-3 h-3" />
              {lang === "fr" ? "Archiver" : "Archive"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Déterminer le code couleur selon l'état interne
  const getStatusColor = () => {
    const state = mission.internalState || "CREATED";
    
    // Terminé
    if (state === "ADMIN_CONFIRMED" || state === "COMPLETED" || 
        mission.status === "termine_icd_canada" || mission.status === "cloture") {
      return {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-300",
      };
    }
    
    // En cours (en attente paiement, avance envoyée, en cours, validation)
    if (state === "WAITING_CLIENT_PAYMENT" || 
        state === "PAID_WAITING_TAKEOVER" ||
        state === "ADVANCE_SENT" ||
        state === "IN_PROGRESS" ||
        state === "PROVIDER_VALIDATION_SUBMITTED" ||
        mission.status === "en_attente_paiement_client" ||
        mission.status === "paye_en_attente_demarrage" ||
        mission.status === "avance_versee_partenaire" ||
        mission.status === "en_cours_partenaire" ||
        mission.status === "en_validation_quebec") {
      return {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-300",
      };
    }
    
    // En attente (créée, assignée, estimation fournie)
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
    };
  };

  const statusColor = getStatusColor();

  const isAdvanceSent = mission.internalState === "ADVANCE_SENT";
  const avancePercentage = mission.avancePercentage || 50; // Par défaut 50%
  const isFullPayment = avancePercentage === 100;

  return (
    <div className={`bg-white border-2 ${statusColor.border} rounded-xl p-5 hover:shadow-md transition ${
      isAdvanceSent 
        ? `relative border-l-4 ${isFullPayment ? "border-l-emerald-500 bg-emerald-50/30" : "border-l-green-500 bg-green-50/30"} animate-[gentlePulse_3s_ease-in-out_infinite]` 
        : ""
    }`}>
      {isAdvanceSent && (
        <div className={`absolute top-3 right-3 flex items-center gap-2 px-2 py-1 ${isFullPayment ? "bg-emerald-600" : "bg-green-500"} text-white text-[10px] font-semibold rounded-full animate-[gentlePulse_3s_ease-in-out_infinite]`}>
          <span>{isFullPayment ? "💯" : "💰"}</span>
          <span>
            {isFullPayment 
              ? (lang === "fr" ? "Paiement complet" : "Full payment")
              : (lang === "fr" ? `Avance ${avancePercentage}%` : `Advance ${avancePercentage}%`)
            }
          </span>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-[#6B7280]">{mission.ref}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor.bg} ${statusColor.text} font-semibold ${
              isAdvanceSent ? "animate-[gentlePulse_3s_ease-in-out_infinite]" : ""
            }`}>
              {mission.status}
            </span>
            {isAdvanceSent && (
              <span className={`w-2 h-2 ${isFullPayment ? "bg-emerald-500" : "bg-green-500"} rounded-full animate-[gentlePulse_3s_ease-in-out_infinite]`} title={
                isFullPayment
                  ? (lang === "fr" ? "Paiement complet (100%) reçu - Vous pouvez maintenant prendre en charge la mission" : "Full payment (100%) received - You can now take over the mission")
                  : (lang === "fr" ? `Avance de ${avancePercentage}% reçue - Vous pouvez maintenant prendre en charge la mission` : `Advance of ${avancePercentage}% received - You can now take over the mission`)
              } />
            )}
          </div>
          <h3 className="font-heading font-semibold text-[#0A1B2A] mb-1">
            {mission.titre}
          </h3>
          <p className="text-sm text-[#4B4F58] line-clamp-2 mb-2">
            {mission.description}
          </p>
          <div className="flex flex-col gap-2 text-xs text-[#6B7280]">
            <div className="flex items-center gap-4">
              <span>📍 {mission.lieu || "Non spécifié"}</span>
              <span>💰 {mission.tarifPrestataire} FCFA</span>
            </div>
            {mission.dateAssignation && (
              <div className="text-[10px] space-y-0.5 pt-1 border-t border-[#E2E2E8]">
                <div className="font-medium text-[#4B4F58]">
                  {t.dateAssignation || "Assigné le"}:
                </div>
                <div>🇨🇲 {formatDateWithTimezones(mission.dateAssignation).cameroon}</div>
                <div>🇨🇦 {formatDateWithTimezones(mission.dateAssignation).canada}</div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <Link
            href={`/prestataires/espace/mission/${(mission as any).dbId || mission.id}`}
            className="px-4 py-2 text-xs font-semibold text-[#0A1B2A] border border-[#0A1B2A] rounded-md hover:bg-[#0A1B2A] hover:text-white transition"
          >
            {t.voirDetails}
          </Link>
          <div className="flex flex-col gap-2">
            {/* Boutons d'archivage et suppression pour toutes les missions */}
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm(t.archiverConfirmation)) {
                  try {
                    const missionId = (mission as any).dbId || mission.id;
                    const res = await fetch(`/api/prestataires/espace/missions/${missionId}/archive`, {
                      method: "POST",
                    });
                    if (res.ok) {
                      alert(t.archiver ? "✅ Mission archivée avec succès" : "✅ Mission archived successfully");
                      window.location.reload();
                    } else {
                      alert(t.archiver ? "❌ Erreur lors de l'archivage" : "❌ Error archiving");
                    }
                  } catch (error) {
                    console.error("Erreur archivage:", error);
                    alert(t.archiver ? "❌ Erreur lors de l'archivage" : "❌ Error archiving");
                  }
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition"
            >
              {t.archiver}
            </button>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm(t.supprimerConfirmation)) {
                  try {
                    const missionId = (mission as any).dbId || mission.id;
                    const res = await fetch(`/api/prestataires/espace/missions/${missionId}/archive`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      alert(t.supprimer ? "✅ Mission supprimée avec succès" : "✅ Mission deleted successfully");
                      window.location.reload();
                    } else {
                      alert(t.supprimer ? "❌ Erreur lors de la suppression" : "❌ Error deleting");
                    }
                  } catch (error) {
                    console.error("Erreur suppression:", error);
                    alert(t.supprimer ? "❌ Erreur lors de la suppression" : "❌ Error deleting");
                  }
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition"
            >
              {t.supprimer}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchivedMissionCard({ mission, t, lang, onRestore }: { mission: Mission; t: any; lang: "fr" | "en"; onRestore: () => void }) {
  const getDaysSinceArchived = () => {
    if (!mission.archivedAt) return 0;
    const archivedDate = new Date(mission.archivedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  const daysSinceArchived = getDaysSinceArchived();
  const daysRemaining = 30 - daysSinceArchived;

  const handleRestore = async () => {
    if (!confirm(t.restaurerConfirmation)) return;
    
    try {
      const missionId = (mission as any).dbId || mission.id;
      const res = await fetch(`/api/prestataires/espace/missions/${missionId}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert(lang === "fr" ? "✅ Mission restaurée avec succès" : "✅ Mission restored successfully");
        onRestore();
        window.location.reload();
      } else {
        alert(data.error || (lang === "fr" ? "❌ Erreur lors de la restauration" : "❌ Error restoring"));
      }
    } catch (error) {
      console.error("Erreur restauration:", error);
      alert(lang === "fr" ? "❌ Erreur lors de la restauration" : "❌ Error restoring");
    }
  };

  return (
    <div className="bg-white border-2 border-gray-300 rounded-xl p-5 opacity-75">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-[#6B7280]">{mission.ref}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 font-semibold">
              {mission.status}
            </span>
            <span className="text-xs text-gray-500">
              {lang === "fr" ? `Archivée il y a ${daysSinceArchived} jour(s)` : `Archived ${daysSinceArchived} day(s) ago`}
            </span>
          </div>
          <h3 className="font-heading font-semibold text-[#0A1B2A] mb-1">
            {mission.titre}
          </h3>
          <p className="text-sm text-[#4B4F58] line-clamp-2 mb-2">
            {mission.description}
          </p>
          <div className="text-xs text-[#6B7280]">
            {daysRemaining > 0 ? (
              <span className="text-amber-600 font-semibold">
                {lang === "fr" 
                  ? `⏳ ${daysRemaining} jour(s) restant(s) avant suppression définitive`
                  : `⏳ ${daysRemaining} day(s) remaining before permanent deletion`}
              </span>
            ) : (
              <span className="text-red-600 font-semibold">
                {lang === "fr" ? "⚠️ Cette mission ne peut plus être restaurée" : "⚠️ This mission can no longer be restored"}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <Link
            href={`/prestataires/espace/mission/${(mission as any).dbId || mission.id}`}
            className="px-4 py-2 text-xs font-semibold text-[#0A1B2A] border border-[#0A1B2A] rounded-md hover:bg-[#0A1B2A] hover:text-white transition"
          >
            {t.voirDetails}
          </Link>
          {daysRemaining > 0 && (
            <button
              onClick={handleRestore}
              className="px-4 py-2 text-xs font-semibold text-green-600 border border-green-300 rounded-md hover:bg-green-50 transition flex items-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              {t.restaurer}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
