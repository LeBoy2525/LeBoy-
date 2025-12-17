# ✅ Checklist Complète - Déploiement Vercel

Guide étape par étape pour un déploiement réussi sur Vercel.

---

## 📋 Phase 1 : Préparation du Code

### 1.0 Vérifications de Sécurité (PRIORITÉ CRITIQUE)

- [ ] **Vérifier les vulnérabilités de sécurité**
  ```bash
  npm audit
  ```
- [ ] **Corriger les vulnérabilités critiques** avant le déploiement
  - Consulter `SECURITY_PATCH_CVE-2025.md` pour les dernières corrections
  - Mettre à jour React, Next.js et autres dépendances vulnérables
- [ ] **Vérifier que les versions sont à jour**
  - React : `19.2.1` ou supérieur (corrige CVE-2025-55182)
  - Next.js : `16.0.7` ou supérieur (corrige CVE-2025-66478)

### 1.1 Vérifications Pré-Déploiement

- [ ] **Code commité et pushé sur GitHub**
  ```bash
  git status
  git add .
  git commit -m "feat: Préparation déploiement Vercel"
  git push origin main
  ```

- [ ] **Build local réussi**
  ```bash
  npm run build
  ```
  Vérifier qu'il n'y a pas d'erreurs TypeScript ou de build

- [ ] **Tests passent (si disponibles)**
  ```bash
  npm test
  ```

- [ ] **Linter sans erreurs critiques**
  ```bash
  npm run lint
  ```

- [ ] **Fichiers sensibles dans .gitignore**
  - `.env*` fichiers
  - `node_modules/`
  - `.vercel/`
  - `storage/` (sauf `.gitkeep`)

---

## 🔧 Phase 2 : Configuration Vercel

### 2.1 Création du Projet Vercel

- [ ] **Créer un compte Vercel** (si pas déjà fait)
  - Aller sur [vercel.com](https://vercel.com)
  - Se connecter avec GitHub

- [ ] **Importer le repository GitHub**
  - Dashboard Vercel → **"Add New..."** → **"Project"**
  - Sélectionner le repository GitHub
  - Cliquer sur **"Import"**

- [ ] **Configuration du projet**
  - **Framework Preset** : `Next.js` (détecté automatiquement)
  - **Root Directory** : `./` (par défaut)
  - **Build Command** : `npm run build` (par défaut)
  - **Output Directory** : `.next` (par défaut)
  - **Install Command** : `npm install` (par défaut)
  - **Node.js Version** : `20.x` (vérifier dans `package.json` → `engines.node`)

### 2.2 Création de la Base de Données PostgreSQL

- [ ] **Créer Vercel Postgres**
  - Dans le projet Vercel → **Storage** → **Create Database**
  - Choisir **Postgres**
  - Nommer la base (ex: `icd-production-db` ou `icd-staging-db`)
  - Sélectionner la région la plus proche de vos utilisateurs
  - Cliquer sur **Create**

- [ ] **Récupérer la DATABASE_URL**
  - Dans **Storage** → Votre base Postgres → **Settings**
  - Copier la `DATABASE_URL` (format: `postgresql://...`)
  - ⚠️ **À garder secret** - sera utilisé dans les variables d'environnement

### 2.3 Création du Stockage Blob (Vercel Blob)

- [ ] **Créer Vercel Blob Store**
  - Dans le projet Vercel → **Storage** → **Create Database**
  - Choisir **Blob**
  - Nommer le store (ex: `icd-production-blob` ou `icd-staging-blob`)
  - Cliquer sur **Create**

- [ ] **Récupérer le BLOB_READ_WRITE_TOKEN**
  - Dans **Storage** → Votre Blob Store → **Settings**
  - Copier le `BLOB_READ_WRITE_TOKEN`
  - ⚠️ **À garder secret** - sera utilisé dans les variables d'environnement

---

## 🔐 Phase 3 : Variables d'Environnement

### 3.1 Variables Obligatoires

Dans **Settings** → **Environment Variables**, ajouter pour **Production**, **Preview**, et **Development** :

#### Environnement
- [ ] `APP_ENV` = `production` (ou `staging` pour staging)
- [ ] `NODE_ENV` = `production`

#### Base de Données
- [ ] `USE_DB` = `true`
- [ ] `DATABASE_URL` = `postgresql://...` (depuis Vercel Postgres)

#### URL de l'Application
- [ ] `NEXT_PUBLIC_APP_URL` = `https://votre-projet.vercel.app`
  - ⚠️ Mettre à jour après le premier déploiement avec l'URL réelle

#### Stockage Blob
- [ ] `BLOB_READ_WRITE_TOKEN` = `vercel_blob_xxxxx` (depuis Vercel Blob)

#### Sécurité & Sessions
- [ ] `SESSION_SECRET` = Générer avec :
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  - ⚠️ Minimum 32 caractères, aléatoire et sécurisé

#### Stripe (Mode TEST pour staging, LIVE pour production)

**Pour Staging :**
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
- [ ] `STRIPE_SECRET_KEY` = `sk_test_...`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (si webhooks utilisés)
- [ ] `DISABLE_LIVE_STRIPE` = `true` (protection supplémentaire)
- [ ] `DISABLE_PAYOUTS` = `true` (désactiver les paiements sortants en staging)

**Pour Production :**
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (si webhooks utilisés)
- [ ] ⚠️ **NE PAS** mettre `DISABLE_LIVE_STRIPE` ou `DISABLE_PAYOUTS` en production

#### Emails (Resend)

**Pour Staging (Safe Mode) :**
- [ ] `EMAIL_MODE` = `safe`
- [ ] `EMAIL_REDIRECT_TO` = `votre-email@exemple.com`
- [ ] `RESEND_API_KEY` = `re_...`

**Pour Production :**
- [ ] `EMAIL_MODE` = `production` (ou ne pas définir)
- [ ] `RESEND_API_KEY` = `re_...`
- [ ] Optionnel : `EMAIL_ALLOWLIST` = `email1@exemple.com,email2@exemple.com`

#### Protection Staging (si environnement staging)
- [ ] `STAGING_ACCESS_CODE` = Code secret pour protéger l'accès (ex: `staging-2025-secret`)

### 3.2 Variables Optionnelles (mais recommandées)

- [ ] `ICD_ADMIN_EMAIL` = `contact@leboy.com` (email admin principal)
- [ ] `ICD_ADMIN_EMAILS` = `email1@exemple.com,email2@exemple.com` (liste d'emails admin)
- [ ] `ICD_ADMIN_PASSWORD` = Mot de passe admin (si utilisé)
- [ ] `ACCOUNTANT_EMAIL` = `comptable@exemple.com` (si utilisé)

### 3.3 Vérification des Variables

- [ ] **Vérifier que toutes les variables sont définies** pour l'environnement cible
- [ ] **Vérifier les préfixes Stripe** :
  - Staging : `pk_test_` et `sk_test_` uniquement
  - Production : `pk_live_` et `sk_live_` uniquement
- [ ] **Vérifier SESSION_SECRET** : minimum 32 caractères, aléatoire

---

## 🚀 Phase 4 : Premier Déploiement

### 4.1 Déploiement Initial

- [ ] **Déclencher le déploiement**
  - Si connecté à GitHub : push automatique après configuration
  - Sinon : Vercel Dashboard → **Deployments** → **Redeploy**

- [ ] **Surveiller le build**
  - Aller dans **Deployments** → Cliquer sur le déploiement en cours
  - Vérifier les logs de build
  - ⚠️ Si erreur : corriger et redéployer

- [ ] **Vérifier le statut du déploiement**
  - ✅ **Ready** = Déploiement réussi
  - ❌ **Error** = Vérifier les logs et corriger

### 4.2 Mise à Jour de NEXT_PUBLIC_APP_URL

- [ ] **Récupérer l'URL de déploiement**
  - Exemple : `https://icd-frontend-new.vercel.app`
  - Ou URL personnalisée si configurée

- [ ] **Mettre à jour NEXT_PUBLIC_APP_URL**
  - Settings → Environment Variables
  - Modifier `NEXT_PUBLIC_APP_URL` avec l'URL réelle
  - Redéployer pour appliquer le changement

---

## 🗄️ Phase 5 : Migrations Prisma

### 5.1 Appliquer les Migrations

**Option A : Via Vercel CLI (Recommandé)**

- [ ] **Installer Vercel CLI**
  ```bash
  npm i -g vercel
  ```

- [ ] **Se connecter à Vercel**
  ```bash
  vercel login
  ```

- [ ] **Lier le projet local**
  ```bash
  vercel link
  ```
  Sélectionner le projet Vercel correspondant

- [ ] **Récupérer les variables d'environnement**
  ```bash
  vercel env pull .env.local
  ```

- [ ] **Appliquer les migrations**
  ```bash
  npx prisma migrate deploy
  ```

**Option B : Via Vercel Dashboard (SQL direct)**

- [ ] **Aller dans Storage → Postgres → Query**
- [ ] **Exécuter le SQL des migrations**
  - Ouvrir `prisma/migrations/[timestamp]_[nom]/migration.sql`
  - Copier le contenu SQL
  - Coller dans l'éditeur Query Vercel
  - Exécuter

**Option C : Via Script de Build (Automatique) - RECOMMANDÉ**

- [ ] **Vérifier que `package.json` contient** :
  ```json
  {
    "scripts": {
      "postinstall": "prisma generate || echo 'Warning: Prisma generate completed with warnings'",
      "vercel-build": "prisma generate && prisma migrate deploy && next build"
    }
  }
  ```
  ⚠️ **Important** : Vercel détecte automatiquement le script `vercel-build` et l'utilise à la place de `npm run build`. Pas besoin de modifier la Build Command dans Vercel Dashboard.

- [ ] **Vérifier que `prisma.config.ts` utilise `process.env.DATABASE_URL`** avec une valeur par défaut :
  ```typescript
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://placeholder@localhost:5432/placeholder",
  }
  ```
  Cela permet à `prisma generate` de fonctionner même si `DATABASE_URL` n'est pas encore disponible lors de `postinstall`.

### 5.2 Vérification des Migrations

- [ ] **Vérifier que les tables existent**
  - Vercel Dashboard → Storage → Postgres → **Query**
  - Exécuter : `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
  - Vérifier la présence de toutes les tables nécessaires

- [ ] **Vérifier les colonnes de stockage** (si migration storage)
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'files' AND column_name IN ('storageKey', 'storageUrl');
  ```

### 5.3 Seed de la Base de Données (si nécessaire)

- [ ] **Exécuter le seed** (optionnel, pour données initiales)
  ```bash
  npm run db:seed
  ```
  Ou via Vercel CLI :
  ```bash
  vercel env pull .env.local
  npm run db:seed
  ```

---

## ✅ Phase 6 : Tests Post-Déploiement

### 6.1 Tests de Base

- [ ] **Accès à l'application**
  - Ouvrir l'URL de déploiement dans un navigateur
  - Vérifier que la page se charge sans erreur

- [ ] **Protection Staging** (si environnement staging)
  - Vérifier la redirection vers `/staging-access`
  - Entrer le `STAGING_ACCESS_CODE`
  - Vérifier le cookie `staging_ok` est défini
  - Vérifier le banner "STAGING" visible

- [ ] **Meta robots** (staging uniquement)
  - Vérifier `<meta name="robots" content="noindex,nofollow">` présent
  - Empêche l'indexation par les moteurs de recherche

### 6.2 Tests de Connexion

- [ ] **Connexion Admin**
  - Aller sur `/connexion`
  - Se connecter avec :
    - Email : `contact@leboy.com` (ou `ICD_ADMIN_EMAIL`)
    - Mot de passe : Mot de passe admin configuré
  - Vérifier la redirection vers `/admin`
  - Vérifier l'accès aux fonctionnalités admin

- [ ] **Connexion Client**
  - Créer un compte client ou se connecter
  - Vérifier l'accès à l'espace client

- [ ] **Connexion Prestataire**
  - Se connecter avec un compte prestataire
  - Vérifier l'accès à l'espace prestataire

### 6.3 Tests Fonctionnels

- [ ] **Création de Demande**
  - Se connecter en tant que client
  - Créer une nouvelle demande
  - Vérifier que la demande apparaît dans l'espace admin
  - Vérifier que l'email de notification est envoyé (ou redirigé en staging)

- [ ] **Upload de Fichier**
  - Dans une demande, uploader un fichier (PDF, image)
  - Vérifier que l'URL retournée est une URL Vercel Blob
    - Format attendu : `https://...public.blob.vercel-storage.com/...`
  - Vérifier que le fichier est accessible via cette URL
  - **Test de persistance** :
    - Redéployer l'application
    - Vérifier que le fichier est toujours accessible après redéploiement
    - ✅ Si accessible → Blob fonctionne correctement

- [ ] **Paiement Stripe** (si fonctionnalité activée)
  - Créer une mission depuis une demande
  - Générer un devis
  - Cliquer sur "Payer"
  - **En staging** : Utiliser carte test `4242 4242 4242 4242`
  - **En production** : Utiliser une vraie carte (test)
  - Vérifier que le paiement passe
  - Vérifier dans Stripe Dashboard que la transaction apparaît

- [ ] **Emails**
  - Créer une demande ou déclencher une action qui envoie un email
  - **En staging** : Vérifier dans les logs Vercel que l'email est redirigé vers `EMAIL_REDIRECT_TO`
  - **En production** : Vérifier que l'email arrive au destinataire réel
  - Vérifier le contenu de l'email

### 6.4 Tests de Performance

- [ ] **Temps de chargement**
  - Vérifier que les pages se chargent rapidement (< 3 secondes)
  - Utiliser Lighthouse ou PageSpeed Insights

- [ ] **API Routes**
  - Tester quelques routes API principales
  - Vérifier les temps de réponse

---

## 🔍 Phase 7 : Vérifications Finales

### 7.1 Checklist Technique

- [ ] **Base de données PostgreSQL connectée**
  - Vérifier dans les logs Vercel qu'il n'y a pas d'erreurs de connexion
  - Tester une requête simple via l'interface admin

- [ ] **Migrations Prisma appliquées**
  - Vérifier que toutes les migrations sont appliquées
  - Vérifier qu'il n'y a pas d'erreurs de schéma

- [ ] **Stockage Blob fonctionnel**
  - Fichiers uploadés vers Blob (pas en local)
  - URLs Blob accessibles publiquement
  - Fichiers persistants après redéploiement

- [ ] **Stripe configuré correctement**
  - Mode TEST en staging (`pk_test_`, `sk_test_`)
  - Mode LIVE en production (`pk_live_`, `sk_live_`)
  - Pas d'erreurs dans les logs Stripe

- [ ] **Emails fonctionnels**
  - Resend API configurée
  - Emails envoyés ou redirigés selon le mode
  - Pas d'erreurs dans les logs d'email

- [ ] **Sessions fonctionnelles**
  - Connexion/déconnexion fonctionne
  - Sessions persistantes entre les requêtes
  - Cookie sécurisé en production (`secure: true`)

### 7.2 Checklist Sécurité

- [ ] **Variables sensibles non exposées**
  - Aucune clé API dans le code source
  - Toutes les variables dans Vercel Environment Variables
  - `.env` fichiers dans `.gitignore`

- [ ] **Staging protégé** (si environnement staging)
  - Code d'accès requis
  - Banner visible
  - Meta robots `noindex,nofollow`

- [ ] **Stripe protégé**
  - Pas de clés LIVE en staging
  - `DISABLE_LIVE_STRIPE=true` en staging
  - Webhooks configurés correctement

- [ ] **HTTPS activé**
  - Vérifier que l'URL utilise `https://`
  - Certificat SSL valide (automatique avec Vercel)

### 7.3 Checklist Monitoring

- [ ] **Logs Vercel accessibles**
  - Vérifier les logs dans Vercel Dashboard → **Functions** → **Logs**
  - Pas d'erreurs critiques

- [ ] **Métriques de déploiement**
  - Vérifier le statut du déploiement : ✅ Ready
  - Vérifier les métriques de performance

- [ ] **Alertes configurées** (optionnel)
  - Configurer des alertes pour les erreurs critiques
  - Configurer des alertes pour les déploiements échoués

---

## 🐛 Phase 8 : Dépannage

### Erreurs Courantes et Solutions

#### ❌ Erreur : "BLOB_READ_WRITE_TOKEN n'est pas configuré"

**Solution :**
1. Vérifier que `BLOB_READ_WRITE_TOKEN` est défini dans Vercel → Settings → Environment Variables
2. Vérifier qu'il est défini pour l'environnement correct (Production/Preview/Development)
3. Redéployer après ajout de la variable

#### ❌ Erreur : "PrismaConfigEnvError: Missing required environment variable: DATABASE_URL"

**Solution :**
1. Vérifier que `prisma.config.ts` utilise `process.env.DATABASE_URL` avec une valeur par défaut :
   ```typescript
   datasource: {
     url: process.env.DATABASE_URL || "postgresql://placeholder@localhost:5432/placeholder",
   }
   ```
2. Vérifier que le script `vercel-build` existe dans `package.json` :
   ```json
   "vercel-build": "prisma generate && prisma migrate deploy && next build"
   ```
3. Vérifier que `DATABASE_URL` est défini dans Vercel → Settings → Environment Variables
4. Redéployer après les corrections

#### ❌ Erreur : "Migration failed" ou "Prisma migrate deploy failed"

**Solution :**
1. Vérifier que `DATABASE_URL` est correct et accessible
2. Vérifier que la base de données est créée et active
3. Exécuter manuellement le SQL dans Vercel Postgres → Query
4. Vérifier les permissions de la base de données
5. Vérifier que le script `vercel-build` s'exécute correctement (logs Vercel)

#### ❌ Erreur : "Stripe LIVE keys detected" en staging

**Solution :**
1. Vérifier que toutes les clés Stripe commencent par `pk_test_` et `sk_test_`
2. Vérifier que `DISABLE_LIVE_STRIPE=true` est défini en staging
3. Redéployer après correction

#### ❌ Fichiers perdus après redéploiement

**Solution :**
1. Vérifier que `BLOB_READ_WRITE_TOKEN` est correct
2. Vérifier que le provider Blob est utilisé (logs Vercel)
3. Vérifier que les fichiers sont bien uploadés vers Blob (URLs commencent par `https://...blob.vercel-storage.com/`)
4. Vérifier que le token Blob n'a pas expiré

#### ❌ Erreur : "SESSION_SECRET must be at least 32 characters"

**Solution :**
1. Générer un nouveau `SESSION_SECRET` :
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Mettre à jour dans Vercel → Settings → Environment Variables
3. Redéployer

#### ❌ Erreur : "Email sending failed"

**Solution :**
1. Vérifier que `RESEND_API_KEY` est défini et valide
2. Vérifier que `EMAIL_MODE` est correct (`safe` pour staging, `production` pour production)
3. Vérifier les logs Vercel pour les erreurs détaillées
4. Vérifier que le domaine est vérifié dans Resend (si nécessaire)

#### ❌ Erreur : "Build failed" - Erreurs TypeScript

**Solution :**
1. Vérifier les erreurs TypeScript localement :
   ```bash
   npm run build
   ```
2. Corriger les erreurs dans le code
3. Commit et push les corrections
4. Redéployer

#### ❌ Erreur : "Module not found" ou dépendances manquantes

**Solution :**
1. Vérifier que toutes les dépendances sont dans `package.json`
2. Vérifier que `package-lock.json` est commité
3. Vérifier les logs de build pour les dépendances manquantes
4. Ajouter les dépendances manquantes et redéployer

#### ⚠️ Alerte de Sécurité : Vulnérabilités détectées

**Solution :**
1. Exécuter `npm audit` pour identifier les vulnérabilités
2. Consulter `SECURITY_PATCH_CVE-2025.md` pour les correctifs de sécurité
3. Mettre à jour les packages vulnérables :
   ```bash
   npm update react react-dom next
   ```
4. Vérifier les versions corrigées dans `package.json`
5. Tester le build localement avant de déployer
6. **NE JAMAIS déployer avec des vulnérabilités critiques non corrigées**

---

## 📝 Phase 9 : Documentation et Maintenance

### 9.1 Documentation

- [ ] **Documenter l'URL de production/staging**
  - Noter l'URL dans un document accessible
  - Partager avec l'équipe si nécessaire

- [ ] **Documenter les accès**
  - Codes d'accès staging
  - Identifiants admin
  - Accès à la base de données (si nécessaire)

- [ ] **Documenter les variables d'environnement**
  - Liste des variables nécessaires
  - Valeurs par environnement (sans les secrets)

### 9.2 Maintenance Continue

- [ ] **Surveiller les déploiements**
  - Vérifier régulièrement les logs Vercel
  - Surveiller les erreurs dans les métriques

- [ ] **Mettre à jour les dépendances**
  - Mettre à jour régulièrement `npm` packages
  - Tester les mises à jour en staging avant production

- [ ] **Sauvegardes**
  - Vercel Postgres : Sauvegardes automatiques activées
  - Vérifier les sauvegardes régulièrement

- [ ] **Sécurité**
  - Révoquer et régénérer les tokens régulièrement
  - Surveiller les accès et les logs de sécurité

---

## 🎉 Checklist Finale de Succès

Avant de considérer le déploiement comme réussi, vérifier :

- [ ] ✅ Application accessible et fonctionnelle
- [ ] ✅ Base de données connectée et migrations appliquées
- [ ] ✅ Stockage Blob fonctionnel et fichiers persistants
- [ ] ✅ Connexions utilisateurs fonctionnelles (admin, client, prestataire)
- [ ] ✅ Création de demandes fonctionnelle
- [ ] ✅ Upload de fichiers fonctionnel
- [ ] ✅ Emails fonctionnels (envoyés ou redirigés selon le mode)
- [ ] ✅ Paiements Stripe fonctionnels (mode TEST en staging)
- [ ] ✅ Protection staging active (si environnement staging)
- [ ] ✅ Aucune erreur critique dans les logs
- [ ] ✅ Performance acceptable (< 3s temps de chargement)
- [ ] ✅ HTTPS activé et certificat valide
- [ ] ✅ Variables d'environnement correctement configurées
- [ ] ✅ Sécurité : pas de clés exposées, staging protégé

---

## 📞 Support

En cas de problème persistant :

1. **Vérifier les logs Vercel** : Dashboard → Functions → Logs
2. **Vérifier la documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
3. **Vérifier la documentation Prisma** : [prisma.io/docs](https://www.prisma.io/docs)
4. **Vérifier la documentation Next.js** : [nextjs.org/docs](https://nextjs.org/docs)

---

**Date de dernière mise à jour** : 2025-01-XX
**Version** : 1.0

