"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./components/LanguageProvider";

const TEXT = {
  fr: {
    tag: "Page introuvable",
    title: "Cette page n'existe pas (encore).",
    description:
      "L'URL que vous avez ouverte ne correspond à aucune page active de l'interface LeBoy. Cela peut venir d'un lien incomplet, d'un ancien favori ou d'un dossier qui n'est pas encore relié à cette version pilote de l'espace client.",
    suggestion1Title: "Revenir au site principal",
    suggestion1Text:
      "Pour retrouver la présentation de LeBoy, les services proposés et le formulaire de demande.",
    suggestion1Button: "Retour à l'accueil",
    suggestion2Title: "Accéder à votre espace",
    suggestion2Text:
      "Si vous cherchiez un dossier ou un suivi de demande, vous pouvez revenir à la page d'ensemble de vos dossiers.",
    suggestion2Button1: "Aller à mon espace",
    suggestion2Button2: "Signaler un problème de lien",
    footerText:
      "Si le problème persiste et que vous pensez qu'un dossier devrait être accessible, vous pouvez nous écrire à :",
  },
  en: {
    tag: "Page not found",
    title: "This page does not exist (yet).",
    description:
      "The URL you opened does not match any active page of the LeBoy interface. This may come from an incomplete link, an old bookmark or a file that is not yet linked to this pilot version of the client space.",
    suggestion1Title: "Return to main site",
    suggestion1Text:
      "To find LeBoy's presentation, services offered and request form.",
    suggestion1Button: "Back to home",
    suggestion2Title: "Access your space",
    suggestion2Text:
      "If you were looking for a file or request follow-up, you can return to the overview page of your files.",
    suggestion2Button1: "Go to my space",
    suggestion2Button2: "Report a link problem",
    footerText:
      "If the problem persists and you think a file should be accessible, you can write to us at:",
  },
} as const;

export default function NotFound() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const pathname = usePathname();
  const [userSpace, setUserSpace] = useState<string>("/espace-client");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Détecter le rôle de l'utilisateur et déterminer l'espace approprié
    async function detectUserSpace() {
      try {
        // Vérifier si l'URL actuelle contient /admin/finance/
        // Utiliser window.location.pathname car usePathname() peut ne pas fonctionner sur 404
        const currentPath = typeof window !== "undefined" ? window.location.pathname : pathname || "";
        const isFromFinance = currentPath.includes("/admin/finance/");

        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          // Si l'API échoue, utiliser l'espace client par défaut
          setUserSpace("/espace-client");
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        
        if (data?.authenticated && data?.user?.role) {
          const role = data.user.role;
          if (role === "admin") {
            // Si on vient d'une sous-rubrique finance, rediriger vers /admin/finance
            if (isFromFinance) {
              setUserSpace("/admin/finance");
            } else {
              setUserSpace("/admin");
            }
          } else if (role === "prestataire") {
            setUserSpace("/prestataires/espace");
          } else {
            setUserSpace("/espace-client");
          }
        } else {
          // Non authentifié, utiliser l'espace client par défaut
          setUserSpace("/espace-client");
        }
      } catch (error) {
        console.error("Erreur lors de la détection de l'espace utilisateur:", error);
        // Par défaut, espace client
        setUserSpace("/espace-client");
      } finally {
        setLoading(false);
      }
    }

    detectUserSpace();
  }, [pathname]);

  return (
    <main className="min-h-[70vh] bg-[#F2F2F5]">
      <section className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-20">
        {/* Bandeau breadcrumb */}
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A55F] mb-3">
          {t.tag}
        </p>

        {/* Bloc principal */}
        <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm px-5 md:px-7 py-8 md:py-10 space-y-5">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
              {t.title}
            </h1>
            <p
              className="text-sm md:text-base text-[#4B4F58]"
              style={{ textAlign: "justify" }}
            >
              {t.description}
            </p>
          </div>

          {/* Suggestions */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 text-xs md:text-sm text-[#4B4F58]">
            <div className="border border-[#E2E2E8] rounded-xl px-4 py-3 bg-[#F9F9FB] space-y-1">
              <p className="font-heading text-sm font-semibold text-[#0A1B2A]">
                {t.suggestion1Title}
              </p>
              <p style={{ textAlign: "justify" }}>{t.suggestion1Text}</p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-md bg-[#0A1B2A] text-white px-4 py-1.5 font-semibold text-xs md:text-sm hover:bg-[#07121e] transition"
                >
                  {t.suggestion1Button}
                </Link>
              </div>
            </div>

            <div className="border border-[#E2E2E8] rounded-xl px-4 py-3 bg-[#FFF9EC] space-y-1">
              <p className="font-heading text-sm font-semibold text-[#0A1B2A]">
                {t.suggestion2Title}
              </p>
              <p style={{ textAlign: "justify" }}>{t.suggestion2Text}</p>
              <div className="pt-2 flex flex-wrap gap-2">
                <Link
                  href={userSpace}
                  className="inline-flex items-center justify-center rounded-md border border-[#C8A55F] text-[#0A1B2A] px-4 py-1.5 font-semibold text-xs md:text-sm hover:bg-[#C8A55F] hover:text-[#0A1B2A] transition"
                >
                  {t.suggestion2Button1}
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md border border-transparent text-[#4B4F58] px-3 py-1.5 text-[11px] md:text-xs hover:underline"
                >
                  {t.suggestion2Button2}
                </Link>
              </div>
            </div>
          </div>

          {/* Petit texte en bas */}
          <p className="text-[11px] md:text-xs text-[#9CA3AF]">
            {t.footerText}{" "}
            <span className="font-semibold text-[#4B4F58]">
              contact@leboy.com
            </span>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
