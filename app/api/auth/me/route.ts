// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";
import { getPrestataireByEmail } from "@/lib/dataAccess";
import { USE_DB } from "@/lib/dbFlag";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("icd_auth")?.value;
    const isAuthenticated = authCookie === "1";

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
    }

    const userEmail = cookieStore.get("icd_user_email")?.value;
    
    if (!userEmail || userEmail === "demo@example.com") {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
    }

    // Déterminer le rôle avec gestion d'erreur robuste
    // Utilise getUserRoleAsync qui bascule automatiquement entre JSON et DB
    let role: "client" | "admin" | "prestataire" = "client";
    try {
      role = await getUserRoleAsync(userEmail);
    } catch (error) {
      console.error("Erreur lors de la détermination du rôle:", error);
      // Fallback sur version synchrone en cas d'erreur
      try {
        const { getUserRole } = await import("@/lib/auth");
        role = getUserRole(userEmail);
      } catch (fallbackError) {
        console.error("Erreur fallback getUserRole:", fallbackError);
        // En cas d'erreur totale, considérer comme client par défaut
        role = "client";
      }
    }

    // Si c'est un prestataire, récupérer ses infos
    let prestataireId: number | string | null = null;
    if (role === "prestataire") {
      try {
        // Utiliser dataAccess qui bascule automatiquement entre JSON et DB
        const prestataire = await getPrestataireByEmail(userEmail);
        if (prestataire) {
          prestataireId = prestataire.id;
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du prestataire:", error);
        // Fallback sur JSON en cas d'erreur DB
        if (USE_DB) {
          try {
            const { prestatairesStore } = await import("@/lib/prestatairesStore");
            if (prestatairesStore && Array.isArray(prestatairesStore) && prestatairesStore.length > 0) {
              const prestataire = prestatairesStore.find(
                (p) => p && p.email && typeof p.email === "string" && p.email.toLowerCase() === userEmail.toLowerCase()
              );
              prestataireId = prestataire?.id || null;
            }
          } catch (fallbackError) {
            console.error("Erreur fallback JSON:", fallbackError);
            // Si erreur totale, continuer sans prestataireId
          }
        }
      }
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          email: userEmail,
          role,
          prestataireId,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Erreur dans /api/auth/me:", error);
    // Toujours retourner une réponse valide pour ne pas bloquer le rendu
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      {
        status: 200, // Retourner 200 même en cas d'erreur pour ne pas bloquer le site
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  }
}
