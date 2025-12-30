# 📊 Schéma de Données - Documentation Complète pour Audit

**Document préparé pour audit externe - Modèle de données et relations**

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Modèles Principaux](#modèles-principaux)
3. [Relations et Contraintes](#relations-et-contraintes)
4. [Champs JSONB et Structures Complexes](#champs-jsonb-et-structures-complexes)
5. [Index et Performance](#index-et-performance)
6. [Types et Validations](#types-et-validations)

---

## 🎯 Vue d'Ensemble

### Base de Données

- **SGBD** : PostgreSQL
- **ORM** : Prisma 7.1.0
- **Identifiants** : UUID (pas d'IDs numériques)
- **Format Dates** : DateTime (ISO 8601)
- **Stockage Fichiers** : Vercel Blob Storage (production) / Local (développement)

### Modèles Principaux

1. **User** - Utilisateurs (admin, client, prestataire)
2. **Demande** - Demandes de services clients
3. **Prestataire** - Prestataires de services
4. **Mission** - Missions assignées aux prestataires
5. **Proposition** - Propositions de prestataires pour les demandes
6. **AdminNotification** - Notifications administrateur
7. **File** - Fichiers uploadés
8. **CommissionConfig** - Configuration des commissions
9. **Country** - Pays d'intervention
10. **ServiceCategory** - Catégories de services
11. **EmailLog** - Logs d'emails envoyés
12. **MissionRefCounter** - Compteur pour génération de références

---

## 📦 Modèles Principaux

### 1. User (Utilisateurs)

**Table** : `users`

```prisma
model User {
  id                    String   @id @default(uuid())
  email                 String   @unique
  passwordHash          String
  fullName              String
  role                  String   // "admin" | "client" | "prestataire"
  createdAt             DateTime @default(now())
  lastLogin             DateTime?
  emailVerified         Boolean  @default(false)
  verificationCode      String?
  verificationCodeExpires DateTime?
  country               String?
}
```

**Caractéristiques** :
- UUID comme identifiant unique
- Email unique (contrainte d'unicité)
- Hash de mot de passe avec bcrypt
- Rôles multiples : admin, client, prestataire
- Vérification email optionnelle

**Index** :
- `email` (unique)

---

### 2. Demande (Demandes de Services)

**Table** : `demandes`

```prisma
model Demande {
  id                    String   @id @default(uuid())
  ref                   String   @unique // D-2025-001
  createdAt             DateTime @default(now())
  deviceId              String?
  
  fullName              String
  email                 String
  phone                 String
  
  serviceType           String
  serviceSubcategory    String?
  serviceAutre          String?
  country              String?
  
  description          String   @db.Text
  lieu                 String?
  budget               String?
  urgence              String
  
  fileIds               String[] // Array of file IDs
  
  statut               String   @default("en_attente") // "en_attente" | "rejetee" | "acceptee"
  rejeteeAt            DateTime?
  rejeteeBy            String?
  raisonRejet          String?  @db.Text
  
  deletedAt            DateTime?
  deletedBy            String?
  
  // Relations
  missions              Mission[]
  propositions         Proposition[]
}
```

**Caractéristiques** :
- Référence unique générée : `D-YYYY-NNN`
- Soft delete avec `deletedAt`
- Statuts : `en_attente`, `rejetee`, `acceptee`
- Tableau de file IDs (références vers table File)
- Relations 1:N avec Mission et Proposition

**Index** :
- `ref` (unique)

---

### 3. Prestataire (Prestataires de Services)

**Table** : `prestataires`

```prisma
model Prestataire {
  id                    String   @id @default(uuid())
  ref                   String   @unique // P-2025-001
  createdAt             DateTime @default(now())
  
  nomEntreprise         String
  nomContact           String
  email                 String   @unique
  phone                 String
  adresse              String
  ville                String
  
  specialites          String[] // Array of service types
  zonesIntervention    String[] // Array of cities
  
  typePrestataire      String   @default("freelance") // "entreprise" | "freelance"
  
  passwordHash          String?  // Hash bcrypt du mot de passe
  
  statut               String   @default("en_attente") // "en_attente" | "actif" | "suspendu" | "rejete"
  actifAt              DateTime?
  suspenduAt           DateTime?
  rejeteAt             DateTime?
  rejeteBy             String?
  raisonRejet          String?  @db.Text
  
  deletedAt            DateTime?
  deletedBy            String?
  
  // Relations
  missions              Mission[]
  propositions         Proposition[]
}
```

**Caractéristiques** :
- Référence unique générée : `P-YYYY-NNN`
- Type de prestataire : `entreprise` ou `freelance`
- Spécialités et zones d'intervention (tableaux PostgreSQL)
- Statuts : `en_attente`, `actif`, `suspendu`, `rejete`
- Soft delete avec `deletedAt`
- Relations 1:N avec Mission et Proposition

**Index** :
- `ref` (unique)
- `email` (unique)

---

### 4. Mission (Missions Assignées)

**Table** : `missions`

```prisma
model Mission {
  id                    String   @id @default(uuid())
  ref                   String   @unique // M-2025-001
  demandeId             String
  clientEmail           String
  prestataireId         String?
  prestataireRef        String?
  
  // Suivi des notifications
  notifiedProviderAt    DateTime?
  
  // État interne du workflow
  internalState         String   // MissionInternalState
  status                String   // MissionStatus
  
  createdAt             DateTime @default(now())
  dateAssignation       DateTime?
  dateLimiteProposition DateTime?
  dateAcceptation       DateTime?
  datePriseEnCharge     DateTime?
  dateDebut             DateTime?
  dateFin               DateTime?
  
  // Informations de la mission
  titre                 String
  description           String   @db.Text
  serviceType           String
  lieu                  String?
  urgence               String
  budget                Int?
  
  // Tarification
  tarifPrestataire      Int?
  commissionICD         Int?
  commissionHybride     Int?
  commissionRisk        Int?
  commissionTotale      Int?
  fraisSupplementaires  Int?
  tarifTotal            Int?
  
  // Paiement échelonné (JSON)
  paiementEchelonne      Json?
  
  // Fichiers partagés (JSON array)
  sharedFiles           Json?
  
  // Suivi et progression
  progress              Json? // Array of MissionProgress
  currentProgress       Int?  @default(0)
  
  // Phases d'exécution (JSON array)
  phases                Json?
  delaiMaximal          Int?
  dateLimiteMission     DateTime?
  
  // Updates (JSON array)
  updates               Json? @default("[]")
  
  // Messages (JSON array)
  messages              Json?
  
  // Notes et évaluations
  noteClient            Int?
  notePrestataire       Int?
  noteICD               Int?
  noteAdminPourPrestataire Int?
  commentaireClient     String?  @db.Text
  commentairePrestataire String? @db.Text
  commentaireICD        String?  @db.Text
  commentaireAdminPourPrestataire String? @db.Text
  
  // Preuves de validation finale (JSON array)
  proofs                Json?
  proofSubmissionDate   DateTime?
  proofValidatedByAdmin Boolean  @default(false)
  proofValidatedAt      DateTime?
  proofValidatedForClient Boolean @default(false)
  proofValidatedForClientAt DateTime?
  
  // Fermeture de la mission
  closedBy              String? // "client" | "admin" | "auto"
  closedAt              DateTime?
  
  // Paiement et devis
  devisGenere           Boolean  @default(false)
  devisGenereAt         DateTime?
  paiementEffectue      Boolean  @default(false)
  paiementEffectueAt    DateTime?
  avanceVersee          Boolean  @default(false)
  avanceVerseeAt        DateTime?
  avancePercentage      Int?
  soldeVersee           Boolean  @default(false)
  soldeVerseeAt         DateTime?
  
  // Estimation partenaire (JSON)
  estimationPartenaire   Json?
  
  // Archivage/Suppression
  archived              Boolean  @default(false)
  archivedAt            DateTime?
  archivedBy            String? // "client" | "prestataire" | "admin"
  deleted               Boolean  @default(false)
  deletedAt             DateTime?
  deletedBy             String? // "client" | "prestataire" | "admin"
  
  // Relations
  demande               Demande  @relation(fields: [demandeId], references: [id])
  prestataire           Prestataire? @relation(fields: [prestataireId], references: [id])
}
```

**Caractéristiques** :
- Référence unique générée : `M-YYYY-NNN` (génération atomique via `MissionRefCounter`)
- États internes : `CREATED`, `ASSIGNED_TO_PROVIDER`, `PROVIDER_ESTIMATED`, `WAITING_CLIENT_PAYMENT`, `PAID_WAITING_TAKEOVER`, `ADVANCE_SENT`, `IN_PROGRESS`, `PROVIDER_VALIDATION_SUBMITTED`, `ADMIN_CONFIRMED`, `COMPLETED`
- Plusieurs champs JSONB pour structures complexes (voir section dédiée)
- Workflow de paiement échelonné (25%, 50%, 100%)
- Soft delete et archivage séparés

**Index** :
- `demandeId`
- `prestataireId`
- `clientEmail`
- `internalState`
- `demandeId, prestataireId` (composite)

---

### 5. Proposition (Propositions de Prestataires)

**Table** : `propositions`

```prisma
model Proposition {
  id                    String   @id @default(uuid())
  ref                   String   @unique // PROP-2025-001
  createdAt             DateTime @default(now())
  
  demandeId             String
  prestataireId         String
  
  prix_prestataire      Int
  delai_estime          Int // en jours
  commentaire           String  @db.Text
  difficulte_estimee    Int      @default(3) // 1 à 5
  
  statut                String   @default("en_attente") // "en_attente" | "acceptee" | "refusee"
  accepteeAt            DateTime?
  refuseeAt             DateTime?
  accepteeBy            String?
  refuseeBy              String?
  raisonRefus           String?  @db.Text
  
  missionId             String?
  
  // Relations
  demande               Demande  @relation(fields: [demandeId], references: [id])
  prestataire           Prestataire @relation(fields: [prestataireId], references: [id])
}
```

**Caractéristiques** :
- Référence unique générée : `PROP-YYYY-NNN`
- Statuts : `en_attente`, `acceptee`, `refusee`
- Difficulté estimée : 1 à 5
- Relation optionnelle avec Mission (si acceptée)

**Index** :
- `demandeId`
- `prestataireId`

---

### 6. AdminNotification (Notifications Administrateur)

**Table** : `admin_notifications`

```prisma
model AdminNotification {
  id                    String   @id @default(uuid())
  type                  String   // Notification type
  title                 String
  message               String   @db.Text
  missionId             String?
  missionRef            String?
  demandeId             String?
  clientEmail           String?
  prestataireName       String?
  createdAt             DateTime @default(now())
  read                  Boolean  @default(false)
  readAt                DateTime?
}
```

**Caractéristiques** :
- Notifications pour l'administrateur
- Statut de lecture : `read`
- Types variés : `mission_paid`, `mission_taken_over`, `provider_registered`, etc.

**Index** :
- `read`
- `createdAt`

---

### 7. File (Fichiers Uploadés)

**Table** : `files`

```prisma
model File {
  id                    String   @id @default(uuid())
  fileName              String
  fileType              String   // MIME type (ex: "application/pdf")
  fileSize              Int      // Taille en bytes
  filePath              String?  // DEPRECATED - Utiliser storageKey à la place
  storageKey            String? // Clé de stockage (Blob ou chemin local)
  storageUrl            String? // URL publique du fichier
  uploadedBy            String
  uploadedAt            DateTime @default(now())
  missionId             String?
  demandeId             String?
}
```

**Caractéristiques** :
- Stockage abstrait : Vercel Blob (production) ou Local (développement)
- `filePath` déprécié, utiliser `storageKey` et `storageUrl`
- Relations optionnelles avec Mission et Demande

**Index** :
- `missionId`
- `demandeId`
- `uploadedBy`

---

### 8. CommissionConfig (Configuration des Commissions)

**Table** : `commission_configs`

```prisma
model CommissionConfig {
  id                    String   @id @default(uuid())
  categoryId            String   @unique
  categoryName          String
  basePercent           Float
  minCommission         Int
  maxCommission         Int
  riskPercent           Float
  enabled               Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

**Caractéristiques** :
- Configuration par catégorie de service
- Commission de base + commission de risque
- Min/Max pour limites

**Index** :
- `categoryId` (unique)

---

### 9. Country (Pays d'Intervention)

**Table** : `countries`

```prisma
model Country {
  id                    String   @id @default(uuid())
  code                  String   @unique // CM, CI, etc.
  name                  String
  enabled               Boolean  @default(true)
}
```

**Caractéristiques** :
- Codes ISO (ex: CM, CI, SN)
- Activation/désactivation par pays

**Index** :
- `code` (unique)

---

### 10. ServiceCategory (Catégories de Services)

**Table** : `service_categories`

```prisma
model ServiceCategory {
  id                    String   @id @default(uuid())
  name                  String
  description           String?  @db.Text
  enabled               Boolean  @default(true)
}
```

**Caractéristiques** :
- Catégories de services disponibles
- Activation/désactivation

---

### 11. EmailLog (Logs d'Emails)

**Table** : `email_logs`

```prisma
model EmailLog {
  id                    String   @id @default(uuid())
  to                    String
  from                  String
  subject               String
  body                  String   @db.Text
  type                  String   // "notification" | "invoice" | "welcome" | etc.
  status                String   @default("pending") // "pending" | "sent" | "failed"
  error                 String?  @db.Text
  sentAt                DateTime?
  createdAt             DateTime @default(now())
  
  // Relations
  userId                String?
  missionId             String?
  demandeId             String?
}
```

**Caractéristiques** :
- Traçabilité complète des emails
- Statuts : `pending`, `sent`, `failed`
- Relations optionnelles pour contexte

**Index** :
- `to`
- `status`
- `createdAt`

---

### 12. MissionRefCounter (Compteur de Références)

**Table** : `mission_ref_counters`

```prisma
model MissionRefCounter {
  year                  Int      @id // Année (ex: 2025)
  lastNumber            Int      @default(0)
  updatedAt             DateTime @updatedAt
}
```

**Caractéristiques** :
- Génération atomique de références uniques
- Un compteur par année
- Format : `M-YYYY-NNN` où NNN est incrémenté atomiquement

---

## 🔗 Relations et Contraintes

### Relations Principales

```
Demande (1) ──→ (N) Mission
Demande (1) ──→ (N) Proposition
Prestataire (1) ──→ (N) Mission
Prestataire (1) ──→ (N) Proposition
```

### Contraintes d'Intégrité

- **Foreign Keys** :
  - `Mission.demandeId` → `Demande.id` (CASCADE)
  - `Mission.prestataireId` → `Prestataire.id` (SET NULL si prestataire supprimé)
  - `Proposition.demandeId` → `Demande.id` (CASCADE)
  - `Proposition.prestataireId` → `Prestataire.id` (CASCADE)

- **Unicité** :
  - `User.email` (unique)
  - `Prestataire.email` (unique)
  - `Demande.ref` (unique)
  - `Prestataire.ref` (unique)
  - `Mission.ref` (unique)
  - `Proposition.ref` (unique)
  - `CommissionConfig.categoryId` (unique)
  - `Country.code` (unique)

---

## 📄 Champs JSONB et Structures Complexes

### Mission.proofs (Preuves de Validation)

```typescript
interface MissionProof {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string; // ISO date
  uploadedBy: string; // Email prestataire
  description?: string;
}
```

### Mission.updates (Historique des Mises à Jour)

```typescript
interface MissionUpdate {
  id: string;
  missionId: string;
  type: "status_change" | "photo" | "document" | "note" | "message";
  author: "admin" | "prestataire" | "client";
  authorEmail: string;
  content: string;
  fileUrl?: string;
  createdAt: string; // ISO date
}
```

### Mission.messages (Messages de Chat)

```typescript
interface Message {
  id: string;
  missionId: string;
  from: "client" | "prestataire" | "admin";
  fromEmail: string;
  to: "client" | "prestataire" | "admin";
  toEmail: string;
  content: string;
  type: "chat" | "email";
  createdAt: string; // ISO date
  lu?: boolean;
}
```

### Mission.phases (Phases d'Exécution)

```typescript
interface ExecutionPhase {
  id: string;
  nom: string;
  description?: string;
  completed: boolean;
  completedAt?: string; // ISO date
  dateLimite?: string; // ISO date
  retard?: boolean;
  noteRetard?: string;
  ordre: number;
}
```

### Mission.progress (Progression)

```typescript
interface MissionProgress {
  etape: "acceptation" | "prise_en_charge" | "en_cours" | "validation" | "terminee";
  pourcentage: number; // 0-100
  date?: string; // ISO date
  commentaire?: string;
  retard?: boolean;
  dateLimite?: string; // ISO date
}
```

### Mission.paiementEchelonne (Configuration Paiement)

```typescript
interface PaiementEchelonne {
  pourcentage: 25 | 50 | 100;
  montant: number;
  dateLimite?: string; // ISO date
}
```

---

## ⚡ Index et Performance

### Index Principaux

**Mission** :
- `demandeId` - Recherche par demande
- `prestataireId` - Recherche par prestataire
- `clientEmail` - Recherche par client
- `internalState` - Filtrage par état
- `(demandeId, prestataireId)` - Recherche composite

**Proposition** :
- `demandeId` - Recherche par demande
- `prestataireId` - Recherche par prestataire

**File** :
- `missionId` - Recherche fichiers d'une mission
- `demandeId` - Recherche fichiers d'une demande
- `uploadedBy` - Recherche par uploader

**AdminNotification** :
- `read` - Filtrage notifications non lues
- `createdAt` - Tri chronologique

**EmailLog** :
- `to` - Recherche par destinataire
- `status` - Filtrage par statut
- `createdAt` - Tri chronologique

---

## 🔍 Types et Validations

### Types TypeScript (lib/types.ts)

- `MissionInternalState` - 10 états possibles
- `MissionStatus` - Statuts métier
- `ClientMissionStatus` - Statuts simplifiés pour client
- `UserRole` - "admin" | "client" | "prestataire"

### Validations

- **UUID** : Tous les IDs sont validés avec regex UUID
- **Email** : Validation format email
- **Dates** : Format ISO 8601
- **Montants** : Entiers (centimes pour FCFA)

---

## 📝 Notes Importantes pour l'Audit

1. **Pas de transactions explicites** : Prisma gère les transactions automatiquement
2. **Soft delete** : Utilisation de `deletedAt` plutôt que suppression physique
3. **JSONB** : Structures complexes stockées en JSONB PostgreSQL
4. **Génération références** : Atomique via `MissionRefCounter` pour éviter doublons
5. **Relations optionnelles** : `prestataireId` peut être NULL (mission créée mais pas encore assignée)

---

**Document préparé pour audit externe - Janvier 2025**

