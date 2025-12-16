# Test Staging Local

Guide rapide pour tester l'environnement de staging localement avant le déploiement sur Vercel.

## 🚀 Démarrage rapide

### 1. Créer le fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet avec ces variables minimales :

```bash
# Environnement
APP_ENV=staging

# Base de données (utilisez votre DB locale ou staging)
USE_DB=true
DATABASE_URL=postgresql://user:password@localhost:5432/leboy_staging

# URL locale
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe TEST (obligatoire - utilisez vos clés de test)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Code d'accès staging
STAGING_ACCESS_CODE=test123

# Sécurité
SESSION_SECRET=une-longue-chaine-aleatoire-securisee-minimum-32-caracteres

# Emails safe mode
EMAIL_MODE=safe
EMAIL_REDIRECT_TO=votre-email@exemple.com

# Garde-fou Stripe
DISABLE_LIVE_STRIPE=true
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Générer le client Prisma

```bash
npm run db:generate
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

## ✅ Tests à effectuer

### Test 1: Protection d'accès staging

1. Ouvrez `http://localhost:3000`
2. **Attendu**: Redirection vers `/staging-access`
3. Entrez le code d'accès (`test123` par défaut)
4. **Attendu**: Redirection vers la page d'accueil

### Test 2: Banner staging

1. Après avoir entré le code d'accès
2. **Attendu**: Banner jaune visible en haut de la page avec le texte "⚠️ ENVIRONNEMENT DE STAGING — Tests uniquement — Paiements désactivés"

### Test 3: Meta robots noindex

1. Ouvrez le code source de la page (`Ctrl+U` ou `Cmd+U`)
2. Recherchez `<meta name="robots"`
3. **Attendu**: `content="noindex,nofollow,noarchive,nosnippet"`

### Test 4: Robots.txt

1. Ouvrez `http://localhost:3000/robots.txt`
2. **Attendu**: 
```
User-agent: *
Disallow: /
```

### Test 5: Protection Stripe LIVE

1. Modifiez temporairement `.env.local` pour mettre une clé LIVE:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   ```
2. Redémarrez le serveur (`npm run dev`)
3. **Attendu**: Erreur au démarrage avec message explicite

### Test 6: Emails safe mode

1. Créez une demande ou déclenchez un envoi d'email
2. **Attendu**: 
   - Email redirigé vers `EMAIL_REDIRECT_TO`
   - Log dans la console: `[EMAIL SAFE MODE] Redirection: ...`

### Test 7: Cookie staging

1. Après avoir entré le code d'accès
2. Ouvrez les DevTools → Application → Cookies
3. **Attendu**: Cookie `staging_ok` présent avec valeur `1`

## 🐛 Dépannage

### Erreur: "Clé Stripe LIVE détectée"

**Cause**: Une clé LIVE est configurée par erreur.

**Solution**: Vérifier que toutes les clés commencent par `pk_test_` et `sk_test_`.

### Erreur: "Configuration invalide"

**Cause**: Variables d'environnement manquantes.

**Solution**: Vérifier que toutes les variables obligatoires sont définies dans `.env.local`.

### Redirection infinie vers `/staging-access`

**Cause**: Le cookie `staging_ok` n'est pas défini correctement.

**Solution**: 
1. Vérifier que le code d'accès est correct
2. Vérifier les DevTools → Console pour les erreurs
3. Vérifier que le cookie est bien défini après validation

### Banner staging ne s'affiche pas

**Cause**: La détection de l'environnement ne fonctionne pas.

**Solution**: 
1. Vérifier que `APP_ENV=staging` est défini
2. Vérifier que le composant `StagingBanner` est bien importé dans `layout.tsx`

## 📝 Checklist avant déploiement

- [ ] Tous les tests ci-dessus passent
- [ ] Les clés Stripe sont en mode TEST
- [ ] Le code d'accès staging est défini
- [ ] Les emails sont configurés en mode safe
- [ ] La base de données staging est accessible
- [ ] Aucune erreur dans la console
- [ ] Le build fonctionne (`npm run build`)

## 🚀 Prêt pour Vercel

Une fois tous les tests passés localement, vous pouvez :

1. Push sur GitHub
2. Configurer les variables d'environnement sur Vercel
3. Déployer

Voir `STAGING_SETUP.md` pour les instructions complètes de déploiement sur Vercel.

