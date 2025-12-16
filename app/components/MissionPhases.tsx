"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2, AlertTriangle, Clock } from "lucide-react";
import type { ExecutionPhase, Mission } from "@/lib/types";

interface MissionPhasesProps {
  mission: Mission;
  currentUserRole: "prestataire" | "admin" | "client";
  lang?: "fr" | "en";
  onUpdate?: () => void;
}

const TEXT = {
  fr: {
    phasesExecution: "Temps d'exécution",
    definirPhases: "Définir les phases d'exécution",
    ajouterPhase: "Ajouter une phase",
    nomPhase: "Nom de la phase",
    descriptionPhase: "Description (optionnel)",
    enregistrer: "Enregistrer",
    annuler: "Annuler",
    phase: "Phase",
    completee: "Complétée",
    enCours: "En cours",
    cocherPhase: "Cocher cette phase comme complétée",
    decocherPhase: "Décocher cette phase",
    supprimerPhase: "Supprimer cette phase",
    aucunePhase: "Aucune phase définie",
    definirPhasesMessage: "Définissez les phases d'exécution pour cette mission",
    delaiMaximal: "Délai maximal",
    heures: "heures",
    definirDelai: "Définir le délai maximal",
    delaiDefini: "Délai maximal défini",
    noteRetard: "Note de retard",
    ajouterNoteRetard: "Ajouter une note de retard",
    enRetard: "En retard",
    voirNote: "Voir la note",
    masquerNote: "Masquer la note",
    progression: "Progression",
    phasesCompletees: "phases complétées",
    sur: "sur",
  },
  en: {
    phasesExecution: "Execution time",
    definirPhases: "Define execution phases",
    ajouterPhase: "Add phase",
    nomPhase: "Phase name",
    descriptionPhase: "Description (optional)",
    enregistrer: "Save",
    annuler: "Cancel",
    phase: "Phase",
    completee: "Completed",
    enCours: "In progress",
    cocherPhase: "Mark this phase as completed",
    decocherPhase: "Unmark this phase",
    supprimerPhase: "Delete this phase",
    aucunePhase: "No phases defined",
    definirPhasesMessage: "Define execution phases for this mission",
    delaiMaximal: "Maximum delay",
    heures: "hours",
    definirDelai: "Set maximum delay",
    delaiDefini: "Maximum delay set",
    noteRetard: "Delay note",
    ajouterNoteRetard: "Add delay note",
    enRetard: "Delayed",
    voirNote: "View note",
    masquerNote: "Hide note",
    progression: "Progress",
    phasesCompletees: "phases completed",
    sur: "of",
  },
} as const;

export function MissionPhases({ mission, currentUserRole, lang = "fr", onUpdate }: MissionPhasesProps) {
  const t = TEXT[lang];
  const [phases, setPhases] = useState<ExecutionPhase[]>(
    (mission.phases || []).map((p, idx) => ({
      ...p,
      ordre: p.ordre ?? idx + 1, // S'assurer que chaque phase a un ordre
    }))
  );
  const [delaiMaximal, setDelaiMaximal] = useState(mission.delaiMaximal || 0);
  const [showDelaiForm, setShowDelaiForm] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const isPrestataire = currentUserRole === "prestataire";
  const isAdmin = currentUserRole === "admin";

  const completedPhases = phases.filter((p) => p.completed).length;
  const totalPhases = phases.length;
  const progressPercentage = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;


  const handleTogglePhase = async (phaseId: string) => {
    if (!isPrestataire) return;

    // Trier les phases par ordre
    const sortedPhases = [...phases].sort((a, b) => a.ordre - b.ordre);
    const phaseIndex = sortedPhases.findIndex((p) => p.id === phaseId);
    const phase = sortedPhases[phaseIndex];
    
    if (!phase) return;

    // Si on essaie de compléter une phase, vérifier que toutes les précédentes sont complétées
    if (!phase.completed) {
      // Vérifier que toutes les phases précédentes sont complétées
      for (let i = 0; i < phaseIndex; i++) {
        if (!sortedPhases[i].completed) {
          alert(lang === "fr" 
            ? `Veuillez compléter la phase "${sortedPhases[i].nom}" avant de compléter celle-ci.`
            : `Please complete the phase "${sortedPhases[i].nom}" before completing this one.`);
          return;
        }
      }
    }

    const updatedPhase = {
      ...phase,
      completed: !phase.completed,
      completedAt: !phase.completed ? new Date().toISOString() : undefined,
    };

    try {
      const res = await fetch(`/api/missions/${mission.id}/phases/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: updatedPhase }),
      });

      if (res.ok) {
        setPhases(phases.map((p) => (p.id === phaseId ? updatedPhase : p)));
        onUpdate?.();
      }
    } catch (err) {
      console.error("Erreur toggle phase:", err);
    }
  };

  // Fonction pour vérifier si une phase peut être cliquée (débloquée)
  const isPhaseUnlocked = (phase: ExecutionPhase): boolean => {
    if (!isPrestataire) return false;
    
    // On peut toujours décompléter une phase complétée
    if (phase.completed) return true;
    
    // Si aucune phase n'existe, retourner false
    if (phases.length === 0) return false;
    
    // Trier les phases par ordre pour garantir la cohérence
    const sortedPhases = [...phases].sort((a, b) => {
      const ordreA = a.ordre ?? 0;
      const ordreB = b.ordre ?? 0;
      return ordreA - ordreB;
    });
    
    const phaseIndex = sortedPhases.findIndex((p) => p.id === phase.id);
    
    // Si la phase n'est pas trouvée, retourner false
    if (phaseIndex === -1) return false;
    
    // Si c'est la première phase (index 0), elle est toujours débloquée
    if (phaseIndex === 0) return true;
    
    // Vérifier que toutes les phases précédentes sont complétées
    for (let i = 0; i < phaseIndex; i++) {
      if (!sortedPhases[i].completed) {
        return false;
      }
    }
    
    return true;
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!isPrestataire || !confirm(lang === "fr" ? "Supprimer cette phase ?" : "Delete this phase?")) return;

    try {
      const res = await fetch(`/api/missions/${mission.id}/phases/${phaseId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPhases(phases.filter((p) => p.id !== phaseId));
        onUpdate?.();
      }
    } catch (err) {
      console.error("Erreur suppression phase:", err);
    }
  };

  const handleSetDelai = async () => {
    if (!delaiMaximal || delaiMaximal <= 0) return;

    try {
      const res = await fetch(`/api/missions/${mission.id}/delai`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delaiMaximal }),
      });

      if (res.ok) {
        setShowDelaiForm(false);
        onUpdate?.();
      }
    } catch (err) {
      console.error("Erreur définition délai:", err);
    }
  };

  const handleAddRetardNote = async (phaseId: string, note: string) => {
    if (!note.trim()) return;

    try {
      const res = await fetch(`/api/missions/${mission.id}/phases/${phaseId}/retard`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteRetard: note.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setPhases(phases.map((p) => (p.id === phaseId ? data.phase : p)));
        onUpdate?.();
      }
    } catch (err) {
      console.error("Erreur ajout note retard:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header avec progression */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold text-[#0A1B2A]">{t.phasesExecution}</h3>
          {totalPhases > 0 && (
            <p className="text-xs text-[#6B7280] mt-1">
              {t.progression}: {completedPhases} {t.phasesCompletees} {t.sur} {totalPhases} ({progressPercentage}%)
            </p>
          )}
        </div>
        {isPrestataire && (
          <div className="flex gap-2">
            {!mission.delaiMaximal && (
              <button
                onClick={() => setShowDelaiForm(!showDelaiForm)}
                className="px-3 py-1.5 text-xs font-semibold text-[#0A1B2A] border border-[#DDDDDD] rounded-md hover:bg-[#F9F9FB] transition"
              >
                <Clock className="w-3 h-3 inline mr-1" />
                {t.definirDelai}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Formulaire délai maximal */}
      {showDelaiForm && isPrestataire && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-[#0A1B2A] mb-2">
            {t.delaiMaximal} ({t.heures})
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={delaiMaximal}
              onChange={(e) => setDelaiMaximal(parseInt(e.target.value) || 0)}
              className="flex-1 px-3 py-2 text-sm border border-[#DDDDDD] rounded-md focus:outline-none focus:border-[#C8A55F]"
              placeholder="48"
              min="1"
            />
            <button
              onClick={handleSetDelai}
              className="px-4 py-2 bg-[#0A1B2A] text-white text-xs font-semibold rounded-md hover:bg-[#07121e] transition"
            >
              {t.enregistrer}
            </button>
            <button
              onClick={() => setShowDelaiForm(false)}
              className="px-4 py-2 border border-[#DDDDDD] text-[#6B7280] text-xs font-semibold rounded-md hover:bg-[#F9F9FB] transition"
            >
              {t.annuler}
            </button>
          </div>
        </div>
      )}

      {/* Délai défini */}
      {mission.delaiMaximal && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {t.delaiDefini}: {mission.delaiMaximal} {t.heures}
            </span>
            {mission.dateLimiteMission && (
              <span className="text-xs text-green-700">
                ({new Date(mission.dateLimiteMission).toLocaleDateString()})
              </span>
            )}
          </div>
        </div>
      )}


      {/* Liste des phases */}
      {phases.length > 0 && (
        <div className="space-y-3">
          {phases
            .sort((a, b) => a.ordre - b.ordre)
            .map((phase, index) => (
              <div
                key={phase.id}
                className={`p-4 border-2 rounded-lg transition ${
                  phase.completed
                    ? "bg-green-50 border-green-200"
                    : phase.retard
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-[#DDDDDD]"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Cercle cliquable */}
                  {isPrestataire ? (() => {
                    const unlocked = isPhaseUnlocked(phase);
                    const canClick = unlocked || phase.completed;
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (canClick) {
                            handleTogglePhase(phase.id);
                          } else {
                            alert(lang === "fr" 
                              ? "Complétez les phases précédentes d'abord" 
                              : "Complete previous phases first");
                          }
                        }}
                        className={`mt-0.5 flex-shrink-0 transition ${
                          !canClick
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer hover:scale-110"
                        }`}
                        title={
                          !canClick
                            ? (lang === "fr" ? "Complétez les phases précédentes d'abord" : "Complete previous phases first")
                            : phase.completed
                            ? t.decocherPhase
                            : t.cocherPhase
                        }
                      >
                        {phase.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : unlocked ? (
                          <Circle className="w-6 h-6 text-[#C8A55F] hover:text-green-600 transition" />
                        ) : (
                          <Circle className="w-6 h-6 text-[#DDDDDD]" />
                        )}
                      </button>
                    );
                  })() : (
                    <div className="mt-0.5 flex-shrink-0">
                      {phase.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-[#6B7280]" />
                      )}
                    </div>
                  )}

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#6B7280]">
                        {t.phase} {index + 1}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          phase.completed
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {phase.completed ? t.completee : t.enCours}
                      </span>
                      {phase.retard && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {t.enRetard}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-[#0A1B2A] mb-1">{phase.nom}</h4>
                    {phase.description && (
                      <p className="text-sm text-[#6B7280] mb-2">{phase.description}</p>
                    )}
                    {phase.completedAt && (
                      <p className="text-xs text-[#6B7280]">
                        {lang === "fr" ? "Complétée le" : "Completed on"}{" "}
                        {new Date(phase.completedAt).toLocaleDateString()}
                      </p>
                    )}

                    {/* Note de retard */}
                    {phase.retard && (
                      <div className="mt-2 space-y-2">
                        {phase.noteRetard && (
                          <div className="bg-red-100 border border-red-200 rounded p-2">
                            <p className="text-xs font-medium text-red-800 mb-1">{t.noteRetard}:</p>
                            <p className="text-xs text-red-700">{phase.noteRetard}</p>
                          </div>
                        )}
                        {isPrestataire && !phase.noteRetard && (
                          <button
                            onClick={() => {
                              const note = prompt(lang === "fr" ? "Expliquez le retard:" : "Explain the delay:");
                              if (note) handleAddRetardNote(phase.id, note);
                            }}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            {t.ajouterNoteRetard}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isPrestataire && (
                    <button
                      onClick={() => handleDeletePhase(phase.id)}
                      className="text-red-600 hover:text-red-800 transition"
                      title={t.supprimerPhase}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

