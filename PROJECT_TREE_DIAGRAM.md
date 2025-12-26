# 📁 Arborescence Complète du Projet LeBoy

**Généré le :** 24 janvier 2025

## Structure Principale

```
icd-frontend-new/
│
├── 📄 Configuration
│   ├── package.json                    # Dépendances npm
│   ├── tsconfig.json                   # Configuration TypeScript
│   ├── next.config.ts                  # Configuration Next.js
│   ├── eslint.config.mjs               # Configuration ESLint
│   ├── postcss.config.mjs              # Configuration PostCSS
│   ├── tailwind.config.ts              # Configuration Tailwind CSS
│   ├── docker-compose.yml              # Configuration Docker (PostgreSQL + Mailpit)
│   ├── vercel.json                     # Configuration Vercel
│   └── prisma.config.ts                # Configuration Prisma 7.x
│
├── 📁 app/                             # Application Next.js (App Router)
│   ├── layout.tsx                      # Layout principal
│   ├── page.tsx                        # Page d'accueil
│   ├── globals.css                     # Styles globaux
│   ├── middleware.ts                   # Middleware Next.js
│   │
│   ├── 📁 admin/                       # Espace administrateur
│   │   ├── page.tsx                    # Dashboard admin
│   │   ├── _components/                # Composants admin
│   │   │   └── AdminPageHeader.tsx
│   │   ├── demandes/                   # Gestion des demandes
│   │   │   ├── page.tsx                # Liste des demandes
│   │   │   ├── [id]/                   # Détails d'une demande
│   │   │   │   └── page.tsx
│   │   │   └── DemandeAssignmentStatus.tsx
│   │   ├── prestataires/               # Gestion des prestataires
│   │   │   ├── page.tsx                # Liste des prestataires
│   │   │   └── [id]/                   # Détails d'un prestataire
│   │   │       └── page.tsx
│   │   ├── missions/                   # Gestion des missions
│   │   │   └── create/                 # Création de missions
│   │   │       └── route.ts
│   │   └── finance/                    # Finance & Comptabilité
│   │       └── page.tsx
│   │
│   ├── 📁 api/                         # Routes API
│   │   ├── health/                     # Health check
│   │   │   └── route.ts
│   │   ├── auth/                       # Authentification
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── me/route.ts
│   │   ├── admin/                      # Routes admin
│   │   │   ├── demandes/               # Gestion demandes admin
│   │   │   ├── missions/               # Gestion missions admin
│   │   │   │   ├── create/route.ts
│   │   │   │   └── [id]/               # Actions sur mission
│   │   │   │       ├── validate-proofs/route.ts
│   │   │   │       ├── validate/route.ts
│   │   │   │       ├── close/route.ts
│   │   │   │       └── rate-provider/route.ts
│   │   │   ├── prestataires/           # Gestion prestataires admin
│   │   │   ├── notifications/          # Notifications admin
│   │   │   └── pending-actions/        # Actions en attente
│   │   ├── demandes/                   # Routes demandes publiques
│   │   │   ├── route.ts                # Liste/Création demandes
│   │   │   └── [id]/                   # Détails demande
│   │   ├── missions/                   # Routes missions
│   │   │   ├── [id]/                   # Actions sur mission
│   │   │   │   ├── proofs/route.ts     # GET/POST preuves
│   │   │   │   └── report-pdf/route.ts # Génération PDF rapport
│   │   │   └── route.ts                # Liste missions
│   │   ├── prestataires/               # Routes prestataires
│   │   │   ├── register/route.ts       # Inscription prestataire
│   │   │   ├── route.ts                # Liste prestataires
│   │   │   └── [id]/                   # Détails prestataire
│   │   ├── espace-client/              # Routes espace client
│   │   │   └── missions/               # Missions client
│   │   │       ├── route.ts            # Liste missions client
│   │   │       └── [id]/                # Détails mission client
│   │   │           ├── route.ts
│   │   │           ├── payment/route.ts
│   │   │           ├── validate/route.ts
│   │   │           └── rate/route.ts
│   │   ├── matching/                   # Algorithme de matching
│   │   │   └── [demandeId]/route.ts
│   │   ├── files/                      # Gestion fichiers
│   │   │   └── [id]/route.ts           # GET fichier par ID
│   │   └── prestataires/espace/        # Routes espace prestataire
│   │       └── missions/               # Missions prestataire
│   │           ├── route.ts
│   │           └── [id]/               # Actions mission prestataire
│   │               ├── estimation/route.ts
│   │               ├── proofs/route.ts
│   │               └── ...
│   │
│   ├── 📁 components/                  # Composants React réutilisables
│   │   ├── LanguageProvider.tsx        # Provider i18n
│   │   ├── BackToHomeLink.tsx          # Lien retour accueil
│   │   ├── MissionProgressBar.tsx      # Barre de progression mission
│   │   ├── MissionPhases.tsx           # Phases de mission
│   │   ├── MissionChat.tsx             # Chat mission
│   │   ├── MissionProofView.tsx        # Affichage preuves
│   │   ├── PrestataireTypeBadge.tsx    # Badge type prestataire (NOUVEAU)
│   │   ├── ClientPaymentSection.tsx    # Section paiement client
│   │   ├── ClientRatingSection.tsx     # Section notation client
│   │   ├── AdminAdvancePaymentSection.tsx
│   │   ├── AdminValidationSection.tsx
│   │   ├── AdminRatingSection.tsx
│   │   ├── ProviderEstimationView.tsx
│   │   ├── WinnerSelectionView.tsx
│   │   ├── ProviderActivityTracker.tsx
│   │   └── PropositionsList.tsx
│   │
│   ├── 📁 espace-client/               # Espace client
│   │   ├── page.tsx                    # Dashboard client
│   │   ├── dossier/                    # Pages dossiers
│   │   │   ├── [id]/page.tsx
│   │   │   └── [id]/[ref]/page.tsx     # Page dossier avec référence
│   │   └── mission/                   # Pages missions client
│   │       └── [id]/page.tsx           # Détails mission client
│   │
│   ├── 📁 prestataires/                # Espace prestataire
│   │   ├── inscription/                # Inscription prestataire
│   │   │   └── page.tsx                # Formulaire inscription (avec type)
│   │   ├── connexion/                   # Connexion prestataire
│   │   │   └── page.tsx
│   │   └── espace/                     # Espace prestataire
│   │       ├── page.tsx                # Dashboard prestataire
│   │       └── mission/                # Pages missions prestataire
│   │           └── [id]/page.tsx
│   │
│   ├── 📁 connexion/                   # Connexion client
│   │   └── page.tsx
│   ├── 📁 inscription/                 # Inscription client
│   │   └── page.tsx
│   ├── 📁 contact/                     # Page contact
│   │   └── page.tsx
│   ├── 📁 services/                    # Page services
│   │   └── page.tsx
│   ├── 📁 apropos/                     # Page à propos
│   │   └── page.tsx
│   └── 📁 ...                          # Autres pages publiques
│
├── 📁 lib/                             # Bibliothèques et utilitaires
│   ├── dataAccess.ts                   # Couche d'accès aux données (JSON/Prisma)
│   ├── db.ts                           # Client Prisma global
│   ├── dbFlag.ts                       # Flag USE_DB
│   ├── auth.ts                         # Authentification
│   ├── emailService.ts                 # Service d'envoi d'emails (Resend)
│   ├── filesStore.ts                  # Gestion des fichiers
│   ├── storage/                        # Stockage fichiers (Blob/Local)
│   │   └── index.ts
│   ├── matching.ts                     # Algorithme de matching prestataires
│   ├── prestatairesStore.ts            # Types et stores prestataires
│   ├── demandesStore.ts                # Types et stores demandes
│   ├── missionsStore.ts                # Types et stores missions
│   ├── propositionsStore.ts            # Types et stores propositions
│   ├── types.ts                        # Types TypeScript globaux
│   ├── dateUtils.ts                    # Utilitaires dates
│   ├── env-validation.ts               # Validation variables d'environnement
│   └── ...                             # Autres utilitaires
│
├── 📁 repositories/                    # Repositories Prisma
│   ├── missionsRepo.ts                 # Repository missions
│   ├── demandesRepo.ts                 # Repository demandes
│   ├── prestatairesRepo.ts             # Repository prestataires
│   ├── propositionsRepo.ts             # Repository propositions
│   ├── usersRepo.ts                    # Repository utilisateurs
│   ├── notificationsRepo.ts            # Repository notifications
│   └── emailLogRepo.ts                 # Repository logs emails
│
├── 📁 prisma/                          # Configuration Prisma
│   ├── schema.prisma                   # Schéma de la base de données
│   ├── seed.ts                         # Script de seed initial
│   ├── config.ts                       # Configuration Prisma
│   └── 📁 migrations/                  # Migrations Prisma
│       ├── 0_init/                     # Migration initiale
│       │   └── migration.sql
│       └── 20250123000000_add_prestataire_type/  # Migration type prestataire
│           └── migration.sql
│
├── 📁 data/                            # Données JSON (fallback/legacy)
│   ├── demandes.json
│   ├── missions.json
│   ├── prestataires.json
│   ├── propositions.json
│   ├── users.json
│   ├── files.json
│   ├── serviceCategories.json
│   ├── countries.json
│   ├── commissionConfigs.json
│   └── adminNotifications.json
│
├── 📁 storage/                         # Stockage local des fichiers
│   └── ...                             # Fichiers uploadés (développement)
│
├── 📁 scripts/                         # Scripts utilitaires
│   ├── migrate-json-to-db.ts          # Migration JSON → DB
│   ├── check-email-config.ts          # Vérification config email
│   ├── check-tables.ts                # Vérification tables DB
│   ├── check-data-exists.ts           # Vérification données
│   ├── check-missions-table.ts        # Vérification table missions
│   ├── diagnose-user-issue.ts         # Diagnostic problèmes utilisateurs
│   ├── diagnose-prestataire-ids.ts    # Diagnostic IDs prestataires
│   ├── prisma-generate.js             # Génération Prisma
│   ├── vercel-build.sh                # Script build Vercel
│   └── vercel-build-optimized.sh      # Script build optimisé
│
├── 📁 tests/                           # Tests
│   └── api/
│       └── smoke.test.ts              # Tests de fumée
│
├── 📁 public/                          # Fichiers statiques
│   ├── favicon.ico
│   ├── hero-diaspora.jpg.png
│   └── ...                             # Autres assets
│
├── 📄 Documentation
│   ├── DOCUMENTATION_SAUVEGARDE_COMPLETE.md  # Documentation complète
│   ├── PROJECT_TREE_DIAGRAM.md              # Ce fichier
│   ├── README.md                             # README principal
│   ├── README_SETUP.md                       # Guide setup
│   ├── README_ADMIN.md                       # Guide admin
│   ├── README_EMAIL.md                       # Guide emails
│   ├── README_TESTS.md                       # Guide tests
│   ├── PLAN_CLASSIFICATION_PRESTATAIRES.md   # Plan classification
│   ├── VERCEL_ENV_VARIABLES.md               # Variables Vercel
│   └── ...                                    # Autres docs
│
└── 📄 Fichiers racine
    ├── .gitignore                      # Fichiers ignorés par Git
    ├── .nvmrc                          # Version Node.js
    ├── .env.local                      # Variables d'environnement (local)
    └── ...                             # Autres fichiers config
```

## Fichiers Clés par Fonctionnalité

### Classification Prestataires (NOUVEAU)
- `app/components/PrestataireTypeBadge.tsx` - Composant badge
- `app/prestataires/inscription/page.tsx` - Formulaire avec sélection type
- `app/admin/prestataires/page.tsx` - Liste avec badges et filtres
- `app/admin/prestataires/[id]/page.tsx` - Détails avec badge
- `app/admin/demandes/[id]/page.tsx` - Assignation avec badges
- `app/admin/page.tsx` - Dashboard avec statistiques
- `prisma/schema.prisma` - Modèle avec `typePrestataire`
- `prisma/migrations/20250123000000_add_prestataire_type/` - Migration

### Gestion des Preuves
- `app/components/MissionProofView.tsx` - Affichage preuves
- `app/api/missions/[id]/proofs/route.ts` - API preuves
- `app/api/admin/missions/[id]/validate-proofs/route.ts` - Validation admin
- `app/espace-client/mission/[id]/page.tsx` - Affichage client

### Chat/Messagerie
- `app/components/MissionChat.tsx` - Composant chat
- `app/api/missions/[id]/messages/route.ts` - API messages

### Paiements
- `app/components/ClientPaymentSection.tsx` - Section paiement client
- `app/api/espace-client/missions/[id]/payment/route.ts` - API paiement
- Intégration Stripe

### Emails
- `lib/emailService.ts` - Service emails (Resend)
- `repositories/emailLogRepo.ts` - Logs emails
- Templates dans `lib/emailService.ts`

## Statistiques du Projet

- **Routes API :** ~77 fichiers
- **Pages :** ~30 fichiers
- **Composants :** ~30 fichiers
- **Repositories :** 7 fichiers
- **Scripts utilitaires :** ~10 fichiers
- **Migrations Prisma :** 2+ migrations

---

**Note :** Cette arborescence est générée automatiquement et peut ne pas être à jour. Consultez le dépôt Git pour la structure exacte.

