"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../components/LanguageProvider";
import Link from "next/link";
import BackToHomeLink from "../components/BackToHomeLink";

const TEXT = {
  fr: {
    asideTag: "Accès à votre espace",
    asideTitle: "Retrouver vos demandes et vos échanges en un seul endroit.",
    asideText1:
      "Cet espace est pensé pour limiter les échanges dispersés, les captures d'écran et les informations qui se perdent dans les conversations.",
    asideText2:
      "À mesure que LeBoy se structure, cette zone pourra évoluer : suivi plus détaillé des mandats, historique, documents partagés, etc.",
    asideNote:
      "Si vous n'avez pas encore de compte, commencez par créer un accès depuis la page d'inscription.",
    formTitle: "Se connecter",
    formSubtitle:
      "Entrez votre email et votre mot de passe pour accéder à votre espace.",
    emailLabel: "Courriel *",
    emailPlaceholder: "vous@exemple.com",
    passwordLabel: "Mot de passe *",
    passwordPlaceholder: "Votre mot de passe...",
    connecting: "Connexion...",
    connect: "Se connecter",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un accès",
    successMessage: "Connexion réussie. Redirection en cours...",
    errorMessage: "Erreur lors de la connexion.",
    genericError: "Une erreur est survenue lors de la connexion.",
  },
  en: {
    asideTag: "Access to your space",
    asideTitle: "Find your requests and exchanges in one place.",
    asideText1:
      "This space is designed to limit scattered exchanges, screenshots and information that gets lost in conversations.",
    asideText2:
      "As LeBoy becomes more structured, this area can evolve: more detailed mandate follow-up, history, shared documents, etc.",
    asideNote:
      "If you don't have an account yet, start by creating access from the registration page.",
    formTitle: "Sign in",
    formSubtitle:
      "Enter your email and password to access your space.",
    emailLabel: "Email *",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password *",
    passwordPlaceholder: "Your password...",
    connecting: "Connecting...",
    connect: "Sign in",
    noAccount: "Don't have an account yet?",
    createAccount: "Create access",
    successMessage: "Connection successful. Redirecting...",
    errorMessage: "Error during connection.",
    genericError: "An error occurred during connection.",
  },
} as const;

export default function ConnexionPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Si l'email n'est pas vérifié, rediriger vers la page de vérification
        if (data.requiresVerification && data.email) {
          router.push(`/verification-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        throw new Error(data?.error || t.errorMessage);
      }

      setStatus("success");
      setMessage(t.successMessage);

      // Rediriger selon le rôle retourné par l'API
      const userRole = data?.user?.role || "client";
      
      setTimeout(() => {
        if (userRole === "admin") {
          window.location.href = "/admin";
        } else if (userRole === "prestataire") {
          window.location.href = "/prestataires/espace";
        } else {
          window.location.href = "/espace-client";
        }
      }, 800);
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-xs md:text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A]";

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <BackToHomeLink />
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 grid md:grid-cols-[1.1fr,1.1fr] gap-8 items-center">
        {/* Colonne gauche – bloc foncé */}
        <aside className="bg-[#0A1B2A] rounded-2xl shadow-md p-5 md:p-6 space-y-4 text-[#F2F2F5]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4A657]">
            {t.asideTag}
          </p>
          <p className="text-sm md:text-base font-heading font-semibold text-white">
            {t.asideTitle}
          </p>
          <div className="space-y-2 text-xs md:text-sm text-[#E5E5E5]">
            <p style={{ textAlign: "justify" }}>{t.asideText1}</p>
            <p style={{ textAlign: "justify" }}>{t.asideText2}</p>
          </div>
          <div className="rounded-lg bg-[#112338] border border-[#1F3146] px-4 py-3 text-[11px] text-[#E5E5E5]">
            <p style={{ textAlign: "justify" }}>{t.asideNote}</p>
          </div>
        </aside>

        {/* Colonne droite – formulaire */}
        <div className="bg-white border border-[#DDDDDD] rounded-xl shadow-sm p-5 md:p-6 space-y-5">
          <div className="space-y-1">
            <h1 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
              {t.formTitle}
            </h1>
            <p className="text-xs md:text-sm text-[#4B4F58]">
              {t.formSubtitle}
            </p>
          </div>

          {status !== "idle" && message && (
            <div
              className={`rounded-md px-3 py-2 text-xs md:text-sm ${
                status === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[#0A1B2A]"
              >
                {t.emailLabel}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={inputClass}
                placeholder={t.emailPlaceholder}
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-[#0A1B2A]"
                >
                  {t.passwordLabel}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#4B4F58] hover:text-[#0A1B2A] hover:underline"
                >
                  {lang === "fr" ? "Mot de passe oublié ?" : "Forgot password?"}
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={inputClass}
                placeholder={t.passwordPlaceholder}
              />
            </div>

            {/* Bouton + lien inscription */}
            <div className="pt-3 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center rounded-md bg-[#0A1B2A] text-white px-4 py-2 text-sm font-semibold hover:bg-[#07121e] disabled:opacity-60"
              >
                {isSubmitting ? t.connecting : t.connect}
              </button>
              <p className="text-[11px] md:text-xs text-[#4B4F58] text-center">
                {t.noAccount}{" "}
                <a
                  href="/inscription"
                  className="font-semibold text-[#0A1B2A] hover:text-[#D4A657]"
                >
                  {t.createAccount}
                </a>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
