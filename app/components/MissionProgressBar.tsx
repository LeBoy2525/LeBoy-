"use client";

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { Mission, MissionProgress, ClientMissionStatus } from "@/lib/types";
import { mapStatusToClient, mapInternalStateToStatus, getProgressFromInternalState } from "@/lib/types";

interface MissionProgressBarProps {
  mission: Mission;
  lang?: "fr" | "en";
  compact?: boolean; // Pour l'affichage dans la liste
}

const TEXT = {
  fr: {
    progression: "Progression",
    analyse: "En analyse",
    evaluation: "En évaluation",
    attentePaiement: "En attente de paiement",
    enCours: "En cours",
    terminee: "Terminée",
    retard: "Retard",
    enRetard: "En retard",
  },
  en: {
    progression: "Progress",
    analyse: "Under review",
    evaluation: "Under evaluation",
    attentePaiement: "Awaiting payment",
    enCours: "In progress",
    terminee: "Completed",
    retard: "Delay",
    enRetard: "Delayed",
  },
} as const;

export function MissionProgressBar({ mission, lang = "fr", compact = false }: MissionProgressBarProps) {
  const t = TEXT[lang];
  const progressHistory = mission.progress || [];
  
  // Obtenir le statut client simplifié en utilisant internalState pour un mapping précis
  const clientStatus = mapStatusToClient(mission.status || mapInternalStateToStatus(mission.internalState || "CREATED"), mission.internalState);
  
  // Calculer dynamiquement le pourcentage de progression basé sur internalState
  // Utiliser getProgressFromInternalState pour avoir une valeur toujours à jour
  const calculatedProgress = getProgressFromInternalState(mission.internalState || "CREATED");
  // Utiliser currentProgress si disponible et plus récent, sinon utiliser le calcul
  const progress = mission.currentProgress !== undefined && mission.currentProgress >= calculatedProgress 
    ? mission.currentProgress 
    : calculatedProgress;

  // Déterminer les étapes simplifiées pour le client
  const etapes = [
    { key: "analyse", label: t.analyse, pourcentage: 10, internalStates: ["CREATED"] },
    { key: "evaluation", label: t.evaluation, pourcentage: 30, internalStates: ["ASSIGNED_TO_PROVIDER", "PROVIDER_ESTIMATED"] },
    { key: "attentePaiement", label: t.attentePaiement, pourcentage: 50, internalStates: ["WAITING_CLIENT_PAYMENT", "PAID_WAITING_TAKEOVER", "ADVANCE_SENT"] },
    { key: "en_cours", label: t.enCours, pourcentage: 80, internalStates: ["IN_PROGRESS", "PROVIDER_VALIDATION_SUBMITTED"] },
    { key: "terminee", label: t.terminee, pourcentage: 100, internalStates: ["ADMIN_CONFIRMED", "COMPLETED"] },
  ];
  
  // Déterminer quelles étapes sont complétées basées sur internalState
  const currentInternalState = mission.internalState || "CREATED";
  const getCompletedSteps = (): string[] => {
    const completed: string[] = [];
    
    // Analyse : complétée si on a dépassé CREATED
    if (currentInternalState !== "CREATED") {
      completed.push("analyse");
    }
    
    // Évaluation : complétée si on a dépassé ASSIGNED_TO_PROVIDER
    if (["PROVIDER_ESTIMATED", "WAITING_CLIENT_PAYMENT", "PAID_WAITING_TAKEOVER", "ADVANCE_SENT", "IN_PROGRESS", "PROVIDER_VALIDATION_SUBMITTED", "ADMIN_CONFIRMED", "COMPLETED"].includes(currentInternalState)) {
      completed.push("evaluation");
    }
    
    // Attente paiement : complétée si on a dépassé WAITING_CLIENT_PAYMENT
    if (["PAID_WAITING_TAKEOVER", "ADVANCE_SENT", "IN_PROGRESS", "PROVIDER_VALIDATION_SUBMITTED", "ADMIN_CONFIRMED", "COMPLETED"].includes(currentInternalState)) {
      completed.push("attentePaiement");
    }
    
    // En cours : complétée si on a dépassé IN_PROGRESS
    if (["PROVIDER_VALIDATION_SUBMITTED", "ADMIN_CONFIRMED", "COMPLETED"].includes(currentInternalState)) {
      completed.push("en_cours");
    }
    
    // Terminée : complétée si ADMIN_CONFIRMED ou COMPLETED
    if (["ADMIN_CONFIRMED", "COMPLETED"].includes(currentInternalState)) {
      completed.push("terminee");
    }
    
    return completed;
  };
  
  const completedSteps = getCompletedSteps();
  
  // Trouver l'étape actuelle
  const getCurrentStep = (): string => {
    if (completedSteps.includes("terminee")) return "terminee";
    if (completedSteps.includes("en_cours")) return "en_cours";
    if (completedSteps.includes("attentePaiement")) return "attentePaiement";
    if (completedSteps.includes("evaluation")) return "evaluation";
    return "analyse";
  };
  
  const currentStepKey = getCurrentStep();
  const currentEtapeIndex = etapes.findIndex((e) => e.key === currentStepKey);

  // Vérifier les retards
  const hasRetard = progressHistory.some((p) => p.retard === true);

  if (compact) {
    // Version compacte pour la liste
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">{t.progression}</span>
          <span className="font-semibold text-[#0A1B2A]">{progress}%</span>
        </div>
        <div className="w-full bg-[#E2E2E8] rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              hasRetard ? "bg-red-500" : progress >= 75 ? "bg-green-500" : progress >= 50 ? "bg-blue-500" : "bg-yellow-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {hasRetard && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span>{t.enRetard}</span>
          </div>
        )}
      </div>
    );
  }

  // Version complète pour la page de détail
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-[#0A1B2A]">{t.progression}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#0A1B2A]">{progress}%</span>
          {hasRetard && (
            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              <span>{t.enRetard}</span>
            </div>
          )}
        </div>
      </div>

      {/* Barre de progression principale */}
      <div className="w-full bg-[#E2E2E8] rounded-full h-3 relative overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all ${
            hasRetard ? "bg-red-500" : progress >= 75 ? "bg-green-500" : progress >= 50 ? "bg-blue-500" : "bg-yellow-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Étapes détaillées */}
      <div className="grid grid-cols-5 gap-2">
        {etapes.map((etape, index) => {
          // Déterminer si l'étape est complétée basée sur internalState
          const isCompleted = completedSteps.includes(etape.key);
          const isCurrent = etape.key === currentStepKey && !isCompleted && currentEtapeIndex < 4; // "Terminée" n'est jamais "en cours", elle est complétée
          const isFuture = !isCompleted && !isCurrent;
          // Vérifier les retards dans l'historique de progression
          const etapeProgress = progressHistory.find((p) => p.etape === etape.key);
          const isRetard = etapeProgress?.retard === true;

          return (
            <div
              key={etape.key}
              className={`text-center p-2 rounded-lg border-2 transition ${
                isCompleted
                  ? isRetard
                    ? "border-red-300 bg-red-50"
                    : "border-green-300 bg-green-50"
                  : isCurrent
                  ? "border-blue-300 bg-blue-50"
                  : "border-[#E2E2E8] bg-[#F9F9FB]"
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {isCompleted ? (
                  isRetard ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 text-blue-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-[#DDDDDD]" />
                )}
              </div>
              <p className="text-xs font-medium text-[#0A1B2A]">{etape.label}</p>
              {(etapeProgress?.date || (isCompleted && mission.createdAt)) && (
                <p className="text-[10px] text-[#6B7280] mt-1">
                  {new Date(etapeProgress?.date || mission.createdAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Commentaires de progression */}
      {progressHistory.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#E2E2E8]">
          {progressHistory
            .filter((p) => p.commentaire)
            .map((p, index) => (
              <div
                key={index}
                className={`text-xs p-2 rounded ${
                  p.retard ? "bg-red-50 text-red-800 border border-red-200" : "bg-blue-50 text-blue-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {p.retard && <AlertTriangle className="w-3 h-3" />}
                  <span className="font-medium">{etapes.find((e) => e.key === p.etape)?.label}</span>
                  {p.date && (
                    <span className="text-[10px] opacity-75">
                      {new Date(p.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                {p.commentaire && <p className="mt-1">{p.commentaire}</p>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

