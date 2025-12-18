# Guide Pas à Pas : Configuration des Variables d'Environnement Vercel

## ⚠️ IMPORTANT : Ne PAS mettre de guillemets autour des valeurs

Quand vous copiez les valeurs dans Vercel, **copiez uniquement la valeur elle-même**, sans les guillemets `"` ou `'`.

**Exemple :**
- ❌ **FAUX** : `"production"` (avec guillemets)
- ✅ **CORRECT** : `production` (sans guillemets)

---

## 📍 Étape 1 : Accéder aux Variables d'Environnement

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur votre projet **LeBoy** (ou le nom de votre projet)
3. Cliquez sur l'onglet **Settings** (en haut)
4. Dans le menu de gauche, cliquez sur **Environment Variables**

Vous êtes maintenant prêt à ajouter les variables !

---

## 🔧 Étape 2 : Variables de Base (Environnement)

### Variable 1 : `APP_ENV`

1. Cliquez sur **Add New**
2. **Key** : `APP_ENV`
3. **Value** : `production` (ou `staging` si vous créez un environnement de staging)
4. **Environments** : Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

### Variable 2 : `NODE_ENV`

1. Cliquez sur **Add New**
2. **Key** : `NODE_ENV`
3. **Value** : `production`
4. **Environments** : Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

### Variable 3 : `USE_DB`

1. Cliquez sur **Add New**
2. **Key** : `USE_DB`
3. **Value** : `true` (sans guillemets, juste le mot `true`)
4. **Environments** : Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

---

## 🗄️ Étape 3 : Base de Données PostgreSQL

### Créer la Base de Données PostgreSQL

1. Dans Vercel, allez dans votre projet
2. Cliquez sur l'onglet **Storage** (en haut)
3. Cliquez sur **Create Database**
4. Sélectionnez **Postgres**
5. Choisissez un nom (ex: `leboy-db`) et une région (ex: `Washington, D.C. (us-east-1)`)
6. Cliquez sur **Create**

### Variable 4 : `DATABASE_URL`

1. Une fois la base créée, cliquez dessus
2. Allez dans l'onglet **Settings**
3. Trouvez la section **Connection String** ou **Environment Variables**
4. Copiez la valeur de `DATABASE_URL` (elle ressemble à : `postgresql://...`)
5. Retournez dans **Settings** → **Environment Variables** de votre projet
6. Cliquez sur **Add New**
7. **Key** : `DATABASE_URL`
8. **Value** : Collez la valeur copiée (sans guillemets)
9. **Environments** : Cochez **Production**, **Preview**, et **Development**
10. Cliquez sur **Save**

---

## 🌐 Étape 4 : URL de l'Application

### Variable 5 : `NEXT_PUBLIC_APP_URL`

1. Cliquez sur **Add New**
2. **Key** : `NEXT_PUBLIC_APP_URL`
3. **Value** : `https://le-boy.vercel.app` (remplacez par votre URL Vercel réelle)
   - Pour trouver votre URL : Allez dans **Deployments** → Cliquez sur le dernier déploiement → Copiez l'URL
4. **Environments** : Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

---

## 📦 Étape 5 : Stockage Blob (Fichiers)

### Créer le Stockage Blob

1. Dans Vercel, allez dans votre projet
2. Cliquez sur l'onglet **Storage** (en haut)
3. Cliquez sur **Create Database**
4. Sélectionnez **Blob**
5. Choisissez un nom (ex: `leboy-blob`) et une région
6. Cliquez sur **Create**

### Variable 6 : `BLOB_READ_WRITE_TOKEN`

1. Une fois le Blob créé, cliquez dessus
2. Allez dans l'onglet **Settings**
3. Trouvez la section **Environment Variables** ou **Tokens**
4. Copiez la valeur de `BLOB_READ_WRITE_TOKEN` (elle ressemble à : `vercel_blob_xxxxx`)
5. Retournez dans **Settings** → **Environment Variables** de votre projet
6. Cliquez sur **Add New**
7. **Key** : `BLOB_READ_WRITE_TOKEN`
8. **Value** : Collez la valeur copiée (sans guillemets)
9. **Environments** : Cochez **Production**, **Preview**, et **Development**
10. Cliquez sur **Save**

---

## 🔐 Étape 6 : Sécurité

### Variable 7 : `SESSION_SECRET`

1. **Générez d'abord la clé** en local :
   - Ouvrez votre terminal
   - Exécutez cette commande :
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Copiez le résultat (une longue chaîne de caractères hexadécimaux)

2. Dans Vercel, cliquez sur **Add New**
3. **Key** : `SESSION_SECRET`
4. **Value** : Collez la valeur générée (sans guillemets)
5. **Environments** : Cochez **Production**, **Preview**, et **Development**
6. Cliquez sur **Save**

---

## 💳 Étape 7 : Stripe

### Pour Staging (Test)

1. Allez sur [stripe.com](https://stripe.com) et connectez-vous
2. Allez dans **Developers** → **API keys**
3. Assurez-vous d'être en mode **Test mode** (bascule en haut à droite)

#### Variable 8 : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

1. Dans Stripe, copiez la **Publishable key** (commence par `pk_test_...`)
2. Dans Vercel, cliquez sur **Add New**
3. **Key** : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. **Value** : Collez la clé (sans guillemets)
5. **Environments** : Cochez **Production**, **Preview**, et **Development**
6. Cliquez sur **Save**

#### Variable 9 : `STRIPE_SECRET_KEY`

1. Dans Stripe, copiez la **Secret key** (commence par `sk_test_...`)
2. Dans Vercel, cliquez sur **Add New**
3. **Key** : `STRIPE_SECRET_KEY`
4. **Value** : Collez la clé (sans guillemets)
5. **Environments** : Cochez **Production**, **Preview**, et **Development**
6. Cliquez sur **Save**

#### Variable 10 : `DISABLE_LIVE_STRIPE`

1. Cliquez sur **Add New**
2. **Key** : `DISABLE_LIVE_STRIPE`
3. **Value** : `true` (sans guillemets)
4. **Environments** : Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

#### Variable 11 : `DISABLE_PAYOUTS`

1. Cliquez sur **Add New**
2. **Key** : `DISABLE_PAYOUTS`
3. **Value** : `true` (sans guillemets)
4. **Environments** : Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

### Pour Production (LIVE)

⚠️ **ATTENTION** : Utilisez les clés LIVE uniquement en production réelle !

1. Dans Stripe, basculez en mode **Live mode**
2. Répétez les étapes pour `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` et `STRIPE_SECRET_KEY` avec les clés LIVE (`pk_live_...` et `sk_live_...`)
3. **NE PAS** ajouter `DISABLE_LIVE_STRIPE` ou `DISABLE_PAYOUTS` en production

---

## 📧 Étape 8 : Emails (Resend)

### Créer un Compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte ou connectez-vous
3. Allez dans **API Keys**
4. Cliquez sur **Create API Key**
5. Donnez un nom (ex: "LeBoy Production")
6. Copiez la clé API (commence par `re_...`)

### Pour Staging (Safe Mode)

#### Variable 12 : `RESEND_API_KEY`

1. Dans Vercel, cliquez sur **Add New**
2. **Key** : `RESEND_API_KEY`
3. **Value** : Collez la clé API Resend (sans guillemets)
4. **Environments** : Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

#### Variable 13 : `EMAIL_MODE`

1. Cliquez sur **Add New**
2. **Key** : `EMAIL_MODE`
3. **Value** : `safe` (sans guillemets)
4. **Environments** : Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

#### Variable 14 : `EMAIL_REDIRECT_TO`

1. Cliquez sur **Add New**
2. **Key** : `EMAIL_REDIRECT_TO`
3. **Value** : Votre email personnel (ex: `votre-email@gmail.com`) - **sans guillemets**
4. **Environments** : Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

> 💡 **Note** : En mode `safe`, tous les emails seront redirigés vers cette adresse au lieu d'être envoyés aux destinataires réels. C'est utile pour tester sans envoyer de vrais emails.

### Pour Production

1. Répétez l'étape pour `RESEND_API_KEY`
2. **Optionnel** : Ajoutez `EMAIL_MODE` avec la valeur `production` (ou ne l'ajoutez pas du tout)
3. **Optionnel** : Si vous avez vérifié un domaine dans Resend, ajoutez `RESEND_FROM_EMAIL` avec votre email vérifié (ex: `noreply@leboy.com`)

---

## 🛡️ Étape 9 : Protection Staging (Optionnel)

Si vous créez un environnement de staging séparé :

### Variable 15 : `STAGING_ACCESS_CODE`

1. Cliquez sur **Add New**
2. **Key** : `STAGING_ACCESS_CODE`
3. **Value** : Un code secret de votre choix (ex: `staging-2025-secret`) - **sans guillemets**
4. **Environments** : Cochez **Preview** uniquement (pas Production)
5. Cliquez sur **Save**

---

## ✅ Étape 10 : Variables Optionnelles

### Variable 16 : `RESEND_FROM_EMAIL` (Recommandé)

1. Dans Resend, vérifiez votre domaine (si vous en avez un)
2. Dans Vercel, cliquez sur **Add New**
3. **Key** : `RESEND_FROM_EMAIL`
4. **Value** : Votre email vérifié (ex: `noreply@leboy.com`) - **sans guillemets**
5. **Environments** : Cochez **Production** uniquement
6. Cliquez sur **Save**

> 💡 **Note** : Si vous n'avez pas de domaine vérifié, le système utilisera automatiquement `onboarding@resend.dev` (domaine de test Resend).

### Variable 17 : `ICD_ADMIN_EMAIL` (Optionnel)

1. Cliquez sur **Add New**
2. **Key** : `ICD_ADMIN_EMAIL`
3. **Value** : `contact@leboy.com` (ou votre email admin) - **sans guillemets**
4. **Environments** : Cochez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

---

## 🎯 Résumé : Checklist Complète

Cochez chaque variable au fur et à mesure :

### Variables Obligatoires
- [ ] `APP_ENV` = `production` ou `staging`
- [ ] `NODE_ENV` = `production`
- [ ] `USE_DB` = `true`
- [ ] `DATABASE_URL` = `postgresql://...` (depuis Vercel Postgres)
- [ ] `NEXT_PUBLIC_APP_URL` = `https://votre-app.vercel.app`
- [ ] `BLOB_READ_WRITE_TOKEN` = `vercel_blob_xxxxx` (depuis Vercel Blob)
- [ ] `SESSION_SECRET` = (généré avec la commande Node.js)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` ou `pk_live_...`
- [ ] `STRIPE_SECRET_KEY` = `sk_test_...` ou `sk_live_...`
- [ ] `RESEND_API_KEY` = `re_...`

### Variables Staging (si applicable)
- [ ] `EMAIL_MODE` = `safe`
- [ ] `EMAIL_REDIRECT_TO` = `votre-email@exemple.com`
- [ ] `DISABLE_LIVE_STRIPE` = `true`
- [ ] `DISABLE_PAYOUTS` = `true`
- [ ] `STAGING_ACCESS_CODE` = `votre-code-secret`

### Variables Optionnelles
- [ ] `RESEND_FROM_EMAIL` = `noreply@leboy.com` (si domaine vérifié)
- [ ] `ICD_ADMIN_EMAIL` = `contact@leboy.com`
- [ ] `ICD_ADMIN_EMAILS` = `email1@exemple.com,email2@exemple.com`
- [ ] `ACCOUNTANT_EMAIL` = `comptable@exemple.com`

---

## 🚀 Étape Finale : Redéployer

Une fois toutes les variables ajoutées :

1. Allez dans **Deployments** (onglet en haut)
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**
4. Attendez que le déploiement se termine

Toutes les nouvelles variables seront maintenant disponibles dans votre application !

---

## ❓ Questions Fréquentes

### Q: Dois-je mettre des guillemets autour des valeurs ?
**R:** Non ! Copiez uniquement la valeur elle-même, sans guillemets.

### Q: Les variables sont-elles sensibles à la casse ?
**R:** Oui ! Respectez exactement la casse : `USE_DB` et non `use_db`.

### Q: Puis-je modifier une variable après l'avoir créée ?
**R:** Oui, cliquez sur la variable et modifiez-la, puis sauvegardez.

### Q: Les variables sont-elles partagées entre les environnements ?
**R:** Non, vous devez cocher les environnements (Production, Preview, Development) pour chaque variable.

### Q: Comment savoir si une variable est bien configurée ?
**R:** Après le redéploiement, vérifiez les logs dans **Deployments** → Cliquez sur le déploiement → **Logs**.

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :
1. Vérifiez que toutes les valeurs sont copiées **sans guillemets**
2. Vérifiez que les clés API sont complètes (pas tronquées)
3. Redéployez l'application après avoir ajouté les variables
4. Consultez les logs de déploiement pour voir les erreurs éventuelles

