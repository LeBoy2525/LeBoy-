# Guide : Comment obtenir chaque valeur pour Vercel

## 🔐 1. SESSION_SECRET (À générer maintenant)

**Générer maintenant dans votre terminal :**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Résultat attendu :** Une chaîne de 64 caractères (ex: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`)

**Dans Vercel :**
- Key : `SESSION_SECRET`
- Value : Copiez le résultat de la commande ci-dessus

---

## 🗄️ 2. DATABASE_URL (Après création de PostgreSQL)

**Étapes :**
1. Dans votre projet Vercel → Onglet **"Storage"**
2. Cliquez sur **"Create Database"**
3. Choisissez **"Postgres"**
4. Nommez-la : `icd-production-db`
5. Région : `iad1` (ou la plus proche de vos utilisateurs)
6. Cliquez sur **"Create"**
7. Une fois créée, cliquez sur votre base de données
8. Allez dans l'onglet **"Settings"**
9. Cherchez **"Connection String"** ou **"DATABASE_URL"**
10. Copiez la valeur (format : `postgres://default:xxxxx@ep-xxx.region.postgres.vercel-storage.com:5432/verceldb`)

**Dans Vercel :**
- Key : `DATABASE_URL`
- Value : Collez la connection string complète

---

## 📦 3. BLOB_READ_WRITE_TOKEN (Après création de Blob Storage)

**Étapes :**
1. Dans votre projet Vercel → Onglet **"Storage"**
2. Cliquez sur **"Create Database"**
3. Choisissez **"Blob"**
4. Nommez-le : `icd-production-blob`
5. Cliquez sur **"Create"**
6. Une fois créé, cliquez sur votre Blob Store
7. Allez dans l'onglet **"Settings"**
8. Cherchez **"BLOB_READ_WRITE_TOKEN"** ou **"Token"**
9. Cliquez sur **"Reveal"** ou **"Show"** pour voir le token
10. Copiez le token (format : `vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxx`)

**Dans Vercel :**
- Key : `BLOB_READ_WRITE_TOKEN`
- Value : Collez le token complet

---

## 💳 4. Clés Stripe (TEST pour commencer)

### 4.1 Créer un compte Stripe (si pas encore fait)
1. Allez sur https://stripe.com
2. Créez un compte gratuit
3. Connectez-vous

### 4.2 Obtenir les clés TEST
1. Dans le tableau de bord Stripe, assurez-vous d'être en mode **"Test"** (toggle en haut à droite)
2. Allez dans **"Developers"** → **"API keys"**
3. Vous verrez deux clés :

**Clé Publique (Publishable key) :**
- Format : `pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`
- Commence par `pk_test_`
- Copiez cette valeur

**Clé Secrète (Secret key) :**
- Format : `sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`
- Commence par `sk_test_`
- Cliquez sur **"Reveal test key"** pour la voir
- Copiez cette valeur

**Dans Vercel :**
- Key : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Value : `pk_test_...` (votre clé publique)

- Key : `STRIPE_SECRET_KEY`
- Value : `sk_test_...` (votre clé secrète)

### 4.3 Webhook Secret (Optionnel pour l'instant)
- Vous pouvez l'ajouter plus tard si vous utilisez les webhooks Stripe
- Pour l'instant, vous pouvez ignorer `STRIPE_WEBHOOK_SECRET`

---

## 📧 5. Clé API Resend (Pour les emails)

### 5.1 Créer un compte Resend (si pas encore fait)
1. Allez sur https://resend.com
2. Créez un compte gratuit
3. Connectez-vous

### 5.2 Obtenir la clé API
1. Dans le tableau de bord Resend, allez dans **"API Keys"**
2. Cliquez sur **"Create API Key"**
3. Donnez-lui un nom (ex: `vercel-production`)
4. Sélectionnez les permissions : **"Sending access"** (ou **"Full access"**)
5. Cliquez sur **"Add"**
6. **IMPORTANT :** Copiez la clé immédiatement (elle ne sera plus visible après)
7. Format : `re_1234567890abcdefghijklmnop` (commence par `re_`)

**Dans Vercel :**
- Key : `RESEND_API_KEY`
- Value : `re_...` (votre clé API)

---

## 🌐 6. NEXT_PUBLIC_APP_URL (Après le premier déploiement)

**Étapes :**
1. Après avoir créé le projet sur Vercel et fait le premier déploiement
2. Allez dans l'onglet **"Deployments"**
3. Cliquez sur le dernier déploiement
4. Vous verrez l'URL de votre application (ex: `https://le-boy-xxxxx.vercel.app`)
5. Copiez cette URL complète

**Dans Vercel :**
- Key : `NEXT_PUBLIC_APP_URL`
- Value : `https://votre-projet.vercel.app` (votre vraie URL)

---

## 📝 7. Variables Email (Optionnelles mais recommandées)

**EMAIL_REDIRECT_TO :**
- Votre adresse email personnelle pour recevoir tous les emails en mode staging
- Exemple : `contact@leboy.com` ou `votre-email@gmail.com`

**EMAIL_MODE :**
- Pour staging : `safe` (tous les emails seront redirigés vers `EMAIL_REDIRECT_TO`)
- Pour production : `production` (ou ne pas définir)

**Dans Vercel :**
- Key : `EMAIL_REDIRECT_TO`
- Value : `votre-email@exemple.com`

- Key : `EMAIL_MODE`
- Value : `safe` (pour staging) ou `production` (pour production)

---

## 🔒 8. STAGING_ACCESS_CODE (Si environnement staging)

**Pour protéger votre environnement staging :**
- Créez un code secret (ex: `staging-2025-secret` ou `leboy-staging-123`)
- Ce code sera demandé aux visiteurs avant d'accéder au site

**Dans Vercel :**
- Key : `STAGING_ACCESS_CODE`
- Value : `votre-code-secret` (ex: `staging-2025-secret`)

---

## ✅ Checklist de valeurs à obtenir

- [ ] **SESSION_SECRET** - Généré avec la commande Node.js
- [ ] **DATABASE_URL** - Depuis Vercel Postgres (après création)
- [ ] **BLOB_READ_WRITE_TOKEN** - Depuis Vercel Blob (après création)
- [ ] **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** - Depuis Stripe Dashboard (mode Test)
- [ ] **STRIPE_SECRET_KEY** - Depuis Stripe Dashboard (mode Test)
- [ ] **RESEND_API_KEY** - Depuis Resend Dashboard
- [ ] **NEXT_PUBLIC_APP_URL** - URL Vercel (après premier déploiement)
- [ ] **EMAIL_REDIRECT_TO** - Votre email personnel
- [ ] **STAGING_ACCESS_CODE** - Code secret (si staging)

---

## 🚀 Ordre recommandé

1. **Maintenant** : Générez `SESSION_SECRET`
2. **Sur Vercel** : Créez PostgreSQL → Copiez `DATABASE_URL`
3. **Sur Vercel** : Créez Blob Storage → Copiez `BLOB_READ_WRITE_TOKEN`
4. **Sur Stripe** : Obtenez les clés TEST
5. **Sur Resend** : Obtenez la clé API
6. **Après déploiement** : Copiez l'URL Vercel pour `NEXT_PUBLIC_APP_URL`

