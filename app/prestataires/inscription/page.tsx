"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../components/LanguageProvider";
import { Building2, CheckCircle2, AlertCircle, FileText, User } from "lucide-react";
import Link from "next/link";
import BackToHomeLink from "../../components/BackToHomeLink";
import CountrySelect from "../../components/CountrySelect";
import CitySelect from "../../components/CitySelect";
import { SORTED_AFRICA_COUNTRIES } from "@/lib/africaCountries";

const TEXT = {
  fr: {
    tag: "Devenir prestataire LeBoy",
    title: "Rejoignez notre réseau de prestataires vérifiés",
    subtitle:
      "LeBoy met en relation la diaspora avec des professionnels de confiance au Cameroun. Si vous êtes notaire, géomètre, comptable, avocat ou expert dans votre domaine, rejoignez notre réseau.",
    successTitle: "Demande enregistrée avec succès",
    successMessage:
      "Votre demande d'inscription a été reçue. Notre équipe l'examinera sous 48-72h. Vous recevrez un email de confirmation.",
    errorMessage: "Une erreur est survenue. Veuillez réessayer.",
    backHome: "Retour à l'accueil",
    viewStatus: "Suivre ma demande",

    // Formulaire
    formTitle: "Formulaire d'inscription",
    nomEntreprise: "Nom de l'entreprise / Cabinet *",
    nomContact: "Nom du contact principal *",
    email: "Email professionnel *",
    phone: "Téléphone (WhatsApp) *",
    adresse: "Adresse complète *",
    ville: "Ville principale *",
    pays: "Pays d'opération *",
    paysHelp: "Sélectionnez le(s) pays où vous opérez",
    specialites: "Spécialités *",
    specialitesHelp: "Sélectionnez au moins une spécialité",
    zonesIntervention: "Zones d'intervention",
    zonesHelp: "Séparez les villes par des virgules (ex: Yaoundé, Douala, Bafoussam)",
    certifications: "Certifications / Qualifications",
    certificationsHelp: "Séparez par des virgules (ex: Notaire, Géomètre, Comptable agréé)",
    typePrestataire: "Type de prestataire *",
    typeEntreprise: "Entreprise",
    typeFreelance: "Freelance / Indépendant",
    typeEntrepriseDesc: "Structure légale avec documents officiels (RC, CNI, etc.)",
    typeFreelanceDesc: "Indépendant avec compétences/diplômes",
    anneeExperience: "Années d'expérience *",
    tarifType: "Type de tarification",
    tarifFixe: "Tarif fixe",
    tarifPourcentage: "Pourcentage",
    tarifHoraire: "Horaire",
    commissionICD: "Commission LeBoy (%) *",
    commissionHelp: "Pourcentage que vous acceptez de verser à LeBoy (ex: 15%)",
    description: "Description de vos services",
    descriptionPlaceholder: "Présentez brièvement votre expertise et vos services...",
    submit: "Soumettre ma candidature",
    submitting: "Envoi en cours...",
    dateReception: "Date de réception",
  },
  en: {
    tag: "Become a LeBoy provider",
    title: "Join our network of verified providers",
    subtitle:
      "LeBoy connects the diaspora with trusted professionals in Cameroon. If you are a notary, surveyor, accountant, lawyer or expert in your field, join our network.",
    successTitle: "Request registered successfully",
    successMessage:
      "Your registration request has been received. Our team will review it within 48-72 hours. You will receive a confirmation email.",
    errorMessage: "An error occurred. Please try again.",
    backHome: "Back to home",
    viewStatus: "Track my request",

    // Formulaire
    formTitle: "Registration form",
    nomEntreprise: "Company / Firm name *",
    nomContact: "Main contact name *",
    email: "Professional email *",
    phone: "Phone (WhatsApp) *",
    adresse: "Full address *",
    ville: "Main city *",
    specialites: "Specialties *",
    specialitesHelp: "Select at least one specialty",
    zonesIntervention: "Service areas",
    zonesHelp: "Separate cities with commas (e.g.: Yaoundé, Douala, Bafoussam)",
    certifications: "Certifications / Qualifications",
    certificationsHelp: "Separate with commas (e.g.: Notary, Surveyor, Certified Accountant)",
    typePrestataire: "Provider type *",
    typeEntreprise: "Company",
    typeFreelance: "Freelance / Independent",
    typeEntrepriseDesc: "Legal entity with official documents (RC, ID, etc.)",
    typeFreelanceDesc: "Independent with skills/diplomas",
    anneeExperience: "Years of experience *",
    tarifType: "Pricing type",
    tarifFixe: "Fixed rate",
    tarifPourcentage: "Percentage",
    tarifHoraire: "Hourly",
    pays: "Operating country",
    paysHelp: "Select the country(ies) where you operate",
    description: "Service description",
    descriptionPlaceholder: "Briefly present your expertise and services...",
    submit: "Submit my application",
    submitting: "Submitting...",
    dateReception: "Reception date",
  },
} as const;

const SPECIALITES = {
  fr: [
    { value: "administratif", label: "Services administratifs" },
    { value: "immobilier_foncier", label: "Immobilier & foncier" },
    { value: "fiscalite", label: "Fiscalité & comptabilité" },
    { value: "entrepreneuriat", label: "Entrepreneuriat & business" },
    { value: "assistance_personnalisee", label: "Assistance personnalisée" },
  ],
  en: [
    { value: "administratif", label: "Administrative services" },
    { value: "immobilier_foncier", label: "Real estate & land" },
    { value: "fiscalite", label: "Tax & accounting" },
    { value: "entrepreneuriat", label: "Entrepreneurship & business" },
    { value: "assistance_personnalisee", label: "Personalized assistance" },
  ],
} as const;

export default function InscriptionPrestatairePage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prestataireRef, setPrestataireRef] = useState<string | null>(null);

  const [typePrestataire, setTypePrestataire] = useState<"entreprise" | "freelance">("freelance");
  const [selectedSpecialites, setSelectedSpecialites] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Array<{
      id: string;
      type: string;
      name: string;
      url: string;
    }>
  >([]);
  const [uploading, setUploading] = useState(false);
  
  // État pour le fichier en cours de sélection
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<"entreprise" | "certification" | "ordre_professionnel" | "autre">("entreprise");
  const [autreTypeText, setAutreTypeText] = useState<string>("");

  const toggleSpecialite = (value: string) => {
    setSelectedSpecialites((prev) =>
      prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value]
    );
  };

  const handleFileSelect = (file: File | null | undefined) => {
    setSelectedFile(file || null);
    // Réinitialiser le type si un nouveau fichier est sélectionné
    if (file) {
      setDocumentType("entreprise");
      setAutreTypeText("");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    // Si le type est "autre" et qu'il n'y a pas de texte, demander
    if (documentType === "autre" && !autreTypeText.trim()) {
      alert(lang === "fr" 
        ? "Veuillez préciser le type de document dans le champ 'Autre'." 
        : "Please specify the document type in the 'Other' field.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      // Si c'est "autre", utiliser le texte saisi comme type
      const typeToUse = documentType === "autre" ? autreTypeText.trim() : documentType;
      formData.append("type", typeToUse);
      formData.append("uploadedBy", "prestataire-inscription");

      const res = await fetch("/api/prestataires/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erreur lors de l'upload");
      }

      setUploadedDocuments((prev) => [
        ...prev,
        {
          id: data.file.id,
          type: typeToUse,
          name: data.file.name,
          url: data.file.url,
        },
      ]);

      // Réinitialiser après upload réussi
      setSelectedFile(null);
      setDocumentType("entreprise");
      setAutreTypeText("");
      
      // Réinitialiser l'input file pour permettre de sélectionner un nouveau fichier
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error: any) {
      alert(error?.message || "Erreur lors de l'upload du fichier");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (id: string) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Ajouter les spécialités sélectionnées
    formData.set("specialites", JSON.stringify(selectedSpecialites));
    
    // Ajouter les pays sélectionnés
    formData.set("countries", JSON.stringify(selectedCountries));
    
    // Ajouter les villes sélectionnées
    formData.set("zonesIntervention", JSON.stringify(selectedCities));
    
    // Ajouter les documents
    formData.set("documents", JSON.stringify(uploadedDocuments));
    
    // Ajouter le type de prestataire
    formData.set("typePrestataire", typePrestataire);

    // Validation des pays
    if (selectedCountries.length === 0) {
      setErrorMessage(
        lang === "fr"
          ? "Veuillez sélectionner au moins un pays d'opération."
          : "Please select at least one operating country."
      );
      setStatus("error");
      setIsSubmitting(false);
      return;
    }

    // Validation du mot de passe
    const password = (formData.get("password") as string) || "";
    const confirmPassword = (formData.get("confirmPassword") as string) || "";

    if (!password || password.length < 8) {
      setErrorMessage(
        lang === "fr"
          ? "Le mot de passe doit contenir au moins 8 caractères."
          : "Password must be at least 8 characters."
      );
      setStatus("error");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        lang === "fr"
          ? "Les mots de passe ne correspondent pas."
          : "Passwords do not match."
      );
      setStatus("error");
      setIsSubmitting(false);
      return;
    }

    // Le password sera envoyé via formData (déjà dans le formulaire)
    // Pas besoin de formData.set car le champ est dans le formulaire

    try {
      const res = await fetch("/api/prestataires/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error || t.errorMessage);
        return;
      }

      setStatus("success");
      setPrestataireRef(data.prestataire?.ref || null);
    } catch (err) {
      setStatus("error");
      setErrorMessage(t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A]";
  const labelClass = "text-sm font-medium text-[#0A1B2A]";

  if (status === "success") {
    return (
      <main className="bg-[#F2F2F5] min-h-screen py-10 md:py-14">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
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
            {prestataireRef && (
              <p className="text-xs text-[#6B7280]">
                Référence : <span className="font-mono font-semibold">{prestataireRef}</span>
              </p>
            )}
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-[#0A1B2A] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#07121e] transition"
              >
                {t.backHome}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <BackToHomeLink />
      <main className="bg-[#F2F2F5] min-h-screen py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-8">
          {/* Header */}
          <section className="bg-white border border-[#DDDDDD] rounded-2xl shadow-sm px-5 md:px-7 py-6 md:py-7">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4A657] mb-2">
            {t.tag}
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A] leading-snug mb-3">
            {t.title}
          </h1>
          <p
            className="text-sm md:text-base text-[#4B4F58] leading-relaxed"
            style={{ textAlign: "justify" }}
          >
            {t.subtitle}
          </p>
        </section>

        {/* Formulaire */}
        <section className="bg-white border border-[#DDDDDD] rounded-2xl shadow-sm p-5 md:p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#0A1B2A] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#D4A657]" />
            </div>
            <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
              {t.formTitle}
            </h2>
          </div>

          {status === "error" && errorMessage && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type de prestataire */}
            <div className="space-y-4">
              <h3 className="font-heading text-base font-semibold text-[#0A1B2A] border-b border-[#E2E2E8] pb-2">
                {t.typePrestataire}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <label className={`relative flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  typePrestataire === "entreprise" 
                    ? "border-[#0A1B2A] bg-[#F9F9FB]" 
                    : "border-[#DDDDDD] hover:border-[#C8A55F]"
                }`}>
                  <input
                    type="radio"
                    name="typePrestataire"
                    value="entreprise"
                    checked={typePrestataire === "entreprise"}
                    onChange={(e) => setTypePrestataire(e.target.value as "entreprise" | "freelance")}
                    className="mt-1 w-4 h-4 text-[#0A1B2A] border-[#DDDDDD] focus:ring-[#0A1B2A]"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-[#0A1B2A] flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {t.typeEntreprise}
                    </div>
                    <p className="text-sm text-[#6B7280] mt-1">{t.typeEntrepriseDesc}</p>
                  </div>
                </label>
                
                <label className={`relative flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  typePrestataire === "freelance" 
                    ? "border-[#0A1B2A] bg-[#F9F9FB]" 
                    : "border-[#DDDDDD] hover:border-[#C8A55F]"
                }`}>
                  <input
                    type="radio"
                    name="typePrestataire"
                    value="freelance"
                    checked={typePrestataire === "freelance"}
                    onChange={(e) => setTypePrestataire(e.target.value as "entreprise" | "freelance")}
                    className="mt-1 w-4 h-4 text-[#0A1B2A] border-[#DDDDDD] focus:ring-[#0A1B2A]"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-[#0A1B2A] flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {t.typeFreelance}
                    </div>
                    <p className="text-sm text-[#6B7280] mt-1">{t.typeFreelanceDesc}</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Informations de base */}
            <div className="space-y-4">
              <h3 className="font-heading text-base font-semibold text-[#0A1B2A] border-b border-[#E2E2E8] pb-2">
                Informations de base
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="nomEntreprise" className={labelClass}>
                    {t.nomEntreprise}
                  </label>
                  <input
                    id="nomEntreprise"
                    name="nomEntreprise"
                    type="text"
                    required
                    className={inputClass}
                    placeholder="Ex: Cabinet Notarial XYZ"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="nomContact" className={labelClass}>
                    {t.nomContact}
                  </label>
                  <input
                    id="nomContact"
                    name="nomContact"
                    type="text"
                    required
                    className={inputClass}
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className={labelClass}>
                    {t.email}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={inputClass}
                    placeholder="contact@cabinet.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className={labelClass}>
                    {t.phone}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className={inputClass}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>

              {/* Champs mot de passe */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="password" className={labelClass}>
                    {lang === "fr" ? "Mot de passe *" : "Password *"}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className={inputClass}
                    placeholder={lang === "fr" ? "Minimum 8 caractères" : "Minimum 8 characters"}
                  />
                  <p className="text-xs text-[#6B7280]">
                    {lang === "fr" 
                      ? "Le mot de passe doit contenir au moins 8 caractères" 
                      : "Password must be at least 8 characters"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className={labelClass}>
                    {lang === "fr" ? "Confirmer le mot de passe *" : "Confirm password *"}
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    className={inputClass}
                    placeholder={lang === "fr" ? "Répétez le mot de passe" : "Repeat password"}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="adresse" className={labelClass}>
                  {t.adresse}
                </label>
                <input
                  id="adresse"
                  name="adresse"
                  type="text"
                  required
                  className={inputClass}
                  placeholder="Adresse complète"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="ville" className={labelClass}>
                    {t.ville}
                  </label>
                  <input
                    id="ville"
                    name="ville"
                    type="text"
                    required
                    className={inputClass}
                    placeholder="Ex: Yaoundé"
                  />
                </div>

                <CountrySelect
                  countries={SORTED_AFRICA_COUNTRIES}
                  selectedCodes={selectedCountries}
                  onChange={setSelectedCountries}
                  placeholder={lang === "fr" ? "Sélectionnez les pays où vous opérez" : "Select countries where you operate"}
                  label={t.pays}
                  helpText={t.paysHelp}
                />
              </div>
            </div>

            {/* Spécialités */}
            <div className="space-y-4">
              <h3 className="font-heading text-base font-semibold text-[#0A1B2A] border-b border-[#E2E2E8] pb-2">
                {t.specialites}
              </h3>
              <p className="text-xs text-[#6B7280]">{t.specialitesHelp}</p>
              <div className="grid md:grid-cols-2 gap-3">
                {SPECIALITES[lang].map((spec) => (
                  <label
                    key={spec.value}
                    className="flex items-center gap-2 p-3 border border-[#DDDDDD] rounded-md cursor-pointer hover:bg-[#F9F9FB] transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpecialites.includes(spec.value)}
                      onChange={() => toggleSpecialite(spec.value)}
                      className="w-4 h-4 text-[#0A1B2A] border-[#DDDDDD] rounded focus:ring-[#D4A657]"
                    />
                    <span className="text-sm text-[#4B4F58]">{spec.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Zones et certifications */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <CitySelect
                  value={selectedCities}
                  onChange={setSelectedCities}
                  label={t.zonesIntervention}
                  placeholder={t.zonesHelp}
                  lang={lang}
                  multiple={true}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="certifications" className={labelClass}>
                  {t.certifications}
                </label>
                <input
                  id="certifications"
                  name="certifications"
                  type="text"
                  className={inputClass}
                  placeholder="Notaire, Géomètre, Comptable"
                />
                <p className="text-xs text-[#6B7280]">{t.certificationsHelp}</p>
              </div>
            </div>

            {/* Expérience et tarification */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="anneeExperience" className={labelClass}>
                  {t.anneeExperience}
                </label>
                <input
                  id="anneeExperience"
                  name="anneeExperience"
                  type="number"
                  min="0"
                  required
                  className={inputClass}
                  placeholder="5"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tarifType" className={labelClass}>
                  {t.tarifType}
                </label>
                <select
                  id="tarifType"
                  name="tarifType"
                  className={inputClass}
                  defaultValue="fixe"
                >
                  <option value="fixe">{t.tarifFixe}</option>
                  <option value="pourcentage">{t.tarifPourcentage}</option>
                  <option value="horaire">{t.tarifHoraire}</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className={labelClass}>
                {t.description}
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className={inputClass}
                placeholder={t.descriptionPlaceholder}
              />
            </div>

            {/* Documents justificatifs */}
            <div className="space-y-3 pt-6 border-t-2 border-[#D4A657] bg-[#FFF9EC] rounded-lg p-5">
              <div>
                <label className="text-sm font-semibold text-[#0A1B2A] block mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#D4A657]" />
                  {lang === "fr" 
                    ? "Documents justificatifs *" 
                    : "Supporting documents *"}
                </label>
                <p className="text-xs text-[#4B4F58] mb-4 leading-relaxed">
                  {lang === "fr"
                    ? "Veuillez joindre des documents attestant de l'existence de votre entreprise et de vos qualifications professionnelles (ex: extrait RCCM, certificat d'inscription à l'ordre professionnel, diplômes, etc.). Formats acceptés : PDF, JPG, PNG, DOC, DOCX (max 10 MB par fichier)."
                    : "Please attach documents proving your company's existence and professional qualifications (e.g.: RCCM extract, professional order registration certificate, diplomas, etc.). Accepted formats: PDF, JPG, PNG, DOC, DOCX (max 10 MB per file)."}
                </p>

                {/* Zone de sélection de fichier */}
                <div className="bg-white border-2 border-dashed border-[#DDDDDD] rounded-lg p-6 mb-4 hover:border-[#D4A657] transition">
                  {/* Bouton carré pour choisir un fichier */}
                  <div className="flex flex-col items-center gap-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleFileSelect(file);
                        }}
                        disabled={uploading}
                        className="hidden"
                        id="file-input"
                      />
                      <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-[#D4A657]/10 to-[#D4A657]/5 border-2 border-[#D4A657]/30 flex flex-col items-center justify-center hover:bg-[#D4A657]/20 hover:border-[#D4A657]/50 transition-all duration-200">
                        <FileText className="w-8 h-8 text-[#D4A657] mb-2" />
                        <span className="text-xs font-semibold text-[#0A1B2A] text-center px-2">
                          {lang === "fr" ? "Choisir un fichier" : "Choose a file"}
                        </span>
                      </div>
                    </label>
                    
                    {selectedFile && (
                      <div className="w-full space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="text-center">
                          <p className="text-sm font-medium text-[#0A1B2A] mb-1">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        {/* Dropdown pour le type de document */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-[#0A1B2A] block">
                            {lang === "fr" ? "Type de document *" : "Document type *"}
                          </label>
                          <select
                            value={documentType}
                            onChange={(e) => {
                              setDocumentType(e.target.value as "entreprise" | "certification" | "ordre_professionnel" | "autre");
                              if (e.target.value !== "autre") {
                                setAutreTypeText("");
                              }
                            }}
                            className="w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-sm text-[#0A1B2A] outline-none focus:border-[#0A1B2A]"
                          >
                            <option value="entreprise">
                              {lang === "fr" ? "Justificatif d'entreprise" : "Company proof"}
                            </option>
                            <option value="certification">
                              {lang === "fr" ? "Certification / Qualification" : "Certification / Qualification"}
                            </option>
                            <option value="ordre_professionnel">
                              {lang === "fr" ? "Ordre professionnel" : "Professional order"}
                            </option>
                            <option value="autre">
                              {lang === "fr" ? "Autre" : "Other"}
                            </option>
                          </select>

                          {/* Champ texte si "autre" est sélectionné */}
                          {documentType === "autre" && (
                            <input
                              type="text"
                              value={autreTypeText}
                              onChange={(e) => setAutreTypeText(e.target.value)}
                              placeholder={lang === "fr" ? "Précisez le type de document..." : "Specify document type..."}
                              className="w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A]"
                            />
                          )}

                          {/* Bouton pour uploader */}
                          <button
                            type="button"
                            onClick={handleFileUpload}
                            disabled={uploading || (documentType === "autre" && !autreTypeText.trim())}
                            className="w-full rounded-md bg-[#D4A657] text-[#0B2135] px-4 py-2 text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            {uploading 
                              ? (lang === "fr" ? "Upload en cours..." : "Uploading...")
                              : (lang === "fr" ? "Ajouter le document" : "Add document")
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Liste des fichiers uploadés */}
                {uploadedDocuments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-xs font-medium text-[#0A1B2A] mb-2">
                      {lang === "fr" ? "Fichiers joints :" : "Attached files:"}
                    </p>
                    {uploadedDocuments.map((doc: {
                      id: string;
                      type: string;
                      name: string;
                      url: string;
                    }) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-[#DDDDDD] hover:border-[#D4A657] transition"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-[#D4A657] flex-shrink-0" />
                          <span className="text-xs text-[#0A1B2A] truncate font-medium">
                            {doc.name}
                          </span>
                          <span className="text-xs text-[#9CA3AF]">
                            ({doc.type})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold ml-2 px-2 py-1 hover:bg-red-50 rounded transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploading && (
                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#D4A657] border-t-transparent" />
                    {lang === "fr" ? "Upload en cours..." : "Uploading..."}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || selectedSpecialites.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#0A1B2A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#07121e] disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t.submitting}
                  </>
                ) : (
                  t.submit
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
    </>
  );
}
