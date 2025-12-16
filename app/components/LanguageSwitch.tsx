"use client";

import { useLanguage } from "./LanguageProvider";

export default function LanguageSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="hidden md:flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => setLang("fr")}
        className={lang === "fr" ? "font-semibold text-[#0A1B2A]" : "text-[#4B4F58]"}
      >
        FR
      </button>
      <span className="text-[#DDDDDD]">|</span>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={lang === "en" ? "font-semibold text-[#0A1B2A]" : "text-[#4B4F58]"}
      >
        EN
      </button>
    </div>
  );
}
