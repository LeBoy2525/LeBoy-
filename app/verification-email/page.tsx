"use client";

// Forcer le rendu dynamique pour éviter les erreurs de prerender
export const dynamic = 'force-dynamic';

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "../components/LanguageProvider";
import BackToHomeLink from "../components/BackToHomeLink";
import { Mail, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const TEXT = {
  fr: {
    title: "Vérification de votre email",
    subtitle: "Nous avons envoyé un code de vérification à votre adresse email.",
    codeLabel: "Code de vérification",
    codePlaceholder: "Entrez le code à 6 chiffres",
    verify: "Vérifier",
    verifying: "Vérification en cours...",
    resend: "Renvoyer le code",
    resending: "Envoi en cours...",
    successTitle: "Email vérifié avec succès !",
    successMessage: "Votre compte est maintenant actif. Vous pouvez vous connecter.",
    goToLogin: "Aller à la connexion",
    errorMessage: "Code invalide ou expiré. Veuillez réessayer.",
    resendSuccess: "Un nouveau code a été envoyé à votre adresse email.",
    resendError: "Erreur lors du renvoi du code. Veuillez réessayer.",
  },
  en: {
    title: "Email Verification",
    subtitle: "We have sent a verification code to your email address.",
    codeLabel: "Verification code",
    codePlaceholder: "Enter the 6-digit code",
    verify: "Verify",
    verifying: "Verifying...",
    resend: "Resend code",
    resending: "Sending...",
    successTitle: "Email verified successfully!",
    successMessage: "Your account is now active. You can log in.",
    goToLogin: "Go to login",
    errorMessage: "Invalid or expired code. Please try again.",
    resendSuccess: "A new code has been sent to your email address.",
    resendError: "Error resending code. Please try again.",
  },
} as const;

// Composant interne qui utilise useSearchParams (doit être dans Suspense)
function VerificationEmailForm() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const router = useRouter();
  const searchParams = useSearchParams();
  // Normaliser l'email : décoder l'URL et convertir en minuscules
  const emailRaw = searchParams.get("email") || "";
  const email = emailRaw ? decodeURIComponent(emailRaw).toLowerCase().trim() : "";

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setStatus("error");
      setMessage(lang === "fr" ? "Veuillez entrer un code à 6 chiffres." : "Please enter a 6-digit code.");
      return;
    }

    if (!email) {
      setStatus("error");
      setMessage(lang === "fr" ? "Email manquant." : "Email missing.");
      return;
    }

    setIsVerifying(true);
    setStatus("idle");
    setMessage(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t.errorMessage);
      }

      setStatus("success");
      setMessage(t.successMessage);

      // Rediriger vers la connexion après 2 secondes
      setTimeout(() => {
        router.push("/connexion");
      }, 2000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || t.errorMessage);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setStatus("error");
      setMessage(lang === "fr" ? "Email manquant." : "Email missing.");
      return;
    }

    setIsResending(true);
    setStatus("idle");
    setMessage(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t.resendError);
      }

      setStatus("success");
      setMessage(t.resendSuccess);
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || t.resendError);
    } finally {
      setIsResending(false);
    }
  }

  if (status === "success" && message?.includes("succès")) {
    return (
      <>
        <BackToHomeLink />
        <main className="bg-[#F2F2F5] min-h-screen py-10 md:py-14">
          <div className="max-w-md mx-auto px-4 md:px-6">
            <div className="bg-white border border-[#DDDDDD] rounded-2xl shadow-sm p-8 md:p-10 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
                {t.successTitle}
              </h1>
              <p className="text-sm md:text-base text-[#4B4F58]">
                {t.successMessage}
              </p>
              <button
                onClick={() => router.push("/connexion")}
                className="w-full inline-flex items-center justify-center rounded-md bg-[#0A1B2A] text-white px-6 py-3 text-sm font-semibold hover:bg-[#07121e] transition"
              >
                {t.goToLogin}
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <BackToHomeLink />
      <main className="bg-[#F2F2F5] min-h-screen py-10 md:py-14">
        <div className="max-w-md mx-auto px-4 md:px-6">
          <div className="bg-white border border-[#DDDDDD] rounded-2xl shadow-sm p-8 md:p-10 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#D4A657]/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-[#D4A657]" />
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A] mb-2">
                {t.title}
              </h1>
              <p className="text-sm md:text-base text-[#4B4F58]">
                {t.subtitle}
              </p>
              {email && (
                <p className="text-xs text-[#6B7280] mt-2 font-medium">
                  {email}
                </p>
              )}
            </div>

            {status === "error" && message && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            {status === "success" && message && (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="code"
                  className="text-sm font-medium text-[#0A1B2A]"
                >
                  {t.codeLabel}
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(value);
                  }}
                  placeholder={t.codePlaceholder}
                  required
                  maxLength={6}
                  className="w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-4 py-3 text-center text-2xl font-mono tracking-widest text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A]"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || code.length !== 6}
                className="w-full inline-flex items-center justify-center rounded-md bg-[#D4A657] text-[#0B2135] px-6 py-3 text-sm font-semibold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isVerifying ? t.verifying : t.verify}
              </button>
            </form>

            <div className="pt-4 border-t border-[#E2E2E8]">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="w-full inline-flex items-center justify-center gap-2 text-sm text-[#4B4F58] hover:text-[#0A1B2A] disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t.resending}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    {t.resend}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function VerificationEmailPage() {
  return (
    <Suspense fallback={
      <>
        <BackToHomeLink />
        <main className="bg-[#F2F2F5] min-h-screen py-10 md:py-14 flex items-center justify-center">
          <div className="text-center">Chargement...</div>
        </main>
      </>
    }>
      <VerificationEmailForm />
    </Suspense>
  );
}

