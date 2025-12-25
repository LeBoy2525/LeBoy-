"use client";

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { Mission, MissionProgress, ClientMissionStatus } from "@/lib/types";
import { mapStatusToClient, mapInternalStateToStatus } from "@/lib/types";

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
  const progress = mission.currentProgress || 0;
  const progressHistory = mission.progress || [];
  
  // Obtenir le statut client simplifié en utilisant internalState pour un mapping précis
  const clientStatus = mapStatusToClient(mission.status || mapInternalStateToStatus(mission.internalState || "CREATED"), mission.internalState);

  // Déterminer les étapes simplifiées pour le client
  const etapes = [
    { key: "analyse", label: t.analyse, pourcentage: 10 },
    { key: "evaluation", label: t.evaluation, pourcentage: 30 },
    { key: "attentePaiement", label: t.attentePaiement, pourcentage: 50 },
    { key: "en_cours", label: t.enCours, pourcentage: 80 },
    { key: "terminee", label: t.terminee, pourcentage: 100 },
  ];
  
  // Mapping des statuts client vers les étapes
  const getStepFromStatus = (status: ClientMissionStatus): string => {
    switch (status) {
      case "en_analyse":
        return "analyse";
      case "en_evaluation":
        return "evaluation";
      case "en_attente_paiement":
        return "attentePaiement";
      case "en_cours":
        return "en_cours";
      case "termine":
        return "terminee";
      default:
        return "analyse";
    }
  };

  // Trouver l'étape actuelle basée sur le statut client
  const currentStepKey = getStepFromStatus(clientStatus);
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
          // Déterminer si l'étape est complétée, en cours ou à venir
          // Si on est à l'étape "terminee" (index 4), toutes les étapes sont complétées
          const isCompleted = index <= currentEtapeIndex;
          const isCurrent = index === currentEtapeIndex && currentEtapeIndex < 4; // "Terminée" n'est jamais "en cours", elle est complétée
          const isFuture = index > currentEtapeIndex;
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

