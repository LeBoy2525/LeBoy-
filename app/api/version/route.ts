import { NextResponse } from "next/server";

/**
 * Route API pour obtenir la version actuelle de l'application
 * Utilisée pour détecter les nouveaux déploiements
 */
export async function GET() {
  // Utiliser plusieurs sources pour la version, dans l'ordre de priorité :
  // 1. VERCEL_GIT_COMMIT_SHA (change à chaque nouveau commit)
  // 2. VERCEL_DEPLOYMENT_ID (change à chaque déploiement, même pour le même commit)
  // 3. BUILD_TIME (timestamp du build)
  // 4. Timestamp actuel (fallback)
  
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7);
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || process.env.BUILD_TIME;
  
  // Combiner plusieurs sources pour avoir une version unique par déploiement
  const version = 
    commitSha && deploymentId 
      ? `${commitSha}-${deploymentId.substring(0, 7)}` // Commit + déploiement
      : commitSha 
      ? commitSha
      : deploymentId
      ? deploymentId.substring(0, 14)
      : buildTime
      ? buildTime
      : Date.now().toString();
  
  // Log pour déboguer
  console.log(`[VERSION API] Version actuelle: ${version}`);
  console.log(`[VERSION API] Sources disponibles:`, {
    commitSha: commitSha || "non disponible",
    deploymentId: deploymentId ? deploymentId.substring(0, 14) + "..." : "non disponible",
    buildTime: buildTime || "non disponible",
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

