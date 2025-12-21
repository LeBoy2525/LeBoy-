# Configuration Prisma pour Vercel Postgres

## ✅ Modifications Appliquées

### A) Configuration Prisma Schema

Le fichier `prisma/schema.prisma` utilise maintenant les URLs recommandées par Vercel Postgres :

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")      // Connection pooling (runtime)
  directUrl = env("POSTGRES_URL_NON_POOLING") // Connexion directe (migrations)
}
```

### B) Configuration Migrations

Le fichier `prisma.config.ts` utilise `POSTGRES_URL_NON_POOLING` pour les migrations (connexion directe requise).

### C) Runtime Prisma

Le fichier `lib/db.ts` utilise `POSTGRES_PRISMA_URL` en priorité pour le runtime (avec pooling).

### D) Singleton PrismaClient

Le singleton PrismaClient est maintenant toujours utilisé (même en production) pour éviter les multi-connexions en serverless.

### E) Retry pour Erreurs Réseau

Un helper `lib/db-retry.ts` a été créé pour retry automatiquement les opérations DB en cas d'erreur réseau (fetch failed, UND_ERR_SOCKET, etc.).

Les fonctions critiques dans `repositories/missionsRepo.ts` utilisent maintenant `withRetry()` :
- `getAllMissions()`
- `getMissionsByDemandeId()`
- `getMissionById()`
- `createMission()`
- `updateMission()`

### F) Build Vercel

Le script `vercel-build` dans `package.json` applique automatiquement les migrations à chaque déploiement :

```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

## 📋 Variables d'Environnement Requises sur Vercel

Assurez-vous que ces variables sont configurées dans Vercel → Settings → Environment Variables :

1. **`POSTGRES_PRISMA_URL`** (obligatoire)
   - URL avec connection pooling pour le runtime
   - Format : `postgresql://...?pgbouncer=true&connection_limit=1`
   - Disponible dans Vercel Postgres → Settings → Connection String (Prisma)

2. **`POSTGRES_URL_NON_POOLING`** (obligatoire)
   - URL sans pooling pour les migrations
   - Format : `postgresql://...` (sans paramètres de pooling)
   - Disponible dans Vercel Postgres → Settings → Connection String (Direct)

3. **Variables de fallback** (optionnelles, pour compatibilité)
   - `DATABASE_URL` ou `POSTGRES_URL` peuvent être utilisées en fallback

## 🔧 Vérification

### 1. Vérifier les Variables sur Vercel

1. Allez sur votre dashboard Vercel
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Vérifiez que `POSTGRES_PRISMA_URL` et `POSTGRES_URL_NON_POOLING` sont définies

### 2. Vérifier les Migrations

Les migrations sont appliquées automatiquement au build via `vercel-build`. Pour vérifier manuellement :

```bash
npx prisma migrate deploy
```

### 3. Vérifier le Schéma

Pour vérifier que le schéma Prisma correspond à la DB :

```bash
npx prisma db pull
npx prisma generate
```

## 🐛 Résolution des Erreurs

### Erreur P2022 : Colonne manquante

Si vous voyez encore des erreurs P2022, cela signifie que le schéma Prisma n'est pas aligné avec la DB. Solution :

1. Créer une migration pour ajouter les colonnes manquantes :
   ```bash
   npx prisma migrate dev --name add_missing_columns
   ```

2. Commit et push les migrations :
   ```bash
   git add prisma/migrations
   git commit -m "Add missing columns migration"
   git push
   ```

3. Les migrations seront appliquées automatiquement au prochain déploiement Vercel

### Erreur fetch failed / UND_ERR_SOCKET

Ces erreurs sont maintenant gérées automatiquement par le système de retry. Si elles persistent :

1. Vérifiez que `POSTGRES_PRISMA_URL` utilise bien le pooling (contient `pgbouncer=true`)
2. Vérifiez les logs Vercel pour voir si le retry fonctionne
3. Augmentez le nombre de retries dans `lib/db-retry.ts` si nécessaire

## 📝 Notes

- **POSTGRES_PRISMA_URL** : Utilisé pour toutes les requêtes runtime (avec pooling pour performance)
- **POSTGRES_URL_NON_POOLING** : Utilisé uniquement pour les migrations (connexion directe requise)
- Le singleton PrismaClient évite les multi-connexions en serverless
- Le retry automatique gère les erreurs réseau temporaires

## ✅ Endpoints Vérifiés

Les endpoints suivants devraient maintenant fonctionner sans erreur P2022 :

- `/api/admin/pending-actions` (utilise `getAllMissions()`)
- `/api/admin/demandes/:id/missions` (utilise `getMissionsByDemandeId()`)
- Tous les endpoints utilisant `updateMissionInternalState()` (utilise `updateMission()`)

