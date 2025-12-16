"use client";

import { useState } from "react";
import { CreditCard, Download, CheckCircle2, FileText } from "lucide-react";
import type { Mission } from "@/lib/types";

interface ClientPaymentSectionProps {
  mission: Mission;
  lang?: "fr" | "en";
  onPaymentSuccess: () => void;
}

const TEXT = {
  fr: {
    title: "Devis et paiement",
    recap: "Récapitulatif",
    montantTotal: "Montant total à payer",
    montantPrestataire: "Montant prestataire",
    margeICD: "Commission LeBoy",
    fraisSupplementaires: "Frais supplémentaires",
    telechargerDevis: "Télécharger le devis",
    payerPourDemarrer: "Veuillez payer pour débuter la mission",
    paiement: "Payer maintenant",
    enCours: "Traitement du paiement...",
    montantAPayer: "Montant à payer",
    description: "Votre demande a été acceptée. Veuillez finaliser le paiement pour débuter la mission.",
  },
  en: {
    title: "Invoice and payment",
    recap: "Summary",
    montantTotal: "Total amount to pay",
    montantPrestataire: "Provider amount",
    margeICD: "LeBoy commission",
    fraisSupplementaires: "Additional fees",
    telechargerDevis: "Download invoice",
    payerPourDemarrer: "Please pay to start the mission",
    paiement: "Pay now",
    enCours: "Processing payment...",
    montantAPayer: "Amount to pay",
    description: "Your request has been accepted. Please finalize payment to start the mission.",
  },
} as const;

export function ClientPaymentSection({
  mission,
  lang = "fr",
  onPaymentSuccess,
}: ClientPaymentSectionProps) {
  const t = TEXT[lang];
  const [processing, setProcessing] = useState(false);

  if (!mission.tarifTotal || !mission.devisGenere) {
    return null;
  }

  const handlePayment = async () => {
    if (!confirm(lang === "fr" 
      ? `Confirmer le paiement de ${mission.tarifTotal?.toLocaleString()} FCFA ?`
      : `Confirm payment of ${mission.tarifTotal?.toLocaleString()} FCFA?`)) {
      return;
    }

    setProcessing(true);

    try {
      // TODO: Intégrer Stripe ici
      // Pour l'instant, on simule un paiement réussi avec un paymentIntentId fictif
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const res = await fetch(`/api/espace-client/missions/${mission.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethod: "card", // TODO: Récupérer depuis Stripe
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          lang === "fr"
            ? "✅ Paiement effectué avec succès ! Votre mission va débuter prochainement."
            : "✅ Payment successful! Your mission will start soon."
        );
        onPaymentSuccess();
      } else {
        alert(data.error || (lang === "fr" ? "Erreur lors du paiement" : "Payment error"));
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(lang === "fr" ? "Erreur lors du paiement" : "Payment error");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadDevis = () => {
    // Télécharger le PDF du devis
    window.open(`/api/missions/${mission.id}/devis-pdf`, "_blank");
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-green-900">
          {t.title}
        </h3>
        {mission.devisGenere && (
          <button
            onClick={handleDownloadDevis}
            className="inline-flex items-center gap-2 px-4 py-2 border border-green-300 text-green-800 text-sm font-semibold rounded-md hover:bg-green-100 transition"
          >
            <Download className="w-4 h-4" />
            {t.telechargerDevis}
          </button>
        )}
      </div>

      <p className="text-sm text-green-800">
        {t.description}
      </p>

      {/* Récapitulatif */}
      <div className="bg-white border border-green-300 rounded-lg p-4 space-y-3">
        <h4 className="font-heading font-semibold text-green-900 mb-3">{t.recap}</h4>

        {mission.tarifPrestataire && (
          <div className="flex justify-between text-sm">
            <span className="text-green-700">{t.montantPrestataire}:</span>
            <span className="font-semibold text-green-900">
              {mission.tarifPrestataire.toLocaleString()} FCFA
            </span>
          </div>
        )}

        {mission.commissionTotale ? (
          <div className="flex justify-between text-sm">
            <span className="text-green-700">{t.margeICD}:</span>
            <span className="font-semibold text-green-900">
              {mission.commissionTotale.toLocaleString(undefined, { maximumFractionDigits: 2 })} FCFA
            </span>
          </div>
        ) : mission.commissionICD ? (
          <div className="flex justify-between text-sm">
            <span className="text-green-700">{t.margeICD}:</span>
            <span className="font-semibold text-green-900">
              {mission.commissionICD.toLocaleString(undefined, { maximumFractionDigits: 2 })} FCFA
            </span>
          </div>
        ) : null}

        {mission.fraisSupplementaires && mission.fraisSupplementaires > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-700">{t.fraisSupplementaires}:</span>
            <span className="font-semibold text-green-900">
              {mission.fraisSupplementaires.toLocaleString()} FCFA
            </span>
          </div>
        )}

        <div className="pt-3 border-t border-green-200 flex justify-between items-center">
          <span className="font-heading font-semibold text-green-900">
            {t.montantTotal}:
          </span>
          <span className="font-heading text-xl font-bold text-[#D4A657]">
            {mission.tarifTotal?.toLocaleString(undefined, { maximumFractionDigits: 2 })} FCFA
          </span>
        </div>
      </div>

      {/* Bouton de paiement */}
      <div className="pt-2">
        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <span className="animate-spin">⏳</span>
              {t.enCours}
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              {t.payerPourDemarrer}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

