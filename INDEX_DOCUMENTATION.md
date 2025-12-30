# 📚 Index de la Documentation - LeBoy Platform

**Guide de navigation dans la documentation pour audit et développement**

---

## 🎯 Documentation pour Audit Externe

### Documents Principaux

1. **[GUIDE_ACCES_AUDITEUR.md](./GUIDE_ACCES_AUDITEUR.md)** ⭐ **COMMENCER ICI**
   - Guide d'accès au repository
   - Checklist pré-audit
   - Points d'attention spécifiques

2. **[AUDIT_STRIPE_SECURITY.md](./AUDIT_STRIPE_SECURITY.md)** ⭐ **DOCUMENT PRINCIPAL AUDIT**
   - Architecture paiements Stripe
   - Intégration actuelle (avec TODOs identifiés)
   - Webhooks & états
   - Sécurité
   - Risques identifiés
   - Recommandations

3. **[DOCUMENT_AUDIT_SCHEMA_DONNEES.md](./DOCUMENT_AUDIT_SCHEMA_DONNEES.md)** ⭐ **SCHÉMA DE DONNÉES**
   - Modèles de données complets
   - Relations et contraintes
   - Champs JSONB et structures complexes
   - Index et performance
   - Types et validations

4. **[DOCUMENT_AUDIT_LOGIQUE_METIER.md](./DOCUMENT_AUDIT_LOGIQUE_METIER.md)** ⭐ **LOGIQUE MÉTIER & ÉTATS**
   - Workflow complet des missions
   - États internes et transitions
   - Règles métier par rôle
   - Workflow de paiement
   - Workflow de validation
   - Règles de sécurité

5. **[DOCUMENT_AUDIT_PATTERNS_ARCHITECTURE.md](./DOCUMENT_AUDIT_PATTERNS_ARCHITECTURE.md)** ⭐ **PATTERNS D'ARCHITECTURE**
   - Vue d'ensemble architecturale
   - Patterns principaux utilisés
   - Structure du code
   - Couches d'abstraction
   - Gestion des erreurs
   - Sécurité et performance

6. **[README.md](./README.md)** - Vue d'ensemble et quick start

---

## 📖 Documentation Technique Complète

### Architecture & Présentation

- **[PRESENTATION_TECHNIQUE_POUR_DEVELOPPEUR.md](./PRESENTATION_TECHNIQUE_POUR_DEVELOPPEUR.md)**
  - Stack technique complète
  - Architecture détaillée
  - Patterns utilisés
  - Technologies et versions

- **[DOCUMENTATION_SAUVEGARDE_COMPLETE.md](./DOCUMENTATION_SAUVEGARDE_COMPLETE.md)**
  - Architecture complète
  - Installation et configuration
  - Modèles Prisma
  - Workflow métier

- **[PROJECT_TREE_DIAGRAM.md](./PROJECT_TREE_DIAGRAM.md)**
  - Structure visuelle du projet
  - Organisation des dossiers

- **[PROJECT_TREE.txt](./PROJECT_TREE.txt)**
  - Arborescence détaillée texte

---

## 🔧 Configuration & Déploiement

### Variables d'Environnement

- **[VERCEL_ENV_VARIABLES.md](./VERCEL_ENV_VARIABLES.md)**
  - Liste complète des variables
  - Valeurs recommandées
  - Différences staging/production

- **[GUIDE_VARIABLES_VERCEL.md](./GUIDE_VARIABLES_VERCEL.md)**
  - Guide pas à pas détaillé
  - Instructions pour chaque variable
  - Checklist complète

### Déploiement

- **[CHECKLIST_DEPLOIEMENT_VERCEL.md](./CHECKLIST_DEPLOIEMENT_VERCEL.md)**
  - Checklist complète de déploiement
  - Étapes détaillées
  - Vérifications post-déploiement

- **[VERCEL_POSTGRES_CONFIG.md](./VERCEL_POSTGRES_CONFIG.md)**
  - Configuration PostgreSQL Vercel
  - Migrations
  - Connexion

- **[GUIDE_POSTGRESQL_LOCAL.md](./GUIDE_POSTGRESQL_LOCAL.md)**
  - Setup PostgreSQL local
  - Docker Compose
  - Migrations locales

---

## 🔄 Workflow & Processus Métier

- **[WORKFLOW_CHECKLIST.md](./WORKFLOW_CHECKLIST.md)**
  - Workflow complet d'une mission
  - États et transitions
  - Rôles et permissions

---

## 🎨 Documentation UI/UX

- **[DOCUMENTATION_UI_DESIGNER.md](./DOCUMENTATION_UI_DESIGNER.md)**
  - Spécifications fonctionnelles UI
  - Types d'utilisateurs
  - Écrans et états
  - Flux utilisateur

---

## 🔍 Fichiers de Code Clés pour Audit

### Paiements Stripe

- `lib/stripe.ts` - Configuration Stripe
- `app/api/espace-client/missions/[id]/payment/route.ts` - Paiement client
- `app/api/admin/missions/[id]/pay-advance/route.ts` - Versement avance
- `app/api/admin/missions/[id]/pay-balance/route.ts` - Versement solde
- `app/components/ClientPaymentSection.tsx` - Interface paiement frontend
- `app/components/AdminAdvancePaymentSection.tsx` - Interface versement avance

### Sécurité

- `lib/auth.ts` - Authentification
- `lib/session.ts` - Gestion sessions
- `app/middleware.ts` - Protection routes
- `lib/uuidValidation.ts` - Validation UUIDs

### Modèles de Données

- `prisma/schema.prisma` - Schéma complet base de données
- `lib/types.ts` - Types TypeScript

---

## 📝 Documents de Migration & Historique

- `MIGRATION_STATUS.md` - État des migrations
- `MIGRATION_POSTGRES.md` - Guide migration PostgreSQL
- `MIGRATION_AUTH_ME.md` - Migration authentification

---

## 🧪 Tests & Validation

- `README_TESTS.md` - Documentation tests
- `TEST_REPORT.md` - Rapports de tests
- `TEST_STAGING_LOCAL.md` - Tests staging local

---

## 📞 Support & Contact

Pour toute question concernant la documentation ou l'accès au repository, contactez l'administrateur du projet.

---

**Dernière mise à jour :** Janvier 2025

