"use client";

import { useState } from "react";
import { DollarSign, CheckCircle2 } from "lucide-react";
import type { Mission } from "@/lib/types";

interface AdminAdvancePaymentSectionProps {
  mission: Mission;
  lang?: "fr" | "en";
  onAdvanceSent: () => void;
}

const TEXT = {
  fr: {
    title: "Envoi de l'avance au prestataire",
    montantPrestataire: "Montant prestataire",
    montantAEnvoyer: "Montant à envoyer",
    description: "Le client a effectué son paiement. Vous pouvez maintenant envoyer l'avance au prestataire.",
    choisirPourcentage: "Pourcentage d'avance",
    pourcentageDescription: "Pour les gros projets, vous pouvez choisir 25% pour réduire les risques. Le solde sera versé à la fin. Pour les achats de médicaments (pharmacies partenaires), choisissez 100% pour un traitement automatique.",
    confirmerEnvoi: "Confirmer l'envoi de l'avance au prestataire",
    envoi: "Envoi en cours...",
    confirmation: "Êtes-vous sûr de vouloir confirmer l'envoi de",
    auPrestataire: "au prestataire ?",
    soldeReste: "Solde restant à verser",
  },
  en: {
    title: "Send advance to provider",
    montantPrestataire: "Provider amount",
    montantAEnvoyer: "Amount to send",
    description: "The client has made their payment. You can now send the advance to the provider.",
    choisirPourcentage: "Advance percentage",
    pourcentageDescription: "For large projects, you can choose 25% to reduce risks. The balance will be paid at the end.",
    confirmerEnvoi: "Confirm sending advance to provider",
    envoi: "Sending...",
    confirmation: "Are you sure you want to confirm sending",
    auPrestataire: "to the provider?",
    soldeReste: "Remaining balance to pay",
  },
} as const;

export function AdminAdvancePaymentSection({
  mission,
  lang = "fr",
  onAdvanceSent,
}: AdminAdvancePaymentSectionProps) {
  const t = TEXT[lang];
  const [processing, setProcessing] = useState(false);
  const initialPercentage = (mission.avancePercentage === 25 || mission.avancePercentage === 50 || mission.avancePercentage === 100)
    ? mission.avancePercentage 
    : 50;
  const [avancePercentage, setAvancePercentage] = useState<25 | 50 | 100>(initialPercentage as 25 | 50 | 100);

  if (!mission.tarifPrestataire) {
    return null;
  }

  const avance = (mission.tarifPrestataire * avancePercentage) / 100;

  const handleConfirm = async () => {
    if (!confirm(`${t.confirmation} ${avance.toLocaleString()} FCFA (${avancePercentage}%) ${t.auPrestataire}`)) {
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch(`/api/admin/missions/${mission.id}/pay-advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avancePercentage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Message différencié selon le pourcentage
        if (avancePercentage === 100) {
          alert(
            lang === "fr"
              ? `✅ Paiement complet (100%) de ${avance.toLocaleString()} FCFA envoyé au prestataire avec succès !\n\n💯 Aucun solde restant - Le prestataire recevra une notification de paiement complet.`
              : `✅ Full payment (100%) of ${avance.toLocaleString()} FCFA sent to provider successfully!\n\n💯 No remaining balance - Provider will receive a full payment notification.`
          );
        } else {
          alert(
            lang === "fr"
              ? `✅ Avance partielle (${avancePercentage}%) de ${avance.toLocaleString()} FCFA envoyée au prestataire avec succès !\n\nLe solde restant (${100 - avancePercentage}%) sera versé après validation de la mission.`
              : `✅ Partial advance (${avancePercentage}%) of ${avance.toLocaleString()} FCFA sent to provider successfully!\n\nThe remaining balance (${100 - avancePercentage}%) will be paid after mission validation.`
          );
        }
        onAdvanceSent();
      } else {
        alert(data.error || (lang === "fr" ? "Erreur lors de l'envoi de l'avance" : "Error sending advance"));
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(lang === "fr" ? "Erreur lors de l'envoi de l'avance" : "Error sending advance");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <DollarSign className="w-6 h-6 text-orange-600" />
        <h3 className="font-heading text-lg font-semibold text-orange-900">
          {t.title}
        </h3>
      </div>

      <p className="text-sm text-orange-800">
        {t.description}
      </p>

      {/* Sélection du pourcentage d'avance */}
      <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm font-semibold text-orange-900 mb-2">
            {t.choisirPourcentage} *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="avancePercentage"
                value="25"
                checked={avancePercentage === 25}
                onChange={(e) => setAvancePercentage(parseInt(e.target.value) as 25 | 50)}
                className="w-4 h-4 text-orange-600 border-orange-300 focus:ring-orange-500"
                disabled={processing}
              />
              <span className="text-sm text-orange-900 font-medium">25%</span>
              <span className="text-xs text-orange-700">
                ({lang === "fr" ? "Projets à risque" : "Risky projects"})
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="avancePercentage"
                value="50"
                checked={avancePercentage === 50}
                onChange={(e) => setAvancePercentage(parseInt(e.target.value) as 25 | 50 | 100)}
                className="w-4 h-4 text-orange-600 border-orange-300 focus:ring-orange-500"
                disabled={processing}
              />
              <span className="text-sm text-orange-900 font-medium">50%</span>
              <span className="text-xs text-orange-700">
                ({lang === "fr" ? "Standard" : "Standard"})
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="avancePercentage"
                value="100"
                checked={avancePercentage === 100}
                onChange={(e) => setAvancePercentage(parseInt(e.target.value) as 25 | 50 | 100)}
                className="w-4 h-4 text-orange-600 border-orange-300 focus:ring-orange-500"
                disabled={processing}
              />
              <span className="text-sm text-orange-900 font-medium">100%</span>
              <span className="text-xs text-orange-700">
                ({lang === "fr" ? "Risque faible (pharmacies)" : "Low risk (pharmacies)"})
              </span>
            </label>
          </div>
          <p className="text-xs text-orange-700 mt-2">
            {t.pourcentageDescription}
          </p>
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="bg-white border border-orange-300 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-orange-700">{t.montantPrestataire}:</span>
          <span className="font-semibold text-orange-900">
            {mission.tarifPrestataire.toLocaleString()} FCFA
          </span>
        </div>

        <div className="pt-2 border-t border-orange-200 flex justify-between items-center">
          <span className="font-heading font-semibold text-orange-900">
            {t.montantAEnvoyer} ({avancePercentage}%):
          </span>
          <span className="font-heading text-xl font-bold text-[#C8A55F]">
            {avance.toLocaleString()} FCFA
          </span>
        </div>

        {avancePercentage !== 100 && (
          <div className="pt-2 border-t border-orange-200 flex justify-between items-center text-sm">
            <span className="text-orange-700">{t.soldeReste}:</span>
            <span className="font-semibold text-orange-900">
              {(mission.tarifPrestataire - avance).toLocaleString()} FCFA ({100 - avancePercentage}%)
            </span>
          </div>
        )}
        {avancePercentage === 100 && (
          <div className="pt-2 border-t border-orange-200 flex justify-between items-center text-sm">
            <span className="text-orange-700 italic">
              {lang === "fr" ? "Paiement complet - Validation automatique des preuves" : "Full payment - Automatic proof validation"}
            </span>
          </div>
        )}
      </div>

      {/* Bouton de confirmation */}
      <div className="pt-2">
        <button
          onClick={handleConfirm}
          disabled={processing}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white text-sm font-semibold rounded-md hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <span className="animate-spin">⏳</span>
              {t.envoi}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {t.confirmerEnvoi}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

