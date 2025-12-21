"use client";

import { useEffect, useState } from "react";

/**
 * Composant qui détecte les nouvelles versions de l'application
 * et affiche une notification pour inviter l'utilisateur à recharger
 */
export function VersionChecker() {
  const [showReload, setShowReload] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Vérifier la version au chargement initial
    checkVersion();

    // Vérifier la version toutes les 60 secondes (1 minute)
    const interval = setInterval(() => {
      checkVersion();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  async function checkVersion() {
    // Ne pas vérifier si une notification est déjà affichée
    if (showReload || isChecking) return;

    try {
      setIsChecking(true);
      const res = await fetch("/api/version", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const currentVersion = localStorage.getItem("app_version");
      const lastCheckTime = localStorage.getItem("app_version_check_time");

      // Si c'est la première visite, sauvegarder la version actuelle
      if (!currentVersion) {
        localStorage.setItem("app_version", data.version);
        localStorage.setItem("app_version_check_time", Date.now().toString());
        return;
      }

      // Si la version a changé, afficher la notification
      if (currentVersion !== data.version) {
        console.log(`🔄 Nouvelle version détectée: ${currentVersion} → ${data.version}`);
        setShowReload(true);
      }
    } catch (err) {
      console.error("Erreur vérification version:", err);
    } finally {
      setIsChecking(false);
    }
  }

  function handleReload() {
    // Sauvegarder la nouvelle version avant de recharger
    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem("app_version", data.version);
        localStorage.setItem("app_version_check_time", Date.now().toString());
        // Recharger la page
        window.location.reload();
      })
      .catch(() => {
        // En cas d'erreur, recharger quand même
        window.location.reload();
      });
  }

  function handleDismiss() {
    // Mettre à jour la version sans recharger (l'utilisateur rechargera plus tard)
    fetch("/api/version")
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem("app_version", data.version);
        localStorage.setItem("app_version_check_time", Date.now().toString());
        setShowReload(false);
      })
      .catch(() => {
        setShowReload(false);
      });
  }

  if (!showReload) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-[#C8A55F] to-[#D4AA55] text-[#0A1B2A] p-5 rounded-2xl shadow-2xl border-2 border-[#C8A55F]/30 backdrop-blur-sm max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <svg
              className="w-6 h-6 text-[#0A1B2A]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Nouvelle mise à jour disponible</h3>
            <p className="text-sm text-[#0A1B2A]/80 mb-4">
              Une nouvelle version de l'application est disponible. Rechargez la page pour bénéficier des dernières améliorations.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReload}
                className="flex-1 bg-[#0A1B2A] text-[#C8A55F] px-4 py-2 rounded-lg font-medium hover:bg-[#0A1B2A]/90 transition-colors"
              >
                Recharger maintenant
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-[#0A1B2A]/70 hover:text-[#0A1B2A] transition-colors text-sm"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

