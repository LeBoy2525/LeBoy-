# Guide de Tests - Migration Prisma

Ce document explique comment tester les routes migrées vers Prisma.

## 📋 Prérequis

1. **Serveur démarré** : Le serveur Next.js doit être en cours d'exécution
   ```bash
   npm run dev
   ```

2. **Base de données** (optionnel pour USE_DB=true) :
   - Docker doit être démarré : `npm run docker:up`
   - Les migrations Prisma doivent être appliquées : `npm run db:migrate`

3. **Données de test** :
   - Pour tester avec authentification, assurez-vous que les utilisateurs existent
   - Admin : `contact@leboy.com` / `admin123`
   - Prestataire de test : `test-prestataire@leboy.com` / `test123456`

## 🧪 Scripts de Test Disponibles

### 1. Test Complet des Routes Migrées

Teste toutes les routes migrées avec USE_DB=false et USE_DB=true :

```bash
npm run test:migration
```

ou directement :

```bash
node test-migration-routes.js
```

**Ce que ce test vérifie :**
- ✅ Routes d'authentification
- ✅ Routes demandes (GET)
- ✅ Routes prestataires (GET)
- ✅ Routes propositions (GET)
- ✅ Routes missions (GET)
- ✅ Protection d'authentification (401 si non auth)

### 2. Test avec Mode JSON

Teste uniquement avec USE_DB=false (mode JSON) :

```bash
npm run test:migration:json
```

### 3. Test avec Mode Prisma

Teste uniquement avec USE_DB=true (mode Prisma) :

```bash
npm run test:migration:db
```

### 4. Test du Mécanisme de Fallback

Vérifie que le système bascule automatiquement sur JSON si la DB échoue :

```bash
npm run test:fallback
```

ou directement :

```bash
node test-fallback-mechanism.js
```

**Ce que ce test vérifie :**
- ✅ Le système fonctionne même si la DB n'est pas disponible
- ✅ Le fallback JSON est automatique et transparent
- ✅ Les routes répondent correctement dans tous les cas

### 5. Test avec Authentification Complète

Teste les routes protégées avec authentification :

```bash
node test-with-auth.js
```

**Ce que ce test vérifie :**
- ✅ Connexion admin
- ✅ Récupération du rôle utilisateur
- ✅ Routes admin protégées
- ✅ Routes prestataires protégées

## 📊 Interprétation des Résultats

### ✅ Succès (PASS)

- **Status 200** : La route fonctionne correctement
- **Status 401** : Protection d'authentification active (attendu pour routes protégées)
- **Status 404** : Ressource non trouvée (normal si l'ID n'existe pas)

### ❌ Échec (FAIL)

- **Status 500** : Erreur serveur (vérifier les logs)
- **Erreur de connexion** : Serveur non démarré ou URL incorrecte
- **Timeout** : Serveur trop lent ou non accessible

### ⚠️ Partiel (PARTIAL)

- **404 sur GET/[id]** : Normal si l'ID n'existe pas dans les données
- **401 sur routes protégées** : Normal si non authentifié

## 🔍 Dépannage

### Le serveur n'est pas accessible

```bash
# Vérifier que le serveur est démarré
npm run dev

# Vérifier le port (par défaut 3000)
# Modifier TEST_URL si nécessaire dans les scripts
```

### Erreur d'authentification

```bash
# Vérifier que les utilisateurs existent dans users.json ou la DB
# Vérifier les credentials dans les scripts de test
```

### Erreur de base de données

```bash
# Vérifier que Docker est démarré
npm run docker:up

# Vérifier les migrations
npm run db:migrate

# Vérifier la connexion DB dans .env.local
```

### Les routes retournent 404

- Vérifier que les données de test existent
- Vérifier que les IDs utilisés dans les tests existent réellement
- Vérifier les logs du serveur pour plus de détails

## 📝 Notes Importantes

1. **Les tests sont non-destructifs** : Ils ne modifient pas les données
2. **Les tests nécessitent le serveur** : `npm run dev` doit être en cours
3. **Les cookies de session** : Gérés automatiquement par les scripts
4. **Le fallback est automatique** : Pas besoin de configuration supplémentaire

## 🎯 Objectifs des Tests

1. ✅ Vérifier que les routes migrées fonctionnent avec JSON (USE_DB=false)
2. ✅ Vérifier que les routes migrées fonctionnent avec Prisma (USE_DB=true)
3. ✅ Vérifier que le fallback automatique fonctionne
4. ✅ Vérifier que la protection d'authentification est active
5. ✅ Vérifier que les deux modes fonctionnent de manière identique

## 📈 Résultats Attendus

Tous les tests doivent montrer :
- ✅ Routes principales : PASS
- ✅ Protection auth : PASS (401 attendu)
- ✅ Fallback : PASS (fonctionne même si DB échoue)
- ✅ Compatibilité : PASS (JSON et Prisma identiques)

## 🚀 Prochaines Étapes

Une fois tous les tests passés :
1. Migrer les routes restantes (missions individuelles, fichiers, notifications)
2. Tester chaque nouvelle migration
3. Supprimer le fallback JSON une fois tout migré et testé
4. Passer en production avec USE_DB=true uniquement

