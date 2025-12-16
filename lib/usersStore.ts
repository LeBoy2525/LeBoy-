


// lib/usersStore.ts

import { loadFromFile, saveToFileAsync } from "./persistence";

export type User = {
    id: number;
    email: string;
    passwordHash: string; // Hash bcrypt
    fullName: string;
    createdAt: string;
    lastLogin?: string;
    emailVerified: boolean; // Email vérifié ou non
    verificationCode?: string; // Code de vérification
    verificationCodeExpires?: string; // Date d'expiration du code (ISO)
    country?: string; // Pays de résidence
  };
  
  type GlobalStore = {
    _icdUsers?: User[];
    _icdUsersLoaded?: boolean;
  };
  
  const globalStore = globalThis as typeof globalThis & GlobalStore;
  
  // Initialiser le store depuis le fichier
  if (!globalStore._icdUsers) {
    globalStore._icdUsers = [];
    globalStore._icdUsersLoaded = false;
    
    // Charger les données au démarrage (asynchrone)
    loadFromFile<User>("users.json").then((data) => {
      if (data.length > 0) {
        globalStore._icdUsers = data;
        console.log(`✅ ${data.length} utilisateur(s) chargé(s) depuis le fichier`);
      }
      globalStore._icdUsersLoaded = true;
    }).catch((error) => {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      globalStore._icdUsersLoaded = true;
    });
  }
  
  export const usersStore = globalStore._icdUsers;

  // Fonction pour sauvegarder les utilisateurs
  function saveUsers() {
    saveToFileAsync("users.json", usersStore);
  }
  
  export function createUser(
    email: string,
    passwordHash: string,
    fullName: string,
    country?: string
  ): User {
    const nextId = usersStore.length > 0 
      ? usersStore[usersStore.length - 1].id + 1 
      : 1;
  
    const user: User = {
      id: nextId,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      createdAt: new Date().toISOString(),
      emailVerified: false,
      country,
    };
  
    usersStore.push(user);
    saveUsers(); // Sauvegarder après ajout
    return user;
  }

  export function setVerificationCode(email: string, code: string): void {
    const user = getUserByEmail(email);
    if (user) {
      user.verificationCode = code;
      // Code valide pendant 24 heures
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      user.verificationCodeExpires = expiresAt.toISOString();
      saveUsers();
    }
  }

  export function verifyEmail(email: string, code: string): boolean {
    const user = getUserByEmail(email);
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

    // Activer le compte
    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    saveUsers();
    return true;
  }
  
  export function getUserByEmail(email: string): User | undefined {
    return usersStore.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  export function updateLastLogin(email: string): void {
    const user = getUserByEmail(email);
    if (user) {
      user.lastLogin = new Date().toISOString();
      saveUsers(); // Sauvegarder après modification
    }
  }