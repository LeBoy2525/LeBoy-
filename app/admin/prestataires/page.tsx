"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../components/LanguageProvider";
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Play,
  Search,
  Filter,
  FileText,
  Mail,
  Phone,
  MapPin,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import type { Prestataire, StatutPrestataire } from "@/lib/prestatairesStore";
import { formatDateWithTimezones } from "@/lib/dateUtils";

const TEXT = {
  fr: {
    title: "Gestion des prestataires",
    subtitle: "Valider, suspendre ou gérer les prestataires du réseau LeBoy",
    searchPlaceholder: "Rechercher par nom, ville, spécialité...",
    filterAll: "Tous",
    filterEnAttente: "En attente",
    filterActifs: "Actifs",
    filterSuspendus: "Suspendus",
    filterRejetes: "Rejetés",
    noResults: "Aucun prestataire trouvé",
    loading: "Chargement...",
    actions: "Actions",
    valider: "Valider",
    rejeter: "Rejeter",
    suspendre: "Suspendre",
    reactiver: "Réactiver",
    supprimer: "Supprimer",
    voirDetails: "Voir détails",
    confirmSupprimer: "Supprimer ce prestataire rejeté ? Il sera déplacé dans la corbeille et pourra être restauré pendant 30 jours.",
    ref: "Réf.",
    entreprise: "Entreprise",
    contact: "Contact",
    ville: "Ville",
    specialites: "Spécialités",
    statut: "Statut",
    dateInscription: "Date d'inscription",
    confirmValider: "Valider ce prestataire ?",
    confirmRejeter: "Rejeter cette candidature ?",
    confirmSuspendre: "Suspendre ce prestataire ?",
    confirmReactiver: "Réactiver ce prestataire ?",
    dateReception: "Date de réception",
    adresse: "Adresse complète",
    zonesIntervention: "Zones d'intervention",
    numeroOrdre: "Numéro d'ordre professionnel",
    tarifMin: "Tarif minimum",
    tarifMax: "Tarif maximum",
    siteWeb: "Site web",
    heureCameroun: "Heure (Cameroun)",
    heureCanada: "Heure (Canada)",
  },
  en: {
    title: "Provider management",
    subtitle: "Validate, suspend or manage LeBoy network providers",
    searchPlaceholder: "Search by name, city, specialty...",
    filterAll: "All",
    filterEnAttente: "Pending",
    filterActifs: "Active",
    filterSuspendus: "Suspended",
    filterRejetes: "Rejected",
    noResults: "No providers found",
    loading: "Loading...",
    actions: "Actions",
    valider: "Validate",
    rejeter: "Reject",
    suspendre: "Suspend",
    reactiver: "Reactivate",
    supprimer: "Delete",
    voirDetails: "View details",
    confirmSupprimer: "Delete this rejected provider? It will be moved to trash and can be restored for 30 days.",
    ref: "Ref.",
    entreprise: "Company",
    contact: "Contact",
    ville: "City",
    specialites: "Specialties",
    statut: "Status",
    dateInscription: "Registration date",
    confirmValider: "Validate this provider?",
    confirmRejeter: "Reject this application?",
    confirmSuspendre: "Suspend this provider?",
    confirmReactiver: "Reactivate this provider?",
    dateReception: "Reception date",
    adresse: "Full address",
    zonesIntervention: "Areas of intervention",
    numeroOrdre: "Professional order number",
    tarifMin: "Minimum rate",
    tarifMax: "Maximum rate",
    siteWeb: "Website",
    heureCameroun: "Time (Cameroon)",
    heureCanada: "Time (Canada)",
  },
} as const;

const STATUT_LABELS = {
  fr: {
    en_attente: "En attente",
    actif: "Actif",
    suspendu: "Suspendu",
    rejete: "Rejeté",
  },
  en: {
    en_attente: "Pending",
    actif: "Active",
    suspendu: "Suspended",
    rejete: "Rejected",
  },
} as const;

const STATUT_COLORS = {
  en_attente: "bg-yellow-100 text-yellow-800",
  actif: "bg-green-100 text-green-800",
  suspendu: "bg-orange-100 text-orange-800",
  rejete: "bg-red-100 text-red-800",
};

export default function AdminPrestatairesPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const router = useRouter();
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutPrestataire | "all">("all");

  useEffect(() => {
    async function fetchPrestataires() {
      try {
        const res = await fetch("/api/prestataires", { cache: "no-store" });
        const data = await res.json();
        setPrestataires(data.prestataires || []);
      } catch (err) {
        console.error("Erreur chargement prestataires:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrestataires();
  }, []);

  const handleAction = async (id: number, action: string) => {
    if (!confirm(t[`confirm${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof t])) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/prestataires/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'action");
      }

      // Recharger la liste
      const resList = await fetch("/api/prestataires", { cache: "no-store" });
      const data = await resList.json();
      setPrestataires(data.prestataires || []);
    } catch (err) {
      console.error("Erreur action:", err);
      alert("Erreur lors de l'opération");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.confirmSupprimer)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/prestataires/${id}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      // Recharger la liste
      const resList = await fetch("/api/prestataires", { cache: "no-store" });
      const data = await resList.json();
      setPrestataires(data.prestataires || []);
      alert(lang === "fr" ? "✅ Prestataire supprimé avec succès" : "✅ Provider deleted successfully");
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      alert(err.message || (lang === "fr" ? "❌ Erreur lors de la suppression" : "❌ Error deleting"));
    }
  };

  const filteredPrestataires = prestataires.filter((p) => {
    // Exclure les prestataires supprimés
    if (p.deletedAt) {
      return false;
    }

    const matchesSearch =
      searchTerm === "" ||
      p.nomEntreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nomContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.specialites.some((s) => s.includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filterStatut === "all" || p.statut === filterStatut;

    return matchesSearch && matchesFilter;
  });

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
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
                {t.title}
              </h1>
              <p className="text-sm md:text-base text-[#4B4F58] mt-1">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#DDDDDD] rounded-md focus:outline-none focus:border-[#0A1B2A]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {([
                { value: "all", label: "all" },
                { value: "en_attente", label: "en_attente" },
                { value: "actif", label: "actifs" },
                { value: "suspendu", label: "suspendus" },
                { value: "rejete", label: "rejetes" },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterStatut(value === "all" ? "all" : value as StatutPrestataire)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                    filterStatut === value
                      ? "bg-[#0A1B2A] text-white"
                      : "bg-[#F9F9FB] text-[#4B4F58] hover:bg-[#E2E2E8]"
                  }`}
                >
                  {t[`filter${label.charAt(0).toUpperCase() + label.slice(1)}` as keyof typeof t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-12 text-[#4B4F58]">{t.loading}</div>
        ) : filteredPrestataires.length === 0 ? (
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-12 text-center text-[#4B4F58]">
            {t.noResults}
          </div>
        ) : (
          <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9F9FB] border-b border-[#E2E2E8]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                      {t.ref}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                      {t.entreprise}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                      {t.contact}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                      {t.ville}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                      {t.specialites}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                      {t.statut}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                      {t.dateReception}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEE]">
                  {filteredPrestataires.map((prestataire) => {
                    const dates = formatDateWithTimezones(prestataire.createdAt);
                    return (
                      <tr 
                        key={prestataire.id} 
                        className="hover:bg-[#F9F9FB] cursor-pointer transition"
                        onClick={() => router.push(`/admin/prestataires/${prestataire.id}`)}
                      >
                        <td className="px-4 py-3 text-xs font-mono text-[#6B7280]">
                          {prestataire.ref}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#0A1B2A] font-medium">
                          {prestataire.nomEntreprise}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#4B4F58]">
                          <div className="font-medium">{prestataire.nomContact}</div>
                          <span className="text-[#9CA3AF]">{prestataire.email}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#4B4F58]">
                          {prestataire.ville}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#4B4F58]">
                          <div className="mb-1">{prestataire.specialites.slice(0, 2).join(", ")}</div>
                          {prestataire.specialites.length > 2 && (
                            <span className="text-[#9CA3AF]">+{prestataire.specialites.length - 2} autres</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              STATUT_COLORS[prestataire.statut]
                            }`}
                          >
                            {STATUT_LABELS[lang][prestataire.statut]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="text-xs text-[#6B7280]">
                              <div className="font-medium text-[#0A1B2A] mb-1">Reçu le :</div>
                              <div>🇨🇲 {dates.cameroon}</div>
                              <div>🇨🇦 {dates.canada}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/prestataires/${prestataire.id}`}
                              className="p-1.5 text-[#0A1B2A] hover:bg-[#F9F9FB] rounded transition"
                              title={t.voirDetails}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                            {prestataire.statut === "en_attente" && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(prestataire.id, "valider");
                                  }}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                                  title={t.valider}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(prestataire.id, "rejeter");
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                  title={t.rejeter}
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {prestataire.statut === "actif" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(prestataire.id, "suspendre");
                                }}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition"
                                title={t.suspendre}
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            )}
                            {prestataire.statut === "suspendu" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(prestataire.id, "reactiver");
                                }}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                                title={t.reactiver}
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {prestataire.statut === "rejete" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(prestataire.id);
                                }}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition"
                                title={t.supprimer}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
