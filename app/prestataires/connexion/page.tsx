"use client";

// Forcer le rendu dynamique pour éviter les erreurs de prerender avec useLanguage
export const dynamic = 'force-dynamic';

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "../../components/LanguageProvider";
import { Lock, Mail, LogIn, Building2 } from "lucide-react";
import Link from "next/link";
import BackToHomeLink from "../../components/BackToHomeLink";

// Composant interne qui utilise useSearchParams (doit être dans Suspense)
function PrestataireConnexionForm() {
  const { lang } = useLanguage();
  const t = TEXT[lang as "fr" | "en"];
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "error">("idle");
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error || t.errorMessage);
        return;
      }

      // Rediriger selon le rôle retourné par l'API
      const userRole = data?.user?.role || "client";
      
      if (userRole === "admin") {
        window.location.href = "/admin";
      } else if (userRole === "prestataire") {
        window.location.href = from || "/prestataires/espace";
      } else {
        // Si ce n'est pas un prestataire, rediriger vers l'espace approprié
        window.location.href = "/espace-client";
      }
    } catch (err) {
      setStatus("error");
      setMessage(t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A]";
  const labelClass = "text-sm font-medium text-[#0A1B2A]";

  return (
    <>
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0A1B2A] rounded-full mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-[#0A1B2A] mb-2">
          {t.title}
        </h1>
        <p className="text-sm text-[#4B4F58]">{t.subtitle}</p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Message d'erreur */}
        {status === "error" && message && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            {message}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className={labelClass}>
            {t.email}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="votre@email.com"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div className="space-y-1">
          <label htmlFor="password" className={labelClass}>
            {t.password}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              id="password"
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[#0A1B2A] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#07121e] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.connecting}
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              {t.connect}
            </>
          )}
        </button>
      </form>

      {/* Liens */}
      <div className="mt-6 space-y-3 text-center">
        <p className="text-sm text-[#4B4F58]">
          {t.noAccount}{" "}
          <Link
            href="/prestataires/inscription"
            className="text-[#0A1B2A] font-semibold hover:underline"
          >
            {t.register}
          </Link>
        </p>
        <Link
          href="/"
          className="text-sm text-[#4B4F58] hover:text-[#0A1B2A]"
        >
          {t.backHome}
        </Link>
      </div>
    </>
  );
}

const TEXT = {
  fr: {
    title: "Connexion prestataire",
    subtitle: "Accédez à votre espace prestataire LeBoy",
    email: "Email professionnel",
    password: "Mot de passe",
    connect: "Se connecter",
    connecting: "Connexion en cours...",
    errorMessage: "Impossible de se connecter. Vérifiez vos identifiants.",
    noAccount: "Vous n'avez pas encore de compte prestataire ?",
    register: "S'inscrire comme prestataire",
    backHome: "Retour à l'accueil",
    forgotPassword: "Mot de passe oublié ?",
  },
  en: {
    title: "Provider login",
    subtitle: "Access your LeBoy provider space",
    email: "Professional email",
    password: "Password",
    connect: "Log in",
    connecting: "Connecting...",
    errorMessage: "Unable to connect. Please check your credentials.",
    noAccount: "Don't have a provider account yet?",
    register: "Register as provider",
    backHome: "Back to home",
    forgotPassword: "Forgot password?",
  },
} as const;

export default function PrestataireConnexionPage() {
  return (
    <main className="bg-[#F2F2F5] min-h-screen flex items-center justify-center p-4">
      <BackToHomeLink />
      <div className="max-w-md w-full">
        <div className="bg-white border border-[#DDDDDD] rounded-xl p-8 shadow-sm">
          <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
            <PrestataireConnexionForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
