"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../components/LanguageProvider";
import BackToHomeLink from "../components/BackToHomeLink";
import { MissionProgressBar } from "../components/MissionProgressBar";
import { mapStatusToClient } from "@/lib/types";
import { formatDateWithTimezones } from "@/lib/dateUtils";

type DemandeICD = {
  id: number;
  ref: string;
  createdAt: string;
  serviceType: string;
  serviceSubcategory?: string;
  description: string;
  lieu?: string | null;
  urgence: string;
};

type ServiceCategory = {
  id: string;
  nameFr: string;
  nameEn: string;
  subcategories: Array<{
    id: string;
    nameFr: string;
    nameEn: string;
  }>;
};

type UserInfo = {
  email: string;
} | null;

const TEXT = {
  fr: {
    tag: "Espace client",
    title: "Suivi de vos demandes LeBoy",
    subtitle:
      "Cet espace vous permet de retrouver les demandes soumises avec votre adresse courriel, de consulter les informations principales et de suivre l'évolution au fur et à mesure.",
    profileTitle: "Profil connecté",
    loading: "Chargement…",
    profileNote:
      "Les demandes associées à cet email apparaîtront ci-dessous.",
    noSession: "Aucune session active. Merci de vous reconnecter si nécessaire.",
    newRequestTitle: "Soumettre une nouvelle demande",
    newRequestText:
      "Si vous avez un nouveau dossier (administratif, foncier, fiscal, projet…), vous pouvez le décrire via le formulaire dédié. Il sera ensuite analysé et orienté.",
    newRequestButton: "Soumettre une demande",
    reminderTitle: "Rappel important",
    reminderText:
      "Les informations affichées ici sont basées sur les demandes envoyées avec l'adresse courriel utilisée pour vous connecter. Si vous utilisez plusieurs adresses, veillez à les préciser clairement dans vos échanges.",
    recentRequestsTitle: "Vos demandes récentes",
    loadingRequests: "Chargement de vos demandes…",
    errorLoading: "Impossible de charger vos demandes pour l'instant.",
    noRequests:
      "Aucune demande trouvée pour le moment avec cet email. Vous pouvez utiliser le formulaire ci-dessus pour soumettre une première demande.",
    tableRefDate: "Référence & date",
    tableResume: "Résumé",
    tableService: "Service / lieu",
    tableDossier: "Dossier",
    viewDossier: "Voir le dossier",
    lieuLabel: "Lieu :",
    archiver: "Archiver",
    supprimer: "Supprimer",
    archiverConfirmation: "Êtes-vous sûr de vouloir archiver cette mission ?",
    supprimerConfirmation: "Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible.",
  },
  en: {
    tag: "Client space",
    title: "Follow-up of your LeBoy requests",
    subtitle:
      "This space allows you to find requests submitted with your email address, view key information and follow the evolution as it happens.",
    profileTitle: "Connected profile",
    loading: "Loading…",
    profileNote:
      "Requests associated with this email will appear below.",
    noSession: "No active session. Please reconnect if necessary.",
    newRequestTitle: "Submit a new request",
    newRequestText:
      "If you have a new file (administrative, land, tax, project…), you can describe it via the dedicated form. It will then be analyzed and directed.",
    newRequestButton: "Submit a request",
    reminderTitle: "Important reminder",
    reminderText:
      "The information displayed here is based on requests sent with the email address used to log in. If you use multiple addresses, please specify them clearly in your exchanges.",
    recentRequestsTitle: "Your recent requests",
    loadingRequests: "Loading your requests…",
    errorLoading: "Unable to load your requests at this time.",
    noRequests:
      "No requests found at this time with this email. You can use the form above to submit a first request.",
    tableRefDate: "Reference & date",
    tableResume: "Summary",
    tableService: "Service / location",
    tableDossier: "File",
    viewDossier: "View file",
    lieuLabel: "Location:",
    archiver: "Archive",
    supprimer: "Delete",
    archiverConfirmation: "Are you sure you want to archive this mission?",
    supprimerConfirmation: "Are you sure you want to delete this mission? This action is irreversible.",
  },
} as const;

export default function EspaceClientPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [user, setUser] = useState<UserInfo>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [recentDemandes, setRecentDemandes] = useState<DemandeICD[]>([]);
  const [loadingDemandes, setLoadingDemandes] = useState(true);
  const [errorDemandes, setErrorDemandes] = useState<string | null>(null);

  const [missions, setMissions] = useState<any[]>([]);
  const [loadingMissions, setLoadingMissions] = useState(true);

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    // Charger les catégories de services
    async function fetchServiceCategories() {
      try {
        const res = await fetch("/api/service-categories", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setServiceCategories(data.categories || []);
        }
      } catch (e) {
        console.error("Erreur lors du chargement des catégories:", e);
      }
    }

    fetchServiceCategories();
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data.user ?? null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }

    async function fetchDemandes() {
      try {
        const res = await fetch("/api/espace-client/demandes", {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(
            lang === "fr"
              ? "Erreur lors du chargement des demandes"
              : "Error loading requests"
          );
        }
        const data = await res.json();
        setRecentDemandes(data.demandes ?? []);
      } catch (e) {
        console.error(e);
        setErrorDemandes(t.errorLoading);
      } finally {
        setLoadingDemandes(false);
      }
    }

    async function fetchMissions() {
      try {
        const res = await fetch("/api/espace-client/missions", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setMissions(data.missions || []);
        }
      } catch (e) {
        console.error("Erreur chargement missions:", e);
      } finally {
        setLoadingMissions(false);
      }
    }

    fetchUser();
    fetchDemandes();
    fetchMissions();
  }, [lang, t.errorLoading]);

  const isLoading = loadingUser || loadingDemandes || loadingMissions;

  // Fonction pour obtenir le nom d'un service à partir de son ID
  const getServiceName = (serviceTypeId: string): string => {
    if (!serviceTypeId) return serviceTypeId || "";
    const category = serviceCategories.find((cat) => cat.id === serviceTypeId);
    if (category) {
      return lang === "fr" ? category.nameFr : category.nameEn;
    }
    // Fallback: retourner l'ID si la catégorie n'est pas trouvée
    return serviceTypeId;
  };

  // Fonction pour obtenir le nom d'un sous-service à partir de son ID
  const getSubserviceName = (serviceTypeId: string, subserviceId?: string): string | null => {
    if (!subserviceId || !serviceTypeId) return null;
    const category = serviceCategories.find((cat) => cat.id === serviceTypeId);
    if (category) {
      const subcategory = category.subcategories.find((sub) => sub.id === subserviceId);
      if (subcategory) {
        return lang === "fr" ? subcategory.nameFr : subcategory.nameEn;
      }
    }
    return null;
  };

  // Format de date selon la langue
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (lang === "fr") {
      return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };


  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    if (lang === "fr") {
      return date.toLocaleDateString("fr-FR");
    } else {
      return date.toLocaleDateString("en-US");
    }
  };

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <BackToHomeLink />
      {/* EN-TÊTE ESPACE CLIENT */}
      <section className="bg-white border-b border-[#DDDDDD]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A55F]">
              {t.tag}
            </p>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
              {t.title}
            </h1>
            <p
              className="text-xs md:text-sm text-[#4B4F58] max-w-2xl"
              style={{ textAlign: "justify" }}
            >
              {t.subtitle}
            </p>
          </div>

          <div className="bg-[#0A1B2A] text-white rounded-xl px-4 py-3 text-xs md:text-sm space-y-1 max-w-xs">
            <p className="font-heading font-semibold text-[13px] md:text-sm">
              {t.profileTitle}
            </p>
            {loadingUser ? (
              <p className="text-[#E5E5E5]">{t.loading}</p>
            ) : user ? (
              <>
                <p className="text-[#E5E5E5] break-words">{user.email}</p>
                <p className="text-[11px] text-[#C8A55F]">{t.profileNote}</p>
              </>
            ) : (
              <p className="text-[#E5E5E5]">{t.noSession}</p>
            )}
          </div>
        </div>
      </section>

      {/* CONTENU PRINCIPAL */}
      <section className="bg-[#F2F2F5]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
          {/* ALERTE POUR ACTIONS REQUISES */}
          {missions.length > 0 && (() => {
            const missionsEnAttentePaiement = missions.filter(
              (m) => m.internalState === "WAITING_CLIENT_PAYMENT" && !m.deleted && !m.archived
            );
            
            if (missionsEnAttentePaiement.length > 0) {
              return (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 md:p-6 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white font-bold text-lg">!</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-lg font-bold text-amber-900 mb-2">
                        {lang === "fr" 
                          ? `⚠️ Action requise : ${missionsEnAttentePaiement.length} mission${missionsEnAttentePaiement.length > 1 ? "s" : ""} en attente de paiement`
                          : `⚠️ Action required: ${missionsEnAttentePaiement.length} mission${missionsEnAttentePaiement.length > 1 ? "s" : ""} awaiting payment`}
                      </h3>
                      <p className="text-sm text-amber-800 mb-3">
                        {lang === "fr"
                          ? "Votre devis est prêt. Veuillez consulter les détails de la mission et procéder au paiement pour démarrer l'exécution."
                          : "Your quote is ready. Please review the mission details and proceed with payment to start execution."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {missionsEnAttentePaiement.map((mission) => (
                          <Link
                            key={mission.id}
                            href={`/espace-client/mission/${mission.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-md hover:bg-amber-700 transition shadow-sm"
                          >
                            <span>{lang === "fr" ? "Payer" : "Pay"}</span>
                            <span className="font-mono text-xs">{mission.ref}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* BLOC ACTIONS RAPIDES */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-4 md:p-5 space-y-2 text-xs md:text-sm text-[#4B4F58]">
              <p className="font-heading text-sm md:text-base text-[#0A1B2A] font-semibold">
                {t.newRequestTitle}
              </p>
              <p style={{ textAlign: "justify" }}>{t.newRequestText}</p>
              <div className="pt-2">
                <Link
                  href="/demandes"
                  className="inline-flex items-center justify-center rounded-md bg-[#0A1B2A] text-white px-4 py-2 text-xs md:text-sm font-semibold hover:bg-[#07121e] transition"
                >
                  {t.newRequestButton}
                </Link>
              </div>
            </div>

            <div className="bg-white border border-[#DDDDDD] rounded-xl p-4 md:p-5 space-y-2 text-xs md:text-sm text-[#4B4F58]">
              <p className="font-heading text-sm md:text-base text-[#0A1B2A] font-semibold">
                {t.reminderTitle}
              </p>
              <p style={{ textAlign: "justify" }}>{t.reminderText}</p>
            </div>
          </div>

          {/* MESSIONS EN COURS */}
          {missions.length > 0 && (() => {
            const missionsEnCours = missions.filter((m) => {
              // Exclure les missions terminées (COMPLETED), archivées et annulées
              // Les missions COMPLETED sont automatiquement archivées et ne doivent plus apparaître ici
              return m.internalState !== "COMPLETED" && 
                     !m.archived &&
                     m.status !== "termine_icd_canada" && 
                     m.status !== "cloture" && 
                     m.status !== "annulee" &&
                     !m.deleted;
            });
            
            const missionsTerminees = missions.filter((m) => {
              // Inclure les missions terminées (COMPLETED) ou archivées, mais pas supprimées ni annulées
              return (m.internalState === "COMPLETED" ||
                      m.archived ||
                      m.status === "termine_icd_canada" || 
                      m.status === "cloture") &&
                     m.status !== "annulee" &&
                     !m.deleted;
            });

            return (
              <>
                {missionsEnCours.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
                        {lang === "fr" ? "Vos missions en cours" : "Your ongoing missions"}
                      </h2>
                    </div>

                    <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
                      <div className="divide-y divide-[#EEEEEE]">
                        {missionsEnCours.map((mission) => {
                          const isWaitingPayment = mission.internalState === "WAITING_CLIENT_PAYMENT";
                          return (
                            <div
                              key={mission.id}
                              className={`block px-4 py-3 hover:bg-[#F9FAFB] transition ${
                                isWaitingPayment 
                                  ? "relative border-l-4 border-l-[#C8A55F] animate-[gentlePulse_3s_ease-in-out_infinite] bg-[#FFF9EC]/30" 
                                  : ""
                              }`}
                            >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Link
                                  href={`/espace-client/mission/${mission.id}`}
                                  className="flex-1"
                                >
                                  <p className="font-semibold text-[#0A1B2A]">
                                    {mission.ref} - {mission.titre}
                                  </p>
                                  <p className="text-xs text-[#6B7280] mt-1">
                                    {mission.prestataireRef || "En attente d'assignation"}
                                  </p>
                                </Link>
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const state = mission.internalState || "CREATED";
                                    let clientStatus = mapStatusToClient(mission.status);
                                    if (state === "ADMIN_CONFIRMED" || state === "COMPLETED") {
                                      clientStatus = "termine";
                                    }
                                    const labels: Record<string, Record<string, string>> = {
                                      fr: {
                                        en_analyse: "En analyse",
                                        en_evaluation: "En évaluation",
                                        en_attente_paiement: "En attente de paiement",
                                        en_cours: "En cours",
                                        termine: "Terminé",
                                        annulee: "Annulée",
                                      },
                                      en: {
                                        en_analyse: "Under review",
                                        en_evaluation: "Under evaluation",
                                        en_attente_paiement: "Awaiting payment",
                                        en_cours: "In progress",
                                        termine: "Completed",
                                        annulee: "Cancelled",
                                      },
                                    };
                                    
                                    // Code couleur selon le statut
                                    let colorClass = "bg-blue-100 text-blue-800";
                                    if (state === "ADMIN_CONFIRMED" || state === "COMPLETED") {
                                      colorClass = "bg-green-100 text-green-800";
                                    } else if (state === "CREATED" || state === "ASSIGNED_TO_PROVIDER" || state === "PROVIDER_ESTIMATED") {
                                      colorClass = "bg-yellow-100 text-yellow-800";
                                    } else if (state === "WAITING_CLIENT_PAYMENT") {
                                      colorClass = "bg-amber-100 text-amber-800";
                                    }
                                    
                                    const isWaitingPayment = state === "WAITING_CLIENT_PAYMENT";
                                    
                                    return (
                                      <span className={`text-xs px-2 py-1 rounded-full ${colorClass} font-semibold ${
                                        isWaitingPayment ? "animate-[gentlePulse_3s_ease-in-out_infinite]" : ""
                                      }`}>
                                        {labels[lang][clientStatus] || clientStatus}
                                      </span>
                                    );
                                  })()}
                                  {mission.internalState === "WAITING_CLIENT_PAYMENT" && (
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-[gentlePulse_3s_ease-in-out_infinite]" title={lang === "fr" ? "Action requise : Paiement en attente" : "Action required: Payment pending"} />
                                  )}
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (confirm(t.archiverConfirmation)) {
                                        try {
                                          const res = await fetch(`/api/espace-client/missions/${mission.id}/archive`, {
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
                                    className="text-xs px-2 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition"
                                  >
                                    {t.archiver}
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (confirm(t.supprimerConfirmation)) {
                                        try {
                                          const res = await fetch(`/api/espace-client/missions/${mission.id}/archive`, {
                                            method: "DELETE",
                                          });
                                          const data = await res.json();
                                          if (res.ok) {
                                            alert(lang === "fr" ? "✅ Mission supprimée et mise dans la corbeille avec succès" : "✅ Mission deleted and moved to trash successfully");
                                            window.location.reload();
                                          } else {
                                            alert(data.error || (lang === "fr" ? "❌ Erreur lors de la suppression" : "❌ Error deleting"));
                                          }
                                        } catch (error) {
                                          console.error("Erreur suppression:", error);
                                          alert(lang === "fr" ? "❌ Erreur lors de la suppression" : "❌ Error deleting");
                                        }
                                      }
                                    }}
                                    className="text-xs px-2 py-1 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition"
                                  >
                                    {t.supprimer}
                                  </button>
                                </div>
                              </div>
                              <MissionProgressBar mission={mission} lang={lang} compact={true} />
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* MESSIONS TERMINÉES */}
                {missionsTerminees.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
                        {lang === "fr" ? "Vos missions terminées" : "Your completed missions"}
                      </h2>
                    </div>

                    <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
                      <div className="divide-y divide-[#EEEEEE]">
                        {missionsTerminees.map((mission) => (
                          <div
                            key={mission.id}
                            className="block px-4 py-3 hover:bg-[#F9FAFB] transition"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Link
                                  href={`/espace-client/mission/${mission.id}`}
                                  className="flex-1"
                                >
                                  <p className="font-semibold text-[#0A1B2A]">
                                    {mission.ref} - {mission.titre}
                                  </p>
                                  <p className="text-xs text-[#6B7280] mt-1">
                                    {mission.prestataireRef || "Prestataire"}
                                  </p>
                                </Link>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                                    {lang === "fr" ? "Terminé" : "Completed"}
                                  </span>
                                  <button
                                    onClick={async () => {
                                      if (confirm(t.archiverConfirmation)) {
                                        try {
                                          const res = await fetch(`/api/espace-client/missions/${mission.id}/archive`, {
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
                                    className="text-xs px-2 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition"
                                  >
                                    {t.archiver}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(t.supprimerConfirmation)) {
                                        try {
                                          const res = await fetch(`/api/espace-client/missions/${mission.id}/archive`, {
                                            method: "DELETE",
                                          });
                                          const data = await res.json();
                                          if (res.ok) {
                                            alert(lang === "fr" ? "✅ Mission supprimée et mise dans la corbeille avec succès" : "✅ Mission deleted and moved to trash successfully");
                                            window.location.reload();
                                          } else {
                                            alert(data.error || (lang === "fr" ? "❌ Erreur lors de la suppression" : "❌ Error deleting"));
                                          }
                                        } catch (error) {
                                          console.error("Erreur suppression:", error);
                                          alert(lang === "fr" ? "❌ Erreur lors de la suppression" : "❌ Error deleting");
                                        }
                                      }
                                    }}
                                    className="text-xs px-2 py-1 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition"
                                  >
                                    {t.supprimer}
                                  </button>
                                </div>
                              </div>
                              <MissionProgressBar mission={mission} lang={lang} compact={true} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* LISTE DES DEMANDES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
                {t.recentRequestsTitle}
              </h2>
            </div>

            {isLoading && (
              <p className="text-xs md:text-sm text-[#4B4F58]">
                {t.loadingRequests}
              </p>
            )}

            {!isLoading && errorDemandes && (
              <p className="text-xs md:text-sm text-red-700">{errorDemandes}</p>
            )}

            {!isLoading && !errorDemandes && recentDemandes.length === 0 && (
              <p className="text-xs md:text-sm text-[#4B4F58]">
                {t.noRequests}
              </p>
            )}

            {!isLoading && recentDemandes.length > 0 && (
              <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[1.1fr,1.4fr,1.2fr,0.9fr] gap-3 px-4 py-2 text-[11px] font-semibold text-[#0A1B2A] bg-[#F9F9FB] border-b border-[#E5E5E5]">
                  <span>{t.tableRefDate}</span>
                  <span>{t.tableResume}</span>
                  <span>{t.tableService}</span>
                  <span className="text-right">{t.tableDossier}</span>
                </div>

                <div className="divide-y divide-[#EEEEEE]">
                  {recentDemandes.map((demande) => (
                    <article
                      key={demande.id}
                      className="px-4 py-3 text-xs md:text-sm hover:bg-[#F9FAFB] transition"
                    >
                      <div className="hidden md:grid md:grid-cols-[1.1fr,1.4fr,1.2fr,0.9fr] md:gap-3 md:items-center">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-[#0A1B2A]">
                            {demande.ref}
                          </p>
                          <p className="text-[11px] text-[#6B7280]">
                            {formatDate(demande.createdAt)}
                          </p>
                        </div>

                        <p className="text-[#4B4F58] line-clamp-2">
                          {demande.description}
                        </p>

                        <div className="space-y-0.5">
                          <p className="font-medium text-[#0A1B2A]">
                            {getServiceName(demande.serviceType)}
                          </p>
                          {demande.serviceSubcategory && (
                            <p className="text-[11px] text-[#6B7280]">
                              {getSubserviceName(demande.serviceType, demande.serviceSubcategory) || demande.serviceSubcategory}
                            </p>
                          )}
                          {demande.lieu && (
                            <p className="text-[11px] text-[#6B7280]">
                              📍 {demande.lieu}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end">
                          <Link
                            href={`/espace-client/dossier/${demande.id}/${encodeURIComponent(
                              demande.ref
                            )}`}
                            className="inline-flex items-center justify-center rounded-md border border-[#0A1B2A] text-[#0A1B2A] px-3 py-1.5 text-[11px] font-semibold hover:bg-[#0A1B2A] hover:text-white transition"
                          >
                            {t.viewDossier}
                          </Link>
                        </div>
                      </div>

                      {/* Version mobile */}
                      <div className="md:hidden space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-[#0A1B2A]">
                            {demande.ref}
                          </p>
                          <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] text-[#4B4F58]">
                            {getServiceName(demande.serviceType)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280]">
                          {formatDateShort(demande.createdAt)}
                        </p>
                        <p className="text-[#4B4F58] text-xs line-clamp-2">
                          {demande.description}
                        </p>
                        {demande.lieu && (
                          <p className="text-[11px] text-[#6B7280]">
                            {t.lieuLabel} {demande.lieu}
                          </p>
                        )}
                        <div className="pt-1 flex justify-end">
                          <Link
                            href={`/espace-client/dossier/${demande.id}/${encodeURIComponent(
                              demande.ref
                            )}`}
                            className="inline-flex items-center justify-center rounded-md border border-[#0A1B2A] text-[#0A1B2A] px-3 py-1 text-[11px] font-semibold hover:bg-[#0A1B2A] hover:text-white transition"
                          >
                            {t.viewDossier}
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
