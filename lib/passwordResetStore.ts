


// lib/passwordResetStore.ts

export type PasswordResetToken = {
    email: string;
    token: string;
    expiresAt: string; // ISO date
    used: boolean;
  };
  
  type GlobalStore = {
    _icdPasswordResetTokens?: PasswordResetToken[];
  };
  
  const globalStore = globalThis as typeof globalThis & GlobalStore;
  
  if (!globalStore._icdPasswordResetTokens) {
    globalStore._icdPasswordResetTokens = [];
  }
  
  export const passwordResetTokens = globalStore._icdPasswordResetTokens;
  
  export function createResetToken(email: string): string {
    // Générer un token aléatoire
    const token = crypto.randomUUID() + "-" + Date.now();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Valide 1 heure
  
    // Supprimer les anciens tokens pour cet email
    const index = passwordResetTokens.findIndex(
      (t) => t.email.toLowerCase() === email.toLowerCase() && !t.used
    );
    if (index !== -1) {
      passwordResetTokens.splice(index, 1);
    }
  
    passwordResetTokens.push({
      email: email.toLowerCase(),
      token,
      expiresAt: expiresAt.toISOString(),
      used: false,
    });
  
    return token;
  }
  
  export function validateResetToken(token: string): string | null {
    const resetToken = passwordResetTokens.find(
      (t) => t.token === token && !t.used
    );
  
    if (!resetToken) {
      return null;
    }
  
    const expiresAt = new Date(resetToken.expiresAt);
    if (expiresAt < new Date()) {
      return null; // Token expiré
    }
  
    return resetToken.email;
  }
  
  export function markTokenAsUsed(token: string): void {
    const resetToken = passwordResetTokens.find((t) => t.token === token);
    if (resetToken) {
      resetToken.used = true;
    }
  }