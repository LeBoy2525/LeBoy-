"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Lang = "fr" | "en";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

// Valeur par défaut pour le SSR/prerender
const defaultLanguageValue: LanguageContextValue = {
  lang: "fr",
  setLang: () => {},
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Vérifier si on est côté client avant d'utiliser useState
  // Pendant le prerender, on utilise directement la valeur par défaut
  const [langState, setLangState] = useState<Lang>(() => {
    // Pendant le prerender, retourner directement "fr"
    if (typeof window === "undefined") {
      return "fr";
    }
    // Côté client, essayer de récupérer depuis localStorage
    try {
      const savedLang = localStorage.getItem("lang") as Lang | null;
      return (savedLang === "fr" || savedLang === "en") ? savedLang : "fr";
    } catch {
      return "fr";
    }
  });

  // Synchroniser avec localStorage côté client uniquement
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", langState);
    }
  }, [langState]);

  return (
    <LanguageContext.Provider value={{ lang: langState, setLang: setLangState }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  
  if (!ctx) {
    // Pendant le prerender ou si le contexte n'est pas disponible, retourner une valeur par défaut
    if (typeof window === "undefined") {
      return defaultLanguageValue;
    }
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  
  return ctx;
}
