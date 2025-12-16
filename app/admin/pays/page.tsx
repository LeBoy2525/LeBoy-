"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";
import { Globe, CheckCircle2, XCircle, Save, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
// Type pour les pays (pas d'import serveur)
type Country = {
  code: string;
  nameFr: string;
  nameEn: string;
  enabled: boolean;
};

const TEXT = {
  fr: {
    title: "Gestion des pays",
    subtitle: "Activez ou désactivez les pays disponibles pour les services LeBoy",
    enabled: "Actif",
    disabled: "Inactif",
    toggle: "Basculer",
    save: "Enregistrer",
    saved: "Modifications enregistrées",
    error: "Erreur lors de l'enregistrement",
    code: "Code",
    name: "Nom",
    status: "Statut",
    actions: "Actions",
    noCountries: "Aucun pays configuré",
  },
  en: {
    title: "Countries Management",
    subtitle: "Enable or disable countries available for LeBoy services",
    enabled: "Active",
    disabled: "Inactive",
    toggle: "Toggle",
    save: "Save",
    saved: "Changes saved",
    error: "Error saving changes",
    code: "Code",
    name: "Name",
    status: "Status",
    actions: "Actions",
    noCountries: "No countries configured",
  },
} as const;

export default function AdminPaysPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const res = await fetch("/api/countries?all=true", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCountries(data.countries || []);
      }
    } catch (error) {
      console.error("Erreur chargement pays:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (code: string, currentEnabled: boolean) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/countries/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const updated = data.country;
        setCountries((prev) =>
          prev.map((c) => (c.code === code ? updated : c))
        );
        setMessage({ type: "success", text: t.saved });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || t.error);
      }
    } catch (error) {
      console.error("Erreur modification pays:", error);
      setMessage({ type: "error", text: t.error });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="bg-[#F2F2F5] min-h-screen">
        <div className="bg-white border-b border-[#DDDDDD] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2135] hover:text-[#D4A657] transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A657]/10 to-[#D4A657]/5 border border-[#D4A657]/20 flex items-center justify-center group-hover:bg-[#D4A657]/20 group-hover:border-[#D4A657]/40 transition-all duration-200">
              <ArrowLeft className="w-4 h-4 text-[#D4A657] group-hover:translate-x-[-2px] transition-transform duration-200" />
            </div>
            <span>{lang === "fr" ? "Retour au tableau de bord" : "Back to dashboard"}</span>
          </Link>
        </div>
      </div>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
          <div className="text-center text-[#4B4F58]">Chargement...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      <div className="bg-white border-b border-[#DDDDDD] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2135] hover:text-[#D4A657] transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A657]/10 to-[#D4A657]/5 border border-[#D4A657]/20 flex items-center justify-center group-hover:bg-[#D4A657]/20 group-hover:border-[#D4A657]/40 transition-all duration-200">
              <ArrowLeft className="w-4 h-4 text-[#D4A657] group-hover:translate-x-[-2px] transition-transform duration-200" />
            </div>
            <span>{lang === "fr" ? "Retour au tableau de bord" : "Back to dashboard"}</span>
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-[#C8A55F]" />
            <h1 className="font-heading text-3xl font-semibold text-[#0A1B2A]">
              {t.title}
            </h1>
          </div>
          <p className="text-sm text-[#6B7280]">{t.subtitle}</p>
        </div>

        {/* Message de statut */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Table des pays */}
        <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9F9FB] border-b border-[#E2E2E8]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#0A1B2A] uppercase tracking-wider">
                    {t.code}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#0A1B2A] uppercase tracking-wider">
                    {t.name}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#0A1B2A] uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#0A1B2A] uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {countries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-[#6B7280]">
                      {t.noCountries}
                    </td>
                  </tr>
                ) : (
                  countries.map((country) => (
                    <tr key={country.code} className="hover:bg-[#F9F9FB] transition">
                      <td className="px-6 py-4 text-sm font-medium text-[#0A1B2A]">
                        {country.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#4B4F58]">
                        {lang === "fr" ? country.nameFr : country.nameEn}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                            country.enabled
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {country.enabled ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t.enabled}
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              {t.disabled}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggle(country.code, country.enabled)}
                          disabled={saving}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition ${
                            country.enabled
                              ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                              : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {country.enabled ? (
                            <>
                              <XCircle className="w-4 h-4" />
                              {lang === "fr" ? "Désactiver" : "Disable"}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              {lang === "fr" ? "Activer" : "Enable"}
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note informative */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">
                {lang === "fr"
                  ? "Note importante"
                  : "Important note"}
              </p>
              <p>
                {lang === "fr"
                  ? "Seuls les pays activés apparaîtront dans le formulaire de demande client. Les prestataires peuvent être associés à un ou plusieurs pays dans leur profil."
                  : "Only enabled countries will appear in the client request form. Providers can be associated with one or more countries in their profile."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

