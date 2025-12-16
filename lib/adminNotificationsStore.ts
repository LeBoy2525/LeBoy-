// lib/adminNotificationsStore.ts
// Store pour les notifications admin

import { loadFromFile, saveToFileAsync } from "./persistence";

export type AdminNotification = {
  id: number;
  type: "mission_deleted" | "mission_archived" | "mission_cancelled" | "mission_taken_over" | "mission_started" | "mission_estimated" | "mission_paid" | "mission_validation_submitted" | "other";
  title: string;
  message: string;
  missionId?: number;
  missionRef?: string;
  demandeId?: number;
  clientEmail?: string;
  prestataireName?: string;
  createdAt: string;
  read: boolean;
  readAt?: string | null;
};

type GlobalStore = {
  _icdAdminNotifications?: AdminNotification[];
  _icdAdminNotificationsLoaded?: boolean;
};

const globalStore = globalThis as typeof globalThis & GlobalStore;

// Initialiser le store depuis le fichier
if (!globalStore._icdAdminNotifications) {
  globalStore._icdAdminNotifications = [];
  globalStore._icdAdminNotificationsLoaded = false;
  
  // Charger les données au démarrage (asynchrone)
  loadFromFile<AdminNotification>("adminNotifications.json").then((data) => {
    if (data.length > 0) {
      globalStore._icdAdminNotifications = data;
      console.log(`✅ ${data.length} notification(s) admin chargée(s) depuis le fichier`);
    }
    globalStore._icdAdminNotificationsLoaded = true;
  }).catch((error) => {
    console.error("Erreur lors du chargement des notifications admin:", error);
    globalStore._icdAdminNotificationsLoaded = true;
  });
}

export const adminNotificationsStore = globalStore._icdAdminNotifications;

// Fonction pour sauvegarder les notifications
function saveNotifications() {
  try {
    saveToFileAsync("adminNotifications.json", adminNotificationsStore);
    console.log(`✅ ${adminNotificationsStore.length} notification(s) admin sauvegardée(s)`);
  } catch (error) {
    console.error("❌ Erreur sauvegarde notifications admin:", error);
  }
}

/**
 * Ajoute une notification pour l'admin
 */
export function addAdminNotification(
  notification: Omit<AdminNotification, "id" | "createdAt" | "read" | "readAt">
): AdminNotification {
  const nextId =
    adminNotificationsStore.length > 0
      ? adminNotificationsStore[adminNotificationsStore.length - 1].id + 1
      : 1;

  const newNotification: AdminNotification = {
    id: nextId,
    createdAt: new Date().toISOString(),
    read: false,
    readAt: null,
    ...notification,
  };

  adminNotificationsStore.push(newNotification);
  saveNotifications();
  return newNotification;
}

/**
 * Marque une notification comme lue
 */
export function markNotificationAsRead(notificationId: number): boolean {
  const notification = adminNotificationsStore.find((n) => n.id === notificationId);
  if (!notification) return false;

  notification.read = true;
  notification.readAt = new Date().toISOString();
  saveNotifications();
  return true;
}

/**
 * Marque toutes les notifications comme lues
 */
export function markAllNotificationsAsRead(): void {
  const now = new Date().toISOString();
  adminNotificationsStore.forEach((n) => {
    if (!n.read) {
      n.read = true;
      n.readAt = now;
    }
  });
  saveNotifications();
}

/**
 * Récupère toutes les notifications non lues
 */
export function getUnreadNotifications(): AdminNotification[] {
  return adminNotificationsStore.filter((n) => !n.read);
}

/**
 * Récupère toutes les notifications
 */
export function getAllNotifications(): AdminNotification[] {
  return adminNotificationsStore;
}

/**
 * Supprime une notification
 */
export function deleteNotification(notificationId: number): boolean {
  const index = adminNotificationsStore.findIndex((n) => n.id === notificationId);
  if (index === -1) return false;

  adminNotificationsStore.splice(index, 1);
  saveNotifications();
  return true;
}

