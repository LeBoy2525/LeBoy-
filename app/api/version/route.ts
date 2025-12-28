import { NextResponse } from "next/server";

/**
 * Route API pour obtenir la version actuelle de l'application
 * Utilisée pour détecter les nouveaux déploiements
 */
export async function GET() {
  // Utiliser plusieurs sources pour la version, dans l'ordre de priorité :
  // 1. VERCEL_GIT_COMMIT_SHA (change à chaque nouveau commit)
  // 2. VERCEL_DEPLOYMENT_ID (change à chaque déploiement, même pour le même commit)
  // 3. NEXT_PUBLIC_BUILD_TIME (timestamp du build, défini dans next.config.ts)
  // 4. BUILD_TIME (fallback)
  // 5. Timestamp actuel (dernier fallback)
  
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7);
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
  // NEXT_PUBLIC_BUILD_TIME est défini dans next.config.ts au moment du build
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || process.env.BUILD_TIME;
  
  // Combiner plusieurs sources pour avoir une version unique par déploiement
  // Priorité : commitSha + deploymentId > commitSha > deploymentId > buildTime > timestamp
  let version: string;
  if (commitSha && deploymentId) {
    version = `${commitSha}-${deploymentId.substring(0, 7)}`; // Commit + déploiement
  } else if (commitSha) {
    version = commitSha;
  } else if (deploymentId) {
    version = deploymentId.substring(0, 14);
  } else if (buildTime) {
    version = buildTime;
  } else {
    // Fallback : utiliser un timestamp (mais ce ne devrait jamais arriver en production)
    version = Date.now().toString();
    console.warn(`[VERSION API] ⚠️ Aucune source de version disponible, utilisation du timestamp: ${version}`);
  }
  
  // Log pour déboguer
  console.log(`[VERSION API] Version actuelle: ${version}`);
  console.log(`[VERSION API] Sources disponibles:`, {
    commitSha: commitSha || "non disponible",
    deploymentId: deploymentId ? deploymentId.substring(0, 14) + "..." : "non disponible",
    buildTime: buildTime || "non disponible",
    envKeys: Object.keys(process.env).filter(k => k.includes("VERCEL") || k.includes("BUILD")).join(", ") || "aucune",
  });
  
  return NextResponse.json(
    { 
      version,
      timestamp: Date.now(),
      sources: {
        commitSha: commitSha || null,
        deploymentId: deploymentId ? deploymentId.substring(0, 14) : null,
        buildTime: buildTime || null,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}

