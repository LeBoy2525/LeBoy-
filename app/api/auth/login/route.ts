// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserRoleAsync } from "@/lib/auth";
import { getUserByEmail, updateLastLogin, getPrestataireByEmail } from "@/lib/dataAccess";
import { USE_DB } from "@/lib/dbFlag";

// Validation simple d'email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "").trim();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ou mot de passe manquant." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide." },
        { status: 400 }
      );
    }

    if (email.length > 255 || password.length > 100) {
      return NextResponse.json(
        { error: "Données invalides." },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();
    
    // Déterminer le rôle avec gestion d'erreur robuste
    // Utilise getUserRoleAsync qui bascule automatiquement entre JSON et DB
    let role: "client" | "admin" | "prestataire" = "client";
    try {
      role = await getUserRoleAsync(emailLower);
      console.log(`[LOGIN] Rôle détecté pour ${emailLower}: ${role}`);
    } catch (error) {
      console.error("Erreur lors de la détermination du rôle:", error);
      // Fallback sur version synchrone en cas d'erreur
      try {
        const { getUserRole } = await import("@/lib/auth");
        role = getUserRole(emailLower);
        console.log(`[LOGIN] Rôle détecté (fallback) pour ${emailLower}: ${role}`);
      } catch (fallbackError) {
        console.error("Erreur fallback getUserRole:", fallbackError);
        // En cas d'erreur totale, considérer comme client par défaut
        role = "client";
      }
    }

    // Vérifier selon le rôle
    let isValid = false;
    let userInfo: { email: string; role: string; fullName?: string } | null = null;

    if (role === "admin") {
      // Admin : vérifier les credentials depuis env ou valeurs par défaut
      const ADMIN_EMAILS = [
        process.env.ICD_ADMIN_EMAIL || "contact@leboy.com",
      ].map(e => e.toLowerCase());
      
      const ADMIN_PASSWORD = process.env.ICD_ADMIN_PASSWORD || "leboy-admin-2025";
      
      console.log(`[LOGIN ADMIN] Tentative de connexion avec email: ${emailLower}`);
      console.log(`[LOGIN ADMIN] Emails admin acceptés: ${ADMIN_EMAILS.join(", ")}`);
      console.log(`[LOGIN ADMIN] Email correspond: ${ADMIN_EMAILS.includes(emailLower)}`);
      console.log(`[LOGIN ADMIN] Mot de passe correspond: ${password === ADMIN_PASSWORD}`);
      
      if (ADMIN_EMAILS.includes(emailLower) && password === ADMIN_PASSWORD) {
        isValid = true;
        userInfo = { email: emailLower, role: "admin" };
        console.log(`[LOGIN ADMIN] ✅ Connexion réussie pour ${emailLower}`);
      } else {
        console.log(`[LOGIN ADMIN] ❌ Identifiants incorrects pour ${emailLower}`);
        return NextResponse.json(
          { error: `Identifiants administrateur incorrects. Emails acceptés: ${ADMIN_EMAILS.join(", ")}` },
          { status: 401 }
        );
      }
    } else if (role === "prestataire") {
      // Prestataire : utiliser dataAccess qui bascule automatiquement entre JSON et DB
      try {
        console.log(`[LOGIN PRESTATAIRE] Recherche prestataire: ${emailLower}`);
        const prestataire = await getPrestataireByEmail(emailLower);
        console.log(`[LOGIN PRESTATAIRE] Prestataire trouvé:`, prestataire ? { id: prestataire.id, email: prestataire.email, statut: prestataire.statut, hasPasswordHash: !!prestataire.passwordHash } : null);

        if (!prestataire) {
          console.log(`[LOGIN PRESTATAIRE] ❌ Prestataire non trouvé pour ${emailLower}`);
          return NextResponse.json(
            { error: "Compte prestataire non trouvé." },
            { status: 401 }
          );
        }

        // Vérifier si le prestataire est actif
        if (prestataire.statut !== "actif") {
          console.log(`[LOGIN PRESTATAIRE] ❌ Prestataire non actif: ${prestataire.statut}`);
          return NextResponse.json(
            { 
              error: "Votre compte prestataire est en attente de validation. Veuillez contacter l'administration LeBoy." 
            },
            { status: 403 }
          );
        }

        if (prestataire.passwordHash) {
          // Vérifier le hash
          console.log(`[LOGIN PRESTATAIRE] Comparaison mot de passe...`);
          isValid = await bcrypt.compare(password, prestataire.passwordHash);
          console.log(`[LOGIN PRESTATAIRE] Mot de passe valide: ${isValid}`);
        } else {
          console.log(`[LOGIN PRESTATAIRE] ❌ Pas de passwordHash`);
          return NextResponse.json(
            { error: "Veuillez définir un mot de passe depuis votre espace." },
            { status: 401 }
          );
        }

        if (isValid) {
          userInfo = {
            email: emailLower,
            role: "prestataire",
            fullName: prestataire.nomEntreprise,
          };
          console.log(`[LOGIN PRESTATAIRE] ✅ Connexion réussie`);
        } else {
          console.log(`[LOGIN PRESTATAIRE] ❌ Mot de passe incorrect`);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du prestataire:", error);
        // Fallback sur JSON en cas d'erreur DB
        if (USE_DB) {
          try {
            const { prestatairesStore } = await import("@/lib/prestatairesStore");
            if (prestatairesStore && Array.isArray(prestatairesStore)) {
              const prestataire = prestatairesStore.find(
                (p) => p && p.email && p.email.toLowerCase() === emailLower && p.statut !== "rejete"
              );

              if (!prestataire) {
                return NextResponse.json(
                  { error: "Compte prestataire non trouvé." },
                  { status: 401 }
                );
              }

              if (prestataire.statut !== "actif") {
                return NextResponse.json(
                  { 
                    error: "Votre compte prestataire est en attente de validation. Veuillez contacter l'administration LeBoy." 
                  },
                  { status: 403 }
                );
              }

              if (prestataire.passwordHash) {
                isValid = await bcrypt.compare(password, prestataire.passwordHash);
                if (isValid) {
                  userInfo = {
                    email: emailLower,
                    role: "prestataire",
                    fullName: prestataire.nomEntreprise,
                  };
                }
              } else {
                return NextResponse.json(
                  { error: "Veuillez définir un mot de passe depuis votre espace." },
                  { status: 401 }
                );
              }
            }
          } catch (fallbackError) {
            console.error("Erreur fallback JSON:", fallbackError);
          }
        }
      }
    } else {
      // Client : utiliser dataAccess qui bascule automatiquement entre JSON et DB
      try {
        console.log(`[LOGIN CLIENT] Recherche utilisateur: ${emailLower}`);
        const user = await getUserByEmail(emailLower);
        
        if (!user) {
          console.log(`[LOGIN CLIENT] ❌ Utilisateur non trouvé pour ${emailLower}`);
          return NextResponse.json(
            { error: "Identifiants incorrects." },
            { status: 401 }
          );
        }

        console.log(`[LOGIN CLIENT] ✅ Utilisateur trouvé: ${user.email}`);
        console.log(`[LOGIN CLIENT] Email vérifié: ${user.emailVerified}`);
        console.log(`[LOGIN CLIENT] Has passwordHash: ${!!user.passwordHash}`);
        
        // Vérifier si l'email est vérifié
        if (!user.emailVerified) {
          console.log(`[LOGIN CLIENT] ❌ Email non vérifié pour ${emailLower}`);
          return NextResponse.json(
            { 
              error: "Votre email n'a pas été vérifié. Veuillez vérifier votre boîte mail et entrer le code de vérification.",
              requiresVerification: true,
              email: emailLower
            },
            { status: 403 }
          );
        }

        console.log(`[LOGIN CLIENT] Comparaison mot de passe...`);
        isValid = await bcrypt.compare(password, user.passwordHash);
        console.log(`[LOGIN CLIENT] Mot de passe valide: ${isValid}`);
        
        if (isValid) {
          await updateLastLogin(emailLower);
          userInfo = {
            email: emailLower,
            role: "client",
            fullName: user.fullName,
          };
          console.log(`[LOGIN CLIENT] ✅ Connexion réussie pour ${emailLower}`);
        } else {
          console.log(`[LOGIN CLIENT] ❌ Mot de passe incorrect pour ${emailLower}`);
        }
      } catch (error) {
        console.error("[LOGIN CLIENT] Erreur lors de la récupération de l'utilisateur:", error);
        // Fallback sur JSON en cas d'erreur DB
        if (USE_DB) {
          try {
            const { getUserByEmail: getUserByEmailStore, updateLastLogin: updateLastLoginStore } = await import("@/lib/usersStore");
            const user = getUserByEmailStore(emailLower);
            if (user) {
              if (!user.emailVerified) {
                return NextResponse.json(
                  { 
                    error: "Votre email n'a pas été vérifié. Veuillez vérifier votre boîte mail et entrer le code de vérification.",
                    requiresVerification: true,
                    email: emailLower
                  },
                  { status: 403 }
                );
              }

              isValid = await bcrypt.compare(password, user.passwordHash);
              if (isValid) {
                updateLastLoginStore(emailLower);
                userInfo = {
                  email: emailLower,
                  role: "client",
                  fullName: user.fullName,
                };
              }
            }
          } catch (fallbackError) {
            console.error("Erreur fallback JSON:", fallbackError);
          }
        }
      }
    }

    if (!isValid || !userInfo) {
      console.log(`[LOGIN] ❌ Connexion échouée pour ${emailLower}, rôle détecté: ${role}, isValid: ${isValid}`);
      return NextResponse.json(
        { error: "Identifiants incorrects." },
        { status: 401 }
      );
    }

    console.log(`[LOGIN] ✅ Connexion réussie pour ${emailLower}, rôle: ${userInfo.role}`);

    // OK : créer les cookies
    const res = NextResponse.json(
      {
        ok: true,
        user: userInfo,
      },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.cookies.set("icd_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 60 * 60 * 4, // 4 heures
    });

    res.cookies.set("icd_user_email", emailLower, {
      httpOnly: false,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 60 * 60 * 4,
    });

    return res;
  } catch (err) {
    console.error("Erreur lors du login LeBoy:", err);
    return NextResponse.json(
      { error: "Erreur interne lors de la connexion." },
      { status: 500 }
    );
  }
}
