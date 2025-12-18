# Guide de Diagnostic des Emails

## Problème : Les codes de vérification n'arrivent pas par email

Ce guide vous aide à diagnostiquer et résoudre les problèmes d'envoi d'emails.

## 🔍 Diagnostic Rapide

### 1. Vérifier les logs Vercel

1. Aller dans **Vercel → Votre projet → Deployments → Cliquer sur le dernier déploiement → Logs**
2. Chercher les messages suivants :

#### ✅ Succès
```
✅ Email de vérification envoyé avec succès
   📧 Destinataire: user@example.com
   📤 Expéditeur: noreply@leboy.com
   🆔 Email ID: abc123...
```

#### ❌ Erreur de configuration
```
❌ ERREUR CONFIGURATION EMAIL
⚠️ RESEND_API_KEY non configurée dans les variables d'environnement
```

#### ❌ Erreur Resend
```
❌ ERREUR ENVOI EMAIL RESEND
❌ Erreur: [détails de l'erreur]
```

### 2. Vérifier les variables d'environnement dans Vercel

**Vercel → Settings → Environment Variables**

Vérifier que ces variables sont définies :

```
✅ RESEND_API_KEY = re_... (votre clé API Resend)
✅ RESEND_FROM_EMAIL = noreply@leboy.com (ou un email vérifié)
✅ EMAIL_MODE = production (ou supprimer pour production)
✅ EMAIL_REDIRECT_TO = (supprimer ou laisser vide pour production)
```

## 🛠️ Solutions selon le problème

### Problème 1 : RESEND_API_KEY manquante

**Symptômes :**
- Logs montrent "RESEND_API_KEY non configurée"
- Aucun email envoyé

**Solution :**
1. Aller sur https://resend.com/api-keys
2. Créer une nouvelle clé API ou copier une existante
3. Dans Vercel → Settings → Environment Variables
4. Ajouter `RESEND_API_KEY` avec la valeur `re_...`
5. Redéployer l'application

### Problème 2 : FROM_EMAIL non vérifié

**Symptômes :**
- Logs montrent une erreur Resend
- Erreur mentionnant "domain not verified" ou "sender not verified"

**Solution :**
1. Aller sur https://resend.com/domains
2. Vérifier que le domaine `leboy.com` est vérifié
3. Ou utiliser temporairement `onboarding@resend.dev` pour les tests :
   - Dans Vercel, définir `RESEND_FROM_EMAIL = onboarding@resend.dev`

### Problème 3 : Mode SAFE activé en production

**Symptômes :**
- Logs montrent "[EMAIL SAFE MODE] Redirection: ..."
- Les emails arrivent à une autre adresse que celle de l'utilisateur

**Solution :**
1. Dans Vercel → Settings → Environment Variables
2. Supprimer ou modifier `EMAIL_MODE` :
   - Pour production : supprimer la variable ou mettre `production`
   - Pour staging : garder `safe` mais vérifier `EMAIL_REDIRECT_TO`
3. Redéployer

### Problème 4 : Quota Resend dépassé

**Symptômes :**
- Erreur Resend mentionnant "quota" ou "limit"

**Solution :**
1. Aller sur https://resend.com/dashboard
2. Vérifier votre quota d'emails
3. Mettre à niveau votre plan si nécessaire

## 🧪 Test de la configuration

### Script de vérification

Exécuter le script de diagnostic :

```bash
tsx scripts/check-email-config.ts
```

Ce script vérifie :
- ✅ Présence de RESEND_API_KEY
- ✅ Format de la clé API
- ✅ Configuration du mode email
- ✅ Variables d'environnement

### Test manuel

1. Créer un compte test
2. Vérifier les logs Vercel pour voir si l'email est envoyé
3. Vérifier le dashboard Resend → Emails pour voir les envois

## 📊 Vérification dans Resend Dashboard

1. Aller sur https://resend.com/emails
2. Vérifier les emails envoyés :
   - ✅ Status "Delivered" = email envoyé avec succès
   - ❌ Status "Bounced" = email rejeté
   - ❌ Status "Failed" = erreur d'envoi

3. Cliquer sur un email pour voir les détails de l'erreur

## 🔧 Configuration Recommandée pour Production

```env
# Obligatoire
RESEND_API_KEY=re_votre_cle_api
RESEND_FROM_EMAIL=noreply@leboy.com

# Optionnel (ne pas définir en production)
# EMAIL_MODE=production
# EMAIL_REDIRECT_TO=
```

## 🔧 Configuration Recommandée pour Staging

```env
# Obligatoire
RESEND_API_KEY=re_votre_cle_api
RESEND_FROM_EMAIL=onboarding@resend.dev

# Pour rediriger tous les emails vers votre email
EMAIL_MODE=safe
EMAIL_REDIRECT_TO=votre-email@exemple.com
```

## 📝 Checklist de Déploiement

- [ ] `RESEND_API_KEY` définie dans Vercel
- [ ] `RESEND_FROM_EMAIL` défini et vérifié dans Resend
- [ ] Domaine vérifié dans Resend (si utilisation d'un domaine personnalisé)
- [ ] `EMAIL_MODE` = `production` ou non défini (pour production)
- [ ] `EMAIL_REDIRECT_TO` supprimé ou vide (pour production)
- [ ] Application redéployée après modification des variables
- [ ] Test d'envoi d'email effectué
- [ ] Logs Vercel vérifiés pour confirmer l'envoi

## 🆘 En cas de problème persistant

1. Vérifier les logs Vercel pour l'erreur exacte
2. Vérifier le dashboard Resend pour les détails d'envoi
3. Tester avec `onboarding@resend.dev` comme FROM_EMAIL
4. Vérifier que le quota Resend n'est pas dépassé
5. Contacter le support Resend si nécessaire

## 📞 Support

- Documentation Resend : https://resend.com/docs
- Dashboard Resend : https://resend.com/dashboard
- Support Resend : support@resend.com

