"use client";

// Forcer le rendu dynamique pour éviter les erreurs de prerender avec useLanguage
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "./components/LanguageProvider";
import { 
  FileText, 
  Building2,
  Calculator,
  Heart,
  Truck,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Shield,
  Eye,
  CreditCard,
  Users,
  Star,
  Quote
} from "lucide-react";

const TEXT = {
  fr: {
    heroBrand: "LeBoy",
    heroTagline: "Votre relais de confiance au pays, où que vous viviez.",
    heroTitle: "",
    heroSubtitle: "Vous vivez à l'étranger ? Nous agissons au pays, pour vous. Vous validez en toute confiance.",
    heroTrust1: "Prestataires vérifiés",
    heroTrust2: "Paiement sécurisé",
    heroTrust3: "Validation finale avec preuve",
    heroCtaPrimary: "Lancer une demande",
    heroCtaSecondary: "Devenir prestataire local",
    heroCardTitle: "Comment ça marche ?",
    heroCardLine1: "Vous exprimez votre besoin",
    heroCardLine2: "La mission est prise en charge",
    heroCardLine3: "Vous payez en toute sécurité",
    heroCardLine4: "Validation finale avec preuve",
    ctaPrimary: "Créer une demande",
    ctaSecondary: "Devenir prestataire",

    notreRole: "Notre rôle",
    sectionWhat: "Nous exécutons vos démarches là où vous ne pouvez pas être.",
    sectionWhatText: "LeBoy agit comme votre relais de confiance sur le terrain, pour des missions administratives, financières, immobilières ou personnelles, exécutées localement et validées en fin de mission.",
    step1Title: "Expression du besoin",
    step1Text: "Vous décrivez précisément ce que vous souhaitez faire exécuter, avec le contexte et les contraintes nécessaires.",
    step2Title: "Exécution sur le terrain",
    step2Text: "Un intervenant local qualifié prend en charge la mission conformément au périmètre défini.",
    step3Title: "Validation finale",
    step3Text: "La mission est validée à son achèvement, sur la base d'éléments concrets et vérifiables.",

    categoriesTitle: "Domaines d'intervention",
    categoriesSubtitle: "Des services exécutés localement, pour répondre aux besoins concrets des diasporas, quel que soit le pays concerné.",

    category1Title: "Administratif & documents officiels",
    category1Desc: "Démarches administratives, actes, certificats, dépôts et suivis institutionnels.",

    category2Title: "Immobilier & foncier",
    category2Desc: "Visites, contrôles, vérifications de terrain et suivi de projets immobiliers.",

    category3Title: "Financier & fiscal",
    category3Desc: "Paiements, quittances, obligations fiscales et suivis comptables.",

    category4Title: "Santé & assistance familiale",
    category4Desc: "Accompagnement médical, assistance ponctuelle et coordination locale.",

    category5Title: "Logistique & missions ponctuelles",
    category5Desc: "Achats, livraisons, déplacements et missions spécifiques sur le terrain.",

    category6Title: "Projets & entrepreneuriat",
    category6Desc: "Vérifications, accompagnement et exécution de projets professionnels.",

    workflowTitle: "Comment ça marche ?",
    workflowStep1Title: "Vous exprimez votre besoin",
    workflowStep1Text: "Vous décrivez la mission à réaliser, le contexte et vos attentes. Nous cadrons la demande.",
    workflowStep2Title: "La mission est prise en charge",
    workflowStep2Text: "Un intervenant sélectionné réalise la mission conformément au périmètre défini.",
    workflowStep3Title: "Vous payez en toute sécurité",
    workflowStep3Text: "Vous payez le montant total. Selon votre profil, vous pouvez être éligible à un paiement échelonné.",
    workflowStep4Title: "Validation finale avec preuve",
    workflowStep4Text: "Vous validez la mission sur la base d'éléments concrets et vérifiables.",

    whyTitle: "Pourquoi choisir LeBoy ?",
    why1Title: "Prestataires vérifiés",
    why1Text: "Chaque prestataire est sélectionné selon le rapport qualité/prix/délai, contrôlé et noté.",
    why2Title: "Validation finale avec preuve",
    why2Text: "Vous validez la mission sur la base d'éléments concrets et vérifiables.",
    why3Title: "Paiement protégé",
    why3Text: "Vous payez le montant total en une fois. Selon votre profil, vous pouvez bénéficier d'un paiement échelonné.",
    why4Title: "Support diaspora",
    why4Text: "Nous comprenons vos réalités, vos contraintes, vos attentes.",

    testimonialsTitle: "Témoignages clients",
    testimonial1: "Grâce à LeBoy, ma mère a été conduite en urgence à l'hôpital. Service impeccable.",
    testimonial1Author: "Marie K.",
    testimonial2: "J'ai vérifié un terrain avant achat sans me déplacer.",
    testimonial2Author: "Jean-Pierre D.",
    testimonial3: "LeBoy m'a aidé à initier la délivrance de mon diplôme de bac. Suivi impeccable et résultats rapides.",
    testimonial3Author: "Sophie M.",

    ctaFinalTitle: "Prêt à faire exécuter vos tâches au pays ?",
    ctaFinalText: "Depuis l'étranger, restez efficace, connecté et serein. LeBoy exécute vos missions avec un suivi clair et une validation finale avec preuve.",
    ctaFinalButton: "Créer une demande",
  },
  en: {
    heroBrand: "LeBoy",
    heroTagline: "Your trusted relay back home, wherever you live.",
    heroTitle: "",
    heroSubtitle: "You live abroad? We act back home, for you. You validate with confidence.",
    heroTrust1: "Verified providers",
    heroTrust2: "Secure payment",
    heroTrust3: "Final validation with proof",
    heroCtaPrimary: "Launch a request",
    heroCtaSecondary: "Become a local provider",
    heroCardTitle: "How does it work?",
    heroCardLine1: "You express your need",
    heroCardLine2: "The mission is taken care of",
    heroCardLine3: "You pay securely",
    heroCardLine4: "Final validation with proof",
    ctaPrimary: "Create a request",
    ctaSecondary: "Become a provider",

    notreRole: "Our role",
    sectionWhat: "We execute your procedures where you cannot be.",
    sectionWhatText: "LeBoy acts as your trusted relay on the ground, for administrative, financial, real estate or personal missions, executed locally and validated at the end of the mission.",
    step1Title: "Expression of need",
    step1Text: "You describe precisely what you want to have executed, with the context and necessary constraints.",
    step2Title: "Execution on the ground",
    step2Text: "A qualified local provider takes charge of the mission in accordance with the defined scope.",
    step3Title: "Final validation",
    step3Text: "The mission is validated upon completion, based on concrete and verifiable elements.",

    categoriesTitle: "Areas of intervention",
    categoriesSubtitle: "Services executed locally, to meet the concrete needs of diasporas, regardless of the country concerned.",

    category1Title: "Administrative & official documents",
    category1Desc: "Administrative procedures, certificates, deposits and institutional follow-ups.",

    category2Title: "Real estate & land",
    category2Desc: "Visits, controls, land verifications and real estate project monitoring.",

    category3Title: "Financial & tax",
    category3Desc: "Payments, receipts, tax obligations and accounting follow-ups.",

    category4Title: "Health & family assistance",
    category4Desc: "Medical support, occasional assistance and local coordination.",

    category5Title: "Logistics & occasional missions",
    category5Desc: "Purchases, deliveries, travel and specific missions on the ground.",

    category6Title: "Projects & entrepreneurship",
    category6Desc: "Verifications, support and execution of professional projects.",

    workflowTitle: "How does it work?",
    workflowStep1Title: "You express your need",
    workflowStep1Text: "You describe the mission to be carried out, the context and your expectations. We frame the request.",
    workflowStep2Title: "The mission is taken care of",
    workflowStep2Text: "A selected provider carries out the mission in accordance with the defined scope.",
    workflowStep3Title: "You pay securely",
    workflowStep3Text: "You pay the full amount. Depending on your profile, you may be eligible for installment payment.",
    workflowStep4Title: "We execute — you follow",
    workflowStep4Text: "Proof, photos, videos, notes. Once completed, you receive the final report.",

    whyTitle: "Why choose LeBoy?",
    why1Title: "Verified providers",
    why1Text: "Each provider is selected based on quality/price/deadline ratio, controlled and rated.",
    why2Title: "Final validation with proof",
    why2Text: "You validate the mission based on concrete and verifiable elements.",
    why3Title: "Protected payment",
    why3Text: "You pay the full amount in one go. Depending on your profile, you may benefit from installment payment.",
    why4Title: "Diaspora support",
    why4Text: "We understand your realities, constraints, and expectations.",

    testimonialsTitle: "Client testimonials",
    testimonial1: "Thanks to LeBoy, my mother was taken to the hospital in an emergency. Excellent service.",
    testimonial1Author: "Marie K.",
    testimonial2: "I verified a piece of land before purchase without traveling.",
    testimonial2Author: "Jean-Pierre D.",
    testimonial3: "LeBoy helped me initiate the delivery of my baccalaureate diploma. Excellent follow-up and fast results.",
    testimonial3Author: "Sophie M.",

    ctaFinalTitle: "Ready to have your tasks executed in the country?",
    ctaFinalText: "From abroad, stay efficient, connected, and peaceful. LeBoy executes your missions with clear follow-up and final validation with proof.",
    ctaFinalButton: "Create a request",
  },
} as const;

// Composant pour les cartes de services - Design Royal
function ServiceCard({ 
  icon: Icon, 
  title, 
  description,
  categoryId
}: { 
  icon: any; 
  title: string; 
  description: string;
  categoryId?: string;
}) {
  return (
    <Link 
      href={categoryId ? `/services?category=${categoryId}` : "/services"}
      className="relative bg-white rounded-xl p-6 border border-[#D4A657]/20 hover:border-[#D4A657]/40 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer block"
    >
      {/* Icône royale */}
      <div className="mb-4">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#D4A657]/10 to-[#D4A657]/5 border border-[#D4A657]/30 flex items-center justify-center">
          <Icon className="w-7 h-7 text-[#D4A657]" />
        </div>
      </div>
      
      <h3 className="font-heading text-lg font-bold text-[#0B2135] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#4B4F58] leading-relaxed">
        {description}
      </p>
      
      {/* Ligne décorative dorée en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4A657] to-transparent rounded-b-xl"></div>
    </Link>
  );
}


// Composant pour les avantages
function BenefitCard({ 
  icon: Icon, 
  title, 
  text 
}: { 
  icon: any; 
  title: string; 
  text: string;
}) {
      return (
        <div className="bg-white rounded-[15px] p-6 md:p-7 space-y-4 border border-[#E2E2E8] shadow-sm hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-[#0B2135] flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#D4A657]" />
          </div>
          <h3 className="font-heading text-lg font-bold text-[#0B2135]">
            {title}
          </h3>
          <p className="text-sm text-[#4B4F58] leading-relaxed">
            {text}
          </p>
        </div>
      );
    }

// Composant pour les témoignages
function TestimonialCard({ 
  text, 
  author 
}: { 
  text: string; 
  author: string;
}) {
  return (
    <div className="bg-white rounded-[15px] p-6 md:p-7 space-y-4 border border-[#E2E2E8] shadow-sm hover:shadow-md transition-all duration-300">
      <Quote className="w-8 h-8 text-[#D4A657]" />
      <p className="text-sm text-[#4B4F58] leading-relaxed italic">
        "{text}"
      </p>
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 fill-[#D4A657] text-[#D4A657]" />
        <Star className="w-4 h-4 fill-[#D4A657] text-[#D4A657]" />
        <Star className="w-4 h-4 fill-[#D4A657] text-[#D4A657]" />
        <Star className="w-4 h-4 fill-[#D4A657] text-[#D4A657]" />
        <Star className="w-4 h-4 fill-[#D4A657] text-[#D4A657]" />
        <span className="ml-2 text-xs text-[#4B4F58] font-medium">{author}</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  // État pour l'étape dynamique de la carte hero
  const [currentStep, setCurrentStep] = useState(0);
  
  // Tableau des étapes pour la carte hero (workflow)
  const heroSteps = [
    t.heroCardLine1,
    t.heroCardLine2,
    t.heroCardLine3,
    t.heroCardLine4,
  ];

  // Animation dynamique pour les étapes de la carte hero (change toutes les 2 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % heroSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [heroSteps.length]);

  return (
    <div className="bg-[#F2F2F2] min-h-screen">
      {/* SECTION 1 — HERO */}
      <section className="relative overflow-hidden bg-[#071b2e] text-white py-[clamp(56px,6vw,96px)]">
        {/* Background avec gradients radiaux et image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `
              radial-gradient(1200px 600px at 20% 20%, rgba(255,255,255,0.08), transparent 55%),
              radial-gradient(900px 500px at 80% 30%, rgba(255,255,255,0.06), transparent 60%),
              url("/hero-diaspora.jpg.png")
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'saturate(0.9) contrast(1.06) blur(1px)',
            transform: 'scale(1.04)'
          }}
          aria-hidden="true"
        ></div>
        
        {/* Overlay avec gradient linéaire */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(7,27,46,0.94) 0%, rgba(7,27,46,0.84) 55%, rgba(7,27,46,0.62) 100%)'
          }}
          aria-hidden="true"
        ></div>

        {/* Container */}
        <div className="relative z-10 w-[min(1100px,calc(100%-40px))] mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-[clamp(24px,4vw,56px)] items-center px-5">
          {/* Content */}
          <div className="hero__content">
            {/* Brand */}
            <p className="m-0 mb-0 font-extrabold text-[44px] tracking-[-0.02em] text-white/92">
              {t.heroBrand}
            </p>


            {/* Title - Espace vide pour maintenir l'espacement */}
            <h1 
              className="hero__title m-0 mb-[14px] text-[44px] leading-[1.02] tracking-[-0.02em] font-extrabold"
              aria-label={t.heroTitle}
              style={{ minHeight: '88px' }}
            >
              {t.heroTitle && <span>{t.heroTitle}</span>}
            </h1>

            {/* Subtitle avec animation reveal - 2 lignes distinctes */}
            <p className="hero__subtitle hero__title--reveal m-0 mb-[18px] text-[44px] tracking-[-0.02em] text-white/92 font-extrabold max-w-[56ch]">
              <span 
                className="reveal-line block whitespace-nowrap" 
                style={{ 
                  '--d': '0ms',
                  animationDelay: '0ms'
                } as React.CSSProperties}
              >
                {lang === "fr" ? "Vous êtes à l'étranger." : "You are abroad."}
              </span>
              <span 
                className="reveal-line block whitespace-nowrap" 
                style={{ 
                  '--d': '180ms',
                  animationDelay: '180ms'
                } as React.CSSProperties}
              >
                {lang === "fr" ? "Vos projets au pays avancent enfin." : "Your projects back home finally move forward."}
              </span>
            </p>

            {/* Trust list */}
            <ul className="list-none p-0 m-0 mb-[26px] flex flex-wrap gap-x-[14px] gap-y-[10px] text-white/85 text-sm">
              <li className="px-3 py-2 border border-white/16 rounded-full bg-white/6 backdrop-blur-[6px]">
                {t.heroTrust1}
              </li>
              <li className="px-3 py-2 border border-white/16 rounded-full bg-white/6 backdrop-blur-[6px]">
                {t.heroTrust2}
              </li>
              <li className="px-3 py-2 border border-white/16 rounded-full bg-white/6 backdrop-blur-[6px]">
                {t.heroTrust3}
              </li>
            </ul>

            {/* CTA */}
            <div className="flex gap-[14px] flex-wrap">
              <Link
                href="/demandes"
                className="group relative inline-flex items-center justify-center h-[56px] px-[24px] rounded-full no-underline font-extrabold tracking-[-0.01em] text-[#061524] overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_25px_60px_rgba(214,170,85,0.4)]"
                style={{
                  background: 'linear-gradient(135deg, #d6aa55 0%, #e8c87a 50%, #d6aa55 100%)',
                  boxShadow: '0_18px_40px_rgba(214,170,85,0.25), inset 0_1px_0_rgba(255,255,255,0.3)',
                }}
              >
                {/* Effet de brillance animé */}
                <span 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite',
                  }}
                ></span>
                <span className="relative z-10">
                  {t.heroCtaPrimary}
                </span>
              </Link>
              <Link
                href="/prestataires/inscription"
                className="group relative inline-flex items-center justify-center h-[56px] px-[24px] rounded-full no-underline font-extrabold tracking-[-0.01em] text-[#061524] overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_25px_60px_rgba(255,255,255,0.4)]"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 50%, #ffffff 100%)',
                  boxShadow: '0_18px_40px_rgba(255,255,255,0.3), inset 0_1px_0_rgba(0,0,0,0.05)',
                }}
              >
                {/* Effet de brillance animé */}
                <span 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(214,170,85,0.2) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite',
                  }}
                ></span>
                <span className="relative z-10">
                  {t.heroCtaSecondary}
                </span>
              </Link>
            </div>
          </div>

          {/* Visual Card */}
          <div className="hero__visual flex justify-center" aria-hidden="true">
            <div className="hero__card w-[min(360px,100%)] rounded-[18px] p-4 pb-[14px] border border-[rgba(214,170,85,0.22)] bg-white/8 backdrop-blur-[10px] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="hero__cardTitle font-extrabold text-white/92 mb-[6px] text-base">
                {t.heroCardTitle}
              </div>
              <div className="text-white/75 text-sm mb-[10px] transition-opacity duration-500">
                {heroSteps[currentStep]}
              </div>
              <div className="flex gap-2">
                {heroSteps.map((_, index) => (
                  <span
                    key={index}
                    className={`inline-block w-[10px] h-[10px] rounded-full mr-2 transition-all duration-500 ${
                      index === currentStep
                        ? "bg-[#d6aa55] scale-125"
                        : "bg-white/35"
                    }`}
                  ></span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — CE QUE FAIT LeBoy */}
      <section className="section section--tinted">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Sur-titre discret */}
            <p className="text-sm text-[#6B7280] uppercase tracking-wider mb-6 font-medium">
              {t.notreRole}
            </p>
            
            {/* Titre principal */}
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-[#0A1B2A] mb-6 leading-tight">
              {t.sectionWhat}
            </h2>
            
            {/* Sous-texte explicatif */}
            <p className="text-lg text-[#4B4F58] mb-16 leading-relaxed max-w-3xl">
              {t.sectionWhatText}
            </p>

            {/* Méthode LeBoy — Liste verticale sobre */}
            <div className="space-y-12">
              <div className="flex gap-8">
                <div className="flex-shrink-0">
                  <span className="text-sm font-mono text-[#6B7280] tracking-wider">01</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-semibold text-[#0A1B2A] mb-3">
                    {t.step1Title}
                  </h3>
                  <p className="text-base text-[#4B4F58] leading-relaxed">
                    {t.step1Text}
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex-shrink-0">
                  <span className="text-sm font-mono text-[#6B7280] tracking-wider">02</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-semibold text-[#0A1B2A] mb-3">
                    {t.step2Title}
                  </h3>
                  <p className="text-base text-[#4B4F58] leading-relaxed">
                    {t.step2Text}
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="flex-shrink-0">
                  <span className="text-sm font-mono text-[#6B7280] tracking-wider">03</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-semibold text-[#0A1B2A] mb-3">
                    {t.step3Title}
                  </h3>
                  <p className="text-base text-[#4B4F58] leading-relaxed">
                    {t.step3Text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — DOMAINES D'INTERVENTION */}
      <section className="section">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-[#0A1B2A] mb-4">
              {t.categoriesTitle}
            </h2>
            <p className="text-lg text-[#4B4F58] mb-12 leading-relaxed">
              {t.categoriesSubtitle}
            </p>

            {/* Liste des catégories — Format sobre, orienté texte */}
            <div className="space-y-10">
              <Link href="/services?category=administratif" className="block group p-4 rounded-lg border border-transparent hover:border-[#D4A657]/30 hover:bg-[#FFF9EC]/50 transition-all duration-200 cursor-pointer">
                <h3 className="text-xl font-heading font-semibold text-[#0A1B2A] mb-2 group-hover:text-[#D4A657] transition-colors">
                  {t.category1Title}
                  <span className="inline-block ml-2 text-[#D4A657] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </h3>
                <p className="text-base text-[#4B4F58] leading-relaxed group-hover:text-[#0A1B2A] transition-colors">
                  {t.category1Desc}
                </p>
              </Link>

              <Link href="/services?category=immobilier_foncier" className="block group p-4 rounded-lg border border-transparent hover:border-[#D4A657]/30 hover:bg-[#FFF9EC]/50 transition-all duration-200 cursor-pointer">
                <h3 className="text-xl font-heading font-semibold text-[#0A1B2A] mb-2 group-hover:text-[#D4A657] transition-colors">
                  {t.category2Title}
                  <span className="inline-block ml-2 text-[#D4A657] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </h3>
                <p className="text-base text-[#4B4F58] leading-relaxed group-hover:text-[#0A1B2A] transition-colors">
                  {t.category2Desc}
                </p>
              </Link>

              <Link href="/services?category=fiscalite" className="block group p-4 rounded-lg border border-transparent hover:border-[#D4A657]/30 hover:bg-[#FFF9EC]/50 transition-all duration-200 cursor-pointer">
                <h3 className="text-xl font-heading font-semibold text-[#0A1B2A] mb-2 group-hover:text-[#D4A657] transition-colors">
                  {t.category3Title}
                  <span className="inline-block ml-2 text-[#D4A657] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </h3>
                <p className="text-base text-[#4B4F58] leading-relaxed group-hover:text-[#0A1B2A] transition-colors">
                  {t.category3Desc}
                </p>
              </Link>

              <Link href="/services?category=assistance_personnalisee" className="block group p-4 rounded-lg border border-transparent hover:border-[#D4A657]/30 hover:bg-[#FFF9EC]/50 transition-all duration-200 cursor-pointer">
                <h3 className="text-xl font-heading font-semibold text-[#0A1B2A] mb-2 group-hover:text-[#D4A657] transition-colors">
                  {t.category4Title}
                  <span className="inline-block ml-2 text-[#D4A657] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </h3>
                <p className="text-base text-[#4B4F58] leading-relaxed group-hover:text-[#0A1B2A] transition-colors">
                  {t.category4Desc}
                </p>
              </Link>

              <Link href="/services?category=express_transport" className="block group p-4 rounded-lg border border-transparent hover:border-[#D4A657]/30 hover:bg-[#FFF9EC]/50 transition-all duration-200 cursor-pointer">
                <h3 className="text-xl font-heading font-semibold text-[#0A1B2A] mb-2 group-hover:text-[#D4A657] transition-colors">
                  {t.category5Title}
                  <span className="inline-block ml-2 text-[#D4A657] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </h3>
                <p className="text-base text-[#4B4F58] leading-relaxed group-hover:text-[#0A1B2A] transition-colors">
                  {t.category5Desc}
                </p>
              </Link>

              <Link href="/services?category=entrepreneuriat" className="block group p-4 rounded-lg border border-transparent hover:border-[#D4A657]/30 hover:bg-[#FFF9EC]/50 transition-all duration-200 cursor-pointer">
                <h3 className="text-xl font-heading font-semibold text-[#0A1B2A] mb-2 group-hover:text-[#D4A657] transition-colors">
                  {t.category6Title}
                  <span className="inline-block ml-2 text-[#D4A657] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </h3>
                <p className="text-base text-[#4B4F58] leading-relaxed group-hover:text-[#0A1B2A] transition-colors">
                  {t.category6Desc}
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — POURQUOI CHOISIR LeBoy */}
      <section className="bg-[#0B2135] py-16 md:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A657]/5 rounded-full blur-3xl"></div>
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12 relative z-10">
          <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-4">
            {lang === "fr" 
              ? <><span className="text-white">Pourquoi choisir </span><span className="text-[#D4A657]">LeBoy</span><span className="text-white"> ?</span></>
              : <><span className="text-white">Why choose </span><span className="text-[#D4A657]">LeBoy</span><span className="text-white">?</span></>}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BenefitCard
              icon={Users}
              title={t.why1Title}
              text={t.why1Text}
            />
            <BenefitCard
              icon={Eye}
              title={t.why2Title}
              text={t.why2Text}
            />
            <BenefitCard
              icon={Shield}
              title={t.why3Title}
              text={t.why3Text}
            />
            <BenefitCard
              icon={Heart}
              title={t.why4Title}
              text={t.why4Text}
            />
          </div>
        </div>
      </section>

      {/* SECTION 5.1 — EN CHIFFRES */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-[#0B2135]">120+</p>
              <p className="mt-1 text-sm text-[#4B4F58]">Missions réalisées</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-[#0B2135]">15+</p>
              <p className="mt-1 text-sm text-[#4B4F58]">Prestataires vérifiés</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-[#0B2135]">98%</p>
              <p className="mt-1 text-sm text-[#4B4F58]">Clients satisfaits</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — TÉMOIGNAGES */}
      <section className="bg-[#F2F2F2] py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12">
          <div className="text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-[#0B2135] mb-4">
              {t.testimonialsTitle}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              text={t.testimonial1}
              author={t.testimonial1Author}
            />
            <TestimonialCard
              text={t.testimonial2}
              author={t.testimonial2Author}
            />
            <TestimonialCard
              text={t.testimonial3}
              author={t.testimonial3Author}
            />
          </div>
        </div>
      </section>

      {/* SECTION 7 — CTA FINAL */}
      <section className="bg-[#0B2135] text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-6">
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-center">
            {lang === "fr" 
              ? <><span className="text-[#FFFFFF]">Prêt à faire exécuter vos tâches au pays ?</span></>
              : <><span className="text-[#FFFFFF]">Ready to have your tasks executed in the country?</span></>}
          </h2>

          <div className="w-12 h-1 bg-[#D4A657] mx-auto mt-3 mb-4 rounded-full"></div>
          <p className="text-base md:text-lg text-[#FFFFFF] leading-relaxed">
            {t.ctaFinalText}
          </p>
          <div className="pt-4">
            <Link
              href="/connexion"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4A657] text-[#0B2135] px-8 py-4 text-base font-bold hover:brightness-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {t.ctaFinalButton}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
