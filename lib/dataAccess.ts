/**
 * Helper pour basculer entre stores JSON et repositories Prisma
 * Utilise USE_DB pour déterminer quelle source utiliser
 * 
 * Objectif: Migration progressive sans casser le frontend
 */

import { USE_DB } from "./dbFlag";
import type { User } from "./usersStore";
import type { Prestataire } from "./prestatairesStore";
import type { DemandeICD } from "./demandesStore";
import type { Mission, MissionUpdate } from "./types";
import type { PropositionPrestataire } from "./propositionsStore";
import { getCachedUser, cacheUser, invalidateCache } from "./userCache";

/**
 * Récupère un utilisateur par email
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!email) return null;

  const emailLower = email.toLowerCase();
  
  // Vérifier d'abord le cache (très rapide)
  const cachedUser = getCachedUser(emailLower);
  if (cachedUser) {
    console.log(`[dataAccess] ✅ Utilisateur trouvé dans le cache: ${cachedUser.email}`);
    return cachedUser;
  }

  console.log(`[dataAccess] getUserByEmail appelé avec: "${emailLower}"`);
  console.log(`[dataAccess] USE_DB: ${USE_DB}`);

  if (USE_DB) {
    try {
      // Vérifier que Prisma est disponible avant d'essayer d'utiliser la DB
      const { prisma } = await import("@/lib/db");
      if (!prisma) {
        // ⚠️ CRITIQUE: En production, Prisma doit être disponible
        const isProduction = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
        if (isProduction) {
          console.error(`[dataAccess] ❌ ERREUR CRITIQUE: USE_DB=true mais Prisma n'est pas disponible en production!`);
          console.error(`[dataAccess] Les données ne seront PAS persistées et seront perdues au redéploiement!`);
          console.error(`[dataAccess] DATABASE_URL: ${process.env.DATABASE_URL ? "définie" : "NON DÉFINIE"}`);
          console.error(`[dataAccess] PRISMA_DATABASE_URL: ${process.env.PRISMA_DATABASE_URL ? "définie" : "NON DÉFINIE"}`);
          console.error(`[dataAccess] Vérifiez les logs d'initialisation Prisma dans lib/db.ts`);
          // En production, ne pas utiliser le fallback JSON car les fichiers sont perdus à chaque déploiement
          // Retourner null pour forcer une erreur visible plutôt que de perdre silencieusement les données
          return null;
        }
        // En développement, permettre le fallback JSON
        console.log(`[dataAccess] Prisma non disponible, fallback JSON (développement uniquement)`);
        const user = await getUserByEmailJSON(emailLower);
        if (user) cacheUser(emailLower, user);
        return user;
      }
      
      console.log(`[dataAccess] Prisma disponible, recherche dans DB`);
      const { getUserByEmail: getUserByEmailDB } = await import("@/repositories/usersRepo");
      const user = await getUserByEmailDB(emailLower);
      
      if (!user) {
        console.log(`[dataAccess] Utilisateur non trouvé dans DB, fallback JSON`);
        // Essayer le fallback JSON si pas trouvé dans DB
        const jsonUser = await getUserByEmailJSON(emailLower);
        // Ne pas mettre null en cache pour éviter de cacher les "non trouvés"
        return jsonUser;
      }
      
      console.log(`[dataAccess] Utilisateur trouvé dans DB: ${user.email}`);

      // Convertir le User Prisma vers le format User JSON
      // Note: Les IDs Prisma sont des UUIDs (string), mais le format JSON attend un number
      // Pour la compatibilité temporaire, on utilise un hash simple de l'UUID
      let idNumber: number;
      if (typeof user.id === "string" && user.id.includes("-")) {
      // C'est un UUID, créer un hash simple pour compatibilité
      const hash = user.id.split("").reduce((acc: number, char: string) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
        idNumber = Math.abs(hash) % 1000000; // Limiter à 6 chiffres
      } else {
        idNumber = parseInt(String(user.id)) || 0;
      }

      const convertedUser: User = {
        id: idNumber,
        email: user.email,
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString(),
        emailVerified: user.emailVerified,
        verificationCode: user.verificationCode || undefined,
        verificationCodeExpires: user.verificationCodeExpires?.toISOString(),
        country: user.country || undefined,
      };

      // Mettre en cache pour les prochaines recherches
      cacheUser(emailLower, convertedUser);
      return convertedUser;
    } catch (error) {
      console.error("Erreur getUserByEmail (DB):", error);
      // Fallback sur JSON en cas d'erreur
      const jsonUser = await getUserByEmailJSON(emailLower);
      if (jsonUser) cacheUser(emailLower, jsonUser);
      return jsonUser;
    }
  } else {
    const jsonUser = await getUserByEmailJSON(emailLower);
    if (jsonUser) cacheUser(emailLower, jsonUser);
    return jsonUser;
  }
}

/**
 * Convertir un Prestataire Prisma vers le format JSON
 */
function convertPrismaPrestataireToJSON(prestataire: any): Prestataire {
  // Convertir l'UUID en nombre pour compatibilité
  let idNumber: number;
  if (typeof prestataire.id === "string" && prestataire.id.includes("-")) {
    const hash = prestataire.id.split("").reduce((acc: number, char: string) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    idNumber = Math.abs(hash) % 1000000; // Limiter à 6 chiffres
  } else {
    idNumber = parseInt(String(prestataire.id)) || 0;
  }

  return {
    id: idNumber,
    ref: prestataire.ref,
    createdAt: prestataire.createdAt.toISOString(),
    nomEntreprise: prestataire.nomEntreprise,
    nomContact: prestataire.nomContact,
    email: prestataire.email,
    phone: prestataire.phone,
    adresse: prestataire.adresse,
    ville: prestataire.ville,
    specialites: prestataire.specialites as any[],
    zonesIntervention: prestataire.zonesIntervention,
    statut: prestataire.statut as any,
    disponibilite: "disponible", // Valeur par défaut
    nombreMissions: 0, // À calculer depuis les missions
    nombreMissionsReussies: 0,
    tauxReussite: 0,
    noteMoyenne: 0,
    nombreEvaluations: 0,
    certifications: [], // Valeur par défaut
    anneeExperience: 0, // Valeur par défaut
    tarifType: "fixe" as const, // Valeur par défaut
    commissionICD: 0, // Valeur par défaut
    capaciteMaxMissions: 10, // Valeur par défaut
    documentsVerifies: false,
    dateValidation: prestataire.actifAt?.toISOString(),
    deletedAt: prestataire.deletedAt?.toISOString(),
    deletedBy: prestataire.deletedBy || undefined,
    passwordHash: prestataire.passwordHash || undefined, // ⚠️ IMPORTANT: Inclure passwordHash
  };
}

/**
 * Récupère un prestataire par email
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getPrestataireByEmail(email: string): Promise<Prestataire | null> {
  if (!email) return null;

  const emailLower = email.toLowerCase();

  if (USE_DB) {
    try {
      const { getPrestataireByEmail: getPrestataireByEmailDB } = await import("@/repositories/prestatairesRepo");
      const prestataire = await getPrestataireByEmailDB(emailLower);
      
      if (!prestataire) return null;

      return convertPrismaPrestataireToJSON(prestataire);
    } catch (error) {
      console.error("Erreur getPrestataireByEmail (DB):", error);
      // Fallback sur JSON en cas d'erreur
      return getPrestataireByEmailJSON(emailLower);
    }
  } else {
    return getPrestataireByEmailJSON(emailLower);
  }
}

// ============================================
// Fonctions internes pour accès JSON (legacy)
// ============================================

async function getUserByEmailJSON(email: string): Promise<User | null> {
  try {
    console.log(`[dataAccess] getUserByEmailJSON appelé pour: "${email}"`);
    
    // Essayer d'abord le store en mémoire (plus rapide)
    try {
      const { getUserByEmail: getUserByEmailStore, usersStore } = await import("./usersStore");
      
      // Vérifier si le store est chargé
      if (usersStore && usersStore.length > 0) {
        console.log(`[dataAccess] Store JSON en mémoire contient ${usersStore.length} utilisateur(s)`);
        const user = getUserByEmailStore(email);
        if (user) {
          console.log(`[dataAccess] ✅ Utilisateur trouvé dans store JSON: ${user.email} (ID: ${user.id})`);
          return user;
        } else {
          console.log(`[dataAccess] Utilisateur "${email}" non trouvé dans store en mémoire`);
          // Afficher les emails disponibles pour debug
          const emailsInStore = usersStore.map(u => u.email).filter(Boolean);
          console.log(`[dataAccess] Emails dans store: ${emailsInStore.join(", ")}`);
        }
      } else {
        console.log(`[dataAccess] Store JSON vide ou non chargé`);
      }
    } catch (storeError: any) {
      console.log(`[dataAccess] Store JSON non disponible: ${storeError?.message || storeError}`);
    }
    
    // Fallback: Charger directement depuis le fichier
    try {
      const { loadFromFile } = await import("./persistence");
      const users = await loadFromFile<User>("users.json");
      
      console.log(`[dataAccess] Fichier JSON chargé: ${users?.length || 0} utilisateur(s)`);
      
      if (!users || users.length === 0) {
        console.log(`[dataAccess] Aucun utilisateur dans le fichier JSON`);
        return null;
      }
      
      const user = users.find((u) => u && u.email && u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        console.log(`[dataAccess] ✅ Utilisateur trouvé dans fichier JSON: ${user.email} (ID: ${user.id})`);
        return user;
      } else {
        console.log(`[dataAccess] ❌ Utilisateur "${email}" non trouvé dans ${users.length} utilisateur(s)`);
        const emailsInFile = users.map(u => u.email).filter(Boolean);
        console.log(`[dataAccess] Emails disponibles dans fichier: ${emailsInFile.join(", ")}`);
        return null;
      }
    } catch (fileError: any) {
      console.error(`[dataAccess] Erreur lors du chargement du fichier JSON:`, fileError?.message || fileError);
      return null;
    }
  } catch (error: any) {
    console.error(`[dataAccess] Erreur getUserByEmailJSON:`, error?.message || error);
    return null;
  }
}

/**
 * Met à jour la date de dernière connexion d'un utilisateur
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function updateLastLogin(email: string): Promise<void> {
  const emailLower = email.toLowerCase();

  if (USE_DB) {
    try {
      const { updateLastLogin: updateLastLoginDB } = await import("@/repositories/usersRepo");
      await updateLastLoginDB(emailLower);
    } catch (error) {
      console.error("Erreur updateLastLogin (DB):", error);
      // Fallback sur JSON en cas d'erreur
      updateLastLoginJSON(emailLower);
    }
  } else {
    updateLastLoginJSON(emailLower);
  }
}

async function updateLastLoginJSON(email: string): Promise<void> {
  try {
    const { updateLastLogin: updateLastLoginStore } = await import("./usersStore");
    updateLastLoginStore(email);
  } catch (error) {
    console.error("Erreur updateLastLogin (JSON):", error);
  }
}

/**
 * Crée un nouvel utilisateur
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function createUser(
  email: string,
  passwordHash: string,
  fullName: string,
  country?: string
): Promise<User> {
  const emailLower = email.toLowerCase();

  if (USE_DB) {
    try {
      // Vérifier que Prisma est disponible avant d'essayer d'utiliser la DB
      const { prisma } = await import("@/lib/db");
      if (!prisma) {
        // Prisma non disponible, utiliser le fallback JSON
        return createUserJSON(emailLower, passwordHash, fullName, country);
      }
      
      const { createUser: createUserDB } = await import("@/repositories/usersRepo");
      const user = await createUserDB({
        email: emailLower,
        passwordHash,
        fullName,
        country,
        createdAt: new Date().toISOString(),
        emailVerified: false,
      } as any); // Type assertion car Prisma attend un User avec role mais le type JSON n'a pas role

      // Convertir le User Prisma vers le format User JSON
      let idNumber: number;
      if (typeof user.id === "string" && user.id.includes("-")) {
        const hash = user.id.split("").reduce((acc: number, char: string) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        idNumber = Math.abs(hash) % 1000000;
      } else {
        idNumber = parseInt(String(user.id)) || 0;
      }

      return {
        id: idNumber,
        email: user.email,
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString(),
        emailVerified: user.emailVerified,
        verificationCode: user.verificationCode || undefined,
        verificationCodeExpires: user.verificationCodeExpires?.toISOString(),
        country: user.country || undefined,
      };
    } catch (error) {
      console.error("Erreur createUser (DB):", error);
      // Fallback sur JSON en cas d'erreur
      return createUserJSON(emailLower, passwordHash, fullName, country);
    }
  } else {
    return createUserJSON(emailLower, passwordHash, fullName, country);
  }
}

/**
 * Définit le code de vérification pour un utilisateur
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function setVerificationCode(email: string, code: string): Promise<void> {
  const emailLower = email.toLowerCase();

  if (USE_DB) {
    try {
      // Vérifier que Prisma est disponible avant d'essayer d'utiliser la DB
      const { prisma } = await import("@/lib/db");
      if (!prisma) {
        // Prisma non disponible, utiliser le fallback JSON
        setVerificationCodeJSON(emailLower, code);
        return;
      }
      
      const { setVerificationCode: setVerificationCodeDB } = await import("@/repositories/usersRepo");
      await setVerificationCodeDB(emailLower, code);
      // Invalider le cache pour forcer une nouvelle recherche avec le code mis à jour
      invalidateCache(emailLower);
    } catch (error) {
      console.error("Erreur setVerificationCode (DB):", error);
      // Fallback sur JSON en cas d'erreur
      setVerificationCodeJSON(emailLower, code);
      invalidateCache(emailLower);
    }
  } else {
    setVerificationCodeJSON(emailLower, code);
  }
}

/**
 * Vérifie le code de vérification et active le compte si valide
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function verifyEmail(email: string, code: string): Promise<boolean> {
  const emailLower = email.toLowerCase();

  if (USE_DB) {
    try {
      const { getUserByEmail: getUserByEmailDB } = await import("@/repositories/usersRepo");
      const user = await getUserByEmailDB(emailLower);
      
      if (!user || !user.verificationCode || !user.verificationCodeExpires) {
        return false;
      }

      // Vérifier si le code correspond
      if (user.verificationCode !== code) {
        return false;
      }

      // Vérifier si le code n'a pas expiré
      const expiresAt = new Date(user.verificationCodeExpires);
      if (expiresAt < new Date()) {
        return false;
      }

      // Activer le compte dans la DB
      const { updateUser } = await import("@/repositories/usersRepo");
      await updateUser(user.id, {
        emailVerified: true,
        verificationCode: undefined,
        verificationCodeExpires: undefined,
      });

      // Invalider le cache pour forcer une nouvelle recherche avec les données mises à jour
      invalidateCache(emailLower);

      return true;
    } catch (error) {
      console.error("Erreur verifyEmail (DB):", error);
      // Fallback sur JSON en cas d'erreur
      return verifyEmailJSON(emailLower, code);
    }
  } else {
    return verifyEmailJSON(emailLower, code);
  }
}

async function createUserJSON(
  email: string,
  passwordHash: string,
  fullName: string,
  country?: string
): Promise<User> {
  console.log(`[dataAccess] createUserJSON appelé pour: "${email}"`);
  
  try {
    // Import dynamique pour éviter les problèmes de circularité
    const { createUser: createUserStore } = await import("./usersStore");
    
    // Utiliser la fonction createUser du store qui gère déjà la sauvegarde
    const user = createUserStore(email, passwordHash, fullName, country);
    console.log(`[dataAccess] Utilisateur créé en JSON avec ID: ${user.id}`);
    
    // Vérifier que l'utilisateur peut être retrouvé immédiatement
    const verifyUser = await getUserByEmailJSON(email);
    if (verifyUser) {
      console.log(`[dataAccess] ✅ Vérification: Utilisateur retrouvable après création JSON`);
    } else {
      console.error(`[dataAccess] ❌ ERREUR: Utilisateur non retrouvable après création JSON!`);
    }
    
    return user;
  } catch (error) {
    console.error(`[dataAccess] Erreur createUserJSON:`, error);
    throw error;
  }
}

async function setVerificationCodeJSON(email: string, code: string): Promise<void> {
  const { setVerificationCode: setVerificationCodeStore } = await import("./usersStore");
  setVerificationCodeStore(email, code);
}

async function verifyEmailJSON(email: string, code: string): Promise<boolean> {
  const { verifyEmail: verifyEmailStore } = await import("./usersStore");
  return verifyEmailStore(email, code);
}

/**
 * Récupère tous les prestataires actifs
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getAllPrestataires(): Promise<Prestataire[]> {
  if (USE_DB) {
    try {
      const { getAllPrestataires: getAllPrestatairesDB } = await import("@/repositories/prestatairesRepo");
      const prestataires = await getAllPrestatairesDB() as any[];
      
      return prestataires.map(convertPrismaPrestataireToJSON);
    } catch (error) {
      console.error("Erreur getAllPrestataires (DB):", error);
      return getAllPrestatairesJSON();
    }
  } else {
    return getAllPrestatairesJSON();
  }
}

/**
 * Récupère un prestataire par ID
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getPrestataireById(id: number): Promise<Prestataire | null> {
  if (!id) return null;

  if (USE_DB) {
    try {
      const { getAllPrestataires: getAllPrestatairesDB } = await import("@/repositories/prestatairesRepo");
      const allPrestataires = await getAllPrestatairesDB() as any[];
      
      // Convertir l'ID numérique en UUID si nécessaire
      const prestataire = allPrestataires.find((p: any) => {
        if (typeof p.id === "string" && p.id.includes("-")) {
          const hash = p.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          const idNumber = Math.abs(hash) % 1000000;
          return idNumber === id;
        }
        return parseInt(String(p.id)) === id;
      });

      return prestataire ? convertPrismaPrestataireToJSON(prestataire) : null;
    } catch (error) {
      console.error("Erreur getPrestataireById (DB):", error);
      return getPrestataireByIdJSON(id);
    }
  } else {
    return getPrestataireByIdJSON(id);
  }
}

/**
 * Crée un nouveau prestataire
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function createPrestataire(
  data: Omit<Prestataire, "id" | "ref" | "createdAt" | "statut" | "dateValidation" | "documentsVerifies" | "noteMoyenne" | "nombreMissions" | "nombreMissionsReussies" | "tauxReussite" | "disponibilite" | "deletedAt" | "deletedBy">
): Promise<Prestataire> {
  if (USE_DB) {
    try {
      const { createPrestataire: createPrestataireDB, getAllPrestataires: getAllPrestatairesDB } = await import("@/repositories/prestatairesRepo");
      
      // Générer ref et createdAt comme le fait addPrestataire JSON
      const year = new Date().getFullYear();
      const allPrestataires = await getAllPrestatairesDB();
      const nextId = allPrestataires.length + 1;
      const ref = `P-${year}-${String(nextId).padStart(3, "0")}`;
      const createdAt = new Date().toISOString();

      const prestataire = await createPrestataireDB({
        ref,
        createdAt,
        nomEntreprise: data.nomEntreprise,
        nomContact: data.nomContact,
        email: data.email.toLowerCase(),
        phone: data.phone,
        adresse: data.adresse,
        ville: data.ville,
        specialites: data.specialites,
        zonesIntervention: data.zonesIntervention,
        statut: "en_attente",
        passwordHash: data.passwordHash,
      } as any);

      return convertPrismaPrestataireToJSON(prestataire);
    } catch (error) {
      console.error("Erreur createPrestataire (DB):", error);
      return createPrestataireJSON(data);
    }
  } else {
    return createPrestataireJSON(data);
  }
}

/**
 * Récupère tous les prestataires actifs
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getPrestatairesActifs(): Promise<Prestataire[]> {
  const allPrestataires = await getAllPrestataires();
  return allPrestataires.filter((p) => p.statut === "actif");
}

async function getAllPrestatairesJSON(): Promise<Prestataire[]> {
  const { loadFromFile } = await import("./persistence");
  const prestataires = await loadFromFile<Prestataire>("prestataires.json");
  return prestataires.filter((p) => !p.deletedAt);
}

async function getPrestataireByIdJSON(id: number): Promise<Prestataire | null> {
  const { getPrestataireById: getPrestataireByIdStore } = await import("./prestatairesStore");
  return getPrestataireByIdStore(id) || null;
}

async function createPrestataireJSON(
  data: Omit<Prestataire, "id" | "ref" | "createdAt" | "statut" | "dateValidation" | "documentsVerifies" | "noteMoyenne" | "nombreMissions" | "nombreMissionsReussies" | "tauxReussite" | "disponibilite" | "deletedAt" | "deletedBy">
): Promise<Prestataire> {
  const { addPrestataire: addPrestataireStore } = await import("./prestatairesStore");
  return addPrestataireStore(data);
}

/**
 * Crée une nouvelle demande
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function createDemande(
  data: Omit<DemandeICD, "id" | "ref" | "createdAt" | "deletedAt" | "deletedBy" | "statut" | "rejeteeAt" | "rejeteeBy" | "raisonRejet">
): Promise<DemandeICD> {
  if (USE_DB) {
    try {
      const { createDemande: createDemandeDB, getAllDemandes: getAllDemandesDB } = await import("@/repositories/demandesRepo");
      
      // Générer ref et createdAt comme le fait addDemande JSON
      const year = new Date().getFullYear();
      // Pour la ref, on compte les demandes existantes
      const allDemandes = await getAllDemandesDB();
      const nextId = allDemandes.length + 1;
      const ref = `D-${year}-${String(nextId).padStart(3, "0")}`;
      const createdAt = new Date().toISOString();
      
      const demande = await createDemandeDB({
        ref,
        createdAt,
        statut: "en_attente",
        deletedAt: null,
        deletedBy: null,
        rejeteeAt: null,
        rejeteeBy: null,
        raisonRejet: null,
        ...data,
      }) as any; // Type assertion car Prisma retourne un type différent

      // Convertir le Demande Prisma vers le format DemandeICD JSON
      let idNumber: number;
      if (typeof demande.id === "string" && demande.id.includes("-")) {
        const hash = demande.id.split("").reduce((acc: number, char: string) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        idNumber = Math.abs(hash) % 1000000;
      } else {
        idNumber = parseInt(String(demande.id)) || 0;
      }

      return {
        id: idNumber,
        ref: demande.ref,
        createdAt: demande.createdAt.toISOString(),
        deviceId: demande.deviceId || undefined,
        fullName: demande.fullName,
        email: demande.email,
        phone: demande.phone,
        serviceType: demande.serviceType,
        serviceSubcategory: demande.serviceSubcategory || undefined,
        serviceAutre: demande.serviceAutre || undefined,
        country: demande.country || undefined,
        description: demande.description,
        lieu: demande.lieu || undefined,
        budget: demande.budget || undefined,
        urgence: demande.urgence,
        fileIds: demande.fileIds || [],
        statut: demande.statut as any,
        rejeteeAt: demande.rejeteeAt?.toISOString(),
        rejeteeBy: demande.rejeteeBy || undefined,
        raisonRejet: demande.raisonRejet || undefined,
        deletedAt: demande.deletedAt?.toISOString(),
        deletedBy: demande.deletedBy || undefined,
      };
    } catch (error) {
      console.error("Erreur createDemande (DB):", error);
      // Fallback sur JSON en cas d'erreur
      return createDemandeJSON(data);
    }
  } else {
    return createDemandeJSON(data);
  }
}

/**
 * Récupère toutes les demandes actives (non supprimées)
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getAllDemandes(): Promise<DemandeICD[]> {
  if (USE_DB) {
    try {
      const { getAllDemandes: getAllDemandesDB } = await import("@/repositories/demandesRepo");
      const demandes = await getAllDemandesDB() as any[]; // Type assertion car Prisma retourne un type différent
      
      return demandes.map((d: any) => {
        let idNumber: number;
        if (typeof d.id === "string" && d.id.includes("-")) {
          const hash = d.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          idNumber = Math.abs(hash) % 1000000;
        } else {
          idNumber = parseInt(String(d.id)) || 0;
        }

        return {
          id: idNumber,
          ref: d.ref,
          createdAt: d.createdAt.toISOString(),
          deviceId: d.deviceId || undefined,
          fullName: d.fullName,
          email: d.email,
          phone: d.phone,
          serviceType: d.serviceType,
          serviceSubcategory: d.serviceSubcategory || undefined,
          serviceAutre: d.serviceAutre || undefined,
          country: d.country || undefined,
          description: d.description,
          lieu: d.lieu || undefined,
          budget: d.budget || undefined,
          urgence: d.urgence,
          fileIds: d.fileIds || [],
          statut: d.statut as any,
          rejeteeAt: d.rejeteeAt?.toISOString(),
          rejeteeBy: d.rejeteeBy || undefined,
          raisonRejet: d.raisonRejet || undefined,
          deletedAt: d.deletedAt?.toISOString(),
          deletedBy: d.deletedBy || undefined,
        };
      });
    } catch (error) {
      console.error("Erreur getAllDemandes (DB):", error);
      // Fallback sur JSON en cas d'erreur
      return getAllDemandesJSON();
    }
  } else {
    return getAllDemandesJSON();
  }
}

async function createDemandeJSON(
  data: Omit<DemandeICD, "id" | "ref" | "createdAt" | "deletedAt" | "deletedBy" | "statut" | "rejeteeAt" | "rejeteeBy" | "raisonRejet">
): Promise<DemandeICD> {
  const { addDemande } = await import("./demandesStore");
  return addDemande(data);
}

async function getAllDemandesJSON(): Promise<DemandeICD[]> {
  try {
    // Charger directement depuis le fichier si le store n'est pas encore chargé
    const { loadFromFile } = await import("./persistence");
    const demandes = await loadFromFile<DemandeICD>("demandes.json");
    
    if (!demandes || demandes.length === 0) {
      return [];
    }
    
    // Exclure les demandes supprimées
    return demandes.filter((d) => !d.deletedAt);
  } catch (error) {
    console.error("Erreur getAllDemandes (JSON):", error);
    return [];
  }
}

/**
 * Récupère une demande par ID
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getDemandeById(id: number): Promise<DemandeICD | null> {
  if (!id) return null;

  if (USE_DB) {
    try {
      const { getDemandeById: getDemandeByIdDB } = await import("@/repositories/demandesRepo");
      
      // Convertir l'ID numérique en UUID si nécessaire
      // Pour l'instant, on cherche dans toutes les demandes
      const allDemandes = await getAllDemandes();
      const demande = allDemandes.find((d) => d.id === id);
      
      return demande || null;
    } catch (error) {
      console.error("Erreur getDemandeById (DB):", error);
      return getDemandeByIdJSON(id);
    }
  } else {
    return getDemandeByIdJSON(id);
  }
}

async function getDemandeByIdJSON(id: number): Promise<DemandeICD | null> {
  const { getDemandeById: getDemandeByIdStore } = await import("./demandesStore");
  return getDemandeByIdStore(id) || null;
}

/**
 * Récupère une demande par ref
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getDemandeByRef(ref: string): Promise<DemandeICD | null> {
  if (!ref) return null;

  if (USE_DB) {
    try {
      const { getDemandeByRef: getDemandeByRefDB } = await import("@/repositories/demandesRepo");
      const demande = await getDemandeByRefDB(ref);
      
      if (!demande) return null;

      // Convertir Prisma vers JSON
      let idNumber: number;
      if (typeof demande.id === "string" && demande.id.includes("-")) {
        const hash = demande.id.split("").reduce((acc: number, char: string) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        idNumber = Math.abs(hash) % 1000000;
      } else {
        idNumber = parseInt(String(demande.id)) || 0;
      }

      return {
        id: idNumber,
        ref: demande.ref,
        createdAt: demande.createdAt.toISOString(),
        deviceId: demande.deviceId || undefined,
        fullName: demande.fullName,
        email: demande.email,
        phone: demande.phone,
        serviceType: demande.serviceType,
        serviceSubcategory: demande.serviceSubcategory || undefined,
        serviceAutre: demande.serviceAutre || undefined,
        country: demande.country || undefined,
        description: demande.description,
        lieu: demande.lieu || undefined,
        budget: demande.budget || undefined,
        urgence: demande.urgence,
        fileIds: demande.fileIds || [],
        statut: demande.statut as any,
        rejeteeAt: demande.rejeteeAt?.toISOString(),
        rejeteeBy: demande.rejeteeBy || undefined,
        raisonRejet: demande.raisonRejet || undefined,
        deletedAt: demande.deletedAt?.toISOString(),
        deletedBy: demande.deletedBy || undefined,
      };
    } catch (error) {
      console.error("Erreur getDemandeByRef (DB):", error);
      return getDemandeByRefJSON(ref);
    }
  } else {
    return getDemandeByRefJSON(ref);
  }
}

async function getDemandeByRefJSON(ref: string): Promise<DemandeICD | null> {
  const { loadFromFile } = await import("./persistence");
  const demandes = await loadFromFile<DemandeICD>("demandes.json");
  const demande = demandes.find((d) => d.ref.toLowerCase() === ref.toLowerCase() && !d.deletedAt);
  return demande || null;
}

/**
 * Supprime une demande (soft delete)
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function softDeleteDemande(id: number, deletedBy: string): Promise<DemandeICD | null> {
  if (!id) return null;

  if (USE_DB) {
    try {
      const { softDeleteDemande: softDeleteDemandeDB, getAllDemandes: getAllDemandesDB } = await import("@/repositories/demandesRepo");
      
      // Trouver l'UUID de la demande
      const allDemandes = await getAllDemandesDB();
      const demandeDB = allDemandes.find((d: any) => {
        if (typeof d.id === "string" && d.id.includes("-")) {
          const hash = d.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          const idNumber = Math.abs(hash) % 1000000;
          return idNumber === id;
        }
        return parseInt(String(d.id)) === id;
      });

      if (!demandeDB) return null;

      await softDeleteDemandeDB(demandeDB.id, deletedBy);
      
      // Récupérer la demande mise à jour
      return await getDemandeById(id);
    } catch (error) {
      console.error("Erreur softDeleteDemande (DB):", error);
      return softDeleteDemandeJSON(id, deletedBy);
    }
  } else {
    return softDeleteDemandeJSON(id, deletedBy);
  }
}

/**
 * Restaure une demande supprimée
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function restoreDemande(id: number): Promise<DemandeICD | null> {
  if (!id) return null;

  if (USE_DB) {
    try {
      const { restoreDemande: restoreDemandeDB, getAllDemandes: getAllDemandesDB } = await import("@/repositories/demandesRepo");
      
      // Trouver l'UUID de la demande
      const allDemandes = await getAllDemandesDB();
      const demandeDB = allDemandes.find((d: any) => {
        if (typeof d.id === "string" && d.id.includes("-")) {
          const hash = d.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          const idNumber = Math.abs(hash) % 1000000;
          return idNumber === id;
        }
        return parseInt(String(d.id)) === id;
      });

      if (!demandeDB) return null;

      await restoreDemandeDB(demandeDB.id);
      
      // Récupérer la demande mise à jour
      return await getDemandeById(id);
    } catch (error) {
      console.error("Erreur restoreDemande (DB):", error);
      return restoreDemandeJSON(id);
    }
  } else {
    return restoreDemandeJSON(id);
  }
}

/**
 * Rejette une demande
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function rejectDemande(
  id: number,
  rejectedBy: string,
  raisonRejet?: string
): Promise<DemandeICD | null> {
  if (!id) return null;

  if (USE_DB) {
    try {
      const { updateDemande: updateDemandeDB, getAllDemandes: getAllDemandesDB } = await import("@/repositories/demandesRepo");
      
      // Trouver l'UUID de la demande
      const allDemandes = await getAllDemandesDB();
      const demandeDB = allDemandes.find((d: any) => {
        if (typeof d.id === "string" && d.id.includes("-")) {
          const hash = d.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          const idNumber = Math.abs(hash) % 1000000;
          return idNumber === id;
        }
        return parseInt(String(d.id)) === id;
      });

      if (!demandeDB) return null;

      await updateDemandeDB(demandeDB.id, {
        statut: "rejetee",
        rejeteeAt: new Date().toISOString(),
        rejeteeBy: rejectedBy,
        raisonRejet: raisonRejet || null,
      });
      
      // Récupérer la demande mise à jour
      return await getDemandeById(id);
    } catch (error) {
      console.error("Erreur rejectDemande (DB):", error);
      return rejectDemandeJSON(id, rejectedBy, raisonRejet);
    }
  } else {
    return rejectDemandeJSON(id, rejectedBy, raisonRejet);
  }
}

async function softDeleteDemandeJSON(id: number, deletedBy: string): Promise<DemandeICD | null> {
  const { softDeleteDemande: softDeleteDemandeStore } = await import("./demandesStore");
  return softDeleteDemandeStore(id, deletedBy);
}

async function restoreDemandeJSON(id: number): Promise<DemandeICD | null> {
  const { restoreDemande: restoreDemandeStore } = await import("./demandesStore");
  return restoreDemandeStore(id);
}

async function rejectDemandeJSON(
  id: number,
  rejectedBy: string,
  raisonRejet?: string
): Promise<DemandeICD | null> {
  const { rejectDemande: rejectDemandeStore } = await import("./demandesStore");
  return rejectDemandeStore(id, rejectedBy, raisonRejet);
}

// Fonction pour demander une modification à une demande
export async function requestModificationDemande(
  id: number,
  requestedBy: string,
  messageModification: string
): Promise<DemandeICD | null> {
  if (!id) return null;

  if (USE_DB) {
    try {
      const { updateDemande: updateDemandeDB, getAllDemandes: getAllDemandesDB } = await import("@/repositories/demandesRepo");
      
      // Trouver l'UUID de la demande
      const allDemandes = await getAllDemandesDB();
      const demandeDB = allDemandes.find((d: any) => {
        if (typeof d.id === "string" && d.id.includes("-")) {
          const hash = d.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          const idNumber = Math.abs(hash) % 1000000;
          return idNumber === id;
        }
        return parseInt(String(d.id)) === id;
      });

      if (!demandeDB) return null;

      await updateDemandeDB(demandeDB.id, {
        statut: "modification_demandee",
        modificationDemandeeAt: new Date().toISOString(),
        modificationDemandeeBy: requestedBy,
        messageModification: messageModification,
      });
      
      // Récupérer la demande mise à jour
      return await getDemandeById(id);
    } catch (error) {
      console.error("Erreur requestModificationDemande (DB):", error);
      return requestModificationDemandeJSON(id, requestedBy, messageModification);
    }
  } else {
    return requestModificationDemandeJSON(id, requestedBy, messageModification);
  }
}

async function requestModificationDemandeJSON(
  id: number,
  requestedBy: string,
  messageModification: string
): Promise<DemandeICD | null> {
  const { requestModificationDemande: requestModificationDemandeStore } = await import("./demandesStore");
  return requestModificationDemandeStore(id, requestedBy, messageModification);
}

// Fonction pour renvoyer une demande après modification
export async function resubmitDemande(id: number): Promise<DemandeICD | null> {
  if (!id) return null;

  if (USE_DB) {
    try {
      const { updateDemande: updateDemandeDB, getAllDemandes: getAllDemandesDB } = await import("@/repositories/demandesRepo");
      
      // Trouver l'UUID de la demande
      const allDemandes = await getAllDemandesDB();
      const demandeDB = allDemandes.find((d: any) => {
        if (typeof d.id === "string" && d.id.includes("-")) {
          const hash = d.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          const idNumber = Math.abs(hash) % 1000000;
          return idNumber === id;
        }
        return parseInt(String(d.id)) === id;
      });

      if (!demandeDB) return null;

      await updateDemandeDB(demandeDB.id, {
        statut: "en_attente",
        modificationDemandeeAt: null,
        modificationDemandeeBy: null,
        messageModification: null,
      });
      
      // Récupérer la demande mise à jour
      return await getDemandeById(id);
    } catch (error) {
      console.error("Erreur resubmitDemande (DB):", error);
      return resubmitDemandeJSON(id);
    }
  } else {
    return resubmitDemandeJSON(id);
  }
}

async function resubmitDemandeJSON(id: number): Promise<DemandeICD | null> {
  const { resubmitDemande: resubmitDemandeStore } = await import("./demandesStore");
  return resubmitDemandeStore(id);
}

async function getPrestataireByEmailJSON(email: string): Promise<Prestataire | null> {
  try {
    // Charger directement depuis le fichier si le store n'est pas encore chargé
    // Cela évite les problèmes de timing avec le chargement asynchrone
    const { loadFromFile } = await import("./persistence");
    const prestataires = await loadFromFile<Prestataire>("prestataires.json");
    
    if (!prestataires || prestataires.length === 0) {
      console.log(`[DATAACCESS] ❌ Aucun prestataire dans le fichier`);
      return null;
    }
    
    console.log(`[DATAACCESS] Recherche prestataire ${email} dans ${prestataires.length} prestataires`);
    
    // Filtrer pour ne retourner que les prestataires actifs et non supprimés
    // Si plusieurs prestataires ont le même email, prendre le plus récent (non rejeté, non supprimé)
    const filtered = prestataires
      .filter(
        (p) => p && 
               p.email && 
               p.email.toLowerCase() === email &&
               p.statut !== "rejete" &&
               !p.deletedAt
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (filtered.length > 0) {
      console.log(`[DATAACCESS] ✅ Prestataire trouvé: ${filtered[0].email} (statut: ${filtered[0].statut})`);
      return filtered[0];
    } else {
      console.log(`[DATAACCESS] ❌ Aucun prestataire trouvé pour ${email}`);
      return null;
    }
  } catch (error) {
    console.error("Erreur getPrestataireByEmail (JSON):", error);
    return null;
  }
}

// ============================================
// Fonctions pour Missions
// ============================================

/**
 * Récupère les missions d'un client par email
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getMissionsByClient(email: string): Promise<Mission[]> {
  if (USE_DB) {
    try {
      const { getMissionsByClient: getMissionsByClientDB } = await import("@/repositories/missionsRepo");
      const missions = await getMissionsByClientDB(email.toLowerCase()) as any[];
      
      return missions.map(convertPrismaMissionToJSON);
    } catch (error) {
      console.error("Erreur getMissionsByClient (DB):", error);
      return getMissionsByClientJSON(email);
    }
  } else {
    return getMissionsByClientJSON(email);
  }
}

/**
 * Récupère les missions d'un prestataire par ID
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getMissionsByPrestataire(prestataireId: number): Promise<Mission[]> {
  if (USE_DB) {
    try {
      const { getMissionsByPrestataire: getMissionsByPrestataireDB } = await import("@/repositories/missionsRepo");
      // Convertir l'ID number en string pour Prisma (UUID)
      const prestataireIdStr = String(prestataireId);
      const missions = await getMissionsByPrestataireDB(prestataireIdStr) as any[];
      
      return missions.map(convertPrismaMissionToJSON);
    } catch (error) {
      console.error("Erreur getMissionsByPrestataire (DB):", error);
      return getMissionsByPrestataireJSON(prestataireId);
    }
  } else {
    return getMissionsByPrestataireJSON(prestataireId);
  }
}

/**
 * Récupère les missions d'une demande par ID
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getMissionsByDemandeId(demandeId: number): Promise<Mission[]> {
  if (USE_DB) {
    try {
      const { getMissionsByDemandeId: getMissionsByDemandeIdDB } = await import("@/repositories/missionsRepo");
      const demandeIdStr = String(demandeId);
      const missions = await getMissionsByDemandeIdDB(demandeIdStr) as any[];
      
      return missions.map(convertPrismaMissionToJSON);
    } catch (error) {
      console.error("Erreur getMissionsByDemandeId (DB):", error);
      return getMissionsByDemandeIdJSON(demandeId);
    }
  } else {
    return getMissionsByDemandeIdJSON(demandeId);
  }
}

/**
 * Récupère une mission par ID
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function getMissionById(id: number): Promise<Mission | null> {
  if (USE_DB) {
    try {
      const { getMissionById: getMissionByIdDB } = await import("@/repositories/missionsRepo");
      // Pour Prisma, on doit trouver la mission par son UUID
      // On va devoir chercher toutes les missions et filtrer par ID converti
      // Ou utiliser une autre méthode selon le schéma
      const { getAllMissions } = await import("@/repositories/missionsRepo");
      const allMissions = await getAllMissions() as any[];
      const mission = allMissions.find((m: any) => {
        let idNumber: number;
        if (typeof m.id === "string" && m.id.includes("-")) {
          const hash = m.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          idNumber = Math.abs(hash) % 1000000;
        } else {
          idNumber = parseInt(String(m.id)) || 0;
        }
        return idNumber === id;
      });
      
      return mission ? convertPrismaMissionToJSON(mission) : null;
    } catch (error) {
      console.error("Erreur getMissionById (DB):", error);
      return getMissionByIdJSON(id);
    }
  } else {
    return getMissionByIdJSON(id);
  }
}

/**
 * Vérifie si une mission existe pour une demande et un prestataire
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function missionExistsForDemandeAndPrestataire(demandeId: number, prestataireId: number): Promise<boolean> {
  if (USE_DB) {
    try {
      const missions = await getMissionsByDemandeId(demandeId);
      return missions.some((m) => m.prestataireId === prestataireId);
    } catch (error) {
      console.error("Erreur missionExistsForDemandeAndPrestataire (DB):", error);
      return missionExistsForDemandeAndPrestataireJSON(demandeId, prestataireId);
    }
  } else {
    return missionExistsForDemandeAndPrestataireJSON(demandeId, prestataireId);
  }
}

/**
 * Crée une nouvelle mission
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function createMission(
  data: Omit<Mission, "id" | "ref" | "createdAt" | "internalState" | "status" | "updates" | "sharedFiles">
): Promise<Mission> {
  if (USE_DB) {
    try {
      const { createMission: createMissionDB, getAllMissions: getAllMissionsDB } = await import("@/repositories/missionsRepo");
      
      // Générer ref et createdAt comme le fait createMission JSON
      const year = new Date().getFullYear();
      const allMissions = await getAllMissionsDB() as any[];
      const nextId = allMissions.length + 1;
      const ref = `M-${year}-${String(nextId).padStart(3, "0")}`;
      const createdAt = new Date().toISOString();
      
      // État interne initial
      const { mapInternalStateToStatus, getProgressFromInternalState } = await import("./types");
      const internalState = "CREATED";
      const status = mapInternalStateToStatus(internalState);
      
      // Helper pour convertir undefined en null pour Prisma
      const undefToNull = <T>(val: T | undefined): T | null => (val === undefined ? null : val);
      
      const mission = await createMissionDB({
        ref,
        createdAt,
        demandeId: String(data.demandeId),
        clientEmail: data.clientEmail,
        prestataireId: data.prestataireId ? String(data.prestataireId) : null,
        prestataireRef: undefToNull(data.prestataireRef),
        internalState,
        status,
        dateAssignation: undefToNull(data.dateAssignation),
        dateLimiteProposition: undefToNull(data.dateLimiteProposition),
        dateAcceptation: undefToNull(data.dateAcceptation),
        datePriseEnCharge: undefToNull(data.datePriseEnCharge),
        dateDebut: undefToNull(data.dateDebut),
        dateFin: undefToNull(data.dateFin),
        titre: data.titre,
        description: data.description,
        serviceType: data.serviceType,
        lieu: undefToNull(data.lieu),
        urgence: data.urgence,
        budget: undefToNull(data.budget),
        tarifPrestataire: undefToNull(data.tarifPrestataire),
        commissionICD: undefToNull(data.commissionICD),
        commissionHybride: undefToNull(data.commissionHybride),
        commissionRisk: undefToNull(data.commissionRisk),
        commissionTotale: undefToNull(data.commissionTotale),
        fraisSupplementaires: undefToNull(data.fraisSupplementaires),
        tarifTotal: undefToNull(data.tarifTotal),
        paiementEchelonne: undefToNull(data.paiementEchelonne),
        sharedFiles: [],
        progress: [],
        currentProgress: getProgressFromInternalState(internalState),
        phases: undefToNull(data.phases),
        delaiMaximal: undefToNull(data.delaiMaximal),
        dateLimiteMission: undefToNull(data.dateLimiteMission),
        updates: [],
        messages: [],
        noteClient: undefToNull(data.noteClient),
        notePrestataire: undefToNull(data.notePrestataire),
        noteICD: undefToNull(data.noteICD),
        noteAdminPourPrestataire: undefToNull(data.noteAdminPourPrestataire),
        commentaireClient: undefToNull(data.commentaireClient),
        commentairePrestataire: undefToNull(data.commentairePrestataire),
        commentaireICD: undefToNull(data.commentaireICD),
        commentaireAdminPourPrestataire: undefToNull(data.commentaireAdminPourPrestataire),
        proofs: [],
        proofSubmissionDate: undefToNull(data.proofSubmissionDate),
        proofValidatedByAdmin: data.proofValidatedByAdmin || false,
        proofValidatedAt: undefToNull(data.proofValidatedAt),
        proofValidatedForClient: data.proofValidatedForClient || false,
        proofValidatedForClientAt: undefToNull(data.proofValidatedForClientAt),
        closedBy: undefToNull(data.closedBy),
        closedAt: undefToNull(data.closedAt),
        devisGenere: data.devisGenere || false,
        devisGenereAt: undefToNull(data.devisGenereAt),
        paiementEffectue: data.paiementEffectue || false,
        paiementEffectueAt: undefToNull(data.paiementEffectueAt),
        avanceVersee: data.avanceVersee || false,
        avanceVerseeAt: undefToNull(data.avanceVerseeAt),
        avancePercentage: undefToNull(data.avancePercentage),
        soldeVersee: data.soldeVersee || false,
        soldeVerseeAt: undefToNull(data.soldeVerseeAt),
        estimationPartenaire: undefToNull(data.estimationPartenaire),
        archived: data.archived || false,
        archivedAt: undefToNull(data.archivedAt),
        archivedBy: undefToNull(data.archivedBy),
        deleted: data.deleted || false,
        deletedAt: undefToNull(data.deletedAt),
        deletedBy: undefToNull(data.deletedBy),
      } as any);

      return convertPrismaMissionToJSON(mission);
    } catch (error) {
      console.error("Erreur createMission (DB):", error);
      return createMissionJSON(data);
    }
  } else {
    return createMissionJSON(data);
  }
}

// Fonction helper pour convertir Mission Prisma vers Mission JSON
function convertPrismaMissionToJSON(mission: any): Mission {
  let idNumber: number;
  if (typeof mission.id === "string" && mission.id.includes("-")) {
    const hash = mission.id.split("").reduce((acc: number, char: string) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    idNumber = Math.abs(hash) % 1000000;
  } else {
    idNumber = parseInt(String(mission.id)) || 0;
  }

  // Helper pour convertir null en undefined
  const nullToUndef = <T>(val: T | null): T | undefined => (val === null ? undefined : val);

  return {
    id: idNumber,
    ref: mission.ref,
    createdAt: mission.createdAt.toISOString(),
    demandeId: parseInt(String(mission.demandeId)) || 0,
    clientEmail: mission.clientEmail,
    prestataireId: mission.prestataireId ? parseInt(String(mission.prestataireId)) : undefined,
    prestataireRef: nullToUndef(mission.prestataireRef),
    internalState: mission.internalState as any,
    status: mission.status as any,
    dateAssignation: mission.dateAssignation?.toISOString(),
    dateLimiteProposition: mission.dateLimiteProposition?.toISOString(),
    dateAcceptation: mission.dateAcceptation?.toISOString(),
    datePriseEnCharge: mission.datePriseEnCharge?.toISOString(),
    dateDebut: mission.dateDebut?.toISOString(),
    dateFin: mission.dateFin?.toISOString(),
    titre: mission.titre,
    description: mission.description,
    serviceType: mission.serviceType,
    lieu: nullToUndef(mission.lieu),
    urgence: mission.urgence,
    budget: nullToUndef(mission.budget),
    tarifPrestataire: nullToUndef(mission.tarifPrestataire),
    commissionICD: nullToUndef(mission.commissionICD),
    commissionHybride: nullToUndef(mission.commissionHybride),
    commissionRisk: nullToUndef(mission.commissionRisk),
    commissionTotale: nullToUndef(mission.commissionTotale),
    fraisSupplementaires: nullToUndef(mission.fraisSupplementaires),
    tarifTotal: nullToUndef(mission.tarifTotal),
    paiementEchelonne: nullToUndef(mission.paiementEchelonne),
    sharedFiles: mission.sharedFiles || [],
    progress: mission.progress || [],
    currentProgress: mission.currentProgress || 0,
    phases: nullToUndef(mission.phases),
    delaiMaximal: nullToUndef(mission.delaiMaximal),
    dateLimiteMission: mission.dateLimiteMission?.toISOString(),
    updates: mission.updates || [],
    messages: mission.messages || [],
    noteClient: nullToUndef(mission.noteClient),
    notePrestataire: nullToUndef(mission.notePrestataire),
    noteICD: nullToUndef(mission.noteICD),
    noteAdminPourPrestataire: nullToUndef(mission.noteAdminPourPrestataire),
    commentaireClient: nullToUndef(mission.commentaireClient),
    commentairePrestataire: nullToUndef(mission.commentairePrestataire),
    commentaireICD: nullToUndef(mission.commentaireICD),
    commentaireAdminPourPrestataire: nullToUndef(mission.commentaireAdminPourPrestataire),
    proofs: mission.proofs || [],
    proofSubmissionDate: mission.proofSubmissionDate?.toISOString(),
    proofValidatedByAdmin: mission.proofValidatedByAdmin || false,
    proofValidatedAt: mission.proofValidatedAt?.toISOString(),
    proofValidatedForClient: mission.proofValidatedForClient || false,
    proofValidatedForClientAt: mission.proofValidatedForClientAt?.toISOString(),
    closedBy: nullToUndef(mission.closedBy),
    closedAt: mission.closedAt?.toISOString(),
    devisGenere: mission.devisGenere || false,
    devisGenereAt: mission.devisGenereAt?.toISOString(),
    paiementEffectue: mission.paiementEffectue || false,
    paiementEffectueAt: mission.paiementEffectueAt?.toISOString(),
    avanceVersee: mission.avanceVersee || false,
    avanceVerseeAt: mission.avanceVerseeAt?.toISOString(),
    avancePercentage: nullToUndef(mission.avancePercentage),
    soldeVersee: mission.soldeVersee || false,
    soldeVerseeAt: mission.soldeVerseeAt?.toISOString(),
    estimationPartenaire: nullToUndef(mission.estimationPartenaire),
    archived: mission.archived || false,
    archivedAt: mission.archivedAt?.toISOString(),
    archivedBy: nullToUndef(mission.archivedBy),
    deleted: mission.deleted || false,
    deletedAt: mission.deletedAt?.toISOString(),
    deletedBy: nullToUndef(mission.deletedBy),
  };
}

async function getMissionsByClientJSON(email: string): Promise<Mission[]> {
  const { getMissionsByClient: getMissionsByClientStore } = await import("./missionsStore");
  return getMissionsByClientStore(email);
}

async function getMissionsByPrestataireJSON(prestataireId: number): Promise<Mission[]> {
  const { getMissionsByPrestataire: getMissionsByPrestataireStore } = await import("./missionsStore");
  return getMissionsByPrestataireStore(prestataireId);
}

async function getMissionsByDemandeIdJSON(demandeId: number): Promise<Mission[]> {
  const { getMissionsByDemandeId: getMissionsByDemandeIdStore } = await import("./missionsStore");
  return getMissionsByDemandeIdStore(demandeId);
}

async function getMissionByIdJSON(id: number): Promise<Mission | null> {
  const { getMissionById: getMissionByIdStore } = await import("./missionsStore");
  return getMissionByIdStore(id) || null;
}

async function missionExistsForDemandeAndPrestataireJSON(demandeId: number, prestataireId: number): Promise<boolean> {
  const { missionExistsForDemandeAndPrestataire: missionExistsStore } = await import("./missionsStore");
  return missionExistsStore(demandeId, prestataireId);
}

async function createMissionJSON(
  data: Omit<Mission, "id" | "ref" | "createdAt" | "internalState" | "status" | "updates" | "sharedFiles">
): Promise<Mission> {
  const { createMission: createMissionStore } = await import("./missionsStore");
  return createMissionStore(data);
}

/**
 * Met à jour l'état interne d'une mission
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function updateMissionInternalState(
  id: number,
  newInternalState: string,
  authorEmail: string
): Promise<Mission | null> {
  if (USE_DB) {
    try {
      // Pour Prisma, utiliser la logique du store JSON qui est complète
      // On récupère la mission, on la met à jour via le store JSON, puis on sauvegarde dans Prisma
      const mission = await getMissionById(id);
      if (!mission) return null;

      // Utiliser la logique complète du store JSON
      const result = await updateMissionInternalStateJSON(id, newInternalState, authorEmail);
      
      if (!result) return null;

      // Sauvegarder dans Prisma
      const { updateMission: updateMissionDB, getAllMissions: getAllMissionsDB } = await import("@/repositories/missionsRepo");
      const allMissions = await getAllMissionsDB() as any[];
      const missionDB = allMissions.find((m: any) => {
        let idNumber: number;
        if (typeof m.id === "string" && m.id.includes("-")) {
          const hash = m.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          idNumber = Math.abs(hash) % 1000000;
        } else {
          idNumber = parseInt(String(m.id)) || 0;
        }
        return idNumber === id;
      });

      if (missionDB) {
        // Convertir la mission mise à jour vers le format Prisma
        const updateData: any = {
          internalState: result.internalState,
          status: result.status,
          currentProgress: result.currentProgress,
          updates: result.updates || [],
          progress: result.progress || [],
          dateAssignation: result.dateAssignation ? new Date(result.dateAssignation) : null,
          dateAcceptation: result.dateAcceptation ? new Date(result.dateAcceptation) : null,
          datePriseEnCharge: result.datePriseEnCharge ? new Date(result.datePriseEnCharge) : null,
          dateDebut: result.dateDebut ? new Date(result.dateDebut) : null,
          dateFin: result.dateFin ? new Date(result.dateFin) : null,
          paiementEffectue: result.paiementEffectue,
          paiementEffectueAt: result.paiementEffectueAt ? new Date(result.paiementEffectueAt) : null,
          avanceVersee: result.avanceVersee,
          avanceVerseeAt: result.avanceVerseeAt ? new Date(result.avanceVerseeAt) : null,
          soldeVersee: result.soldeVersee,
          soldeVerseeAt: result.soldeVerseeAt ? new Date(result.soldeVerseeAt) : null,
          proofSubmissionDate: result.proofSubmissionDate ? new Date(result.proofSubmissionDate) : null,
          proofValidatedByAdmin: result.proofValidatedByAdmin,
          proofValidatedAt: result.proofValidatedAt ? new Date(result.proofValidatedAt) : null,
          proofValidatedForClient: result.proofValidatedForClient,
          proofValidatedForClientAt: result.proofValidatedForClientAt ? new Date(result.proofValidatedForClientAt) : null,
        };

        await updateMissionDB(missionDB.id, updateData);
      }

      return result;
    } catch (error) {
      console.error("Erreur updateMissionInternalState (DB):", error);
      return updateMissionInternalStateJSON(id, newInternalState, authorEmail);
    }
  } else {
    return updateMissionInternalStateJSON(id, newInternalState, authorEmail);
  }
}

/**
 * Ajoute une mise à jour à une mission
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function addMissionUpdate(
  missionId: number,
  update: Omit<MissionUpdate, "id" | "missionId" | "createdAt">
): Promise<MissionUpdate | null> {
  if (USE_DB) {
    try {
      const { updateMission: updateMissionDB, getAllMissions: getAllMissionsDB } = await import("@/repositories/missionsRepo");
      
      // Trouver la mission
      const allMissions = await getAllMissionsDB() as any[];
      const missionDB = allMissions.find((m: any) => {
        let idNumber: number;
        if (typeof m.id === "string" && m.id.includes("-")) {
          const hash = m.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          idNumber = Math.abs(hash) % 1000000;
        } else {
          idNumber = parseInt(String(m.id)) || 0;
        }
        return idNumber === missionId;
      });

      if (!missionDB) return null;

      const updates = missionDB.updates || [];
      const now = new Date().toISOString();
      const newUpdate = {
        id: updates.length + 1,
        missionId,
        ...update,
        createdAt: now,
      };
      updates.push(newUpdate);

      await updateMissionDB(missionDB.id, { updates } as any);

      return newUpdate;
    } catch (error) {
      console.error("Erreur addMissionUpdate (DB):", error);
      return addMissionUpdateJSON(missionId, update);
    }
  } else {
    return addMissionUpdateJSON(missionId, update);
  }
}

/**
 * Vérifie et ferme automatiquement les missions après 24h
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function checkAndAutoCloseMissions(): Promise<number> {
  if (USE_DB) {
    try {
      const { getAllMissions: getAllMissionsDB, updateMission: updateMissionDB } = await import("@/repositories/missionsRepo");
      const allMissions = await getAllMissionsDB() as any[];
      
      const now = new Date();
      let closedCount = 0;

      for (const mission of allMissions) {
        if (
          mission.status === "termine_icd_canada" &&
          mission.proofValidatedForClient &&
          mission.proofValidatedForClientAt
        ) {
          const validatedAt = new Date(mission.proofValidatedForClientAt);
          const hoursSinceValidation = (now.getTime() - validatedAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceValidation >= 24) {
            await updateMissionDB(mission.id, {
              internalState: "COMPLETED",
              status: "cloture",
            } as any);
            closedCount++;
          }
        }
      }

      return closedCount;
    } catch (error) {
      console.error("Erreur checkAndAutoCloseMissions (DB):", error);
      return checkAndAutoCloseMissionsJSON();
    }
  } else {
    return checkAndAutoCloseMissionsJSON();
  }
}

/**
 * Sauvegarde les missions (no-op pour Prisma, car sauvegarde automatique)
 */
export async function saveMissions(): Promise<void> {
  if (!USE_DB) {
    const { saveMissions: saveMissionsStore } = await import("./missionsStore");
    saveMissionsStore();
  }
  // Pour Prisma, la sauvegarde est automatique, donc on ne fait rien
}

async function updateMissionInternalStateJSON(
  id: number,
  newInternalState: string,
  authorEmail: string
): Promise<Mission | null> {
  const { updateMissionInternalState: updateMissionInternalStateStore } = await import("./missionsStore");
  return updateMissionInternalStateStore(id, newInternalState as any, authorEmail);
}

async function addMissionUpdateJSON(
  missionId: number,
  update: Omit<MissionUpdate, "id" | "missionId" | "createdAt">
): Promise<MissionUpdate | null> {
  const { addMissionUpdate: addMissionUpdateStore } = await import("./missionsStore");
  return addMissionUpdateStore(missionId, update as any) as MissionUpdate | null;
}

async function checkAndAutoCloseMissionsJSON(): Promise<number> {
  const { checkAndAutoCloseMissions: checkAndAutoCloseMissionsStore } = await import("./missionsStore");
  return checkAndAutoCloseMissionsStore();
}

/**
 * Met à jour le statut d'une mission (compatibilité)
 * Bascule automatiquement entre JSON et DB selon USE_DB
 */
export async function updateMissionStatus(
  id: number,
  status: string,
  authorEmail: string
): Promise<Mission | null> {
  // Mapper le statut vers l'état interne correspondant
  let internalState: string = "CREATED";
  
  switch (status) {
    case "en_analyse_quebec":
      internalState = "CREATED";
      break;
    case "en_evaluation_partenaire":
      internalState = "ASSIGNED_TO_PROVIDER";
      break;
    case "evaluation_recue_quebec":
      internalState = "PROVIDER_ESTIMATED";
      break;
    case "en_attente_paiement_client":
      internalState = "WAITING_CLIENT_PAYMENT";
      break;
    case "paye_en_attente_demarrage":
      internalState = "PAID_WAITING_TAKEOVER";
      break;
    case "avance_versee_partenaire":
      internalState = "ADVANCE_SENT";
      break;
    case "en_cours_partenaire":
      internalState = "IN_PROGRESS";
      break;
    case "en_validation_quebec":
      internalState = "PROVIDER_VALIDATION_SUBMITTED";
      break;
    case "termine_icd_canada":
      internalState = "ADMIN_CONFIRMED";
      break;
    case "cloture":
      internalState = "COMPLETED";
      break;
  }

  return updateMissionInternalState(id, internalState, authorEmail);
}

// ==================== PROPOSITIONS ====================

/**
 * Convertir une proposition Prisma vers le format JSON
 */
function convertPrismaPropositionToJSON(proposition: any): PropositionPrestataire {
  // Convertir l'UUID en nombre pour compatibilité
  let idNumber: number;
  if (typeof proposition.id === "string" && proposition.id.includes("-")) {
    const hash = proposition.id.split("").reduce((acc: number, char: string) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    idNumber = Math.abs(hash) % 1000000;
  } else {
    idNumber = parseInt(String(proposition.id)) || 0;
  }

  // Convertir demandeId et prestataireId
  let demandeIdNumber: number;
  if (typeof proposition.demandeId === "string" && proposition.demandeId.includes("-")) {
    const hash = proposition.demandeId.split("").reduce((acc: number, char: string) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    demandeIdNumber = Math.abs(hash) % 1000000;
  } else {
    demandeIdNumber = parseInt(String(proposition.demandeId)) || 0;
  }

  let prestataireIdNumber: number;
  if (typeof proposition.prestataireId === "string" && proposition.prestataireId.includes("-")) {
    const hash = proposition.prestataireId.split("").reduce((acc: number, char: string) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    prestataireIdNumber = Math.abs(hash) % 1000000;
  } else {
    prestataireIdNumber = parseInt(String(proposition.prestataireId)) || 0;
  }

  let missionIdNumber: number | null = null;
  if (proposition.missionId) {
    if (typeof proposition.missionId === "string" && proposition.missionId.includes("-")) {
      const hash = proposition.missionId.split("").reduce((acc: number, char: string) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0);
      missionIdNumber = Math.abs(hash) % 1000000;
    } else {
      missionIdNumber = parseInt(String(proposition.missionId)) || 0;
    }
  }

  return {
    id: idNumber,
    ref: proposition.ref,
    createdAt: proposition.createdAt.toISOString(),
    demandeId: demandeIdNumber,
    prestataireId: prestataireIdNumber,
    prix_prestataire: proposition.prix_prestataire,
    delai_estime: proposition.delai_estime,
    commentaire: proposition.commentaire,
    difficulte_estimee: proposition.difficulte_estimee,
    statut: proposition.statut as "en_attente" | "acceptee" | "refusee",
    accepteeAt: proposition.accepteeAt?.toISOString() || null,
    refuseeAt: proposition.refuseeAt?.toISOString() || null,
    accepteeBy: proposition.accepteeBy || null,
    refuseeBy: proposition.refuseeBy || null,
    raisonRefus: proposition.raisonRefus || null,
    missionId: missionIdNumber,
  };
}

/**
 * Récupérer une proposition par ID
 */
export async function getPropositionById(id: number): Promise<PropositionPrestataire | null> {
  if (!id) return null;

  if (USE_DB) {
    try {
      const { getPropositionById: getPropositionByIdDB } = await import("@/repositories/propositionsRepo");
      
      // Convertir l'ID numérique en UUID si nécessaire (pour la recherche)
      // Pour l'instant, on cherche par ref ou on utilise une autre méthode
      // Note: Dans Prisma, les IDs sont des UUIDs, donc on doit chercher différemment
      // On va devoir charger toutes les propositions et filtrer, ou utiliser une autre stratégie
      // Pour l'instant, on utilise le fallback JSON
      return getPropositionByIdJSON(id);
    } catch (error) {
      console.error("Erreur getPropositionById (DB):", error);
      return getPropositionByIdJSON(id);
    }
  } else {
    return getPropositionByIdJSON(id);
  }
}

/**
 * Récupérer toutes les propositions pour une demande
 */
export async function getPropositionsByDemandeId(demandeId: number): Promise<PropositionPrestataire[]> {
  if (!demandeId) return [];

  if (USE_DB) {
    try {
      const { getPropositionsByDemandeId: getPropositionsByDemandeIdDB } = await import("@/repositories/propositionsRepo");
      const { getDemandeById } = await import("@/lib/dataAccess");
      
      // Récupérer la demande pour obtenir son UUID
      const demande = await getDemandeById(demandeId);
      if (!demande) return [];

      // Convertir l'ID numérique en UUID
      // On doit trouver la demande dans la DB pour obtenir son UUID
      const { getAllDemandes } = await import("@/repositories/demandesRepo");
      const allDemandes = await getAllDemandes();
      const demandeDB = allDemandes.find((d: any) => {
        // Convertir l'UUID de la demande en nombre pour comparer
        if (typeof d.id === "string" && d.id.includes("-")) {
          const hash = d.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          const idNumber = Math.abs(hash) % 1000000;
          return idNumber === demandeId;
        }
        return parseInt(String(d.id)) === demandeId;
      });

      if (!demandeDB) return [];

      const propositions = await getPropositionsByDemandeIdDB(demandeDB.id);
      return propositions.map(convertPrismaPropositionToJSON);
    } catch (error) {
      console.error("Erreur getPropositionsByDemandeId (DB):", error);
      return getPropositionsByDemandeIdJSON(demandeId);
    }
  } else {
    return getPropositionsByDemandeIdJSON(demandeId);
  }
}

/**
 * Récupérer toutes les propositions pour un prestataire
 */
export async function getPropositionsByPrestataireId(prestataireId: number): Promise<PropositionPrestataire[]> {
  if (!prestataireId) return [];

  if (USE_DB) {
    try {
      const { getPropositionsByPrestataireId: getPropositionsByPrestataireIdDB } = await import("@/repositories/propositionsRepo");
      const { getPrestataireByEmail } = await import("@/lib/dataAccess");
      
      // On doit trouver le prestataire dans la DB pour obtenir son UUID
      // Pour l'instant, on utilise le fallback JSON car on n'a pas l'email
      return getPropositionsByPrestataireIdJSON(prestataireId);
    } catch (error) {
      console.error("Erreur getPropositionsByPrestataireId (DB):", error);
      return getPropositionsByPrestataireIdJSON(prestataireId);
    }
  } else {
    return getPropositionsByPrestataireIdJSON(prestataireId);
  }
}

/**
 * Créer une nouvelle proposition
 */
export async function createProposition(
  data: Omit<PropositionPrestataire, "id" | "ref" | "createdAt" | "statut" | "accepteeAt" | "refuseeAt" | "accepteeBy" | "refuseeBy" | "raisonRefus" | "missionId">
): Promise<PropositionPrestataire> {
  if (USE_DB) {
    try {
      const { createProposition: createPropositionDB } = await import("@/repositories/propositionsRepo");
      const { getDemandeById, getPrestataireByEmail } = await import("@/lib/dataAccess");
      
      // Récupérer la demande et le prestataire pour obtenir leurs UUIDs
      const demande = await getDemandeById(data.demandeId);
      const prestataire = await getPrestataireByEmail(""); // On n'a pas l'email ici
      
      if (!demande) {
        throw new Error("Demande non trouvée");
      }

      // Trouver les UUIDs dans la DB
      const { getAllDemandes } = await import("@/repositories/demandesRepo");
      const allDemandes = await getAllDemandes();
      const demandeDB = allDemandes.find((d: any) => {
        if (typeof d.id === "string" && d.id.includes("-")) {
          const hash = d.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          const idNumber = Math.abs(hash) % 1000000;
          return idNumber === data.demandeId;
        }
        return parseInt(String(d.id)) === data.demandeId;
      });

      if (!demandeDB) {
        throw new Error("Demande non trouvée dans la DB");
      }

      // Trouver le prestataire dans la DB
      const { getAllPrestataires } = await import("@/repositories/prestatairesRepo");
      const allPrestataires = await getAllPrestataires();
      const prestataireDB = allPrestataires.find((p: any) => {
        if (typeof p.id === "string" && p.id.includes("-")) {
          const hash = p.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          const idNumber = Math.abs(hash) % 1000000;
          return idNumber === data.prestataireId;
        }
        return parseInt(String(p.id)) === data.prestataireId;
      });

      if (!prestataireDB) {
        throw new Error("Prestataire non trouvé dans la DB");
      }

      // Générer la ref
      const year = new Date().getFullYear();
      const { getPropositionsByDemandeId: getPropositionsByDemandeIdDB } = await import("@/repositories/propositionsRepo");
      const existingPropositions = await getPropositionsByDemandeIdDB(demandeDB.id);
      const nextId = existingPropositions.length + 1;
      const ref = `PROP-${year}-${String(nextId).padStart(3, "0")}`;

      const proposition = await createPropositionDB({
        ref,
        demandeId: demandeDB.id,
        prestataireId: prestataireDB.id,
        prix_prestataire: data.prix_prestataire,
        delai_estime: data.delai_estime,
        commentaire: data.commentaire,
        difficulte_estimee: data.difficulte_estimee,
      });

      return convertPrismaPropositionToJSON(proposition);
    } catch (error) {
      console.error("Erreur createProposition (DB):", error);
      return createPropositionJSON(data);
    }
  } else {
    return createPropositionJSON(data);
  }
}

/**
 * Mettre à jour le statut d'une proposition
 */
export async function updatePropositionStatut(
  id: number,
  statut: "en_attente" | "acceptee" | "refusee",
  adminEmail: string,
  missionId?: number | null,
  raisonRefus?: string
): Promise<PropositionPrestataire | null> {
  if (USE_DB) {
    try {
      // Pour l'instant, on utilise le fallback JSON car la conversion ID <-> UUID est complexe
      return updatePropositionStatutJSON(id, statut, adminEmail, missionId, raisonRefus);
    } catch (error) {
      console.error("Erreur updatePropositionStatut (DB):", error);
      return updatePropositionStatutJSON(id, statut, adminEmail, missionId, raisonRefus);
    }
  } else {
    return updatePropositionStatutJSON(id, statut, adminEmail, missionId, raisonRefus);
  }
}

/**
 * Vérifier si une proposition existe pour une demande et un prestataire
 */
export async function propositionExistsForDemandeAndPrestataire(
  demandeId: number,
  prestataireId: number
): Promise<boolean> {
  if (USE_DB) {
    try {
      // Pour l'instant, on utilise le fallback JSON
      return propositionExistsForDemandeAndPrestataireJSON(demandeId, prestataireId);
    } catch (error) {
      console.error("Erreur propositionExistsForDemandeAndPrestataire (DB):", error);
      return propositionExistsForDemandeAndPrestataireJSON(demandeId, prestataireId);
    }
  } else {
    return propositionExistsForDemandeAndPrestataireJSON(demandeId, prestataireId);
  }
}

// Fonctions JSON fallback
async function getPropositionByIdJSON(id: number): Promise<PropositionPrestataire | null> {
  const { getPropositionById: getPropositionByIdStore } = await import("./propositionsStore");
  return getPropositionByIdStore(id) || null;
}

async function getPropositionsByDemandeIdJSON(demandeId: number): Promise<PropositionPrestataire[]> {
  const { getPropositionsByDemandeId: getPropositionsByDemandeIdStore } = await import("./propositionsStore");
  return getPropositionsByDemandeIdStore(demandeId);
}

async function getPropositionsByPrestataireIdJSON(prestataireId: number): Promise<PropositionPrestataire[]> {
  const { getPropositionsByPrestataireId: getPropositionsByPrestataireIdStore } = await import("./propositionsStore");
  return getPropositionsByPrestataireIdStore(prestataireId);
}

async function createPropositionJSON(
  data: Omit<PropositionPrestataire, "id" | "ref" | "createdAt" | "statut" | "accepteeAt" | "refuseeAt" | "accepteeBy" | "refuseeBy" | "raisonRefus" | "missionId">
): Promise<PropositionPrestataire> {
  const { addProposition: addPropositionStore } = await import("./propositionsStore");
  return addPropositionStore(data);
}

async function updatePropositionStatutJSON(
  id: number,
  statut: "en_attente" | "acceptee" | "refusee",
  adminEmail: string,
  missionId?: number | null,
  raisonRefus?: string
): Promise<PropositionPrestataire | null> {
  const { updatePropositionStatut: updatePropositionStatutStore } = await import("./propositionsStore");
  return updatePropositionStatutStore(id, statut, adminEmail, missionId ?? undefined, raisonRefus);
}

async function propositionExistsForDemandeAndPrestataireJSON(
  demandeId: number,
  prestataireId: number
): Promise<boolean> {
  const { getPropositionsByPrestataireId: getPropositionsByPrestataireIdStore } = await import("./propositionsStore");
  const propositions = getPropositionsByPrestataireIdStore(prestataireId);
  return propositions.some((p) => p.demandeId === demandeId && p.statut === "en_attente");
}

async function getPrestataireNoteMoyenneFromDB(prestataireId: number): Promise<number> {
  const { getAllPrestataires } = await import("@/repositories/prestatairesRepo");
  const { USE_DB } = await import("@/lib/dbFlag");
  
  if (USE_DB) {
    try {
      const allPrestataires = await getAllPrestataires();
      const prestataire = allPrestataires.find((p: any) => {
        if (typeof p.id === "string" && p.id.includes("-")) {
          const hash = p.id.split("").reduce((acc: number, char: string) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
          }, 0);
          const idNumber = Math.abs(hash) % 1000000;
          return idNumber === prestataireId;
        }
        return parseInt(String(p.id)) === prestataireId;
      });
      // Le modèle Prisma Prestataire n'a pas noteMoyenne, donc on retourne 0
      // On devrait charger depuis le JSON store pour obtenir cette valeur
      return 0;
    } catch (error) {
      console.error("Erreur getPrestataireNoteMoyenneFromDB:", error);
      return 0;
    }
  } else {
    const { prestatairesStore } = await import("@/lib/prestatairesStore");
    const prestataire = prestatairesStore.find((p) => p.id === prestataireId);
    return prestataire?.noteMoyenne || 0;
  }
}

/**
 * Mettre à jour un prestataire
 */
export async function updatePrestataire(
  id: number,
  updates: Partial<Prestataire>
): Promise<Prestataire | null> {
  if (USE_DB) {
    try {
      // Pour l'instant, on utilise le fallback JSON car la conversion ID <-> UUID est complexe
      return updatePrestataireJSON(id, updates);
    } catch (error) {
      console.error("Erreur updatePrestataire (DB):", error);
      return updatePrestataireJSON(id, updates);
    }
  } else {
    return updatePrestataireJSON(id, updates);
  }
}

/**
 * Mettre à jour le statut d'une demande
 */
export async function updateDemandeStatus(
  demandeId: number,
  newStatus: "en_attente" | "rejetee" | "acceptee",
  raisonRejet?: string
): Promise<DemandeICD | null> {
  if (USE_DB) {
    try {
      // Pour l'instant, on utilise le fallback JSON car la conversion ID <-> UUID est complexe
      return updateDemandeStatusJSON(demandeId, newStatus, raisonRejet);
    } catch (error) {
      console.error("Erreur updateDemandeStatus (DB):", error);
      return updateDemandeStatusJSON(demandeId, newStatus, raisonRejet);
    }
  } else {
    return updateDemandeStatusJSON(demandeId, newStatus, raisonRejet);
  }
}

// Fonctions JSON fallback
async function updatePrestataireJSON(
  id: number,
  updates: Partial<Prestataire>
): Promise<Prestataire | null> {
  const { updatePrestataire: updatePrestataireStore } = await import("./prestatairesStore");
  return updatePrestataireStore(id, updates);
}

async function updateDemandeStatusJSON(
  demandeId: number,
  newStatus: "en_attente" | "rejetee" | "acceptee",
  raisonRejet?: string
): Promise<DemandeICD | null> {
  const { updateDemandeStatus: updateDemandeStatusStore } = await import("./demandesStore");
  return updateDemandeStatusStore(demandeId, newStatus, raisonRejet);
}

/**
 * Recalculer la note moyenne d'un prestataire
 */
export async function recalculatePrestataireRating(prestataireId: number): Promise<void> {
  if (USE_DB) {
    try {
      // Pour l'instant, on utilise le fallback JSON car le calcul nécessite les missions
      return recalculatePrestataireRatingJSON(prestataireId);
    } catch (error) {
      console.error("Erreur recalculatePrestataireRating (DB):", error);
      return recalculatePrestataireRatingJSON(prestataireId);
    }
  } else {
    return recalculatePrestataireRatingJSON(prestataireId);
  }
}

async function recalculatePrestataireRatingJSON(prestataireId: number): Promise<void> {
  const { recalculatePrestataireRating: recalculatePrestataireRatingStore } = await import("./prestatairesStore");
  return recalculatePrestataireRatingStore(prestataireId);
}

/**
 * Supprimer un prestataire (soft delete)
 */
export async function softDeletePrestataire(
  id: number,
  deletedBy: string
): Promise<Prestataire | null> {
  if (USE_DB) {
    try {
      // Pour l'instant, on utilise le fallback JSON car la conversion ID <-> UUID est complexe
      return softDeletePrestataireJSON(id, deletedBy);
    } catch (error) {
      console.error("Erreur softDeletePrestataire (DB):", error);
      return softDeletePrestataireJSON(id, deletedBy);
    }
  } else {
    return softDeletePrestataireJSON(id, deletedBy);
  }
}

async function softDeletePrestataireJSON(
  id: number,
  deletedBy: string
): Promise<Prestataire | null> {
  const { softDeletePrestataire: softDeletePrestataireStore } = await import("./prestatairesStore");
  return softDeletePrestataireStore(id, deletedBy);
}

