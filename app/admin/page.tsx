"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { Building2, FileText, Users, TrendingUp, DollarSign, AlertCircle, Bell, X, User, Database, Settings } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "./_components/AdminPageHeader";

const TEXT = {
  fr: {
    title: "Tableau de bord LeBoy",
    subtitle: "Coordination et gestion des prestataires",
    statsDemandes: "Demandes totales",
    statsPrestataires: "Prestataires actifs",
    statsEnAttente: "En attente de validation",
    statsEntreprises: "Entreprises",
    statsFreelances: "Freelances",
    repartitionType: "Répartition par type",
    viewDemandes: "Voir les demandes",
    viewPrestataires: "Gérer les prestataires",
    financeTitle: "Finance & Comptabilité",
    unauthorized: "Accès non autorisé",
    unauthorizedText: "Cette page est réservée aux administrateurs LeBoy.",
    actionsEnAttente: "action(s) en attente",
    prestatairesEnAttente: "prestataire(s) en attente de validation",
    diagnosticDB: "Diagnostic Base de données",
    diagnosticDBDesc: "Vérifier l'état de la base de données et des migrations",
  },
  en: {
    title: "LeBoy Dashboard",
    subtitle: "Coordination and provider management",
    statsDemandes: "Total requests",
    statsPrestataires: "Active providers",
    statsEnAttente: "Pending validation",
    statsEntreprises: "Companies",
    statsFreelances: "Freelances",
    repartitionType: "Distribution by type",
    viewDemandes: "View requests",
    viewPrestataires: "Manage providers",
    financeTitle: "Finance & Accounting",
    unauthorized: "Unauthorized access",
    unauthorizedText: "This page is reserved for LeBoy administrators.",
    actionsEnAttente: "action(s) pending",
    prestatairesEnAttente: "provider(s) pending validation",
    diagnosticDB: "Database Diagnostic",
    diagnosticDBDesc: "Check database status and migrations",
  },
} as const;

export default function AdminPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [stats, setStats] = useState({
    demandes: 0,
    prestataires: 0,
    enAttente: 0,
    entreprises: 0,
    freelances: 0,
  });
  const [pendingActions, setPendingActions] = useState({
    demandes: 0,
    prestataires: 0,
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [resDemandes, resPrestataires, resPendingActions, resNotifications] = await Promise.all([
          fetch("/api/demandes", { cache: "no-store" }),
          fetch("/api/prestataires", { cache: "no-store" }),
          fetch("/api/admin/pending-actions", { cache: "no-store" }),
          fetch("/api/admin/notifications?unread=true", { cache: "no-store" }),
        ]);

        const dataDemandes = resDemandes.ok
          ? await resDemandes.json()
          : { demandes: [] };

        const dataPrestataires = resPrestataires.ok
          ? await resPrestataires.json()
          : { prestataires: [], stats: { actifs: 0, enAttente: 0 } };
        
        // Calculer les statistiques par type
        const prestatairesList = dataPrestataires.prestataires || [];
        const entreprises = prestatairesList.filter((p: any) => 
          (p.typePrestataire || "freelance") === "entreprise" && 
          p.statut === "actif" && 
          !p.deletedAt
        ).length;
        const freelances = prestatairesList.filter((p: any) => 
          (p.typePrestataire || "freelance") === "freelance" && 
          p.statut === "actif" && 
          !p.deletedAt
        ).length;

        const dataPendingActions = resPendingActions.ok
          ? await resPendingActions.json()
          : { demandes: 0, prestataires: 0 };

        const dataNotifications = resNotifications.ok
          ? await resNotifications.json()
          : { notifications: [], unreadCount: 0 };

        setStats({
          demandes: dataDemandes.demandes?.length || 0,
          prestataires: dataPrestataires.stats?.actifs || 0,
          enAttente: dataPrestataires.stats?.enAttente || 0,
          entreprises,
          freelances,
        });

        setPendingActions({
          demandes: dataPendingActions.demandes || 0,
          prestataires: dataPendingActions.prestataires || 0,
        });

        setNotifications(dataNotifications.notifications || []);
        setUnreadCount(dataNotifications.unreadCount || 0);
      } catch (err) {
        console.error("Erreur chargement stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    
    // Recharger les stats toutes les 30 secondes pour mettre à jour les alertes
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const res = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      });
      if (res.ok) {
        // Recharger les notifications et les actions en attente
        const [resNotifications, resPendingActions] = await Promise.all([
          fetch("/api/admin/notifications?unread=true", { cache: "no-store" }),
          fetch("/api/admin/pending-actions", { cache: "no-store" }),
        ]);
        
        if (resNotifications.ok) {
          const data = await resNotifications.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
        
        if (resPendingActions.ok) {
          const dataPendingActions = await resPendingActions.json();
          setPendingActions({
            demandes: dataPendingActions.demandes || 0,
            prestataires: dataPendingActions.prestataires || 0,
          });
        }
      }
    } catch (error) {
      console.error("Erreur marquage notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications([]);
        
        // Recharger les actions en attente car certaines alertes peuvent disparaître
        const resPendingActions = await fetch("/api/admin/pending-actions", { cache: "no-store" });
        if (resPendingActions.ok) {
          const dataPendingActions = await resPendingActions.json();
          setPendingActions({
            demandes: dataPendingActions.demandes || 0,
            prestataires: dataPendingActions.prestataires || 0,
          });
        }
      }
    } catch (error) {
      console.error("Erreur marquage toutes notifications:", error);
    }
  };

  // Pour l'instant, pas de vérification d'auth réelle
  // TODO: Ajouter la vérification d'authentification admin

  return (
    <div className="bg-gray-50 min-h-screen">
      <AdminPageHeader
        title={t.title}
        description={t.subtitle}
        actions={
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#DDDDDD] rounded-md hover:bg-[#F2F2F5] transition"
            >
              <Bell className="w-5 h-5 text-[#0A1B2A]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            
            {/* Panneau de notifications */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-[#DDDDDD] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-[#DDDDDD] flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-[#0A1B2A]">
                    {lang === "fr" ? "Notifications" : "Notifications"}
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-[#D4A657] hover:text-[#B8944F] font-semibold"
                      >
                        {lang === "fr" ? "Tout marquer comme lu" : "Mark all as read"}
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[#6B7280] hover:text-[#0A1B2A]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-[#E2E2E8]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[#6B7280]">
                      {lang === "fr" ? "Aucune notification" : "No notifications"}
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-[#F2F2F5] transition cursor-pointer ${
                          !notif.read ? "bg-blue-50/50" : ""
                        }`}
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-[#0A1B2A]">
                              {notif.title}
                            </p>
                            <p className="text-xs text-[#6B7280] mt-1">
                              {notif.message}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-1">
                              {new Date(notif.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#4B4F58]">{t.statsDemandes}</p>
              <FileText className="w-5 h-5 text-[#D4A657]" />
            </div>
            <p className="text-2xl font-semibold text-[#0A1B2A]">
              {loading ? "..." : stats.demandes}
            </p>
          </div>

          <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#4B4F58]">{t.statsPrestataires}</p>
              <Users className="w-5 h-5 text-[#D4A657]" />
            </div>
            <p className="text-2xl font-semibold text-[#0A1B2A]">
              {loading ? "..." : stats.prestataires}
            </p>
          </div>

          <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#4B4F58]">{t.statsEnAttente}</p>
              <TrendingUp className="w-5 h-5 text-[#D4A657]" />
            </div>
            <p className="text-2xl font-semibold text-[#0A1B2A]">
              {loading ? "..." : stats.enAttente}
            </p>
          </div>
        </div>


        {/* Actions rapides */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/admin/demandes"
            className={`relative bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all ${
              pendingActions.demandes > 0 
                ? "border-red-400 bg-gradient-to-br from-red-50/50 to-red-100/30 shadow-lg shadow-red-200/50" 
                : "border-[#DDDDDD] hover:border-[#D4A657]"
            }`}
          >
            {pendingActions.demandes > 0 && (
              <>
                {/* Badge principal avec nombre */}
                <div className="absolute -top-2 -right-2 flex items-center justify-center min-w-[28px] h-7 px-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50 z-10">
                  <span className="text-white text-xs font-bold">{pendingActions.demandes}</span>
                </div>
                {/* Effet ping animé */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                {/* Bandeau "Action en attente" en haut */}
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-t-xl flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  <span>Action en attente</span>
                </div>
              </>
            )}
            <div className={`flex items-center gap-4 ${pendingActions.demandes > 0 ? 'pt-8' : ''}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                pendingActions.demandes > 0 
                  ? "bg-red-100 border-2 border-red-500 shadow-lg shadow-red-300/50 animate-pulse" 
                  : "bg-[#0A1B2A]"
              }`}>
                {pendingActions.demandes > 0 ? (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                ) : (
                  <FileText className="w-6 h-6 text-[#D4A657]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-heading font-semibold text-base ${
                    pendingActions.demandes > 0 ? "text-red-700" : "text-[#0A1B2A]"
                  }`}>
                    {t.viewDemandes}
                  </h3>
                  {pendingActions.demandes > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-500 text-white shadow-md">
                      ⚠ {pendingActions.demandes} {pendingActions.demandes === 1 ? 'action' : 'actions'}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1.5 ${
                  pendingActions.demandes > 0 ? "text-red-700 font-semibold" : "text-[#6B7280]"
                }`}>
                  {pendingActions.demandes > 0 
                    ? `Attention requise : ${pendingActions.demandes} ${pendingActions.demandes === 1 ? 'demande nécessite' : 'demandes nécessitent'} votre intervention`
                    : lang === "fr" ? "Analyser et assigner des prestataires" : "Analyze and assign providers"}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/prestataires"
            className={`relative bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all ${
              pendingActions.prestataires > 0 
                ? "border-red-400 bg-gradient-to-br from-red-50/50 to-red-100/30 shadow-lg shadow-red-200/50" 
                : "border-[#DDDDDD] hover:border-[#D4A657]"
            }`}
          >
            {pendingActions.prestataires > 0 && (
              <>
                {/* Badge principal avec nombre */}
                <div className="absolute -top-2 -right-2 flex items-center justify-center min-w-[28px] h-7 px-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50 z-10">
                  <span className="text-white text-xs font-bold">{pendingActions.prestataires}</span>
                </div>
                {/* Effet ping animé */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                {/* Bandeau "Action en attente" en haut */}
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-t-xl flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3 h-3" />
                  <span>Action en attente</span>
                </div>
              </>
            )}
            <div className={`flex items-center gap-4 ${pendingActions.prestataires > 0 ? 'pt-8' : ''}`}>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                pendingActions.prestataires > 0 
                  ? "bg-red-100 border-2 border-red-500 shadow-lg shadow-red-300/50 animate-pulse" 
                  : "bg-[#0A1B2A]"
              }`}>
                {pendingActions.prestataires > 0 ? (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                ) : (
                  <Building2 className="w-6 h-6 text-[#D4A657]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-heading font-semibold text-base ${
                    pendingActions.prestataires > 0 ? "text-red-700" : "text-[#0A1B2A]"
                  }`}>
                    {t.viewPrestataires}
                  </h3>
                  {pendingActions.prestataires > 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-500 text-white shadow-md">
                      ⚠ {pendingActions.prestataires} {pendingActions.prestataires === 1 ? 'prestataire' : 'prestataires'}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1.5 ${
                  pendingActions.prestataires > 0 ? "text-red-700 font-semibold" : "text-[#6B7280]"
                }`}>
                  {pendingActions.prestataires > 0 
                    ? `Attention requise : ${pendingActions.prestataires} ${pendingActions.prestataires === 1 ? 'prestataire en attente' : 'prestataires en attente'} de validation`
                    : lang === "fr" ? "Valider et gérer les prestataires" : "Validate and manage providers"}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/pays"
            className="bg-white border border-[#DDDDDD] rounded-xl p-6 hover:shadow-md hover:border-[#D4A657] transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A1B2A] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#D4A657]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#0A1B2A]">
                  {lang === "fr" ? "Gérer les pays" : "Manage countries"}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {lang === "fr" 
                    ? "Activer ou désactiver les pays disponibles"
                    : "Enable or disable available countries"}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/finance"
            className="bg-white border border-[#DDDDDD] rounded-xl p-6 hover:shadow-md hover:border-[#D4A657] transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A1B2A] flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#D4A657]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#0A1B2A]">
                  {t.financeTitle}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {lang === "fr" 
                    ? "Gestion financière, facturation et comptabilité"
                    : "Financial management, invoicing and accounting"}
                </p>
              </div>
            </div>
          </Link>

          <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A1B2A] flex items-center justify-center">
                <Database className="w-6 h-6 text-[#D4A657]" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-[#0A1B2A]">
                  {t.diagnosticDB}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {t.diagnosticDBDesc}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-[#DDDDDD]">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/check-db-schema", { cache: "no-store" });
                    const data = await res.json();
                    
                    // Afficher les résultats dans une alerte formatée
                    const summary = data.summary || {};
                    const diagnostics = data.diagnostics || {};
                    
                    const message = `
🔍 DIAGNOSTIC BASE DE DONNÉES

✅ Colonne typePrestataire: ${summary.typePrestataireColumnExists ? "EXISTE" : "MANQUANTE"}
✅ Migration appliquée: ${summary.typePrestataireMigrationApplied ? "OUI" : "NON"}
📊 Prestataires dans la DB: ${summary.prestatairesCount || 0}
✅ Table admin_notifications: ${summary.adminNotificationsTableExists ? "EXISTE" : "MANQUANTE"}

${diagnostics.prestatairesColumns ? `\n📋 Colonnes prestataires (${diagnostics.prestatairesColumnCount}):\n${diagnostics.prestatairesColumns.map((c: any) => `  - ${c.column_name}`).join("\n")}` : ""}

${diagnostics.prismaMigrations ? `\n🔄 Migrations Prisma (${diagnostics.totalMigrations}):\n${diagnostics.prismaMigrations.slice(0, 5).map((m: any) => `  - ${m.name}: ${m.finished ? "✅ Appliquée" : "⏳ En attente"}`).join("\n")}` : ""}

${diagnostics.prestatairesCountError ? `\n❌ Erreur: ${diagnostics.prestatairesCountError}` : ""}
                    `.trim();
                    
                    alert(message);
                    
                    // Afficher aussi dans la console pour copier facilement
                    console.log("🔍 Diagnostic DB complet:", data);
                  } catch (err: any) {
                    alert(`Erreur lors du diagnostic: ${err.message}`);
                    console.error("Erreur diagnostic:", err);
                  }
                }}
                className="flex-1 px-4 py-2 text-sm font-semibold text-[#0A1B2A] bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                {lang === "fr" ? "Vérifier" : "Check"}
              </button>
              <button
                onClick={async () => {
                  if (!confirm(lang === "fr" 
                    ? "Appliquer les migrations manquantes ? Cette opération peut prendre quelques secondes.\n\nMéthode: Connexion PostgreSQL directe (contourne Prisma Accelerate)"
                    : "Apply missing migrations? This operation may take a few seconds.\n\nMethod: Direct PostgreSQL connection (bypasses Prisma Accelerate)"
                  )) {
                    return;
                  }
                  
                  try {
                    // Essayer d'abord la méthode directe (avec pg)
                    let res = await fetch("/api/admin/apply-migration-direct", { 
                      method: "POST",
                      cache: "no-store" 
                    });
                    
                    // Si la méthode directe n'est pas disponible, fallback sur fix-db-schema
                    if (res.status === 503) {
                      const errorData = await res.json();
                      if (errorData.error === "Module pg non disponible") {
                        console.warn("Module pg non disponible, utilisation de fix-db-schema...");
                        res = await fetch("/api/admin/fix-db-schema", { 
                          method: "POST",
                          cache: "no-store" 
                        });
                      }
                    }
                    
                    const data = await res.json();
                    
                    const message = data.success
                      ? `✅ ${data.message}\n\n${data.results?.map((r: any) => `- ${r.message || r.action}`).join("\n")}\n\n${data.note || ""}`
                      : `❌ Erreur: ${data.error || data.message}`;
                    
                    alert(message);
                    
                    if (data.success) {
                      // Recharger la page pour voir les changements
                      setTimeout(() => window.location.reload(), 2000);
                    }
                    
                    console.log("🔧 Migration résultat:", data);
                  } catch (err: any) {
                    alert(`Erreur lors de la correction: ${err.message}`);
                    console.error("Erreur migration:", err);
                  }
                }}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[#D4A657] hover:bg-[#C49647] rounded-md transition"
              >
                {lang === "fr" ? "Corriger" : "Fix"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


