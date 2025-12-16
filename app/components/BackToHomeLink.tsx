"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type BackToHomeLinkProps = {
  backTo?: "home" | "admin" | "client" | "prestataire" | "auto";
};

const TEXT = {
  fr: {
    home: "Retour à l'accueil",
    admin: "Retour au tableau de bord",
    adminFinance: "Retour à Finance & Comptabilité",
    client: "Retour à mon espace",
    prestataire: "Retour à mon espace",
  },
  en: {
    home: "Back to home",
    admin: "Back to dashboard",
    adminFinance: "Back to Finance & Accounting",
    client: "Back to my space",
    prestataire: "Back to my space",
  },
} as const;

const LINKS = {
  home: "/",
  admin: "/admin",
  client: "/espace-client",
  prestataire: "/prestataires/espace",
} as const;

export default function BackToHomeLink({ backTo = "auto" }: BackToHomeLinkProps) {
  const { lang } = useLanguage();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<"admin" | "client" | "prestataire" | null>(null);
  const [backLink, setBackLink] = useState<string>("/");
  const [loading, setLoading] = useState(true);

  // Détecter automatiquement le contexte depuis l'URL ou le rôle de l'utilisateur
  useEffect(() => {
    if (backTo !== "auto") {
      setLoading(false);
      return;
    }

    // Détecter depuis l'URL
    if (pathname?.startsWith("/admin/finance/")) {
      // Si on est dans un sous-dossier de finance, retourner vers /admin/finance
      setUserRole("admin");
      setBackLink("/admin/finance");
      setLoading(false);
      return;
    }
    if (pathname === "/admin" || pathname === "/admin/") {
      // Si on est déjà sur la page principale admin, retourner à l'accueil
      setUserRole("admin");
      setBackLink("/");
      setLoading(false);
      return;
    }
    if (pathname?.startsWith("/admin")) {
      setUserRole("admin");
      setBackLink("/admin");
      setLoading(false);
      return;
    }
    if (pathname === "/espace-client" || pathname === "/espace-client/") {
      // Si on est déjà sur la page principale client, retourner à l'accueil
      setUserRole("client");
      setBackLink("/");
      setLoading(false);
      return;
    }
    if (pathname?.startsWith("/espace-client")) {
      setUserRole("client");
      setBackLink("/espace-client");
      setLoading(false);
      return;
    }
    if (pathname === "/prestataires/espace" || pathname === "/prestataires/espace/") {
      // Si on est déjà sur la page principale prestataire, retourner à l'accueil
      setUserRole("prestataire");
      setBackLink("/");
      setLoading(false);
      return;
    }
    if (pathname?.startsWith("/prestataires/espace")) {
      setUserRole("prestataire");
      setBackLink("/prestataires/espace");
      setLoading(false);
      return;
    }

    // Sinon, récupérer le rôle depuis l'API
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          // Si l'API échoue, ne pas définir de rôle (rester sur home)
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data?.authenticated && data?.user?.role) {
          setUserRole(data.user.role);
          // Définir le lien par défaut selon le rôle
          if (data.user.role === "admin") {
            setBackLink("/admin");
          } else if (data.user.role === "prestataire") {
            setBackLink("/prestataires/espace");
          } else {
            setBackLink("/espace-client");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du rôle:", error);
        // En cas d'erreur, ne pas définir de rôle (rester sur home)
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [pathname, backTo]);

  // Déterminer le lien et le texte
  let href: string = LINKS.home;
  let text: string = TEXT[lang].home;

  if (backTo !== "auto" && backTo !== "home") {
    href = LINKS[backTo];
    text = TEXT[lang][backTo];
  } else if (!loading && userRole && backLink) {
    // Utiliser backLink si défini (pour les sous-dossiers finance)
    href = backLink;
    // Si on retourne à l'accueil, utiliser le texte "Retour à l'accueil"
    if (backLink === "/") {
      text = TEXT[lang].home;
    } else if (backLink === "/admin/finance") {
      // Si on est dans un sous-dossier finance, utiliser le texte spécifique
      text = TEXT[lang].adminFinance;
    } else {
      text = TEXT[lang][userRole];
    }
  } else if (!loading && userRole) {
    href = LINKS[userRole];
    text = TEXT[lang][userRole];
  }

      return (
        <div className="bg-white border-b border-[#DDDDDD] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
            <Link 
              href={href}
              prefetch={false}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2135] hover:text-[#D4A657] transition-all duration-200 group"
            >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A657]/10 to-[#D4A657]/5 border border-[#D4A657]/20 flex items-center justify-center group-hover:bg-[#D4A657]/20 group-hover:border-[#D4A657]/40 transition-all duration-200">
            <ArrowLeft className="w-4 h-4 text-[#D4A657] group-hover:translate-x-[-2px] transition-transform duration-200" />
          </div>
          <span>{text}</span>
        </Link>
      </div>
    </div>
  );
}

