"use client";

import { FormEvent, useEffect, useState } from "react";
import { Shield, CheckCircle2, Timer, FileText, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { useLanguage } from "../components/LanguageProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import type { ServiceCategory, ServiceSubcategory } from "@/lib/serviceCategories";
import { DEFAULT_SERVICE_CATEGORIES } from "@/lib/serviceCategories";
import * as Icons from "lucide-react";
import CitySelect from "../components/CitySelect";

type FormStatus = "idle" | "success" | "error";

const TEXT = {
  fr: {
    tag: "Formulaire LeBoy",
    title: "Soumettre une demande à LeBoy.",
    subtitle:
      "Merci d'indiquer les éléments essentiels de votre situation. L'idée n'est pas d'écrire un roman, mais de donner assez de contexte pour que l'analyse soit claire : type de dossier, lieu concerné, difficultés et ce que vous attendez concrètement.",
    whyTag: "Pourquoi on vous demande tout ça ?",
    why1:
      "Pour éviter les malentendus : un mandat mal défini crée plus de frustrations que de solutions. Les informations demandées servent à cadrer votre demande avant de dire \"oui\", \"partiel\" ou \"non\".",
    why2:
      "Pour savoir ce qui est déjà fait : documents disponibles, démarches déjà tentées, personnes déjà impliquées… cela évite de repartir de zéro ou de créer des doublons.",
    why3:
      "Pour situer l'urgence : certaines démarches ont des échéances fortes, d'autres peuvent être planifiées plus sereinement.",
    why4:
      "Vous pourrez ensuite suivre vos demandes depuis votre espace client LeBoy, dans cette version pilote.",
    conseilsTitle: "Quelques repères avant de commencer",
    conseilsText:
      "Prenez 3 à 5 minutes pour décrire votre situation de manière simple et honnête. Ce formulaire n'engage pas encore un mandat : il permet d'analyser si LeBoy peut intervenir, et comment.",
    conseils1: "Le type de dossier (administratif, foncier, fiscal…).",
    conseils2:
      "La ville / région concernée dans le pays d'intervention, et le contexte local si important.",
    conseils3: "Les documents déjà disponibles ou manquants.",
    conseils4:
      "Les échéances importantes ou contraintes de temps éventuelles.",
    conseilsNote:
      "Vous recevrez d'abord une réponse sur la prise en charge : possible, partielle, ou non pertinente dans le cadre de LeBoy.",
    formTitle: "Formulaire de demande",
    formVersion: "Version pilote – LeBoy",
    successMessage: "Votre demande a été enregistrée avec succès. Redirection vers votre espace client...",
    errorMessage:
      "Une erreur est survenue lors de l'enregistrement de votre demande.",
    viewClientSpace: "Voir mon espace client",
    backHome: "Retour à l'accueil",
    fullName: "Nom complet *",
    email: "Courriel *",
    phone: "Téléphone (WhatsApp) *",
    country: "Pays de résidence *",
    city: "Ville de résidence *",
    contactPreference: "Canal de communication préféré",
    contactChoose: "Choisir…",
    serviceType: "Type de service principal *",
    serviceDetail: "Service précis demandé",
    serviceDetailOther: "Précisez le service souhaité",
    serviceDetailOtherPlaceholder:
      "Décrivez en quelques mots le service recherché…",
    lieuTitle: "Lieu concerné",
    countryService: "Pays de service *",
    lieuCity: "Ville / région *",
    lieuCityPlaceholder: "Ex. : Yaoundé, Douala, Bafoussam…",
    lieuDetails: "Lieu précis / repères (facultatif)",
    lieuDetailsPlaceholder:
      "Quartier, administration, village, repères…",
    description: "Description détaillée de la situation *",
    descriptionPlaceholder:
      "Expliquez clairement : contexte, personnes impliquées, difficultés, ce que vous attendez concrètement…",
    attachments: "Pièces jointes (facultatif)",
    attachmentsNote:
      "Vous pouvez joindre des documents utiles (actes, photos, scans, etc.).",
    submitting: "Envoi en cours...",
    submit: "Envoyer la demande",
    supprimer: "Supprimer",
    corbeille: "Corbeille",
    restaurer: "Restaurer",
    demandeSupprimee: "Demande supprimée",
    confirmerSuppression: "Êtes-vous sûr de vouloir supprimer cette demande ?",
    confirmerSuppressionDetail: "La demande sera déplacée dans la corbeille et pourra être restaurée pendant 30 jours.",
    annuler: "Annuler",
    confirmer: "Confirmer",
    joursRestants: "jours restants",
    expiree: "Expirée (plus de 30 jours)",
    aucuneCorbeille: "Aucune demande dans la corbeille",
  },
  en: {
    tag: "LeBoy Form",
    title: "Submit a request to LeBoy.",
    subtitle:
      "Please indicate the essential elements of your situation. The idea is not to write a novel, but to give enough context for the analysis to be clear: type of file, location concerned, difficulties and what you concretely expect.",
    whyTag: "Why are we asking you all this?",
    why1:
      "To avoid misunderstandings: a poorly defined mandate creates more frustrations than solutions. The requested information serves to frame your request before saying \"yes\", \"partial\" or \"no\".",
    why2:
      "To know what is already done: available documents, procedures already attempted, people already involved… this avoids starting from scratch or creating duplicates.",
    why3:
      "To situate urgency: some procedures have strong deadlines, others can be planned more serenely.",
    why4:
      "You will then be able to follow your requests from your LeBoy client space, in this pilot version.",
    conseilsTitle: "A few reference points before starting",
    conseilsText:
      "Take 3 to 5 minutes to describe your situation simply and honestly. This form does not yet commit to a mandate: it allows analyzing whether LeBoy can intervene, and how.",
    conseils1: "The type of file (administrative, land, tax…).",
    conseils2:
      "The city / region concerned in Cameroon, and the local context if important.",
    conseils3: "Documents already available or missing.",
    conseils4:
      "Important deadlines or possible time constraints.",
    conseilsNote:
      "You will first receive a response on coverage: possible, partial, or not relevant within LeBoy's framework.",
    formTitle: "Request form",
    formVersion: "Pilot version – LeBoy",
    successMessage: "Your request has been registered successfully. Redirecting to your client space...",
    errorMessage: "An error occurred while registering your request.",
    viewClientSpace: "View my client space",
    backHome: "Back to home",
    fullName: "Full name *",
    email: "Email *",
    phone: "Phone (WhatsApp) *",
    country: "Country of residence *",
    city: "City of residence *",
    contactPreference: "Preferred communication channel",
    contactChoose: "Choose…",
    serviceType: "Main service type *",
    serviceDetail: "Specific service requested",
    serviceDetailOther: "Specify the desired service",
    serviceDetailOtherPlaceholder:
      "Describe in a few words the service you are looking for…",
    lieuTitle: "Location concerned in Cameroon",
    countryService: "Service country *",
    lieuCity: "City / region *",
    lieuCityPlaceholder: "Ex.: Yaoundé, Douala, Bafoussam…",
    lieuDetails: "Specific location / landmarks (optional)",
    lieuDetailsPlaceholder:
      "Neighborhood, administration, village, landmarks…",
    description: "Detailed description of the situation *",
    descriptionPlaceholder:
      "Explain clearly: context, people involved, difficulties, what you concretely expect…",
    attachments: "Attachments (optional)",
    attachmentsNote:
      "You can attach useful documents (certificates, photos, scans, etc.).",
    submitting: "Sending...",
    submit: "Send the request",
    supprimer: "Delete",
    corbeille: "Trash",
    restaurer: "Restore",
    demandeSupprimee: "Deleted request",
    confirmerSuppression: "Are you sure you want to delete this request?",
    confirmerSuppressionDetail: "The request will be moved to trash and can be restored for 30 days.",
    annuler: "Cancel",
    confirmer: "Confirm",
    joursRestants: "days remaining",
    expiree: "Expired (more than 30 days)",
    aucuneCorbeille: "No requests in trash",
  },
} as const;

const SERVICE_TYPES = {
  fr: {
    administratif: "Services administratifs",
    immobilier_foncier: "Immobilier & foncier",
    fiscalite: "Fiscalité & conformité",
    entrepreneuriat: "Entrepreneuriat & business",
    assistance_personnalisee: "Assistance personnalisée / mandat privé",
    autre: "Autre",
  },
  en: {
    administratif: "Administrative services",
    immobilier_foncier: "Real estate & land",
    fiscalite: "Tax & compliance",
    entrepreneuriat: "Entrepreneurship & business",
    assistance_personnalisee: "Personalized assistance / private mandate",
    autre: "Other",
  },
} as const;

const SERVICE_DETAILS = {
  fr: {
    administratif: [
      { value: "acte_naissance", label: "Acte de naissance" },
      { value: "certificat_nationalite", label: "Certificat de nationalité" },
      { value: "casier_judiciaire", label: "Casier judiciaire" },
      {
        value: "certificat_etat_civil",
        label: "Certificat de décès / mariage / divorce",
      },
      { value: "duplicata", label: "Duplicata de document" },
      { value: "legalisation_signature", label: "Légalisation de signature" },
      { value: "certification_copies", label: "Certification de copies" },
      {
        value: "suivi_dossier_admin",
        label: "Suivi de dossier en préfecture / ministères",
      },
    ],
    immobilier_foncier: [
      {
        value: "verification_titre_foncier",
        label: "Vérification de titre foncier",
      },
      {
        value: "controle_cadastre",
        label: "Contrôle au cadastre / services fonciers",
      },
      { value: "visite_terrain", label: "Visite de terrain / propriété" },
      { value: "rapport_photo_video", label: "Rapport photos / vidéos" },
      { value: "suivi_chantier_simple", label: "Suivi simple de chantier" },
      { value: "gestion_locative_base", label: "Gestion locative de base" },
    ],
    fiscalite: [
      {
        value: "declaration_fiscale_base",
        label: "Déclaration fiscale de base",
      },
      {
        value: "paiement_impots_taxes",
        label: "Paiement d'impôts / taxes ciblés",
      },
      {
        value: "regularisation_simple",
        label: "Régularisation d'une situation simple",
      },
      {
        value: "preparation_dossier_controle",
        label: "Préparation de dossier pour contrôle / audit",
      },
      {
        value: "interface_professionnels_fiscaux",
        label: "Interface avec comptable / fiscaliste",
      },
    ],
    entrepreneuriat: [
      {
        value: "creation_entreprise",
        label: "Appui à la création d'entreprise",
      },
      { value: "domiciliation", label: "Domiciliation administrative simple" },
      {
        value: "suivi_formalites",
        label: "Suivi de formalités (RCCM, dossiers, etc.)",
      },
      {
        value: "interface_notaires_avocats",
        label: "Interface avec notaires / avocats / comptables",
      },
      {
        value: "conseils_pratiques",
        label: "Conseils pratiques liés au terrain",
      },
    ],
    assistance_personnalisee: [
      { value: "mandat_prive", label: "Mandat privé spécifique" },
      {
        value: "situation_familiale_patrimoniale",
        label: "Suivi d'une situation familiale / patrimoniale",
      },
      {
        value: "coordination_conseillers",
        label: "Coordination avec vos propres conseillers",
      },
      {
        value: "rapport_periodique",
        label: "Rapports périodiques (texte, photos, vidéos)",
      },
    ],
  },
  en: {
    administratif: [
      { value: "acte_naissance", label: "Birth certificate" },
      { value: "certificat_nationalite", label: "Nationality certificate" },
      { value: "casier_judiciaire", label: "Criminal record" },
      {
        value: "certificat_etat_civil",
        label: "Death / marriage / divorce certificate",
      },
      { value: "duplicata", label: "Document duplicate" },
      { value: "legalisation_signature", label: "Signature legalization" },
      { value: "certification_copies", label: "Copy certification" },
      {
        value: "suivi_dossier_admin",
        label: "File follow-up in prefecture / ministries",
      },
    ],
    immobilier_foncier: [
      {
        value: "verification_titre_foncier",
        label: "Land title verification",
      },
      {
        value: "controle_cadastre",
        label: "Check at cadastre / land services",
      },
      { value: "visite_terrain", label: "Site / property visit" },
      { value: "rapport_photo_video", label: "Photo / video report" },
      { value: "suivi_chantier_simple", label: "Basic site follow-up" },
      { value: "gestion_locative_base", label: "Basic rental management" },
    ],
    fiscalite: [
      {
        value: "declaration_fiscale_base",
        label: "Basic tax return",
      },
      {
        value: "paiement_impots_taxes",
        label: "Payment of targeted taxes",
      },
      {
        value: "regularisation_simple",
        label: "Regularization of a simple situation",
      },
      {
        value: "preparation_dossier_controle",
        label: "File preparation for check / audit",
      },
      {
        value: "interface_professionnels_fiscaux",
        label: "Interface with accountant / tax advisor",
      },
    ],
    entrepreneuriat: [
      {
        value: "creation_entreprise",
        label: "Support for business creation",
      },
      { value: "domiciliation", label: "Simple administrative domiciliation" },
      {
        value: "suivi_formalites",
        label: "Follow-up of formalities (RCCM, files, etc.)",
      },
      {
        value: "interface_notaires_avocats",
        label: "Interface with notaries / lawyers / accountants",
      },
      {
        value: "conseils_pratiques",
        label: "Practical advice related to the field",
      },
    ],
    assistance_personnalisee: [
      { value: "mandat_prive", label: "Specific private mandate" },
      {
        value: "situation_familiale_patrimoniale",
        label: "Follow-up of a family / estate situation",
      },
      {
        value: "coordination_conseillers",
        label: "Coordination with your own advisors",
      },
      {
        value: "rapport_periodique",
        label: "Periodic reports (text, photos, videos)",
      },
    ],
  },
} as const;

const CONTACT_PREFERENCES = {
  fr: {
    whatsapp: "WhatsApp",
    email: "Email",
    appel: "Appel",
  },
  en: {
    whatsapp: "WhatsApp",
    email: "Email",
    appel: "Call",
  },
} as const;

export default function DemandesPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const t = TEXT[lang];
  const contactPrefs = CONTACT_PREFERENCES[lang];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  // Nouvelles catégories dynamiques
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [serviceType, setServiceType] = useState<string>(""); // ID de la catégorie
  const [serviceSubcategory, setServiceSubcategory] = useState<string>(""); // ID de la sous-catégorie
  const [countryService, setCountryService] = useState<string>("CM"); // Pays de service (par défaut Cameroun)
  const [selectedCity, setSelectedCity] = useState<string[]>([]); // Ville sélectionnée
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [countries, setCountries] = useState<Array<{ code: string; nameFr: string; nameEn: string }>>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");

  // Vérifier l'authentification et récupérer l'email
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const authenticated = data.authenticated === true && data.user?.role === "client";
          setIsAuthenticated(authenticated);
          if (authenticated && data.user?.email) {
            setUserEmail(data.user.email);
          }
        }
      } catch (error) {
        console.error("Erreur vérification auth:", error);
      }
    }
    checkAuth();
  }, []);

  // Charger les catégories et les pays depuis les API routes
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les catégories avec retry
        let retries = 3;
        let loadedCategories: ServiceCategory[] = [];
        
        while (retries > 0 && loadedCategories.length === 0) {
          const categoriesRes = await fetch("/api/service-categories", { cache: "no-store" });
          if (categoriesRes.ok) {
            const categoriesData = await categoriesRes.json();
            loadedCategories = categoriesData.categories || [];
            console.log(`✅ Tentative ${4 - retries}: ${loadedCategories.length} catégorie(s) chargée(s)`);
            
            if (loadedCategories.length > 0) {
              break;
            }
          }
          
          // Attendre un peu avant de réessayer
          if (retries > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          retries--;
        }
        
        // Filtrer pour ne garder que les catégories activées
        let activeCategories = loadedCategories.filter((cat: ServiceCategory) => cat.enabled);
        
        // Si toujours vide après retry, utiliser les catégories par défaut
        if (activeCategories.length === 0) {
          console.warn("⚠️ Aucune catégorie chargée, utilisation des catégories par défaut");
          activeCategories = DEFAULT_SERVICE_CATEGORIES.filter((cat) => cat.enabled).map((category) => ({
            ...category,
            subcategories: category.subcategories.filter((sub) => sub.enabled),
          }));
        }
        
        console.log("✅ Catégories actives finales:", activeCategories.length, activeCategories.map(c => c.nameFr));
        setCategories(activeCategories);
        
        // Charger les pays
        const countriesRes = await fetch("/api/countries", { cache: "no-store" });
        if (countriesRes.ok) {
          const countriesData = await countriesRes.json();
          setCountries(countriesData.countries || []);
        }
      } catch (error) {
        console.error("❌ Erreur chargement données:", error);
      }
    };
    loadData();
  }, []);

  // ID du navigateur (pour lier la demande à "Vos demandes récentes")
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    // Génère ou récupère un ID stocké dans le navigateur
    try {
      let stored = window.localStorage.getItem("icd_client_device_id");
      if (!stored) {
        stored = crypto.randomUUID();
        window.localStorage.setItem("icd_client_device_id", stored);
      }
      setDeviceId(stored);
    } catch (error) {
      console.error("Impossible de gérer le deviceId", error);
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Vérifier la case d'attestation
    if (!attestationChecked) {
      setStatus("error");
      setMessage(
        lang === "fr"
          ? "Veuillez cocher la case d'attestation pour confirmer l'exactitude de vos informations."
          : "Please check the attestation box to confirm the accuracy of your information."
      );
      return;
    }

    // Confirmation finale
    const confirmMessage =
      lang === "fr"
        ? "Êtes-vous sûr de vouloir soumettre cette demande ? Veuillez vérifier que toutes vos informations sont exactes."
        : "Are you sure you want to submit this request? Please verify that all your information is accurate.";

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // On ajoute le deviceId dans les données envoyées
    if (deviceId) {
      formData.set("deviceId", deviceId);
    }

    try {
      console.log("[Formulaire] Envoi de la demande...");
      
      const res = await fetch("/api/demandes", {
        method: "POST",
        body: formData,
      });

      console.log("[Formulaire] Réponse reçue:", res.status, res.statusText);

      let data;
      try {
        data = await res.json();
        console.log("[Formulaire] Données reçues:", data);
      } catch (parseError) {
        console.error("[Formulaire] Erreur lors du parsing JSON:", parseError);
        const text = await res.text();
        console.error("[Formulaire] Réponse brute:", text);
        throw new Error("Erreur lors de la lecture de la réponse du serveur.");
      }

      if (!res.ok) {
        console.error("[Formulaire] Erreur HTTP:", res.status, data);
        throw new Error(data?.error || `Erreur HTTP ${res.status}`);
      }

      console.log("[Formulaire] Demande créée avec succès:", data.demande);
      
      setStatus("success");
      setMessage(t.successMessage);
      form.reset();
      setServiceType("");
      setServiceSubcategory("");
      setCountryService("CM");
      setSelectedCity([]);
      setAttestationChecked(false);

      // Rediriger vers l'espace client après 1.5 secondes
      setTimeout(() => {
        if (isAuthenticated) {
          router.push("/espace-client");
        } else {
          router.push("/");
        }
      }, 1500);
    } catch (error) {
      console.error("[Formulaire] Erreur lors de la soumission:", error);
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : t.errorMessage;
      setMessage(errorMessage);
      console.error("[Formulaire] Message d'erreur affiché:", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Classes communes pour les champs
  const inputClass =
    "w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-xs md:text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A]";
  const selectClass =
    "w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-xs md:text-sm text-[#0A1B2A] outline-none focus:border-[#0A1B2A]";
  const textareaClass =
    "w-full rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 text-xs md:text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A] resize-y";

  // Obtenir les sous-catégories de la catégorie sélectionnée
  const selectedCategory = categories.find((cat) => cat.id === serviceType);
  const availableSubcategories = selectedCategory?.subcategories.filter((sub) => sub.enabled) || [];

  // Récupérer l'icône de la catégorie
  const getCategoryIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || FileText;
    return IconComponent;
  };

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      {/* EN-TÊTE */}
      <section className="bg-white border-b border-[#DDDDDD]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col md:flex-row gap-8 md:items-center">
          {/* Colonne texte */}
          <div className="flex-1 space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A55F]">
              {t.tag}
            </p>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A] leading-snug">
              {t.title}
            </h1>
            <p
              className="text-sm md:text-base text-[#4B4F58] max-w-2xl"
              style={{ textAlign: "justify" }}
            >
              {t.subtitle}
            </p>
          </div>

          {/* Colonne "Pourquoi ce formulaire ?" */}
          <aside className="flex-1 bg-[#0A1B2A] text-[#F2F2F5] rounded-xl p-5 md:p-6 space-y-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A55F]">
              {t.whyTag}
            </p>
            <div className="space-y-3 text-xs md:text-sm text-[#E5E5E5]">
              <div className="flex gap-3">
                <Shield className="h-4 w-4 mt-0.5" />
                <p style={{ textAlign: "justify" }}>{t.why1}</p>
              </div>
              <div className="flex gap-3">
                <FileText className="h-4 w-4 mt-0.5" />
                <p style={{ textAlign: "justify" }}>{t.why2}</p>
              </div>
              <div className="flex gap-3">
                <Timer className="h-4 w-4 mt-0.5" />
                <p style={{ textAlign: "justify" }}>{t.why3}</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <p style={{ textAlign: "justify" }}>{t.why4}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* FORMULAIRE */}
      <section>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 grid md:grid-cols-[1fr,1.1fr] gap-8">
          {/* COLONNE GAUCHE – CONSEILS */}
          <div className="space-y-4 text-sm text-[#4B4F58]">
            <div className="bg-white border rounded-lg shadow-sm p-5 space-y-3">
              <p className="font-heading text-base font-semibold text-[#0A1B2A]">
                {t.conseilsTitle}
              </p>
              <p style={{ textAlign: "justify" }}>{t.conseilsText}</p>
              <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                <li>{t.conseils1}</li>
                <li>{t.conseils2}</li>
                <li>{t.conseils3}</li>
                <li>{t.conseils4}</li>
              </ul>
              <p
                className="text-[11px] text-[#6B7280]"
                style={{ textAlign: "justify" }}
              >
                {t.conseilsNote}
              </p>
            </div>
          </div>

          {/* FORMULAIRE PROPREMENT DIT */}
          <div className="bg-white border rounded-lg shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold text-[#0A1B2A]">
                {t.formTitle}
              </h2>
              <span className="text-[11px] rounded-full bg-[#F2F2F5] px-3 py-1 text-[#4B4F58]">
                {t.formVersion}
              </span>
            </div>

            {/* MESSAGES */}
            {status !== "idle" && message && (
              <div
                className={`rounded-md px-3 py-3 text-sm space-y-2 ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <p>{message}</p>
                {status === "success" && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <a
                      href="/espace-client"
                      className="inline-flex items-center rounded-md bg-[#0A1B2A] px-3 py-1.5 font-semibold text-white hover:bg-[#07121e]"
                    >
                      {t.viewClientSpace}
                    </a>
                    <a
                      href="/"
                      className="inline-flex items-center rounded-md border border-[#0A1B2A] px-3 py-1.5 font-semibold text-[#0A1B2A] hover:bg-[#0A1B2A] hover:text-white"
                    >
                      {t.backHome}
                    </a>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* on glisse aussi le deviceId pour lier la demande à ce navigateur */}
              {deviceId && (
                <input type="hidden" name="deviceId" value={deviceId} />
              )}

              {/* IDENTITÉ */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="fullName"
                    className="text-sm font-medium text-[#0A1B2A]"
                  >
                    {t.fullName}
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-[#0A1B2A]"
                  >
                    {t.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    defaultValue={userEmail}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* COORDONNÉES PERSO */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-[#0A1B2A]"
                  >
                    {t.phone}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="country"
                    className="text-sm font-medium text-[#0A1B2A]"
                  >
                    {t.country}
                  </label>
                  <input
                    id="country"
                    name="country"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="city"
                    className="text-sm font-medium text-[#0A1B2A]"
                  >
                    {t.city}
                  </label>
                  <input
                    id="city"
                    name="city"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="contactPreference"
                    className="text-sm font-medium text-[#0A1B2A]"
                  >
                    {t.contactPreference}
                  </label>
                  <select
                    id="contactPreference"
                    name="contactPreference"
                    className={selectClass}
                  >
                    <option value="">{t.contactChoose}</option>
                    <option value="whatsapp">{contactPrefs.whatsapp}</option>
                    <option value="email">{contactPrefs.email}</option>
                    <option value="appel">{contactPrefs.appel}</option>
                  </select>
                </div>
              </div>

              {/* TYPE DE SERVICE (Catégorie principale) */}
              <div className="space-y-1">
                <label
                  htmlFor="serviceType"
                  className="text-sm font-medium text-[#0A1B2A]"
                >
                  {t.serviceType}
                </label>
                {categories.length === 0 && (
                  <p className="text-xs text-amber-600 mb-1">
                    {lang === "fr" 
                      ? "⏳ Chargement des catégories de services..." 
                      : "⏳ Loading service categories..."}
                  </p>
                )}
                <select
                  id="serviceType"
                  name="serviceType"
                  required
                  value={serviceType}
                  onChange={(e) => {
                    setServiceType(e.target.value);
                    setServiceSubcategory("");
                  }}
                  className={selectClass}
                  disabled={categories.length === 0}
                >
                  <option value="">{lang === "fr" ? "Sélectionnez un service principal..." : "Select a main service..."}</option>
                  {categories.length > 0 ? (
                    categories.map((category) => {
                      return (
                        <option key={category.id} value={category.id}>
                          {lang === "fr" ? category.nameFr : category.nameEn}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>
                      {lang === "fr" ? "Chargement des services..." : "Loading services..."}
                    </option>
                  )}
                </select>
                {selectedCategory && (
                  <p className="text-xs text-[#4B4F58] mt-1">
                    {lang === "fr" ? selectedCategory.descriptionFr : selectedCategory.descriptionEn}
                  </p>
                )}
              </div>

              {/* SOUS-SERVICE DÉTAILLÉ */}
              {selectedCategory && availableSubcategories.length > 0 && (
                <div className="space-y-1">
                  <label
                    htmlFor="serviceSubcategory"
                    className="text-sm font-medium text-[#0A1B2A]"
                  >
                    {t.serviceDetail}
                  </label>
                  <select
                    id="serviceSubcategory"
                    name="serviceSubcategory"
                    value={serviceSubcategory}
                    onChange={(e) => setServiceSubcategory(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{lang === "fr" ? "Sélectionnez un sous-service..." : "Select a sub-service..."}</option>
                    {availableSubcategories.map((sub: ServiceSubcategory) => (
                      <option key={sub.id} value={sub.id}>
                        {lang === "fr" ? sub.nameFr : sub.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* PAYS DE SERVICE ET LIEU */}
              <div className="space-y-2 border-t border-[#DDDDDD] pt-4">
                <p className="text-sm font-medium text-[#0A1B2A]">
                  {t.lieuTitle}
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="countryService"
                      className="text-xs md:text-sm text-[#0A1B2A]"
                    >
                      {t.countryService}
                    </label>
                    <select
                      id="countryService"
                      name="countryService"
                      required
                      value={countryService}
                      onChange={(e) => setCountryService(e.target.value)}
                      className={selectClass}
                    >
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {lang === "fr" ? country.nameFr : country.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <CitySelect
                      value={selectedCity}
                      onChange={setSelectedCity}
                      label={t.lieuCity}
                      placeholder={t.lieuCityPlaceholder}
                      lang={lang}
                      multiple={false}
                      required={true}
                    />
                    <input
                      type="hidden"
                      name="lieuCity"
                      value={selectedCity.length > 0 ? selectedCity[0] : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="lieuDetails"
                      className="text-xs md:text-sm text-[#0A1B2A]"
                    >
                      {t.lieuDetails}
                    </label>
                    <input
                      id="lieuDetails"
                      name="lieuDetails"
                      placeholder={t.lieuDetailsPlaceholder}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-[#0A1B2A]"
                >
                  {t.description}
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  placeholder={t.descriptionPlaceholder}
                  className={textareaClass}
                />
              </div>

              {/* URGENCE */}
              <div className="space-y-1">
                <label
                  htmlFor="urgence"
                  className="text-sm font-medium text-[#0A1B2A]"
                >
                  {lang === "fr" ? "Niveau d'urgence" : "Urgency level"}
                </label>
                <select
                  id="urgence"
                  name="urgence"
                  defaultValue="normal"
                  className={selectClass}
                >
                  <option value="normal">
                    {lang === "fr" ? "Normal" : "Normal"}
                  </option>
                  <option value="urgent">
                    {lang === "fr" ? "Urgent" : "Urgent"}
                  </option>
                  <option value="tres-urgent">
                    {lang === "fr" ? "Très urgent" : "Very urgent"}
                  </option>
                </select>
              </div>

              {/* PIÈCES JOINTES */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#0A1B2A]">
                  {t.attachments}
                </label>
                <input
                  type="file"
                  name="attachments"
                  multiple
                  className="w-full text-xs md:text-sm text-[#0A1B2A]
                             file:mr-3 file:rounded-md file:border-0
                             file:bg-[#0A1B2A] file:px-3 file:py-1.5
                             file:text-xs file:font-semibold file:text-white
                             hover:file:bg-[#07121e]"
                />
                <p className="text-[11px] text-[#4B4F58]">
                  {t.attachmentsNote}
                </p>
              </div>

              {/* ATTESTATION ET CONFIRMATION */}
              <div className="space-y-3 pt-4 border-t border-[#DDDDDD]">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="attestation"
                    checked={attestationChecked}
                    onChange={(e) => setAttestationChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#0A1B2A] border-[#DDDDDD] rounded focus:ring-[#0A1B2A]"
                    required
                  />
                  <label
                    htmlFor="attestation"
                    className="text-xs md:text-sm text-[#4B4F58] cursor-pointer"
                  >
                    {lang === "fr"
                      ? "J'atteste que toutes les informations fournies dans ce formulaire sont exactes et complètes. Je comprends que des informations incorrectes peuvent affecter le traitement de ma demande."
                      : "I attest that all information provided in this form is accurate and complete. I understand that incorrect information may affect the processing of my request."}
                  </label>
                </div>
              </div>

              {/* SUBMIT */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <Link
                  href={isAuthenticated ? "/espace-client" : "/"}
                  className="rounded-md border border-[#DDDDDD] text-[#0A1B2A] px-6 py-2 text-sm font-semibold hover:bg-[#F9F9FB] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t.annuler}
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || !attestationChecked}
                  className="rounded-md bg-[#0A1B2A] text-white px-6 py-2 text-sm font-semibold hover:bg-[#07121e] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t.submitting : t.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
