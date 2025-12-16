"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, AlertCircle, Activity, TrendingUp, FileText, DollarSign, Send, PlayCircle } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import type { Mission, MissionUpdate, ExecutionPhase } from "@/lib/types";

interface ProviderActivityTrackerProps {
  mission: Mission;
  lang?: "fr" | "en";
  onRefresh?: () => void;
}

const TEXT = {
  fr: {
    title: "Suivi des actions du prestataire",
    subtitle: "Historique des actions et prochaines étapes attendues",
    lastActivity: "Dernière activité",
    nextSteps: "Prochaines étapes attendues",
    currentPhase: "Phase en cours",
    noActivity: "Aucune activité récente",
    actionEstimation: "Estimation soumise",
    actionTakeover: "Prise en charge",
    actionPhaseCompleted: "Phase complétée",
    actionProofUploaded: "Preuve uploadée",
    actionValidationSubmitted: "Validation soumise",
    actionMessage: "Message envoyé",
    expectedAction: "Action attendue",
    overdue: "En retard",
    onTime: "Dans les temps",
    progress: "Progression",
    phases: "Phases d'exécution",
    updates: "Mises à jour récentes",
    noPhases: "Aucune phase définie",
    noUpdates: "Aucune mise à jour",
    timeAgo: "il y a",
    minutes: "min",
    hours: "h",
    days: "j",
  },
  en: {
    title: "Provider activity tracking",
    subtitle: "Action history and expected next steps",
    lastActivity: "Last activity",
    nextSteps: "Expected next steps",
    currentPhase: "Current phase",
    noActivity: "No recent activity",
    actionEstimation: "Estimation submitted",
    actionTakeover: "Mission taken over",
    actionPhaseCompleted: "Phase completed",
    actionProofUploaded: "Proof uploaded",
    actionValidationSubmitted: "Validation submitted",
    actionMessage: "Message sent",
    expectedAction: "Expected action",
    overdue: "Overdue",
    onTime: "On time",
    progress: "Progress",
    phases: "Execution phases",
    updates: "Recent updates",
    noPhases: "No phases defined",
    noUpdates: "No updates",
    timeAgo: "ago",
    minutes: "min",
    hours: "h",
    days: "d",
  },
} as const;

function formatTimeAgo(date: string, lang: "fr" | "en"): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const t = TEXT[lang];
  
  if (diffMins < 1) return lang === "fr" ? "À l'instant" : "Just now";
  if (diffMins < 60) return `${diffMins} ${t.minutes} ${t.timeAgo}`;
  if (diffHours < 24) return `${diffHours} ${t.hours} ${t.timeAgo}`;
  return `${diffDays} ${t.days} ${t.timeAgo}`;
}

function getActionTypeFromUpdate(update: MissionUpdate, lang: "fr" | "en"): string {
  const t = TEXT[lang];
  
  if (update.type === "status_change") {
    if (update.content.includes("PROVIDER_ESTIMATED")) return t.actionEstimation;
    if (update.content.includes("IN_PROGRESS")) return t.actionTakeover;
    if (update.content.includes("PROVIDER_VALIDATION_SUBMITTED")) return t.actionValidationSubmitted;
  }
  if (update.type === "photo" || update.type === "document") return t.actionProofUploaded;
  if (update.type === "message") return t.actionMessage;
  
  return update.content.substring(0, 50);
}

function getExpectedNextAction(mission: Mission, lang: "fr" | "en"): { action: string; deadline?: string; overdue?: boolean } | null {
  const t = TEXT[lang];
  
  switch (mission.internalState) {
    case "ASSIGNED_TO_PROVIDER":
      return {
        action: lang === "fr" 
          ? "Le prestataire doit soumettre une estimation"
          : "Provider must submit an estimation",
        deadline: mission.dateLimiteProposition,
        overdue: mission.dateLimiteProposition ? new Date(mission.dateLimiteProposition) < new Date() : false,
      };
    case "ADVANCE_SENT":
      return {
        action: lang === "fr"
          ? "Le prestataire doit cliquer sur 'Prise en charge'"
          : "Provider must click 'Take charge'",
      };
    case "IN_PROGRESS":
      if (mission.phases && mission.phases.length > 0) {
        const nextPhase = mission.phases.find(p => !p.completed);
        if (nextPhase) {
          return {
            action: lang === "fr"
              ? `Compléter la phase : ${nextPhase.nom}`
              : `Complete phase: ${nextPhase.nom}`,
            deadline: nextPhase.dateLimite,
            overdue: nextPhase.dateLimite ? new Date(nextPhase.dateLimite) < new Date() : false,
          };
        }
      }
      return {
        action: lang === "fr"
          ? "Le prestataire doit soumettre les preuves d'accomplissement"
          : "Provider must submit proof of completion",
        deadline: mission.dateLimiteMission,
        overdue: mission.dateLimiteMission ? new Date(mission.dateLimiteMission) < new Date() : false,
      };
    case "PROVIDER_VALIDATION_SUBMITTED":
      return {
        action: lang === "fr"
          ? "En attente de validation par l'admin"
          : "Awaiting admin validation",
      };
    default:
      return null;
  }
}

export function ProviderActivityTracker({ mission, lang = "fr", onRefresh }: ProviderActivityTrackerProps) {
  const t = TEXT[lang];
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh toutes les 30 secondes si activé
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;
    
    const interval = setInterval(() => {
      onRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  // Filtrer les mises à jour du prestataire
  const providerUpdates = (mission.updates || []).filter(
    (u) => u.author === "prestataire"
  ).slice(-10).reverse(); // 10 dernières, les plus récentes en premier

  // Dernière activité
  const lastActivity = providerUpdates[0];
  const lastActivityDate = lastActivity?.createdAt || mission.datePriseEnCharge || mission.dateAcceptation || mission.dateAssignation;

  // Prochaine action attendue
  const expectedAction = getExpectedNextAction(mission, lang);

  // Phases en cours
  const currentPhases = mission.phases?.filter(p => !p.completed) || [];
  const completedPhases = mission.phases?.filter(p => p.completed) || [];

  return (
    <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-[#0A1B2A] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#D4A657]" />
            {t.title}
          </h3>
          <p className="text-xs text-[#6B7280] mt-1">{t.subtitle}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-[#6B7280] cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <span>{lang === "fr" ? "Actualisation auto" : "Auto refresh"}</span>
        </label>
      </div>

      {/* Barre de progression globale */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">{t.progress}</span>
          <span className="font-semibold text-[#0A1B2A]">{mission.currentProgress || 0}%</span>
        </div>
        <div className="w-full bg-[#E2E2E8] rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D4A657] to-[#C8A55F] transition-all duration-500 ease-out"
            style={{ width: `${mission.currentProgress || 0}%` }}
          />
        </div>
      </div>

      {/* Dernière activité */}
      {lastActivityDate && (
        <div className="p-4 bg-[#F9F9FB] border border-[#E2E2E8] rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4A657]/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[#D4A657]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#0A1B2A]">{t.lastActivity}</p>
              {lastActivity && (
                <p className="text-xs text-[#6B7280] mt-1">
                  {getActionTypeFromUpdate(lastActivity, lang)}
                </p>
              )}
              <p className="text-xs text-[#9CA3AF] mt-1">
                {formatTimeAgo(lastActivityDate, lang)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prochaine action attendue */}
      {expectedAction && (
        <div className={`p-4 border rounded-lg ${
          expectedAction.overdue 
            ? "bg-red-50 border-red-200" 
            : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              expectedAction.overdue 
                ? "bg-red-100" 
                : "bg-blue-100"
            }`}>
              {expectedAction.overdue ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <PlayCircle className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#0A1B2A]">{t.expectedAction}</p>
              <p className="text-xs text-[#4B4F58] mt-1">{expectedAction.action}</p>
              {expectedAction.deadline && (
                <p className={`text-xs mt-1 ${
                  expectedAction.overdue ? "text-red-600 font-semibold" : "text-[#6B7280]"
                }`}>
                  {expectedAction.overdue ? t.overdue : t.onTime} • {lang === "fr" ? "Échéance" : "Deadline"}: {new Date(expectedAction.deadline).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phases d'exécution */}
      {mission.phases && mission.phases.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[#0A1B2A] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4A657]" />
            {t.phases}
          </h4>
          <div className="space-y-2">
            {mission.phases
              .sort((a, b) => a.ordre - b.ordre)
              .map((phase) => (
                <div
                  key={phase.id}
                  className={`p-3 border rounded-lg ${
                    phase.completed
                      ? "bg-green-50 border-green-200"
                      : phase.retard
                      ? "bg-red-50 border-red-200"
                      : "bg-[#F9F9FB] border-[#E2E2E8]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {phase.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-[#D4A657] rounded-full flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${
                          phase.completed ? "text-green-800" : phase.retard ? "text-red-800" : "text-[#0A1B2A]"
                        }`}>
                          {phase.nom}
                        </p>
                        {phase.description && (
                          <p className="text-xs text-[#6B7280] mt-0.5">{phase.description}</p>
                        )}
                        {phase.dateLimite && (
                          <p className={`text-xs mt-1 ${
                            phase.retard ? "text-red-600 font-semibold" : "text-[#9CA3AF]"
                          }`}>
                            {lang === "fr" ? "Échéance" : "Deadline"}: {new Date(phase.dateLimite).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                            {phase.retard && ` • ${t.overdue}`}
                          </p>
                        )}
                        {phase.completedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            {lang === "fr" ? "Complétée le" : "Completed on"} {new Date(phase.completedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <div className="text-xs text-[#6B7280] pt-2 border-t border-[#E2E2E8]">
            {completedPhases.length} / {mission.phases.length} {lang === "fr" ? "phases complétées" : "phases completed"}
          </div>
        </div>
      )}

      {/* Timeline des actions récentes */}
      {providerUpdates.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[#0A1B2A] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4A657]" />
            {t.updates}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {providerUpdates.map((update, index) => (
              <div
                key={update.id}
                className="flex items-start gap-3 p-2 hover:bg-[#F9F9FB] rounded-lg transition"
              >
                <div className="w-2 h-2 rounded-full bg-[#D4A657] mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#0A1B2A]">
                    {getActionTypeFromUpdate(update, lang)}
                  </p>
                  {update.content && update.type !== "status_change" && (
                    <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">
                      {update.content}
                    </p>
                  )}
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    {formatTimeAgo(update.createdAt, lang)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {providerUpdates.length === 0 && (
        <div className="text-center py-8 text-xs text-[#6B7280]">
          {t.noUpdates}
        </div>
      )}
    </div>
  );
}

