"use client";

// Forcer le rendu dynamique pour éviter les erreurs de prerender avec useLanguage
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import BackToHomeLink from "../components/BackToHomeLink";

type OpenStates = {
  [index: number]: boolean;
};

const TEXT = {
  fr: {
    title: "Foire aux questions",
    subtitle:
      "Cette section vise à clarifier ce que LeBoy peut faire, ce que nous ne faisons pas et la manière dont les mandats sont organisés. Les réponses restent générales : chaque demande est ensuite analysée au cas par cas.",
    closureTitle: "Une question qui ne figure pas dans cette liste ?",
    closureText:
      "Vous pouvez utiliser le formulaire de contact pour poser une question spécifique. Si elle revient souvent, elle sera intégrée à cette page ultérieurement.",
  },
  en: {
    title: "Frequently Asked Questions",
    subtitle:
      "This section aims to clarify what LeBoy can do, what we don't do, and how mandates are organized. The answers remain general: each request is then analyzed on a case-by-case basis.",
    closureTitle: "A question that's not on this list?",
    closureText:
      "You can use the contact form to ask a specific question. If it comes up often, it will be added to this page later.",
  },
} as const;

const FAQS = {
  fr: [
    {
      question: "Qu'est-ce que LeBoy exactement ?",
      reponses: [
        "LeBoy est une plateforme de services conçue pour la diaspora à travers le monde. Une interface entre des personnes vivant à l'étranger et des interlocuteurs situés dans le pays d'intervention (administrations, professionnels, relais locaux).",
        "L'objectif est d'organiser des mandats simples, réalistes et documentés : demandes administratives, vérifications, suivis de dossier, visites, etc. LeBoy s'adresse à toute la diaspora ayant des démarches à suivre dans son pays d'origine.",
      ],
    },
    {
      question: "Qui peut faire appel à LeBoy ?",
      reponses: [
        "LeBoy s'adresse à toute personne de la diaspora ayant des démarches à suivre dans son pays d'origine mais qui se trouve à distance.",
        "Cela inclut la diaspora installée au Québec, ailleurs au Canada, aux États-Unis, en Europe, en Afrique ou dans tout autre pays.",
      ],
    },
    {
      question:
        "Est-ce qu'LeBoy remplace un avocat, un notaire ou un comptable ?",
      reponses: [
        "Non. LeBoy ne se substitue pas aux professionnels réglementés.",
        "Lorsque la situation l'exige (acte juridique, conseil fiscal, dossier complexe, litige, etc.), LeBoy agit comme relais ou coordonne avec vos propres professionnels (avocat, notaire, comptable…) ou vous recommande d'en consulter un.",
      ],
    },
    {
      question: "Comment se déroule une demande concrètement ?",
      reponses: [
        "1. Vous remplissez le formulaire en ligne en décrivant la situation de façon simple et honnête.",
        "2. La demande est analysée : faisabilité, limites, pièces nécessaires.",
        "3. Vous recevez un retour (acceptation, acceptation partielle ou refus si ce n'est pas réaliste ou pas dans le cadre).",
        "4. Si la demande est acceptée, un mandat, un cadre et des modalités sont confirmés.",
        "5. Le suivi se fait ensuite avec des points d'étape et des comptes rendus.",
      ],
    },
    {
      question:
        "Quels sont les types de demandes que vous ne prenez pas en charge ?",
      reponses: [
        "LeBoy ne prend pas en charge :",
        "• des démarches illégales ou contraires à l'éthique ;",
        "• des promesses de résultat sur des décisions administratives qui ne dépendent pas de LeBoy ;",
        "• des dossiers de contentieux complexe ou de procédure judiciaire (qui relèvent d'un avocat) ;",
        "• des interventions qui dépassent clairement le mandat (pression, favoritisme, corruption, etc.).",
      ],
    },
    {
      question: "Comment sont fixés les honoraires ?",
      reponses: [
        "Les honoraires dépendent :",
        "• du type de service (administratif, foncier, fiscal, etc.) ;",
        "• du temps estimé sur le terrain ;",
        "• du niveau de complexité et du nombre de déplacements / interlocuteurs.",
        "Un ordre de grandeur ou une fourchette est présenté avant tout engagement. Certains services peuvent être forfaitaires, d'autres au cas par cas.",
      ],
    },
    {
      question: "Quels sont les délais ?",
      reponses: [
        "Les délais dépendent :",
        "• du type de demande ;",
        "• de l'administration ou du service concerné ;",
        "• de la disponibilité des pièces et des personnes impliquées.",
        "LeBoy s'engage à être transparent : les délais annoncés sont des estimations, pas des garanties de résultat, surtout lorsque la décision finale dépend d'une administration.",
      ],
    },
    {
      question: "Comment est gérée la confidentialité de ma demande ?",
      reponses: [
        "Les informations communiquées sont utilisées uniquement pour le traitement de votre demande et la préparation du mandat.",
        "Les échanges sensibles sont limités aux personnes strictement nécessaires (membres de l'équipe, interlocuteurs administratifs, professionnels associés).",
        "Aucune information n'est transmise à des tiers sans raison liée au mandat.",
      ],
    },
    {
      question:
        "Que se passe-t-il si votre équipe estime que ma demande n'est pas réaliste ?",
      reponses: [
        "Dans ce cas, la réponse est expliquée de façon simple.",
        "• soit la demande est refusée ;",
        "• soit une version plus réaliste est proposée : mandat plus limité, étapes progressives ou orientation vers un autre type de professionnel.",
      ],
    },
  ],
  en: [
    {
      question: "What exactly is LeBoy?",
      reponses: [
        "LeBoy is a service platform designed for the Cameroonian diaspora around the world. An interface between people living abroad and stakeholders located in Cameroon (administrations, professionals, local relays).",
        "The goal is to organize simple, realistic and documented mandates: administrative requests, verifications, file follow-ups, visits, etc. We start with the Cameroonian diaspora, with the ambition to expand to other diasporas.",
      ],
    },
    {
      question: "Who can use LeBoy?",
      reponses: [
        "We start our action with the Cameroonian diaspora around the world. Anyone from the Cameroonian diaspora who has procedures to do in Cameroon but is at a distance.",
        "This includes the diaspora settled in Quebec, elsewhere in Canada, the United States, Europe, Africa or any other country.",
      ],
    },
    {
      question: "Does LeBoy replace a lawyer, notary or accountant?",
      reponses: [
        "No. LeBoy does not replace regulated professionals.",
        "When the situation requires it (legal act, tax advice, complex file, dispute, etc.), LeBoy acts as a relay or coordinates with your own professionals (lawyer, notary, accountant…) or recommends that you consult one.",
      ],
    },
    {
      question: "How does a request work in practice?",
      reponses: [
        "1. You fill out the online form describing the situation simply and honestly.",
        "2. The request is analyzed: feasibility, limits, necessary documents.",
        "3. You receive a response (acceptance, partial acceptance or refusal if it's not realistic or not within the scope).",
        "4. If the request is accepted, a mandate, framework and terms are confirmed.",
        "5. Follow-up is then done with checkpoints and reports.",
      ],
    },
    {
      question: "What types of requests do you not handle?",
      reponses: [
        "LeBoy does not handle:",
        "• illegal or unethical procedures;",
        "• promises of results on administrative decisions that do not depend on LeBoy;",
        "• complex litigation or judicial procedure files (which fall under a lawyer);",
        "• interventions that clearly exceed the mandate (pressure, favoritism, corruption, etc.).",
      ],
    },
    {
      question: "How are fees determined?",
      reponses: [
        "Fees depend on:",
        "• the type of service (administrative, land, tax, etc.);",
        "• the estimated time on the ground;",
        "• the level of complexity and the number of trips / stakeholders.",
        "An order of magnitude or range is presented before any commitment. Some services may be fixed-price, others on a case-by-case basis.",
      ],
    },
    {
      question: "What are the deadlines?",
      reponses: [
        "Deadlines depend on:",
        "• the type of request;",
        "• the administration or service concerned;",
        "• the availability of documents and people involved.",
        "LeBoy commits to being transparent: announced deadlines are estimates, not guarantees of results, especially when the final decision depends on an administration.",
      ],
    },
    {
      question: "How is the confidentiality of my request managed?",
      reponses: [
        "The information communicated is used only for processing your request and preparing the mandate.",
        "Sensitive exchanges are limited to strictly necessary people (team members, administrative contacts, associated professionals).",
        "No information is transmitted to third parties without reason related to the mandate.",
      ],
    },
    {
      question:
        "What happens if your team considers that my request is not realistic?",
      reponses: [
        "In this case, the response is explained simply.",
        "• either the request is refused;",
        "• or a more realistic version is proposed: more limited mandate, progressive steps or referral to another type of professional.",
      ],
    },
  ],
} as const;

export default function FAQPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const faqs = FAQS[lang];
  const [openStates, setOpenStates] = useState<OpenStates>({});

  const toggleIndex = (index: number) => {
    setOpenStates((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <BackToHomeLink />
      {/* EN-TÊTE */}
      <section className="bg-white border-b border-[#DDDDDD]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-3">
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
            {t.title}
          </h1>
          <p
            className="text-sm md:text-base text-[#4B4F58] max-w-3xl"
            style={{ textAlign: "justify" }}
          >
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* BLOC FAQ */}
      <section className="bg-[#F2F2F5]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="space-y-4">
            {faqs.map((item, index) => {
              const isOpen = !!openStates[index];

              return (
                <article
                  key={index}
                  className="rounded-xl border border-[#DDDDDD] bg-white shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleIndex(index)}
                    className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-4 bg-[#0A1B2A] text-left"
                  >
                    <span
                      className="font-heading text-sm md:text-base font-semibold"
                      style={{ color: "white" }}
                    >
                      {item.question}
                    </span>
                    <span className="text-xs md:text-sm" style={{ color: "#D4A657" }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm text-[#4B4F58] space-y-1">
                      {item.reponses.map((ligne, idx) => (
                        <p key={idx} style={{ textAlign: "justify" }}>
                          {ligne}
                        </p>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Petit bloc de clôture */}
          <div className="mt-8 rounded-xl border border-[#D4A657] bg-[#FFF9EC] px-4 md:px-5 py-4 md:py-5 text-xs md:text-sm text-[#4B4F58] space-y-2">
            <p className="font-heading text-sm md:text-base font-semibold text-[#0A1B2A]">
              {t.closureTitle}
            </p>
            <p style={{ textAlign: "justify" }}>
              {t.closureText}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
