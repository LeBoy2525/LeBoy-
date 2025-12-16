"use client";

import { useLanguage } from "../components/LanguageProvider";

const TEXT = {
  fr: {
    heroTag: "Légal",
    heroTitle: "Mentions légales du site ICD",
    heroText:
      "Cette page présente les informations légales et les principaux engagements liés à l'utilisation du site ICD – Interface Cameroun Diaspora. Elle a pour but de donner un cadre clair, cohérent avec l'esprit d'ICD : transparence, limites assumées et relais structuré.",
    overviewTag: "Vue d'ensemble",
    overviewTitle: "En résumé, cette page précise :",
    overview1: "qui édite le site ICD ;",
    overview2: "où il est hébergé ;",
    overview3:
      "ce qui est protégé au titre de la propriété intellectuelle ;",
    overview4:
      "dans quelles limites ICD intervient et engage sa responsabilité ;",
    overview5: "comment sont traitées les données personnelles de base.",
    section1Title: "1. Éditeur du site",
    section1Text:
      "Le site ICD – Interface Cameroun Diaspora est édité par :",
    section1Item1: "Dénomination : Interface Cameroun Diaspora (ICD)",
    section1Item2: "Statut : activité indépendante / micro-entreprise",
    section1Item3: "Pays d'exploitation principal : Canada",
    section1Item4: "Contact principal :",
    section2Title: "2. Hébergement du site",
    section2Text: "Le site est hébergé par :",
    section2Item1: "Vercel Inc.",
    section2Item2:
      "Adresse : 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    section2Item3: "Site : https://vercel.com",
    section3Title: "3. Propriété intellectuelle",
    section3Text1:
      "L'ensemble des contenus présents sur le site (textes, éléments de langage, structure des pages, logo, visuels et mise en forme générale) est protégé par les dispositions relatives à la propriété intellectuelle.",
    section3Text2:
      "Toute reproduction, représentation, diffusion ou réutilisation, totale ou partielle, sans autorisation écrite préalable, est interdite, sauf usage strictement privé et non commercial.",
    section4Title: "4. Responsabilité et limites d'intervention",
    section4Text1:
      "Les informations présentées sur le site sont fournies à titre indicatif et peuvent évoluer. ICD met un soin particulier à la qualité de ces contenus, mais ne peut garantir qu'ils soient complets, exhaustifs ou exempts de toute erreur ponctuelle.",
    section4Text2:
      "ICD agit comme interface d'organisation, de relais et de suivi. ICD ne remplace ni un avocat, ni un notaire, ni un comptable, ni un officier public. Dès qu'un acte professionnel réglementé est nécessaire, le recours à un professionnel compétent est recommandé ou exigé.",
    section5Title: "5. Données personnelles et confidentialité",
    section5Text:
      "Les données personnelles transmises via le site (formulaire de contact, formulaire de demande, courriel) sont utilisées uniquement pour analyser la demande, y répondre et, le cas échéant, préparer une proposition de mandat.",
    section5Item1:
      "Aucune donnée n'est vendue ou cédée à des tiers à des fins commerciales.",
    section5Item2:
      "Les données sont conservées pour la durée nécessaire au traitement de la demande et au suivi des échanges.",
    section5Item3:
      "Vous pouvez demander la suppression de vos données, dans la limite des obligations de conservation légale.",
    section6Title: "6. Utilisation du site et des formulaires",
    section6Text:
      "Toute utilisation des formulaires du site (contact, demande) implique une communication sincère et la plus précise possible. ICD se réserve le droit de ne pas donner suite à une demande si :",
    section6Item1:
      "les informations sont manifestement incomplètes ou contradictoires ;",
    section6Item2: "la demande sort du cadre d'intervention défini ;",
    section6Item3:
      "des éléments éthiques ou légaux rendent le mandat inapproprié ou impossible.",
    section7Title: "7. Contact dédié aux questions légales",
    section7Text:
      "Pour toute question liée à ces mentions légales ou à l'utilisation du site :",
    section7Email: "📩 Email :",
  },
  en: {
    heroTag: "Legal",
    heroTitle: "Legal notices of the ICD site",
    heroText:
      "This page presents the legal information and main commitments related to the use of the ICD – Cameroon-Diaspora Interface site. It aims to provide a clear framework, consistent with ICD's spirit: transparency, assumed limits and structured relay.",
    overviewTag: "Overview",
    overviewTitle: "In summary, this page specifies:",
    overview1: "who publishes the ICD site;",
    overview2: "where it is hosted;",
    overview3: "what is protected under intellectual property;",
    overview4:
      "within what limits ICD intervenes and assumes its responsibility;",
    overview5: "how basic personal data is processed.",
    section1Title: "1. Site publisher",
    section1Text:
      "The ICD – Cameroon-Diaspora Interface site is published by:",
    section1Item1: "Name: Interface Cameroun Diaspora (ICD)",
    section1Item2: "Status: independent activity / micro-enterprise",
    section1Item3: "Main country of operation: Canada",
    section1Item4: "Main contact:",
    section2Title: "2. Site hosting",
    section2Text: "The site is hosted by:",
    section2Item1: "Vercel Inc.",
    section2Item2:
      "Address: 440 N Barranca Ave #4133, Covina, CA 91723, United States",
    section2Item3: "Website: https://vercel.com",
    section3Title: "3. Intellectual property",
    section3Text1:
      "All content on the site (texts, language elements, page structure, logo, visuals and general formatting) is protected by intellectual property provisions.",
    section3Text2:
      "Any reproduction, representation, distribution or reuse, total or partial, without prior written authorization, is prohibited, except for strictly private and non-commercial use.",
    section4Title: "4. Liability and intervention limits",
    section4Text1:
      "The information presented on the site is provided for information purposes and may change. ICD takes particular care with the quality of this content, but cannot guarantee that it is complete, exhaustive or free from any occasional error.",
    section4Text2:
      "ICD acts as an interface for organization, relay and follow-up. ICD does not replace a lawyer, notary, accountant or public officer. As soon as a regulated professional act is necessary, recourse to a competent professional is recommended or required.",
    section5Title: "5. Personal data and confidentiality",
    section5Text:
      "Personal data transmitted via the site (contact form, request form, email) is used only to analyze the request, respond to it and, if applicable, prepare a mandate proposal.",
    section5Item1:
      "No data is sold or transferred to third parties for commercial purposes.",
    section5Item2:
      "Data is kept for the duration necessary to process the request and follow up on exchanges.",
    section5Item3:
      "You can request deletion of your data, within the limits of legal retention obligations.",
    section6Title: "6. Use of the site and forms",
    section6Text:
      "Any use of the site forms (contact, request) implies sincere and as precise as possible communication. ICD reserves the right not to follow up on a request if:",
    section6Item1:
      "the information is manifestly incomplete or contradictory;",
    section6Item2: "the request is outside the defined intervention framework;",
    section6Item3:
      "ethical or legal elements make the mandate inappropriate or impossible.",
    section7Title: "7. Contact dedicated to legal questions",
    section7Text:
      "For any question related to these legal notices or the use of the site:",
    section7Email: "📩 Email:",
  },
} as const;

export default function MentionsLegalesPage() {
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

        {/* SOMMAIRE RAPIDE */}
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

        {/* 1. ÉDITEUR */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section1Title}
          </h2>
          <p className="text-sm md:text-base text-[#4B4F58]">
            {t.section1Text}
          </p>
          <ul className="text-sm md:text-base text-[#4B4F58] space-y-1 list-disc list-inside">
            <li>{t.section1Item1}</li>
            <li>{t.section1Item2}</li>
            <li>{t.section1Item3}</li>
            <li>
              {t.section1Item4}{" "}
              <span className="font-medium">contact.icd-relay@gmail.com</span>
            </li>
          </ul>
        </section>

        {/* 2. HÉBERGEMENT */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section2Title}
          </h2>
          <p className="text-sm md:text-base text-[#4B4F58]">{t.section2Text}</p>
          <ul className="text-sm md:text-base text-[#4B4F58] list-disc list-inside space-y-1">
            <li>{t.section2Item1}</li>
            <li>{t.section2Item2}</li>
            <li>{t.section2Item3}</li>
          </ul>
        </section>

        {/* 3. PROPRIÉTÉ INTELLECTUELLE */}
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
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section3Text2}
          </p>
        </section>

        {/* 4. RESPONSABILITÉ & LIMITES */}
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
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section4Text2}
          </p>
        </section>

        {/* 5. DONNÉES PERSONNELLES */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section5Title}
          </h2>
          <p
            className="text-sm md:text-base text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.section5Text}
          </p>
          <ul className="text-sm md:text-base text-[#4B4F58] list-disc list-inside space-y-1">
            <li>{t.section5Item1}</li>
            <li>{t.section5Item2}</li>
            <li>{t.section5Item3}</li>
          </ul>
        </section>

        {/* 6. UTILISATION DU SITE */}
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
          </ul>
        </section>

        {/* 7. CONTACT */}
        <section className="bg-white border border-[#DDDDDD] rounded-xl p-5 md:p-6 shadow-sm space-y-3">
          <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
            {t.section7Title}
          </h2>
          <p className="text-sm md:text-base text-[#4B4F58]">
            {t.section7Text}
          </p>
          <p className="text-sm md:text-base text-[#4B4F58]">
            {t.section7Email}{" "}
            <span className="font-medium">contact.icd-relay@gmail.com</span>
          </p>
        </section>
      </div>
    </main>
  );
}
