"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../../components/LanguageProvider";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  FileText,
  Download,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { Prestataire } from "@/lib/prestatairesStore";
import { formatDateWithTimezones } from "@/lib/dateUtils";
import { PrestataireTypeBadge } from "../../../components/PrestataireTypeBadge";
// Import du type seulement (pas de logique serveur)
type Country = {
  code: string;
  nameFr: string;
  nameEn: string;
  enabled: boolean;
};

const TEXT = {
  fr: {
    title: "Détails du prestataire",
    back: "Retour à la liste",
    valider: "Valider",
    rejeter: "Rejeter",
    suspendre: "Suspendre",
    reactiver: "Réactiver",
    supprimer: "Supprimer",
    confirmValider: "Valider ce prestataire ?",
    confirmSupprimer: "Supprimer ce prestataire rejeté ? Il sera déplacé dans la corbeille et pourra être restauré pendant 30 jours.",
    confirmRejeter: "Rejeter cette candidature ?",
    confirmSuspendre: "Suspendre ce prestataire ?",
    confirmReactiver: "Réactiver ce prestataire ?",
    informations: "Informations générales",
    contact: "Contact",
    specialites: "Spécialités",
    zonesIntervention: "Zones d'intervention",
    pays: "Pays d'opération",
    paysDescription: "Pays où ce prestataire opère (définis lors de l'inscription)",
    certifications: "Certifications",
    experience: "Années d'expérience",
    tarifType: "Type de tarification",
    commissionICD: "Commission LeBoy",
    documents: "Documents justificatifs",
    aucunDocument: "Aucun document joint",
    telecharger: "Télécharger",
    statut: "Statut",
    dateInscription: "Date d'inscription",
    dateValidation: "Date de validation",
    description: "Description",
    loading: "Chargement...",
    error: "Erreur lors du chargement",
    adresse: "Adresse complète",
    numeroOrdre: "Numéro d'ordre professionnel",
    tarifMin: "Tarif minimum",
    tarifMax: "Tarif maximum",
    siteWeb: "Site web",
    dateReception: "Date de réception",
    heureCameroun: "Heure (Cameroun)",
    heureCanada: "Heure (Canada)",
  },
  en: {
    title: "Provider details",
    back: "Back to list",
    valider: "Validate",
    rejeter: "Reject",
    suspendre: "Suspend",
    reactiver: "Reactivate",
    supprimer: "Delete",
    confirmValider: "Validate this provider?",
    confirmSupprimer: "Delete this rejected provider? It will be moved to trash and can be restored for 30 days.",
    confirmRejeter: "Reject this application?",
    confirmSuspendre: "Suspend this provider?",
    confirmReactiver: "Reactivate this provider?",
    informations: "General information",
    contact: "Contact",
    specialites: "Specialties",
    zonesIntervention: "Service areas",
    pays: "Operating countries",
    paysDescription: "Countries where this provider operates (defined during registration)",
    certifications: "Certifications",
    experience: "Years of experience",
    tarifType: "Pricing type",
    commissionICD: "LeBoy commission",
    documents: "Supporting documents",
    aucunDocument: "No documents attached",
    telecharger: "Download",
    statut: "Status",
    dateInscription: "Registration date",
    dateValidation: "Validation date",
    description: "Description",
    loading: "Loading...",
    error: "Error loading",
    adresse: "Full address",
    numeroOrdre: "Professional order number",
    tarifMin: "Minimum rate",
    tarifMax: "Maximum rate",
    siteWeb: "Website",
    dateReception: "Reception date",
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

export default function AdminPrestataireDetailPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const params = useParams();
  const router = useRouter();
  
  // Récupérer l'ID de manière sécurisée
  const idParam = params?.id;
  const id = idParam ? parseInt(Array.isArray(idParam) ? idParam[0] : idParam) : NaN;

  const [prestataire, setPrestataire] = useState<Prestataire | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);

  useEffect(() => {
    async function fetchPrestataire() {
      if (!id || isNaN(id)) {
        console.error("ID invalide:", idParam);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/prestataires/${id}`, { cache: "no-store" });
        const data = await res.json();
        
        if (!res.ok) {
          console.error("Erreur API:", data.error);
          setLoading(false);
          return;
        }
        
        setPrestataire(data.prestataire);
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCountries() {
      try {
        const res = await fetch("/api/countries", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setAvailableCountries(data.countries || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des pays:", error);
      }
    }

    fetchPrestataire();
    fetchCountries();
  }, [id, idParam]);

  const handleAction = async (action: string) => {
    if (!id || isNaN(id)) {
      alert(lang === "fr" ? "ID invalide." : "Invalid ID.");
      return;
    }

    const confirmMessage = t[`confirm${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof t];
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/prestataires/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erreur lors de l'action");
      }

      // Recharger les données
      const resDetail = await fetch(`/api/prestataires/${id}`, { cache: "no-store" });
      const dataDetail = await resDetail.json();
      
      if (resDetail.ok && dataDetail.prestataire) {
        setPrestataire(dataDetail.prestataire);
      }

      // Si validation, envoyer email
      if (action === "valider" && data.prestataire) {
        console.log(`📧 Email à envoyer à ${data.prestataire.email}: Félicitations, votre compte est activé !`);
        console.log(`📧 Contenu: Votre compte prestataire LeBoy a été validé. Vous pouvez maintenant vous connecter à votre espace : /prestataires/connexion`);
      }
      
      // Afficher un message de succès
      alert(lang === "fr" ? "Action effectuée avec succès." : "Action completed successfully.");
    } catch (err: any) {
      console.error("Erreur action:", err);
      alert(err?.message || (lang === "fr" ? "Erreur lors de l'opération" : "Error during operation"));
    }
  };

  const handleDelete = async () => {
    if (!id || isNaN(id)) {
      alert(lang === "fr" ? "ID invalide." : "Invalid ID.");
      return;
    }

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

      // Rediriger vers la liste
      alert(lang === "fr" ? "✅ Prestataire supprimé avec succès" : "✅ Provider deleted successfully");
      router.push("/admin/prestataires");
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      alert(err.message || (lang === "fr" ? "❌ Erreur lors de la suppression" : "❌ Error deleting"));
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
          <div className="text-center py-12 text-[#4B4F58]">{t.loading}</div>
        </div>
      </main>
    );
  }

  if (!prestataire) {
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
          <div className="text-center py-12 text-red-600">{t.error}</div>
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
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
                {t.title}
              </h1>
              <div className="mt-2 space-y-1">
                <p className="text-sm md:text-base font-medium text-[#0A1B2A]">
                  {prestataire.ref} - {prestataire.nomEntreprise}
                </p>
                <p className="text-xs md:text-sm text-[#6B7280]">
                  {lang === "fr" ? "Contact :" : "Contact:"} {prestataire.nomContact}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/prestataires"
                className="inline-flex items-center gap-2 text-sm text-[#4B4F58] hover:text-[#0A1B2A]"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.back}
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {prestataire.statut === "en_attente" && (
              <>
                <button
                  onClick={() => handleAction("valider")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t.valider}
                </button>
                <button
                  onClick={() => handleAction("rejeter")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition"
                >
                  <XCircle className="w-4 h-4" />
                  {t.rejeter}
                </button>
              </>
            )}
            {prestataire.statut === "actif" && (
              <button
                onClick={() => handleAction("suspendre")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-md hover:bg-orange-700 transition"
              >
                <Pause className="w-4 h-4" />
                {t.suspendre}
              </button>
            )}
            {prestataire.statut === "suspendu" && (
              <button
                onClick={() => handleAction("reactiver")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition"
              >
                <Play className="w-4 h-4" />
                {t.reactiver}
              </button>
            )}
            {prestataire.statut === "rejete" && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-md hover:bg-orange-700 transition"
              >
                <Trash2 className="w-4 h-4" />
                {t.supprimer}
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Colonne gauche */}
          <div className="space-y-6">
            {/* Informations générales */}
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
                {t.informations}
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">{t.statut}</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      STATUT_COLORS[prestataire.statut]
                    }`}
                  >
                    {STATUT_LABELS[lang][prestataire.statut]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">{lang === "fr" ? "Type de prestataire" : "Provider type"}</p>
                  <PrestataireTypeBadge 
                    type={(prestataire.typePrestataire || "freelance") as "entreprise" | "freelance"} 
                    lang={lang}
                    size="md"
                  />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">{t.dateInscription}</p>
                  <p className="text-sm text-[#0A1B2A]">
                    {new Date(prestataire.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {prestataire.dateValidation && (
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">{t.dateValidation}</p>
                    <p className="text-sm text-[#0A1B2A]">
                      {new Date(prestataire.dateValidation).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">{t.experience}</p>
                  <p className="text-sm text-[#0A1B2A]">{prestataire.anneeExperience} ans</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">{t.tarifType}</p>
                  <p className="text-sm text-[#0A1B2A]">{prestataire.tarifType}</p>
                </div>
                {/* Commission dynamique - ne plus afficher de valeur fixe */}
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">{t.dateReception}</p>
                  <div className="space-y-1">
                    <p className="text-xs text-[#0A1B2A]">
                      🇨🇲 {formatDateWithTimezones(prestataire.createdAt).cameroon}
                    </p>
                    <p className="text-xs text-[#0A1B2A]">
                      🇨🇦 {formatDateWithTimezones(prestataire.createdAt).canada}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
                {t.contact}
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">
                    {lang === "fr" ? "Nom du contact" : "Contact name"}
                  </p>
                  <p className="text-sm font-medium text-[#0A1B2A]">
                    {prestataire.nomContact}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#6B7280]" />
                  <a
                    href={`mailto:${prestataire.email}`}
                    className="text-sm text-[#0A1B2A] hover:underline"
                  >
                    {prestataire.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#6B7280]" />
                  <a
                    href={`tel:${prestataire.phone}`}
                    className="text-sm text-[#0A1B2A] hover:underline"
                  >
                    {prestataire.phone}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#6B7280] mt-0.5" />
                  <div className="text-sm text-[#0A1B2A]">
                    <p className="font-medium">{prestataire.adresse}</p>
                    <p className="text-[#6B7280]">{prestataire.ville}</p>
                  </div>
                </div>
                {prestataire.siteWeb && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#6B7280]">🌐</span>
                    <a
                      href={prestataire.siteWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#0A1B2A] hover:underline"
                    >
                      {prestataire.siteWeb}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Informations complémentaires */}
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
                {lang === "fr" ? "Informations complémentaires" : "Additional information"}
              </h2>
              <div className="space-y-3">
                {prestataire.numeroOrdre && (
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">{t.numeroOrdre}</p>
                    <p className="text-sm text-[#0A1B2A]">{prestataire.numeroOrdre}</p>
                  </div>
                )}
                {(prestataire.tarifMin || prestataire.tarifMax) && (
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">
                      {t.tarifMin} / {t.tarifMax}
                    </p>
                    <p className="text-sm text-[#0A1B2A]">
                      {prestataire.tarifMin ? `${prestataire.tarifMin} FCFA` : "—"} / {prestataire.tarifMax ? `${prestataire.tarifMax} FCFA` : "—"}
                    </p>
                  </div>
                )}
                {prestataire.reseauxSociaux && (prestataire.reseauxSociaux.linkedin || prestataire.reseauxSociaux.facebook) && (
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">
                      {lang === "fr" ? "Réseaux sociaux" : "Social networks"}
                    </p>
                    <div className="space-y-1">
                      {prestataire.reseauxSociaux.linkedin && (
                        <a
                          href={prestataire.reseauxSociaux.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#0A1B2A] hover:underline block"
                        >
                          LinkedIn: {prestataire.reseauxSociaux.linkedin}
                        </a>
                      )}
                      {prestataire.reseauxSociaux.facebook && (
                        <a
                          href={prestataire.reseauxSociaux.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#0A1B2A] hover:underline block"
                        >
                          Facebook: {prestataire.reseauxSociaux.facebook}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Spécialités et zones */}
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
                {t.specialites}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {prestataire.specialites.map((spec) => (
                  <span
                    key={spec}
                    className="px-2 py-1 bg-[#F9F9FB] text-xs text-[#0A1B2A] rounded"
                  >
                    {spec}
                  </span>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#0A1B2A] mb-2">
                  {t.zonesIntervention}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {prestataire.zonesIntervention.map((zone) => (
                    <span
                      key={zone}
                      className="px-2 py-1 bg-blue-50 text-xs text-blue-800 rounded"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pays d'opération */}
              {prestataire.countries && prestataire.countries.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#E2E2E8]">
                  <h3 className="text-sm font-medium text-[#0A1B2A] mb-2">{t.pays}</h3>
                  <p className="text-xs text-[#4B4F58] mb-3">{t.paysDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    {prestataire.countries.map((code) => {
                      const country = availableCountries.find((c) => c.code === code);
                      return (
                        <span
                          key={code}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-50 text-blue-800 rounded-full border border-blue-200"
                        >
                          <Globe className="w-3 h-3" />
                          {country ? (lang === "fr" ? country.nameFr : country.nameEn) : code}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {prestataire.certifications.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-[#0A1B2A] mb-2">
                    {t.certifications}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {prestataire.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="px-2 py-1 bg-emerald-50 text-xs text-emerald-800 rounded"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
                {t.documents}
              </h2>
              {prestataire.documents && prestataire.documents.length > 0 ? (
                <div className="space-y-2">
                  {prestataire.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-[#F9F9FB] rounded border border-[#DDDDDD]"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[#0A1B2A] truncate">{doc.name}</p>
                          <p className="text-xs text-[#6B7280]">{doc.type}</p>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0A1B2A] border border-[#0A1B2A] rounded-md hover:bg-[#0A1B2A] hover:text-white transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {t.telecharger}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6B7280]">{t.aucunDocument}</p>
              )}
            </div>

            {/* Description */}
            {prestataire.description && (
              <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
                <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
                  {t.description}
                </h2>
                <p className="text-sm text-[#4B4F58] whitespace-pre-wrap">
                  {prestataire.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

