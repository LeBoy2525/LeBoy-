"use client";

import { useEffect, useState } from "react";

/**
 * Composant qui détecte les nouvelles versions de l'application
 * et affiche une notification pour inviter l'utilisateur à recharger
 */
export function VersionChecker() {
  const [showReload, setShowReload] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  // Clés localStorage
  const STORAGE_VERSION_KEY = "app_version";
  const STORAGE_COMMIT_SHA_KEY = "app_commit_sha";
  const STORAGE_DEPLOYMENT_ID_KEY = "app_deployment_id";
  const STORAGE_BUILD_TIME_KEY = "app_build_time";
  const STORAGE_CHECK_TIME_KEY = "app_version_check_time";
  const STORAGE_PENDING_UPDATE_KEY = "app_pending_update";
  const STORAGE_UPDATE_DISMISSED_KEY = "app_update_dismissed";

  useEffect(() => {
    // Vérifier s'il y a une mise à jour en attente depuis une session précédente
    const pendingUpdate = localStorage.getItem(STORAGE_PENDING_UPDATE_KEY);
    if (pendingUpdate) {
      console.log("[VersionChecker] 🔄 Mise à jour en attente détectée - application automatique");
      // Forcer la mise à jour immédiatement
      handleReload();
      return;
    }

    // Mode test : vérifier si on doit forcer l'affichage (pour tester)
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get("test-update") === "true";
    
    if (testMode) {
      console.log("[VersionChecker] 🧪 Mode test activé - affichage forcé de la notification");
      setShowReload(true);
      return;
    }

    // Vérifier la version au chargement initial (après un court délai pour laisser le temps au localStorage)
    const initialDelay = setTimeout(() => {
      checkVersion();
    }, 1000);

    // Vérifier la version toutes les 30 secondes (plus fréquent pour desktop)
    const interval = setInterval(() => {
      checkVersion();
    }, 30000);

    // Vérifier immédiatement quand l'utilisateur revient sur l'onglet (important pour desktop)
    const handleFocus = () => {
      console.log("[VersionChecker] 👁️ Fenêtre focalisée - vérification version");
      checkVersion();
    };

    // Vérifier quand l'onglet redevient visible (important pour desktop avec plusieurs onglets)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("[VersionChecker] 👁️ Onglet visible - vérification version");
        checkVersion();
      }
    };

    // Gérer la fermeture de la page : si une mise à jour a été reportée, la marquer comme en attente
    const handleBeforeUnload = () => {
      const dismissedUpdate = localStorage.getItem(STORAGE_UPDATE_DISMISSED_KEY);
      if (dismissedUpdate && !showReload) {
        // Il y a une mise à jour reportée et l'utilisateur ferme la page
        // Marquer comme en attente pour forcer la mise à jour au prochain chargement
        localStorage.setItem(STORAGE_PENDING_UPDATE_KEY, "true");
        console.log("[VersionChecker] 📝 Mise à jour reportée marquée comme en attente");
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [showReload]);

  async function checkVersion() {
    // Ne pas vérifier si une notification est déjà affichée
    if (showReload || isChecking) {
      console.log(`[VersionChecker] ⏭️ Vérification ignorée (showReload: ${showReload}, isChecking: ${isChecking})`);
      return;
    }

    try {
      setIsChecking(true);
      // Ajouter un timestamp pour éviter le cache
      const timestamp = Date.now();
      const res = await fetch(`/api/version?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });

      if (!res.ok) {
        console.warn(`[VersionChecker] ❌ Erreur API version: ${res.status}`);
        return;
      }

      const data = await res.json();
      const currentVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      const lastCheckTime = localStorage.getItem(STORAGE_CHECK_TIME_KEY);
      
      // Utiliser aussi les sources détaillées pour une comparaison plus robuste
      const currentCommitSha = localStorage.getItem(STORAGE_COMMIT_SHA_KEY);
      const currentDeploymentId = localStorage.getItem(STORAGE_DEPLOYMENT_ID_KEY);
      const currentBuildTime = localStorage.getItem(STORAGE_BUILD_TIME_KEY);

      console.log(`[VersionChecker] 🔍 Vérification version (${new Date().toLocaleTimeString()}):`, {
        versionServeur: data.version,
        versionLocale: currentVersion || "première visite",
        commitShaServeur: data.sources?.commitSha,
        commitShaLocale: currentCommitSha,
        deploymentIdServeur: data.sources?.deploymentId,
        deploymentIdLocale: currentDeploymentId,
        buildTimeServeur: data.sources?.buildTime,
        buildTimeLocale: currentBuildTime,
        timestamp: data.timestamp,
        lastCheckTime: lastCheckTime ? new Date(parseInt(lastCheckTime)).toLocaleTimeString() : "jamais",
      });

      // Si c'est la première visite, sauvegarder toutes les informations de version
      if (!currentVersion) {
        console.log(`[VersionChecker] ✅ Première visite - sauvegarde version: ${data.version}`);
        localStorage.setItem(STORAGE_VERSION_KEY, data.version);
        localStorage.setItem(STORAGE_CHECK_TIME_KEY, Date.now().toString());
        if (data.sources?.commitSha) localStorage.setItem(STORAGE_COMMIT_SHA_KEY, data.sources.commitSha);
        if (data.sources?.deploymentId) localStorage.setItem(STORAGE_DEPLOYMENT_ID_KEY, data.sources.deploymentId);
        if (data.sources?.buildTime) localStorage.setItem(STORAGE_BUILD_TIME_KEY, data.sources.buildTime);
        // Nettoyer les flags de mise à jour en attente
        localStorage.removeItem(STORAGE_PENDING_UPDATE_KEY);
        localStorage.removeItem(STORAGE_UPDATE_DISMISSED_KEY);
        return;
      }

      // Comparer la version principale ET les sources détaillées pour une détection plus fiable
      const versionChanged = currentVersion !== data.version;
      const commitShaChanged = data.sources?.commitSha && currentCommitSha !== data.sources.commitSha;
      const deploymentIdChanged = data.sources?.deploymentId && currentDeploymentId !== data.sources.deploymentId;
      const buildTimeChanged = data.sources?.buildTime && currentBuildTime !== data.sources.buildTime;

      // Si la version ou une des sources a changé, afficher la notification
      if (versionChanged || commitShaChanged || deploymentIdChanged || buildTimeChanged) {
        console.log(`[VersionChecker] 🔄 Nouvelle version détectée:`, {
          version: `${currentVersion} → ${data.version}`,
          commitSha: commitShaChanged ? `${currentCommitSha} → ${data.sources?.commitSha}` : "identique",
          deploymentId: deploymentIdChanged ? `${currentDeploymentId} → ${data.sources?.deploymentId}` : "identique",
          buildTime: buildTimeChanged ? `${currentBuildTime} → ${data.sources?.buildTime}` : "identique",
        });
        
        // Vérifier si l'utilisateur a déjà reporté cette mise à jour
        const dismissedUpdate = localStorage.getItem(STORAGE_UPDATE_DISMISSED_KEY);
        const dismissedVersion = dismissedUpdate ? JSON.parse(dismissedUpdate).version : null;
        
        // Si c'est une nouvelle version ou si l'utilisateur n'a pas encore reporté cette version, afficher
        if (!dismissedVersion || dismissedVersion !== data.version) {
          setShowReload(true);
        } else {
          console.log(`[VersionChecker] ⏭️ Mise à jour déjà reportée pour cette version`);
        }
      } else {
        console.log(`[VersionChecker] ✅ Version à jour: ${data.version}`);
        // Nettoyer les flags si la version est à jour
        localStorage.removeItem(STORAGE_PENDING_UPDATE_KEY);
        localStorage.removeItem(STORAGE_UPDATE_DISMISSED_KEY);
      }
    } catch (err) {
      console.error("[VersionChecker] ❌ Erreur vérification version:", err);
    } finally {
      setIsChecking(false);
    }
  }

  function handleReload() {
    // Sauvegarder la nouvelle version avant de recharger
    fetch("/api/version?t=" + Date.now(), { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem(STORAGE_VERSION_KEY, data.version);
        localStorage.setItem(STORAGE_CHECK_TIME_KEY, Date.now().toString());
        if (data.sources?.commitSha) localStorage.setItem(STORAGE_COMMIT_SHA_KEY, data.sources.commitSha);
        if (data.sources?.deploymentId) localStorage.setItem(STORAGE_DEPLOYMENT_ID_KEY, data.sources.deploymentId);
        if (data.sources?.buildTime) localStorage.setItem(STORAGE_BUILD_TIME_KEY, data.sources.buildTime);
        // Nettoyer les flags de mise à jour
        localStorage.removeItem(STORAGE_PENDING_UPDATE_KEY);
        localStorage.removeItem(STORAGE_UPDATE_DISMISSED_KEY);
        // Recharger la page avec un paramètre pour éviter le cache
        window.location.reload();
      })
      .catch(() => {
        // En cas d'erreur, recharger quand même
        window.location.reload();
      });
  }

  function handleDismiss() {
    // Récupérer la version actuelle du serveur pour la sauvegarder comme "reportée"
    fetch("/api/version?t=" + Date.now(), { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        // Marquer cette version comme reportée (avec timestamp)
        localStorage.setItem(STORAGE_UPDATE_DISMISSED_KEY, JSON.stringify({
          version: data.version,
          timestamp: Date.now(),
        }));
        console.log(`[VersionChecker] ⏸️ Mise à jour reportée pour version ${data.version}`);
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
                title="La mise à jour sera appliquée automatiquement à la prochaine ouverture de la page"
              >
                Rappeler plus tard
              </button>
            </div>
            <p className="text-xs text-[#0A1B2A]/60 mt-2">
              ⚠️ Si vous fermez la page, la mise à jour sera appliquée automatiquement à la prochaine ouverture.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

