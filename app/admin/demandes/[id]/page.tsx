"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "../../../components/LanguageProvider";
import BackToHomeLink from "../../../components/BackToHomeLink";
import {
  FileText,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  Send,
} from "lucide-react";
import Link from "next/link";
import type { DemandeICD } from "@/lib/demandesStore";
import { formatDateWithTimezones } from "@/lib/dateUtils";
import { MissionProgressBar } from "../../../components/MissionProgressBar";
import { MissionPhases } from "../../../components/MissionPhases";
import { MissionProofView } from "../../../components/MissionProofView";
import { MissionChat } from "../../../components/MissionChat";
import { ProviderEstimationView } from "../../../components/ProviderEstimationView";
import { AdminAdvancePaymentSection } from "../../../components/AdminAdvancePaymentSection";
import { AdminValidationSection } from "../../../components/AdminValidationSection";
import { AdminRatingSection } from "../../../components/AdminRatingSection";
import { DemandeAssignmentStatus } from "../DemandeAssignmentStatus";
import { PropositionsList } from "../../../components/PropositionsList";
import WinnerSelectionView from "../../../components/WinnerSelectionView";
import { ProviderActivityTracker } from "../../../components/ProviderActivityTracker";
import type { Mission } from "@/lib/types";

const TEXT = {
  fr: {
    title: "Détails de la demande",
    back: "Retour à la liste",
    loading: "Chargement...",
    error: "Erreur lors du chargement",
    informations: "Informations générales",
    contact: "Contact",
    service: "Service",
    description: "Description",
    lieu: "Lieu",
    budget: "Budget",
    urgence: "Urgence",
    dateReception: "Date de réception",
    assigner: "Assigner un prestataire",
    refuser: "Refuser la demande",
    demanderModification: "Demander une modification",
    confirmerRefus: "Refuser cette demande",
    confirmerModification: "Demander une modification",
    confirmerModificationDetail: "Veuillez indiquer au client ce qui doit être modifié dans sa demande. Ce message sera envoyé par email au client.",
    messageModificationLabel: "Message pour le client",
    messageModificationPlaceholder: "Exemple : Veuillez préciser le lieu exact de l'intervention. / La description de la situation nécessite plus de détails sur le contexte. / Merci d'ajouter des informations sur les documents disponibles.",
    messageModificationRequired: "Veuillez indiquer ce qui doit être modifié",
    envoyerModification: "Envoyer la demande de modification",
    envoiEnCoursModification: "Envoi en cours...",
    confirmerRefusDetail: "Veuillez expliquer au client pourquoi cette demande ne peut pas être traitée. Ce message sera envoyé par email au client.",
    raisonRejetLabel: "Raison du refus",
    raisonRejetPlaceholder: "Exemple : Cette demande sort du périmètre de nos services. / Cette demande nécessite des compétences que nous ne proposons pas actuellement. / Impossibilité d'intervenir dans ce cadre.",
    raisonRejetRequired: "Veuillez indiquer la raison du refus",
    envoyerRefus: "Envoyer le refus au client",
    envoiEnCours: "Envoi en cours...",
    supprimer: "Supprimer la demande",
    confirmerSuppression: "Êtes-vous sûr de vouloir supprimer cette demande ?",
    confirmerSuppressionDetail: "La demande sera déplacée dans la corbeille et pourra être restaurée pendant 30 jours.",
    prestataireAssigne: "Prestataire assigné",
    terminee: "Terminée",
    enAttente: "En attente d'assignation",
    documents: "Documents associés",
    aucunDocument: "Aucun document joint",
    normal: "Normal",
    urgent: "Urgent",
    tresUrgent: "Très urgent",
  },
  en: {
    title: "Request details",
    back: "Back to list",
    loading: "Loading...",
    error: "Error loading",
    informations: "General information",
    contact: "Contact",
    service: "Service",
    description: "Description",
    lieu: "Location",
    budget: "Budget",
    urgence: "Urgency",
    dateReception: "Reception date",
    assigner: "Assign provider",
    refuser: "Refuse request",
    demanderModification: "Request modification",
    confirmerRefus: "Refuse this request",
    confirmerModification: "Request modification",
    confirmerModificationDetail: "Please indicate to the client what needs to be modified in their request. This message will be sent by email to the client.",
    messageModificationLabel: "Message for client",
    messageModificationPlaceholder: "Example: Please specify the exact location of the intervention. / The situation description needs more details about the context. / Please add information about available documents.",
    messageModificationRequired: "Please indicate what needs to be modified",
    envoyerModification: "Send modification request",
    envoiEnCoursModification: "Sending...",
    confirmerRefusDetail: "Please explain to the client why this request cannot be processed. This message will be sent by email to the client.",
    raisonRejetLabel: "Rejection reason",
    raisonRejetPlaceholder: "Example: This request is outside our service scope. / This request requires skills we do not currently offer. / Unable to intervene in this framework.",
    raisonRejetRequired: "Please indicate the reason for rejection",
    envoyerRefus: "Send rejection to client",
    envoiEnCours: "Sending...",
    supprimer: "Delete request",
    confirmerSuppression: "Are you sure you want to delete this request?",
    confirmerSuppressionDetail: "The request will be moved to trash and can be restored for 30 days.",
    demandeRejetee: "Rejected request",
    rejeteeLe: "Rejected on",
    raisonRejet: "Rejection reason",
    prestataireAssigne: "Provider assigned",
    terminee: "Completed",
    enAttente: "Pending assignment",
    documents: "Associated documents",
    aucunDocument: "No documents attached",
    normal: "Normal",
    urgent: "Urgent",
    tresUrgent: "Very urgent",
  },
} as const;

const URGENCE_LABELS = {
  fr: {
    normal: "Normal",
    urgent: "Urgent",
    "tres-urgent": "Très urgent",
  },
  en: {
    normal: "Normal",
    urgent: "Urgent",
    "tres-urgent": "Very urgent",
  },
} as const;

const URGENCE_COLORS = {
  normal: "bg-blue-100 text-blue-800",
  urgent: "bg-orange-100 text-orange-800",
  "tres-urgent": "bg-red-100 text-red-800",
};

export default function AdminDemandeDetailPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const params = useParams();
  const router = useRouter();
  
  const idParam = params?.id;
  const id = idParam ? (Array.isArray(idParam) ? idParam[0] : idParam) : null; // UUID string (pas de parseInt)

  const [demande, setDemande] = useState<DemandeICD | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [otherPrestataires, setOtherPrestataires] = useState<any[]>([]);
  const [selectedPrestataires, setSelectedPrestataires] = useState<string[]>([]); // UUID strings maintenant
  const [demandeFiles, setDemandeFiles] = useState<any[]>([]);
  const [shareFiles, setShareFiles] = useState(false);
  const [shareMode, setShareMode] = useState<"all" | "partial">("all");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [chatMissionId, setChatMissionId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [modificationMessage, setModificationMessage] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRequestingModification, setIsRequestingModification] = useState(false);
  const [propositions, setPropositions] = useState<any[]>([]);

  // Fonction pour extraire la ville depuis une chaîne de lieu
  const extractVille = (lieu: string | null | undefined): string | null => {
    if (!lieu) return null;
    const villes = [
      "Yaoundé", "Douala", "Bafoussam", "Garoua", "Maroua",
      "Buea", "Bamenda", "Ebolowa", "Kribi", "Limbe",
      "Bazou", "Ogola", "Jauvence"
    ];
    for (const ville of villes) {
      if (lieu.toLowerCase().includes(ville.toLowerCase())) {
        return ville;
      }
    }
    return null;
  };

  useEffect(() => {
    // Récupérer l'email de l'utilisateur (admin)
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserEmail(data.user?.email || "");
        }
      } catch (err) {
        console.error("Erreur récupération utilisateur:", err);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchDemande() {
      if (!id || typeof id !== "string") {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/admin/demandes/${id}`, { cache: "no-store" });
        const data = await res.json();
        
        if (!res.ok) {
          console.error("Erreur API:", data.error);
          setLoading(false);
          return;
        }
        
        setDemande(data.demande);
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchMissions() {
      if (!id || typeof id !== "string") return;
      try {
        const res = await fetch(`/api/admin/demandes/${id}/missions`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setMissions(data.missions || []);
          
          // Marquer automatiquement les notifications liées à ces missions comme lues
          // Cela signifie que l'admin a pris note en visitant la page
          if (data.missions && data.missions.length > 0) {
            try {
              const notificationsRes = await fetch("/api/admin/notifications", { cache: "no-store" });
              if (notificationsRes.ok) {
                const notificationsData = await notificationsRes.json();
                const missionIds = data.missions.map((m: any) => m.id);
                
                // Trouver les notifications non lues liées à ces missions
                const unreadNotifications = (notificationsData.notifications || []).filter((n: any) => 
                  !n.read && 
                  n.missionId && 
                  missionIds.includes(n.missionId) &&
                  (n.type === "mission_taken_over" || 
                   n.type === "mission_started" || 
                   n.type === "mission_paid" || 
                   n.type === "mission_validation_submitted" ||
                   n.type === "mission_estimated")
                );
                
                // Marquer ces notifications comme lues
                for (const notif of unreadNotifications) {
                  await fetch(`/api/admin/notifications/${notif.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "mark_read" }),
                  });
                }
              }
            } catch (err) {
              console.error("Erreur marquage notifications:", err);
              // Ne pas bloquer le chargement si le marquage échoue
            }
          }
        }
      } catch (err) {
        console.error("Erreur chargement missions:", err);
      }
    }

    async function fetchPropositions() {
      if (!isNaN(id)) {
        try {
          const res = await fetch(`/api/admin/demandes/${id}/propositions`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setPropositions(data.propositions || []);
          }
        } catch (err) {
          console.error("Erreur chargement propositions:", err);
        }
      }
    }

    fetchDemande();
    fetchMissions();
    fetchPropositions();
  }, [id]);

  const handleResetComplete = async () => {
    if (!demande) return;
    
    if (!confirm(
      lang === "fr"
        ? "⚠️ ATTENTION : Cette action va supprimer COMPLÈTEMENT cette demande, toutes ses missions et toutes ses propositions. Cette action est IRRÉVERSIBLE. Êtes-vous sûr de vouloir continuer ?"
        : "⚠️ WARNING: This action will COMPLETELY delete this request, all its missions and all its propositions. This action is IRREVERSIBLE. Are you sure you want to continue?"
    )) {
      return;
    }

    // Double confirmation
    if (!confirm(
      lang === "fr"
        ? "Dernière confirmation : Supprimer définitivement tout et recommencer à zéro ?"
        : "Final confirmation: Permanently delete everything and start from scratch?"
    )) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/demandes/${demande.id}/reset-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          lang === "fr"
            ? `✅ Tout a été supprimé avec succès. Vous pouvez maintenant créer une nouvelle demande.`
            : `✅ Everything has been deleted successfully. You can now create a new request.`
        );
        window.location.href = "/admin/demandes";
      } else {
        alert(data.error || (lang === "fr" ? "Erreur lors de la suppression" : "Error deleting"));
      }
    } catch (error) {
      console.error("Erreur suppression complète:", error);
      alert(lang === "fr" ? "Erreur lors de la suppression" : "Error deleting");
    }
  };

  const handleResetDevis = async () => {
    if (!demande) return;
    
    if (!confirm(
      lang === "fr"
        ? "⚠️ Êtes-vous sûr de vouloir réinitialiser les devis générés pour cette demande ? Cette action remettra les missions à l'état d'estimation et permettra de sélectionner à nouveau un prestataire gagnant."
        : "⚠️ Are you sure you want to reset generated quotes for this request? This action will reset missions to estimation state and allow selecting a winning provider again."
    )) {
      return;
    }

    try {
      const res = await fetch("/api/admin/reset-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demandeId: demande.id }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          lang === "fr"
            ? `✅ ${data.missionsReset} mission(s) réinitialisée(s) avec succès. La page va se recharger.`
            : `✅ ${data.missionsReset} mission(s) reset successfully. The page will reload.`
        );
        window.location.reload();
      } else {
        alert(data.error || (lang === "fr" ? "Erreur lors de la réinitialisation" : "Error resetting"));
      }
    } catch (error) {
      console.error("Erreur réinitialisation devis:", error);
      alert(lang === "fr" ? "Erreur lors de la réinitialisation" : "Error resetting");
    }
  };

  const handleAssignClick = async () => {
    if (!demande) return;
    
    setSelectedPrestataires([]);
    setMatches([]);
    setOtherPrestataires([]);
    setShareFiles(false);
    setShareMode("all");
    setSelectedFiles([]);
    
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
        console.log("✅ Matches reçus:", data.matches?.length || 0);
        console.log("✅ Autres prestataires reçus:", data.otherPrestataires?.length || 0);
      } else {
        console.error("❌ Erreur API matching:", data.error);
        alert(data.error || "Erreur lors de la recherche de prestataires");
      }

      // Charger les fichiers de la demande
      const filesRes = await fetch(`/api/admin/demandes/${demande.id}/files`, {
        cache: "no-store",
      });
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setDemandeFiles(filesData.files || []);
      }
    } catch (err) {
      console.error("❌ Erreur matching:", err);
      alert("Erreur lors de la recherche de prestataires");
    }
    
    setShowAssignModal(true);
  };

  const handleCreateMission = async (prestataireIds: string[]) => { // UUID strings maintenant
    if (!demande) return;

    if (!prestataireIds || prestataireIds.length === 0) {
      alert(
        lang === "fr"
          ? "Veuillez sélectionner au moins un prestataire."
          : "Please select at least one provider."
      );
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

    try {
      // Créer toutes les missions en une seule requête
      const res = await fetch("/api/admin/missions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandeId: demande.id,
          prestataireIds: prestataireIds, // Envoyer tous les prestataires en une fois
          sharedFiles: sharedFilesData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowAssignModal(false);
        const count = data.count || prestataireIds.length;
        const errors = data.errors || [];
        alert(
          lang === "fr"
            ? `✅ ${count} mission(s) créée(s) avec succès${errors.length > 0 ? `, ${errors.length} erreur(s)` : ""} !\n${errors.length > 0 ? errors.join("\n") : ""}`
            : `✅ ${count} mission(s) created successfully${errors.length > 0 ? `, ${errors.length} error(s)` : ""}!\n${errors.length > 0 ? errors.join("\n") : ""}`
        );
        // Recharger les missions pour mettre à jour l'affichage
        const missionsRes = await fetch(`/api/admin/demandes/${demande.id}/missions`, { cache: "no-store" });
        if (missionsRes.ok) {
          const missionsData = await missionsRes.json();
          setMissions(missionsData.missions || []);
        }
      } else {
        alert(data.error || (lang === "fr" ? "Erreur lors de la création des missions" : "Error creating missions"));
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(lang === "fr" ? "Erreur lors de la création des missions" : "Error creating missions");
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

  if (!demande) {
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
              <p className="text-sm md:text-base text-[#4B4F58] mt-1">
                {demande.ref} - {demande.serviceType}
              </p>
            </div>
          </div>

          {/* Bouton de suppression complète - Toujours visible */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleResetComplete}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition"
              title={lang === "fr" ? "Supprimer complètement cette demande et recommencer à zéro" : "Completely delete this request and start from scratch"}
            >
              <Trash2 className="w-4 h-4" />
              {lang === "fr" ? "Tout supprimer et recommencer" : "Delete all and restart"}
            </button>
          </div>

          {/* Actions - Afficher seulement si aucune mission n'existe */}
          {missions.length === 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAssignClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A1B2A] text-white text-sm font-semibold rounded-md hover:bg-[#07121e] transition"
              >
                <UserPlus className="w-4 h-4" />
                {t.assigner}
              </button>
              <button
                onClick={() => {
                  setRejectReason("");
                  setShowRejectModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition"
              >
                <XCircle className="w-4 h-4" />
                {t.refuser}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-md hover:bg-orange-700 transition"
              >
                <Trash2 className="w-4 h-4" />
                {t.supprimer}
              </button>
            </div>
          )}

          {/* Statut d'assignation - Afficher si des missions existent */}
          {missions.length > 0 && (
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-4">
              <h3 className="font-heading text-sm font-semibold text-[#0A1B2A] mb-3">
                {lang === "fr" ? "Statut d'assignation" : "Assignment status"}
              </h3>
              <DemandeAssignmentStatus 
                demande={demande!} 
                missions={missions}
                onAssignClick={handleAssignClick}
                lang={lang}
                t={t}
              />
            </div>
          )}

          {/* Section Propositions - Masquer si un gagnant a déjà été sélectionné */}
          {demande && (() => {
            // Vérifier s'il y a une proposition acceptée (gagnant sélectionné)
            const hasAcceptedProposition = propositions.some(
              (p: any) => p.proposition?.statut === "acceptee"
            );
            
            // Afficher seulement s'il n'y a pas encore de gagnant sélectionné
            if (hasAcceptedProposition) {
              return null;
            }
            
            return (
              <PropositionsList
                demandeId={demande.id}
                onPropositionAccepted={() => {
                  // Recharger les missions après acceptation d'une proposition
                  fetch(`/api/admin/demandes/${demande.id}/missions`, { cache: "no-store" })
                    .then((res) => res.json())
                    .then((data) => setMissions(data.missions || []));
                }}
              />
            );
          })()}
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
                  <p className="text-xs text-[#6B7280] mb-1">{t.service}</p>
                  <p className="text-sm text-[#0A1B2A]">{demande.serviceType}</p>
                  {demande.serviceAutre && (
                    <p className="text-xs text-[#6B7280] mt-1">({demande.serviceAutre})</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">{t.urgence}</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      URGENCE_COLORS[demande.urgence as keyof typeof URGENCE_COLORS] || URGENCE_COLORS.normal
                    }`}
                  >
                    {URGENCE_LABELS[lang][demande.urgence as keyof typeof URGENCE_LABELS.fr] || demande.urgence}
                  </span>
                </div>
                {demande.lieu && (
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">{t.lieu}</p>
                    <p className="text-sm text-[#0A1B2A]">{demande.lieu}</p>
                  </div>
                )}
                {demande.budget && (
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">{t.budget}</p>
                    <p className="text-sm text-[#0A1B2A]">{demande.budget}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">{t.dateReception}</p>
                  <div className="space-y-1">
                    <p className="text-xs text-[#0A1B2A]">
                      🇨🇲 {formatDateWithTimezones(demande.createdAt).cameroon}
                    </p>
                    <p className="text-xs text-[#0A1B2A]">
                      🇨🇦 {formatDateWithTimezones(demande.createdAt).canada}
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
                    {lang === "fr" ? "Nom complet" : "Full name"}
                  </p>
                  <p className="text-sm font-medium text-[#0A1B2A]">{demande.fullName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#6B7280]" />
                  <a
                    href={`mailto:${demande.email}`}
                    className="text-sm text-[#0A1B2A] hover:underline"
                  >
                    {demande.email}
                  </a>
                  {currentUserEmail && (() => {
                    // Trouver une mission pour cette demande pour le chat
                    const missionForChat = missions.find(m => m.demandeId === demande?.id);
                    if (!missionForChat) return null;
                    return (
                      <button
                        onClick={() => setChatMissionId(missionForChat.id)}
                        className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-[#C8A55F] text-white text-xs font-semibold rounded-md hover:bg-[#B8944F] transition"
                        title={lang === "fr" ? "Écrire au client" : "Write to client"}
                      >
                        <Send className="w-3 h-3" />
                        {lang === "fr" ? "Chat" : "Chat"}
                      </button>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#6B7280]" />
                  <a
                    href={`tel:${demande.phone}`}
                    className="text-sm text-[#0A1B2A] hover:underline"
                  >
                    {demande.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
                {t.description}
              </h2>
              <p className="text-sm text-[#4B4F58] whitespace-pre-wrap">
                {demande.description}
              </p>
            </div>

            {/* Documents (à implémenter plus tard) */}
            <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-4">
                {t.documents}
              </h2>
              <p className="text-sm text-[#6B7280]">{t.aucunDocument}</p>
            </div>

            {/* Missions et progression */}
            {missions.length > 0 && (() => {
              // Missions avec estimations
              const missionsWithEstimations = missions.filter(
                (m) => m.internalState === "PROVIDER_ESTIMATED" && m.estimationPartenaire
              );
              
              // Vérifier s'il y a un prestataire gagnant (proposition acceptée)
              const winningProposition = propositions.find(
                (p: any) => p.proposition?.statut === "acceptee"
              );
              
              // Mission gagnante si elle existe
              let winningMission: Mission | null = null;
              if (winningProposition && winningProposition.proposition?.prestataireId) {
                winningMission = missions.find(
                  (m) => m.prestataireId === winningProposition.proposition.prestataireId &&
                         m.internalState === "PROVIDER_ESTIMATED"
                ) || null;
              }
              
              // Vérifier si un devis a déjà été généré pour une mission de cette demande
              const devisGenere = missions.some((m) => m.devisGenere);
              
              // Si plusieurs estimations et pas de gagnant, afficher la sélection
              // MAIS seulement si aucun devis n'a été généré
              const needsWinnerSelection = missionsWithEstimations.length > 1 && !winningMission && !devisGenere;
              
              // Vérifier si un devis a été généré (en dehors de la fonction pour l'utiliser dans le bouton)
              const hasDevisGenere = missions.some((m) => m.devisGenere);
              
              return (
                <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading text-lg font-semibold text-[#0A1B2A]">
                      {lang === "fr" ? "Missions assignées" : "Assigned missions"}
                    </h2>
                    {hasDevisGenere && (
                      <button
                        onClick={handleResetDevis}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-md hover:bg-orange-600 transition"
                        title={lang === "fr" ? "Réinitialiser les devis générés" : "Reset generated quotes"}
                      >
                        <XCircle className="w-3 h-3" />
                        {lang === "fr" ? "Réinitialiser devis" : "Reset quotes"}
                      </button>
                    )}
                  </div>
                  
                  {/* Sélection du prestataire gagnant - Masquer si un devis a été généré */}
                  {needsWinnerSelection && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <WinnerSelectionView
                        missions={missionsWithEstimations}
                        demandeId={demande?.id || ""}
                        lang={lang}
                        onWinnerSelected={async () => {
                          // Recharger les missions et propositions
                          const res = await fetch(`/api/admin/demandes/${demande?.id}/missions`, {
                            cache: "no-store",
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setMissions(data.missions || []);
                          }
                          const propRes = await fetch(`/api/admin/demandes/${demande?.id}/propositions`, {
                            cache: "no-store",
                          });
                          if (propRes.ok) {
                            const propData = await propRes.json();
                            setPropositions(propData.propositions || []);
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Afficher les missions */}
                  {missions
                    .filter((mission: Mission) => {
                      // Exclure TOUJOURS les missions archivées ou supprimées (priorité absolue)
                      if (mission.archived || mission.deleted) {
                        return false;
                      }
                      
                      // Si un gagnant a été sélectionné, masquer toutes les missions non gagnantes
                      // Les missions non gagnantes sont archivées, donc déjà filtrées ci-dessus
                      // Mais on double-vérifie pour éviter toute confusion
                      if (winningMission) {
                        // Si c'est une mission avec estimation, ne montrer que la gagnante
                        if (mission.internalState === "PROVIDER_ESTIMATED") {
                          return mission.id === winningMission.id;
                        }
                        // Afficher les autres missions qui ne sont pas en PROVIDER_ESTIMATED (missions en cours, etc.)
                        return true;
                      }
                      // Si on attend la sélection (plusieurs estimations), masquer toutes les missions avec estimations (elles seront dans WinnerSelectionView)
                      // IMPORTANT: Ne masquer QUE si on attend vraiment la sélection (plusieurs estimations)
                      // Si une seule estimation existe, on doit quand même afficher toutes les missions assignées
                      if (needsWinnerSelection && mission.internalState === "PROVIDER_ESTIMATED") {
                        return false;
                      }
                      // Si une seule estimation existe, afficher toutes les missions (y compris celle avec estimation)
                      // Cela permet de voir la mission avec estimation ET les missions en attente d'estimation
                      if (missionsWithEstimations.length === 1 && mission.internalState === "PROVIDER_ESTIMATED") {
                        // Afficher la mission avec estimation même si une seule existe
                        return true;
                      }
                      // Sinon, afficher toutes les missions non archivées
                      return true;
                    })
                    .map((mission: Mission) => {
                      // Vérifier si c'est la mission gagnante
                      const isWinningMission = winningMission && mission.id === winningMission.id;
                      
                      return (
                  <div key={mission.id} className="border border-[#E2E2E8] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-[#0A1B2A]">{mission.ref}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-[#6B7280]">
                            {mission.prestataireRef || "Prestataire non assigné"}
                          </p>
                          {(mission.prestataireNomEntreprise || mission.prestataireNomContact) && (
                            <span className="text-xs text-[#4B5563] font-medium">
                              • {(mission as any).prestataireNomEntreprise || (mission as any).prestataireNomContact}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const state = mission.internalState || "CREATED";
                          let colorClass = "bg-blue-100 text-blue-800";
                          if (state === "ADMIN_CONFIRMED" || state === "COMPLETED" || mission.status === "termine_icd_canada" || mission.status === "cloture") {
                            colorClass = "bg-green-100 text-green-800";
                          } else if (state === "CREATED" || state === "ASSIGNED_TO_PROVIDER" || state === "PROVIDER_ESTIMATED") {
                            colorClass = "bg-yellow-100 text-yellow-800";
                          }
                          return (
                            <span className={`text-xs px-2 py-1 rounded-full ${colorClass} font-semibold`}>
                              {mission.status}
                            </span>
                          );
                        })()}
                        <button
                          onClick={async () => {
                            if (confirm(lang === "fr" ? "Archiver cette mission ?" : "Archive this mission?")) {
                              try {
                                const res = await fetch(`/api/admin/missions/${mission.id}/archive`, {
                                  method: "POST",
                                });
                                if (res.ok) {
                                  alert(lang === "fr" ? "✅ Mission archivée avec succès" : "✅ Mission archived successfully");
                                  window.location.reload();
                                } else {
                                  alert(lang === "fr" ? "❌ Erreur lors de l'archivage" : "❌ Error archiving");
                                }
                              } catch (error) {
                                console.error("Erreur archivage:", error);
                                alert(lang === "fr" ? "❌ Erreur lors de l'archivage" : "❌ Error archiving");
                              }
                            }
                          }}
                          className="text-xs px-2 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition"
                          title={lang === "fr" ? "Archiver" : "Archive"}
                        >
                          {lang === "fr" ? "Archiver" : "Archive"}
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(lang === "fr" ? "Supprimer cette mission ? Cette action est irréversible." : "Delete this mission? This action is irreversible.")) {
                              try {
                                const res = await fetch(`/api/admin/missions/${mission.id}/archive`, {
                                  method: "DELETE",
                                });
                                if (res.ok) {
                                  alert(lang === "fr" ? "✅ Mission supprimée avec succès" : "✅ Mission deleted successfully");
                                  window.location.reload();
                                } else {
                                  alert(lang === "fr" ? "❌ Erreur lors de la suppression" : "❌ Error deleting");
                                }
                              } catch (error) {
                                console.error("Erreur suppression:", error);
                                alert(lang === "fr" ? "❌ Erreur lors de la suppression" : "❌ Error deleting");
                              }
                            }
                          }}
                          className="text-xs px-2 py-1 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition"
                          title={lang === "fr" ? "Supprimer" : "Delete"}
                        >
                          {lang === "fr" ? "Supprimer" : "Delete"}
                        </button>
                      </div>
                    </div>

                    {/* Barre de progression compacte */}
                    <MissionProgressBar mission={mission} lang={lang} compact={true} />

                    {/* Suivi des actions du prestataire - Afficher pour les missions en cours ou après prise en charge */}
                    {(mission.internalState === "ADVANCE_SENT" || 
                      mission.internalState === "IN_PROGRESS" || 
                      mission.internalState === "PROVIDER_VALIDATION_SUBMITTED") && (
                      <div className="pt-4 border-t border-[#E2E2E8]">
                        <ProviderActivityTracker
                          mission={mission}
                          lang={lang}
                          onRefresh={async () => {
                            // Recharger les missions pour mettre à jour le suivi
                            const res = await fetch(`/api/admin/demandes/${demande?.id}/missions`, {
                              cache: "no-store",
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setMissions(data.missions || []);
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Affichage de l'estimation du prestataire et application des frais LeBoy */}
                    {/* Afficher uniquement si c'est la mission gagnante OU s'il n'y a qu'une seule estimation */}
                    {/* ET seulement si le devis n'a pas encore été généré */}
                    {mission.internalState === "PROVIDER_ESTIMATED" && 
                     !mission.devisGenere &&
                     (isWinningMission || missionsWithEstimations.length === 1) && (
                      <div className="pt-2 border-t border-[#E2E2E8]">
                        <ProviderEstimationView
                          mission={mission}
                          lang={lang}
                          onDevisGenerated={async () => {
                            // Recharger les missions après génération du devis
                            const res = await fetch(`/api/admin/demandes/${demande?.id}/missions`, {
                              cache: "no-store",
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setMissions(data.missions || []);
                              // La section d'estimation se masquera automatiquement car mission.devisGenere sera true
                            }
                            // Recharger aussi les propositions
                            const propRes = await fetch(`/api/admin/demandes/${demande?.id}/propositions`, {
                              cache: "no-store",
                            });
                            if (propRes.ok) {
                              const propData = await propRes.json();
                              setPropositions(propData.propositions || []);
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Section d'envoi de l'avance de 50% au prestataire */}
                    {mission.internalState === "PAID_WAITING_TAKEOVER" && (
                      <div className="pt-2 border-t border-[#E2E2E8]">
                        <AdminAdvancePaymentSection
                          mission={mission}
                          lang={lang}
                          onAdvanceSent={async () => {
                            // Recharger les missions après envoi de l'avance
                            const res = await fetch(`/api/admin/demandes/${demande?.id}/missions`, {
                              cache: "no-store",
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setMissions(data.missions || []);
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Phases d'exécution */}
                    {mission.status === "en_cours_partenaire" && mission.phases && mission.phases.length > 0 && (
                      <div className="pt-2 border-t border-[#E2E2E8]">
                        <MissionPhases
                          mission={mission}
                          currentUserRole="admin"
                          lang={lang}
                        />
                      </div>
                    )}

                    {/* Section de validation des preuves et paiement du solde */}
                    {(mission.internalState === "PROVIDER_VALIDATION_SUBMITTED" || 
                      mission.internalState === "ADMIN_CONFIRMED" || 
                      (mission.internalState === "COMPLETED" && mission.soldeVersee)) && (
                      <div className="pt-2 border-t border-[#E2E2E8]">
                        <AdminValidationSection
                          mission={mission}
                          lang={lang}
                          onValidationChange={async () => {
                            // Recharger les missions
                            const res = await fetch(`/api/admin/demandes/${demande?.id}/missions`, {
                              cache: "no-store",
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setMissions(data.missions || []);
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Preuves de validation */}
                    {(mission.internalState === "PROVIDER_VALIDATION_SUBMITTED" || 
                      mission.internalState === "ADMIN_CONFIRMED" || 
                      mission.status === "termine_icd_canada" || 
                      mission.status === "cloture") && (
                      <div className="pt-2 border-t border-[#E2E2E8]">
                        <MissionProofView
                          missionId={mission.id}
                          userRole="admin"
                          lang={lang}
                          onValidationChange={async () => {
                            // Recharger les missions
                            const res = await fetch(`/api/admin/demandes/${demande?.id}/missions`, {
                              cache: "no-store",
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setMissions(data.missions || []);
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Chat/Communication */}
                    {currentUserEmail && (
                      <div className="pt-2 border-t border-[#E2E2E8]">
                        <MissionChat
                          mission={mission}
                          currentUserEmail={currentUserEmail}
                          currentUserRole="admin"
                          lang={lang}
                          initialRecipient={
                            chatMissionId === mission.id 
                              ? "client" // Si ouvert depuis coordonnées, destinataire = client
                              : (mission.prestataireId ? "prestataire" : "client")
                          }
                          autoOpen={chatMissionId === mission.id}
                          onClose={() => {
                            if (chatMissionId === mission.id) {
                              setChatMissionId(null);
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Section de notation du prestataire par l'admin */}
                    {(mission.internalState === "ADMIN_CONFIRMED" || mission.internalState === "COMPLETED") && mission.soldeVersee && (
                      <div className="pt-2 border-t border-[#E2E2E8]">
                        <AdminRatingSection
                          mission={mission}
                          lang={lang}
                          onRatingSubmitted={async () => {
                            // Recharger les missions
                            const res = await fetch(`/api/admin/demandes/${demande?.id}/missions`, {
                              cache: "no-store",
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setMissions(data.missions || []);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Modal d'assignation */}
      {showAssignModal && demande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E2E2E8]">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-[#0A1B2A]">
                  {lang === "fr" ? "Assigner des prestataires" : "Assign providers"}
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-[#6B7280] hover:text-[#0A1B2A] text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-[#6B7280] mt-1">
                {lang === "fr" ? "Demande" : "Request"} : {demande.ref} - {demande.serviceType}
              </p>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-1">
                  {lang === "fr" ? "🔍 Critères de filtrage appliqués :" : "🔍 Applied filtering criteria:"}
                </p>
                <ul className="text-xs text-blue-700 space-y-0.5">
                  <li>• {lang === "fr" ? "Catégorie de service" : "Service category"}: <strong>{demande.serviceType}</strong></li>
                  {demande.lieu && (
                    <li>• {lang === "fr" ? "Ville" : "City"}: <strong>{extractVille(demande.lieu) || demande.lieu}</strong></li>
                  )}
                  {demande.country && (
                    <li>• {lang === "fr" ? "Pays" : "Country"}: <strong>{demande.country}</strong></li>
                  )}
                </ul>
                <p className="text-xs text-blue-600 mt-2 italic">
                  {lang === "fr" 
                    ? "Seuls les prestataires correspondant à tous ces critères sont affichés." 
                    : "Only providers matching all these criteria are displayed."}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedPrestataires.length === 0) {
                  alert(
                    lang === "fr"
                      ? "Veuillez sélectionner au moins un prestataire"
                      : "Please select at least one provider"
                  );
                  return;
                }
                handleCreateMission(selectedPrestataires);
              }}
              className="p-6 space-y-6"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-[#0A1B2A]">
                    {lang === "fr" ? "Prestataires suggérés" : "Suggested providers"}{" "}
                    {matches.length > 0 && `(${matches.length})`}
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
                      const prestataireId = typeof match.prestataire.id === "string" 
                        ? match.prestataire.id 
                        : String(match.prestataire.id); // UUID string directement

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
                            // Si le clic est directement sur la checkbox ou son label, ne rien faire ici
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
                              // Permettre la sélection ET la désélection via la checkbox
                              const isChecked = e.target.checked;
                              setSelectedPrestataires((prev) => {
                                if (isChecked) {
                                  // Ajouter si pas déjà présent
                                  if (!prev.includes(prestataireId)) {
                                    return [...prev, prestataireId];
                                  }
                                  return prev;
                                } else {
                                  // Retirer si présent
                                  return prev.filter((id) => id !== prestataireId);
                                }
                              });
                            }}
                            onClick={(e) => {
                              // Empêcher la propagation pour que le onClick de la div ne s'exécute pas
                              e.stopPropagation();
                            }}
                            onMouseDown={(e) => {
                              // Empêcher aussi le mousedown pour éviter les conflits
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
                            <div className="flex items-center gap-3 text-xs text-[#6B7280] mt-1">
                              <span>{match.prestataire.ville || "Ville non disponible"}</span>
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
                            {match.score !== undefined && (
                              <p className="text-xs text-[#6B7280] mt-1">
                                {lang === "fr" ? "Score" : "Score"}: {match.score}{" "}
                                {match.reasons && match.reasons.length > 0 && `• ${match.reasons.slice(0, 2).join(", ")}`}
                              </p>
                            )}
                          </div>
                          {selectedPrestataires.includes(prestataireId) && (
                            <div className="flex-shrink-0">
                              <CheckCircle2 className="w-5 h-5 text-[#C8A55F]" />
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
                      const prestataireId = typeof match.prestataire.id === "string" 
                        ? match.prestataire.id 
                        : String(match.prestataire.id); // UUID string directement

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
                            id={`prestataire-checkbox-other-${prestataireId}`}
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
                      ? "Le prestataire devra soumettre son estimation (prix fournisseur, délais, notes) après avoir analysé la demande. Vous pourrez ensuite générer le devis avec la marge LeBoy."
                      : "The provider will need to submit their estimation (supplier price, delays, notes) after analyzing the request. You will then be able to generate the quote with the LeBoy margin."}
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
                    ? `Assigner ${selectedPrestataires.length > 0 ? `(${selectedPrestataires.length})` : ""} prestataire(s)` 
                    : `Assign ${selectedPrestataires.length > 0 ? `(${selectedPrestataires.length})` : ""} provider(s)`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-[#DDDDDD] text-[#4B4F58] text-sm font-semibold rounded-md hover:bg-[#F9F9FB] transition"
                >
                  {lang === "fr" ? "Annuler" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de refus */}
      {showRejectModal && demande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A]">
                {t.confirmerRefus}
              </h2>
            </div>
            <p className="text-sm text-[#4B4F58] mb-4">
              {t.confirmerRefusDetail}
            </p>
            <div className="mb-4">
              <label htmlFor="rejectReason" className="block text-sm font-medium text-[#0A1B2A] mb-2">
                {t.raisonRejetLabel} <span className="text-red-600">*</span>
              </label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t.raisonRejetPlaceholder}
                rows={5}
                className="w-full px-3 py-2 border border-[#DDDDDD] rounded-md text-sm text-[#0A1B2A] placeholder:text-[#9CA3AF] outline-none focus:border-[#0A1B2A] focus:ring-1 focus:ring-[#0A1B2A] resize-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                disabled={isRejecting}
                className="flex-1 px-4 py-2 border border-[#DDDDDD] text-[#4B4F58] text-sm font-semibold rounded-md hover:bg-[#F9F9FB] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    alert(t.raisonRejetRequired);
                    return;
                  }

                  setIsRejecting(true);
                  try {
                    const res = await fetch(`/api/admin/demandes/${demande.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        action: "rejeter",
                        raisonRejet: rejectReason.trim()
                      }),
                    });

                    const data = await res.json();

                    if (res.ok) {
                      alert(lang === "fr" ? "✅ Demande rejetée avec succès. Le client a été notifié par email." : "✅ Request rejected successfully. The client has been notified by email.");
                      setShowRejectModal(false);
                      setRejectReason("");
                      window.location.reload();
                    } else {
                      alert(data.error || (lang === "fr" ? "❌ Erreur lors du rejet" : "❌ Error rejecting"));
                    }
                  } catch (error) {
                    console.error("Erreur rejet:", error);
                    alert(lang === "fr" ? "❌ Erreur lors du rejet" : "❌ Error rejecting");
                  } finally {
                    setIsRejecting(false);
                  }
                }}
                disabled={isRejecting || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRejecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.envoiEnCours}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    {t.envoyerRefus}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && demande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h2 className="font-heading text-lg font-semibold text-[#0A1B2A]">
                {t.confirmerSuppression}
              </h2>
            </div>
            <p className="text-sm text-[#4B4F58] mb-6">
              {t.confirmerSuppressionDetail}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-[#DDDDDD] text-[#4B4F58] text-sm font-semibold rounded-md hover:bg-[#F9F9FB] transition"
              >
                {lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button
                onClick={async () => {
                  if (!demande) return;
                  try {
                    const res = await fetch(`/api/admin/demandes/${demande.id}`, {
                      method: "DELETE",
                    });

                    const data = await res.json();

                    if (res.ok) {
                      alert(lang === "fr" ? "✅ Demande supprimée avec succès" : "✅ Request deleted successfully");
                      router.push("/admin/demandes");
                    } else {
                      alert(data.error || (lang === "fr" ? "❌ Erreur lors de la suppression" : "❌ Error deleting"));
                    }
                  } catch (error) {
                    console.error("Erreur suppression:", error);
                    alert(lang === "fr" ? "❌ Erreur lors de la suppression" : "❌ Error deleting");
                  }
                }}
                className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-md hover:bg-orange-700 transition"
              >
                {lang === "fr" ? "Confirmer" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
