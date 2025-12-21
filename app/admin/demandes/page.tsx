


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
  const [selectedDemande, setSelectedDemande] = useState<DemandeICD | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
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
          
          // Récupérer les missions pour chaque demande
          const missionsMap = new Map<number, any[]>();
          for (const demande of data.demandes || []) {
            try {
              const missionsRes = await fetch(`/api/admin/demandes/${demande.id}/missions`, { cache: "no-store" });
              if (missionsRes.ok) {
                const missionsData = await missionsRes.json();
                missionsMap.set(demande.id, missionsData.missions || []);
                console.log(`✅ Missions chargées pour demande ${demande.id}:`, missionsData.missions?.length || 0);
              }
            } catch (err) {
              console.error(`Erreur chargement missions pour demande ${demande.id}:`, err);
            }
          }
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
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && demandes.length > 0) {
        console.log("🔄 Page visible, rechargement des missions...");
        async function reloadMissions() {
          const missionsMap = new Map<number, any[]>();
          for (const demande of demandes) {
            try {
              const missionsRes = await fetch(`/api/admin/demandes/${demande.id}/missions`, { cache: "no-store" });
              if (missionsRes.ok) {
                const missionsData = await missionsRes.json();
                missionsMap.set(demande.id, missionsData.missions || []);
              }
            } catch (err) {
              console.error(`Erreur rechargement missions pour demande ${demande.id}:`, err);
            }
          }
          setDemandesMissions(missionsMap);
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

  const [otherPrestataires, setOtherPrestataires] = useState<any[]>([]);

  const handleAssignClick = async (demande: DemandeICD) => {
    setSelectedDemande(demande);
    setMatches([]); // Réinitialiser les matches
    setOtherPrestataires([]); // Réinitialiser les autres prestataires
    
    // Obtenir les prestataires suggérés et autres
    try {
      console.log("🔍 Recherche de prestataires pour demande:", demande.id);
      const res = await fetch(`/api/matching/${demande.id}`, {
        cache: "no-store",
      });
      
      const data = await res.json();
      console.log("🔍 Réponse API matching:", data);
      
      if (res.ok) {
        setMatches(data.matches || []);
        setOtherPrestataires(data.otherPrestataires || []);
        console.log("✅ Matches suggérés reçus:", data.matches?.length || 0);
        console.log("✅ Autres prestataires reçus:", data.otherPrestataires?.length || 0);
      } else {
        console.error("❌ Erreur API matching:", data.error);
        alert(data.error || "Erreur lors de la recherche de prestataires");
      }
    } catch (err) {
      console.error("❌ Erreur matching:", err);
      alert("Erreur lors de la recherche de prestataires");
    }
    
    setShowAssignModal(true);
  };

  const handleCreateMission = async (prestataireId: number, sharedFiles?: any[]) => {
    if (!selectedDemande) return;

    // Validation
    if (!prestataireId) {
      alert(lang === "fr" 
        ? "Veuillez sélectionner un prestataire." 
        : "Please select a provider.");
      return;
    }

    try {
      console.log("Création mission:", {
        demandeId: selectedDemande.id,
        prestataireId,
      });

      const res = await fetch("/api/admin/missions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandeId: selectedDemande.id,
          prestataireId: Number(prestataireId),
          sharedFiles: sharedFiles || [],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowAssignModal(false);
        setSelectedDemande(null);
        alert(lang === "fr" ? "Mission créée avec succès !" : "Mission created successfully!");
        
        // Recharger les missions pour la demande spécifique qui vient d'être assignée
        try {
          const missionsRes = await fetch(`/api/admin/demandes/${selectedDemande.id}/missions`, { cache: "no-store" });
          if (missionsRes.ok) {
            const missionsData = await missionsRes.json();
            // Mettre à jour le Map avec les nouvelles missions pour cette demande
            setDemandesMissions(prev => {
              const newMap = new Map(prev);
              newMap.set(selectedDemande.id, missionsData.missions || []);
              return newMap;
            });
            console.log(`✅ Missions rechargées pour demande ${selectedDemande.id}:`, missionsData.missions?.length || 0);
          }
        } catch (err) {
          console.error(`Erreur chargement missions pour demande ${selectedDemande.id}:`, err);
        }
        
        // Recharger aussi toutes les demandes pour s'assurer que tout est à jour
        try {
          const resDemandes = await fetch("/api/demandes", { cache: "no-store" });
          const dataDemandes = await resDemandes.json();
          setDemandes(dataDemandes.demandes || []);
        } catch (err) {
          console.error("Erreur rechargement demandes:", err);
        }
      } else {
        // Gérer l'erreur de doublon
        if (res.status === 409) {
          alert(data.error || (lang === "fr" ? "Une mission existe déjà pour cette demande et ce prestataire." : "A mission already exists for this request and provider."));
        } else {
          console.error("Erreur API:", data);
          alert(data.error || (lang === "fr" ? "Erreur lors de la création de la mission" : "Error creating mission"));
        }
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(lang === "fr" ? "Erreur lors de la création de la mission" : "Error creating mission");
    }
  };

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
                                onAssignClick={() => handleAssignClick(demande)}
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

            {/* Modal d'assignation */}
            {showAssignModal && selectedDemande && (
              <AssignModal
                demande={selectedDemande}
                matches={matches}
                otherPrestataires={otherPrestataires}
                demandeFiles={demandeFiles}
                onClose={() => {
                  setShowAssignModal(false);
                  setSelectedDemande(null);
                }}
                onCreateMission={handleCreateMission}
                t={t}
              />
            )}
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

function AssignModal({
  demande,
  matches,
  otherPrestataires = [],
  demandeFiles,
  onClose,
  onCreateMission,
  t,
}: {
  demande: DemandeICD;
  matches: any[];
  otherPrestataires?: any[];
  demandeFiles: any[];
  onClose: () => void;
  onCreateMission: (prestataireId: number, sharedFiles?: any[]) => void;
  t: any;
}) {
  const { lang } = useLanguage();
  const [selectedPrestataires, setSelectedPrestataires] = useState<number[]>([]);
  const [shareFiles, setShareFiles] = useState(false);
  const [shareMode, setShareMode] = useState<"all" | "partial">("all");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Log pour déboguer
  console.log("AssignModal - matches:", matches);
  console.log("AssignModal - selectedPrestataires:", selectedPrestataires);

  const handlePrestataireSelect = (prestataireId: number) => {
    console.log("Sélection prestataire:", prestataireId);
    setSelectedPrestataires((prev) => {
      if (prev.includes(prestataireId)) {
        return prev.filter((id) => id !== prestataireId);
      } else {
        return [...prev, prestataireId];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit - selectedPrestataires:", selectedPrestataires);
    if (selectedPrestataires.length === 0) {
      alert(lang === "fr" ? "Veuillez sélectionner au moins un prestataire" : "Please select at least one provider");
      return;
    }

    // Préparer les fichiers partagés
    let sharedFilesData: any[] = [];
    if (shareFiles && demandeFiles.length > 0) {
      if (shareMode === "all") {
        sharedFilesData = demandeFiles.map((file) => ({
          fileId: file.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }));
      } else if (shareMode === "partial" && selectedFiles.length > 0) {
        sharedFilesData = demandeFiles
          .filter((file) => selectedFiles.includes(file.id))
          .map((file) => ({
            fileId: file.id,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }));
      }
    }

    // Créer une mission pour chaque prestataire sélectionné
    selectedPrestataires.forEach((prestataireId) => {
      onCreateMission(prestataireId, sharedFilesData);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#E2E2E8]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-[#0A1B2A]">
              {t.proposerPrestataire}
            </h2>
            <button
              onClick={onClose}
              className="text-[#6B7280] hover:text-[#0A1B2A] text-2xl leading-none"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Demande : {demande.ref}
          </p>
          <p className="text-xs text-[#4B4F58] mt-1">
            {lang === "fr" ? "Catégorie recherchée" : "Service category"}: <span className="font-semibold text-[#0A1B2A]">{demande.serviceType}</span>
            {demande.serviceSubcategory && (
              <> • <span className="font-semibold text-[#0A1B2A]">{demande.serviceSubcategory}</span></>
            )}
            {demande.country && (
              <> • 🌍 <span className="font-semibold text-[#0A1B2A]">{demande.country}</span></>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-[#0A1B2A]">
                {t.prestatairesSuggere} {matches.length > 0 && `(${matches.length})`}
              </h3>
              {selectedPrestataires.length > 0 && (
                <span className="text-sm text-[#D4A657] font-semibold">
                  {lang === "fr" 
                    ? `${selectedPrestataires.length} sélectionné(s)` 
                    : `${selectedPrestataires.length} selected`}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280] mb-4">
              {lang === "fr" 
                ? "Cliquez sur une carte pour sélectionner un prestataire. Utilisez la case à cocher pour désélectionner."
                : "Click on a card to select a provider. Use the checkbox to deselect."}
            </p>
            {matches.length === 0 ? (
              <div className="space-y-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 font-medium">
                  {lang === "fr" 
                    ? "Aucun prestataire ne correspond directement à cette catégorie de service."
                    : "No provider directly matches this service category."}
                </p>
                <p className="text-xs text-gray-600">
                  {lang === "fr" 
                    ? "Consultez la section 'Autres prestataires' ci-dessous pour voir tous les prestataires disponibles." 
                    : "Check the 'Other providers' section below to see all available providers."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => {
                  // S'assurer que l'ID est un nombre
                  const prestataireId = typeof match.prestataire.id === 'string' 
                    ? parseInt(match.prestataire.id) 
                    : match.prestataire.id;
                  
                  return (
                    <div
                      key={prestataireId}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedPrestataires.includes(prestataireId)
                          ? "border-[#C8A55F] bg-[#FFF9EC]"
                          : match.prestataire.noteMoyenne && match.prestataire.noteMoyenne >= 4.5
                          ? "border-green-300 bg-green-50/30 hover:border-green-400"
                          : match.prestataire.noteMoyenne && match.prestataire.noteMoyenne >= 4.0
                          ? "border-green-200 bg-green-50/20 hover:border-green-300"
                          : "border-[#DDDDDD] hover:border-[#C8A55F] hover:bg-[#F9F9FB]"
                      }`}
                      onClick={(e) => {
                        // Si le clic est directement sur la checkbox, ne rien faire ici
                        const target = e.target as HTMLElement;
                        const inputTarget = target as HTMLInputElement;
                        if ((target.tagName === 'INPUT' && inputTarget.type === 'checkbox') || target.closest('input[type="checkbox"]')) {
                          return;
                        }
                        // Sinon, clic sur la carte : ajouter le prestataire s'il n'est pas déjà sélectionné
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedPrestataires((prev) => {
                          if (!prev.includes(prestataireId)) {
                            return [...prev, prestataireId];
                          }
                          // Si déjà sélectionné, ne rien faire (ne pas désélectionner)
                          return prev;
                        });
                      }}
                    >
                      <input
                        type="checkbox"
                        name={`prestataire-${prestataireId}`}
                        id={`prestataire-checkbox-${prestataireId}`}
                        value={prestataireId}
                        checked={selectedPrestataires.includes(prestataireId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const isChecked = e.target.checked;
                          setSelectedPrestataires((prev) => {
                            if (isChecked) {
                              if (!prev.includes(prestataireId)) {
                                return [...prev, prestataireId];
                              }
                              return prev;
                            } else {
                              return prev.filter((id) => id !== prestataireId);
                            }
                          });
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        className="mt-1 w-5 h-5 text-[#C8A657] border-2 border-[#DDDDDD] focus:ring-[#C8A657] focus:ring-2 cursor-pointer flex-shrink-0 rounded accent-[#C8A657]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-[#0A1B2A]">
                            {match.prestataire.nomEntreprise || "Nom non disponible"}
                          </p>
                          {match.prestataire.noteMoyenne && match.prestataire.noteMoyenne >= 4.5 && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
                              ⭐⭐⭐ {match.prestataire.noteMoyenne.toFixed(1)}/5
                            </span>
                          )}
                          {match.prestataire.noteMoyenne && match.prestataire.noteMoyenne >= 4.0 && match.prestataire.noteMoyenne < 4.5 && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                              ⭐⭐ {match.prestataire.noteMoyenne.toFixed(1)}/5
                            </span>
                          )}
                          {match.prestataire.statut === "en_attente" && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {lang === "fr" ? "En attente" : "Pending"}
                            </span>
                          )}
                          {match.prestataire.statut === "suspendu" && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              {lang === "fr" ? "Suspendu" : "Suspended"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#6B7280] mt-1 flex-wrap">
                          <span>{match.prestataire.ville || "Ville non disponible"}</span>
                          {match.prestataire.countries && match.prestataire.countries.length > 0 && (
                            <span className="text-[#4B4F58]">
                              🌍 {match.prestataire.countries.join(", ")}
                            </span>
                          )}
                          {match.prestataire.noteMoyenne ? (
                            <span className={`font-semibold ${
                              match.prestataire.noteMoyenne >= 4 ? "text-green-600" :
                              match.prestataire.noteMoyenne >= 3 ? "text-blue-600" :
                              "text-gray-600"
                            }`}>
                              {lang === "fr" ? "Note" : "Rating"}: {match.prestataire.noteMoyenne.toFixed(1)}/5
                              {match.prestataire.nombreEvaluations && ` (${match.prestataire.nombreEvaluations} ${lang === "fr" ? "éval." : "ratings"})`}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              {lang === "fr" ? "Pas encore évalué" : "Not yet rated"}
                            </span>
                          )}
                        </div>
                        {/* Afficher les spécialités du prestataire */}
                        {match.prestataire.specialites && match.prestataire.specialites.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {match.prestataire.specialites.map((spec: string, idx: number) => {
                              const isMatching = spec === demande.serviceType;
                              return (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                    isMatching
                                      ? "bg-green-100 text-green-800 border border-green-300"
                                      : "bg-gray-100 text-gray-600 border border-gray-200"
                                  }`}
                                  title={isMatching ? (lang === "fr" ? "Correspond à la catégorie recherchée" : "Matches requested category") : ""}
                                >
                                  {spec}
                                  {isMatching && " ✓"}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {match.score !== undefined && (
                          <p className="text-xs text-[#6B7280] mt-1">
                            Score: {match.score} {match.reasons && match.reasons.length > 0 && `• ${match.reasons.slice(0, 2).join(", ")}`}
                          </p>
                        )}
                      </div>
                      {selectedPrestataires.includes(prestataireId) && (
                        <div className="flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-[#C8A657]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section Autres prestataires - Toujours affichée si des prestataires actifs existent */}
          <div className="pt-6 border-t border-[#E2E2E8]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-[#0A1B2A]">
                {lang === "fr" ? "Autres prestataires" : "Other providers"} {otherPrestataires.length > 0 && `(${otherPrestataires.length})`}
              </h3>
                {selectedPrestataires.length > 0 && (
                  <span className="text-sm text-[#D4A657] font-semibold">
                    {lang === "fr" 
                      ? `${selectedPrestataires.length} sélectionné(s)` 
                      : `${selectedPrestataires.length} selected`}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280] mb-4">
                {lang === "fr" 
                  ? "Tous les prestataires actifs disponibles. Vous pouvez assigner même si la catégorie ne correspond pas exactement."
                  : "All active providers available. You can assign even if the category doesn't match exactly."}
              </p>
              {otherPrestataires.length === 0 ? (
                <div className="space-y-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700 font-medium">
                    {lang === "fr" 
                      ? "Aucun autre prestataire actif disponible."
                      : "No other active provider available."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {otherPrestataires.map((match) => {
                  // S'assurer que l'ID est un nombre
                  const prestataireId = typeof match.prestataire.id === 'string' 
                    ? parseInt(match.prestataire.id) 
                    : match.prestataire.id;
                  
                  return (
                    <div
                      key={prestataireId}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedPrestataires.includes(prestataireId)
                          ? "border-[#C8A55F] bg-[#FFF9EC]"
                          : "border-[#DDDDDD] hover:border-[#C8A55F] hover:bg-[#F9F9FB]"
                      }`}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        const inputTarget = target as HTMLInputElement;
                        if ((target.tagName === 'INPUT' && inputTarget.type === 'checkbox') || target.closest('input[type="checkbox"]')) {
                          return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedPrestataires((prev) => {
                          if (!prev.includes(prestataireId)) {
                            return [...prev, prestataireId];
                          }
                          return prev;
                        });
                      }}
                    >
                      <input
                        type="checkbox"
                        name={`prestataire-${prestataireId}`}
                        id={`prestataire-checkbox-${prestataireId}`}
                        value={prestataireId}
                        checked={selectedPrestataires.includes(prestataireId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const isChecked = e.target.checked;
                          setSelectedPrestataires((prev) => {
                            if (isChecked) {
                              if (!prev.includes(prestataireId)) {
                                return [...prev, prestataireId];
                              }
                              return prev;
                            } else {
                              return prev.filter((id) => id !== prestataireId);
                            }
                          });
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        className="mt-1 w-5 h-5 text-[#C8A657] border-2 border-[#DDDDDD] focus:ring-[#C8A657] focus:ring-2 cursor-pointer flex-shrink-0 rounded accent-[#C8A657]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-[#0A1B2A]">
                            {match.prestataire.nomEntreprise}
                          </p>
                          {match.prestataire.statut === "actif" && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                              {lang === "fr" ? "Actif" : "Active"}
                            </span>
                          )}
                          {match.prestataire.statut === "en_attente" && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              {lang === "fr" ? "En attente" : "Pending"}
                            </span>
                          )}
                        </div>
                        {match.prestataire.nomContact && (
                          <p className="text-sm text-[#6B7280] mb-1">
                            {match.prestataire.nomContact}
                          </p>
                        )}
                        {match.prestataire.email && (
                          <p className="text-xs text-[#6B7280] mb-1">
                            {match.prestataire.email}
                          </p>
                        )}
                        {match.prestataire.specialites && match.prestataire.specialites.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {match.prestataire.specialites.map((spec: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedPrestataires.includes(prestataireId) && (
                        <div className="flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-[#C8A657]" />
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
          </div>

          {/* Section de sélection des fichiers */}
          {demandeFiles.length > 0 && (
            <div className="pt-4 border-t border-[#E2E2E8]">
              <div className="bg-[#F9F9FB] border border-[#DDDDDD] rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-[#0A1B2A] mb-1">
                      {lang === "fr" ? "Partager les fichiers avec le prestataire" : "Share files with provider"}
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      {lang === "fr" 
                        ? `${demandeFiles.length} fichier(s) disponible(s) dans cette demande`
                        : `${demandeFiles.length} file(s) available in this request`}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareFiles}
                      onChange={(e) => {
                        setShareFiles(e.target.checked);
                        if (!e.target.checked) {
                          setShareMode("all");
                          setSelectedFiles([]);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#C8A55F]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C8A55F]"></div>
                  </label>
                </div>

                {shareFiles && (
                  <div className="space-y-3 pt-3 border-t border-[#E2E2E8]">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="shareMode"
                          value="all"
                          checked={shareMode === "all"}
                          onChange={(e) => {
                            setShareMode("all");
                            setSelectedFiles([]);
                          }}
                          className="w-4 h-4 text-[#C8A55F] border-2 border-[#DDDDDD] focus:ring-[#C8A55F] focus:ring-2"
                        />
                        <span className="text-sm font-medium text-[#0A1B2A]">
                          {lang === "fr" ? "Tout partager" : "Share all"}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="shareMode"
                          value="partial"
                          checked={shareMode === "partial"}
                          onChange={(e) => setShareMode("partial")}
                          className="w-4 h-4 text-[#C8A55F] border-2 border-[#DDDDDD] focus:ring-[#C8A55F] focus:ring-2"
                        />
                        <span className="text-sm font-medium text-[#0A1B2A]">
                          {lang === "fr" ? "Partiel" : "Partial"}
                        </span>
                      </label>
                    </div>

                    {shareMode === "partial" && (
                      <div className="bg-white border border-[#DDDDDD] rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                        {demandeFiles.map((file) => (
                          <label
                            key={file.id}
                            className="flex items-start gap-3 p-2 hover:bg-[#F9F9FB] rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFiles([...selectedFiles, file.id]);
                                } else {
                                  setSelectedFiles(selectedFiles.filter((id) => id !== file.id));
                                }
                              }}
                              className="mt-1 w-4 h-4 text-[#C8A55F] border-2 border-[#DDDDDD] rounded focus:ring-[#C8A55F] focus:ring-2"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0A1B2A] truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-[#6B7280]">
                                {file.type} • {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    {shareMode === "all" && (
                      <div className="bg-white border border-[#DDDDDD] rounded-lg p-3">
                        <p className="text-sm text-[#6B7280]">
                          {lang === "fr"
                            ? `Tous les ${demandeFiles.length} fichier(s) seront partagés avec le prestataire.`
                            : `All ${demandeFiles.length} file(s) will be shared with the provider.`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note informative */}
          <div className="pt-4 border-t border-[#E2E2E8]">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-1">
                {lang === "fr" ? "ℹ️ Information" : "ℹ️ Information"}
              </p>
              <p className="text-xs text-blue-700">
                {lang === "fr" 
                  ? "Le prestataire devra soumettre son estimation (prix fournisseur, délais, notes) après avoir analysé la demande. Vous pourrez ensuite générer le devis avec la marge LeBoy (15-20%)."
                  : "The provider will need to submit their estimation (supplier price, delays, notes) after analyzing the request. You will then be able to generate the quote with the LeBoy margin (15-20%)."}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#E2E2E8]">
            <button
              type="submit"
              disabled={selectedPrestataires.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0A1B2A] text-white text-sm font-semibold rounded-md hover:bg-[#07121e] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              {lang === "fr" 
                ? `Assigner ${selectedPrestataires.length > 0 ? `${selectedPrestataires.length} prestataire(s)` : 'les prestataires'}`
                : `Assign ${selectedPrestataires.length > 0 ? `${selectedPrestataires.length} provider(s)` : 'providers'}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#DDDDDD] text-[#4B4F58] text-sm font-semibold rounded-md hover:bg-[#F9F9FB] transition"
            >
              {lang === "fr" ? "Annuler" : "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}