"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../../../components/LanguageProvider";
import { CheckCircle2, XCircle, Upload, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { Mission, MissionUpdate } from "@/lib/types";
import { MissionProgressBar } from "../../../../components/MissionProgressBar";
import { ClickableMissionProgressBar } from "../../../../components/ClickableMissionProgressBar";
import { MissionChat } from "../../../../components/MissionChat";
import { MissionPhases } from "../../../../components/MissionPhases";
import { MissionProofUpload } from "../../../../components/MissionProofUpload";
import { EstimationFormModal } from "../../../../components/EstimationFormModal";
import { formatDateWithTimezones } from "@/lib/dateUtils";
import BackToHomeLink from "../../../../components/BackToHomeLink";

const TEXT = {
  fr: {
    back: "Retour",
    accepterMission: "Accepter la mission",
    refuserMission: "Refuser la mission",
    ajouterUpdate: "Ajouter une mise à jour",
    uploadPhoto: "Téléverser une photo",
    ajouterNote: "Ajouter une note",
    statut: "Statut",
    description: "Description",
    lieu: "Lieu",
    budget: "Budget",
    updates: "Mises à jour",
    noUpdates: "Aucune mise à jour pour le moment",
  },
  en: {
    back: "Back",
    accepterMission: "Accept mission",
    refuserMission: "Refuse mission",
    ajouterUpdate: "Add update",
    uploadPhoto: "Upload photo",
    ajouterNote: "Add note",
    statut: "Status",
    description: "Description",
    lieu: "Location",
    budget: "Budget",
    updates: "Updates",
    noUpdates: "No updates yet",
  },
} as const;

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [isRejected, setIsRejected] = useState(false);
  
  // Extraire l'UUID de la mission depuis l'URL (params.id)
  const idParam = params?.id;
  const missionUuid = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;

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
        const idParam = params?.id;
        const missionId = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;
        
        if (!missionId) {
          setLoading(false);
          return;
        }

        // missionId est maintenant un UUID string (pas un nombre)
        console.log("🔍 Chargement mission UUID:", missionId);
        const res = await fetch(`/api/prestataires/espace/missions/${missionId}`, {
          cache: "no-store",
        });
        
        const data = await res.json();
        console.log("🔍 Réponse API:", { status: res.status, ok: res.ok, data });

        if (res.ok) {
          setMission(data.mission);
          
          // Vérifier si la mission a une proposition refusée
          if (data.mission) {
            try {
              const resPropositions = await fetch("/api/prestataires/espace/propositions", { cache: "no-store" });
              if (resPropositions.ok) {
                const propositionsData = await resPropositions.json();
                const propositions = propositionsData.propositions || [];
                const rejectedProp = propositions.find(
                  (p: any) => p.demandeId === data.mission.demandeId && p.statut === "refusee"
                );
                setIsRejected(!!rejectedProp);
              }
            } catch (err) {
              console.error("Erreur vérification proposition:", err);
            }
          }
        } else {
          console.error("❌ Erreur API:", data.error);
        }
      } catch (err) {
        console.error("❌ Erreur:", err);
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      fetchMission();
    }
  }, [params]);

  const handleAccept = async () => {
    // Ouvrir le modal d'estimation au lieu d'accepter directement
    setShowEstimationModal(true);
  };

  const handlePriseEnCharge = async () => {
    if (!confirm(lang === "fr" ? "Prendre en charge cette mission ?" : "Take charge of this mission?")) return;

    try {
      const idParam = params?.id;
      const missionId = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;
      
      if (!missionId) {
        alert(lang === "fr" ? "ID de mission invalide" : "Invalid mission ID");
        return;
      }

      const res = await fetch(`/api/prestataires/espace/missions/${missionId}/prise-en-charge`, {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Recharger la mission pour voir les changements
        const resMission = await fetch(`/api/prestataires/espace/missions/${missionId}`, {
          cache: "no-store",
        });
        if (resMission.ok) {
          const missionData = await resMission.json();
          setMission(missionData.mission);
        }
        alert(lang === "fr" ? "✅ Mission prise en charge !" : "✅ Mission taken in charge!");
      } else {
        console.error("Erreur:", data.error);
        alert(data.error || (lang === "fr" ? "Erreur lors de la prise en charge" : "Error taking charge"));
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(lang === "fr" ? "Erreur lors de la prise en charge" : "Error taking charge");
    }
  };

  const [showProofModal, setShowProofModal] = useState(false);
  const [showEstimationModal, setShowEstimationModal] = useState(false);

  const handleStartMission = async () => {
    if (!confirm(lang === "fr" ? "Prendre en charge cette mission et commencer le travail ?" : "Take charge of this mission and start working?")) return;

    try {
      const idParam = params?.id;
      const missionId = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;
      
      if (!missionId) {
        alert(lang === "fr" ? "ID de mission invalide" : "Invalid mission ID");
        return;
      }

      const res = await fetch(`/api/prestataires/espace/missions/${missionId}/start`, {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Recharger la mission
        const resMission = await fetch(`/api/prestataires/espace/missions/${missionId}`, {
          cache: "no-store",
        });
        if (resMission.ok) {
          const missionData = await resMission.json();
          setMission(missionData.mission);
        }
        alert(lang === "fr" ? "✅ Mission prise en charge ! Le travail peut commencer." : "✅ Mission taken in charge! Work can begin.");
      } else {
        console.error("Erreur:", data.error);
        alert(data.error || (lang === "fr" ? "Erreur lors du démarrage" : "Error starting mission"));
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(lang === "fr" ? "Erreur lors du démarrage" : "Error starting mission");
    }
  };

  const handleFinishMission = () => {
    if (!mission) return;
    setShowProofModal(true);
  };

  const handleStepClick = async (stepKey: string) => {
    if (!mission) return;

    const idParam = params?.id;
    const missionId = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;
    
    if (!missionId) {
      alert(lang === "fr" ? "ID de mission invalide" : "Invalid mission ID");
      return;
    }

    try {
      if (stepKey === "acceptation") {
        // Ouvrir le modal d'estimation
        setShowEstimationModal(true);
      } else if (stepKey === "prise_en_charge") {
        // Prendre en charge la mission (après avoir reçu l'avance)
        if (mission.internalState === "ADVANCE_SENT") {
          await handleStartMission();
        }
      } else if (stepKey === "en_cours") {
        // Cette étape ne devrait pas être cliquable directement
        alert(lang === "fr" ? "La mission est déjà en cours d'exécution." : "Mission is already in progress.");
      } else if (stepKey === "validation") {
        // Ouvrir le modal d'upload de preuves pour soumettre la validation
        if (mission.internalState === "IN_PROGRESS") {
          setShowProofModal(true);
        } else {
          alert(
            lang === "fr"
              ? "La mission doit être en cours pour soumettre des preuves."
              : "Mission must be in progress to submit proofs."
          );
        }
      } else if (stepKey === "terminee") {
        // Cette étape n'est pas cliquable par le prestataire
        // L'admin valide la mission après avoir vérifié les preuves
        alert(lang === "fr" ? "La mission est en attente de validation par l'administrateur. Vous serez notifié une fois la validation effectuée." : "Mission is waiting for administrator validation. You will be notified once validation is complete.");
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
      <BackToHomeLink backTo="prestataire" />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">

        <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 md:p-8 space-y-6">
          {/* Message si mission rejetée */}
          {isRejected && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">
                    {lang === "fr" ? "Mission non retenue" : "Mission not selected"}
                  </h3>
                  <p className="text-sm text-orange-800">
                    {lang === "fr"
                      ? "Cette mission a été attribuée à un autre prestataire selon les critères de qualité, prix et délai. Cette page est en lecture seule. Vous pouvez archiver cette mission depuis votre espace pour libérer votre espace de travail."
                      : "This mission was assigned to another provider based on quality, price and deadline criteria. This page is read-only. You can archive this mission from your space to free up your workspace."}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-heading text-2xl font-semibold text-[#0A1B2A]">
                {mission.titre}
              </h1>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                isRejected ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"
              }`}>
                {isRejected ? (lang === "fr" ? "Non retenue" : "Not selected") : mission.status}
              </span>
            </div>
            <p className="text-sm text-[#6B7280] font-mono mb-4">{mission.ref}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">{t.lieu}</p>
              <p className="text-sm text-[#0A1B2A]">{mission.lieu || "Non spécifié"}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] mb-1">{t.budget}</p>
              <p className="text-sm text-[#0A1B2A]">{mission.tarifPrestataire} FCFA</p>
            </div>
            {mission.dateAssignation && (
              <div>
                <p className="text-xs text-[#6B7280] mb-1">
                  {lang === "fr" ? "Date d'assignation" : "Assignment date"}
                </p>
                <div className="space-y-0.5">
                  <p className="text-xs text-[#0A1B2A]">
                    🇨🇲 {formatDateWithTimezones(mission.dateAssignation).cameroon}
                  </p>
                  <p className="text-xs text-[#0A1B2A]">
                    🇨🇦 {formatDateWithTimezones(mission.dateAssignation).canada}
                  </p>
                </div>
              </div>
            )}
            {mission.dateAcceptation && (
              <div>
                <p className="text-xs text-[#6B7280] mb-1">
                  {lang === "fr" ? "Date d'acceptation" : "Acceptance date"}
                </p>
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
          </div>

          <div>
            <p className="text-xs text-[#6B7280] mb-2">{t.description}</p>
            <p className="text-sm text-[#4B4F58] leading-relaxed">{mission.description}</p>
          </div>

          {/* Barre de progression cliquable */}
          <div className="pt-4 border-t border-[#E2E2E8]">
            {isRejected ? (
              <MissionProgressBar mission={mission} lang={lang} />
            ) : (
              <ClickableMissionProgressBar 
                mission={mission} 
                lang={lang}
                onStepClick={handleStepClick}
              />
            )}
          </div>

          {/* Fichiers partagés */}
          {mission.sharedFiles && mission.sharedFiles.length > 0 && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <h2 className="font-heading font-semibold text-[#0A1B2A] mb-2">
                {lang === "fr" ? "Fichiers partagés" : "Shared files"}
              </h2>
              <p className="text-xs text-[#6B7280] mb-4">
                {lang === "fr" 
                  ? "📎 Ces fichiers ont été partagés avec vous par l'administrateur ICD lors de l'assignation de la mission."
                  : "📎 These files have been shared with you by the ICD administrator when the mission was assigned."}
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {mission.sharedFiles.map((file) => (
                  <a
                    key={file.fileId}
                    href={`/api/files/${file.fileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-[#F9F9FB] border border-[#DDDDDD] rounded-lg hover:bg-[#FFF9EC] hover:border-[#C8A55F] transition group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-[#C8A55F]/10 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-[#C8A55F]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0A1B2A] truncate group-hover:text-[#C8A55F] transition">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {file.fileType} • {(file.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-[#6B7280] group-hover:text-[#C8A55F] transition flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions selon le statut - Soumission d'estimation */}
          {mission.internalState === "ASSIGNED_TO_PROVIDER" && !isRejected && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  {lang === "fr" ? "📋 Mission à évaluer" : "📋 Mission to evaluate"}
                </p>
                <p className="text-xs text-blue-700 mb-4">
                  {lang === "fr" 
                    ? "Veuillez soumettre votre estimation (prix, délais, notes) pour cette mission."
                    : "Please submit your estimation (price, delays, notes) for this mission."}
                </p>
                <button
                  onClick={() => setShowEstimationModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8A55F] text-white text-sm font-semibold rounded-md hover:bg-[#B8944F] transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === "fr" ? "Soumettre l'estimation" : "Submit estimation"}
                </button>
              </div>
            </div>
          )}

          {/* Estimation soumise avec possibilité de révision */}
          {mission.internalState === "PROVIDER_ESTIMATED" && mission.estimationPartenaire && !mission.devisGenere && !isRejected && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  {lang === "fr" ? "✅ Estimation soumise" : "✅ Estimation submitted"}
                </p>
                {mission.estimationPartenaire && (
                  <div className="text-xs text-green-700 mb-4 space-y-1">
                    <p>
                      <strong>{lang === "fr" ? "Prix proposé:" : "Proposed price:"}</strong>{" "}
                      {(mission.estimationPartenaire as any).prixFournisseur?.toLocaleString()} FCFA
                    </p>
                    <p>
                      <strong>{lang === "fr" ? "Délais estimés:" : "Estimated delays:"}</strong>{" "}
                      {(mission.estimationPartenaire as any).delaisEstimes} {lang === "fr" ? "heures" : "hours"}
                    </p>
                    {(mission.estimationPartenaire as any).revisionNumber && (
                      <p className="text-orange-700 font-semibold">
                        {lang === "fr" 
                          ? `📝 Révision #${(mission.estimationPartenaire as any).revisionNumber}`
                          : `📝 Revision #${(mission.estimationPartenaire as any).revisionNumber}`}
                      </p>
                    )}
                  </div>
                )}
                {/* Vérifier s'il y a des messages de l'admin demandant une révision */}
                {mission.messages && mission.messages.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-orange-800 mb-2">
                      {lang === "fr" ? "💬 Message de l'administrateur" : "💬 Message from administrator"}
                    </p>
                    {mission.messages
                      .filter((m: any) => m.from === "admin" && m.to === "prestataire")
                      .slice(-1) // Dernier message
                      .map((m: any) => (
                        <p key={m.id} className="text-xs text-orange-700">
                          {m.content}
                        </p>
                      ))}
                  </div>
                )}
                <button
                  onClick={() => setShowEstimationModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-md hover:bg-orange-600 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === "fr" ? "Réviser l'estimation" : "Revise estimation"}
                </button>
              </div>
            </div>
          )}

          {/* Prise en charge de mission après réception de l'avance */}
          {mission.internalState === "ADVANCE_SENT" && !isRejected && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              {(() => {
                const avancePercentage = mission.avancePercentage || 50;
                const isFullPayment = avancePercentage === 100;
                
                return (
                  <>
                    <div className={`${isFullPayment ? "bg-emerald-50 border-emerald-300" : "bg-green-50 border-green-200"} border rounded-lg p-4 mb-4`}>
                      <p className={`text-sm font-medium mb-2 ${isFullPayment ? "text-emerald-800" : "text-green-800"}`}>
                        {isFullPayment 
                          ? (lang === "fr" ? "✅ Paiement complet reçu (100%)" : "✅ Full payment received (100%)")
                          : (lang === "fr" ? `✅ Avance partielle reçue (${avancePercentage}%)` : `✅ Partial advance received (${avancePercentage}%)`)
                        }
                      </p>
                      <p className={`text-xs ${isFullPayment ? "text-emerald-700" : "text-green-700"}`}>
                        {isFullPayment
                          ? (lang === "fr"
                            ? "Le paiement intégral (100%) a été effectué. Aucun solde restant. Vous pouvez maintenant prendre en charge la mission et commencer le travail."
                            : "Full payment (100%) has been made. No remaining balance. You can now take charge of the mission and start working.")
                          : (lang === "fr"
                            ? `L'avance de ${avancePercentage}% a été versée. Le solde restant (${100 - avancePercentage}%) vous sera versé après validation de la mission. Vous pouvez maintenant prendre en charge la mission et commencer le travail.`
                            : `The ${avancePercentage}% advance has been paid. The remaining balance (${100 - avancePercentage}%) will be paid after mission validation. You can now take charge of the mission and start working.`)
                        }
                      </p>
                      {isFullPayment && (
                        <p className="text-xs font-semibold text-emerald-800 mt-2">
                          {lang === "fr" ? "💯 Aucun solde restant - Paiement complet" : "💯 No remaining balance - Full payment"}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleStartMission}
                      className={`inline-flex items-center gap-2 px-4 py-2 ${isFullPayment ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#C8A55F] hover:bg-[#B8944F]"} text-white text-sm font-semibold rounded-md transition`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {lang === "fr" ? "Prise en charge" : "Take charge"}
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {/* Phases d'exécution */}
          {mission.internalState === "IN_PROGRESS" && !isRejected && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <MissionPhases 
                mission={mission} 
                currentUserRole="prestataire" 
                lang={lang}
                onUpdate={async () => {
                  // Recharger la mission après mise à jour
                  const idParam = params?.id;
                  const missionId = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;
                  if (missionId) {
                    const res = await fetch(`/api/prestataires/espace/missions/${missionId}`, { cache: "no-store" });
                    if (res.ok) {
                      const data = await res.json();
                      setMission(data.mission);
                    }
                  }
                }}
              />
            </div>
          )}

          {/* Upload de preuves (inline, seulement si en cours) */}
          {mission.internalState === "IN_PROGRESS" && !showProofModal && !isRejected && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <MissionProofUpload
                missionId={missionUuid || (mission as any)?.dbId || mission.id}
                lang={lang}
                existingProofs={mission.proofs || []}
                onUploadSuccess={async () => {
                  // Recharger la mission après upload
                  const idParam = params?.id;
                  const missionId = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;
                  if (missionId) {
                    const res = await fetch(`/api/prestataires/espace/missions/${missionId}`, { cache: "no-store" });
                    if (res.ok) {
                      const data = await res.json();
                      setMission(data.mission);
                    }
                  }
                }}
                onFinalSubmit={async (commentaire) => {
                  // Soumettre pour validation finale
                  const idParam = params?.id;
                  const missionId = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;
                  if (!missionId) {
                    alert(lang === "fr" ? "ID de mission invalide" : "Invalid mission ID");
                    return;
                  }

                  try {
                    const res = await fetch(`/api/prestataires/espace/missions/${missionId}/submit-validation`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ commentairePrestataire: commentaire }),
                    });

                    const data = await res.json();

                    if (res.ok) {
                      // Recharger la mission
                      const resMission = await fetch(`/api/prestataires/espace/missions/${missionId}`, { cache: "no-store" });
                      if (resMission.ok) {
                        const missionData = await resMission.json();
                        setMission(missionData.mission);
                      }
                      alert(
                        lang === "fr"
                          ? "✅ Mission soumise pour validation ! En attente de validation par l'administrateur."
                          : "✅ Mission submitted for validation! Waiting for administrator validation."
                      );
                    } else {
                      alert(data.error || (lang === "fr" ? "Erreur lors de la soumission" : "Error submitting"));
                    }
                  } catch (err) {
                    console.error("Erreur:", err);
                    alert(lang === "fr" ? "Erreur lors de la soumission" : "Error submitting");
                  }
                }}
              />
            </div>
          )}

          {/* Modal d'estimation */}
          {showEstimationModal && (
            <EstimationFormModal
              missionId={missionUuid || mission.id}
              lang={lang}
              isRevision={mission.internalState === "PROVIDER_ESTIMATED" && !!mission.estimationPartenaire}
              previousEstimation={mission.estimationPartenaire ? {
                prixFournisseur: (mission.estimationPartenaire as any).prixFournisseur,
                delaisEstimes: (mission.estimationPartenaire as any).delaisEstimes,
                noteExplication: (mission.estimationPartenaire as any).noteExplication,
              } : undefined}
              onClose={() => setShowEstimationModal(false)}
              onSuccess={async () => {
                // Recharger la mission après soumission réussie
                const idParam = params?.id;
                const missionId = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;
                if (missionId) {
                  const res = await fetch(`/api/prestataires/espace/missions/${missionId}`, {
                    cache: "no-store",
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setMission(data.mission);
                  }
                }
                const isRevision = mission.internalState === "PROVIDER_ESTIMATED" && !!mission.estimationPartenaire;
                alert(lang === "fr" 
                  ? (isRevision ? "✅ Estimation révisée avec succès !" : "✅ Estimation soumise avec succès !")
                  : (isRevision ? "✅ Estimation revised successfully!" : "✅ Estimation submitted successfully!"));
              }}
            />
          )}

          {/* Modal d'upload de preuves */}
          {showProofModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-[#E2E2E8]">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-xl font-semibold text-[#0A1B2A]">
                      {lang === "fr" ? "Preuves d'accomplissement" : "Proof of completion"}
                    </h2>
                    <button
                      onClick={() => setShowProofModal(false)}
                      className="text-[#6B7280] hover:text-[#0A1B2A] text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <MissionProofUpload
                    missionId={missionUuid || (mission as any)?.dbId || mission.id}
                    lang={lang}
                    existingProofs={mission.proofs || []}
                    onUploadSuccess={async () => {
                      // Recharger la mission après upload
                      const idParam = params?.id;
                      const missionId = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;
                      if (missionId) {
                        const res = await fetch(`/api/prestataires/espace/missions/${missionId}`, { cache: "no-store" });
                        if (res.ok) {
                          const data = await res.json();
                          setMission(data.mission);
                        }
                      }
                    }}
                    onFinalSubmit={async (commentaire) => {
                      // Soumettre pour validation finale
                      const idParam = params?.id;
                      const missionId = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null;
                      if (!missionId) {
                        alert(lang === "fr" ? "ID de mission invalide" : "Invalid mission ID");
                        return;
                      }

                      try {
                        const res = await fetch(`/api/prestataires/espace/missions/${missionId}/submit-validation`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ commentairePrestataire: commentaire }),
                        });

                        const data = await res.json();

                        if (res.ok) {
                          // Fermer le modal
                          setShowProofModal(false);
                          // Recharger la mission
                          const resMission = await fetch(`/api/prestataires/espace/missions/${missionId}`, { cache: "no-store" });
                          if (resMission.ok) {
                            const missionData = await resMission.json();
                            setMission(missionData.mission);
                          }
                          alert(
                            lang === "fr"
                              ? "✅ Mission soumise pour validation ! En attente de validation par l'administrateur."
                              : "✅ Mission submitted for validation! Waiting for administrator validation."
                          );
                        } else {
                          alert(data.error || (lang === "fr" ? "Erreur lors de la soumission" : "Error submitting"));
                        }
                      } catch (err) {
                        console.error("Erreur:", err);
                        alert(lang === "fr" ? "Erreur lors de la soumission" : "Error submitting");
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chat/Messagerie */}
          {currentUserEmail && !isRejected && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <MissionChat
                mission={mission}
                currentUserEmail={currentUserEmail}
                currentUserRole="prestataire"
                lang={lang}
              />
            </div>
          )}

          {/* Mises à jour */}
          <div className="pt-6 border-t border-[#E2E2E8]">
            <h2 className="font-heading font-semibold text-[#0A1B2A] mb-4">
              {t.updates}
            </h2>
            
            {/* Formulaire d'ajout de mise à jour */}
            {mission.internalState === "IN_PROGRESS" && !isRejected && (
              <UpdateForm missionId={missionUuid || (mission as any)?.dbId || mission.id} onUpdate={() => {
                // Recharger la mission
                if (missionUuid) {
                  fetch(`/api/prestataires/espace/missions/${missionUuid}`)
                    .then(res => res.json())
                    .then(data => setMission(data.mission));
                }
              }} t={t} />
            )}

            {mission.updates.length === 0 ? (
              <p className="text-sm text-[#6B7280]">{t.noUpdates}</p>
            ) : (
              <div className="space-y-3">
                {mission.updates.map((update) => (
                  <div
                    key={update.id}
                    className="p-4 bg-[#F9F9FB] rounded-lg border border-[#E2E2E8]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-0.5">
                        <span className="text-xs text-[#6B7280] block">
                          🇨🇲 {formatDateWithTimezones(update.createdAt).cameroon}
                        </span>
                        <span className="text-xs text-[#6B7280] block">
                          🇨🇦 {formatDateWithTimezones(update.createdAt).canada}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {update.type}
                      </span>
                    </div>
                    <p className="text-sm text-[#0A1B2A]">{update.content}</p>
                    {update.fileUrl && (
                      <a
                        href={update.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#C8A55F] hover:underline mt-2 inline-block"
                      >
                        Voir le fichier
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function UpdateForm({ missionId, onUpdate, t }: { 
  missionId: string | number; 
  onUpdate: () => void;
  t: any;
}) {
  const [type, setType] = useState<"note" | "message" | "photo" | "document">("message");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/prestataires/espace/missions/${missionId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content }),
      });

      if (res.ok) {
        setContent("");
        onUpdate();
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-[#F9F9FB] rounded-lg border border-[#E2E2E8]">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#0A1B2A] mb-1">
            Type de mise à jour
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 border border-[#DDDDDD] rounded-md text-sm focus:outline-none focus:border-[#0A1B2A]"
          >
            <option value="message">Message</option>
            <option value="note">Note</option>
            <option value="photo">Photo</option>
            <option value="document">Document</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#0A1B2A] mb-1">
            Contenu
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-[#DDDDDD] rounded-md text-sm focus:outline-none focus:border-[#0A1B2A]"
            placeholder="Décrivez l'avancement de la mission..."
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="w-full px-4 py-2 bg-[#0A1B2A] text-white text-sm font-semibold rounded-md hover:bg-[#07121e] disabled:opacity-60 transition"
        >
          {submitting ? "Envoi..." : "Ajouter la mise à jour"}
        </button>
      </div>
    </form>
  );
}
