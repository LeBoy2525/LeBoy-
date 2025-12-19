# 📋 Valeurs à Copier dans Vercel - Environment Variables

> ⚠️ **IMPORTANT** : Copiez uniquement les valeurs (sans guillemets) dans Vercel → Settings → Environment Variables

---

## ✅ SESSION_SECRET (Généré)

**Key** : `SESSION_SECRET`  
**Value** : 
```
f6fbae83494a6e3e14eff05d31ea4d3bb3f56cf2e7f33dc077147c95174db4c4
```

**Instructions** :
1. Allez dans Vercel → Settings → Environment Variables
2. Cliquez sur "Add New"
3. Key : `SESSION_SECRET`
4. Value : Copiez la valeur ci-dessus (sans guillemets)
5. Environments : Cochez Production, Preview, Development
6. Cliquez sur "Save"

---

## 📧 RESEND_API_KEY (À obtenir sur Resend.com)

**Key** : `RESEND_API_KEY`  
**Value** : `re_...` (à obtenir sur resend.com)

**Instructions pour obtenir la clé** :
1. Allez sur [resend.com](https://resend.com) et connectez-vous
2. Allez dans **API Keys** (ou **Developers** → **API Keys**)
3. Cliquez sur **Create API Key**
4. Donnez un nom (ex: "LeBoy Production")
5. Copiez la clé (commence par `re_...`)

**Dans Vercel** :
1. Settings → Environment Variables → Add New
2. Key : `RESEND_API_KEY`
3. Value : Collez la clé copiée (sans guillemets)
4. Environments : Production, Preview, Development
5. Save

---

## 🌐 NEXT_PUBLIC_APP_URL (À trouver dans Vercel)

**Key** : `NEXT_PUBLIC_APP_URL`  
**Value** : `https://votre-projet.vercel.app` (votre URL Vercel)

**Instructions pour trouver l'URL** :
1. Dans Vercel, allez dans **Deployments**
2. Cliquez sur le dernier déploiement
3. Copiez l'URL affichée (ex: `https://le-boy-xxxxx.vercel.app`)

**Dans Vercel** :
1. Settings → Environment Variables → Add New
2. Key : `NEXT_PUBLIC_APP_URL`
3. Value : Collez l'URL (sans guillemets)
4. Environments : Production, Preview, Development
5. Save

---

## 💳 Variables Stripe (À obtenir sur Stripe.com)

### Pour Staging/Test (Mode TEST)

**Key** : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  
**Value** : `pk_test_...` (depuis Stripe Dashboard en mode Test)

**Key** : `STRIPE_SECRET_KEY`  
**Value** : `sk_test_...` (depuis Stripe Dashboard en mode Test)

**Key** : `DISABLE_LIVE_STRIPE`  
**Value** : `true` (sans guillemets)

**Key** : `DISABLE_PAYOUTS`  
**Value** : `true` (sans guillemets)

**Instructions pour obtenir les clés Stripe** :
1. Allez sur [stripe.com](https://stripe.com) et connectez-vous
2. Assurez-vous d'être en mode **Test mode** (bascule en haut à droite)
3. Allez dans **Developers** → **API keys**
4. Copiez la **Publishable key** (`pk_test_...`)
5. Copiez la **Secret key** (`sk_test_...`)

---

## 📦 Variables déjà configurées automatiquement

Ces variables ont été ajoutées automatiquement par Vercel lors de la création de PostgreSQL et Blob :

- ✅ `DATABASE_URL` - Déjà configurée (depuis Vercel Postgres)
- ✅ `POSTGRES_URL` - Déjà configurée (peut être ignorée)
- ✅ `PRISMA_DATABASE_URL` - Déjà configurée (peut être ignorée)
- ✅ `BLOB_READ_WRITE_TOKEN` - Déjà configurée (si vous avez créé Blob Storage)

---

## 🔧 Variables déjà ajoutées manuellement

D'après vos logs, vous avez déjà :
- ✅ `USE_DB` = `true`
- ✅ `NODE_ENV` = `production`
- ✅ `RESEND_FROM_EMAIL` = (configurée)

---

## 📝 Checklist Complète

### Variables à ajouter maintenant :

- [ ] `SESSION_SECRET` = `f6fbae83494a6e3e14eff05d31ea4d3bb3f56cf2e7f33dc077147c95174db4c4`
- [ ] `RESEND_API_KEY` = `re_...` (à obtenir sur resend.com)
- [ ] `NEXT_PUBLIC_APP_URL` = `https://votre-projet.vercel.app` (votre URL Vercel)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` (si vous utilisez Stripe)
- [ ] `STRIPE_SECRET_KEY` = `sk_test_...` (si vous utilisez Stripe)
- [ ] `DISABLE_LIVE_STRIPE` = `true` (si staging)
- [ ] `DISABLE_PAYOUTS` = `true` (si staging)

### Variables optionnelles (recommandées) :

- [ ] `EMAIL_MODE` = `safe` (pour staging, redirige tous les emails)
- [ ] `EMAIL_REDIRECT_TO` = `votre-email@exemple.com` (votre email pour recevoir les tests)
- [ ] `APP_ENV` = `production` ou `staging`
- [ ] `ICD_ADMIN_EMAIL` = `contact@leboy.com`

---

## 🚀 Après avoir ajouté les variables

1. **Redéployez l'application** :
   - Allez dans **Deployments**
   - Cliquez sur les **3 points** (⋯) du dernier déploiement
   - Cliquez sur **Redeploy**

2. **Vérifiez les logs** :
   - Après le déploiement, cliquez sur le déploiement
   - Allez dans **Logs** pour vérifier qu'il n'y a pas d'erreurs

---

## ⚠️ Rappel Important

- **Ne mettez PAS de guillemets** autour des valeurs dans Vercel
- Copiez uniquement la valeur elle-même
- Cochez les environnements appropriés (Production, Preview, Development)
- Redéployez après avoir ajouté les variables

