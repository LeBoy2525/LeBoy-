"use client";

// Forcer le rendu dynamique pour éviter les erreurs de prerender avec useLanguage
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import BackToHomeLink from "../components/BackToHomeLink";

const TEXT = {
  fr: {
    title: "Contact",
    subtitle:
      "Pour toute question, précision ou premier contact concernant une demande, vous pouvez utiliser ce formulaire. Une réponse vous sera apportée dans les meilleurs délais, selon la nature de la question.",
    formTitle: "Envoyer un message",
    successMessage: "Votre message a été envoyé avec succès.",
    fullName: "Nom complet",
    fullNamePlaceholder: "Votre nom",
    email: "Adresse email",
    emailPlaceholder: "exemple@email.com",
    phone: "Téléphone (optionnel)",
    phonePlaceholder: "+1 ...",
    message: "Message",
    messagePlaceholder: "Votre message...",
    sending: "Envoi en cours...",
    send: "Envoyer",
    coordinatesTitle: "Coordonnées",
    coordinatesText:
      "Vous pouvez également nous joindre par les moyens suivants :",
    emailLabel: "Email :",
    whatsappLabel: "WhatsApp :",
    hoursLabel: "Horaires :",
    hoursWeekdays: "Lundi – Vendredi : 9h00 – 17h00 (QC)",
    hoursSaturday: "Samedi : 10h00 – 14h00 (QC)",
    whatsappTitle: "Contacter rapidement par WhatsApp",
    whatsappText:
      "Idéal pour une première prise de contact rapide ou une courte question.",
  },
  en: {
    title: "Contact",
    subtitle:
      "For any question, clarification or initial contact regarding a request, you can use this form. A response will be provided as soon as possible, depending on the nature of the question.",
    formTitle: "Send a message",
    successMessage: "Your message has been sent successfully.",
    fullName: "Full name",
    fullNamePlaceholder: "Your name",
    email: "Email address",
    emailPlaceholder: "example@email.com",
    phone: "Phone (optional)",
    phonePlaceholder: "+1 ...",
    message: "Message",
    messagePlaceholder: "Your message...",
    sending: "Sending...",
    send: "Send",
    coordinatesTitle: "Contact information",
    coordinatesText: "You can also reach us through the following means:",
    emailLabel: "Email:",
    whatsappLabel: "WhatsApp:",
    hoursLabel: "Hours:",
    hoursWeekdays: "Monday – Friday: 9:00 AM – 5:00 PM (QC)",
    hoursSaturday: "Saturday: 10:00 AM – 2:00 PM (QC)",
    whatsappTitle: "Quick contact via WhatsApp",
    whatsappText:
      "Ideal for a quick initial contact or a short question.",
  },
} as const;

export default function ContactPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    setTimeout(() => {
      setStatus("sent");
    }, 1500);
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

      {/* SECTION CONTACT */}
      <section className="bg-[#F2F2F5]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 grid md:grid-cols-2 gap-8">
          {/* FORMULAIRE */}
          <div className="bg-white rounded-xl shadow-sm border border-[#DDDDDD] p-5 md:p-6 space-y-5">
            <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
              {t.formTitle}
            </h2>

            {status === "sent" ? (
              <div className="p-4 rounded-md bg-[#E7FFE7] border border-[#77C877] text-[#217221] text-sm">
                {t.successMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nom */}
                <div>
                  <label className="block text-xs font-semibold text-[#0A1B2A] mb-1">
                    {t.fullName}
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 rounded-md border border-[#CCCCCC] text-sm"
                    placeholder={t.fullNamePlaceholder}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#0A1B2A] mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 rounded-md border border-[#CCCCCC] text-sm"
                    placeholder={t.emailPlaceholder}
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-xs font-semibold text-[#0A1B2A] mb-1">
                    {t.phone}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-[#CCCCCC] text-sm"
                    placeholder={t.phonePlaceholder}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-[#0A1B2A] mb-1">
                    {t.message}
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 rounded-md border border-[#CCCCCC] text-sm"
                    placeholder={t.messagePlaceholder}
                  ></textarea>
                </div>

                {/* Bouton */}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-md bg-[#D4A657] text-[#0A1B2A] py-2 font-semibold text-sm hover:brightness-95 transition"
                >
                  {status === "sending" ? t.sending : t.send}
                </button>
              </form>
            )}
          </div>

          {/* COORDONNÉES */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#DDDDDD] p-5 md:p-6 space-y-3">
              <h2 className="font-heading text-lg md:text-xl text-[#0A1B2A] font-semibold">
                {t.coordinatesTitle}
              </h2>

              <p className="text-sm text-[#4B4F58]" style={{ textAlign: "justify" }}>
                {t.coordinatesText}
              </p>

              <div className="space-y-2 text-sm text-[#0A1B2A]">
                <p>
                  <strong>{t.emailLabel}</strong> contact@leboy.com
                </p>
                <p>
                  <strong>{t.whatsappLabel}</strong> +1 (514) 000-0000
                </p>
                <p>
                  <strong>{t.hoursLabel}</strong>
                  <br />
                  {t.hoursWeekdays}
                  <br />
                  {t.hoursSaturday}
                </p>
              </div>
            </div>

            {/* BLOC WHATSAPP */}
            <a
              href="https://wa.me/15140000000"
              target="_blank"
              className="block rounded-xl bg-[#0A1B2A] p-5 text-white hover:brightness-125 transition"
            >
              <h3 className="font-heading text-base md:text-lg font-semibold mb-1 text-white">
                {t.whatsappTitle}
              </h3>
              <p className="text-sm text-[#E5E5E5]">{t.whatsappText}</p>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
