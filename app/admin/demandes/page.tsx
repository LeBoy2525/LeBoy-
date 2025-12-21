


"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { FileText, Search, UserPlus, CheckCircle2, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { DemandeICD } from "@/lib/demandesStore";
import type { Prestataire } from "@/lib/prestatairesStore";
import { matchDemandeToPrestataires } from "@/lib/matching";
import { useRouter } from "next/navigation";
import { DemandeAssignmentStatus } from "./DemandeAssignmentStatus";
import { formatDateWithTimezones } from "@/lib/dateUtils";
import { AdminPageHeader } from "../_components/AdminPageHeader";

const TEXT = {
  fr: {
    title: "Gestion des demandes",
    subtitle: "Analysez les demandes et assignez des prestataires",
    searchPlaceholder: "Rechercher par référence, email, service...",
    noDemandes: "Aucune demande pour le moment",
    loading: "Chargement...",
    ref: "Réf.",
    client: "Client",
    service: "Service",
    lieu: "Lieu",
    date: "Date",
    actions: "Actions",
    assigner: "Assigner un ou plusieurs prestataires",
    voirDetails: "Voir détails",
    proposerPrestataire: "Proposer un prestataire",
    prestatairesSuggere: "Prestataires suggérés",
    aucunPrestataire: "Aucun prestataire disponible",
    creerMission: "Créer la mission",
    prestataireAssigne: "Prestataire assigné",
    terminee: "Terminée",
    enAttente: "En attente d'assignation",
    tarif: "Tarif prestataire (FCFA)",
    commission: "Commission LeBoy (%)",
    supprimer: "Supprimer",
    corbeille: "Corbeille",
    restaurer: "Restaurer",
    demandeSupprimee: "Demande supprimée",
    confirmerSuppression: "Êtes-vous sûr de vouloir supprimer cette demande ?",
    confirmerSuppressionDetail: "La demande sera déplacée dans la corbeille et pourra être restaurée pendant 30 jours.",
    annuler: "Annuler",
    confirmer: "Confirmer",
    joursRestants: "jours restants",
    expiree: "Expirée (plus de 30 jours)",
    aucuneCorbeille: "Aucune demande dans la corbeille",
  },
  en: {
    title: "Request management",
    subtitle: "Analyze requests and assign providers",
    searchPlaceholder: "Search by reference, email, service...",
    noDemandes: "No requests at this time",
    loading: "Loading...",
    ref: "Ref.",
    client: "Client",
    service: "Service",
    lieu: "Location",
    date: "Date",
    actions: "Actions",
    assigner: "Assign one or more providers",
    voirDetails: "View details",
    proposerPrestataire: "Propose provider",
    prestatairesSuggere: "Suggested providers",
    aucunPrestataire: "No provider available",
    creerMission: "Create mission",
    prestataireAssigne: "Provider assigned",
    terminee: "Completed",
    enAttente: "Pending assignment",
    tarif: "Provider rate (FCFA)",
    commission: "LeBoy commission (%)",
    supprimer: "Delete",
    corbeille: "Trash",
    restaurer: "Restore",
    demandeSupprimee: "Deleted request",
    confirmerSuppression: "Are you sure you want to delete this request?",
    confirmerSuppressionDetail: "The request will be moved to trash and can be restored for 30 days.",
    annuler: "Cancel",
    confirmer: "Confirm",
    joursRestants: "days remaining",
    expiree: "Expired (more than 30 days)",
    aucuneCorbeille: "No requests in trash",
  },
} as const;

export default function AdminDemandesPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [demandes, setDemandes] = useState<DemandeICD[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCorbeille, setShowCorbeille] = useState(false);
  const [deletedDemandes, setDeletedDemandes] = useState<DemandeICD[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [demandeToDelete, setDemandeToDelete] = useState<DemandeICD | null>(null);
  const [demandeFiles, setDemandeFiles] = useState<any[]>([]);
  const [shareFiles, setShareFiles] = useState(false);
  const [shareMode, setShareMode] = useState<"all" | "partial">("all");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [demandesMissions, setDemandesMissions] = useState<Map<number, any[]>>(new Map());
  const router = useRouter();


  useEffect(() => {
    async function fetchDemandes() {
      try {
        const res = await fetch("/api/demandes", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setDemandes(data.demandes || []);
          
          // Récupérer les missions pour chaque demande en parallèle pour améliorer les performances
          const missionsMap = new Map<number, any[]>();
          const missionsPromises = (data.demandes || []).map(async (demande: any) => {
            try {
              const missionsRes = await fetch(`/api/admin/demandes/${demande.id}/missions`, { 
                cache: "no-store",
                headers: { "Cache-Control": "no-cache" }
              });
              if (missionsRes.ok) {
                const missionsData = await missionsRes.json();
                return { demandeId: demande.id, missions: missionsData.missions || [] };
              }
            } catch (err) {
              console.error(`Erreur chargement missions pour demande ${demande.id}:`, err);
            }
            return { demandeId: demande.id, missions: [] };
          });
          
          // Attendre toutes les requêtes en parallèle
          const missionsResults = await Promise.all(missionsPromises);
          missionsResults.forEach(({ demandeId, missions }) => {
            missionsMap.set(demandeId, missions);
            if (missions.length > 0) {
              console.log(`✅ Missions chargées pour demande ${demandeId}: ${missions.length}`);
            }
          });
          
          setDemandesMissions(missionsMap);
          console.log(`✅ Total missions chargées: ${missionsMap.size} demandes avec missions`);
        }
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDemandes();
  }, []);

  // Recharger les missions quand la page redevient visible (retour depuis une autre page)
  // Utiliser un flag pour éviter les rechargements multiples simultanés
  useEffect(() => {
    let isReloading = false;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && demandes.length > 0 && !isReloading) {
        isReloading = true;
        console.log("🔄 Page visible, rechargement des missions...");
        async function reloadMissions() {
          try {
            const missionsMap = new Map<number, any[]>();
            for (const demande of demandes) {
              try {
                const missionsRes = await fetch(`/api/admin/demandes/${demande.id}/missions`, { 
                  cache: "no-store",
                  headers: { "Cache-Control": "no-cache" }
                });
                if (missionsRes.ok) {
                  const missionsData = await missionsRes.json();
                  const missionsList = missionsData.missions || [];
                  missionsMap.set(demande.id, missionsList);
                  console.log(`✅ Missions rechargées pour demande ${demande.id}: ${missionsList.length}`);
                }
              } catch (err) {
                console.error(`Erreur rechargement missions pour demande ${demande.id}:`, err);
              }
            }
            setDemandesMissions(missionsMap);
            console.log(`✅ Total missions rechargées: ${missionsMap.size} demandes`);
          } finally {
            isReloading = false;
          }
        }
        reloadMissions();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [demandes]);

  useEffect(() => {
    async function fetchDeletedDemandes() {
      try {
        const res = await fetch("/api/admin/demandes/corbeille", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setDeletedDemandes(data.demandes || []);
        }
      } catch (err) {
        console.error("Erreur:", err);
      }
    }

    if (showCorbeille) {
      fetchDeletedDemandes();
    }
  }, [showCorbeille]);

  // Fonctions d'assignation retirées - l'assignation se fait uniquement depuis la page de détail

  const handleDelete = async (demande: DemandeICD) => {
    setDemandeToDelete(demande);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!demandeToDelete) return;

    try {
      const res = await fetch(`/api/admin/demandes/${demandeToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Recharger les demandes
        const resDemandes = await fetch("/api/demandes", { cache: "no-store" });
        const data = await resDemandes.json();
        setDemandes(data.demandes || []);
        setShowDeleteModal(false);
        setDemandeToDelete(null);
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la suppression");
    }
  };

  const handleRestore = async (demande: DemandeICD) => {
    try {
      const res = await fetch(`/api/admin/demandes/${demande.id}`, {
        method: "POST",
      });

      if (res.ok) {
        // Recharger les demandes
        const resDemandes = await fetch("/api/demandes", { cache: "no-store" });
        const data = await resDemandes.json();
        setDemandes(data.demandes || []);
        
        // Recharger la corbeille
        const resCorbeille = await fetch("/api/admin/demandes/corbeille", {
          cache: "no-store",
        });
        const dataCorbeille = await resCorbeille.json();
        setDeletedDemandes(dataCorbeille.demandes || []);
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la restauration");
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la restauration");
    }
  };

  const getDaysRemaining = (deletedAt: string | null | undefined): number | null => {
    if (!deletedAt) return null;
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.floor(30 - daysDiff));
  };

  const filteredDemandes = demandes.filter((d) => {
    const search = searchTerm.toLowerCase();
    return (
      d.ref.toLowerCase().includes(search) ||
      d.email.toLowerCase().includes(search) ||
      d.serviceType.toLowerCase().includes(search) ||
      (d.lieu && d.lieu.toLowerCase().includes(search))
    );
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <AdminPageHeader
        title={t.title}
        description={t.subtitle}
        actions={
          <button
            onClick={() => setShowCorbeille(!showCorbeille)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition ${
              showCorbeille
                ? "bg-gray-900 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {t.corbeille}
          </button>
        }
      />

      <div className="px-6 py-6">

        {/* Recherche */}
        <div className="bg-white border border-[#DDDDDD] rounded-xl p-4 mb-6">
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
        </div>

        {!showCorbeille ? (
          <>
            {loading ? (
              <div className="text-center py-12 text-[#4B4F58]">{t.loading}</div>
            ) : filteredDemandes.length === 0 ? (
              <div className="bg-white border border-[#DDDDDD] rounded-xl p-12 text-center text-[#4B4F58]">
                {t.noDemandes}
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
                          {t.client}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                          {t.service}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                          {t.lieu}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                          {t.date}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                          {t.actions}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEEE]">
                      {filteredDemandes.map((demande) => {
                        const missions = demandesMissions.get(demande.id) || [];
                        const mission = missions[0];
                        const needsAction = mission && (
                          mission.internalState === "PROVIDER_ESTIMATED" ||
                          mission.internalState === "PAID_WAITING_TAKEOVER" ||
                          mission.internalState === "PROVIDER_VALIDATION_SUBMITTED"
                        );
                        const actionType = mission?.internalState;
                        
                        return (
                        <tr 
                          key={demande.id} 
                          className={`hover:bg-[#F9F9FB] cursor-pointer transition ${needsAction ? "bg-yellow-50/30" : ""}`}
                          onClick={() => router.push(`/admin/demandes/${demande.id}`)}
                        >
                          <td className="px-4 py-3 text-xs font-mono text-[#6B7280]">
                            <div className="flex items-center gap-2">
                              {demande.ref}
                              {needsAction && (
                                <span 
                                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                                    actionType === "PROVIDER_ESTIMATED" ? "bg-green-500" :
                                    actionType === "PAID_WAITING_TAKEOVER" ? "bg-orange-500" :
                                    "bg-purple-500"
                                  }`}
                                  title={
                                    actionType === "PROVIDER_ESTIMATED" 
                                      ? (lang === "fr" ? "Estimation reçue - Action requise" : "Estimation received - Action required")
                                      : actionType === "PAID_WAITING_TAKEOVER"
                                      ? (lang === "fr" ? "Envoi avance requis" : "Advance payment required")
                                      : (lang === "fr" ? "Validation requise" : "Validation required")
                                  }
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#0A1B2A]">
                            {demande.fullName}
                            <br />
                            <span className="text-xs text-[#6B7280]">{demande.email}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#4B4F58]">
                            {demande.serviceType}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#4B4F58]">
                            {demande.lieu || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#6B7280]">
                            <div className="space-y-0.5">
                              <div>🇨🇲 {formatDateWithTimezones(demande.createdAt).cameroon}</div>
                              <div>🇨🇦 {formatDateWithTimezones(demande.createdAt).canada}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <DemandeAssignmentStatus 
                                demande={demande} 
                                missions={demandesMissions.get(demande.id) || []}
                                lang={lang}
                                t={t}
                              />
                              <button
                                onClick={() => handleDelete(demande)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-600 rounded-md hover:bg-red-600 hover:text-white transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t.supprimer}
                              </button>
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

            {/* Modal d'assignation retiré - l'assignation se fait uniquement depuis la page de détail */}
          </>
        ) : (
          // Afficher la corbeille
          <div className="bg-white border border-[#DDDDDD] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#E2E2E8]">
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A]">
                {t.corbeille}
              </h2>
            </div>
            {deletedDemandes.length === 0 ? (
              <div className="p-12 text-center text-[#4B4F58]">
                {t.aucuneCorbeille}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F9F9FB] border-b border-[#E2E2E8]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                        {t.ref}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                        {t.client}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                        {t.service}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                        Supprimée le
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#0A1B2A]">
                        {t.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEEEEE]">
                    {deletedDemandes.map((demande) => {
                      const daysRemaining = getDaysRemaining(demande.deletedAt);
                      const canRestore = daysRemaining !== null && daysRemaining > 0;

                      return (
                        <tr key={demande.id} className="hover:bg-[#F9F9FB]">
                          <td className="px-4 py-3 text-xs font-mono text-[#6B7280]">
                            {demande.ref}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#0A1B2A]">
                            {demande.fullName}
                            <br />
                            <span className="text-xs text-[#6B7280]">{demande.email}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#4B4F58]">
                            {demande.serviceType}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#6B7280]">
                            {demande.deletedAt ? (
                              <div className="space-y-0.5">
                                <div>🇨🇲 {formatDateWithTimezones(demande.deletedAt).cameroon}</div>
                                <div>🇨🇦 {formatDateWithTimezones(demande.deletedAt).canada}</div>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {canRestore ? (
                              <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                                {daysRemaining} {t.joursRestants}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                                {t.expiree}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {canRestore && (
                              <button
                                onClick={() => handleRestore(demande)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-600 border border-green-600 rounded-md hover:bg-green-600 hover:text-white transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                {t.restaurer}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && demandeToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <h2 className="font-heading text-lg font-semibold text-[#0A1B2A]">
                  {t.confirmerSuppression}
                </h2>
              </div>
              <p className="text-sm text-[#4B4F58] mb-6">
                {t.confirmerSuppressionDetail}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDemandeToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-[#DDDDDD] text-[#4B4F58] text-sm font-semibold rounded-md hover:bg-[#F9F9FB] transition"
                >
                  {t.annuler}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition"
                >
                  {t.confirmer}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
