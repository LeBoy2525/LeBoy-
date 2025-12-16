import { prisma } from "@/lib/db";
import type { User } from "@/lib/usersStore";

export async function getAllUsers() {
  // @ts-ignore - Le client Prisma est généré mais TypeScript peut ne pas le reconnaître immédiatement
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getUserById(id: string) {
  // @ts-ignore
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function getUserByEmail(email: string) {
  // @ts-ignore
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function createUser(data: Omit<User, "id">) {
  // @ts-ignore
  return prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      role: "client", // Toujours "client" pour les utilisateurs créés via /api/auth/register
      createdAt: new Date(data.createdAt),
      lastLogin: data.lastLogin ? new Date(data.lastLogin) : null,
      emailVerified: data.emailVerified || false,
      verificationCode: data.verificationCode || null,
      verificationCodeExpires: data.verificationCodeExpires ? new Date(data.verificationCodeExpires) : null,
      country: data.country || null,
    },
  });
}

export async function updateUser(id: string, data: Partial<User>) {
  const updateData: any = {};
  
  if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
  if (data.lastLogin !== undefined) updateData.lastLogin = data.lastLogin ? new Date(data.lastLogin) : null;
  if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;
  if (data.verificationCode !== undefined) updateData.verificationCode = data.verificationCode;
  if (data.verificationCodeExpires !== undefined) updateData.verificationCodeExpires = data.verificationCodeExpires ? new Date(data.verificationCodeExpires) : null;
  
  // @ts-ignore
  return prisma.user.update({
    where: { id },
    data: updateData,
  });
}

export async function updateLastLogin(email: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  
  // @ts-ignore
  return prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
    },
  });
}

export async function setVerificationCode(email: string, code: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  
  // Code valide pendant 24 heures
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  // @ts-ignore
  return prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode: code,
      verificationCodeExpires: expiresAt,
    },
  });
}
