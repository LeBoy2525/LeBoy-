// app/admin/commissions/page.tsx
// Interface admin pour configurer les commissions par catégorie

"use client";

// Forcer le rendu dynamique pour éviter les erreurs de prerender avec useLanguage
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { Save, Settings, AlertCircle, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CommissionConfig } from "@/lib/commissionConfig";

const TEXT = {
  fr: {
    title: "Configuration des commissions LeBoy",
    subtitle: "Configurez les commissions par catégorie de service",
    category: "Catégorie",
    basePercent: "Commission de base (%)",
    minCommission: "Commission minimale (FCFA)",
    maxCommission: "Commission maximale (FCFA)",
    riskPercent: "Frais de protection (%)",
    enabled: "Actif",
    save: "Enregistrer",
    saving: "Enregistrement...",
    saved: "✅ Configuration enregistrée",
    error: "❌ Erreur lors de l'enregistrement",
    loading: "Chargement...",
    info: "La commission est calculée selon la formule : max(MIN, min(BASE% × prix, MAX)) + RISK% × prix",
    infoTitle: "Formule de calcul",
  },
  en: {
    title: "LeBoy Commission Configuration",
    subtitle: "Configure commissions by service category",
    category: "Category",
    basePercent: "Base commission (%)",
    minCommission: "Minimum commission (FCFA)",
    maxCommission: "Maximum commission (FCFA)",
    riskPercent: "Protection fees (%)",
    enabled: "Enabled",
    save: "Save",
    saving: "Saving...",
    saved: "✅ Configuration saved",
    error: "❌ Error saving",
    loading: "Loading...",
    info: "Commission is calculated as: max(MIN, min(BASE% × price, MAX)) + RISK% × price",
    infoTitle: "Calculation formula",
  },
} as const;

export default function AdminCommissionsPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [configs, setConfigs] = useState<CommissionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchConfigs() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/commission-configs", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setConfigs(data.configs || []);
        } else {
          console.error("Erreur lors du chargement des configurations");
        }
      } catch (error) {
        console.error("Erreur fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchConfigs();
  }, []);

  const handleUpdate = async (categoryId: string, updates: Partial<CommissionConfig>) => {
    setSaving(categoryId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/commission-configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, updates }),
      });

      if (res.ok) {
        const data = await res.json();
        // Mettre à jour la config dans l'état local
        setConfigs((prev) =>
          prev.map((c) => (c.id === categoryId ? data.config : c))
        );
        setMessage({ type: "success", text: t.saved });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || t.error });
      }
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      setMessage({ type: "error", text: t.error });
    } finally {
      setSaving(null);
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
          <div className="text-center py-12 text-[#4B4F58]">{t.loading}</div>
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
        <div className="space-y-2 mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
            {t.title}
          </h1>
          <p className="text-sm md:text-base text-[#4B4F58]">{t.subtitle}</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Info box */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">{t.infoTitle}</h3>
              <p className="text-sm text-blue-800">{t.info}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {configs.map((config) => (
            <div
              key={config.id}
              className="bg-white border border-[#DDDDDD] rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-[#0A1B2A]">
                  {config.categoryName}
                </h2>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) =>
                      handleUpdate(config.id, { enabled: e.target.checked })
                    }
                    className="w-4 h-4 text-[#D4A657] border-2 border-[#DDDDDD] rounded focus:ring-[#D4A657]"
                  />
                  <span className="text-sm text-[#4B4F58]">{t.enabled}</span>
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0A1B2A] mb-1">
                    {t.basePercent}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={config.basePercent}
                    onChange={(e) => {
                      const newConfig = {
                        ...config,
                        basePercent: parseFloat(e.target.value) || 0,
                      };
                      setConfigs((prev) =>
                        prev.map((c) => (c.id === config.id ? newConfig : c))
                      );
                    }}
                    onBlur={() => handleUpdate(config.id, { basePercent: config.basePercent })}
                    className="w-full px-3 py-2 border border-[#DDDDDD] rounded-md text-sm focus:outline-none focus:border-[#0A1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A1B2A] mb-1">
                    {t.riskPercent}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={config.riskPercent}
                    onChange={(e) => {
                      const newConfig = {
                        ...config,
                        riskPercent: parseFloat(e.target.value) || 0,
                      };
                      setConfigs((prev) =>
                        prev.map((c) => (c.id === config.id ? newConfig : c))
                      );
                    }}
                    onBlur={() => handleUpdate(config.id, { riskPercent: config.riskPercent })}
                    className="w-full px-3 py-2 border border-[#DDDDDD] rounded-md text-sm focus:outline-none focus:border-[#0A1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A1B2A] mb-1">
                    {t.minCommission}
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={config.minCommission}
                    onChange={(e) => {
                      const newConfig = {
                        ...config,
                        minCommission: parseFloat(e.target.value) || 0,
                      };
                      setConfigs((prev) =>
                        prev.map((c) => (c.id === config.id ? newConfig : c))
                      );
                    }}
                    onBlur={() => handleUpdate(config.id, { minCommission: config.minCommission })}
                    className="w-full px-3 py-2 border border-[#DDDDDD] rounded-md text-sm focus:outline-none focus:border-[#0A1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A1B2A] mb-1">
                    {t.maxCommission}
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={config.maxCommission}
                    onChange={(e) => {
                      const newConfig = {
                        ...config,
                        maxCommission: parseFloat(e.target.value) || 0,
                      };
                      setConfigs((prev) =>
                        prev.map((c) => (c.id === config.id ? newConfig : c))
                      );
                    }}
                    onBlur={() => handleUpdate(config.id, { maxCommission: config.maxCommission })}
                    className="w-full px-3 py-2 border border-[#DDDDDD] rounded-md text-sm focus:outline-none focus:border-[#0A1B2A]"
                  />
                </div>
              </div>

              {saving === config.id && (
                <div className="mt-4 text-sm text-[#6B7280]">{t.saving}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

