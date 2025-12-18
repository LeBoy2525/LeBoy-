# Variables d'environnement pour Vercel

> 📖 **Guide Pas à Pas** : Consultez [GUIDE_VARIABLES_VERCEL.md](./GUIDE_VARIABLES_VERCEL.md) pour un guide détaillé avec instructions étape par étape.

> ⚠️ **IMPORTANT** : Ne mettez **PAS** de guillemets autour des valeurs dans Vercel. Copiez uniquement la valeur elle-même.

## Variables OBLIGATOIRES

### Environnement
- `APP_ENV` = `production` (ou `staging` pour staging)
- `NODE_ENV` = `production`
- `USE_DB` = `true`

### Base de données
- `DATABASE_URL` = `postgresql://...` (depuis Vercel Postgres - Settings)

### URL de l'application
- `NEXT_PUBLIC_APP_URL` = `https://le-boy.vercel.app` (ou votre URL Vercel)

### Stockage Blob
- `BLOB_READ_WRITE_TOKEN` = `vercel_blob_xxxxx` (depuis Vercel Blob - Settings)

### Sécurité
- `SESSION_SECRET` = Générer avec cette commande :
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  (Minimum 32 caractères)

### Stripe (TEST pour staging, LIVE pour production)

**Pour Staging :**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
- `STRIPE_SECRET_KEY` = `sk_test_...`
- `STRIPE_WEBHOOK_SECRET` = `whsec_...` (si webhooks utilisés)
- `DISABLE_LIVE_STRIPE` = `true`
- `DISABLE_PAYOUTS` = `true`

**Pour Production :**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- `STRIPE_SECRET_KEY` = `sk_live_...`
- `STRIPE_WEBHOOK_SECRET` = `whsec_...` (si webhooks utilisés)
- ⚠️ NE PAS mettre `DISABLE_LIVE_STRIPE` ou `DISABLE_PAYOUTS` en production

### Emails (Resend)

**Pour Staging (Safe Mode) :**
- `EMAIL_MODE` = `safe`
- `EMAIL_REDIRECT_TO` = `votre-email@exemple.com`
- `RESEND_API_KEY` = `re_...`

**Pour Production :**
- `EMAIL_MODE` = `production` (ou ne pas définir)
- `RESEND_API_KEY` = `re_...`

### Protection Staging (si environnement staging)
- `STAGING_ACCESS_CODE` = Code secret (ex: `staging-2025-secret`)

## Variables OPTIONNELLES (mais recommandées)

- `ICD_ADMIN_EMAIL` = `contact@leboy.com`
- `ICD_ADMIN_EMAILS` = `email1@exemple.com,email2@exemple.com`
- `ACCOUNTANT_EMAIL` = `comptable@exemple.com`
- `FROM_EMAIL` = `noreply@leboy.com`
- `FROM_NAME` = `LeBoy`

## Ordre d'ajout recommandé

1. D'abord : `APP_ENV`, `NODE_ENV`, `USE_DB`
2. Ensuite : `DATABASE_URL` (après création de Postgres)
3. Puis : `BLOB_READ_WRITE_TOKEN` (après création de Blob)
4. Ensuite : `SESSION_SECRET` (généré)
5. Puis : Variables Stripe
6. Ensuite : Variables Email (Resend)
7. Enfin : Variables optionnelles

