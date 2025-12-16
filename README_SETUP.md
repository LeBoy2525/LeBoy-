# Guide de Setup Complet - LeBoy Platform

Ce guide vous accompagne dans la configuration complète de l'environnement de développement local.

## 📋 Prérequis

- **Node.js** : Version 20.9.0+ (voir `.nvmrc`)
- **Docker** : Pour PostgreSQL et Mailpit
- **Git** : Pour cloner le projet

## 🚀 Installation Rapide

```bash
# 1. Cloner le projet
git clone <repository-url>
cd icd-frontend-new

# 2. Configurer l'environnement
cp .env.example .env.local

# 3. Démarrer PostgreSQL et Mailpit
npm run docker:up

# 4. Installer les dépendances
npm ci

# 5. Générer le client Prisma
npm run db:generate

# 6. Créer les tables
npm run db:migrate

# 7. Seed les données initiales
npm run db:seed

# 8. Démarrer le serveur
npm run dev
```

## 📝 Détails des Étapes

### 1. Verrouiller l'environnement Node

Le fichier `.nvmrc` fixe la version Node à 20.9.0.

```bash
# Si vous utilisez nvm
nvm use

# Vérifier les versions
node -v  # Doit afficher v20.9.0 ou supérieur
npm -v   # Doit afficher 10.x ou supérieur
```

### 2. PostgreSQL avec Docker

Le fichier `docker-compose.yml` configure :
- **PostgreSQL** sur le port 5432
- **Mailpit** (SMTP local) sur les ports 1025 (SMTP) et 8025 (Web UI)

```bash
# Démarrer les services
npm run docker:up

# Vérifier que tout fonctionne
docker ps

# Voir les logs
npm run docker:logs

# Arrêter les services
npm run docker:down
```

### 3. Configuration de l'environnement

Copiez `.env.example` vers `.env.local` et configurez :

```env
DATABASE_URL="postgresql://leboy:leboy_dev_password@localhost:5432/leboy_dev"
USE_DB="true"  # Force l'utilisation de PostgreSQL même en dev
```

### 4. Prisma : Génération et Migrations

```bash
# Générer le client Prisma
npm run db:generate

# Créer les migrations
npm run db:migrate
# Quand demandé, nommez la migration : "init"

# Ouvrir Prisma Studio pour visualiser les données
npm run db:studio
```

### 5. Seed des Données Initiales

Le script `prisma/seed.ts` crée automatiquement :
- ✅ Utilisateur admin (email: `admin@leboy.com`, password: `admin123`)
- ✅ Pays (Cameroun, Côte d'Ivoire, Sénégal, Canada)
- ✅ Catégories de services (6 catégories)
- ✅ Configurations de commission

```bash
npm run db:seed
```

### 6. Migration des Données JSON (Optionnel)

Si vous avez des données existantes dans `data/*.json` :

```bash
npx tsx scripts/migrate-json-to-db.ts
```

⚠️ **Important** : Ce script doit être exécuté **UNE SEULE FOIS**.

### 7. Vérification

#### Health Check API

```bash
curl http://localhost:3000/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-..."
}
```

#### Prisma Studio

```bash
npm run db:studio
```

Ouvrez `http://localhost:5555` pour visualiser vos données.

#### Mailpit (Emails)

Ouvrez `http://localhost:8025` pour voir tous les emails envoyés.

## 🧪 Tests

### Tests de fumée (Smoke Tests)

```bash
npm run test:smoke
```

Ces tests vérifient que les routes API de base fonctionnent.

### Tests complets

```bash
npm test
```

## 📁 Structure des Fichiers

```
.
├── prisma/
│   ├── schema.prisma      # Schéma de la base de données
│   └── seed.ts            # Script de seed
├── repositories/          # Repositories Prisma
│   ├── demandesRepo.ts
│   ├── missionsRepo.ts
│   └── ...
├── lib/
│   ├── db.ts             # Client Prisma global
│   ├── dbFlag.ts          # Flag USE_DB
│   └── storage.ts         # Gestion des fichiers
├── storage/               # Fichiers uploadés (local)
├── scripts/
│   └── migrate-json-to-db.ts  # Migration JSON → DB
├── docker-compose.yml     # Configuration Docker
└── .env.example          # Template des variables d'environnement
```

## 🔧 Commandes Utiles

```bash
# Base de données
npm run db:migrate        # Créer une migration
npm run db:generate       # Générer le client Prisma
npm run db:studio         # Ouvrir Prisma Studio
npm run db:seed           # Seed les données
npm run db:reset          # ⚠️ Réinitialiser la DB (supprime tout)

# Docker
npm run docker:up         # Démarrer les services
npm run docker:down       # Arrêter les services
npm run docker:logs       # Voir les logs

# Tests
npm test                  # Lancer tous les tests
npm run test:watch        # Mode watch
npm run test:smoke        # Tests de fumée uniquement

# Nettoyage
npm run clean             # Supprimer .next et cache
```

## 🐛 Dépannage

### Erreur : "Cannot connect to database"

1. Vérifiez que Docker est démarré : `docker ps`
2. Vérifiez que PostgreSQL est actif : `docker ps | grep postgres`
3. Vérifiez la `DATABASE_URL` dans `.env.local`

### Erreur : "Prisma Client not generated"

```bash
npm run db:generate
```

### Erreur : "Migration failed"

1. Vérifiez que PostgreSQL est démarré
2. Vérifiez la `DATABASE_URL`
3. Essayez : `npm run db:reset` (⚠️ supprime les données)

### Erreur : "Port 3000 already in use"

Changez le port dans `package.json` ou arrêtez le processus :
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill
```

## ✅ Checklist de Vérification

Après l'installation, vérifiez que :

- [ ] PostgreSQL est accessible (`npm run db:studio`)
- [ ] Les migrations sont appliquées
- [ ] Le seed a créé l'admin et les données de base
- [ ] L'API health check répond (`/api/health`)
- [ ] Mailpit est accessible (`http://localhost:8025`)
- [ ] Vous pouvez vous connecter avec l'admin
- [ ] Les tests de fumée passent

## 🚀 Prochaines Étapes

1. **Migrer les routes API** : Remplacer progressivement les stores JSON par les repositories
2. **Configurer Stripe** : Ajouter les clés de test dans `.env.local`
3. **Tester le flux complet** : Créer une demande → Mission → Paiement → Validation

## 📚 Documentation

- [MIGRATION_POSTGRES.md](./MIGRATION_POSTGRES.md) - Guide de migration vers PostgreSQL
- [CLEAN_INSTALL.md](./CLEAN_INSTALL.md) - Procédure de clean install
- [EXEMPLE_MIGRATION_API.md](./EXEMPLE_MIGRATION_API.md) - Exemples de migration des routes API

