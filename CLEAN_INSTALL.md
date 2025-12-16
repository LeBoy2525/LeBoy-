# Procédure de Clean Install

Cette procédure permet de démarrer le projet sur un PC vierge.

## Prérequis

- Node.js 20.9.0+ (utiliser `.nvmrc` avec `nvm use`)
- Docker et Docker Compose
- Git

## Étapes

### 1. Cloner le projet

```bash
git clone <repository-url>
cd icd-frontend-new
```

### 2. Configurer l'environnement

```bash
cp .env.example .env.local
```

Éditez `.env.local` et configurez :
- `DATABASE_URL` (sera utilisé par Docker Compose)
- `ICD_ADMIN_EMAIL` et `ICD_ADMIN_PASSWORD` (optionnel, valeurs par défaut dans seed)

### 3. Démarrer PostgreSQL et Mailpit

```bash
npm run docker:up
```

Vérifiez que les conteneurs sont démarrés :
```bash
docker ps
```

Vous devriez voir :
- `leboy-postgres` (port 5432)
- `leboy-mailpit` (ports 1025 et 8025)

### 4. Installer les dépendances

```bash
npm ci
```

### 5. Générer le client Prisma

```bash
npm run db:generate
```

### 6. Appliquer les migrations

```bash
npm run db:migrate
```

Quand Prisma demande un nom de migration, utilisez : `init`

### 7. Seed la base de données

```bash
npm run db:seed
```

Cela créera :
- L'utilisateur admin
- Les pays
- Les catégories de services
- Les configurations de commission

### 8. Démarrer le serveur de développement

```bash
npm run dev
```

Le projet sera accessible sur `http://localhost:3000`

### 9. (Optionnel) Configurer Stripe pour les tests

Si vous voulez tester les paiements :

1. Créez un compte Stripe (mode test)
2. Ajoutez les clés dans `.env.local` :
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. Installez Stripe CLI :
   ```bash
   # Windows (via Scoop)
   scoop install stripe
   
   # macOS (via Homebrew)
   brew install stripe/stripe-cli/stripe
   
   # Linux
   # Voir https://stripe.com/docs/stripe-cli
   ```

4. Connectez-vous :
   ```bash
   stripe login
   ```

5. Écoutez les webhooks :
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## Vérifications

### Base de données

Ouvrez Prisma Studio pour visualiser les données :
```bash
npm run db:studio
```

### Emails

Ouvrez Mailpit pour voir les emails envoyés :
```
http://localhost:8025
```

### Connexion admin

- Email : `admin@leboy.com` (ou celui configuré dans `.env.local`)
- Mot de passe : `admin123` (ou celui configuré dans `.env.local`)

## Commandes utiles

```bash
# Arrêter les conteneurs Docker
npm run docker:down

# Voir les logs Docker
npm run docker:logs

# Réinitialiser la base de données (⚠️ supprime toutes les données)
npm run db:reset

# Ouvrir Prisma Studio
npm run db:studio
```

## Dépannage

### Erreur : "Cannot connect to database"

1. Vérifiez que Docker est démarré
2. Vérifiez que les conteneurs sont actifs : `docker ps`
3. Vérifiez la `DATABASE_URL` dans `.env.local`

### Erreur : "Prisma Client not generated"

Exécutez : `npm run db:generate`

### Erreur : "Migration failed"

1. Vérifiez que PostgreSQL est démarré
2. Vérifiez la `DATABASE_URL`
3. Essayez : `npm run db:reset` (⚠️ supprime les données)

### Erreur : "Port 3000 already in use"

Changez le port dans `package.json` ou arrêtez le processus qui utilise le port 3000.

