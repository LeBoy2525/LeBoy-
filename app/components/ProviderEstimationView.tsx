"use client";

import { useState, useEffect } from "react";
import { Calculator, CheckCircle2, X, MessageSquare } from "lucide-react";
import type { Mission } from "@/lib/types";
import { MissionChat } from "./MissionChat";

interface ProviderEstimationViewProps {
  mission: Mission;
  lang?: "fr" | "en";
  onDevisGenerated: () => void;
}

const TEXT = {
  fr: {
    title: "Estimation du prestataire",
    montantPrestataire: "Montant prestataire",
    delais: "Délais estimés",
    heures: "heures",
    note: "Note / Commentaire",
    fraisExternes: "Frais externes",
    aucunCommentaire: "Aucun commentaire",
    appliquerFraisICD: "Appliquer les frais LeBoy",
    pourcentageMarge: "Pourcentage marge LeBoy (%)",
    pourcentageMargePlaceholder: "Ex: 15 ou 20",
    fraisSupplementaires: "Frais supplémentaires (optionnel, FCFA)",
    fraisSupplementairesPlaceholder: "Frais supplémentaires si nécessaire",
    calculer: "Calculer",
    recap: "Récapitulatif",
    montantPrestataireLabel: "Montant prestataire",
    margeICD: "Marge LeBoy",
    fraisSuppl: "Frais supplémentaires",
    prixTotalClient: "Prix total client TTC",
    confirmerEnvoi: "Confirmer l'acceptation & envoyer au client",
    envoi: "Envoi en cours...",
    required: "Ce champ est requis",
    invalidNumber: "Veuillez entrer un nombre valide entre 15 et 20",
    invalidFrais: "Veuillez entrer un nombre valide supérieur ou égal à 0",
  },
  en: {
    title: "Provider estimation",
    montantPrestataire: "Provider amount",
    delais: "Estimated delays",
    heures: "hours",
    note: "Note / Comment",
    fraisExternes: "External fees",
    aucunCommentaire: "No comment",
    appliquerFraisICD: "Apply LeBoy fees",
    pourcentageMarge: "LeBoy margin percentage (%)",
    pourcentageMargePlaceholder: "Ex: 15 or 20",
    fraisSupplementaires: "Additional fees (optional, FCFA)",
    fraisSupplementairesPlaceholder: "Additional fees if necessary",
    calculer: "Calculate",
    recap: "Summary",
    montantPrestataireLabel: "Provider amount",
    margeICD: "LeBoy margin",
    fraisSuppl: "Additional fees",
    prixTotalClient: "Total client price (incl. tax)",
    confirmerEnvoi: "Confirm acceptance & send to client",
    envoi: "Sending...",
    required: "This field is required",
    invalidNumber: "Please enter a valid number between 15 and 20",
    invalidFrais: "Please enter a valid number greater than or equal to 0",
  },
} as const;

export function ProviderEstimationView({
  mission,
  lang = "fr",
  onDevisGenerated,
}: ProviderEstimationViewProps) {
  const t = TEXT[lang];
  const [showApplyFees, setShowApplyFees] = useState(false);
  const [margeICD, setMargeICD] = useState("");
  const [fraisSupplementaires, setFraisSupplementaires] = useState("");
  const [calculated, setCalculated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [devisSent, setDevisSent] = useState(false); // État pour masquer immédiatement après envoi
  const [showChat, setShowChat] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  // Charger l'email de l'utilisateur (admin)
  useEffect(() => {
    async function fetchUserEmail() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserEmail(data.user?.email || "");
        }
      } catch (err) {
        console.error("Erreur chargement email utilisateur:", err);
      }
    }
    fetchUserEmail();
  }, []);
  
  // Paiement échelonné
  const [paymentType, setPaymentType] = useState<"total" | "echelonne">("total");
  const [paymentPlan, setPaymentPlan] = useState<"50-50" | "30-30-40">("50-50"); // Plan de paiement
  const [tauxInteret, setTauxInteret] = useState("5");
  
  // Seuil pour activer le paiement échelonné (configurable, par défaut 1000€ ou équivalent)
  const SEUIL_PAIEMENT_ECHELONNE = 1000; // En devise principale (peut être configuré via variable d'environnement)

  const estimation = mission.estimationPartenaire;
  if (!estimation || devisSent || mission.devisGenere) {
    return null;
  }

  const handleCalculate = () => {
    const newErrors: Record<string, string> = {};

    if (!margeICD.trim()) {
      newErrors.margeICD = t.required;
    } else {
      const marge = parseFloat(margeICD);
      if (isNaN(marge) || marge < 15 || marge > 20) {
        newErrors.margeICD = t.invalidNumber;
      }
    }

    if (fraisSupplementaires.trim()) {
      const frais = parseFloat(fraisSupplementaires);
      if (isNaN(frais) || frais < 0) {
        newErrors.fraisSupplementaires = t.invalidFrais;
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setCalculated(true);
    }
  };

  const calculateTotals = () => {
    if (!calculated) return null;

    const marge = parseFloat(margeICD);
    const prixFournisseur = estimation.prixFournisseur;
    const commissionICD = (prixFournisseur * marge) / 100;
    const fraisSuppl = fraisSupplementaires.trim() ? parseFloat(fraisSupplementaires) : 0;
    const prixTotalClient = prixFournisseur + commissionICD + fraisSuppl;

      // Calcul du paiement échelonné si choisi et si montant > seuil
      let paiementEchelonne = undefined;
      const montantEnDevise = prixTotalClient / 1; // Conversion si nécessaire (ajuster selon votre taux de change)
      
      if (paymentType === "echelonne" && montantEnDevise > SEUIL_PAIEMENT_ECHELONNE) {
        const taux = parseFloat(tauxInteret) || 0;
        
        // Définir les tranches selon le plan choisi
        let tranches: { pourcentage: number; montant: number }[] = [];
        let nbTranches = 2;
        
        if (paymentPlan === "50-50") {
          tranches = [
            { pourcentage: 50, montant: prixTotalClient * 0.5 },
            { pourcentage: 50, montant: prixTotalClient * 0.5 },
          ];
          nbTranches = 2;
        } else if (paymentPlan === "30-30-40") {
          tranches = [
            { pourcentage: 30, montant: prixTotalClient * 0.3 },
            { pourcentage: 30, montant: prixTotalClient * 0.3 },
            { pourcentage: 40, montant: prixTotalClient * 0.4 },
          ];
          nbTranches = 3;
        }
        
        // Calcul des intérêts (intérêts simples : taux annuel appliqué au montant pour la durée totale)
        const dureeMois = nbTranches; // Durée en mois (chaque tranche = 1 mois)
        const interets = (prixTotalClient * taux * dureeMois) / (100 * 12);
        const totalAvecInterets = prixTotalClient + interets;
        
        // Répartir les intérêts proportionnellement sur chaque tranche
        const montantsAvecInterets = tranches.map((tranche) => {
          const interetsProportionnels = (interets * tranche.pourcentage) / 100;
          return Math.ceil(tranche.montant + interetsProportionnels);
        });
        
        // Générer les dates d'échéance (une tranche par mois à partir d'aujourd'hui)
        const datesEcheances: string[] = [];
        const now = new Date();
        for (let i = 0; i < nbTranches; i++) {
          const dateEcheance = new Date(now);
          dateEcheance.setMonth(dateEcheance.getMonth() + i + 1); // +1 car le paiement commence le mois suivant
          datesEcheances.push(dateEcheance.toISOString());
        }

        paiementEchelonne = {
          type: "echelonne" as const,
          plan: paymentPlan,
          nombreTranches: nbTranches,
          tauxInteret: taux,
          montantsParTranche: montantsAvecInterets, // Tableau des montants par tranche
          pourcentagesParTranche: tranches.map((t) => t.pourcentage),
          datesEcheances,
          totalAvecInterets: Math.round(totalAvecInterets),
        };
      }

    return {
      prixFournisseur,
      commissionICD,
      fraisSuppl,
      prixTotalClient,
      margeICD: marge,
      paiementEchelonne,
    };
  };

  const totals = calculateTotals();

  const handleConfirm = async () => {
    if (!totals) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/missions/${mission.id}/generate-devis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          margeICD: totals.margeICD,
          fraisSupplementaires: totals.fraisSuppl > 0 ? totals.fraisSuppl : undefined,
          paiementEchelonne: totals.paiementEchelonne,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Masquer immédiatement la section avant de recharger
        setDevisSent(true);
        setShowApplyFees(false);
        setCalculated(false);
        setMargeICD("");
        setFraisSupplementaires("");
        
        // Appeler le callback pour recharger les données
        onDevisGenerated();
        
        alert(
          lang === "fr"
            ? "✅ Devis généré et envoyé au client avec succès !"
            : "✅ Invoice generated and sent to client successfully!"
        );
      } else {
        alert(data.error || (lang === "fr" ? "Erreur lors de la génération du devis" : "Error generating invoice"));
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(lang === "fr" ? "Erreur lors de la génération du devis" : "Error generating invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-blue-900">
          {t.title}
        </h3>
        <div className="flex gap-2">
          {/* Bouton Chat */}
          {currentUserEmail && !showApplyFees && (
            <button
              onClick={() => setShowChat(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8A55F] text-white text-sm font-semibold rounded-md hover:bg-[#B8944F] transition"
              title={lang === "fr" ? "Écrire au prestataire" : "Write to provider"}
            >
              <MessageSquare className="w-4 h-4" />
              {lang === "fr" ? "Chat" : "Chat"}
            </button>
          )}
          {!showApplyFees && (
            <button
              onClick={() => setShowApplyFees(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A657] text-white text-sm font-semibold rounded-md hover:bg-[#B8944F] transition"
            >
              <Calculator className="w-4 h-4" />
              {t.appliquerFraisICD}
            </button>
          )}
        </div>
      </div>

      {/* Affichage de l'estimation */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-blue-700 mb-1">{t.montantPrestataire}</p>
          <p className="text-lg font-semibold text-blue-900">
            {estimation.prixFournisseur.toLocaleString()} FCFA
          </p>
        </div>
        <div>
          <p className="text-xs text-blue-700 mb-1">{t.delais}</p>
          <p className="text-lg font-semibold text-blue-900">
            {estimation.delaisEstimes} {t.heures}
          </p>
        </div>
        {estimation.fraisExternes && estimation.fraisExternes > 0 && (
          <div>
            <p className="text-xs text-blue-700 mb-1">{t.fraisExternes}</p>
            <p className="text-lg font-semibold text-blue-900">
              {estimation.fraisExternes.toLocaleString()} FCFA
            </p>
          </div>
        )}
      </div>

      {estimation.noteExplication && (
        <div>
          <p className="text-xs text-blue-700 mb-1">{t.note}</p>
          <p className="text-sm text-blue-900 bg-blue-100 p-3 rounded-md">
            {estimation.noteExplication}
          </p>
        </div>
      )}

      {/* Formulaire d'application des frais LeBoy */}
      {showApplyFees && (
        <div className="mt-6 pt-6 border-t border-blue-300 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-semibold text-blue-900">
              {lang === "fr" ? "Application des frais LeBoy" : "Apply LeBoy fees"}
            </h4>
            <button
              onClick={() => {
                setShowApplyFees(false);
                setCalculated(false);
                setMargeICD("");
                setFraisSupplementaires("");
                setErrors({});
              }}
              className="text-blue-700 hover:text-blue-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                {t.pourcentageMarge} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={margeICD}
                onChange={(e) => {
                  setMargeICD(e.target.value);
                  if (errors.margeICD) {
                    setErrors((prev) => ({ ...prev, margeICD: "" }));
                  }
                  setCalculated(false);
                }}
                placeholder={t.pourcentageMargePlaceholder}
                min="15"
                max="20"
                step="0.1"
                className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A657] ${
                  errors.margeICD ? "border-red-500" : "border-blue-300"
                }`}
                disabled={submitting || calculated}
              />
              {errors.margeICD && (
                <p className="text-xs text-red-500 mt-1">{errors.margeICD}</p>
              )}
              <p className="text-xs text-blue-700 mt-1">
                {lang === "fr"
                  ? "La marge LeBoy doit être entre 15% et 20%"
                  : "LeBoy margin must be between 15% and 20%"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                {t.fraisSupplementaires}
              </label>
              <input
                type="number"
                value={fraisSupplementaires}
                onChange={(e) => {
                  setFraisSupplementaires(e.target.value);
                  if (errors.fraisSupplementaires) {
                    setErrors((prev) => ({ ...prev, fraisSupplementaires: "" }));
                  }
                  setCalculated(false);
                }}
                placeholder={t.fraisSupplementairesPlaceholder}
                min="0"
                step="0.01"
                className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A657] ${
                  errors.fraisSupplementaires ? "border-red-500" : "border-blue-300"
                }`}
                disabled={submitting || calculated}
              />
              {errors.fraisSupplementaires && (
                <p className="text-xs text-red-500 mt-1">{errors.fraisSupplementaires}</p>
              )}
            </div>
          </div>

          {!calculated && (
            <div className="flex justify-end">
              <button
                onClick={handleCalculate}
                disabled={submitting}
                className="px-6 py-2 bg-[#D4A657] text-white text-sm font-semibold rounded-md hover:bg-[#B8944F] transition disabled:opacity-50"
              >
                {t.calculer}
              </button>
            </div>
          )}

          {/* Récapitulatif après calcul */}
          {calculated && totals && (
            <div className="bg-white border border-blue-300 rounded-lg p-4 space-y-3">
              <h5 className="font-heading font-semibold text-blue-900 mb-3">{t.recap}</h5>

              <div className="flex justify-between text-sm">
                <span className="text-blue-700">{t.montantPrestataireLabel}:</span>
                <span className="font-semibold text-blue-900">
                  {totals.prixFournisseur.toLocaleString()} FCFA
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-blue-700">{t.margeICD} ({totals.margeICD}%):</span>
                <span className="font-semibold text-blue-900">
                  {totals.commissionICD.toLocaleString(undefined, { maximumFractionDigits: 2 })} FCFA
                </span>
              </div>

              {totals.fraisSuppl > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">{t.fraisSuppl}:</span>
                  <span className="font-semibold text-blue-900">
                    {totals.fraisSuppl.toLocaleString()} FCFA
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-blue-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-heading font-semibold text-blue-900">
                    {t.prixTotalClient}:
                  </span>
                  <span className="font-heading text-xl font-bold text-[#D4A657]">
                    {totals.prixTotalClient.toLocaleString(undefined, { maximumFractionDigits: 2 })} FCFA
                  </span>
                </div>

                {/* Options de paiement */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <label className="block text-sm font-semibold text-blue-900">
                    {lang === "fr" ? "Mode de paiement" : "Payment method"}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value="total"
                        checked={paymentType === "total"}
                        onChange={(e) => {
                          setPaymentType(e.target.value as "total" | "echelonne");
                          if (calculated) setCalculated(false);
                        }}
                        className="w-4 h-4 text-[#D4A657] border-blue-300 focus:ring-[#D4A657]"
                      />
                      <span className="text-sm text-blue-900">
                        {lang === "fr" ? "Paiement total" : "Full payment"}
                      </span>
                    </label>
                    <label className={`flex items-center gap-2 ${(() => {
                      const montantEnDevise = totals?.prixTotalClient ? totals.prixTotalClient / 1 : 0;
                      return montantEnDevise > SEUIL_PAIEMENT_ECHELONNE ? "cursor-pointer" : "cursor-not-allowed opacity-50";
                    })()}`}>
                      <input
                        type="radio"
                        name="paymentType"
                        value="echelonne"
                        checked={paymentType === "echelonne"}
                        onChange={(e) => {
                          const montantEnDevise = totals?.prixTotalClient ? totals.prixTotalClient / 1 : 0;
                          if (montantEnDevise > SEUIL_PAIEMENT_ECHELONNE) {
                            setPaymentType(e.target.value as "total" | "echelonne");
                            if (calculated) setCalculated(false);
                          }
                        }}
                        disabled={totals ? totals.prixTotalClient / 1 <= SEUIL_PAIEMENT_ECHELONNE : true}
                        className="w-4 h-4 text-[#D4A657] border-blue-300 focus:ring-[#D4A657]"
                      />
                      <span className="text-sm text-blue-900">
                        {lang === "fr" ? "Paiement échelonné" : "Installment payment"}
                      </span>
                      {totals && totals.prixTotalClient / 1 <= SEUIL_PAIEMENT_ECHELONNE && (
                        <span className="text-xs text-blue-600">
                          ({lang === "fr" ? `Minimum ${SEUIL_PAIEMENT_ECHELONNE}€` : `Minimum ${SEUIL_PAIEMENT_ECHELONNE}€`})
                        </span>
                      )}
                    </label>
                  </div>

                  {paymentType === "echelonne" && totals && totals.prixTotalClient / 1 > SEUIL_PAIEMENT_ECHELONNE && (
                    <div className="grid md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-blue-900 mb-1">
                          {lang === "fr" ? "Plan de paiement" : "Payment plan"}
                        </label>
                        <select
                          value={paymentPlan}
                          onChange={(e) => {
                            setPaymentPlan(e.target.value as "50-50" | "30-30-40");
                            if (calculated) setCalculated(false);
                          }}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A657]"
                          disabled={submitting}
                        >
                          <option value="50-50">50% + 50% (2 tranches)</option>
                          <option value="30-30-40">30% + 30% + 40% (3 tranches)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-900 mb-1">
                          {lang === "fr" ? "Taux d'intérêt annuel (%)" : "Annual interest rate (%)"}
                        </label>
                        <input
                          type="number"
                          value={tauxInteret}
                          onChange={(e) => {
                            setTauxInteret(e.target.value);
                            if (calculated) setCalculated(false);
                          }}
                          min="0"
                          max="20"
                          step="0.5"
                          placeholder="5"
                          className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A657]"
                          disabled={submitting}
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          {lang === "fr" ? "Optionnel, appliqué si échelonné" : "Optional, applied if installment"}
                        </p>
                      </div>
                    </div>
                  )}


                  {calculated && totals.paiementEchelonne && totals.paiementEchelonne.type === "echelonne" && (
                    <div className="mt-4 pt-4 border-t border-blue-300 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">
                          {lang === "fr" ? "Montant total avec intérêts" : "Total amount with interest"}:
                        </span>
                        <span className="font-semibold text-blue-900">
                          {totals.paiementEchelonne.totalAvecInterets.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-blue-900 mb-2">
                          {lang === "fr" ? "Répartition des paiements:" : "Payment breakdown:"}
                        </p>
                        {totals.paiementEchelonne.montantsParTranche?.map((montant, idx) => (
                          <div key={idx} className="flex justify-between text-sm bg-blue-100 px-3 py-2 rounded">
                            <span className="text-blue-700">
                              {lang === "fr" ? `Tranche ${idx + 1}` : `Installment ${idx + 1}`} ({totals.paiementEchelonne?.pourcentagesParTranche?.[idx] || 0}%):
                            </span>
                            <span className="font-semibold text-green-600">
                              {montant.toLocaleString()} FCFA
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-blue-600 mt-3">
                        <p className="font-semibold mb-1">
                          {lang === "fr" ? "Dates d'échéance:" : "Due dates:"}
                        </p>
                        {totals.paiementEchelonne.datesEcheances?.map((date, idx) => (
                          <p key={idx} className="ml-2">
                            {lang === "fr" ? `Tranche ${idx + 1}` : `Installment ${idx + 1}`}:{" "}
                            {new Date(date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? t.envoi : t.confirmerEnvoi}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat modal */}
      {showChat && currentUserEmail && (
        <>
          <MissionChat
            mission={mission}
            currentUserEmail={currentUserEmail}
            currentUserRole="admin"
            lang={lang}
            initialRecipient="prestataire"
            autoOpen={true}
          />
          {/* Le chat se ferme via le bouton X dans MissionChat */}
        </>
      )}
    </div>
  );
}

