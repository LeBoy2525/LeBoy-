"use client";

import { useEffect, useState } from "react";

export function StagingBanner() {
  const [isStaging, setIsStaging] = useState(false);

  useEffect(() => {
    // Vérifier côté client si on est en staging
    // Option 1: Variable d'environnement publique (si définie)
    const envStaging = process.env.NEXT_PUBLIC_APP_ENV === "staging";
    
    // Option 2: Vérifier le hostname (pour Vercel preview/staging)
    const hostnameStaging = typeof window !== "undefined" && 
      (window.location.hostname.includes("staging") || 
       window.location.hostname.includes("preview") ||
       window.location.hostname.includes("vercel.app"));

    setIsStaging(envStaging || hostnameStaging);
  }, []);

  if (!isStaging) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-black text-center py-2 px-4 text-sm font-semibold">
      ⚠️ ENVIRONNEMENT DE STAGING — Tests uniquement — Paiements désactivés
    </div>
  );
}

