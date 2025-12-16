"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, LogIn } from "lucide-react";

export default function ConnexionPage() {
  const router = useRouter();

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
        setMessage(
          data?.error ||
            "Impossible de vous connecter pour le moment. Merci de vérifier vos identifiants."
        );
        return;
      }

      // Succès : rediriger selon le rôle de l'utilisateur
      const userRole = data?.user?.role || "client";
      
      if (userRole === "admin") {
        window.location.href = "/admin";
      } else if (userRole === "prestataire") {
        window.location.href = "/prestataires/espace";
      } else {
        // Client par défaut
        window.location.href = "/espace-client";
      }
    } catch (err) {
      setStatus("error");
      setMessage(
        "Une erreur technique est survenue pendant la connexion. Merci de réessayer dans quelques instants."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A]";
  const labelClass = "text-sm font-medium text-[#0A1B2A]";

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14 grid md:grid-cols-[1.15fr,1fr] gap-8 items-stretch">
        {/* Colonne gauche – contexte / rassurance */}
        <div className="space-y-4 md:space-y-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A55F]">
            Espace client LeBoy
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A] leading-snug">
            Connexion à votre espace de suivi.
          </h1>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            Cet espace vous permettra, progressivement, de suivre vos demandes,
            vos mandats et les principaux messages liés à vos dossiers.
            L&apos;objectif : disposer d&apos;un point de repère clair, sans
            multiplier les échanges dispersés.
          </p>

          <div className="grid gap-3 md:gap-4 text-xs md:text-sm text-[#4B4F58]">
            <div className="bg-white border border-[#E2E2E8] rounded-xl px-4 py-3 space-y-1">
              <p className="font-heading text-[11px] uppercase tracking-[0.16em] text-[#C8A55F]">
                Accès actuel
              </p>
              <p style={{ textAlign: "justify" }}>
                Dans cette version pilote, l&apos;accès est réservé à un compte
                de démonstration. Plus tard, chaque personne pourra disposer de
                ses propres identifiants sécurisés.
              </p>
            </div>
            <div className="bg-[#0A1B2A] border border-[#0A1B2A] rounded-xl px-4 py-3 space-y-1 text-[#F2F2F5]">
              <p className="font-heading text-[11px] uppercase tracking-[0.16em] text-[#C8A55F]">
                Rappel
              </p>
              <p className="text-xs md:text-sm" style={{ textAlign: "justify" }}>
                Les informations présentées dans l&apos;espace client sont à
                titre indicatif dans cette phase. Elles illustrent le type de
                suivi qui pourra être proposé lorsque les mandats seront reliés à
                cette interface.
              </p>
            </div>
          </div>
        </div>

        {/* Colonne droite – carte de connexion */}
        <div className="bg-white border border-[#DDDDDD] rounded-2xl shadow-sm px-5 md:px-6 py-6 md:py-7 flex flex-col justify-center space-y-4">
          <div className="space-y-1">
            <p className="font-heading text-base md:text-lg font-semibold text-[#0A1B2A] flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0A1B2A] text-[#C8A55F]">
                <Lock size={16} />
              </span>
              Connexion sécurisée
            </p>
            <p className="text-xs md:text-sm text-[#4B4F58]">
              Merci de renseigner vos identifiants de connexion. Pour la
              démonstration, un compte unique est configuré côté serveur.
            </p>
          </div>

          {/* Message d’erreur */}
          {status === "error" && message && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-800">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className={labelClass}>
                Courriel
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#9CA3AF]">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`${inputClass} pl-9`}
                  placeholder="Ex. : contact@leboy.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className={labelClass}>
                Mot de passe
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#9CA3AF]">
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`${inputClass} pl-9`}
                  placeholder="Mot de passe de démonstration"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <p className="text-[11px] text-[#9CA3AF]">
              Dans cette version pilote, les identifiants vous sont communiqués
                  directement par LeBoy (compte de démonstration).
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0A1B2A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#07121e] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Se connecter à mon espace
                  </>
                )}
              </button>

              <span className="text-[11px] text-[#9CA3AF]">
                En cas de difficulté de connexion, vous pouvez nous écrire à :{" "}
                <span className="font-semibold text-[#4B4F58]">
                  contact@leboy.com
                </span>
                .
              </span>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
