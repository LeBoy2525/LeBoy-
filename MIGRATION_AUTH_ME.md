# Migration `/api/auth/me` vers Prisma

## ✅ Fichiers créés/modifiés

### Nouveaux fichiers
1. **`lib/dataAccess.ts`** - Helper pour basculer entre JSON et DB
   - `getUserByEmail(email)` - Récupère un utilisateur (JSON ou DB)
   - `getPrestataireByEmail(email)` - Récupère un prestataire (JSON ou DB)
   - Bascule automatique selon `USE_DB`

### Fichiers modifiés
1. **`lib/auth.ts`**
   - Ajout de `getUserRoleAsync(email)` - Version asynchrone qui utilise `dataAccess`
   - `getUserRole(email)` reste synchrone pour compatibilité
   - Ajout de `isPrestataireAsync(email)`

2. **`app/api/auth/me/route.ts`**
   - Utilise maintenant `getUserRoleAsync` au lieu de `getUserRole`
   - Utilise `getPrestataireByEmail` de `dataAccess`
   - Fallback automatique sur JSON en cas d'erreur DB

3. **`repositories/prestatairesRepo.ts`**
   - `getPrestataireByEmail` utilise maintenant `findFirst` avec filtre `deletedAt: null`

## 🔄 Logique de bascule

### Avec `USE_DB=false` (JSON - développement)
- Utilise directement les stores JSON (`prestatairesStore`, `usersStore`)
- Comportement identique à avant

### Avec `USE_DB=true` (Prisma - production)
- Utilise les repositories Prisma
- Conversion automatique UUID → number pour compatibilité frontend
- Fallback sur JSON en cas d'erreur DB

## 🧪 Tests à effectuer

### Test 1 : Avec `USE_DB=false` (JSON)

1. **Configurer `.env.local`** :
```env
USE_DB=false
```

2. **Démarrer le serveur** :
```bash
npm run dev
```

3. **Tester les cas suivants** :

#### Cas A : Pas de cookies
```bash
curl http://localhost:3000/api/auth/me
```
**Attendu** : `{"authenticated": false, "user": null}`

#### Cas B : Cookie auth sans email
```bash
curl http://localhost:3000/api/auth/me \
  -H "Cookie: icd_auth=1"
```
**Attendu** : `{"authenticated": false, "user": null}`

#### Cas C : Email admin
```bash
curl http://localhost:3000/api/auth/me \
  -H "Cookie: icd_auth=1; icd_user_email=contact.icd-relay@gmail.com"
```
**Attendu** : `{"authenticated": true, "user": {"email": "...", "role": "admin", "prestataireId": null}}`

#### Cas D : Email prestataire existant
```bash
curl http://localhost:3000/api/auth/me \
  -H "Cookie: icd_auth=1; icd_user_email=prestataire@example.com"
```
**Attendu** : `{"authenticated": true, "user": {"email": "...", "role": "prestataire", "prestataireId": <number>}}`

#### Cas E : Email client (inconnu)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Cookie: icd_auth=1; icd_user_email=client@example.com"
```
**Attendu** : `{"authenticated": true, "user": {"email": "...", "role": "client", "prestataireId": null}}`

### Test 2 : Avec `USE_DB=true` (Prisma)

1. **Configurer `.env.local`** :
```env
USE_DB=true
DATABASE_URL="postgresql://leboy:leboy_dev_password@localhost:5432/leboy_dev"
```

2. **Vérifier que la DB est démarrée** :
```bash
npm run docker:up
```

3. **Vérifier que les données existent** :
```bash
npm run db:studio
# Vérifier qu'il y a des prestataires et users dans la DB
```

4. **Démarrer le serveur** :
```bash
npm run dev
```

5. **Tester les mêmes cas que Test 1**

**Important** : Les réponses doivent être **identiques** à celles avec `USE_DB=false`

## ⚠️ Notes importantes

1. **Conversion UUID → number** : Les IDs Prisma sont des UUIDs (string), mais le frontend attend des numbers. Une conversion temporaire est effectuée via un hash simple. Cette conversion peut créer des collisions si plusieurs UUIDs génèrent le même hash.

2. **Fallback automatique** : En cas d'erreur avec DB, le système bascule automatiquement sur JSON pour ne pas casser le frontend.

3. **Compatibilité** : La réponse JSON reste **exactement la même** qu'avant pour ne pas casser le frontend.

## 📝 Prochaines étapes

1. ✅ Migration `/api/auth/me` terminée
2. ⏭️ Migration `/api/auth/login`
3. ⏭️ Migration `/api/auth/register`
4. ⏭️ Migration `/api/demandes` (GET/POST)

