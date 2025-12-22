"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { FileText, CheckCircle2, Clock, XCircle, Bell, Trash2, RotateCcw } from "lucide-react";
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
  },
} as const;

export default function EspacePrestatairePage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [missions, setMissions] = useState<Mission[]>([]);
  const [archivedMissions, setArchivedMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);

  useEffect(() => {
    async function fetchMissions() {
      try {
        // Ajouter un timestamp pour éviter le cache
        const timestamp = Date.now();
        const [resMissions, resArchived] = await Promise.all([
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
        ]);
        
        const dataMissions = await resMissions.json();
        const dataArchived = await resArchived.json();
        
        console.log("🔍 Réponse API missions:", { status: resMissions.status, ok: resMissions.ok, data: dataMissions });
        if (resMissions.ok) {
          setMissions(dataMissions.missions || []);
          console.log(`✅ ${dataMissions.missions?.length || 0} mission(s) chargée(s)`);
        } else {
          console.error("❌ Erreur API:", dataMissions.error);
        }
        
        if (resArchived.ok) {
          setArchivedMissions(dataArchived.missions || []);
          console.log(`✅ ${dataArchived.missions?.length || 0} mission(s) archivée(s) chargée(s)`);
        }
      } catch (err) {
        console.error("❌ Erreur chargement missions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMissions();
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
              <Link
                href="/prestataires/espace/propositions"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A657] text-[#0A1B2A] text-sm font-semibold rounded-md hover:bg-[#B8944F] transition"
              >
                <FileText className="w-4 h-4" />
                {lang === "fr" ? "Soumettre une proposition" : "Submit a proposal"}
              </Link>
            </div>
          </div>
        </div>

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

        {!showTrash && !loading && missions.length === 0 && (
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-12 text-center text-[#4B4F58]">
            {t.noMissions}
          </div>
        )}
      </div>
    </main>
  );
}

function MissionCard({ mission, t, lang }: { mission: Mission; t: any; lang: "fr" | "en" }) {
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

  return (
    <div className={`bg-white border-2 ${statusColor.border} rounded-xl p-5 hover:shadow-md transition ${
      isAdvanceSent 
        ? "relative border-l-4 border-l-green-500 animate-[gentlePulse_3s_ease-in-out_infinite] bg-green-50/30" 
        : ""
    }`}>
      {isAdvanceSent && (
        <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1 bg-green-500 text-white text-[10px] font-semibold rounded-full animate-[gentlePulse_3s_ease-in-out_infinite]">
          <span>💰</span>
          <span>{lang === "fr" ? "Avance reçue" : "Advance received"}</span>
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
              <span className="w-2 h-2 bg-green-500 rounded-full animate-[gentlePulse_3s_ease-in-out_infinite]" title={lang === "fr" ? `Avance de ${avancePercentage}% reçue - Vous pouvez maintenant prendre en charge la mission` : `Advance of ${avancePercentage}% received - You can now take over the mission`} />
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
            href={`/prestataires/espace/mission/${mission.id}`}
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
                    const res = await fetch(`/api/prestataires/espace/missions/${mission.id}/archive`, {
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
                    const res = await fetch(`/api/prestataires/espace/missions/${mission.id}/archive`, {
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
      const res = await fetch(`/api/prestataires/espace/missions/${mission.id}/restore`, {
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
            href={`/prestataires/espace/mission/${mission.id}`}
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
