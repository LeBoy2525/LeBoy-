"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, X, Search } from "lucide-react";

// Liste des grandes villes du Cameroun et d'Afrique centrale/occidentale
const VILLES_PRINCIPALES = [
  // Grandes villes du Cameroun (par ordre d'importance)
  "Douala", // Capitale économique
  "Yaoundé", // Capitale politique
  "Garoua", // Région du Nord
  "Bamenda", // Région du Nord-Ouest
  "Maroua", // Région de l'Extrême-Nord
  "Bafoussam", // Région de l'Ouest
  "Ngaoundéré", // Région de l'Adamaoua
  "Bertoua", // Région de l'Est
  "Kumba", // Région du Sud-Ouest
  "Buea", // Région du Sud-Ouest
  "Limbe", // Région du Sud-Ouest
  "Kribi", // Région du Sud
  "Ebolowa", // Région du Sud
  "Nkongsamba", // Région du Littoral
  "Edéa", // Région du Littoral
  "Loum", // Région du Littoral
  "Dschang", // Région de l'Ouest
  "Foumban", // Région de l'Ouest
  "Mbalmayo", // Région du Centre
  "Sangmélima", // Région du Sud
  // Autres pays d'Afrique centrale/occidentale
  "Abidjan", // Côte d'Ivoire
  "Lagos", // Nigeria
  "Kinshasa", // RDC
  "Brazzaville", // Congo
  "Libreville", // Gabon
  "Bangui", // Centrafrique
  "N'Djamena", // Tchad
  "Dakar", // Sénégal
  "Bamako", // Mali
  "Ouagadougou", // Burkina Faso
];

interface CitySelectProps {
  value: string[];
  onChange: (cities: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  lang?: "fr" | "en";
  multiple?: boolean; // Si false, permet seulement une ville
}

export default function CitySelect({
  value = [],
  onChange,
  placeholder,
  label,
  required = false,
  lang = "fr",
  multiple = true,
}: CitySelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normaliser une chaîne pour la recherche (supprimer accents)
  const normalizeString = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  // Filtrer les villes selon le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCities(VILLES_PRINCIPALES.filter((city) => !value.includes(city)));
    } else {
      const normalizedSearch = normalizeString(searchTerm);
      setFilteredCities(
        VILLES_PRINCIPALES.filter(
          (city) =>
            !value.includes(city) &&
            (normalizeString(city).includes(normalizedSearch) ||
              normalizedSearch.includes(normalizeString(city)))
        )
      );
    }
  }, [searchTerm, value]);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCity = (city: string) => {
    if (multiple) {
      if (!value.includes(city)) {
        onChange([...value, city]);
      }
    } else {
      onChange([city]);
      setIsOpen(false);
    }
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const handleRemoveCity = (cityToRemove: string) => {
    onChange(value.filter((city) => city !== cityToRemove));
  };

  const handleAddCustomCity = () => {
    const customCity = searchTerm.trim();
    if (customCity && !value.includes(customCity)) {
      if (multiple) {
        onChange([...value, customCity]);
      } else {
        onChange([customCity]);
        setIsOpen(false);
      }
      setSearchTerm("");
    }
  };

  const t = {
    fr: {
      selectCity: "Sélectionner une ville",
      searchCity: "Rechercher une ville...",
      addCustom: "Ajouter cette ville",
      noResults: "Aucune ville trouvée",
      selected: "Villes sélectionnées",
    },
    en: {
      selectCity: "Select a city",
      searchCity: "Search for a city...",
      addCustom: "Add this city",
      noResults: "No city found",
      selected: "Selected cities",
    },
  }[lang];

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-[#0A1B2A]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Villes sélectionnées */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((city) => (
            <span
              key={city}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A657]/10 text-[#0A1B2A] text-sm font-medium rounded-md border border-[#D4A657]/30"
            >
              <MapPin className="w-3.5 h-3.5 text-[#D4A657]" />
              {city}
              {multiple && (
                <button
                  type="button"
                  onClick={() => handleRemoveCity(city)}
                  className="ml-1 hover:text-red-600 transition"
                  aria-label={`Remove ${city}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Champ de recherche */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder || t.searchCity}
            className="w-full pl-10 pr-4 py-2.5 border border-[#DDDDDD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A657]/20 focus:border-[#D4A657] text-sm text-[#0A1B2A]"
          />
        </div>

        {/* Dropdown avec suggestions */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-[#DDDDDD] rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {/* Suggestions de villes */}
            {filteredCities.length > 0 ? (
              <div className="py-1">
                {filteredCities.slice(0, 10).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className="w-full text-left px-4 py-2 text-sm text-[#0A1B2A] hover:bg-[#F9F9FB] transition flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4 text-[#6B7280]" />
                    {city}
                  </button>
                ))}
              </div>
            ) : searchTerm.trim() ? (
              <div className="px-4 py-3 text-sm text-[#6B7280]">
                {t.noResults}
              </div>
            ) : null}

            {/* Option pour ajouter une ville personnalisée */}
            {searchTerm.trim() && !filteredCities.includes(searchTerm.trim()) && (
              <div className="border-t border-[#E2E2E8] px-4 py-2">
                <button
                  type="button"
                  onClick={handleAddCustomCity}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-[#D4A657] hover:bg-[#FFF9EC] rounded-md transition flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {t.addCustom}: &quot;{searchTerm.trim()}&quot;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

