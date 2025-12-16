// lib/session.ts
import { cookies } from "next/headers";
import {
  getIronSession,
  type IronSession,
  type SessionOptions,
} from "iron-session";

// ✅ Ce qu'il y aura dans la session
export interface SessionUser {
  id: string;
  email: string;
  name?: string;
}

export interface SessionData {
  user?: SessionUser;
}

// ✅ Options de la session
export const sessionOptions: SessionOptions = {
  // ⚠️ Utilise bien SESSION_SECRET dans ton fichier .env
  password: process.env.SESSION_SECRET ?? "",
  cookieName: "icd_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

// ✅ Fonction principale utilisée dans tes routes API : getSession()
export async function getSession(): Promise<IronSession<SessionData>> {
  if (!sessionOptions.password) {
    throw new Error(
      "SESSION_SECRET n'est pas défini dans le fichier .env (variable manquante)."
    );
  }

  // ⬇️ Très important avec Next 16 : cookies() est ASYNC
  const cookieStore = await cookies();

  // ⬇️ On cast en any pour ne pas se battre avec les types Next/iron-session
  const session = await getIronSession<SessionData>(
    cookieStore as any,
    sessionOptions
  );

  return session;
}

// Optionnel : helper si tu veux juste l'utilisateur
export async function getUserFromSession() {
  const session = await getSession();
  return session.user ?? null;
}
