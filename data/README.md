# Dossier de données persistantes

Ce dossier contient les fichiers JSON qui stockent les données de l'application ICD.

## Fichiers de données

- `demandes.json` - Toutes les demandes des clients
- `prestataires.json` - Tous les prestataires inscrits
- `users.json` - Tous les comptes clients
- `missions.json` - Toutes les missions créées
- `files.json` - Tous les fichiers uploadés (documents)

## Sauvegarde automatique

Les données sont automatiquement sauvegardées dans ces fichiers à chaque modification :
- Ajout d'une demande
- Modification d'une demande
- Suppression/restauration d'une demande
- Ajout d'un prestataire
- Modification d'un prestataire
- Création d'un compte utilisateur
- Création d'une mission
- Mise à jour d'une mission
- Upload d'un fichier

## Backups

Avant chaque sauvegarde, un fichier `.backup` est créé automatiquement pour permettre la récupération en cas d'erreur.

## Important

⚠️ **Ne supprimez pas ces fichiers manuellement** - ils contiennent toutes les données de l'application.

⚠️ **Faites des backups réguliers** de ce dossier pour éviter la perte de données.

## Migration vers une base de données

Pour la production, il est recommandé de migrer vers une vraie base de données (PostgreSQL, MySQL, MongoDB, etc.) pour de meilleures performances et une meilleure sécurité.

