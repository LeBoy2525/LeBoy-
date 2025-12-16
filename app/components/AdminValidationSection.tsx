"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, XCircle, DollarSign, FileText } from "lucide-react";
import type { Mission } from "@/lib/types";

interface AdminValidationSectionProps {
  mission: Mission;
  lang?: "fr" | "en";
  onValidationChange?: () => void;
}

const TEXT = {
  fr: {
    title: "Validation des preuves",
    commentairePrestataire: "Commentaire du prestataire",
    commentairePrestataireLabel: "Résumé du travail effectué",
    montants: "Montants",
    montantPrestataire: "Montant prestataire",
    montantClient: "Montant client",
    commissionICD: "Commission LeBoy",
    fraisSupplementaires: "Frais supplémentaires",
    conforme: "Conforme",
    validerMission: "Valider la mission",
    rejeter: "Rejeter",
    validant: "Validation en cours...",
    validee: "✅ Mission validée !",
    rejetee: "❌ Preuves rejetées",
    erreur: "Erreur lors de la validation",
    paySolde: "Confirmer l'envoi du solde (50%) au prestataire",
    paySoldeAmount: "Montant à envoyer (50%)",
    paiementEnCours: "Paiement en cours...",
    soldePaye: "✅ Solde envoyé avec succès !",
    erreurPaiement: "Erreur lors de l'envoi du solde",
    preuvesAValider: "Preuves à valider",
    aucunePreuve: "Aucune preuve uploadée",
    confirmationValidation: "Êtes-vous sûr de vouloir valider cette mission ?",
    confirmationRejet: "Êtes-vous sûr de vouloir rejeter ces preuves ? Le prestataire devra les corriger.",
    confirmationSolde: "Confirmer l'envoi du solde de 50% au prestataire ?",
    cloturerMission: "Clôturer la mission côté client",
    cloturerMissionDesc: "Le prestataire a été payé en totalité. Vous pouvez maintenant clôturer la mission et rendre le rapport disponible au client.",
    cloturationEnCours: "Clôturation en cours...",
    missionCloturee: "✅ Mission clôturée avec succès !",
    erreurCloture: "Erreur lors de la clôture",
    confirmationCloture: "Êtes-vous sûr de vouloir clôturer cette mission ? Le rapport sera généré et rendu disponible au client.",
  },
  en: {
    title: "Proof validation",
    commentairePrestataire: "Provider comment",
    commentairePrestataireLabel: "Summary of work completed",
    montants: "Amounts",
    montantPrestataire: "Provider amount",
    montantClient: "Client amount",
    commissionICD: "LeBoy commission",
    fraisSupplementaires: "Additional fees",
    conforme: "Compliant",
    validerMission: "Validate mission",
    rejeter: "Reject",
    validant: "Validating...",
    validee: "✅ Mission validated!",
    rejetee: "❌ Proofs rejected",
    erreur: "Error validating",
    paySolde: "Confirm sending balance to provider",
    paySoldeAmount: "Amount to send",
    paiementEnCours: "Payment in progress...",
    soldePaye: "✅ Balance sent successfully!",
    erreurPaiement: "Error sending balance",
    preuvesAValider: "Proofs to validate",
    aucunePreuve: "No proof uploaded",
    confirmationValidation: "Are you sure you want to validate this mission?",
    confirmationRejet: "Are you sure you want to reject these proofs? The provider will need to correct them.",
    confirmationSolde: "Confirm sending balance to provider?",
    cloturerMission: "Close mission for client",
    cloturerMissionDesc: "The provider has been fully paid. You can now close the mission and make the report available to the client.",
    cloturationEnCours: "Closing in progress...",
    missionCloturee: "✅ Mission closed successfully!",
    erreurCloture: "Error closing mission",
    confirmationCloture: "Are you sure you want to close this mission? The report will be generated and made available to the client.",
  },
} as const;

export function AdminValidationSection({
  mission,
  lang = "fr",
  onValidationChange,
}: AdminValidationSectionProps) {
  const t = TEXT[lang];
  const [validating, setValidating] = useState(false);
  const [payingSolde, setPayingSolde] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleValidate = async (validate: boolean) => {
    if (!validate && !confirm(t.confirmationRejet)) return;
    if (validate && !confirm(t.confirmationValidation)) return;

    setValidating(true);
    try {
      const res = await fetch(`/api/admin/missions/${mission.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validateForClient: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.erreur);
      }

      alert(t.validee);
      onValidationChange?.();
    } catch (error: any) {
      console.error("Erreur validation:", error);
      alert(error.message || t.erreur);
    } finally {
      setValidating(false);
    }
  };

  const handlePaySolde = async () => {
    if (!confirm(t.confirmationSolde)) return;

    setPayingSolde(true);
    try {
      const res = await fetch(`/api/admin/missions/${mission.id}/pay-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.erreurPaiement);
      }

      alert(t.soldePaye);
      onValidationChange?.();
    } catch (error: any) {
      console.error("Erreur paiement solde:", error);
      alert(error.message || t.erreurPaiement);
    } finally {
      setPayingSolde(false);
    }
  };

  const handleCloseMission = async () => {
    if (!confirm(t.confirmationCloture)) return;

    setClosing(true);
    try {
      const res = await fetch(`/api/admin/missions/${mission.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.erreurCloture);
      }

      alert(t.missionCloturee);
      onValidationChange?.();
    } catch (error: any) {
      console.error("Erreur clôture:", error);
      alert(error.message || t.erreurCloture);
    } finally {
      setClosing(false);
    }
  };

  const montantPrestataire = mission.tarifPrestataire || 0;
  const avancePercentage = mission.avancePercentage || 50; // Par défaut 50% si non défini (rétrocompatibilité)
  const soldePercentage = 100 - avancePercentage; // Si avance 25%, solde = 75%. Si avance 50%, solde = 50%
  const montantSolde = (montantPrestataire * soldePercentage) / 100;

  return (
    <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold text-[#0A1B2A] flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          {t.title}
        </h3>
      </div>

      {/* Commentaire du prestataire */}
      {mission.commentairePrestataire && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">
            {t.commentairePrestataireLabel}
          </p>
          <p className="text-sm text-blue-700 whitespace-pre-wrap">
            {mission.commentairePrestataire}
          </p>
        </div>
      )}

      {/* Montants */}
      <div className="bg-gray-50 border border-[#DDDDDD] rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-[#0A1B2A] mb-3">{t.montants}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[#6B7280]">{t.montantPrestataire}:</span>
            <span className="ml-2 font-semibold text-[#0A1B2A]">
              ${montantPrestataire.toFixed(2)}
            </span>
          </div>
          {mission.commissionTotale !== undefined && mission.commissionTotale > 0 && (
            <div className="space-y-1">
              <div>
                <span className="text-[#6B7280]">{t.commissionICD}:</span>
                <span className="ml-2 font-semibold text-[#0A1B2A]">
                  ${mission.commissionTotale.toFixed(2)}
                </span>
              </div>
              {mission.commissionHybride && mission.commissionRisk && (
                <div className="text-xs text-gray-500 pl-4">
                  Base: ${mission.commissionHybride.toFixed(2)} + Protection: ${mission.commissionRisk.toFixed(2)}
                </div>
              )}
            </div>
          )}
          {/* Rétrocompatibilité */}
          {!mission.commissionTotale && mission.commissionICD !== undefined && mission.commissionICD > 0 && (
            <div>
              <span className="text-[#6B7280]">{t.commissionICD}:</span>
              <span className="ml-2 font-semibold text-[#0A1B2A]">
                ${mission.commissionICD.toFixed(2)}
              </span>
            </div>
          )}
          {mission.fraisSupplementaires !== undefined && mission.fraisSupplementaires > 0 && (
            <div>
              <span className="text-[#6B7280]">{t.fraisSupplementaires}:</span>
              <span className="ml-2 font-semibold text-[#0A1B2A]">
                ${mission.fraisSupplementaires.toFixed(2)}
              </span>
            </div>
          )}
          {mission.tarifTotal !== undefined && mission.tarifTotal > 0 && (
            <div className="col-span-2 pt-2 border-t border-[#DDDDDD]">
              <span className="text-[#6B7280]">{t.montantClient}:</span>
              <span className="ml-2 font-semibold text-green-600 text-base">
                ${mission.tarifTotal.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Message informatif pour paiement 100% */}
      {mission.internalState === "PROVIDER_VALIDATION_SUBMITTED" && mission.avancePercentage === 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800 mb-1">
            {lang === "fr" ? "⏳ Validation automatique en cours..." : "⏳ Automatic validation in progress..."}
          </p>
          <p className="text-xs text-blue-700">
            {lang === "fr" 
              ? "Cette mission a été payée à 100%. Les preuves seront validées automatiquement dès leur soumission par le prestataire."
              : "This mission was paid 100%. Proofs will be automatically validated upon submission by the provider."}
          </p>
        </div>
      )}

      {/* Bouton de validation si pas encore validé (masquer si 100% car validation automatique) */}
      {mission.internalState === "PROVIDER_VALIDATION_SUBMITTED" && mission.avancePercentage !== 100 && (
        <div className="flex gap-3 pt-4 border-t border-[#E2E2E8]">
          <button
            onClick={() => handleValidate(true)}
            disabled={validating}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? (
              <>
                <span className="animate-spin">⏳</span>
                {t.validant}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t.conforme}
              </>
            )}
          </button>
          <button
            onClick={() => handleValidate(false)}
            disabled={validating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4" />
            {t.rejeter}
          </button>
        </div>
      )}

      {/* Bouton de paiement du solde si validé mais pas encore payé (uniquement si pas 100%) */}
      {mission.internalState === "ADMIN_CONFIRMED" && !mission.soldeVersee && mission.avancePercentage !== 100 && (
        <div className="pt-4 border-t border-[#E2E2E8]">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-green-800 mb-2">
              ✅ {t.validee}
            </p>
            <p className="text-xs text-green-700 mb-3">
              {lang === "fr"
                ? "La mission a été validée. Vous pouvez maintenant envoyer le solde au prestataire."
                : "Mission has been validated. You can now send the balance to the provider."}
            </p>
            <div className="text-sm">
              <span className="text-green-700">{t.paySoldeAmount} ({soldePercentage}%):</span>
              <span className="ml-2 font-semibold text-green-800 text-base">
                ${montantSolde.toFixed(2)}
              </span>
              {avancePercentage !== 50 && (
                <p className="text-xs text-green-600 mt-1">
                  {lang === "fr" 
                    ? `Avance de ${avancePercentage}% déjà versée, solde de ${soldePercentage}% restant.`
                    : `${avancePercentage}% advance already paid, ${soldePercentage}% balance remaining.`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handlePaySolde}
            disabled={payingSolde}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {payingSolde ? (
              <>
                <span className="animate-spin">⏳</span>
                {t.paiementEnCours}
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                {t.paySolde}
              </>
            )}
          </button>
        </div>
      )}

      {/* Message si le solde est déjà payé (ou si 100% payé) */}
      {(mission.soldeVersee || mission.avancePercentage === 100) && mission.internalState === "ADMIN_CONFIRMED" && (
        <div className="pt-4 border-t border-[#E2E2E8]">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-green-800 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              {t.soldePaye}
            </p>
            {mission.soldeVerseeAt && (
              <p className="text-xs text-green-700 mb-3">
                {lang === "fr" ? "Envoyé le" : "Sent on"}: {new Date(mission.soldeVerseeAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
              </p>
            )}
            <p className="text-xs text-green-700">
              {mission.avancePercentage === 100 
                ? (lang === "fr" 
                    ? "Paiement complet (100%) effectué. La mission a été validée automatiquement. Vous pouvez maintenant clôturer la mission."
                    : "Full payment (100%) completed. Mission was automatically validated. You can now close the mission.")
                : t.cloturerMissionDesc}
            </p>
          </div>
          <button
            onClick={handleCloseMission}
            disabled={closing}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {closing ? (
              <>
                <span className="animate-spin">⏳</span>
                {t.cloturationEnCours}
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                {t.cloturerMission}
              </>
            )}
          </button>
        </div>
      )}

      {/* Message si la mission est déjà clôturée */}
      {mission.internalState === "COMPLETED" && (
        <div className="pt-4 border-t border-[#E2E2E8]">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t.missionCloturee}
            </p>
            {mission.dateFin && (
              <p className="text-xs text-blue-700 mt-1">
                {lang === "fr" ? "Clôturée le" : "Closed on"}: {new Date(mission.dateFin).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

