# 📋 Présentation Technique - Plateforme LeBoy

**Document pour avis professionnel développeur web**

---

## 🎯 Vue d'Ensemble du Projet

**LeBoy** est une plateforme de mise en relation entre clients (diaspora africaine) et prestataires de services locaux (Cameroun, Côte d'Ivoire, Sénégal). Le système gère un workflow complet : demande client → matching prestataires → proposition → sélection → mission → paiement → validation → clôture.

**Type d'application :** Plateforme SaaS B2B2C avec gestion de workflow complexe

---

## 🛠️ Stack Technique Principale

### Frontend & Framework
- **Next.js 16.0.10** (App Router) - Framework React full-stack
- **React 18.3.1** - Bibliothèque UI
- **TypeScript 5.x** - Typage statique strict (`strict: true`)
- **Tailwind CSS 4.x** - Framework CSS utility-first
- **Lucide React** - Bibliothèque d'icônes

### Backend & API
- **Next.js API Routes** - Routes API intégrées (Serverless)
- **Iron Session** - Gestion de sessions sécurisées
- **Bcryptjs** - Hashage de mots de passe

### Base de Données
- **PostgreSQL** - Base de données relationnelle
- **Prisma 7.1.0** - ORM moderne avec migrations
- **UUID** - Identifiants uniques pour toutes les entités (pas de IDs numériques)

### Services Externes
- **Resend** - Service d'envoi d'emails transactionnels
- **Stripe** - Paiements en ligne (test et production)
- **Vercel Blob Storage** - Stockage de fichiers (production)
- **Mailpit** - Serveur SMTP local (développement)

### Outils de Développement
- **Docker & Docker Compose** - PostgreSQL + Mailpit en local
- **ESLint** - Linter avec règles strictes
- **Jest** - Framework de tests
- **PDFKit** - Génération de PDFs (devis, rapports)

---

## 🏗️ Architecture Technique

### Pattern Architectural

**1. Architecture Hybride JSON/Prisma**
- Système de fallback intelligent via `lib/dataAccess.ts`
- Flag `USE_DB` pour basculer entre JSON (dev/test) et Prisma (production)
- Permet migration progressive et tests sans DB

**2. Couche d'Abstraction des Données**
```typescript
// Exemple de fonction dans dataAccess.ts
export async function getMissionById(id: string): Promise<Mission | null> {
  if (USE_DB) {
    // Utilise Prisma + PostgreSQL
    return getMissionByIdDB(id);
  } else {
    // Fallback sur JSON store
    return getMissionByIdJSON(id);
  }
}
```

**3. Repository Pattern**
- Repositories Prisma dans `/repositories/` pour accès DB direct
- Abstraction via `dataAccess.ts` pour compatibilité JSON/DB

### Structure des Routes API

**Organisation modulaire :**
```
app/api/
├── admin/          # Routes réservées aux admins
├── espace-client/  # Routes espace client
├── prestataires/   # Routes prestataires
├── missions/       # Routes missions publiques
└── auth/           # Authentification
```

**Sécurité :**
- Vérification de rôle sur chaque route API
- Sessions sécurisées avec Iron Session
- Validation UUID pour tous les IDs

---

## 💾 Modèle de Données

### Entités Principales

**1. User** (Utilisateurs)
- UUID comme ID primaire
- Rôles : `admin`, `client`, `prestataire`
- Authentification avec hash bcrypt

**2. Demande** (Demandes de services)
- Référence unique : `D-2025-001`
- Statuts : `en_attente`, `acceptee`, `rejetee`
- Soft delete avec `deletedAt`

**3. Prestataire** (Prestataires de services)
- Référence unique : `P-2025-001`
- **NOUVEAU** : Champ `typePrestataire` (`entreprise` | `freelance`)
- Spécialités et zones d'intervention (arrays)
- Statuts : `en_attente`, `actif`, `suspendu`, `rejete`

**4. Mission** (Missions assignées)
- Référence unique : `M-2025-001` (générée atomiquement via `MissionRefCounter`)
- États internes : `CREATED`, `ASSIGNED_TO_PROVIDER`, `IN_PROGRESS`, `PROVIDER_VALIDATION_SUBMITTED`, `ADMIN_CONFIRMED`, `COMPLETED`
- Preuves d'accomplissement (JSONB)
- Workflow de paiement échelonné (25%, 50%, 100%)

**5. Proposition** (Propositions de prestataires)
- Référence unique : `PROP-2025-001`
- Statuts : `en_attente`, `acceptee`, `refusee`
- Prix, délai, commentaire, difficulté estimée

### Relations

- **Demande** → **Mission** (1:N)
- **Demande** → **Proposition** (1:N)
- **Prestataire** → **Mission** (1:N)
- **Prestataire** → **Proposition** (1:N)

### Champs JSONB (PostgreSQL)

- `proofs` (Mission) - Array de preuves avec métadonnées
- `updates` (Mission) - Historique des mises à jour
- `messages` (Mission) - Messages de chat
- `phases` (Mission) - Phases d'exécution
- `paiementEchelonne` (Mission) - Configuration paiement

---

## 🔄 Workflow Technique

### 1. Création de Mission
```
Client crée demande → Admin assigne prestataires → 
Missions créées (UUID) → Emails envoyés → 
Prestataires reçoivent notifications
```

**Points techniques :**
- Génération atomique de références via `MissionRefCounter`
- Support multi-prestataires (1 demande → N missions)
- Gestion des fichiers partagés (Vercel Blob ou local)

### 2. Matching Algorithmique
```
Algorithme de matching basé sur :
- Spécialité (catégorie de service)
- Ville (zones d'intervention)
- Pays d'opération
- Note moyenne (si disponible)
- Type de prestataire (entreprise/freelance) - NOUVEAU
```

**Fichier :** `lib/matching.ts`

### 3. Workflow de Paiement
```
Génération devis → Paiement client (Stripe) → 
Versement avance prestataire → 
Validation preuves → Versement solde → 
Clôture mission
```

**Points techniques :**
- Intégration Stripe complète
- Paiements échelonnés (25%, 50%, 100%)
- Génération PDF de devis et factures

### 4. Validation et Preuves
```
Prestataire upload preuves → 
Admin valide → 
Client peut consulter → 
Mission complétée
```

**Points techniques :**
- Upload fichiers avec compression
- Stockage Vercel Blob (prod) ou local (dev)
- Validation conditionnelle selon paiement (100% = auto-validation)

---

## 🔐 Sécurité

### Authentification
- **Iron Session** - Sessions sécurisées avec cookies httpOnly
- **Bcrypt** - Hashage mots de passe (10 rounds)
- **Vérification email** - Codes de vérification avec expiration

### Autorisation
- Vérification de rôle sur chaque route API
- Accès conditionnel selon rôle (admin/client/prestataire)
- Validation UUID pour éviter les injections

### Stockage
- Mots de passe jamais stockés en clair
- Fichiers uploadés avec validation de type et taille
- URLs de fichiers sécurisées (pas d'accès direct)

---

## 📦 Gestion des Fichiers

### Architecture de Stockage

**Développement :**
- Stockage local dans `/storage/`
- Fichiers référencés via modèle `File` avec `storageKey`

**Production :**
- Vercel Blob Storage
- URLs publiques sécurisées
- Migration transparente via abstraction `lib/storage/`

**Fichiers supportés :**
- Images : JPEG, PNG, WebP
- Documents : PDF, Word
- Vidéos : MP4, QuickTime
- Taille max : 50 MB (avant compression)

---

## 🧪 Tests & Qualité

### Tests Implémentés
- **Tests de fumée** (`tests/api/smoke.test.ts`)
- Tests de migration JSON → DB
- Tests de fallback mécanisme

### Qualité du Code
- **TypeScript strict** - Typage complet
- **ESLint** - Linter avec règles Next.js
- **Prisma** - Validation schéma à la compilation

### Scripts Utilitaires
- `check-email-config.ts` - Vérification config email
- `check-tables.ts` - Vérification tables DB
- `diagnose-*` - Scripts de diagnostic

---

## 🚀 Déploiement

### Environnement de Production
- **Vercel** - Hosting et déploiement
- **Vercel Postgres** - Base de données
- **Vercel Blob** - Stockage fichiers
- **Build optimisé** - Prisma generate + migrations automatiques

### Variables d'Environnement
- Configuration via `.env.local` (dev) et Vercel (prod)
- Validation des variables avec `lib/env-validation.ts`
- Secrets gérés via Vercel Environment Variables

---

## 📊 Métriques & Performance

### Optimisations
- **Compression** activée dans Next.js
- **Images optimisées** (AVIF, WebP)
- **Cache-Control** headers pour API routes
- **Lazy loading** des composants

### Scalabilité
- Architecture serverless (Vercel)
- Base de données PostgreSQL scalable
- Stockage Blob scalable (Vercel)

---

## 🎨 UI/UX

### Design System
- **Tailwind CSS 4** - Utility-first CSS
- **Composants réutilisables** - ~30 composants React
- **Responsive design** - Mobile-first
- **Internationalisation** - FR/EN (via `LanguageProvider`)

### Composants Clés
- `MissionProgressBar` - Barre de progression workflow
- `MissionChat` - Chat en temps réel
- `MissionProofView` - Gestionnaire de preuves
- `PrestataireTypeBadge` - Badge type prestataire (NOUVEAU)

---

## 🔄 Fonctionnalités Récentes (Janvier 2025)

### 1. Classification Prestataires
- Ajout champ `typePrestataire` (entreprise/freelance)
- Badges visuels dans toutes les interfaces
- Filtres et statistiques par type
- Migration Prisma appliquée

### 2. Amélioration Affichage Preuves
- Correction bug affichage preuves client
- Conditions d'accès assouplies
- Meilleure UX pour consultation preuves

### 3. Amélioration UX Client
- Section "Mission assignée" améliorée
- Bouton "Voir les détails" avec animations
- Section "Besoin d'une correction" ajoutée

---

## ⚠️ Points d'Attention Technique

### 1. Migration Progressive
- Système hybride JSON/Prisma en place
- Permet migration progressive sans downtime
- Nécessite maintenance de deux systèmes

### 2. Génération de Références
- Utilise `MissionRefCounter` pour atomicité
- Risque de conflit si plusieurs créations simultanées
- Solution : Transactions Prisma

### 3. Gestion des Fichiers
- Abstraction storage (Blob/Local) complexe
- Migration fichiers existants nécessaire
- URLs peuvent changer entre dev/prod

### 4. Workflow Complexe
- Nombreux états internes de mission
- Logique métier distribuée dans plusieurs fichiers
- Risque d'incohérence d'état

---

## 💡 Recommandations Techniques

### Points Forts
✅ **Stack moderne** - Next.js 16, Prisma 7, TypeScript strict  
✅ **Architecture hybride** - Flexibilité JSON/DB  
✅ **Sécurité** - Sessions sécurisées, hashage mots de passe  
✅ **Scalabilité** - Architecture serverless  
✅ **Type safety** - TypeScript strict partout  

### Points d'Amélioration Potentiels
🔧 **Tests** - Augmenter couverture de tests  
🔧 **Documentation** - API documentation (Swagger/OpenAPI)  
🔧 **Monitoring** - Ajouter logging structuré (ex: Winston)  
🔧 **Cache** - Implémenter cache Redis pour requêtes fréquentes  
🔧 **Webhooks** - Stripe webhooks pour paiements asynchrones  

---

## 📈 Évolutivité

### Ajouts Futurs Possibles
- **Notifications push** - Service Worker
- **Chat en temps réel** - WebSockets (Socket.io)
- **Analytics** - Tracking événements utilisateur
- **Multi-tenant** - Support plusieurs organisations
- **API publique** - REST API pour intégrations tierces

---

## 📝 Conclusion

**Stack technique solide et moderne** avec :
- Framework React/Next.js performant
- Base de données PostgreSQL robuste
- Architecture scalable (serverless)
- Sécurité bien implémentée
- Code typé et maintenable

**Complexité principale :** Gestion du workflow multi-étapes avec nombreux états et transitions.

**Recommandation :** Architecture adaptée pour une plateforme SaaS avec workflow complexe. Points d'attention sur la gestion d'état et la migration progressive JSON → DB.

---

## ❓ Questions à Poser au Développeur

### Architecture & Design
1. **Architecture hybride** : Avis sur l'architecture hybride JSON/Prisma ? Avantages/inconvénients ? Quand supprimer le fallback JSON ?
2. **Gestion d'état** : Recommandations pour améliorer la gestion d'état des missions ? Pattern State Machine recommandé ?
3. **Repository Pattern** : L'implémentation actuelle est-elle optimale ? Faut-il ajouter une couche de service ?

### Performance & Scalabilité
4. **Performance** : Optimisations possibles pour les performances (cache, requêtes DB, pagination) ?
5. **Scalabilité** : Limites actuelles et recommandations pour scaler (concurrent users, missions simultanées) ?
6. **Cache** : Stratégie de cache recommandée ? Redis nécessaire maintenant ou plus tard ?

### Tests & Qualité
7. **Tests** : Meilleures pratiques pour les tests dans ce contexte (unitaires, intégration, E2E) ?
8. **Couverture** : Objectif de couverture de tests recommandé ? Outils de mesure ?
9. **CI/CD** : Pipeline de déploiement recommandé (tests automatiques, déploiement staging/prod) ?

### Sécurité & Monitoring
10. **Sécurité** : Audit sécurité recommandé ? Points d'amélioration identifiés ?
11. **Monitoring** : Outils recommandés pour monitoring production (erreurs, performances, logs) ?
12. **Logging** : Stratégie de logging structuré recommandée ? Winston, Pino, autre ?

### Migration & Évolution
13. **Migration** : Stratégie de migration complète vers Prisma uniquement (supprimer JSON fallback) ?
14. **Refactoring** : Zones du code qui mériteraient un refactoring prioritaire ?
15. **Documentation** : Outils recommandés pour documentation API (Swagger, Postman, etc.) ?

### Intégrations & Services
16. **Webhooks** : Implémentation Stripe webhooks recommandée pour paiements asynchrones ?
17. **Real-time** : Chat en temps réel nécessaire ? WebSockets (Socket.io) ou Server-Sent Events ?
18. **Notifications** : Stratégie pour notifications push (Service Worker, Firebase Cloud Messaging) ?

### Base de Données
19. **Optimisation DB** : Index manquants ? Requêtes lentes à optimiser ?
20. **Migrations** : Stratégie de migrations en production (zero-downtime) ?

---

## 📊 Statistiques du Projet

- **Routes API :** ~77 fichiers
- **Pages :** ~30 fichiers
- **Composants React :** ~30 fichiers
- **Repositories Prisma :** 7 fichiers
- **Scripts utilitaires :** ~10 fichiers
- **Migrations Prisma :** 2+ migrations
- **Lignes de code TypeScript :** ~15,000+ (estimation)

---

## 🔗 Ressources Techniques

### Documentation Externe
- **Next.js 16** : https://nextjs.org/docs
- **Prisma 7** : https://www.prisma.io/docs
- **TypeScript** : https://www.typescriptlang.org/docs
- **Tailwind CSS 4** : https://tailwindcss.com/docs

### Documentation Interne
- `DOCUMENTATION_SAUVEGARDE_COMPLETE.md` - Documentation complète du projet
- `PROJECT_TREE_DIAGRAM.md` - Arborescence détaillée
- `README_SETUP.md` - Guide d'installation
- `PLAN_CLASSIFICATION_PRESTATAIRES.md` - Plan d'implémentation classification

---

**Document généré le :** 24 janvier 2025  
**Version du projet :** 1.0.0  
**Dernière mise à jour majeure :** Janvier 2025 (Classification prestataires)

