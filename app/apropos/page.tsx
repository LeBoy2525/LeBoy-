"use client";

// Forcer le rendu dynamique pour éviter les erreurs de prerender avec useLanguage
export const dynamic = 'force-dynamic';

import { useLanguage } from "../components/LanguageProvider";
import BackToHomeLink from "../components/BackToHomeLink";

const TEXT = {
  fr: {
    heroTag: "Présentation",
    heroTitle: "LeBoy : Une interface structurée pour la diaspora.",
    heroText1:
      "LeBoy (International Concierge for Diaspora) est née d'une réalité partagée : suivre un dossier, un projet ou une démarche dans son pays d'origine depuis l'étranger est souvent complexe. On dépend de relais informels, de promesses verbales ou d'informations partielles.",
    heroText2:
      "LeBoy s'adresse à la diaspora à travers le monde, avec l'ambition de devenir une plateforme globale pour toutes les diasporas. L'objectif d'LeBoy n'est pas de \"tout régler\" à votre place, mais de proposer un cadre clair, raisonnable et documenté pour certains types de mandats : administratifs, fonciers, fiscaux, santé, logistique ou liés à un projet d'entreprise.",
    pilier1Title: "Clarté",
    pilier1Text: "Dire ce qui est possible, ce qui ne l'est pas, et dans quel cadre.",
    pilier2Title: "Structure",
    pilier2Text:
      "Organiser un mandat simple avec étapes, interlocuteurs et suivi.",
    pilier3Title: "Transparence",
    pilier3Text: "Documenter ce qui est fait, ce qui bloque, et pourquoi.",
    asideTag: "LeBoy en bref",
    asideTitle:
      "Une plateforme identifiable, joignable et assumée, conçue pour la diaspora qui a des dossiers à suivre dans son pays d'origine.",
    asideText1:
      "Pas une \"solution magique\", mais un outil de structuration pour certains types de démarches.",
    asideText2:
      "L'organisation pratique (bureaux, relais, partenaires) peut évoluer avec le temps. Le principe : un interlocuteur clair côté diaspora, un travail cadré côté terrain.",
    asideButton: "Décrire une demande",
    reperesTitle: "Trois repères pour comprendre LeBoy",
    reperesSubtitle:
      "Plutôt que de multiplier les slogans, LeBoy s'appuie sur quelques repères simples : notre mission, notre posture, notre manière de travailler avec vous.",
    missionTag: "Mission",
    missionTitle: "Structurer des démarches à distance",
    missionText:
      "Aider des personnes vivant à l'étranger à mieux organiser certaines démarches liées à leur pays d'origine, en posant un cadre concret plutôt qu'en accumulant des promesses informelles.",
    postureTag: "Posture",
    postureTitle: "Dire \"oui\", \"partiellement\" ou \"non\"",
    postureText:
      "Certaines demandes sont réalistes, d'autres non. LeBoy assume d'expliquer clairement ce qui peut être pris en charge, ce qui doit être redéfini ou ce qui n'entre pas dans le cadre.",
    travailTag: "Manère de travailler",
    travailTitle: "Des mandats définis, pas des promesses floues",
    travailText:
      "Un mandat est toujours limité dans le temps, dans son objet et dans ses moyens. Cela protège la personne en diaspora comme l'équipe sur le terrain.",
    questionsTitle: "Quelques questions clés",
    questionsSubtitle:
      "Pour situer LeBoy, il est souvent plus simple de répondre à quelques questions fréquentes. Ces éléments complètent, sans remplacer, la page détaillée de la FAQ.",
    questionsFooter:
      "Pour des questions plus précises (délais, honoraires, types de demandes non prises en charge, etc.), vous pouvez consulter la",
    faqLink: "page FAQ",
    questionsFooter2: "ou utiliser le",
    contactLink: "formulaire de contact",
    pourQuiTitle: "Pour qui est pensée LeBoy ?",
    pourQuiText:
      "LeBoy s'adresse principalement à des personnes qui ont un lien concret avec leur pays d'origine et qui vivent à l'étranger :",
    pourQui1:
      "personnes ayant des démarches administratives à suivre (actes, certificats, dossiers en cours) ;",
    pourQui2:
      "familles concernées par des questions foncières, immobilières ou patrimoniales ;",
    pourQui3:
      "porteurs de projets ou entrepreneurs réfléchissant à une activité ou un investissement dans leur pays d'origine ;",
    pourQui4:
      "personnes qui souhaitent un relais structuré plutôt que des échanges uniquement informels.",
    pourQuiConclusion:
      "Si votre situation ne rentre pas exactement dans ces catégories, vous pouvez simplement la décrire en quelques lignes. La première réponse consistera à dire s'il est pertinent, ou non, d'engager un mandat avec LeBoy.",
    ctaTitle: "Vous avez déjà une situation en tête ?",
    ctaText:
      "Dossier administratif, terrain, projet familial, question de suivi ou de visibilité : le plus simple est souvent de décrire votre contexte. À partir de là, il devient possible de dire ce qui est envisageable, ce qui ne l'est pas, et avec quelles limites.",
    ctaButton1: "Décrire une demande",
    ctaButton2: "Poser une question",
  },
  en: {
    heroTag: "Presentation",
    heroTitle: "A structured interface between the diaspora and Cameroon.",
    heroText1:
      "LeBoy (Cameroon-Diaspora Interface) was born from a shared reality: following a file, project or procedure in Cameroon from abroad is often complex. We depend on informal relays, verbal promises or partial information.",
    heroText2:
      "LeBoy's goal is not to \"handle everything\" for you, but to propose a clear, reasonable and documented framework for certain types of mandates: administrative, land, tax or related to a business project.",
    pilier1Title: "Clarity",
    pilier1Text: "Say what is possible, what is not, and within what framework.",
    pilier2Title: "Structure",
    pilier2Text:
      "Organize a simple mandate with steps, stakeholders and follow-up.",
    pilier3Title: "Transparency",
    pilier3Text: "Document what is done, what blocks, and why.",
    asideTag: "LeBoy in brief",
    asideTitle:
      "An identifiable, reachable and assumed platform, designed for the Cameroonian diaspora that has files to follow in Cameroon.",
    asideText1:
      "Not a \"magic solution\", but a structuring tool for certain types of procedures.",
    asideText2:
      "The practical organization (offices, relays, partners) can evolve over time. The principle: a clear contact person on the diaspora side, a structured work on the ground side.",
    asideButton: "Submit a request",
    reperesTitle: "Three reference points to understand LeBoy",
    reperesSubtitle:
      "Rather than multiplying slogans, LeBoy relies on a few simple reference points: our mission, our posture, our way of working with you.",
    missionTag: "Mission",
    missionTitle: "Structure procedures at a distance",
    missionText:
      "Help people living abroad to better organize certain procedures related to Cameroon, by setting a concrete framework rather than accumulating informal promises.",
    postureTag: "Posture",
    postureTitle: "Say \"yes\", \"partially\" or \"no\"",
    postureText:
      "Some requests are realistic, others are not. LeBoy assumes to clearly explain what can be handled, what must be redefined or what does not fall within the framework.",
    travailTag: "Way of working",
    travailTitle: "Defined mandates, not vague promises",
    travailText:
      "A mandate is always limited in time, in its object and in its means. This protects the person in the diaspora as well as the team on the ground.",
    questionsTitle: "Some key questions",
    questionsSubtitle:
      "To situate LeBoy, it is often simpler to answer a few frequent questions. These elements complement, without replacing, the detailed FAQ page.",
    questionsFooter:
      "For more specific questions (deadlines, fees, types of requests not handled, etc.), you can consult the",
    faqLink: "FAQ page",
    questionsFooter2: "or use the",
    contactLink: "contact form",
    pourQuiTitle: "Who is LeBoy designed for?",
    pourQuiText:
      "LeBoy is primarily aimed at the Cameroonian diaspora who have a concrete link with Cameroon and who live abroad:",
    pourQui1:
      "people with administrative procedures to follow (certificates, documents, ongoing files);",
    pourQui2:
      "families concerned by land, real estate or estate questions;",
    pourQui3:
      "project leaders or entrepreneurs thinking about an activity or investment in Cameroon;",
    pourQui4:
      "people who want a structured relay rather than only informal exchanges.",
    pourQuiConclusion:
      "If your situation does not fit exactly into these categories, you can simply describe it in a few lines. The first response will be to say whether it is relevant, or not, to engage a mandate with LeBoy.",
    ctaTitle: "Already have a situation in mind?",
    ctaText:
      "Administrative file, land, family project, follow-up or visibility question: the simplest is often to describe your context. From there, it becomes possible to say what is feasible, what is not, and with what limits.",
    ctaButton1: "Submit a request",
    ctaButton2: "Ask a question",
  },
} as const;

const QUESTIONS_CLES = {
  fr: [
    {
      question: "Pourquoi une plateforme comme LeBoy ?",
      reponse:
        "Parce qu'il est souvent difficile de suivre ou de sécuriser certaines démarches dans son pays d'origine lorsqu'on vit à l'étranger : manque de relais fiables, peu de visibilité sur ce qui se passe réellement, et beaucoup d'incertitudes. LeBoy vient organiser, cadrer et documenter certaines démarches ciblées pour la diaspora.",
    },
    {
      question: "LeBoy est-il un cabinet juridique ou comptable ?",
      reponse:
        "Non. LeBoy ne remplace pas un avocat, un notaire, un fiscaliste ni un officier public. Lorsqu'un professionnel réglementé est nécessaire, LeBoy agit comme interface ou relais, ou vous invite à consulter le professionnel adapté.",
    },
    {
      question: "Que peut-on attendre concrètement d'LeBoy ?",
      reponse:
        "Une analyse simple de votre demande, un mandat clair (ou un refus argumenté), des limites assumées, et un suivi documenté. Pas de promesse de résultat sur ce qui dépend d'une administration ou d'un tiers, mais un travail structuré et transparent.",
    },
    {
      question: "Est-ce réservé aux personnes vivant au Québec ?",
      reponse:
        "Non. LeBoy s'adresse à la diaspora vivant à l'étranger (Canada, États-Unis, Europe, Afrique, etc.) qui a des dossiers à suivre dans son pays d'origine. Le point commun est le besoin d'un relais structuré pour des démarches à distance.",
    },
  ],
  en: [
    {
      question: "Why a platform like LeBoy?",
      reponse:
        "Because it is often difficult to follow or secure certain procedures in Cameroon when living abroad: lack of reliable relays, little visibility on what is really happening, and many uncertainties. LeBoy comes to organize, frame and document certain targeted procedures for the Cameroonian diaspora.",
    },
    {
      question: "Is LeBoy a law firm or accounting firm?",
      reponse:
        "No. LeBoy does not replace a lawyer, notary, tax advisor or public officer. When a regulated professional is necessary, LeBoy acts as an interface or relay, or invites you to consult the appropriate professional.",
    },
    {
      question: "What can we concretely expect from LeBoy?",
      reponse:
        "A simple analysis of your request, a clear mandate (or a reasoned refusal), assumed limits, and documented follow-up. No promise of results on what depends on an administration or a third party, but structured and transparent work.",
    },
    {
      question: "Is it reserved for people living in Quebec?",
      reponse:
        "No. LeBoy is aimed at the Cameroonian diaspora living abroad (Canada, United States, Europe, Africa, etc.) who has files to follow in Cameroon. The common point is the link with Cameroon.",
    },
  ],
} as const;

export default function AproposPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const questionsCles = QUESTIONS_CLES[lang];

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <BackToHomeLink />
      {/* HERO */}
      <section className="bg-white border-b border-[#DDDDDD]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 grid md:grid-cols-[1.6fr,1.1fr] gap-8 items-center">
          {/* Colonne gauche */}
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4A657]">
              {t.heroTag}
            </p>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A] leading-snug">
              {t.heroTitle}
            </h1>
            <p
              className="text-sm md:text-base text-[#4B4F58]"
              style={{ textAlign: "justify" }}
            >
              {t.heroText1}
            </p>
            <p
              className="text-xs md:text-sm text-[#4B4F58]"
              style={{ textAlign: "justify" }}
            >
              {t.heroText2}
            </p>

            {/* Piliers */}
            <div className="grid sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-[#F9F9FB] border border-[#E2E2E8] rounded-lg px-3 py-3">
                <p className="text-[11px] font-semibold text-[#0A1B2A] mb-1">
                  {t.pilier1Title}
                </p>
                <p
                  className="text-[11px] text-[#4B4F58]"
                  style={{ textAlign: "justify" }}
                >
                  {t.pilier1Text}
                </p>
              </div>
              <div className="bg-[#F9F9FB] border border-[#E2E2E8] rounded-lg px-3 py-3">
                <p className="text-[11px] font-semibold text-[#0A1B2A] mb-1">
                  {t.pilier2Title}
                </p>
                <p
                  className="text-[11px] text-[#4B4F58]"
                  style={{ textAlign: "justify" }}
                >
                  {t.pilier2Text}
                </p>
              </div>
              <div className="bg-[#F9F9FB] border border-[#E2E2E8] rounded-lg px-3 py-3">
                <p className="text-[11px] font-semibold text-[#0A1B2A] mb-1">
                  {t.pilier3Title}
                </p>
                <p
                  className="text-[11px] text-[#4B4F58]"
                  style={{ textAlign: "justify" }}
                >
                  {t.pilier3Text}
                </p>
              </div>
            </div>
          </div>

          {/* Colonne droite – "LeBoy en bref" */}
          <aside className="bg-[#0A1B2A] rounded-2xl shadow-md p-5 md:p-6 space-y-4 text-[#F2F2F5]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4A657]">
              {t.asideTag}
            </p>
            <p className="text-sm md:text-base font-heading font-semibold text-white">
              {t.asideTitle}
            </p>
            <div className="space-y-2 text-xs md:text-sm text-[#E5E5E5]">
              <p style={{ textAlign: "justify" }}>{t.asideText1}</p>
              <p style={{ textAlign: "justify" }}>{t.asideText2}</p>
            </div>
            <div className="pt-1">
              <a
                href="/inscription"
                className="inline-flex items-center justify-center rounded-md bg-[#D4A657] text-[#0A1B2A] px-4 py-2 font-semibold text-xs md:text-sm hover:brightness-95 transition"
              >
                {t.asideButton}
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* BLOCS REPÈRES */}
      <section className="bg-[#F2F2F5]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
          <div className="space-y-1">
            <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
              {t.reperesTitle}
            </h2>
            <p
              className="text-xs md:text-sm text-[#4B4F58] max-w-3xl"
              style={{ textAlign: "justify" }}
            >
              {t.reperesSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            <article className="bg-white border border-[#DDDDDD] rounded-xl shadow-sm p-4 md:p-5 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#D4A657]">
                {t.missionTag}
              </p>
              <h3 className="font-heading text-sm md:text-base text-[#0A1B2A] font-semibold">
                {t.missionTitle}
              </h3>
              <p
                className="text-xs md:text-sm text-[#4B4F58]"
                style={{ textAlign: "justify" }}
              >
                {t.missionText}
              </p>
            </article>

            <article className="bg-white border border-[#DDDDDD] rounded-xl shadow-sm p-4 md:p-5 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#D4A657]">
                {t.postureTag}
              </p>
              <h3 className="font-heading text-sm md:text-base text-[#0A1B2A] font-semibold">
                {t.postureTitle}
              </h3>
              <p
                className="text-xs md:text-sm text-[#4B4F58]"
                style={{ textAlign: "justify" }}
              >
                {t.postureText}
              </p>
            </article>

            <article className="bg-white border border-[#DDDDDD] rounded-xl shadow-sm p-4 md:p-5 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#D4A657]">
                {t.travailTag}
              </p>
              <h3 className="font-heading text-sm md:text-base text-[#0A1B2A] font-semibold">
                {t.travailTitle}
              </h3>
              <p
                className="text-xs md:text-sm text-[#4B4F58]"
                style={{ textAlign: "justify" }}
              >
                {t.travailText}
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* QUESTIONS CLÉS EN BANDEROLES */}
      <section className="bg-[#F2F2F5]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-8 md:pb-12 space-y-4">
          <div className="space-y-1">
            <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
              {t.questionsTitle}
            </h2>
            <p
              className="text-xs md:text-sm text-[#4B4F58] max-w-3xl"
              style={{ textAlign: "justify" }}
            >
              {t.questionsSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {questionsCles.map((item, idx) => (
              <article
                key={idx}
                className="rounded-xl border border-[#DDDDDD] bg-white shadow-sm overflow-hidden"
              >
                {/* Banderole question */}
                <div className="bg-[#0A1B2A] px-4 md:px-5 py-2.5 flex items-center justify-between gap-2">
                  <p className="font-heading text-xs md:text-sm font-semibold text-white">
                    {item.question}
                  </p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#D4A657] text-[#0A1B2A] font-semibold">
                    Q{idx + 1}
                  </span>
                </div>
                {/* Corps réponse */}
                <div className="px-4 md:px-5 py-3 md:py-4">
                  <p
                    className="text-xs md:text-sm text-[#4B4F58]"
                    style={{ textAlign: "justify" }}
                  >
                    {item.reponse}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div
            className="text-[11px] md:text-xs text-[#4B4F58]"
            style={{ textAlign: "justify" }}
          >
            {t.questionsFooter}{" "}
            <a
              href="/faq"
              className="text-[#0A1B2A] font-semibold hover:text-[#D4A657]"
            >
              {t.faqLink}
            </a>{" "}
            {t.questionsFooter2}{" "}
            <a
              href="/contact"
              className="text-[#0A1B2A] font-semibold hover:text-[#D4A657]"
            >
              {t.contactLink}
            </a>
            .
          </div>
        </div>
      </section>

      {/* POUR QUI ? + CTA FINAL */}
      <section className="bg-[#F2F2F5] pb-12 md:pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-[#DDDDDD] p-5 md:p-6 space-y-3">
            <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
              {t.pourQuiTitle}
            </h2>
            <p
              className="text-sm text-[#4B4F58]"
              style={{ textAlign: "justify" }}
            >
              {t.pourQuiText}
            </p>
            <div className="border-l-2 border-[#D4A657] pl-4 space-y-2 text-xs md:text-sm text-[#4B4F58]">
              <p style={{ textAlign: "justify" }}>• {t.pourQui1}</p>
              <p style={{ textAlign: "justify" }}>• {t.pourQui2}</p>
              <p style={{ textAlign: "justify" }}>• {t.pourQui3}</p>
              <p style={{ textAlign: "justify" }}>• {t.pourQui4}</p>
            </div>
            <p
              className="text-xs md:text-sm text-[#4B4F58]"
              style={{ textAlign: "justify" }}
            >
              {t.pourQuiConclusion}
            </p>
          </section>

          <section className="rounded-xl bg-[#0A1B2A] px-5 md:px-6 py-5 md:py-6 text-[#F2F2F5] space-y-2">
            <h2 className="font-heading text-lg md:text-xl font-semibold text-white">
              {t.ctaTitle}
            </h2>
            <p
              className="text-sm text-[#E5E5E5] max-w-3xl"
              style={{ textAlign: "justify" }}
            >
              {t.ctaText}
            </p>
            <div className="pt-1 flex flex-wrap gap-3">
              <a
                href="/inscription"
                className="inline-flex items-center justify-center rounded-md bg-[#D4A657] text-[#0A1B2A] px-4 py-2 font-semibold text-xs md:text-sm hover:brightness-95 transition"
              >
                {t.ctaButton1}
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md border border-[#D4A657] text-[#F2F2F5] px-4 py-2 font-semibold text-xs md:text-sm hover:bg-[#D4A657] hover:text-[#0A1B2A] transition"
              >
                {t.ctaButton2}
              </a>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
