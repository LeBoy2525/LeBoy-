"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, customReason?: string) => void;
  prestataireName?: string;
  lang?: "fr" | "en";
  isProcessing?: boolean;
}

const REJECTION_REASONS = {
  fr: [
    { value: "documents_manquants", label: "Documents manquants ou incomplets" },
    { value: "documents_non_verifies", label: "Documents non vérifiables ou invalides" },
    { value: "preuves_insuffisantes", label: "Preuves d'expérience insuffisantes" },
    { value: "competences_insuffisantes", label: "Compétences ne correspondent pas aux critères" },
    { value: "informations_incompletes", label: "Informations du profil incomplètes" },
    { value: "autre", label: "Autre raison" },
  ],
  en: [
    { value: "documents_manquants", label: "Missing or incomplete documents" },
    { value: "documents_non_verifies", label: "Unverifiable or invalid documents" },
    { value: "preuves_insuffisantes", label: "Insufficient proof of experience" },
    { value: "competences_insuffisantes", label: "Skills do not meet criteria" },
    { value: "informations_incompletes", label: "Incomplete profile information" },
    { value: "autre", label: "Other reason" },
  ],
};

export function RejectReasonModal({
  isOpen,
  onClose,
  onConfirm,
  prestataireName,
  lang = "fr",
  isProcessing = false,
}: RejectReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  if (!isOpen) return null;

  const reasons = REJECTION_REASONS[lang];
  const showCustomInput = selectedReason === "autre";

  const handleConfirm = () => {
    if (!selectedReason) {
      alert(lang === "fr" ? "Veuillez sélectionner une raison de rejet" : "Please select a rejection reason");
      return;
    }

    if (showCustomInput && !customReason.trim()) {
      alert(lang === "fr" ? "Veuillez préciser la raison de rejet" : "Please specify the rejection reason");
      return;
    }

    const reasonText = showCustomInput
      ? customReason.trim()
      : reasons.find((r) => r.value === selectedReason)?.label || selectedReason;

    // Utiliser setTimeout pour éviter de bloquer l'UI
    setTimeout(() => {
      onConfirm(selectedReason, reasonText);
    }, 0);
    
    // Reset form
    setSelectedReason("");
    setCustomReason("");
  };

  const handleCancel = () => {
    if (isProcessing) return; // Empêcher la fermeture pendant le traitement
    setSelectedReason("");
    setCustomReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-[#0A1B2A]">
              {lang === "fr" ? "Raison du rejet" : "Rejection Reason"}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-[#6B7280] hover:text-[#0A1B2A] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {prestataireName && (
          <p className="text-sm text-[#6B7280] mb-4">
            {lang === "fr" 
              ? `Rejeter la candidature de ${prestataireName} ?`
              : `Reject ${prestataireName}'s application?`
            }
          </p>
        )}

        <div className="space-y-3 mb-4">
          <label className="block text-sm font-semibold text-[#0A1B2A] mb-2">
            {lang === "fr" ? "Sélectionnez la raison du rejet :" : "Select the rejection reason:"}
          </label>
          
          {reasons.map((reason) => (
            <label
              key={reason.value}
              className="flex items-start gap-3 p-3 border border-[#DDDDDD] rounded-lg hover:bg-gray-50 cursor-pointer transition"
            >
              <input
                type="radio"
                name="rejectionReason"
                value={reason.value}
                checked={selectedReason === reason.value}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="mt-1 w-4 h-4 text-red-600 border-2 border-[#DDDDDD] focus:ring-red-500 focus:ring-2 cursor-pointer"
              />
              <span className="flex-1 text-sm text-[#0A1B2A]">{reason.label}</span>
            </label>
          ))}
        </div>

        {showCustomInput && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-[#0A1B2A] mb-2">
              {lang === "fr" ? "Précisez la raison :" : "Specify the reason:"}
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={lang === "fr" ? "Décrivez la raison du rejet..." : "Describe the rejection reason..."}
              className="w-full px-3 py-2 border border-[#DDDDDD] rounded-lg focus:outline-none focus:border-[#0A1B2A] resize-none"
              rows={3}
            />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-[#DDDDDD]">
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 text-sm font-semibold text-[#0A1B2A] bg-gray-100 hover:bg-gray-200 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {lang === "fr" ? "Annuler" : "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing 
              ? (lang === "fr" ? "Traitement..." : "Processing...")
              : (lang === "fr" ? "Confirmer le rejet" : "Confirm Rejection")
            }
          </button>
        </div>
      </div>
    </div>
  );
}

