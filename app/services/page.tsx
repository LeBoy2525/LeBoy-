"use client";

// Forcer le rendu dynamique pour éviter les erreurs de prerender avec useLanguage
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { FileText, Home, Briefcase, Shield, UserCheck } from "lucide-react";
import { useLanguage } from "../components/LanguageProvider";
import BackToHomeLink from "../components/BackToHomeLink";

type OpenStates = {
  [id: string]: boolean;
};

const TEXT = {
  fr: {
    heroTag: "Domaines de services LeBoy",
    heroTitle: "Donner du cadre à vos démarches là où vous ne pouvez pas être.",
    heroSubtitle:
      "LeBoy est une plateforme de services conçue pour la diaspora à travers le monde. Une interface structurée pour certaines démarches : documents officiels, terrains, fiscalité ciblée, projets d'entreprise ou mandats privés sensibles. L'idée : clarifier ce qui est possible, dans quel cadre, et avec quelles limites.",
    mini1Title: "Dossiers & actes",
    mini1Text:
      "Actes, certificats, casiers, duplicatas, régularisation ou suivi de dossiers administratifs.",
    mini2Title: "Terrains & patrimoine",
    mini2Text:
      "Titres fonciers, visites, rapports, suivi simple de chantier ou gestion locative de base.",
    mini3Title: "Projets & mandats privés",
    mini3Text:
      "Projets d'entreprise, fiscalité ciblée, situations familiales ou patrimoniales nécessitant un relais structuré.",
    introText1:
      "Chaque carte ci-dessous correspond à un domaine de service. Les exemples sont indicatifs : une demande réelle peut combiner plusieurs éléments.",
    introText2:
      "Si votre situation est mixte ou atypique, vous pourrez la décrire dans le formulaire de demande, et elle sera analysée au cas par cas.",
    voirPlus: "Voir plus ▼",
    voirMoins: "Voir moins ▲",
    exemplesTitle: "Exemples de demandes possibles :",
    serviceNote:
      "Ce service peut être sélectionné comme « type de service principal » dans le formulaire de demande.",
    submitButton: "Soumettre une demande",
    casParticulierTitle: "Et si ma situation ne correspond à aucun de ces blocs ?",
    casParticulierText:
      "C'est possible. Certaines situations sont mixtes, atypiques ou touchent à la fois l'administratif, le foncier, la famille, la fiscalité, etc. Dans ce cas, vous pouvez :",
    casParticulier1:
      "choisir le domaine qui semble le plus proche de votre réalité dans le formulaire ;",
    casParticulier2:
      "utiliser l'espace de description pour expliquer concrètement la situation ;",
    casParticulier3:
      "préciser qu'il s'agit d'une situation particulière à analyser.",
    casParticulierConclusion:
      "La réponse pourra alors être : prise en charge, prise en charge partielle, ou impossibilité d'intervenir dans un cadre clair.",
  },
  en: {
    heroTag: "LeBoy Service Areas",
    heroTitle: "Giving structure to your procedures in Cameroon, from where you live.",
    heroSubtitle:
      "LeBoy is not a promise to \"handle everything remotely\", but a structured interface for specific procedures: official documents, land, targeted tax matters, business projects or sensitive private mandates. The idea: clarify what is possible, within what framework, and with what limits.",
    mini1Title: "Documents & certificates",
    mini1Text:
      "Certificates, civil status documents, criminal records, duplicates, regularization or follow-up of administrative files.",
    mini2Title: "Land & property",
    mini2Text:
      "Land titles, visits, reports, basic site follow-up or simple rental management.",
    mini3Title: "Projects & private mandates",
    mini3Text:
      "Business projects, targeted tax matters, family or estate situations requiring a structured relay.",
    introText1:
      "Each card below corresponds to a service area. The examples are indicative: a real request can combine several elements.",
    introText2:
      "If your situation is mixed or atypical, you can describe it in the request form, and it will be analyzed on a case-by-case basis.",
    voirPlus: "See more ▼",
    voirMoins: "See less ▲",
    exemplesTitle: "Examples of possible requests:",
    serviceNote:
      "This service can be selected as the \"main service type\" in the request form.",
    submitButton: "Submit a request",
    casParticulierTitle: "What if my situation doesn't match any of these blocks?",
    casParticulierText:
      "That's possible. Some situations are mixed, atypical or involve administrative, land, family, tax matters, etc. In this case, you can:",
    casParticulier1:
      "choose the area that seems closest to your reality in the form;",
    casParticulier2:
      "use the description space to explain the situation concretely;",
    casParticulier3:
      "specify that it is a particular situation to be analyzed.",
    casParticulierConclusion:
      "The response can then be: coverage, partial coverage, or impossibility to intervene within a clear framework.",
  },
} as const;

const SERVICES = {
  fr: [
    {
      id: "administratif",
      titre: "Services administratifs",
      resume:
        "Obtenir, régulariser ou suivre des documents officiels dans le pays concerné lorsque l'on vit à l'étranger.",
      texte: [
        "Il s'agit des démarches qui impliquent des actes, certificats, duplicatas ou suivis de dossiers dans les administrations.",
        "L'objectif est de clarifier ce qui est demandé, auprès de quelle administration, et ce qui est réaliste en termes de délais et de pièces à fournir.",
      ],
      exemples: [
        "Acte de naissance",
        "Certificat de nationalité",
        "Casier judiciaire",
        "Certificat de décès / mariage / divorce",
        "Duplicata d'un document officiel",
        "Légalisation de signature",
        "Certification de copies",
        "Suivi de dossier en préfecture, sous-préfecture ou ministères",
      ],
    },
    {
      id: "immobilier_foncier",
      titre: "Immobilier & foncier",
      resume:
        "Mieux voir, vérifier ou suivre ce qui concerne un terrain, une maison ou un projet immobilier.",
      texte: [
        "Pour beaucoup de personnes de la diaspora, les questions de terrains ou de maisons sont sensibles : absence de visibilité, difficulté à vérifier les informations reçues, lenteur des démarches.",
        "LeBoy vise à structurer des mandats simples : vérifier un titre, faire une visite, documenter un terrain ou accompagner un suivi de chantier de base.",
      ],
      exemples: [
        "Vérification de titre foncier",
        "Contrôle au cadastre ou services fonciers",
        "Visite de terrain ou de propriété avec rapport",
        "Rapports photos / vidéos",
        "Suivi simple de chantier (avancement, présence, état général)",
        "Gestion locative de base (constats, retours, relais local simple)",
      ],
    },
    {
      id: "fiscalite",
      titre: "Fiscalité & conformité",
      resume:
        "Clarifier et suivre certaines démarches fiscales ciblées, sans se substituer à un comptable ou un fiscaliste.",
      texte: [
        "Les obligations fiscales peuvent être difficiles à suivre à distance. L'idée n'est pas de tout faire, mais d'aider à organiser certaines démarches simples et d'agir comme relais avec les professionnels compétents lorsque nécessaire.",
      ],
      exemples: [
        "Déclaration fiscale de base",
        "Paiement d'impôts ou taxes ciblés",
        "Régularisation d'une situation simple",
        "Préparation de dossier en vue d'un contrôle ou d'un audit",
        "Interface avec un comptable ou un fiscaliste lorsque vous en avez un",
      ],
    },
    {
      id: "entrepreneuriat",
      titre: "Entrepreneuriat & business",
      resume:
        "Accompagner des démarches administratives et pratiques pour un projet d'entreprise dans le pays concerné.",
      texte: [
        "Lancer ou structurer un projet à distance suppose souvent de coordonner plusieurs interlocuteurs : administration, notaires, banques, partenaires locaux.",
        "LeBoy ne remplace pas un cabinet d'expertise, mais peut aider à suivre certaines étapes et à servir d'interface.",
      ],
      exemples: [
        "Appui à la création d'entreprise (démarches de base)",
        "Domiciliation administrative simple",
        "Suivi de formalités (RCCM, immatriculations, dossiers administratifs)",
        "Interface avec notaires / avocats / comptables",
        "Conseils pratiques liés au terrain (cadre, habitudes, contraintes)",
      ],
    },
    {
      id: "assistance_personnalisee",
      titre: "Assistance personnalisée & mandats privés",
      resume:
        "Organiser un accompagnement sur mesure pour des situations particulières, sensibles ou continues.",
      texte: [
        "Certaines situations ne rentrent pas dans une case précise : suivi d'un proche, situation patrimoniale particulière, tensions familiales liées à des biens, etc.",
        "Dans ces cas, l'idée est de définir un mandat le plus clair possible, avec des limites, des points de suivi et, si nécessaire, des professionnels associés.",
      ],
      exemples: [
        "Mandat privé spécifique (visite, vérification, remise de document…)",
        "Suivi d'une situation familiale ou patrimoniale",
        "Coordination avec vos propres conseillers (avocat, notaire, etc.)",
        "Rapports périodiques (texte, photos, vidéos) sur une situation donnée",
      ],
    },
    {
      id: "express_transport",
      titre: "Transport express diaspora",
      resume:
        "Un relais rapide et encadré pour faire transporter un document important ou un petit colis via un voyageur de la diaspora.",
      texte: [
        "Lorsque quelqu'un voyage entre le pays d'intervention et l'étranger, il peut disposer d'un espace limité (par exemple 1 kg) pour transporter un document ou un petit colis important.",
        "LeBoy structure ce service : vérification du voyageur, contrôle de ce qui est transporté, dépôt sécurisé, suivi du transfert et remise à l'arrivée.",
        "C'est une alternative rapide et humaine aux services d'expédition classiques, tout en restant sécurisée, encadrée et traçable.",
      ],
      exemples: [
        "Transfert express d'un document officiel vers le pays d'intervention ou l'étranger",
        "Remise de clés, documents scellés ou éléments sensibles",
        "Récupération d'un document important dans le pays d'intervention et transport via un voyageur",
        "Dépôt et retrait sécurisés via LeBoy pour éviter les envois informels à risques",
        "Service accéléré pour dossiers urgents nécessitant un transport humain",
      ],
    },
  ],
  en: [
    {
      id: "administratif",
      titre: "Administrative services",
      resume:
        "Obtain, regularize or follow up on official documents in Cameroon when living abroad.",
      texte: [
        "These are procedures involving certificates, duplicates or follow-up of files in administrations.",
        "The goal is to clarify what is requested, from which administration, and what is realistic in terms of deadlines and documents to provide.",
      ],
      exemples: [
        "Birth certificate",
        "Nationality certificate",
        "Criminal record",
        "Death / marriage / divorce certificate",
        "Duplicate of an official document",
        "Signature legalization",
        "Copy certification",
        "File follow-up in prefecture, sub-prefecture or ministries",
      ],
    },
    {
      id: "immobilier_foncier",
      titre: "Real estate & land",
      resume:
        "Better see, verify or follow what concerns a plot of land, a house or a real estate project.",
      texte: [
        "For many people in the diaspora, land or house issues are sensitive: lack of visibility, difficulty verifying received information, slow procedures.",
        "LeBoy aims to structure simple mandates: verify a title, conduct a visit, document a plot or accompany basic site follow-up.",
      ],
      exemples: [
        "Land title verification",
        "Check at cadastre or land services",
        "Site or property visit with report",
        "Photo / video reports",
        "Basic site follow-up (progress, presence, general condition)",
        "Basic rental management (reports, returns, simple local relay)",
      ],
    },
    {
      id: "fiscalite",
      titre: "Tax & compliance",
      resume:
        "Clarify and follow certain targeted tax procedures, without replacing an accountant or tax advisor.",
      texte: [
        "Tax obligations can be difficult to follow remotely. The idea is not to do everything, but to help organize certain simple procedures and act as a relay with competent professionals when necessary.",
      ],
      exemples: [
        "Basic tax return",
        "Payment of targeted taxes",
        "Regularization of a simple situation",
        "File preparation for a check or audit",
        "Interface with an accountant or tax advisor when you have one",
      ],
    },
    {
      id: "entrepreneuriat",
      titre: "Entrepreneurship & business",
      resume:
        "Accompany administrative and practical procedures for a business project in Cameroon.",
      texte: [
        "Launching or structuring a project remotely often requires coordinating several stakeholders: administration, notaries, banks, local partners.",
        "LeBoy does not replace an expertise firm, but can help follow certain steps and serve as an interface.",
      ],
      exemples: [
        "Support for business creation (basic procedures)",
        "Simple administrative domiciliation",
        "Follow-up of formalities (RCCM, registrations, administrative files)",
        "Interface with notaries / lawyers / accountants",
        "Practical advice related to the field (framework, habits, constraints)",
      ],
    },
    {
      id: "assistance_personnalisee",
      titre: "Personalized assistance & private mandates",
      resume:
        "Organize tailored support for particular, sensitive or ongoing situations.",
      texte: [
        "Some situations don't fit into a precise category: follow-up of a relative, particular estate situation, family tensions related to property, etc.",
        "In these cases, the idea is to define a mandate as clearly as possible, with limits, follow-up points and, if necessary, associated professionals.",
      ],
      exemples: [
        "Specific private mandate (visit, verification, document delivery…)",
        "Follow-up of a family or estate situation",
        "Coordination with your own advisors (lawyer, notary, etc.)",
        "Periodic reports (text, photos, videos) on a given situation",
      ],
    },
    {
      id: "express_transport",
      titre: "Express diaspora transport",
      resume:
        "A fast and structured relay to transport an important document or small package via a diaspora traveler.",
      texte: [
        "When someone travels between the country of intervention and abroad, they may have limited space (e.g., 1 kg) to transport an important document or small package.",
        "LeBoy structures this service: traveler verification, control of what is transported, secure deposit, transfer follow-up and delivery upon arrival.",
        "It's a fast and human alternative to classic shipping services, while remaining secure, structured and traceable.",
      ],
      exemples: [
        "Express transfer of an official document to Cameroon or abroad",
        "Delivery of keys, sealed documents or sensitive items",
        "Recovery of an important document in the country of intervention and transport via a traveler",
        "Secure deposit and withdrawal via LeBoy to avoid risky informal shipments",
        "Accelerated service for urgent files requiring human transport",
      ],
    },
  ],
} as const;

export default function ServicesPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const services = SERVICES[lang];
  const [openStates, setOpenStates] = useState<OpenStates>({});

  const icons = {
    administratif: FileText,
    immobilier_foncier: Home,
    fiscalite: Shield,
    entrepreneuriat: Briefcase,
    assistance_personnalisee: UserCheck,
    express_transport: UserCheck,
  };

  const toggleService = (id: string) => {
    setOpenStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <BackToHomeLink />
      {/* HERO / INTRO */}
      <section className="bg-[#0A1B2A] text-white border-b border-[#061019]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-6">
          <div className="space-y-2 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4A657]">
              {t.heroTag}
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold leading-snug">
              {t.heroTitle}
            </h1>
            <p
              className="text-sm md:text-base text-[#E5E5E5]"
              style={{ textAlign: "justify" }}
            >
              {t.heroSubtitle}
            </p>
          </div>

          {/* 3 mini-blocs */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 text-xs md:text-sm">
            <div className="bg-[#0F2438] border border-[#1C3450] rounded-xl px-4 py-3 space-y-1">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#D4A657]">
                {t.mini1Title}
              </p>
              <p style={{ textAlign: "justify" }}>{t.mini1Text}</p>
            </div>
            <div className="bg-[#0F2438] border border-[#1C3450] rounded-xl px-4 py-3 space-y-1">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#D4A657]">
                {t.mini2Title}
              </p>
              <p style={{ textAlign: "justify" }}>{t.mini2Text}</p>
            </div>
            <div className="bg-[#0F2438] border border-[#1C3450] rounded-xl px-4 py-3 space-y-1">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#D4A657]">
                {t.mini3Title}
              </p>
              <p style={{ textAlign: "justify" }}>{t.mini3Text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* LISTE DES SERVICES */}
      <section className="relative bg-gradient-to-b from-[#F7F8FA] to-[#EDEEEF] py-12">
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#D4A657]/20 blur-3xl rounded-full"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 px-4">
          {/* Textes d'introduction */}
          <div className="mb-6 max-w-3xl text-xs md:text-sm text-[#4B4F58] space-y-1">
            <p style={{ textAlign: "justify" }}>{t.introText1}</p>
            <p style={{ textAlign: "justify" }}>{t.introText2}</p>
          </div>

          {/* Layout en colonnes CSS pour éviter les espaces vides */}
          <div className="columns-1 md:columns-2 gap-10 space-y-10">
            {services.map((service) => {
              const isOpen = !!openStates[service.id];
              const Icon = icons[service.id as keyof typeof icons];

              return (
                <article
                  key={service.id}
                  className="break-inside-avoid mb-10 rounded-xl overflow-hidden shadow-sm border border-[#DDDDDD] bg-white"
                >
                  {/* BANDEAU HAUT */}
                  <div className="bg-[#0A1B2A] px-4 md:px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full border border-[#D4A657]/70 flex items-center justify-center">
                        <Icon className="h-5 w-5" style={{ color: "#D4A657" }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] tracking-[0.12em] text-[#E5E5E5] flex items-center gap-2 mb-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-[#D4A657]" />
                          <span className="uppercase">Service </span><span className="font-bold normal-case">LeBoy</span>
                        </p>
                        <h2
                          className="text-lg md:text-xl font-semibold leading-snug"
                          style={{ color: "#FFFFFF" }}
                        >
                          {service.titre}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* CONTENU PRINCIPAL */}
                  <div className="px-4 md:px-5 py-4 md:py-5 space-y-3">
                    <p
                      className="text-xs md:text-sm text-[#4B4F58] font-medium"
                      style={{ textAlign: "justify" }}
                    >
                      {service.resume}
                    </p>

                    {isOpen && (
                      <div className="space-y-3 text-xs md:text-sm text-[#4B4F58]">
                        <div className="space-y-2">
                          {service.texte.map((paragraphe, idx) => (
                            <p key={idx} style={{ textAlign: "justify" }}>
                              {paragraphe}
                            </p>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-[#0A1B2A]">
                            {t.exemplesTitle}
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {service.exemples.map((ex, idx) => (
                              <li key={idx} style={{ textAlign: "justify" }}>
                                {ex}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className="mt-1 inline-flex items-center text-[11px] md:text-xs font-semibold text-[#0A1B2A] hover:text-[#D4A657] transition"
                    >
                      {isOpen ? t.voirMoins : t.voirPlus}
                    </button>
                  </div>

                  {/* PIED DE CARTE */}
                  <div className="bg-[#F9F9FB] border-t border-[#EEEEEE] px-4 md:px-5 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-[11px] md:text-xs text-[#4B4F58]">
                    <p style={{ textAlign: "justify" }}>{t.serviceNote}</p>
                    <a
                      href="/inscription"
                      className="inline-flex items-center justify-center rounded-md bg-[#D4A657] text-[#0A1B2A] px-4 py-1.5 font-semibold text-[11px] md:text-xs hover:brightness-95 transition"
                    >
                      {t.submitButton}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {/* BLOC CAS PARTICULIER - STYLE ROYAL */}
          <div className="mt-10 relative rounded-2xl overflow-hidden border-2 border-[#D4A657] bg-gradient-to-br from-[#FFF9EC] via-[#FFFBF0] to-[#FFF9EC] shadow-xl">
            {/* Élément décoratif doré en haut */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4A657] to-transparent"></div>
            
            {/* Contenu principal */}
            <div className="relative px-6 md:px-8 py-6 md:py-7 space-y-4">
              {/* Icône décorative dorée */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A657] to-[#B8944A] flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-[#0B2135]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-heading text-lg md:text-xl font-extrabold text-[#0B2135] tracking-tight">
                  {t.casParticulierTitle}
                </h3>
              </div>

              {/* Texte principal */}
              <p className="text-sm md:text-base text-[#4B4F58] leading-relaxed" style={{ textAlign: "justify" }}>
                {t.casParticulierText}
              </p>

              {/* Liste stylée avec puces dorées */}
              <div className="space-y-3 ml-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-[#D4A657] flex-shrink-0"></div>
                  <p className="text-sm md:text-base text-[#4B4F58] leading-relaxed flex-1" style={{ textAlign: "justify" }}>
                    {t.casParticulier1}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-[#D4A657] flex-shrink-0"></div>
                  <p className="text-sm md:text-base text-[#4B4F58] leading-relaxed flex-1" style={{ textAlign: "justify" }}>
                    {t.casParticulier2}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-[#D4A657] flex-shrink-0"></div>
                  <p className="text-sm md:text-base text-[#4B4F58] leading-relaxed flex-1" style={{ textAlign: "justify" }}>
                    {t.casParticulier3}
                  </p>
                </div>
              </div>

              {/* Conclusion avec style premium */}
              <div className="mt-5 pt-4 border-t border-[#D4A657]/30">
                <p className="text-sm md:text-base text-[#0B2135] font-medium leading-relaxed italic" style={{ textAlign: "justify" }}>
                  {t.casParticulierConclusion}
                </p>
              </div>
            </div>

            {/* Ligne décorative dorée en bas */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4A657] to-transparent"></div>
          </div>
        </div>
      </section>
    </main>
  );
}
