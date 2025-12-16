


"use client";

// Forcer le rendu dynamique pour éviter les erreurs de prerender
export const dynamic = 'force-dynamic';

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "../components/LanguageProvider";
import { Lock, CheckCircle2 } from "lucide-react";

const TEXT = {
  fr: {
    title: "Réinitialiser le mot de passe",
    subtitle: "Entrez votre nouveau mot de passe",
    passwordLabel: "Nouveau mot de passe *",
    passwordPlaceholder: "Minimum 8 caractères",
    confirmLabel: "Confirmer le mot de passe *",
    confirmPlaceholder: "Répétez le mot de passe",
    reset: "Réinitialiser",
    resetting: "Réinitialisation...",
    successMessage: "Mot de passe réinitialisé avec succès. Redirection...",
    errorMessage: "Erreur lors de la réinitialisation.",
    invalidToken: "Lien invalide ou expiré.",
    passwordsMismatch: "Les mots de passe ne correspondent pas.",
  },
  en: {
    title: "Reset password",
    subtitle: "Enter your new password",
    passwordLabel: "New password *",
    passwordPlaceholder: "Minimum 8 characters",
    confirmLabel: "Confirm password *",
    confirmPlaceholder: "Repeat password",
    reset: "Reset",
    resetting: "Resetting...",
    successMessage: "Password reset successfully. Redirecting...",
    errorMessage: "Error during reset.",
    invalidToken: "Invalid or expired link.",
    passwordsMismatch: "Passwords do not match.",
  },
} as const;

// Composant interne qui utilise useSearchParams (doit être dans Suspense)
function ResetPasswordForm() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t.invalidToken);
    }
  }, [token, t.invalidToken]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage(t.passwordsMismatch);
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage(t.invalidToken);
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setMessage(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t.errorMessage);
      }

      setStatus("success");
      setMessage(t.successMessage);

      setTimeout(() => {
        router.push("/connexion");
      }, 2000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-md w-full bg-white border border-[#DDDDDD] rounded-xl p-8 text-center">
        <p className="text-red-600">{t.invalidToken}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full">
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0A1B2A] rounded-full mb-4">
            <Lock className="w-8 h-8 text-[#C8A55F]" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-[#0A1B2A] mb-2">
            {t.title}
          </h1>
          <p className="text-sm text-[#4B4F58]">{t.subtitle}</p>
        </div>

        {status === "success" && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-emerald-800">{message}</p>
          </div>
        )}

        {status === "error" && message && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-[#0A1B2A]">
              {t.passwordLabel}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A]"
              placeholder={t.passwordPlaceholder}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-[#0A1B2A]">
              {t.confirmLabel}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A]"
              placeholder={t.confirmPlaceholder}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status === "success"}
            className="w-full rounded-md bg-[#0A1B2A] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#07121e] disabled:opacity-60"
          >
            {isSubmitting ? t.resetting : t.reset}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="bg-[#F2F2F5] min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}