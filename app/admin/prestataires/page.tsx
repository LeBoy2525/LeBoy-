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
  User,
} from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import type { Prestataire, StatutPrestataire } from "@/lib/prestatairesStore";
import { formatDateWithTimezones } from "@/lib/dateUtils";
import { PrestataireTypeBadge } from "../../components/PrestataireTypeBadge";

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
    filterTypeAll: "Tous les types",
    filterTypeEntreprise: "Entreprises",
    filterTypeFreelance: "Freelances",
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
    filterTypeAll: "All types",
    filterTypeEntreprise: "Companies",
    filterTypeFreelance: "Freelances",
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
  const [filterType, setFilterType] = useState<"all" | "entreprise" | "freelance">("all");

  useEffect(() => {
    async function fetchPrestataires() {
      try {
        console.log("[Admin Prestataires] 🔍 Récupération des prestataires...");
        const res = await fetch("/api/prestataires", { cache: "no-store" });
        console.log("[Admin Prestataires] 📡 Réponse API:", res.status, res.statusText);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("[Admin Prestataires] ❌ Erreur HTTP:", res.status, errorText);
          throw new Error(`Erreur ${res.status}: ${errorText}`);
        }
        
        const data = await res.json();
        console.log("[Admin Prestataires] 📊 Données reçues:", {
          total: data.prestataires?.length || 0,
          stats: data.stats,
          premiersPrestataires: data.prestataires?.slice(0, 3).map((p: any) => ({
            id: p.id,
            ref: p.ref,
            email: p.email,
            statut: p.statut,
            typePrestataire: p.typePrestataire,
            deletedAt: p.deletedAt,
            type: typeof p.id,
          })),
        });
        
        const prestatairesList = data.prestataires || [];
        setPrestataires(prestatairesList);
        
        // Logs détaillés pour diagnostic des prestataires en attente
        const enAttente = prestatairesList.filter((p: any) => p.statut === "en_attente" && !p.deletedAt);
        console.log(`[Admin Prestataires] 📋 Prestataires en attente dans la liste: ${enAttente.length}`);
        if (enAttente.length > 0) {
          console.log("[Admin Prestataires] 📋 Détails prestataires en attente:", enAttente.map((p: any) => ({
            id: p.id,
            ref: p.ref,
            email: p.email,
            statut: p.statut,
          })));
        } else {
          console.warn("[Admin Prestataires] ⚠️ Aucun prestataire en attente trouvé dans la liste");
          // Afficher la répartition par statut
          const statuts = prestatairesList.reduce((acc: any, p: any) => {
            if (!p.deletedAt) {
              acc[p.statut] = (acc[p.statut] || 0) + 1;
            }
            return acc;
          }, {});
          console.log("[Admin Prestataires] 📊 Répartition par statut:", statuts);
        }
        
        console.log("[Admin Prestataires] 📊 Stats par type:", {
          total: prestatairesList.filter((p: any) => !p.deletedAt).length,
          entreprises: prestatairesList.filter((p: any) => (p.typePrestataire || "freelance") === "entreprise" && !p.deletedAt).length,
          freelances: prestatairesList.filter((p: any) => (p.typePrestataire || "freelance") === "freelance" && !p.deletedAt).length,
        });
        
        if (!data.prestataires || data.prestataires.length === 0) {
          console.warn("[Admin Prestataires] ⚠️ Aucun prestataire trouvé dans la réponse");
        }
      } catch (err) {
        console.error("[Admin Prestataires] ❌ Erreur chargement prestataires:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrestataires();
  }, []);

  const handleAction = async (id: string | number, action: string) => {
    if (!confirm(t[`confirm${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof t])) {
      return;
    }

    console.log(`[Frontend] handleAction appelé avec ID: ${id}, Action: ${action}`);
    console.log(`[Frontend] URL: /api/admin/prestataires/${id}`);

    try {
      const res = await fetch(`/api/admin/prestataires/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      console.log(`[Frontend] Réponse reçue: status ${res.status}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        console.error(`[Frontend] ❌ Erreur HTTP ${res.status}:`, errorData);
        throw new Error(errorData.error || `Erreur ${res.status} lors de l'action`);
      }

      const result = await res.json();
      console.log(`[Frontend] ✅ Action réussie:`, result);

      // Recharger la liste
      const resList = await fetch("/api/prestataires", { cache: "no-store" });
      const data = await resList.json();
      setPrestataires(data.prestataires || []);
      
      alert(lang === "fr" ? "Opération réussie" : "Operation successful");
    } catch (err: any) {
      console.error("[Frontend] ❌ Erreur action:", err);
      alert(err.message || (lang === "fr" ? "Erreur lors de l'opération" : "Error during operation"));
    }
  };

  const handleDelete = async (id: string | number) => {
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

    const matchesType =
      filterType === "all" || (p.typePrestataire || "freelance") === filterType;

    return matchesSearch && matchesFilter && matchesType;
  });

  // Statistiques par type (calculées depuis prestataires)
  const statsByType = {
    total: prestataires.filter((p) => !p.deletedAt).length,
    entreprises: prestataires.filter((p) => (p.typePrestataire || "freelance") === "entreprise" && !p.deletedAt).length,
    freelances: prestataires.filter((p) => (p.typePrestataire || "freelance") === "freelance" && !p.deletedAt).length,
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <AdminPageHeader
        title={t.title}
        description={t.subtitle}
      />

      <div className="px-6 py-6">
        {/* Répartition par type */}
        {statsByType.total > 0 && (
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 mb-6">
            <h3 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
              {lang === "fr" ? "Répartition par type" : "Distribution by type"}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#6B7280]">{t.filterTypeEntreprise}</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {loading ? "..." : statsByType.entreprises}
                  </p>
                  {statsByType.total > 0 && (
                    <p className="text-xs text-[#6B7280] mt-1">
                      {Math.round((statsByType.entreprises / statsByType.total) * 100)}% du total
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#6B7280]">{t.filterTypeFreelance}</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {loading ? "..." : statsByType.freelances}
                  </p>
                  {statsByType.total > 0 && (
                    <p className="text-xs text-[#6B7280] mt-1">
                      {Math.round((statsByType.freelances / statsByType.total) * 100)}% du total
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

            <div className="space-y-3">
              {/* Filtres par statut */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-[#6B7280] self-center mr-2">
                  {lang === "fr" ? "Statut:" : "Status:"}
                </span>
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

              {/* Filtres par type */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-[#6B7280] self-center mr-2">
                  {lang === "fr" ? "Type:" : "Type:"}
                </span>
                {([
                  { value: "all", label: "TypeAll" },
                  { value: "entreprise", label: "TypeEntreprise" },
                  { value: "freelance", label: "TypeFreelance" },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterType(value as "all" | "entreprise" | "freelance")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
                      filterType === value
                        ? "bg-[#0A1B2A] text-white"
                        : "bg-[#F9F9FB] text-[#4B4F58] hover:bg-[#E2E2E8]"
                    }`}
                  >
                    {t[label as keyof typeof t]}
                  </button>
                ))}
              </div>

              {/* Statistiques rapides */}
              <div className="flex gap-4 text-xs text-[#6B7280] pt-2 border-t border-[#E2E2E8]">
                <span>
                  {lang === "fr" ? "Total:" : "Total:"} <strong className="text-[#0A1B2A]">{filteredPrestataires.length}</strong>
                </span>
                <span>
                  {lang === "fr" ? "Entreprises:" : "Companies:"} <strong className="text-blue-600">{prestataires.filter(p => (p.typePrestataire || "freelance") === "entreprise" && !p.deletedAt).length}</strong>
                </span>
                <span>
                  {lang === "fr" ? "Freelances:" : "Freelances:"} <strong className="text-green-600">{prestataires.filter(p => (p.typePrestataire || "freelance") === "freelance" && !p.deletedAt).length}</strong>
                </span>
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
                      {lang === "fr" ? "Type" : "Type"}
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
                        <td className="px-4 py-3">
                          <PrestataireTypeBadge 
                            type={(prestataire.typePrestataire || "freelance") as "entreprise" | "freelance"} 
                            lang={lang}
                            size="sm"
                          />
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
    </div>
  );
}
