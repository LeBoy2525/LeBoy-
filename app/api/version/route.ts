import { NextResponse } from "next/server";

/**
 * Route API pour obtenir la version actuelle de l'application
 * Utilisée pour détecter les nouveaux déploiements
 */
export async function GET() {
  // Utiliser le commit SHA de Vercel si disponible, sinon un timestamp de build
  const version = 
    process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || // 7 premiers caractères du commit SHA
    process.env.NEXT_PUBLIC_BUILD_TIME ||
    process.env.BUILD_TIME ||
    Date.now().toString();
  
  return NextResponse.json(
    { 
      version,
      timestamp: Date.now(),
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

