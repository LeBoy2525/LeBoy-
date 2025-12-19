import { prisma } from "@/lib/db";
import type { User } from "@/lib/usersStore";

// Vérifier que Prisma est disponible avant d'utiliser
if (!prisma) {
  throw new Error("Prisma n'est pas initialisé. DATABASE_URL doit être définie pour utiliser les repositories.");
}

export async function getAllUsers() {
  if (!prisma) throw new Error("Prisma non disponible");
  // @ts-ignore - Le client Prisma est généré mais TypeScript peut ne pas le reconnaître immédiatement
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getUserById(id: string) {
  if (!prisma) throw new Error("Prisma non disponible");
  // @ts-ignore
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function getUserByEmail(email: string) {
  if (!prisma) {
    console.error("[usersRepo] Prisma non disponible pour getUserByEmail");
    throw new Error("Prisma non disponible");
  }
  
  try {
    const emailLower = email.toLowerCase();
    console.log(`[usersRepo] Recherche utilisateur avec email: "${emailLower}"`);
    
    // @ts-ignore
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });
    
    if (user) {
      console.log(`[usersRepo] ✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);
    } else {
      console.log(`[usersRepo] ❌ Aucun utilisateur trouvé pour: "${emailLower}"`);
      
      // Debug: Lister tous les utilisateurs pour voir ce qui existe
      try {
        // @ts-ignore
        const allUsers = await prisma.user.findMany({
          select: { email: true, id: true },
          take: 10,
        });
        console.log(`[usersRepo] Utilisateurs dans DB (max 10): ${allUsers.map(u => u.email).join(", ")}`);
      } catch (listError: any) {
        console.error(`[usersRepo] Erreur lors de la liste des utilisateurs:`, listError?.message || listError);
      }
    }
    
    return user;
  } catch (error: any) {
    console.error("[usersRepo] Erreur lors de la recherche d'utilisateur:", error?.message || error);
    console.error("[usersRepo] Stack:", error?.stack);
    throw error;
  }
}

export async function createUser(data: Omit<User, "id">) {
  if (!prisma) throw new Error("Prisma non disponible");
  
  const emailLower = data.email.toLowerCase();
  console.log(`[usersRepo] Création utilisateur avec email: "${emailLower}"`);
  
  try {
    // @ts-ignore
    const user = await prisma.user.create({
      data: {
        email: emailLower,
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
    
    console.log(`[usersRepo] ✅ Utilisateur créé avec succès: ${user.email} (ID: ${user.id})`);
    
    // Vérifier immédiatement que l'utilisateur peut être retrouvé
    try {
      // @ts-ignore
      const verifyUser = await prisma.user.findUnique({
        where: { email: emailLower },
      });
      if (verifyUser) {
        console.log(`[usersRepo] ✅ Vérification: Utilisateur retrouvable immédiatement après création`);
      } else {
        console.error(`[usersRepo] ❌ ERREUR: Utilisateur non retrouvable immédiatement après création!`);
      }
    } catch (verifyError: any) {
      console.error(`[usersRepo] Erreur lors de la vérification:`, verifyError?.message || verifyError);
    }
    
    return user;
  } catch (error: any) {
    console.error(`[usersRepo] ❌ Erreur lors de la création d'utilisateur:`, error?.message || error);
    console.error(`[usersRepo] Code erreur:`, error?.code);
    console.error(`[usersRepo] Stack:`, error?.stack);
    throw error;
  }
}

export async function updateUser(id: string, data: Partial<User>) {
  if (!prisma) throw new Error("Prisma non disponible");
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
  if (!prisma) throw new Error("Prisma non disponible");
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
  if (!prisma) throw new Error("Prisma non disponible");
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
