// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserRole } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuth = req.cookies.get("icd_auth")?.value === "1";
  const userEmail = req.cookies.get("icd_user_email")?.value;
  
  // Protection staging : vérifier l'accès si on est en staging
  const APP_ENV = process.env.APP_ENV || "local";
  if (APP_ENV === "staging") {
    const stagingOk = req.cookies.get("staging_ok")?.value === "1";
    
    // Routes autorisées sans code d'accès
    const allowedPaths = [
      "/staging-access",
      "/api/staging-access",
      "/_next",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
    ];
    
    const isAllowedPath = allowedPaths.some((path) => pathname.startsWith(path));
    
    // Si pas autorisé et pas de cookie staging_ok, rediriger vers /staging-access
    if (!isAllowedPath && !stagingOk) {
      return NextResponse.redirect(new URL("/staging-access", req.url));
    }
  }

  // Protection espace client (clients uniquement)
  if (
    pathname.startsWith("/espace-client") &&
    !pathname.startsWith("/espace-client/connexion") &&
    !isAuth
  ) {
    const url = new URL("/espace-client/connexion", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Vérifier le rôle pour l'espace client (pas admin ni prestataire)
  if (
    pathname.startsWith("/espace-client") &&
    !pathname.startsWith("/espace-client/connexion") &&
    isAuth &&
    userEmail
  ) {
    try {
      const role = getUserRole(userEmail);
      if (role !== "client") {
        console.log(`[MIDDLEWARE] Redirection depuis espace-client pour ${userEmail}, rôle: ${role}`);
        // Rediriger selon le rôle
        if (role === "admin") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        if (role === "prestataire") {
          return NextResponse.redirect(new URL("/prestataires/espace", req.url));
        }
      }
    } catch (error) {
      console.error(`[MIDDLEWARE] Erreur lors de la vérification du rôle client pour ${userEmail}:`, error);
      // En cas d'erreur, permettre l'accès (ne pas bloquer)
    }
  }

  // Protection espace admin (admins uniquement)
  if (pathname.startsWith("/admin") && !isAuth) {
    const url = new URL("/connexion", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && isAuth && userEmail) {
    try {
      const role = getUserRole(userEmail);
      if (role !== "admin") {
        console.log(`[MIDDLEWARE] Accès admin refusé pour ${userEmail}, rôle détecté: ${role}`);
        // Rediriger vers l'espace approprié
        if (role === "client") {
          return NextResponse.redirect(new URL("/espace-client", req.url));
        }
        if (role === "prestataire") {
          return NextResponse.redirect(new URL("/prestataires/espace", req.url));
        }
        // Si rôle inconnu, rediriger vers la page de connexion
        return NextResponse.redirect(new URL("/connexion", req.url));
      }
    } catch (error) {
      console.error(`[MIDDLEWARE] Erreur lors de la vérification du rôle pour ${userEmail}:`, error);
      // En cas d'erreur technique, ne pas déconnecter l'utilisateur
      // Permettre l'accès et laisser les routes API gérer l'authentification
      // Ne pas rediriger vers connexion pour éviter la déconnexion
    }
  }

  // Protection espace prestataire (prestataires uniquement)
  if (pathname.startsWith("/prestataires/espace") && !isAuth) {
    const url = new URL("/prestataires/connexion", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/prestataires/espace") && isAuth && userEmail) {
    const role = getUserRole(userEmail);
    if (role !== "prestataire") {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (role === "client") {
        return NextResponse.redirect(new URL("/espace-client", req.url));
      }
    }
  }

  // Si déjà connecté et qu'on va sur /connexion → redirect selon le rôle
  if (pathname === "/connexion" && isAuth && userEmail) {
    const role = getUserRole(userEmail);
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (role === "prestataire") {
      return NextResponse.redirect(new URL("/prestataires/espace", req.url));
    }
    return NextResponse.redirect(new URL("/espace-client", req.url));
  }

  // Protection des routes API
  if (pathname.startsWith("/api/espace-client") && !isAuth) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (pathname.startsWith("/api/admin")) {
    if (!isAuth) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
    // Vérifier le rôle pour les routes API admin
    if (userEmail) {
      try {
        const role = getUserRole(userEmail);
        if (role !== "admin") {
          // Retourner une erreur JSON au lieu de rediriger
          return NextResponse.json(
            { error: "Accès réservé aux administrateurs." },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error(`[MIDDLEWARE] Erreur lors de la vérification du rôle admin API pour ${userEmail}:`, error);
        // En cas d'erreur technique, retourner une erreur serveur au lieu de rediriger
        return NextResponse.json(
          { error: "Erreur de vérification d'authentification." },
          { status: 500 }
        );
      }
    }
  }

  if (pathname.startsWith("/api/prestataires/espace") && !isAuth) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - staging-access (page d'accès staging)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|staging-access).*)",
    "/api/espace-client/:path*",
    "/api/admin/:path*",
    "/api/prestataires/espace/:path*",
  ],
};
