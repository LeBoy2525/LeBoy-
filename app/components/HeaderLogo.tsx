"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

const SLOGANS = {
  fr: "Votre partenaire de confiance au pays",
  en: "Your trusted partner back home",
} as const;

export default function HeaderLogo() {
  const { lang } = useLanguage();

  return (
    <Link href="/" className="flex items-center gap-3 flex-shrink-0">
      <div className="h-10 w-10 rounded-full bg-[#0B2135] flex items-center justify-center text-xs font-bold text-[#D4A657]">
        LB
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-heading font-extrabold text-[#0B2135] text-lg">
          LeBoy
        </span>
        <span className="text-[11px] font-bold text-[#0B2135] hidden sm:block">
          {SLOGANS[lang]}
        </span>
      </div>
    </Link>
  );
}

