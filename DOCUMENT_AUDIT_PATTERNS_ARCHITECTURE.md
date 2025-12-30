# 🏗️ Patterns d'Architecture - Documentation Complète pour Audit

**Document préparé pour audit externe - Architecture, patterns et design decisions**

---

## 📋 Table des Matières

1. [Vue d'Ensemble Architecturale](#vue-densemble-architecturale)
2. [Patterns Principaux](#patterns-principaux)
3. [Structure du Code](#structure-du-code)
4. [Couches d'Abstraction](#couches-dabstraction)
5. [Gestion des Erreurs](#gestion-des-erreurs)
6. [Sécurité](#sécurité)
7. [Performance](#performance)

---

## 🎯 Vue d'Ensemble Architecturale

### Architecture Générale

```
┌─────────────────────────────────────────────────┐
│              Frontend (Next.js)                │
│  - Pages React (App Router)                    │
│  - Composants réutilisables                    │
│  - Client-side state management                 │
└─────────────────┬──────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────┐
│         Middleware (Next.js)                   │
│  - Authentification                             │
│  - Protection routes                            │
│  - Staging access control                       │
└─────────────────┬──────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────┐
│         API Routes (Next.js)                    │
│  - Routes modulaires par domaine                │
│  - Validation entrées                            │
│  - Gestion erreurs                              │
└─────────────────┬──────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────┐
│      Data Access Layer (lib/dataAccess.ts)      │
│  - Abstraction JSON/Prisma                      │
│  - Fallback intelligent                         │
│  - Conversion formats                           │
└─────────────────┬──────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌───────▼────────┐
│  JSON Store    │  │  Prisma Repos   │
│  (Fallback)    │  │  (Production)   │
└────────────────┘  └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   (Production)   │
                    └─────────────────┘
```

---

## 🎨 Patterns Principaux

### 1. Architecture Hybride JSON/Prisma

**Pattern** : Fallback Strategy avec Flag de Configuration

**Implémentation** : `lib/dataAccess.ts`

```typescript
// Flag global pour basculer entre JSON et Prisma
const USE_DB = process.env.USE_DB === "true";

export async function getMissionById(id: string): Promise<Mission | null> {
  if (USE_DB) {
    // Production : Utilise Prisma + PostgreSQL
    return await getMissionByIdDB(id);
  } else {
    // Développement/Test : Utilise JSON store
    return getMissionByIdJSON(id);
  }
}
```

**Avantages** :
- Migration progressive possible
- Tests sans base de données
- Développement local simplifié

**Inconvénients** :
- Complexité supplémentaire
- Risque d'incohérence entre les deux systèmes

---

### 2. Repository Pattern

**Pattern** : Séparation logique d'accès aux données

**Structure** :
```
repositories/
├── missionsRepo.ts
├── prestatairesRepo.ts
├── demandesRepo.ts
├── propositionsRepo.ts
├── notificationsRepo.ts
└── usersRepo.ts
```

**Exemple** : `repositories/missionsRepo.ts`

```typescript
export async function getMissionById(id: string): Promise<PrismaMission | null> {
  return await prisma.mission.findUnique({
    where: { id },
    include: { demande: true, prestataire: true }
  });
}

export async function updateMission(
  id: string,
  data: Partial<PrismaMission>
): Promise<PrismaMission | null> {
  return await prisma.mission.update({
    where: { id },
    data
  });
}
```

**Avantages** :
- Encapsulation logique métier
- Réutilisabilité
- Testabilité

---

### 3. Data Access Layer (DAL)

**Pattern** : Couche d'abstraction entre API et données

**Implémentation** : `lib/dataAccess.ts`

**Fonctions principales** :
- `getMissionById()` - Abstraction JSON/Prisma
- `createMission()` - Création avec fallback
- `updateMissionInternalState()` - Mise à jour état
- `convertPrismaMissionToJSON()` - Conversion formats

**Avantages** :
- API uniforme indépendante du backend
- Migration transparente
- Conversion automatique formats

---

### 4. Route Handler Pattern (Next.js App Router)

**Pattern** : Routes API modulaires par domaine

**Structure** :
```
app/api/
├── admin/              # Routes admin
│   ├── missions/
│   ├── prestataires/
│   └── demandes/
├── espace-client/      # Routes client
│   └── missions/
├── prestataires/       # Routes prestataire
│   └── espace/
└── auth/               # Authentification
```

**Exemple** : Route API typique

```typescript
// app/api/admin/missions/[id]/pay-advance/route.ts
export async function POST(req: Request, { params }: RouteParams) {
  // 1. Authentification
  const userEmail = cookieStore.get("icd_user_email")?.value;
  if (!userEmail || getUserRole(userEmail) !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // 2. Validation UUID
  const uuidValidation = validateUUID(missionUuid, "Mission ID");
  if (!uuidValidation.valid) {
    return NextResponse.json({ error: uuidValidation.error }, { status: 400 });
  }

  // 3. Vérification état
  const mission = await getMissionById(missionUuid);
  if (mission.internalState !== "PAID_WAITING_TAKEOVER") {
    return NextResponse.json({ error: "État invalide" }, { status: 400 });
  }

  // 4. Logique métier
  const updated = await updateMission(missionUuid, { ... });

  // 5. Réponse
  return NextResponse.json({ success: true, mission: updated });
}
```

**Patterns utilisés** :
- Validation en entrée
- Vérification autorisation
- Gestion erreurs structurée
- Réponses JSON standardisées

---

### 5. Component Composition Pattern (React)

**Pattern** : Composants réutilisables et composables

**Structure** :
```
app/components/
├── MissionProgressBar.tsx      # Barre de progression
├── MissionChat.tsx             # Chat mission
├── ClientPaymentSection.tsx    # Section paiement client
├── AdminAdvancePaymentSection.tsx # Section avance admin
└── PrestataireTypeBadge.tsx    # Badge type prestataire
```

**Exemple** : Composant réutilisable

```typescript
// app/components/MissionProgressBar.tsx
interface MissionProgressBarProps {
  mission: Mission;
  lang?: "fr" | "en";
}

export function MissionProgressBar({ mission, lang = "fr" }: MissionProgressBarProps) {
  const progress = getProgressFromInternalState(mission.internalState);
  // ...
}
```

**Avantages** :
- Réutilisabilité
- Testabilité
- Maintenabilité

---

### 6. Type Safety Pattern (TypeScript)

**Pattern** : Typage strict pour sécurité

**Configuration** : `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  }
}
```

**Types définis** : `lib/types.ts`

```typescript
export type MissionInternalState =
  | "CREATED"
  | "ASSIGNED_TO_PROVIDER"
  | "PROVIDER_ESTIMATED"
  // ...

export interface Mission {
  id: string;
  ref: string;
  internalState: MissionInternalState;
  // ...
}
```

**Avantages** :
- Détection erreurs à la compilation
- Autocomplétion IDE
- Documentation implicite

---

### 7. UUID Validation Pattern

**Pattern** : Validation centralisée des UUIDs

**Implémentation** : `lib/uuidValidation.ts`

```typescript
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateUUID(
  uuid: string | string[] | undefined,
  idName: string = "ID"
): { valid: boolean; error?: string } {
  if (!uuid) {
    return { valid: false, error: `${idName} manquant.` };
  }
  if (Array.isArray(uuid)) {
    return { valid: false, error: `${idName} invalide (tableau reçu).` };
  }
  if (!UUID_REGEX.test(uuid)) {
    return { valid: false, error: `${idName} invalide (format UUID attendu).` };
  }
  return { valid: true };
}
```

**Usage** : Dans toutes les routes API

```typescript
const uuidValidation = validateUUID(missionId, "Mission ID");
if (!uuidValidation.valid) {
  return NextResponse.json({ error: uuidValidation.error }, { status: 400 });
}
```

**Avantages** :
- Validation centralisée
- Messages d'erreur cohérents
- Réduction duplication code

---

### 8. Error Handling Pattern

**Pattern** : Gestion d'erreurs structurée

**Stratégies** :

1. **Validation en entrée** :
```typescript
if (!missionId || !validateUUID(missionId).valid) {
  return NextResponse.json({ error: "ID invalide" }, { status: 400 });
}
```

2. **Vérification existence** :
```typescript
const mission = await getMissionById(missionId);
if (!mission) {
  return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 });
}
```

3. **Vérification état** :
```typescript
if (mission.internalState !== "WAITING_CLIENT_PAYMENT") {
  return NextResponse.json({ error: "État invalide" }, { status: 400 });
}
```

4. **Try/Catch pour erreurs serveur** :
```typescript
try {
  // Opération
} catch (error) {
  console.error("Erreur:", error);
  return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
}
```

---

### 9. Session Management Pattern

**Pattern** : Sessions sécurisées avec Iron Session

**Implémentation** : `lib/session.ts`

```typescript
import { getIronSession } from "iron-session";

export async function getSession() {
  return await getIronSession<SessionData>(cookies(), {
    cookieName: "icd_auth",
    password: process.env.SESSION_SECRET!,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    },
  });
}
```

**Usage** : Middleware et routes API

```typescript
const session = await getSession();
const isAuth = session.auth === "1";
const userEmail = session.email;
```

**Avantages** :
- Sécurité (httpOnly, secure)
- Pas de stockage côté client
- Expiration automatique

---

### 10. Environment-Based Configuration Pattern

**Pattern** : Configuration selon environnement

**Implémentation** : Variables d'environnement

```typescript
const APP_ENV = process.env.APP_ENV || "local";
const USE_DB = process.env.USE_DB === "true";
const NODE_ENV = process.env.NODE_ENV || "development";
```

**Usage** : Protection staging, choix backend, etc.

```typescript
// Protection staging
if (APP_ENV === "staging") {
  // Rediriger vers /staging-access
}

// Choix backend
if (USE_DB) {
  // Utiliser Prisma
} else {
  // Utiliser JSON
}
```

---

## 📁 Structure du Code

### Organisation Modulaire

```
app/
├── api/                    # Routes API
│   ├── admin/             # Routes admin
│   ├── espace-client/      # Routes client
│   ├── prestataires/      # Routes prestataire
│   └── auth/               # Authentification
├── admin/                  # Pages admin
├── espace-client/          # Pages client
├── prestataires/           # Pages prestataire
├── components/             # Composants réutilisables
└── middleware.ts           # Middleware Next.js

lib/
├── dataAccess.ts           # Couche d'abstraction données
├── auth.ts                 # Authentification
├── session.ts              # Gestion sessions
├── types.ts                # Types TypeScript
├── stripe.ts               # Configuration Stripe
└── uuidValidation.ts       # Validation UUIDs

repositories/
├── missionsRepo.ts         # Repository missions
├── prestatairesRepo.ts     # Repository prestataires
└── ...
```

---

## 🔒 Sécurité

### Patterns de Sécurité

1. **Authentication Middleware** :
   - Vérification cookie session
   - Redirection si non authentifié

2. **Authorization Checks** :
   - Vérification rôle sur chaque route
   - Vérification propriétaire (client/prestataire)

3. **Input Validation** :
   - Validation UUID
   - Validation email
   - Validation montants

4. **SQL Injection Prevention** :
   - Prisma ORM (requêtes préparées)
   - Pas de requêtes SQL brutes avec variables

5. **XSS Prevention** :
   - React escape automatique
   - Pas d'utilisation `dangerouslySetInnerHTML`

---

## ⚡ Performance

### Patterns d'Optimisation

1. **Static Generation** :
   - Pages publiques en SSG quand possible
   - `export const dynamic = 'force-dynamic'` pour pages dynamiques

2. **Database Indexing** :
   - Index sur champs fréquemment recherchés
   - Index composites pour requêtes complexes

3. **Caching** :
   - Cache-Control headers sur réponses API
   - Pas de cache sur données sensibles

4. **Lazy Loading** :
   - Composants React chargés à la demande
   - Images optimisées avec Next.js Image

---

## 📝 Design Decisions

### Choix Architecturaux

1. **Next.js App Router** :
   - Routing moderne
   - Server Components
   - API Routes intégrées

2. **Prisma ORM** :
   - Type safety
   - Migrations automatiques
   - Support PostgreSQL

3. **UUID vs Numeric IDs** :
   - UUID pour sécurité
   - Pas de problèmes de séquence
   - Compatibilité distribuée

4. **JSONB pour Structures Complexes** :
   - Flexibilité
   - Performance PostgreSQL
   - Pas de normalisation excessive

---

## ⚠️ Points d'Attention pour l'Audit

### Complexités

1. **Architecture Hybride** :
   - Deux systèmes de données (JSON/Prisma)
   - Risque d'incohérence
   - Migration en cours

2. **Pas de Transactions Explicites** :
   - Prisma gère automatiquement
   - Risque en cas d'erreurs partielles

3. **Gestion Erreurs Stripe** :
   - Pas de retry logic
   - Pas de gestion timeouts
   - Pas de webhooks

---

**Document préparé pour audit externe - Janvier 2025**

