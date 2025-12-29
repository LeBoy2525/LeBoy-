# LeBoy Platform - Documentation Technique

**Plateforme de mise en relation entre clients (diaspora africaine) et prestataires de services locaux**

---

## 📋 Documentation pour Audit

Cette documentation est préparée pour un audit de sécurité et paiements Stripe. Tous les documents nécessaires sont disponibles dans ce repository.

### 📚 Documents Essentiels

#### Pour l'Audit Technique
- **[Présentation Technique Complète](./PRESENTATION_TECHNIQUE_POUR_DEVELOPPEUR.md)** - Vue d'ensemble technique complète
- **[Documentation de Sauvegarde](./DOCUMENTATION_SAUVEGARDE_COMPLETE.md)** - Architecture, installation, configuration
- **[Structure du Projet](./PROJECT_TREE_DIAGRAM.md)** - Organisation du code
- **[Audit Stripe & Sécurité](./AUDIT_STRIPE_SECURITY.md)** - Documentation spécifique paiements et sécurité

#### Architecture & Workflow
- **[Workflow Complet](./WORKFLOW_CHECKLIST.md)** - Processus métier détaillé
- **[Schéma Prisma](./prisma/schema.prisma)** - Modèles de données

#### Configuration & Déploiement
- **[Variables d'Environnement](./VERCEL_ENV_VARIABLES.md)** - Configuration complète
- **[Checklist Déploiement](./CHECKLIST_DEPLOIEMENT_VERCEL.md)** - Guide de déploiement

---

## 🚀 Quick Start

```bash
# Installation
npm install

# Configuration base de données locale (Docker)
docker-compose up -d

# Migrations Prisma
npx prisma migrate dev

# Démarrage développement
npm run dev
```

---

## 🔐 Accès au Repository

**Repository GitHub :** `https://github.com/LeBoy2525/LeBoy-`

Pour obtenir un accès en lecture :
1. Contactez l'administrateur du projet
2. Fournissez votre email GitHub ou nom d'utilisateur
3. Accès en lecture seule sera accordé

---

## 📖 Structure du Projet

```
LeBoy Platform
├── app/                    # Next.js App Router
│   ├── api/               # Routes API (81 routes)
│   ├── admin/            # Espace administrateur
│   ├── espace-client/     # Espace client
│   └── prestataires/     # Espace prestataire
├── lib/                   # Bibliothèques et utilitaires
├── repositories/          # Repositories Prisma
├── prisma/                # Schéma et migrations
└── public/               # Assets statiques
```

---

## 🛠️ Stack Technique

- **Framework :** Next.js 16.0.10 (App Router)
- **Langage :** TypeScript 5.x (strict mode)
- **Base de données :** PostgreSQL + Prisma 7.1.0
- **Paiements :** Stripe
- **Email :** Resend API
- **Stockage :** Vercel Blob Storage
- **Authentification :** Iron Session + Bcrypt

---

## 📞 Contact

Pour toute question concernant l'audit ou l'accès au repository, contactez l'administrateur du projet.

---

**Dernière mise à jour :** Janvier 2025
