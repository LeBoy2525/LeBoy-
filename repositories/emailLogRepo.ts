import { prisma } from "@/lib/db";

export async function createEmailLog(data: {
  to: string;
  from: string;
  subject: string;
  body: string;
  type: string;
  userId?: string;
  missionId?: string;
  demandeId?: string;
}) {
  return prisma.emailLog.create({
    data: {
      to: data.to,
      from: data.from,
      subject: data.subject,
      body: data.body,
      type: data.type,
      status: "pending",
      userId: data.userId || null,
      missionId: data.missionId || null,
      demandeId: data.demandeId || null,
    },
  });
}

export async function markEmailAsSent(id: string) {
  return prisma.emailLog.update({
    where: { id },
    data: {
      status: "sent",
      sentAt: new Date(),
    },
  });
}

export async function markEmailAsFailed(id: string, error: string) {
  return prisma.emailLog.update({
    where: { id },
    data: {
      status: "failed",
      error,
    },
  });
}

export async function getEmailLogs(filters?: {
  to?: string;
  status?: string;
  type?: string;
  limit?: number;
}) {
  return prisma.emailLog.findMany({
    where: {
      ...(filters?.to && { to: filters.to }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.type && { type: filters.type }),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: filters?.limit || 100,
  });
}

