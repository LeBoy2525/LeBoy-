# 🔧 Installation Git pour Windows

## Option 1 : Installer Git pour Windows (Recommandé)

### Téléchargement
1. Aller sur https://git-scm.com/download/win
2. Télécharger l'installateur
3. Exécuter l'installateur avec les options par défaut
4. **Important** : Cocher "Add Git to PATH" pendant l'installation

### Vérification
Après installation, redémarrer PowerShell et tester :
```powershell
git --version
```

---

## Option 2 : Utiliser GitHub Desktop (Interface graphique)

1. Télécharger depuis https://desktop.github.com/
2. Installer et se connecter avec votre compte GitHub
3. Cloner/ouvrir le repository depuis GitHub Desktop
4. Faire les commits via l'interface graphique

---

## Option 3 : Utiliser Git via Visual Studio Code

Si vous avez VS Code installé :
1. Ouvrir VS Code dans le dossier du projet
2. Utiliser l'interface Git intégrée (icône source control à gauche)
3. Faire les commits via VS Code

---

## Après installation Git

Une fois Git installé, vous pourrez exécuter :

```bash
# Vérifier le statut
git status

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "feat: Migration vers Vercel Blob + Migration Prisma storage fields

- Ajout providers storage (local + Vercel Blob)
- Adaptation routes API pour stockage Blob
- Migration Prisma pour storageKey/storageUrl
- Unification identifiants admin
- Suppression section types comptes connexion"

# Push
git push origin main
```

---

## Note

Si vous préférez, vous pouvez aussi faire le commit/push directement depuis GitHub :
1. Aller sur votre repository GitHub
2. Utiliser l'éditeur web pour créer/modifier les fichiers
3. Faire le commit directement depuis l'interface web


