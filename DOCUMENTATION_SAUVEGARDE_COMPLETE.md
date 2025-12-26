# 📚 Documentation de Sauvegarde Complète - LeBoy Platform

**Date de dernière mise à jour :** 24 janvier 2025  
**Version :** 1.0.0

Ce document contient toutes les informations nécessaires pour reprendre le projet depuis zéro en cas de perte de données ou de code.

---

## 📋 Table des Matières

1. [Architecture du Projet](#architecture-du-projet)
2. [Arborescence Complète](#arborescence-complète)
3. [Installation et Configuration](#installation-et-configuration)
4. [Base de Données et Migrations](#base-de-données-et-migrations)
5. [Fonctionnalités Récentes](#fonctionnalités-récentes)
6. [Variables d'Environnement](#variables-denvironnement)
7. [Structure des Modèles Prisma](#structure-des-modèles-prisma)
8. [Workflow Complet](#workflow-complet)
9. [Commandes Essentielles](#commandes-essentielles)
10. [Dépannage](#dépannage)

---

## 🏗️ Architecture du Projet

### Stack Technologique

- **Framework :** Next.js 16.0.10 (App Router)
- **Langage :** TypeScript 5.x
- **Base de données :** PostgreSQL (via Prisma ORM 7.1.0)
- **Authentification :** Iron Session + Bcrypt
- **Email :** Resend API
- **Paiement :** Stripe
- **Stockage fichiers :** Vercel Blob Storage (production) / Local (développement)
- **Styling :** Tailwind CSS 4.x
- **Icons :** Lucide React

### Structure Générale

```
LeBoy Platform
├── Frontend (Next.js App Router)
│   ├── Pages publiques (/, /services, /contact, etc.)
│   ├── Espace client (/espace-client)
│   ├── Espace prestataire (/prestataires/espace)
│   └── Espace admin (/admin)
├── API Routes (app/api/)
│   ├── Authentification
│   ├── Demandes
│   ├── Missions
│   ├── Prestataires
│   └── Paiements
├── Base de données (PostgreSQL + Prisma)
│   ├── Modèles principaux (User, Demande, Mission, Prestataire, etc.)
│   └── Migrations Prisma
└── Services externes
    ├── Resend (emails)
    ├── Stripe (paiements)
    └── Vercel Blob (stockage)
```

---

## 📁 Arborescence Complète

```
icd-frontend-new/
├── app/                          # Application Next.js (App Router)
│   ├── admin/                    # Espace administrateur
│   │   ├── page.tsx             # Dashboard admin
│   │   ├── demandes/            # Gestion des demandes
│   │   │   ├── page.tsx         # Liste des demandes
│   │   │   └── [id]/            # Détails d'une demande
│   │   ├── prestataires/        # Gestion des prestataires
│   │   │   ├── page.tsx         # Liste des prestataires
│   │   │   └── [id]/            # Détails d'un prestataire
│   │   └── missions/            # Gestion des missions
│   ├── api/                      # Routes API
│   │   ├── admin/               # Routes admin
│   │   ├── demandes/            # Routes demandes
│   │   ├── missions/            # Routes missions
│   │   ├── prestataires/        # Routes prestataires
│   │   ├── espace-client/       # Routes espace client
│   │   └── auth/                # Routes authentification
│   ├── components/               # Composants React réutilisables
│   │   ├── MissionProgressBar.tsx
│   │   ├── MissionChat.tsx
│   │   ├── MissionProofView.tsx
│   │   ├── PrestataireTypeBadge.tsx  # NOUVEAU : Badge type prestataire
│   │   └── ...
│   ├── espace-client/            # Espace client
│   │   ├── page.tsx             # Dashboard client
│   │   ├── dossier/             # Pages dossiers
│   │   └── mission/             # Pages missions
│   ├── prestataires/             # Espace prestataire
│   │   ├── inscription/         # Inscription prestataire
│   │   ├── connexion/           # Connexion prestataire
│   │   └── espace/              # Espace prestataire
│   ├── connexion/                # Connexion client
│   ├── inscription/              # Inscription client
│   └── page.tsx                  # Page d'accueil
├── lib/                          # Bibliothèques et utilitaires
│   ├── dataAccess.ts            # Couche d'accès aux données (JSON/Prisma)
│   ├── auth.ts                  # Authentification
│   ├── emailService.ts          # Service d'envoi d'emails
│   ├── filesStore.ts            # Gestion des fichiers
│   ├── matching.ts              # Algorithme de matching prestataires
│   ├── prestatairesStore.ts     # Types et stores prestataires
│   └── ...
├── repositories/                 # Repositories Prisma
│   ├── missionsRepo.ts          # Repository missions
│   ├── demandesRepo.ts          # Repository demandes
│   ├── prestatairesRepo.ts      # Repository prestataires
│   ├── propositionsRepo.ts      # Repository propositions
│   └── ...
├── prisma/                       # Configuration Prisma
│   ├── schema.prisma            # Schéma de la base de données
│   ├── seed.ts                  # Script de seed initial
│   └── migrations/               # Migrations Prisma
│       └── [timestamp]_[name]/  # Migrations individuelles
├── data/                         # Données JSON (fallback/legacy)
│   ├── demandes.json
│   ├── missions.json
│   ├── prestataires.json
│   └── ...
├── storage/                      # Stockage local des fichiers
├── scripts/                      # Scripts utilitaires
│   ├── migrate-json-to-db.ts   # Migration JSON → DB
│   └── ...
├── docker-compose.yml            # Configuration Docker (PostgreSQL + Mailpit)
├── package.json                  # Dépendances npm
├── tsconfig.json                 # Configuration TypeScript
├── next.config.ts                # Configuration Next.js
└── README.md                     # Documentation principale
```

---

## 🚀 Installation et Configuration

### Prérequis

- **Node.js** : Version 20.9.0+ (voir `.nvmrc`)
- **Docker** : Pour PostgreSQL et Mailpit
- **Git** : Pour cloner le projet
- **npm** : Version 10.x ou supérieure

### Installation Complète

```bash
# 1. Cloner le projet
git clone <repository-url>
cd icd-frontend-new

# 2. Installer les dépendances
npm ci

# 3. Configurer l'environnement
# Créer .env.local avec les variables (voir section Variables d'Environnement)

# 4. Démarrer PostgreSQL et Mailpit
npm run docker:up

# 5. Générer le client Prisma
npm run db:generate

# 6. Appliquer les migrations
npm run db:migrate

# 7. Seed les données initiales
npm run db:seed

# 8. Démarrer le serveur de développement
npm run dev
```

### Vérification de l'Installation

```bash
# Vérifier que PostgreSQL est accessible
npm run db:studio  # Ouvre Prisma Studio sur http://localhost:5555

# Vérifier que Mailpit fonctionne
# Ouvrir http://localhost:8025

# Vérifier l'API
curl http://localhost:3000/api/health
```

---

## 🗄️ Base de Données et Migrations

### Schéma Prisma Principal

Le schéma complet est dans `prisma/schema.prisma`. Modèles principaux :

- **User** : Utilisateurs (admin, client, prestataire)
- **Demande** : Demandes de services des clients
- **Prestataire** : Prestataires du réseau LeBoy
- **Mission** : Missions assignées aux prestataires
- **Proposition** : Propositions de prestataires pour les demandes
- **File** : Fichiers uploadés
- **AdminNotification** : Notifications admin
- **EmailLog** : Logs des emails envoyés
- **CommissionConfig** : Configuration des commissions
- **Country** : Pays disponibles
- **ServiceCategory** : Catégories de services
- **MissionRefCounter** : Compteur pour génération des références

### Migrations Importantes

1. **Migration initiale** : Création de toutes les tables
2. **Migration typePrestataire** : Ajout du champ `typePrestataire` (entreprise/freelance)
   - Fichier : `prisma/migrations/20250123000000_add_prestataire_type/migration.sql`
   - Ajoute la colonne `typePrestataire` avec valeur par défaut `"freelance"`

### Commandes de Migration

```bash
# Créer une nouvelle migration
npm run db:migrate

# Appliquer les migrations en production
npm run db:migrate:prod

# Réinitialiser la base (⚠️ supprime toutes les données)
npm run db:reset

# Visualiser les données
npm run db:studio
```

---

## ✨ Fonctionnalités Récentes

### 1. Classification des Prestataires (Janvier 2025)

**Objectif :** Permettre la classification des prestataires en "entreprise" ou "freelance".

**Implémentation :**

- **Base de données :**
  - Ajout du champ `typePrestataire` dans le modèle `Prestataire`
  - Valeur par défaut : `"freelance"`
  - Valeurs possibles : `"entreprise"` | `"freelance"`

- **Formulaire d'inscription :**
  - Ajout d'une sélection de type au début du formulaire
  - Boutons radio avec icônes (Building2 pour entreprise, User pour freelance)
  - Fichier : `app/prestataires/inscription/page.tsx`

- **Interface admin :**
  - Badge visuel dans la liste des prestataires (`PrestataireTypeBadge.tsx`)
  - Filtres par type (Tous / Entreprises / Freelances)
  - Statistiques par type dans le dashboard
  - Badge dans l'interface d'assignation de missions
  - Fichiers modifiés :
    - `app/admin/prestataires/page.tsx`
    - `app/admin/prestataires/[id]/page.tsx`
    - `app/admin/demandes/[id]/page.tsx`
    - `app/admin/page.tsx`

- **Composant réutilisable :**
  - `app/components/PrestataireTypeBadge.tsx`
  - Variantes : default, outline, minimal
  - Tailles : sm, md, lg

### 2. Correction Affichage Preuves Client (Janvier 2025)

**Problème :** Le client ne voyait pas les preuves après validation admin.

**Solution :**

- **Frontend :** Condition d'affichage assouplie
  - Affiche les preuves si `proofValidatedForClient === true` OU si `internalState === "ADMIN_CONFIRMED"` ou `"COMPLETED"`
  - Fichier : `app/espace-client/mission/[id]/page.tsx`

- **API :** Vérification d'accès assouplie
  - Autorise l'accès si la mission est confirmée, même si `proofValidatedForClient` n'est pas explicitement `true`
  - Fichier : `app/api/missions/[id]/proofs/route.ts`

### 3. Amélioration Section "Mission Assignée" (Janvier 2025)

**Améliorations :**

- Design amélioré avec gradient et bordure interactive
- Badge vert si les preuves sont disponibles
- Bouton "Voir les détails" avec animations
- Lien vers `/espace-client/mission/[id]` pour accéder aux détails complets
- Fichier : `app/espace-client/dossier/[id]/[ref]/page.tsx`

### 4. Section "Besoin d'une Correction" (Janvier 2025)

- Ajoutée dans la page de détails de la mission client
- Style cohérent avec la page dossier
- Fichier : `app/espace-client/mission/[id]/page.tsx`

---

## 🔐 Variables d'Environnement

### Variables Requises

Créer un fichier `.env.local` avec les variables suivantes :

```env
# Base de données
DATABASE_URL="postgresql://leboy:leboy_dev_password@localhost:5432/leboy_dev"
USE_DB="true"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentification
IRON_SESSION_SECRET="votre-secret-session-tres-long-et-securise"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@leboy.com"

# Stripe (optionnel pour développement)
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxx"

# Vercel Blob Storage (production)
BLOB_READ_WRITE_TOKEN="vercel_blob_xxxxxxxxxxxxx"

# Environnement
NODE_ENV="development"
```

### Variables pour Production (Vercel)

Voir `VERCEL_ENV_VARIABLES.md` pour la liste complète des variables à configurer dans Vercel.

---

## 📊 Structure des Modèles Prisma

### Modèle Prestataire (Mis à jour)

```prisma
model Prestataire {
  id                    String   @id @default(uuid())
  ref                   String   @unique
  createdAt             DateTime @default(now())
  
  nomEntreprise         String
  nomContact           String
  email                 String   @unique
  phone                 String
  adresse              String
  ville                String
  
  specialites          String[]
  zonesIntervention    String[]
  
  typePrestataire      String   @default("freelance") // NOUVEAU
  
  passwordHash          String?
  statut               String   @default("en_attente")
  
  // ... autres champs
  
  @@map("prestataires")
}
```

### Modèle Mission

```prisma
model Mission {
  id                    String   @id @default(uuid())
  ref                   String   @unique
  demandeId             String
  clientEmail           String
  prestataireId         String?
  
  internalState         String
  status                String
  
  // Preuves
  proofs                Json?
  proofValidatedByAdmin Boolean  @default(false)
  proofValidatedForClient Boolean @default(false)
  proofValidatedForClientAt DateTime?
  
  // ... autres champs
  
  @@map("missions")
}
```

---

## 🔄 Workflow Complet

### 1. Création d'une Demande

1. Client remplit le formulaire de demande
2. Demande créée avec statut `"en_attente"`
3. Admin reçoit une notification

### 2. Assignation d'une Mission

1. Admin consulte la demande
2. Algorithme de matching suggère des prestataires
3. Admin sélectionne un ou plusieurs prestataires
4. Mission(s) créée(s) avec statut `"CREATED"`
5. Email envoyé aux prestataires sélectionnés

### 3. Proposition du Prestataire

1. Prestataire consulte la mission
2. Prestataire soumet une proposition (prix, délai, commentaire)
3. Proposition créée avec statut `"en_attente"`
4. Admin reçoit une notification

### 4. Sélection du Gagnant

1. Admin consulte les propositions
2. Admin sélectionne le prestataire gagnant
3. Proposition acceptée, autres refusées
4. Mission du gagnant passe à `"ASSIGNED_TO_PROVIDER"`
5. Emails envoyés (gagnant + perdants)

### 5. Exécution de la Mission

1. Prestataire accepte la mission
2. Mission passe à `"IN_PROGRESS"`
3. Prestataire soumet des preuves
4. Mission passe à `"PROVIDER_VALIDATION_SUBMITTED"`

### 6. Validation Admin

1. Admin consulte les preuves
2. Admin valide ou rejette
3. Si validé : Mission passe à `"ADMIN_CONFIRMED"`
4. Client peut voir les preuves
5. Email envoyé au client

### 7. Fermeture de la Mission

1. Client valide la mission
2. Mission passe à `"COMPLETED"`
3. Mission fermée automatiquement après 24h si non fermée manuellement

---

## 🛠️ Commandes Essentielles

### Développement

```bash
npm run dev              # Démarrer le serveur de développement
npm run build            # Build de production
npm run start            # Démarrer le serveur de production
npm run lint             # Linter le code
```

### Base de Données

```bash
npm run db:generate      # Générer le client Prisma
npm run db:migrate       # Créer/appliquer une migration
npm run db:migrate:prod  # Appliquer migrations en production
npm run db:studio        # Ouvrir Prisma Studio
npm run db:seed          # Seed les données initiales
npm run db:reset         # ⚠️ Réinitialiser la DB
```

### Docker

```bash
npm run docker:up        # Démarrer PostgreSQL et Mailpit
npm run docker:down      # Arrêter les services
npm run docker:logs      # Voir les logs
```

### Tests

```bash
npm test                 # Lancer tous les tests
npm run test:watch       # Mode watch
npm run test:smoke       # Tests de fumée uniquement
```

---

## 🐛 Dépannage

### Problème : "Cannot connect to database"

1. Vérifier que Docker est démarré : `docker ps`
2. Vérifier que PostgreSQL est actif : `docker ps | grep postgres`
3. Vérifier la `DATABASE_URL` dans `.env.local`
4. Redémarrer Docker : `npm run docker:down && npm run docker:up`

### Problème : "Prisma Client not generated"

```bash
npm run db:generate
```

### Problème : "Migration failed"

1. Vérifier que PostgreSQL est démarré
2. Vérifier la `DATABASE_URL`
3. Essayer : `npm run db:reset` (⚠️ supprime les données)

### Problème : "Port 3000 already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill
```

### Problème : Les preuves ne s'affichent pas pour le client

1. Vérifier que `proofValidatedForClient` est `true` OU que `internalState === "ADMIN_CONFIRMED"`
2. Vérifier les logs de l'API : `/api/missions/[id]/proofs`
3. Vérifier que la mission est bien celle du prestataire gagnant

---

## 📝 Notes Importantes

### Migration JSON → Prisma

Le projet utilise un système hybride :
- **Production :** Prisma + PostgreSQL (`USE_DB=true`)
- **Fallback :** Stores JSON (`USE_DB=false`)

La couche `lib/dataAccess.ts` gère automatiquement le switch entre les deux.

### Génération des Références

Les références sont générées via le modèle `MissionRefCounter` :
- Format : `M-2025-001`, `D-2025-001`, `P-2025-001`
- Génération atomique pour éviter les doublons

### Stockage des Fichiers

- **Développement :** Stockage local dans `storage/`
- **Production :** Vercel Blob Storage
- Les fichiers sont référencés via le modèle `File` avec `storageKey` et `storageUrl`

### Emails

- **Développement :** Mailpit (http://localhost:8025)
- **Production :** Resend API
- Tous les emails sont loggés dans `EmailLog`

---

## 🔗 Ressources Utiles

- **Documentation Next.js :** https://nextjs.org/docs
- **Documentation Prisma :** https://www.prisma.io/docs
- **Documentation Resend :** https://resend.com/docs
- **Documentation Stripe :** https://stripe.com/docs
- **Documentation Vercel Blob :** https://vercel.com/docs/storage/vercel-blob

---

## 📅 Historique des Versions

### Version 1.0.0 (24 janvier 2025)

- ✅ Classification des prestataires (entreprise/freelance)
- ✅ Correction affichage preuves client
- ✅ Amélioration section "Mission assignée"
- ✅ Ajout section "Besoin d'une correction"
- ✅ Badges visuels pour types de prestataires
- ✅ Filtres et statistiques par type dans l'admin

---

## ✅ Checklist de Vérification Post-Installation

Après une installation complète, vérifier que :

- [ ] PostgreSQL est accessible (`npm run db:studio`)
- [ ] Les migrations sont appliquées
- [ ] Le seed a créé l'admin et les données de base
- [ ] L'API health check répond (`/api/health`)
- [ ] Mailpit est accessible (`http://localhost:8025`)
- [ ] Vous pouvez vous connecter avec l'admin
- [ ] Les tests de fumée passent
- [ ] Le formulaire d'inscription prestataire fonctionne avec le type
- [ ] Les badges de type s'affichent dans l'admin
- [ ] Les preuves s'affichent pour le client après validation admin

---

**Fin du Document**

*Ce document doit être mis à jour à chaque modification importante du projet.*

