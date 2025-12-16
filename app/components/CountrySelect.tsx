"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface Country {
  code: string;
  nameFr: string;
  nameEn: string;
}

interface CountrySelectProps {
  countries: Country[];
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  placeholder?: string;
  label?: string;
  helpText?: string;
}

export default function CountrySelect({
  countries,
  selectedCodes,
  onChange,
  placeholder,
  label,
  helpText,
}: CountrySelectProps) {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrer les pays selon le terme de recherche
  const filteredCountries = countries.filter((country) => {
    const name = lang === "fr" ? country.nameFr : country.nameEn;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Toggle sélection d'un pays
  const toggleCountry = (code: string) => {
    if (selectedCodes.includes(code)) {
      onChange(selectedCodes.filter((c) => c !== code));
    } else {
      onChange([...selectedCodes, code]);
    }
  };

  // Retirer un pays sélectionné
  const removeCountry = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedCodes.filter((c) => c !== code));
  };

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus sur l'input quand le dropdown s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getCountryName = (code: string) => {
    const country = countries.find((c) => c.code === code);
    return country
      ? lang === "fr"
        ? country.nameFr
        : country.nameEn
      : code;
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-[#0A1B2A]">{label}</label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Zone de sélection */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full min-h-[42px] rounded-md border border-[#DDDDDD] bg-[#F9F9FB] px-3 py-2 cursor-pointer hover:border-[#0A1B2A] transition-colors flex items-center gap-2 flex-wrap"
        >
          {selectedCodes.length === 0 ? (
            <span className="text-xs md:text-sm text-[#9CA3AF] flex-1">
              {placeholder || (lang === "fr" ? "Sélectionnez des pays" : "Select countries")}
            </span>
          ) : (
            <div className="flex flex-wrap gap-1.5 flex-1">
              {selectedCodes.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#D4A657]/20 text-[#0B2135] text-xs font-medium rounded-md"
                >
                  {getCountryName(code)}
                  <button
                    type="button"
                    onClick={(e) => removeCountry(code, e)}
                    className="hover:bg-[#D4A657]/30 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#6B7280] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-[#DDDDDD] rounded-md shadow-lg max-h-64 overflow-hidden flex flex-col">
            {/* Barre de recherche */}
            <div className="p-2 border-b border-[#E2E2E8]">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  lang === "fr"
                    ? "Rechercher un pays..."
                    : "Search for a country..."
                }
                className="w-full px-3 py-1.5 text-sm border border-[#DDDDDD] rounded-md focus:outline-none focus:border-[#0A1B2A]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Liste des pays */}
            <div className="overflow-y-auto max-h-48">
              {filteredCountries.length === 0 ? (
                <div className="p-3 text-sm text-[#6B7280] text-center">
                  {lang === "fr"
                    ? "Aucun pays trouvé"
                    : "No country found"}
                </div>
              ) : (
                <div className="p-1">
                  {filteredCountries.map((country) => {
                    const isSelected = selectedCodes.includes(country.code);
                    const name = lang === "fr" ? country.nameFr : country.nameEn;
                    
                    return (
                      <div
                        key={country.code}
                        onClick={() => toggleCountry(country.code)}
                        className={`px-3 py-2 text-sm cursor-pointer rounded-md transition-colors ${
                          isSelected
                            ? "bg-[#D4A657]/20 text-[#0B2135] font-medium"
                            : "hover:bg-[#F9F9FB] text-[#0A1B2A]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-[#D4A657] border-[#DDDDDD] rounded focus:ring-[#D4A657] accent-[#D4A657] cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span>{name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {helpText && (
        <p className="text-xs text-[#6B7280]">{helpText}</p>
      )}
      
      {selectedCodes.length > 0 && (
        <p className="text-xs text-[#D4A657] font-medium">
          {lang === "fr"
            ? `${selectedCodes.length} pays sélectionné(s)`
            : `${selectedCodes.length} country(ies) selected`}
        </p>
      )}
    </div>
  );
}

