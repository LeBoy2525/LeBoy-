


"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

const TEXT = {
  fr: {
    title: "Mot de passe oublié",
    subtitle: "Entrez votre email pour recevoir un lien de réinitialisation",
    emailLabel: "Email",
    emailPlaceholder: "vous@exemple.com",
    send: "Envoyer le lien",
    sending: "Envoi en cours...",
    back: "Retour à la connexion",
    successMessage: "Si cet email existe, un lien de réinitialisation a été envoyé.",
    errorMessage: "Erreur lors de l'envoi.",
  },
  en: {
    title: "Forgot password",
    subtitle: "Enter your email to receive a reset link",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    send: "Send link",
    sending: "Sending...",
    back: "Back to login",
    successMessage: "If this email exists, a reset link has been sent.",
    errorMessage: "Error sending.",
  },
} as const;

export default function ForgotPasswordPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t.errorMessage);
      }

      setStatus("success");
      setMessage(t.successMessage);
      
      // En développement, afficher le token
      if (data.token) {
        setResetToken(data.token);
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-[#F2F2F5] min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white border border-[#DDDDDD] rounded-xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0A1B2A] rounded-full mb-4">
              <Mail className="w-8 h-8 text-[#C8A55F]" />
            </div>
            <h1 className="font-heading text-2xl font-semibold text-[#0A1B2A] mb-2">
              {t.title}
            </h1>
            <p className="text-sm text-[#4B4F58]">{t.subtitle}</p>
          </div>

          {status === "success" && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800 mb-2">{message}</p>
              {resetToken && (
                <div className="mt-3 p-3 bg-white rounded border border-emerald-200">
                  <p className="text-xs text-emerald-700 mb-2">
                    En développement, utilisez ce lien :
                  </p>
                  <Link
                    href={`/reset-password?token=${resetToken}`}
                    className="text-xs text-emerald-600 hover:underline break-all"
                  >
                    /reset-password?token={resetToken}
                  </Link>
                </div>
              )}
            </div>
          )}

          {status === "error" && message && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-[#0A1B2A]">
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A]"
                placeholder={t.emailPlaceholder}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-[#0A1B2A] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#07121e] disabled:opacity-60"
            >
              {isSubmitting ? t.sending : t.send}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/connexion"
              className="inline-flex items-center gap-2 text-sm text-[#4B4F58] hover:text-[#0A1B2A]"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}