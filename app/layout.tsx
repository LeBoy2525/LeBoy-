import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import "./globals.css";
import { Montserrat, Inter } from "next/font/google";

import HeaderUserSection from "./components/HeaderUserSection";
import { LanguageProvider } from "./components/LanguageProvider";
import LanguageSwitch from "./components/LanguageSwitch";
import HeaderSearch from "./components/HeaderSearch";
import HeaderLogo from "./components/HeaderLogo";
import ErrorBoundary from "./components/ErrorBoundary";

// Vérifier si on est en staging (côté serveur uniquement)
const APP_ENV = process.env.APP_ENV || "local";
const isStaging = APP_ENV === "staging";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "LeBoy – Votre relais de confiance au pays",
  description: "Votre relais de confiance au pays, où que vous viviez. Des missions exécutées sur place, avec un suivi clair et une validation finale avec preuve. Démarches administratives, achats, déplacements, assistance familiale, livraisons, projets.",
  robots: isStaging ? "noindex,nofollow,noarchive,nosnippet" : "index,follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${montserrat.variable} ${inter.variable} font-body bg-[#F2F2F2] text-[#4B4F58]`}
      >
        {/* ✅ Tout ce qui doit être sensible à la langue est dans le LanguageProvider */}
        <LanguageProvider>
          <div className="min-h-screen flex flex-col">
            {/* Banner STAGING */}
            {isStaging && (
              <div className="bg-yellow-500 text-black text-center py-2 px-4 text-sm font-semibold">
                ⚠️ ENVIRONNEMENT DE STAGING — Tests uniquement — Paiements désactivés
              </div>
            )}
            {/* HEADER */}
            <header className="border-b border-[#DDDDDD] bg-white">
              <div className="max-w-7xl mx-auto px-6 py-5">
                <div className="flex items-center justify-between gap-6">
                  {/* Logo */}
                  <HeaderLogo />

                  {/* Barre de recherche */}
                  <HeaderSearch />

                  {/* Langue + user */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <LanguageSwitch />
                    <HeaderUserSection />
                  </div>
                </div>
              </div>
            </header>

            {/* CONTENU */}
            <main className="flex-1">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>

            {/* FOOTER */}
            <footer className="mt-10 bg-[#0B2135] text-[#F2F2F5]">
              <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 md:gap-4 mb-8">
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#D4A657] flex items-center justify-center text-xs font-bold text-[#0B2135] flex-shrink-0">
                        LB
                      </div>
                      <span className="font-heading font-extrabold text-xl text-white">
                        LeBoy
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-[#E5E5E5] leading-relaxed whitespace-nowrap">
                      Le service d'exécution fiable de la diaspora.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="font-semibold text-white text-sm uppercase tracking-wider">Navigation</p>
                    <ul className="space-y-2 text-sm text-[#E5E5E5]">
                      <li>
                        <Link href="/" className="hover:text-[#D4A657] transition-colors">
                          Accueil
                        </Link>
                      </li>
                      <li>
                        <Link href="/services" className="hover:text-[#D4A657] transition-colors">
                          Services
                        </Link>
                      </li>
                      <li>
                        <Link href="/apropos" className="hover:text-[#D4A657] transition-colors">
                          À propos
                        </Link>
                      </li>
                      <li>
                        <Link href="/faq" className="hover:text-[#D4A657] transition-colors">
                          FAQ
                        </Link>
                      </li>
                      <li>
                        <Link href="/contact" className="hover:text-[#D4A657] transition-colors">
                          Contact
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <p className="font-semibold text-white text-sm uppercase tracking-wider">Légal</p>
                    <ul className="space-y-2 text-sm text-[#E5E5E5]">
                      <li>
                        <Link
                          href="/mentions-legales"
                          className="hover:text-[#D4A657] transition-colors"
                        >
                          Conditions générales
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/politique-confidentialite"
                          className="hover:text-[#D4A657] transition-colors"
                        >
                          Politique de confidentialité
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <p className="font-semibold text-white text-sm uppercase tracking-wider">Contact</p>
                    <ul className="space-y-2 text-sm text-[#E5E5E5]">
                      <li>Québec – Canada</li>
                      <li>
                        <a href="mailto:contact@leboy.com" className="hover:text-[#D4A657] transition-colors">
                          contact@leboy.com
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-6 text-center text-xs text-[#E5E5E5]">
                  © LeBoy – {new Date().getFullYear()}. Tous droits réservés.
                </div>
              </div>
            </footer>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
