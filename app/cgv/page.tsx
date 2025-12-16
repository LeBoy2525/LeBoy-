"use client";

// Forcer le rendu dynamique pour éviter les erreurs de prerender avec useLanguage
export const dynamic = 'force-dynamic';

import { useLanguage } from "../components/LanguageProvider";

const TEXT = {
  fr: {
    heroTag: "Légal",
    heroTitle: "Conditions générales de vente (CGV)",
    heroText:
      "Ces conditions générales de vente encadrent les prestations proposées par ICD – Interface Cameroun Diaspora, dans un esprit de clarté, de limites assumées et de transparence avec les personnes en diaspora ayant des dossiers à suivre au Cameroun.",
    overviewTag: "Vue d'ensemble",
    overviewTitle: "En résumé, ces CGV précisent :",
    overview1:
      "le cadre des prestations (interface, relais, suivi de démarches) ;",
    overview2: "la manière dont un mandat est analysé, accepté ou refusé ;",
    overview3: "les modalités d'honoraires et de paiement ;",
    overview4:
      "les limites d'intervention et l'absence de garantie de résultat ;",
    overview5: "les obligations réciproques entre ICD et le client.",
    section1Title: "1. Objet des présentes conditions",
    section1Text1:
      "Les présentes conditions générales de vente (CGV) définissent le cadre applicable aux prestations d'organisation, de relais et de suivi proposées par ICD à des personnes résidant à l'étranger et ayant des démarches ou dossiers à suivre au Cameroun.",
    section1Text2:
      "Toute demande acceptée, puis tout mandat formalisé impliquent l'adhésion pleine et entière du client aux présentes CGV.",
    section2Title: "2. Nature des prestations",
    section2Text1:
      "ICD intervient comme interface d'organisation, de relais et de suivi pour des démarches ciblées, notamment :",
    section2Item1: "démarches administratives (actes, certificats, dossiers) ;",
    section2Item2: "questions foncières ou immobilières simples ;",
    section2Item3: "certaines démarches fiscales limitées ;",
    section2Item4:
      "accompagnement administratif de base pour des projets d'entreprise ;",
    section2Item5: "mandats privés spécifiques et limités.",
    section2Text2:
      "ICD ne remplace pas les professionnels réglementés (avocat, notaire, huissier, fiscaliste, etc.) et renvoie vers eux dès que nécessaire.",
    section3Title: "3. Demande, analyse et acceptation",
    section3Text1:
      "Toute demande initiale se fait via le formulaire de demande ou de contact, ou par courriel. À partir des informations communiquées, ICD :",
    section3Item1: "analyse la demande au regard du cadre d'intervention ;",
    section3Item2:
      "peut demander des précisions ou des pièces complémentaires ;",
    section3Item3:
      "peut accepter, accepter partiellement ou refuser la demande.",
    section3Text2:
      "En cas d'acceptation, un mandat est défini par écrit (ou par échange écrit formalisé) : objet, périmètre, limites, durée estimée, modalités de communication, conditions financières.",
    section4Title: "4. Honoraires et modalités de paiement",
    section4Text1:
      "Les honoraires sont fixés en fonction de la nature du mandat, de sa complexité et du temps estimé. Ils sont systématiquement communiqués au client avant toute validation de mandat.",
    section4Item1: "le paiement peut se faire en une ou plusieurs étapes ;",
    section4Item2:
      "certains frais peuvent être demandés à l'avance (frais administratifs, déplacements, obtention de documents, etc.) ;",
    section4Item3:
      "aucun mandat n'est engagé sans confirmation explicite et, le cas échéant, versement initial.",
    section4Text2:
      "Les montants et modalités précises sont rappelés dans les échanges écrits (courriel ou document récapitulatif).",
    section5Title:
      "5. Limites d'intervention et absence de garantie de résultat",
    section5Text1:
      "ICD travaille dans un environnement où interviennent des administrations, intermédiaires et tiers indépendants. Par conséquent :",
    section5Item1:
      "ICD ne peut pas garantir les délais, décisions ou réactions d'une administration ou d'un tiers ;",
    section5Item2:
      "ICD s'engage sur un travail de moyens (organisation, suivi, relances, documentation), et non sur un résultat imposé aux tiers ;",
    section5Item3:
      "certains blocages peuvent conduire à l'arrêt, à la suspension ou à la redéfinition du mandat.",
    section6Title: "6. Obligations du client",
    section6Text: "Le client s'engage notamment à :",
    section6Item1:
      "fournir des informations exactes, complètes et sincères ;",
    section6Item2:
      "transmettre les documents nécessaires dans des délais raisonnables ;",
    section6Item3:
      "informer ICD de tout changement important ayant un impact sur le mandat ;",
    section6Item4: "respecter les modalités financières convenues.",
    section7Title: "7. Durée, suspension et résiliation du mandat",
    section7Text1:
      "Chaque mandat précise une durée estimée, liée à la nature des démarches et à l'environnement local. Toutefois, cette durée peut varier en fonction d'éléments indépendants d'ICD (administrations, tiers, contexte).",
    section7Text2: "ICD peut suspendre ou résilier un mandat en cas de :",
    section7Item1: "non-paiement des honoraires ou frais convenus ;",
    section7Item2: "absence répétée de réponse du client ;",
    section7Item3:
      "découverte d'éléments rendant le mandat non conforme au cadre légal, réglementaire ou éthique.",
    section7Text3:
      "Le client peut demander l'arrêt du mandat ; les prestations déjà réalisées et frais engagés restent dus.",
    section8Title: "8. Données, confidentialité et traçabilité",
    section8Text:
      "ICD traite les informations et documents fournis dans une logique de confidentialité et de traçabilité :",
    section8Item1:
      "certains échanges et éléments-clés peuvent être conservés à titre de preuve du travail réalisé ;",
    section8Item2:
      "les données ne sont ni revendues ni utilisées hors du mandat ;",
    section8Item3:
      "le client peut demander, dans la limite des obligations légales, la suppression de certaines données.",
    section9Title: "9. Droit applicable",
    section9Text:
      "Les présentes CGV sont établies en référence au cadre juridique applicable dans le pays d'exercice principal de l'activité (Canada), sans exclure les contraintes légales propres au Cameroun pour les démarches qui y sont réalisées.",
    section10Title: "10. Contact",
    section10Text:
      "Pour toute question relative aux présentes conditions générales de vente :",
    section10Email: "📩 Email :",
  },
  en: {
    heroTag: "Legal",
    heroTitle: "General Terms and Conditions of Sale (GTCS)",
    heroText:
      "These general terms and conditions of sale govern the services offered by ICD – Cameroon-Diaspora Interface, in a spirit of clarity, assumed limits and transparency with people in the diaspora having files to follow in Cameroon.",
    overviewTag: "Overview",
    overviewTitle: "In summary, these GTCS specify:",
    overview1:
      "the framework of services (interface, relay, follow-up of procedures);",
    overview2: "how a mandate is analyzed, accepted or refused;",
    overview3: "fee and payment terms;",
    overview4:
      "intervention limits and absence of result guarantee;",
    overview5: "mutual obligations between ICD and the client.",
    section1Title: "1. Object of these conditions",
    section1Text1:
      "These general terms and conditions of sale (GTCS) define the framework applicable to organization, relay and follow-up services offered by ICD to people residing abroad and having procedures or files to follow in Cameroon.",
    section1Text2:
      "Any accepted request, then any formalized mandate, implies the client's full and complete adherence to these GTCS.",
    section2Title: "2. Nature of services",
    section2Text1:
      "ICD intervenes as an interface for organization, relay and follow-up for targeted procedures, including:",
    section2Item1: "administrative procedures (certificates, files);",
    section2Item2: "simple land or real estate questions;",
    section2Item3: "certain limited tax procedures;",
    section2Item4:
      "basic administrative support for business projects;",
    section2Item5: "specific and limited private mandates.",
    section2Text2:
      "ICD does not replace regulated professionals (lawyer, notary, bailiff, tax advisor, etc.) and refers to them as soon as necessary.",
    section3Title: "3. Request, analysis and acceptance",
    section3Text1:
      "Any initial request is made via the request or contact form, or by email. Based on the information communicated, ICD:",
    section3Item1: "analyzes the request in light of the intervention framework;",
    section3Item2:
      "may request clarifications or additional documents;",
    section3Item3:
      "may accept, partially accept or refuse the request.",
    section3Text2:
      "In case of acceptance, a mandate is defined in writing (or by formalized written exchange): object, scope, limits, estimated duration, communication terms, financial conditions.",
    section4Title: "4. Fees and payment terms",
    section4Text1:
      "Fees are set according to the nature of the mandate, its complexity and estimated time. They are systematically communicated to the client before any mandate validation.",
    section4Item1: "payment can be made in one or several steps;",
    section4Item2:
      "certain fees may be requested in advance (administrative fees, travel, document procurement, etc.);",
    section4Item3:
      "aucun mandat n'est engagé sans confirmation explicite et, le cas échéant, versement initial.",
    section4Text2:
      "Les montants et modalités précises sont rappelés dans les échanges écrits (courriel ou document récapitulatif).",
    section5Title:
      "5. Intervention limits and absence of result guarantee",
    section5Text1:
      "ICD travaille dans un environnement où interviennent des administrations, intermédiaires et tiers indépendants. Par conséquent :",
    section5Item1:
      "ICD ne peut pas garantir les délais, décisions ou réactions d'une administration ou d'un tiers ;",
    section5Item2:
      "ICD s'engage sur un travail de moyens (organisation, suivi, relances, documentation), et non sur un résultat imposé aux tiers ;",
    section5Item3:
      "certains blocages peuvent conduire à l'arrêt, à la suspension ou à la redéfinition du mandat.",
    section6Title: "6. Obligations du client",
    section6Text: "The client commits in particular to:",
    section6Item1: "provide accurate, complete and sincere information;",
    section6Item2:
      "transmit necessary documents within reasonable deadlines;",
    section6Item3:
      "inform ICD of any important change having an impact on the mandate;",
    section6Item4: "respect agreed financial terms.",
    section7Title: "7. Duration, suspension and termination of mandate",
    section7Text1:
      "Each mandate specifies an estimated duration, linked to the nature of procedures and local environment. However, this duration may vary depending on elements independent of ICD (administrations, third parties, context).",
    section7Text2: "ICD may suspend or terminate a mandate in case of:",
    section7Item1: "non-payment of agreed fees or expenses;",
    section7Item2: "repeated absence of response from the client;",
    section7Item3:
      "discovery of elements making the mandate non-compliant with legal, regulatory or ethical framework.",
    section7Text3:
      "The client may request termination of the mandate; services already performed and expenses incurred remain due.",
    section8Title: "8. Data, confidentiality and traçabilité",
    section8Text:
      "ICD traite les informations et documents fournis dans une logique de confidentialité et de traçabilité :",
    section8Item1:
      "certains échanges et éléments-clés peuvent être conservés à titre de preuve du travail réalisé ;",
    section8Item2: "data is neither resold nor used outside the mandate;",
    section8Item3:
      "the client may request, within the limits of legal obligations, deletion of certain data.",
    section9Title: "9. Applicable law",
    section9Text:
      "These GTCS are established in reference to the legal framework applicable in the main country of activity (Canada), without excluding legal constraints specific to Cameroon for procedures carried out there.",
    section10Title: "10. Contact",
    section10Text:
      "For any question relating to these general terms and conditions of sale:",
    section10Email: "📩 Email:",
  },
} as const;

export default function CGVPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];

  return (
    <main className="bg-[#F2F2F5] min-h-screen py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-8">
        {/* HERO */}
        <section className="bg-white border border-[#DDDDDD] rounded-2xl shadow-sm px-5 md:px-7 py-6 md:py-7">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A55F] mb-2">
            {t.heroTag}
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A] leading-snug">
            {t.heroTitle}
          </h1>
          <p
            className="text-sm md:text-base text-[#4B4F58] mt-3"
            style={{ textAlign: "justify" }}
          >
            {t.heroText}
          </p>
        </section>

        {/* VUE D'ENSEMBLE */}
        <section className="bg-[#0A1B2A] rounded-2xl px-5 md:px-6 py-5 md:py-6 text-[#F2F2F5] shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#C8A55F] mb-1">
            {t.overviewTag}
          </p>
          <p className="text-sm md:text-base mb-3">{t.overviewTitle}</p>
          <ul className="text-xs md:text-sm space-y-1 list-disc list-inside text-[#E5E5E5]">
            <li>{t.overview1}</li>
            <li>{t.overview2}</li>
            <li>{t.overview3}</li>
            <li>{t.overview4}</li>
            <li>{t.overview5}</li>
          </ul>
        </section>

        {/* 1. OBJET */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section1Title}
          </h2>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section1Text1}
          </p>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section1Text2}
          </p>
        </section>

        {/* 2. NATURE DES PRESTATIONS */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section2Title}
          </h2>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section2Text1}
          </p>
          <ul className="text-sm md:text-base text-[#4B4F58] list-disc list-inside space-y-1">
            <li>{t.section2Item1}</li>
            <li>{t.section2Item2}</li>
            <li>{t.section2Item3}</li>
            <li>{t.section2Item4}</li>
            <li>{t.section2Item5}</li>
          </ul>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section2Text2}
          </p>
        </section>

        {/* 3. DEMANDE, ANALYSE, ACCEPTATION */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section3Title}
          </h2>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section3Text1}
          </p>
          <ul className="text-sm md:text-base text-[#4B4F58] list-disc list-inside space-y-1">
            <li>{t.section3Item1}</li>
            <li>{t.section3Item2}</li>
            <li>{t.section3Item3}</li>
          </ul>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section3Text2}
          </p>
        </section>

        {/* 4. HONORAIRES */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section4Title}
          </h2>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section4Text1}
          </p>
          <ul className="text-sm md:text-base text-[#4B4F58] list-disc list-inside space-y-1">
            <li>{t.section4Item1}</li>
            <li>{t.section4Item2}</li>
            <li>{t.section4Item3}</li>
          </ul>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section4Text2}
          </p>
        </section>

        {/* 5. LIMITES D'INTERVENTION */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section5Title}
          </h2>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section5Text1}
          </p>
          <ul className="text-sm md:text-base text-[#4B4F58] list-disc list-inside space-y-1">
            <li>{t.section5Item1}</li>
            <li>{t.section5Item2}</li>
            <li>{t.section5Item3}</li>
          </ul>
        </section>

        {/* 6. OBLIGATIONS DU CLIENT */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section6Title}
          </h2>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section6Text}
          </p>
          <ul className="text-sm md:text-base text-[#4B4F58] list-disc list-inside space-y-1">
            <li>{t.section6Item1}</li>
            <li>{t.section6Item2}</li>
            <li>{t.section6Item3}</li>
            <li>{t.section6Item4}</li>
          </ul>
        </section>

        {/* 7. DURÉE / SUSPENSION / RÉSILIATION */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section7Title}
          </h2>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section7Text1}
          </p>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section7Text2}
          </p>
          <ul className="text-sm md:text-base text-[#4B4F58] list-disc list-inside space-y-1">
            <li>{t.section7Item1}</li>
            <li>{t.section7Item2}</li>
            <li>{t.section7Item3}</li>
          </ul>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section7Text3}
          </p>
        </section>

        {/* 8. DONNÉES & CONFIDENTIALITÉ */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section8Title}
          </h2>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section8Text}
          </p>
          <ul className="text-sm md:text-base text-[#4B4F58] list-disc list-inside space-y-1">
            <li>{t.section8Item1}</li>
            <li>{t.section8Item2}</li>
            <li>{t.section8Item3}</li>
          </ul>
        </section>

        {/* 9. DROIT APPLICABLE */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section9Title}
          </h2>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section9Text}
          </p>
        </section>

        {/* 10. CONTACT */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section10Title}
          </h2>
          <p className="text-sm md:text-base text-[#4B4F58]">
            {t.section10Text}
          </p>
          <p className="text-sm md:text-base text-[#4B4F58]">
            {t.section10Email}{" "}
            <span className="font-medium">contact.icd-relay@gmail.com</span>
          </p>
        </section>
      </div>
    </main>
  );
}
