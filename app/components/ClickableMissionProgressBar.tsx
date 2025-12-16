"use client";

import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";
import type { Mission } from "@/lib/types";

interface ClickableMissionProgressBarProps {
  mission: Mission;
  lang?: "fr" | "en";
  onStepClick: (step: string) => void;
}

const TEXT = {
  fr: {
    progression: "Progression de la mission",
    acceptation: "Acceptation",
    priseEnCharge: "Prise en charge",
    enCours: "En cours",
    validation: "Validation",
    terminer: "Terminer",
    etapeCompletee: "Étape complétée",
    etapeDisponible: "Cliquez pour compléter cette étape",
    etapeVerrouillee: "Complétez les étapes précédentes d'abord",
  },
  en: {
    progression: "Mission progress",
    acceptation: "Acceptance",
    priseEnCharge: "Taken in charge",
    enCours: "In progress",
    validation: "Validation",
    terminer: "Finish",
    etapeCompletee: "Step completed",
    etapeDisponible: "Click to complete this step",
    etapeVerrouillee: "Complete previous steps first",
  },
} as const;

const STEPS = [
  { key: "acceptation", labelKey: "acceptation" as const },
  { key: "prise_en_charge", labelKey: "priseEnCharge" as const },
  { key: "en_cours", labelKey: "enCours" as const },
  { key: "validation", labelKey: "validation" as const },
  { key: "terminee", labelKey: "terminer" as const },
];

export function ClickableMissionProgressBar({ 
  mission, 
  lang = "fr", 
  onStepClick 
}: ClickableMissionProgressBarProps) {
  const t = TEXT[lang];

  // Déterminer quelles étapes sont complétées basé sur l'état interne
  const isStepCompleted = (stepKey: string): boolean => {
    const state = mission.internalState || "CREATED";
    
    if (stepKey === "acceptation") {
      // Acceptation est complétée si on a dépassé ASSIGNED_TO_PROVIDER
      return state !== "CREATED" && state !== "ASSIGNED_TO_PROVIDER";
    }
    if (stepKey === "prise_en_charge") {
      // Prise en charge est complétée si on a dépassé ADVANCE_SENT (donc IN_PROGRESS ou plus)
      return state === "IN_PROGRESS" || 
             state === "PROVIDER_VALIDATION_SUBMITTED" || 
             state === "ADMIN_CONFIRMED" ||
             state === "COMPLETED";
    }
    if (stepKey === "en_cours") {
      // En cours est complétée si on est dans IN_PROGRESS ou au-delà (validation, confirmé, terminé)
      return state === "IN_PROGRESS" || 
             state === "PROVIDER_VALIDATION_SUBMITTED" ||
             state === "ADMIN_CONFIRMED" ||
             state === "COMPLETED";
    }
    if (stepKey === "validation") {
      // Validation est complétée si des preuves ont été soumises (PROVIDER_VALIDATION_SUBMITTED ou plus)
      return state === "PROVIDER_VALIDATION_SUBMITTED" || 
             state === "ADMIN_CONFIRMED" ||
             state === "COMPLETED";
    }
    if (stepKey === "terminee") {
      // Terminée est complétée si le solde est versé (ADMIN_CONFIRMED avec soldeVersee) ou si COMPLETED
      return (state === "ADMIN_CONFIRMED" && mission.soldeVersee === true) || state === "COMPLETED";
    }
    return false;
  };

  // Déterminer si une étape est débloquée (peut être cliquée)
  const isStepUnlocked = (stepKey: string): boolean => {
    const state = mission.internalState || "CREATED";
    const stepIndex = STEPS.findIndex((s) => s.key === stepKey);
    
    // La première étape (acceptation) est débloquée si dans ASSIGNED_TO_PROVIDER
    if (stepKey === "acceptation") {
      return state === "ASSIGNED_TO_PROVIDER";
    }

    // Prise en charge est débloquée si dans ADVANCE_SENT
    if (stepKey === "prise_en_charge") {
      return state === "ADVANCE_SENT";
    }

    // En cours n'est pas cliquable directement (c'est automatique après prise en charge)
    if (stepKey === "en_cours") {
      return false;
    }

    // Validation est débloquée si dans IN_PROGRESS
    if (stepKey === "validation") {
      return state === "IN_PROGRESS";
    }

    // Terminée n'est pas cliquable par le prestataire (c'est l'admin qui valide)
    if (stepKey === "terminee") {
      return false;
    }

    return false;
  };

  const handleStepClick = (stepKey: string) => {
    if (isStepUnlocked(stepKey)) {
      onStepClick(stepKey);
    } else if (!isStepCompleted(stepKey)) {
      alert(t.etapeVerrouillee);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-[#0A1B2A]">{t.progression}</h3>
        <div className="text-sm font-semibold text-[#0A1B2A]">
          {mission.currentProgress || 0}%
        </div>
      </div>

      {/* Barre de progression visuelle */}
      <div className="w-full bg-[#E2E2E8] rounded-full h-3 relative overflow-hidden">
        <div
          className="h-3 rounded-full transition-all bg-gradient-to-r from-yellow-400 via-blue-500 to-green-500"
          style={{ width: `${mission.currentProgress || 0}%` }}
        />
      </div>

      {/* Étapes cliquables */}
      <div className="flex items-center justify-between relative">
        {/* Ligne de connexion */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-[#E2E2E8] z-0" />
        <div
          className="absolute top-6 left-0 h-0.5 bg-green-500 z-10 transition-all"
          style={{
            width: `${(STEPS.filter((s) => isStepCompleted(s.key)).length / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step, index) => {
          const completed = isStepCompleted(step.key);
          const unlocked = isStepUnlocked(step.key);
          const canClick = unlocked || completed;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-20">
              <button
                type="button"
                onClick={() => handleStepClick(step.key)}
                disabled={!canClick}
                className={`flex flex-col items-center gap-2 transition-all ${
                  completed
                    ? "cursor-pointer"
                    : unlocked
                    ? "cursor-pointer hover:scale-110"
                    : "cursor-not-allowed opacity-50"
                }`}
                title={
                  completed
                    ? t.etapeCompletee
                    : unlocked
                    ? t.etapeDisponible
                    : t.etapeVerrouillee
                }
              >
                {completed ? (
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                ) : unlocked ? (
                  <div className="w-12 h-12 rounded-full bg-[#C8A55F] flex items-center justify-center shadow-md hover:bg-[#B8944F] transition">
                    <Circle className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#DDDDDD] flex items-center justify-center">
                    <Circle className="w-6 h-6 text-[#6B7280]" />
                  </div>
                )}
                <span
                  className={`text-xs font-medium text-center max-w-[80px] ${
                    completed
                      ? "text-green-600"
                      : unlocked
                      ? "text-[#C8A55F]"
                      : "text-[#6B7280]"
                  }`}
                >
                  {t[step.labelKey]}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

