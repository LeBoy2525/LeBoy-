# Configuration de l'envoi d'emails avec Resend

LeBoy utilise [Resend](https://resend.com) pour l'envoi d'emails transactionnels.

## 🚀 Configuration rapide

### 1. Créer un compte Resend

1. Allez sur [https://resend.com](https://resend.com)
2. Créez un compte gratuit (3000 emails/mois gratuits)
3. Vérifiez votre email

### 2. Obtenir votre clé API

1. Connectez-vous à votre dashboard Resend
2. Allez dans **API Keys**
3. Cliquez sur **Create API Key**
4. Copiez la clé API (commence par `re_`)

### 3. Configurer votre domaine (optionnel mais recommandé)

Pour utiliser votre propre domaine (ex: `noreply@leboy.com`) :

1. Allez dans **Domains** dans votre dashboard Resend
2. Ajoutez votre domaine
3. Suivez les instructions pour configurer les enregistrements DNS
4. Attendez la vérification (peut prendre quelques minutes)

### 4. Configurer les variables d'environnement

1. Copiez le fichier `.env.local.example` vers `.env.local` :
   ```bash
   cp .env.local.example .env.local
   ```

2. Éditez `.env.local` et ajoutez votre clé API :
   ```
   RESEND_API_KEY=re_votre_cle_api_ici
   RESEND_FROM_EMAIL=noreply@leboy.com
   ```

   **Note:** Si vous n'avez pas encore configuré de domaine, utilisez le domaine par défaut de Resend (vous le trouverez dans votre dashboard).

### 5. Redémarrer le serveur

```bash
npm run dev
```

## 📧 Emails envoyés

Le système envoie automatiquement :

- **Email de vérification** : Lors de l'inscription d'un nouveau client
- **Notifications** : Pour les mises à jour de missions, paiements, etc.

## 🧪 Mode développement

Si `RESEND_API_KEY` n'est pas configuré, les emails seront loggés dans la console du serveur au lieu d'être envoyés. C'est pratique pour le développement local.

## 📚 Documentation Resend

- [Documentation Resend](https://resend.com/docs)
- [API Reference](https://resend.com/docs/api-reference)
- [Pricing](https://resend.com/pricing)

## ⚠️ Important

- Ne commitez **jamais** votre fichier `.env.local` (il est déjà dans `.gitignore`)
- Gardez votre clé API secrète
- Le plan gratuit de Resend permet 3000 emails/mois

