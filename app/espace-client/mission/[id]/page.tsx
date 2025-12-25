


"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../../components/LanguageProvider";
import { Clock, CheckCircle2, User, MapPin, DollarSign, FileText } from "lucide-react";
import Link from "next/link";
import type { Mission, MissionUpdate } from "@/lib/types";
import { MissionProgressBar } from "../../../components/MissionProgressBar";
import { MissionChat } from "../../../components/MissionChat";
import { MissionProofView } from "../../../components/MissionProofView";
import { ClientPaymentSection } from "../../../components/ClientPaymentSection";
import { ClientRatingSection } from "../../../components/ClientRatingSection";
import BackToHomeLink from "../../../components/BackToHomeLink";

const TEXT = {
  fr: {
    back: "Retour à mon espace",
    statut: "Statut",
    prestataire: "Prestataire assigné",
    lieu: "Lieu",
    budget: "Budget",
    description: "Description",
    updates: "Suivi de la mission",
    noUpdates: "Aucune mise à jour pour le moment",
    dateCreation: "Date de création",
    dateAcceptation: "Date d'acceptation",
    dateDebut: "Date de début",
    dateFin: "Date de fin",
    validerMission: "Valider la mission",
    missionValidee: "Mission validée",
  },
  en: {
    back: "Back to my space",
    statut: "Status",
    prestataire: "Assigned provider",
    lieu: "Location",
    budget: "Budget",
    description: "Description",
    updates: "Mission follow-up",
    noUpdates: "No updates yet",
    dateCreation: "Creation date",
    dateAcceptation: "Acceptance date",
    dateDebut: "Start date",
    dateFin: "End date",
    validerMission: "Validate mission",
    missionValidee: "Mission validated",
  },
} as const;

import { mapStatusToClient } from "@/lib/types";
import { formatDateWithTimezones } from "@/lib/dateUtils";

const STATUS_LABELS = {
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
} as const;

export default function MissionDetailClientPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  useEffect(() => {
    // Récupérer l'email de l'utilisateur
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserEmail(data.user?.email || "");
        }
      } catch (err) {
        console.error("Erreur récupération utilisateur:", err);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchMission() {
      try {
        const res = await fetch(`/api/espace-client/missions/${params.id}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setMission(data.mission);
          
          // Debug: afficher les valeurs pour comprendre pourquoi le bouton ne s'affiche pas
          if (data.mission) {
            console.log("🔍 Mission chargée - État pour bouton fermeture:", {
              id: data.mission.id,
              ref: data.mission.ref,
              internalState: data.mission.internalState,
              proofValidatedForClient: data.mission.proofValidatedForClient,
              proofValidatedForClientAt: data.mission.proofValidatedForClientAt,
              closedAt: data.mission.closedAt,
              closedBy: data.mission.closedBy,
              shouldShowButton: data.mission.internalState === "ADMIN_CONFIRMED" && 
                               data.mission.proofValidatedForClient === true && 
                               !data.mission.closedAt,
            });
          }
        }
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchMission();
    }
  }, [params.id]);

  const handleValidate = async () => {
    if (!confirm("Valider cette mission comme terminée ?")) return;

    try {
      const res = await fetch(`/api/espace-client/missions/${params.id}/validate`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
        const resMission = await fetch(`/api/espace-client/missions/${params.id}`);
        const data = await resMission.json();
        setMission(data.mission);
      }
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (!mission) {
    return <div className="p-8 text-center">Mission non trouvée</div>;
  }

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <BackToHomeLink backTo="client" />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">

        <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 md:p-8 space-y-6">
          {/* En-tête */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-heading text-2xl font-semibold text-[#0A1B2A]">
                {mission.titre}
              </h1>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {STATUS_LABELS[lang][mapStatusToClient(mission.status)]}
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-sm text-[#6B7280] font-mono">{mission.ref}</p>
              {mission.demandeId && (
                <Link
                  href={`/espace-client/dossier/${mission.demandeId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#0A1B2A] border border-[#0A1B2A] rounded-md hover:bg-[#0A1B2A] hover:text-white transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {lang === "fr" ? "Voir le dossier" : "View dossier"}
                </Link>
              )}
            </div>
          </div>

          {/* Informations principales */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-[#C8A55F] mt-0.5" />
              <div>
                <p className="text-xs text-[#6B7280] mb-1">{t.prestataire}</p>
                <p className="text-sm text-[#0A1B2A]">
                  {mission.prestataireRef || "Non assigné"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#C8A55F] mt-0.5" />
              <div>
                <p className="text-xs text-[#6B7280] mb-1">{t.lieu}</p>
                <p className="text-sm text-[#0A1B2A]">{mission.lieu || "Non spécifié"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-[#C8A55F] mt-0.5" />
              <div>
                <p className="text-xs text-[#6B7280] mb-1">{t.budget}</p>
                <p className="text-sm text-[#0A1B2A]">
                  {mission.tarifTotal ? mission.tarifTotal.toLocaleString() : "N/A"} FCFA
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#C8A55F] mt-0.5" />
              <div>
                <p className="text-xs text-[#6B7280] mb-1">{t.dateCreation}</p>
                <div className="space-y-0.5">
                  <p className="text-xs text-[#0A1B2A]">
                    🇨🇲 {formatDateWithTimezones(mission.createdAt).cameroon}
                  </p>
                  <p className="text-xs text-[#0A1B2A]">
                    🇨🇦 {formatDateWithTimezones(mission.createdAt).canada}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-[#6B7280] mb-2">{t.description}</p>
            <p className="text-sm text-[#4B4F58] leading-relaxed">{mission.description}</p>
          </div>

          {/* Barre de progression */}
          <div className="pt-4 border-t border-[#E2E2E8]">
            <MissionProgressBar mission={mission} lang={lang} />
          </div>

          {/* Section de paiement - affichée quand en attente de paiement */}
          {mission.internalState === "WAITING_CLIENT_PAYMENT" && (
            <div className="pt-4 border-t-4 border-t-amber-400 border-[#E2E2E8] bg-amber-50/30 rounded-lg p-4 animate-[gentlePulse_3s_ease-in-out_infinite]">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-[gentlePulse_3s_ease-in-out_infinite]" />
                <p className="text-sm font-medium text-amber-800">
                  {lang === "fr" ? "💰 Action requise : Paiement en attente" : "💰 Action required: Payment pending"}
                </p>
              </div>
              <ClientPaymentSection
                mission={mission}
                lang={lang}
                onPaymentSuccess={async () => {
                  // Recharger la mission après paiement réussi
                  const res = await fetch(`/api/espace-client/missions/${params.id}`, {
                    cache: "no-store",
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setMission(data.mission);
                    // Forcer un rechargement complet de la page pour mettre à jour la progression
                    window.location.reload();
                  }
                }}
              />
            </div>
          )}

          {/* Section de confirmation de paiement - affichée après paiement */}
          {(mission.internalState === "PAID_WAITING_TAKEOVER" || mission.paiementEffectue) && (
            <div className="pt-4 border-t-4 border-t-green-400 border-[#E2E2E8] bg-green-50/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-green-800">
                  {lang === "fr" ? "✅ Paiement effectué avec succès" : "✅ Payment successful"}
                </p>
              </div>
              <div className="space-y-2 text-sm text-green-700">
                {mission.paiementEffectueAt && (
                  <p>
                    {lang === "fr" ? "Date de paiement :" : "Payment date:"} {formatDateWithTimezones(mission.paiementEffectueAt).cameroon}
                  </p>
                )}
                {mission.tarifTotal && (
                  <p>
                    {lang === "fr" ? "Montant payé :" : "Amount paid:"} <span className="font-semibold">{mission.tarifTotal.toLocaleString()} FCFA</span>
                  </p>
                )}
                <p className="text-xs text-green-600 mt-2">
                  {lang === "fr" 
                    ? "Votre paiement a été enregistré. La mission va débuter prochainement une fois que l'administrateur aura envoyé l'avance au prestataire."
                    : "Your payment has been recorded. The mission will start soon once the administrator sends the advance to the provider."}
                </p>
              </div>
            </div>
          )}

          {/* Dates importantes */}
          {(mission.dateAcceptation || mission.dateDebut || mission.dateFin) && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <h3 className="font-heading font-semibold text-[#0A1B2A] mb-3">
                Dates importantes
              </h3>
              <div className="space-y-3 text-sm">
                {mission.dateAcceptation && (
                  <div>
                    <p className="text-[#6B7280] mb-1">{t.dateAcceptation}:</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-[#0A1B2A]">
                        🇨🇲 {formatDateWithTimezones(mission.dateAcceptation).cameroon}
                      </p>
                      <p className="text-xs text-[#0A1B2A]">
                        🇨🇦 {formatDateWithTimezones(mission.dateAcceptation).canada}
                      </p>
                    </div>
                  </div>
                )}
                {mission.dateDebut && (
                  <div>
                    <p className="text-[#6B7280] mb-1">{t.dateDebut}:</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-[#0A1B2A]">
                        🇨🇲 {formatDateWithTimezones(mission.dateDebut).cameroon}
                      </p>
                      <p className="text-xs text-[#0A1B2A]">
                        🇨🇦 {formatDateWithTimezones(mission.dateDebut).canada}
                      </p>
                    </div>
                  </div>
                )}
                {mission.dateFin && (
                  <div>
                    <p className="text-[#6B7280] mb-1">{t.dateFin}:</p>
                    <div className="space-y-0.5">
                      <p className="text-xs text-[#0A1B2A]">
                        🇨🇲 {formatDateWithTimezones(mission.dateFin).cameroon}
                      </p>
                      <p className="text-xs text-[#0A1B2A]">
                        🇨🇦 {formatDateWithTimezones(mission.dateFin).canada}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat/Messagerie */}
          {currentUserEmail && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <MissionChat
                mission={mission}
                currentUserEmail={currentUserEmail}
                currentUserRole="client"
                lang={lang}
              />
            </div>
          )}

          {/* Preuves de validation (si validées par l'admin) */}
          {/* Afficher les preuves si l'admin a validé OU si la mission est confirmée/complétée */}
          {(mission.proofValidatedForClient === true || 
            mission.internalState === "ADMIN_CONFIRMED" || 
            mission.internalState === "COMPLETED" || 
            mission.status === "termine_icd_canada" || 
            mission.status === "cloture") && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <h3 className="font-heading font-semibold text-[#0A1B2A] mb-3">
                {lang === "fr" ? "Preuves d'accomplissement" : "Proof of completion"}
              </h3>
              <MissionProofView
                missionId={(mission as any).dbId || mission.id}
                userRole="client"
                lang={lang}
              />
            </div>
          )}

          {/* Rapport de mission (si validé par l'admin ou clôturé) */}
          {(mission.internalState === "ADMIN_CONFIRMED" || mission.internalState === "COMPLETED") && (
            <div className="pt-4 border-t border-[#E2E2E8] space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold text-blue-900">
                    {lang === "fr" ? "Rapport de mission" : "Mission report"}
                  </h3>
                  <button
                    onClick={() => {
                      // Télécharger le PDF du rapport
                      window.open(`/api/missions/${mission.id}/report-pdf`, "_blank");
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition"
                  >
                    <FileText className="w-4 h-4" />
                    {lang === "fr" ? "Télécharger le rapport" : "Download report"}
                  </button>
                </div>
                <p className="text-sm text-blue-800">
                  {lang === "fr"
                    ? "Votre mission est terminée. Vous pouvez consulter les preuves ci-dessus et télécharger le rapport complet de la mission."
                    : "Your mission is completed. You can view the proofs above and download the complete mission report."}
                </p>
              </div>

              {/* Section de notation pour LeBoy */}
              <ClientRatingSection
                mission={mission}
                lang={lang}
                onRatingSubmitted={async () => {
                  // Recharger la mission après soumission de la note
                  const res = await fetch(`/api/espace-client/missions/${params.id}`, {
                    cache: "no-store",
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setMission(data.mission);
                  }
                }}
              />
            </div>
          )}

          {/* Mises à jour */}
          <div className="pt-6 border-t border-[#E2E2E8]">
            <h2 className="font-heading font-semibold text-[#0A1B2A] mb-4">
              {t.updates}
            </h2>
            {mission.updates.length === 0 ? (
              <p className="text-sm text-[#6B7280]">{t.noUpdates}</p>
            ) : (
              <div className="space-y-4">
                {mission.updates.map((update) => (
                  <UpdateCard key={update.id} update={update} lang={lang} />
                ))}
              </div>
            )}
          </div>

          {/* Bouton de fermeture de mission - Le client peut fermer après validation des preuves */}
          {/* Conditions: ADMIN_CONFIRMED (mission validée) et pas encore fermée */}
          {mission.internalState === "ADMIN_CONFIRMED" && 
           !mission.closedAt && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-semibold text-blue-900 mb-2">
                      {lang === "fr" ? "Fermer la mission" : "Close mission"}
                    </h3>
                    <p className="text-sm text-blue-800 mb-2">
                      {lang === "fr"
                        ? "Vous pouvez maintenant fermer cette mission. Si vous ne le faites pas, elle sera automatiquement fermée dans 24h ou par l'administrateur."
                        : "You can now close this mission. If you don't, it will be automatically closed in 24h or by the administrator."}
                    </p>
                    {mission.proofValidatedForClientAt ? (
                      <p className="text-xs text-blue-600">
                        {lang === "fr"
                          ? `Preuves validées le ${new Date(mission.proofValidatedForClientAt).toLocaleDateString("fr-FR")}`
                          : `Proofs validated on ${new Date(mission.proofValidatedForClientAt).toLocaleDateString("en-US")}`}
                      </p>
                    ) : (
                      <p className="text-xs text-blue-600">
                        {lang === "fr"
                          ? "Mission validée par l'administrateur"
                          : "Mission validated by administrator"}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(lang === "fr" 
                        ? "Êtes-vous sûr de vouloir fermer cette mission ? Cette action est définitive."
                        : "Are you sure you want to close this mission? This action is final."
                      )) {
                        return;
                      }

                      try {
                        const res = await fetch(`/api/espace-client/missions/${mission.id}/close`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                        });

                        const data = await res.json();

                        if (res.ok) {
                          alert(lang === "fr" 
                            ? "✅ Mission fermée avec succès !" 
                            : "✅ Mission closed successfully!"
                          );
                          // Recharger la mission
                          const resMission = await fetch(`/api/espace-client/missions/${params.id}`, {
                            cache: "no-store",
                          });
                          if (resMission.ok) {
                            const missionData = await resMission.json();
                            setMission(missionData.mission);
                          }
                        } else {
                          alert(data.error || (lang === "fr" ? "Erreur lors de la fermeture" : "Error closing mission"));
                        }
                      } catch (error) {
                        console.error("Erreur fermeture:", error);
                        alert(lang === "fr" ? "Erreur lors de la fermeture" : "Error closing mission");
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {lang === "fr" ? "Fermer la mission" : "Close mission"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action de validation - Mission fermée */}
          {(mission.internalState === "COMPLETED" || 
            mission.status === "termine_icd_canada" || 
            mission.status === "cloture" ||
            mission.closedAt) && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-md">
                <CheckCircle2 className="w-4 h-4" />
                {mission.closedBy === "client" 
                  ? (lang === "fr" ? "Mission fermée par vous" : "Mission closed by you")
                  : mission.closedBy === "admin"
                  ? (lang === "fr" ? "Mission fermée par l'administrateur" : "Mission closed by administrator")
                  : mission.closedBy === "auto"
                  ? (lang === "fr" ? "Mission fermée automatiquement" : "Mission closed automatically")
                  : t.missionValidee}
              </div>
            </div>
          )}

          {/* Section Besoin d'une correction ou d'un complément */}
          <div className="pt-4 border-t border-[#E2E2E8]">
            <div className="bg-[#FFF9EC] border border-[#C8A55F] rounded-xl p-5 md:p-6 text-xs md:text-sm text-[#4B4F58] space-y-2">
              <p className="font-heading text-sm md:text-base font-semibold text-[#0A1B2A]">
                {lang === "fr" ? "Besoin d'une correction ou d'un complément ?" : "Need a correction or addition?"}
              </p>
              <p style={{ textAlign: "justify" }}>
                {lang === "fr" 
                  ? `Si vous devez corriger une information importante ou ajouter des éléments, vous pourrez le faire en mentionnant la référence ${mission.ref} dans vos échanges avec LeBoy.`
                  : `If you need to correct important information or add elements, you can do so by mentioning reference ${mission.ref} in your exchanges with LeBoy.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function UpdateCard({ update, lang }: { update: MissionUpdate; lang: "fr" | "en" }) {
  const authorLabels = {
    fr: { admin: "LeBoy Admin", prestataire: "Prestataire", client: "Vous" },
    en: { admin: "LeBoy Admin", prestataire: "Provider", client: "You" },
  };

  const typeLabels = {
    fr: {
      status_change: "Changement de statut",
      photo: "Photo",
      document: "Document",
      note: "Note",
      message: "Message",
    },
    en: {
      status_change: "Status change",
      photo: "Photo",
      document: "Document",
      note: "Note",
      message: "Message",
    },
  };

  return (
    <div className="p-4 bg-[#F9F9FB] rounded-lg border border-[#E2E2E8]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#0A1B2A]">
            {authorLabels[lang][update.author]}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            {typeLabels[lang][update.type]}
          </span>
        </div>
        <div className="text-xs text-[#6B7280] space-y-0.5">
          <span className="block">🇨🇲 {formatDateWithTimezones(update.createdAt).cameroon}</span>
          <span className="block">🇨🇦 {formatDateWithTimezones(update.createdAt).canada}</span>
        </div>
      </div>
      <p className="text-sm text-[#0A1B2A] mb-2">{update.content}</p>
      {update.fileUrl && (
        <a
          href={update.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#C8A55F] hover:underline"
        >
          Voir le fichier
        </a>
      )}
    </div>
  );
}