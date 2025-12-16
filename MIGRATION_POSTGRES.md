# Migration vers PostgreSQL avec Prisma

Ce document explique comment migrer le système de stockage JSON vers PostgreSQL avec Prisma.

## 📋 Prérequis

1. **Base de données PostgreSQL** : Créez une base de données PostgreSQL (locale ou cloud)
   - **Recommandé** : [Neon](https://neon.tech), [Supabase](https://supabase.com), ou [Railway](https://railway.app)
   - **Local** : Installez PostgreSQL localement

2. **Variable d'environnement** : Configurez `DATABASE_URL` dans votre fichier `.env` :
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   ```

## 🚀 Étapes de migration

### 1. Installer les dépendances

```bash
npm install
```

### 2. Générer le client Prisma

```bash
npm run db:generate
```

### 3. Créer les migrations

```bash
npm run db:migrate
```

Cette commande va :
- Créer toutes les tables dans votre base de données PostgreSQL
- Générer les migrations Prisma

### 4. Migrer les données JSON existantes (optionnel)

Si vous avez des données existantes dans les fichiers JSON, exécutez le script de migration :

```bash
npx tsx scripts/migrate-json-to-db.ts
```

⚠️ **Important** : Ce script doit être exécuté **UNE SEULE FOIS** après la création de la base de données.

### 5. Vérifier la migration

Ouvrez Prisma Studio pour visualiser vos données :

```bash
npm run db:studio
```

## 📁 Structure des repositories

Les repositories sont dans le dossier `repositories/` :

- `demandesRepo.ts` - Gestion des demandes
- `missionsRepo.ts` - Gestion des missions
- `prestatairesRepo.ts` - Gestion des prestataires
- `propositionsRepo.ts` - Gestion des propositions
- `usersRepo.ts` - Gestion des utilisateurs
- `notificationsRepo.ts` - Gestion des notifications admin

## 🔄 Mise à jour des routes API

### Avant (JSON)

```typescript
import { demandesStore } from "@/lib/demandesStore";

export async function GET() {
  const demandes = demandesStore.filter(d => !d.deletedAt);
  return NextResponse.json({ demandes });
}
```

### Après (PostgreSQL)

```typescript
import { getAllDemandes } from "@/repositories/demandesRepo";

export async function GET() {
  const demandes = await getAllDemandes();
  return NextResponse.json({ demandes });
}
```

## 🚨 Désactivation du JSON en production

Le stockage JSON est **automatiquement désactivé en production**. Si vous essayez d'utiliser les fonctions `loadFromFile` ou `saveToFile` en production, une erreur sera levée.

## 📝 Commandes utiles

- `npm run db:migrate` - Créer une nouvelle migration
- `npm run db:generate` - Régénérer le client Prisma
- `npm run db:studio` - Ouvrir Prisma Studio
- `npm run db:migrate:prod` - Appliquer les migrations en production

## 🔍 Vérification

Après la migration, vérifiez que :

1. ✅ Les tables sont créées dans PostgreSQL
2. ✅ Les données sont migrées (si vous avez utilisé le script)
3. ✅ Les routes API fonctionnent correctement
4. ✅ Les données persistent après un redémarrage

## 🐛 Dépannage

### Erreur : "DATABASE_URL is not set"

Vérifiez que la variable `DATABASE_URL` est bien définie dans votre fichier `.env`.

### Erreur : "Table already exists"

Si vous avez déjà créé les tables, vous pouvez :
- Supprimer les tables existantes et recommencer
- Utiliser `prisma migrate reset` pour réinitialiser la base de données

### Erreur : "Cannot find module '@prisma/client'"

Exécutez `npm run db:generate` pour générer le client Prisma.

## 📚 Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js + Prisma](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

