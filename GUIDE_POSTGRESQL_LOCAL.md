# Guide : Installer et configurer PostgreSQL en local

## 📋 Étape 1 : Installer PostgreSQL

### Option A : Installer avec l'installateur Windows (Recommandé)

1. **Télécharger PostgreSQL** :
   - Allez sur https://www.postgresql.org/download/windows/
   - Cliquez sur "Download the installer"
   - Téléchargez la dernière version (ex: PostgreSQL 16.x)

2. **Installer PostgreSQL** :
   - Exécutez l'installateur téléchargé
   - Choisissez les composants par défaut (PostgreSQL Server, pgAdmin 4, Command Line Tools)
   - **IMPORTANT** : Notez le mot de passe que vous définissez pour l'utilisateur `postgres` (vous en aurez besoin)
   - Port par défaut : `5432` (gardez-le)
   - Locale : `French, France` ou `English, United States` (au choix)

3. **Vérifier l'installation** :
   - Ouvrez PowerShell
   - Tapez : `psql --version`
   - Vous devriez voir la version de PostgreSQL

### Option B : Installer avec Docker (Plus simple, si vous avez Docker)

```bash
# Démarrer PostgreSQL dans Docker
docker run --name postgres-icd -e POSTGRES_PASSWORD=monmotdepasse -e POSTGRES_DB=icd_db -p 5432:5432 -d postgres:16

# Vérifier que le conteneur tourne
docker ps
```

**Avec Docker, utilisez ces valeurs :**
- Host: `localhost`
- Port: `5432`
- Database: `icd_db`
- User: `postgres`
- Password: `monmotdepasse` (celui que vous avez défini)

---

## 📋 Étape 2 : Créer une base de données

### Méthode 1 : Avec pgAdmin (Interface graphique)

1. **Ouvrir pgAdmin** :
   - Cherchez "pgAdmin 4" dans le menu Démarrer
   - Ouvrez l'application

2. **Se connecter** :
   - Cliquez sur "Servers" → "PostgreSQL 16" (ou votre version)
   - Entrez le mot de passe que vous avez défini lors de l'installation

3. **Créer la base de données** :
   - Clic droit sur "Databases" → "Create" → "Database..."
   - Nom : `icd_db` (ou le nom que vous préférez)
   - Owner : `postgres`
   - Cliquez sur "Save"

### Méthode 2 : Avec la ligne de commande (psql)

1. **Ouvrir PowerShell**

2. **Se connecter à PostgreSQL** :
   ```powershell
   psql -U postgres
   ```
   (Entrez le mot de passe quand demandé)

3. **Créer la base de données** :
   ```sql
   CREATE DATABASE icd_db;
   ```

4. **Vérifier** :
   ```sql
   \l
   ```
   (Vous devriez voir `icd_db` dans la liste)

5. **Quitter psql** :
   ```sql
   \q
   ```

---

## 📋 Étape 3 : Configurer .env.local

1. **Ouvrir `.env.local`** dans votre éditeur

2. **Ajouter/modifier ces lignes** :
   ```env
   # Base de données PostgreSQL locale
   DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/icd_db
   USE_DB=true
   ```

   **Remplacez `VOTRE_MOT_DE_PASSE`** par le mot de passe que vous avez défini lors de l'installation.

   **Exemple** :
   ```env
   DATABASE_URL=postgresql://postgres:monmotdepasse123@localhost:5432/icd_db
   USE_DB=true
   ```

3. **Format de DATABASE_URL** :
   ```
   postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
   ```
   - `USER` : `postgres` (par défaut)
   - `PASSWORD` : votre mot de passe
   - `HOST` : `localhost`
   - `PORT` : `5432` (par défaut)
   - `DATABASE` : `icd_db` (ou le nom que vous avez choisi)

---

## 📋 Étape 4 : Générer le client Prisma et créer les tables

1. **Générer le client Prisma** :
   ```bash
   npm run db:generate
   ```
   (Cela génère le client Prisma basé sur votre schéma)

2. **Créer les tables dans la base de données** :
   ```bash
   npm run db:migrate
   ```
   
   Cette commande va :
   - Créer un nouveau fichier de migration dans `prisma/migrations/`
   - Appliquer la migration à votre base de données
   - Créer toutes les tables (users, demandes, prestataires, missions, etc.)

3. **Vérifier que les tables sont créées** :
   
   **Avec pgAdmin** :
   - Ouvrez pgAdmin
   - Naviguez vers `Servers` → `PostgreSQL 16` → `Databases` → `icd_db` → `Schemas` → `public` → `Tables`
   - Vous devriez voir les tables : `users`, `demandes`, `prestataires`, etc.

   **Avec psql** :
   ```bash
   psql -U postgres -d icd_db
   ```
   ```sql
   \dt
   ```
   (Affiche toutes les tables)

---

## 🧪 Tester la connexion

1. **Tester avec le script de diagnostic** :
   ```bash
   npm run diagnose:user votre-email@exemple.com
   ```

2. **Tester avec Prisma Studio** (Interface graphique pour voir les données) :
   ```bash
   npm run db:studio
   ```
   - Ouvre un navigateur sur `http://localhost:5555`
   - Vous pouvez voir et modifier les données directement

---

## ❓ Problèmes courants

### Erreur : "password authentication failed"
- Vérifiez que le mot de passe dans `DATABASE_URL` correspond au mot de passe PostgreSQL
- Essayez de vous connecter avec pgAdmin pour vérifier

### Erreur : "database does not exist"
- Vérifiez que vous avez bien créé la base de données `icd_db`
- Vérifiez le nom dans `DATABASE_URL`

### Erreur : "connection refused"
- Vérifiez que PostgreSQL est bien démarré
- Windows : Services → PostgreSQL → Démarrer
- Docker : `docker ps` pour vérifier que le conteneur tourne

### Erreur : "port 5432 is already in use"
- Un autre service utilise déjà le port 5432
- Changez le port dans PostgreSQL ou arrêtez l'autre service

---

## 🔄 Retour au mode JSON (sans PostgreSQL)

Si vous voulez revenir au stockage JSON (fichiers) :

1. **Dans `.env.local`** :
   ```env
   USE_DB=false
   # Commentez ou supprimez DATABASE_URL
   # DATABASE_URL=...
   ```

2. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

---

## 📚 Ressources

- Documentation PostgreSQL : https://www.postgresql.org/docs/
- Documentation Prisma : https://www.prisma.io/docs
- pgAdmin : https://www.pgadmin.org/

