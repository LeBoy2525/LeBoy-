# 🚀 Guide de Déploiement Staging sur Vercel

## ✅ Prérequis

- [x] Migration Prisma créée (`prisma/migrations/20251215235623_add_storage_fields/`)
- [x] Providers Blob implémentés (`lib/storage/`)
- [x] Routes API adaptées pour Blob
- [x] Identifiants admin unifiés

---

## 📋 Étape 1 : Commit et Push

```bash
# Vérifier les changements
git status

# Ajouter tous les fichiers
git add .

# Commit avec message descriptif
git commit -m "feat: Migration vers Vercel Blob + Migration Prisma storage fields

- Ajout providers storage (local + Vercel Blob)
- Adaptation routes API pour stockage Blob
- Migration Prisma pour storageKey/storageUrl
- Unification identifiants admin
- Suppression section types comptes connexion"

# Push vers le repo
git push origin main
# ou votre branche principale
```

---

## 🔧 Étape 2 : Configuration Vercel

### 2.1 Créer le projet Vercel

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Cliquer sur **"Add New..."** → **"Project"**
3. Importer le repository GitHub
4. Configurer le projet :
   - **Framework Preset** : Next.js
   - **Root Directory** : `./` (par défaut)
   - **Build Command** : `npm run build` (par défaut)
   - **Output Directory** : `.next` (par défaut)

### 2.2 Créer Vercel Postgres

1. Dans le projet Vercel → **Storage** → **Create Database**
2. Choisir **Postgres**
3. Nommer la base (ex: `leboy-staging-db`)
4. Région : choisir la plus proche
5. Copier la `DATABASE_URL` (sera utilisée plus bas)

### 2.3 Créer Vercel Blob Store

1. Dans le projet Vercel → **Storage** → **Create Database**
2. Choisir **Blob**
3. Nommer le store (ex: `leboy-staging-blob`)
4. Copier le `BLOB_READ_WRITE_TOKEN` (sera utilisé plus bas)

### 2.4 Configurer les Variables d'Environnement

Dans **Settings** → **Environment Variables**, ajouter :

#### 🔴 OBLIGATOIRES

```bash
# Environnement
APP_ENV=staging
NODE_ENV=production

# Base de données
USE_DB=true
DATABASE_URL=postgresql://...  # Depuis Vercel Postgres créé ci-dessus

# URL de l'application
NEXT_PUBLIC_APP_URL=https://votre-projet-staging.vercel.app

# Stockage Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx  # Depuis Vercel Blob créé ci-dessus

# Stripe TEST (obligatoire)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Si webhooks utilisés

# Sécurité
SESSION_SECRET=une-longue-chaine-aleatoire-securisee-minimum-32-caracteres
STAGING_ACCESS_CODE=code-secret-pour-amis

# Emails Safe Mode
EMAIL_MODE=safe
EMAIL_REDIRECT_TO=votre-email@exemple.com
RESEND_API_KEY=re_...

# Protection Stripe (recommandé)
DISABLE_LIVE_STRIPE=true
DISABLE_PAYOUTS=true
```

#### 🟡 OPTIONNELS (mais recommandés)

```bash
# Admin
ICD_ADMIN_EMAIL=contact@leboy.com
ICD_ADMIN_PASSWORD=leboy-admin-2025

# Emails whitelist (alternative à EMAIL_REDIRECT_TO)
EMAIL_ALLOWLIST=votre-email@exemple.com,autre-email@exemple.com
STAGING_EMAIL_ALLOWLIST=votre-email@exemple.com

# Autres
ACCOUNTANT_EMAIL=comptable@exemple.com  # Si utilisé
```

### 2.5 Générer SESSION_SECRET

```bash
# Sur votre machine locale
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copier le résultat dans `SESSION_SECRET`.

---

## 🚀 Étape 3 : Déployer

1. Dans Vercel Dashboard → **Deployments**
2. Cliquer sur **"Redeploy"** ou attendre le déploiement automatique après le push
3. Vérifier que le build passe sans erreur
4. Noter l'URL de déploiement (ex: `https://leboy-staging.vercel.app`)

---

## 🗄️ Étape 4 : Appliquer les Migrations Prisma

### Option A : Via Vercel CLI (recommandé)

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Lier au projet
vercel link

# Récupérer les variables d'environnement
vercel env pull .env.local

# Appliquer les migrations
npx prisma migrate deploy
```

### Option B : Via Vercel Dashboard (SQL direct)

1. Aller dans **Storage** → Votre base Postgres → **"Query"**
2. Exécuter le contenu de `prisma/migrations/20251215235623_add_storage_fields/migration.sql` :

```sql
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "storageKey" TEXT;
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "storageUrl" TEXT;
ALTER TABLE "files" ALTER COLUMN "filePath" DROP NOT NULL;
```

### Option C : Via script de déploiement

Créer un script dans `package.json` :

```json
{
  "scripts": {
    "vercel:deploy": "vercel --prod",
    "vercel:migrate": "vercel env pull .env.local && npx prisma migrate deploy"
  }
}
```

---

## ✅ Étape 5 : Smoke Tests

### 5.1 Accès Staging

1. Aller sur `https://votre-projet-staging.vercel.app`
2. Vérifier la redirection vers `/staging-access`
3. Entrer le `STAGING_ACCESS_CODE`
4. Vérifier le cookie `staging_ok` est défini
5. Vérifier le banner "STAGING" en haut de page

### 5.2 Création de Demande

1. Se connecter avec un compte client
2. Créer une nouvelle demande
3. Vérifier que la demande apparaît dans l'espace admin
4. Vérifier que l'email de notification est redirigé vers `EMAIL_REDIRECT_TO`

### 5.3 Upload Fichier Blob

1. Dans une demande, uploader un fichier (PDF, image)
2. Vérifier que l'URL retournée est une URL Vercel Blob (commence par `https://...public.blob.vercel-storage.com/`)
3. Vérifier que le fichier est accessible via cette URL
4. **Test de persistance** :
   - Redéployer l'application (Vercel Dashboard → Redeploy)
   - Vérifier que le fichier est toujours accessible après le redéploiement
   - ✅ Si accessible → Blob fonctionne correctement
   - ❌ Si perdu → Vérifier `BLOB_READ_WRITE_TOKEN`

### 5.4 Paiement Stripe Test

1. Créer une mission depuis une demande
2. Générer un devis
3. Cliquer sur "Payer"
4. Utiliser une carte test Stripe :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres
5. Vérifier que le paiement passe en mode TEST
6. Vérifier dans Stripe Dashboard (mode Test) que la transaction apparaît

### 5.5 Emails Redirigés

1. Créer une demande
2. Vérifier dans les logs Vercel (`Functions` → logs) :
   ```
   [EMAIL SAFE MODE] Redirection: client@exemple.com → votre-email@exemple.com
   ```
3. Vérifier que l'email arrive bien à `EMAIL_REDIRECT_TO`
4. Vérifier que le contenu de l'email mentionne bien l'email original du client

### 5.6 Connexion Admin

1. Aller sur `/connexion`
2. Se connecter avec :
   - Email : `contact@leboy.com` (ou `ICD_ADMIN_EMAIL`)
   - Mot de passe : `leboy-admin-2025` (ou `ICD_ADMIN_PASSWORD`)
3. Vérifier la redirection vers `/admin`
4. Vérifier l'accès aux fonctionnalités admin

---

## 🔍 Checklist Post-Déploiement

- [ ] Accès staging protégé par code
- [ ] Banner "STAGING" visible
- [ ] Meta robots `noindex,nofollow` présent
- [ ] Base de données PostgreSQL connectée
- [ ] Migrations Prisma appliquées
- [ ] Stockage Blob fonctionnel
- [ ] Fichiers persistants après redéploiement
- [ ] Stripe en mode TEST uniquement
- [ ] Emails redirigés vers `EMAIL_REDIRECT_TO`
- [ ] Connexion admin fonctionnelle
- [ ] Création demande fonctionnelle
- [ ] Upload fichiers fonctionnel
- [ ] Paiement Stripe test fonctionnel

---

## 🐛 Dépannage

### Erreur : "BLOB_READ_WRITE_TOKEN n'est pas configuré"

**Solution** : Vérifier que la variable `BLOB_READ_WRITE_TOKEN` est bien définie dans Vercel → Settings → Environment Variables.

### Erreur : "Migration failed"

**Solution** : 
1. Vérifier que `DATABASE_URL` est correct
2. Vérifier que la base de données est accessible
3. Exécuter manuellement le SQL dans Vercel Postgres → Query

### Fichiers perdus après redéploiement

**Solution** : 
1. Vérifier que `BLOB_READ_WRITE_TOKEN` est correct
2. Vérifier que le provider Blob est utilisé (logs Vercel)
3. Vérifier que les fichiers sont bien uploadés vers Blob (URLs commencent par `https://...blob.vercel-storage.com/`)

### Erreur : "Stripe LIVE keys detected"

**Solution** : Vérifier que toutes les clés Stripe commencent par `pk_test_` et `sk_test_` (pas `pk_live_` ou `sk_live_`).

### Emails non reçus

**Solution** :
1. Vérifier `RESEND_API_KEY` est défini
2. Vérifier `EMAIL_MODE=safe` et `EMAIL_REDIRECT_TO` sont définis
3. Vérifier les logs Vercel pour les erreurs d'envoi

---

## 📝 Notes Importantes

1. **Ne jamais mettre de clés LIVE Stripe en staging**
2. **Toujours utiliser `EMAIL_MODE=safe` en staging**
3. **Le code d'accès staging doit être partagé uniquement avec les testeurs**
4. **Les fichiers Blob sont publics par défaut** (URLs accessibles sans authentification)
5. **Les migrations Prisma doivent être appliquées après chaque déploiement si nouvelles migrations**

---

## 🎉 Succès !

Si tous les tests passent, votre environnement staging est prêt pour les tests avec vos amis !

