import { prisma } from "@/lib/db";
import type { AdminNotification } from "@/lib/adminNotificationsStore";

export async function getAllNotifications() {
  return prisma.adminNotification.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getUnreadNotifications() {
  return prisma.adminNotification.findMany({
    where: {
      read: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createNotification(data: Omit<AdminNotification, "id">) {
  return prisma.adminNotification.create({
    data: {
      type: data.type,
      title: data.title,
      message: data.message,
      missionId: data.missionId ? String(data.missionId) : null,
      missionRef: data.missionRef || null,
      demandeId: data.demandeId ? String(data.demandeId) : null,
      clientEmail: data.clientEmail || null,
      prestataireName: data.prestataireName || null,
      createdAt: new Date(data.createdAt),
      read: data.read || false,
      readAt: data.readAt ? new Date(data.readAt) : null,
    },
  });
}

export async function markNotificationAsRead(id: string) {
  return prisma.adminNotification.update({
    where: { id },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead() {
  return prisma.adminNotification.updateMany({
    where: {
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function deleteNotification(id: string) {
  return prisma.adminNotification.delete({
    where: { id },
  });
}

