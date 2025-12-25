"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface EstimationFormModalProps {
  missionId: string | number; // UUID string ou number (pour compatibilité)
  lang?: "fr" | "en";
  onClose: () => void;
  onSuccess: () => void;
  isRevision?: boolean; // Indique si c'est une révision
  previousEstimation?: {
    prixFournisseur?: number;
    delaisEstimes?: number;
    noteExplication?: string;
  };
}

const TEXT = {
  fr: {
    title: "Soumettre votre estimation",
    titleRevision: "Réviser votre estimation",
    subtitle: "Remplissez les informations ci-dessous pour soumettre votre estimation",
    subtitleRevision: "Modifiez votre estimation précédente. Vous pouvez ajuster le prix, les délais ou les commentaires.",
    montantEstime: "Montant estimé (FCFA)",
    montantEstimePlaceholder: "Entrez le montant estimé",
    delaisEstimes: "Délais estimés (heures)",
    delaisEstimesPlaceholder: "Ex: 48 (pour 48 heures)",
    noteCommentaire: "Note / Commentaire",
    noteCommentairePlaceholder: "Ajoutez vos commentaires, explications ou remarques importantes...",
    fraisExternes: "Frais externes (optionnel, FCFA)",
    fraisExternesPlaceholder: "Frais supplémentaires si nécessaire",
    envoyerEstimation: "Envoyer l'estimation",
    annuler: "Annuler",
    envoi: "Envoi en cours...",
    required: "Ce champ est requis",
    invalidNumber: "Veuillez entrer un nombre valide supérieur à 0",
  },
  en: {
    title: "Submit your estimation",
    titleRevision: "Revise your estimation",
    subtitle: "Fill in the information below to submit your estimation",
    subtitleRevision: "Modify your previous estimation. You can adjust the price, delays or comments.",
    montantEstime: "Estimated amount (FCFA)",
    montantEstimePlaceholder: "Enter the estimated amount",
    delaisEstimes: "Estimated delays (hours)",
    delaisEstimesPlaceholder: "Ex: 48 (for 48 hours)",
    noteCommentaire: "Note / Comment",
    noteCommentairePlaceholder: "Add your comments, explanations or important remarks...",
    fraisExternes: "External fees (optional, FCFA)",
    fraisExternesPlaceholder: "Additional fees if necessary",
    envoyerEstimation: "Send estimation",
    annuler: "Cancel",
    envoi: "Sending...",
    required: "This field is required",
    invalidNumber: "Please enter a valid number greater than 0",
  },
} as const;

export function EstimationFormModal({
  missionId,
  lang = "fr",
  onClose,
  onSuccess,
  isRevision = false,
  previousEstimation,
}: EstimationFormModalProps) {
  const t = TEXT[lang];
  const [prixFournisseur, setPrixFournisseur] = useState(
    previousEstimation?.prixFournisseur?.toString() || ""
  );
  const [delaisEstimes, setDelaisEstimes] = useState(
    previousEstimation?.delaisEstimes?.toString() || ""
  );
  const [noteExplication, setNoteExplication] = useState(
    previousEstimation?.noteExplication || ""
  );
  const [fraisExternes, setFraisExternes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!prixFournisseur.trim()) {
      newErrors.prixFournisseur = t.required;
    } else {
      const prix = parseFloat(prixFournisseur);
      if (isNaN(prix) || prix <= 0) {
        newErrors.prixFournisseur = t.invalidNumber;
      }
    }

    if (!delaisEstimes.trim()) {
      newErrors.delaisEstimes = t.required;
    } else {
      const delais = parseFloat(delaisEstimes);
      if (isNaN(delais) || delais <= 0) {
        newErrors.delaisEstimes = t.invalidNumber;
      }
    }

    if (fraisExternes.trim()) {
      const frais = parseFloat(fraisExternes);
      if (isNaN(frais) || frais < 0) {
        newErrors.fraisExternes = t.invalidNumber;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/prestataires/espace/missions/${missionId}/estimation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prixFournisseur: parseFloat(prixFournisseur),
          delaisEstimes: parseFloat(delaisEstimes),
          noteExplication: noteExplication.trim() || undefined,
          fraisExternes: fraisExternes.trim() ? parseFloat(fraisExternes) : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert(data.error || (lang === "fr" ? "Erreur lors de l'envoi de l'estimation" : "Error sending estimation"));
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(lang === "fr" ? "Erreur lors de l'envoi de l'estimation" : "Error sending estimation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#E2E2E8]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold text-[#0A1B2A]">
                {isRevision ? t.titleRevision : t.title}
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                {isRevision ? t.subtitleRevision : t.subtitle}
              </p>
              {isRevision && previousEstimation && (
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                  <p className="font-semibold mb-1">{lang === "fr" ? "Estimation précédente:" : "Previous estimation:"}</p>
                  <p>{lang === "fr" ? "Prix:" : "Price:"} {previousEstimation.prixFournisseur?.toLocaleString()} FCFA</p>
                  <p>{lang === "fr" ? "Délais:" : "Delays:"} {previousEstimation.delaisEstimes} {lang === "fr" ? "heures" : "hours"}</p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-[#6B7280] hover:text-[#0A1B2A] transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Montant estimé */}
          <div>
            <label className="block text-sm font-medium text-[#0A1B2A] mb-2">
              {t.montantEstime} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={prixFournisseur}
              onChange={(e) => {
                setPrixFournisseur(e.target.value);
                if (errors.prixFournisseur) {
                  setErrors((prev) => ({ ...prev, prixFournisseur: "" }));
                }
              }}
              placeholder={t.montantEstimePlaceholder}
              min="0"
              step="0.01"
              className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A55F] ${
                errors.prixFournisseur ? "border-red-500" : "border-[#DDDDDD]"
              }`}
              disabled={submitting}
            />
            {errors.prixFournisseur && (
              <p className="text-xs text-red-500 mt-1">{errors.prixFournisseur}</p>
            )}
          </div>

          {/* Délais estimés */}
          <div>
            <label className="block text-sm font-medium text-[#0A1B2A] mb-2">
              {t.delaisEstimes} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={delaisEstimes}
              onChange={(e) => {
                setDelaisEstimes(e.target.value);
                if (errors.delaisEstimes) {
                  setErrors((prev) => ({ ...prev, delaisEstimes: "" }));
                }
              }}
              placeholder={t.delaisEstimesPlaceholder}
              min="1"
              step="1"
              className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A55F] ${
                errors.delaisEstimes ? "border-red-500" : "border-[#DDDDDD]"
              }`}
              disabled={submitting}
            />
            {errors.delaisEstimes && (
              <p className="text-xs text-red-500 mt-1">{errors.delaisEstimes}</p>
            )}
            <p className="text-xs text-[#6B7280] mt-1">
              {lang === "fr" 
                ? "Indiquez le nombre d'heures estimées pour compléter la mission"
                : "Indicate the estimated number of hours to complete the mission"}
            </p>
          </div>

          {/* Note / Commentaire */}
          <div>
            <label className="block text-sm font-medium text-[#0A1B2A] mb-2">
              {t.noteCommentaire}
            </label>
            <textarea
              value={noteExplication}
              onChange={(e) => setNoteExplication(e.target.value)}
              placeholder={t.noteCommentairePlaceholder}
              rows={4}
              className="w-full px-4 py-2 border border-[#DDDDDD] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A55F] resize-none"
              disabled={submitting}
            />
          </div>

          {/* Frais externes (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-[#0A1B2A] mb-2">
              {t.fraisExternes}
            </label>
            <input
              type="number"
              value={fraisExternes}
              onChange={(e) => {
                setFraisExternes(e.target.value);
                if (errors.fraisExternes) {
                  setErrors((prev) => ({ ...prev, fraisExternes: "" }));
                }
              }}
              placeholder={t.fraisExternesPlaceholder}
              min="0"
              step="0.01"
              className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A55F] ${
                errors.fraisExternes ? "border-red-500" : "border-[#DDDDDD]"
              }`}
              disabled={submitting}
            />
            {errors.fraisExternes && (
              <p className="text-xs text-red-500 mt-1">{errors.fraisExternes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E2E8]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2 border border-[#DDDDDD] text-[#4B4F58] text-sm font-semibold rounded-md hover:bg-[#F9F9FB] transition disabled:opacity-50"
            >
              {t.annuler}
            </button>
            <button
              type="submit"
              disabled={submitting || !prixFournisseur || !delaisEstimes}
              className="px-6 py-2 bg-[#C8A55F] text-white text-sm font-semibold rounded-md hover:bg-[#B8944F] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting 
                ? t.envoi 
                : (isRevision 
                  ? (lang === "fr" ? "Réviser l'estimation" : "Revise estimation")
                  : t.envoyerEstimation)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

