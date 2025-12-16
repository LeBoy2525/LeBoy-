"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../components/LanguageProvider";
import { User, Building2 } from "lucide-react";
import BackToHomeLink from "../components/BackToHomeLink";
import { SORTED_DIASPORA_COUNTRIES } from "@/lib/diasporaCountries";

const TEXT = {
  fr: {
    tag: "Inscription LeBoy",
    title: "Créer un accès à votre espace LeBoy.",
    text1:
      "Choisissez le type de compte qui correspond à votre profil. Les clients peuvent soumettre des demandes et suivre leurs missions, tandis que les prestataires proposent leurs services au Cameroun.",
    text2:
      "Pour l'instant, il s'agit d'une première version : l'objectif est de sécuriser votre identité (email + mot de passe) et de préparer le suivi de dossiers.",
    note:
      "Merci d'utiliser une adresse courriel active : elle pourra servir pour la confirmation de certaines informations et les échanges liés à vos mandats.",
    accountTypeTitle: "Type de compte *",
    accountTypeClient: "Client",
    accountTypeClientDesc: "Pour soumettre des demandes et suivre vos missions",
    accountTypePrestataire: "Prestataire",
    accountTypePrestataireDesc: "Pour proposer vos services au Cameroun",
    redirectMessage: "Vous serez redirigé vers le formulaire d'inscription prestataire complet.",
    formTitle: "Créer mon compte",
    formSubtitle: "Les champs marqués d'un * sont obligatoires.",
    fullNameLabel: "Nom complet *",
    fullNamePlaceholder: "Ex. : Steve Bani",
    emailLabel: "Courriel *",
    emailPlaceholder: "vous@exemple.com",
    countryLabel: "Pays de résidence *",
    countryPlaceholder: "Sélectionnez votre pays",
    otherCountry: "Autre",
    otherCountryPlaceholder: "Précisez votre pays",
    passwordLabel: "Mot de passe *",
    passwordPlaceholder: "Choisissez un mot de passe...",
    passwordHint: "Idéalement : au moins 8 caractères, avec lettres et chiffres.",
    creating: "Création en cours...",
    create: "Créer mon compte",
    continuePrestataire: "Continuer vers l'inscription prestataire",
    hasAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",
    successMessage: "Votre compte a été créé avec succès.",
    errorMessage: "Erreur lors de la création du compte.",
    genericError: "Une erreur est survenue lors de la création du compte.",
  },
  en: {
    tag: "LeBoy Registration",
    title: "Create access to your LeBoy space.",
    text1:
      "Choose the account type that matches your profile. Clients can submit requests and track their missions, while providers offer their services in Cameroon.",
    text2:
      "For now, this is a first version: the goal is to secure your identity (email + password) and prepare file follow-up.",
    note:
      "Please use an active email address: it can be used for confirmation of certain information and exchanges related to your mandates.",
    accountTypeTitle: "Account type *",
    accountTypeClient: "Client",
    accountTypeClientDesc: "To submit requests and track your missions",
    accountTypePrestataire: "Provider",
    accountTypePrestataireDesc: "To offer your services in Cameroon",
    redirectMessage: "You will be redirected to the complete provider registration form.",
    formTitle: "Create my account",
    formSubtitle: "Fields marked with * are required.",
    fullNameLabel: "Full name *",
    fullNamePlaceholder: "Ex.: Steve Bani",
    emailLabel: "Email *",
    emailPlaceholder: "you@example.com",
    countryLabel: "Country of residence *",
    countryPlaceholder: "Select your country",
    otherCountry: "Other",
    otherCountryPlaceholder: "Specify your country",
    passwordLabel: "Password *",
    passwordPlaceholder: "Choose a password...",
    passwordHint: "Ideally: at least 8 characters, with letters and numbers.",
    creating: "Creating...",
    create: "Create my account",
    continuePrestataire: "Continue to provider registration",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
    successMessage: "Your account has been created successfully.",
    errorMessage: "Error during account creation.",
    genericError: "An error occurred during account creation.",
  },
} as const;

export default function InscriptionPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"client" | "prestataire">("client");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [otherCountry, setOtherCountry] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Si prestataire est sélectionné, rediriger
    if (accountType === "prestataire") {
      router.push("/prestataires/inscription");
      return;
    }

    // Sinon, créer un compte client
    setIsSubmitting(true);
    setStatus("idle");
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Gérer le pays : si "OTHER" est sélectionné, utiliser otherCountry
    const countryValue = selectedCountry === "OTHER" ? otherCountry.trim() : selectedCountry;
    if (!countryValue) {
      setStatus("error");
      setMessage(lang === "fr" ? "Veuillez sélectionner ou préciser votre pays de résidence." : "Please select or specify your country of residence.");
      setIsSubmitting(false);
      return;
    }
    formData.set("country", countryValue);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t.errorMessage);
      }

      // Si la vérification est requise, rediriger vers la page de vérification
      if (data.requiresVerification) {
        const email = formData.get("email") as string;
        router.push(`/verification-email?email=${encodeURIComponent(email)}`);
        return;
      }

      setStatus("success");
      setMessage(t.successMessage);
      form.reset();

      // petite pause puis redirection vers la connexion
      setTimeout(() => {
        router.push("/connexion");
      }, 1200);
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
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 grid md:grid-cols-[1.2fr,1fr] gap-8 items-center">
        {/* Colonne gauche – texte d'accroche */}
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4A657]">
            {t.tag}
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A] leading-snug">
            {t.title}
          </h1>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.text1}
          </p>
          <p
            className="text-xs md:text-sm text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.text2}
          </p>
          <div className="mt-3 rounded-lg bg-[#FFF9EC] border border-[#D4A657] px-4 py-3 text-[11px] md:text-xs text-[#4B4F58]">
            <p style={{ textAlign: "justify" }}>{t.note}</p>
          </div>
        </div>

        {/* Colonne droite – formulaire */}
        <div className="bg-white border border-[#DDDDDD] rounded-xl shadow-sm p-5 md:p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
              {t.formTitle}
            </h2>
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

          {/* Choix du type de compte */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#0A1B2A] block">
              {t.accountTypeTitle}
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType("client")}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  accountType === "client"
                    ? "border-[#0A1B2A] bg-[#F9F9FB]"
                    : "border-[#DDDDDD] hover:border-[#0A1B2A] bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    accountType === "client" ? "bg-[#0A1B2A]" : "bg-[#E2E2E8]"
                  }`}>
                    <User className={`w-4 h-4 ${
                      accountType === "client" ? "text-white" : "text-[#6B7280]"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#0A1B2A] mb-1">
                      {t.accountTypeClient}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {t.accountTypeClientDesc}
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType("prestataire")}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  accountType === "prestataire"
                    ? "border-[#0A1B2A] bg-[#F9F9FB]"
                    : "border-[#DDDDDD] hover:border-[#0A1B2A] bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    accountType === "prestataire" ? "bg-[#0A1B2A]" : "bg-[#E2E2E8]"
                  }`}>
                    <Building2 className={`w-4 h-4 ${
                      accountType === "prestataire" ? "text-white" : "text-[#6B7280]"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#0A1B2A] mb-1">
                      {t.accountTypePrestataire}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {t.accountTypePrestataireDesc}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Message si prestataire est sélectionné */}
          {accountType === "prestataire" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {t.redirectMessage}
              </p>
            </div>
          )}

          {/* Formulaire client */}
          {accountType === "client" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom complet */}
              <div className="space-y-1">
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium text-[#0A1B2A]"
                >
                  {t.fullNameLabel}
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  required
                  className={inputClass}
                  placeholder={t.fullNamePlaceholder}
                />
              </div>

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

              {/* Pays de résidence */}
              <div className="space-y-1">
                <label
                  htmlFor="country"
                  className="text-sm font-medium text-[#0A1B2A]"
                >
                  {t.countryLabel}
                </label>
                <select
                  id="country"
                  name="country"
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    if (e.target.value !== "OTHER") {
                      setOtherCountry("");
                    }
                  }}
                  required={selectedCountry !== "OTHER"}
                  className={inputClass}
                >
                  <option value="">{t.countryPlaceholder}</option>
                  {SORTED_DIASPORA_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {lang === "fr" ? country.nameFr : country.nameEn}
                    </option>
                  ))}
                  <option value="OTHER">{t.otherCountry}</option>
                </select>
                
                {/* Champ texte si "Autre" est sélectionné */}
                {selectedCountry === "OTHER" && (
                  <input
                    type="text"
                    value={otherCountry}
                    onChange={(e) => setOtherCountry(e.target.value)}
                    placeholder={t.otherCountryPlaceholder}
                    required
                    className={inputClass}
                  />
                )}
              </div>

              {/* Mot de passe */}
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-[#0A1B2A]"
                >
                  {t.passwordLabel}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={inputClass}
                  placeholder={t.passwordPlaceholder}
                />
                <p className="text-[11px] text-[#6B7280]">{t.passwordHint}</p>
              </div>

              {/* Bouton + lien connexion */}
              <div className="pt-3 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center rounded-md bg-[#0A1B2A] text-white px-4 py-2 text-sm font-semibold hover:bg-[#07121e] disabled:opacity-60"
                >
                  {isSubmitting ? t.creating : t.create}
                </button>
                <p className="text-[11px] md:text-xs text-[#4B4F58] text-center">
                  {t.hasAccount}{" "}
                  <a
                    href="/connexion"
                    className="font-semibold text-[#0A1B2A] hover:text-[#D4A657]"
                  >
                    {t.signIn}
                  </a>
                </p>
              </div>
            </form>
          )}

          {/* Bouton pour prestataire */}
          {accountType === "prestataire" && (
            <button
              type="button"
              onClick={() => router.push("/prestataires/inscription")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#0A1B2A] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#07121e] transition"
            >
              <Building2 className="w-4 h-4" />
              {t.continuePrestataire}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
