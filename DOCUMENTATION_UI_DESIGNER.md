# 📐 Documentation Fonctionnelle - Design UI
# Version pour Designer Externe

**Date:** Décembre 2024  
**Objectif:** Fournir les informations nécessaires pour le design UI/UX sans entrer dans les détails techniques

---

## 👥 Types d'utilisateurs

### 1. Client (Diaspora)
**Profil:** Personne résidant à l'étranger ayant besoin de services dans son pays d'origine

**Contexte d'utilisation:**
- Accède depuis l'étranger
- Besoin de services administratifs, financiers, immobiliers ou personnels
- Communication asynchrone avec les prestataires (décalage horaire)

### 2. Prestataire (Local)
**Profil:** Professionnel local exécutant les missions sur le terrain

**Contexte d'utilisation:**
- Accède depuis le pays cible
- Reçoit des missions assignées
- Doit fournir des preuves d'accomplissement (photos, documents)

### 3. Admin (LeBoy)
**Profil:** Équipe de gestion de la plateforme

**Contexte d'utilisation:**
- Gère le workflow complet
- Valide les demandes et missions
- Coordonne entre clients et prestataires

---

## 📱 Écrans attendus

### Pages publiques

#### 1. Page d'accueil (`/`)
**Objectif:** Présentation de la plateforme et appel à l'action

**Éléments à afficher:**
- Hero section avec valeur propositionnelle
- Domaines d'intervention (cliquables)
- Processus simplifié (étapes)
- Call-to-action principal (soumettre une demande)

**États:**
- État normal
- États hover sur les domaines d'intervention

#### 2. Formulaire de demande (`/demandes`)
**Objectif:** Permettre au client de soumettre une demande de service

**Éléments à afficher:**
- Formulaire avec champs:
  - Informations personnelles (nom, email, téléphone)
  - Type de service (sélection)
  - Description (texte long)
  - Lieu
  - Budget (optionnel)
  - Niveau d'urgence
  - Upload de fichiers (documents justificatifs)
- Bouton de soumission

**États:**
- Formulaire vide
- Formulaire en cours de remplissage
- Validation en cours (loading)
- Succès (message de confirmation)
- Erreur (messages d'erreur par champ)

#### 3. Connexion (`/connexion`)
**Objectif:** Authentification des utilisateurs

**Éléments à afficher:**
- Formulaire email/mot de passe
- Lien "Mot de passe oublié"
- Lien vers inscription

**États:**
- Formulaire vide
- Erreur d'authentification
- Connexion en cours (loading)
- Redirection après succès

#### 4. Inscription Client (`/inscription`)
**Objectif:** Création de compte client

**Éléments à afficher:**
- Formulaire d'inscription
- Validation email (si nécessaire)

**États:**
- Formulaire vide
- Validation en cours
- Succès avec message de vérification email

---

### Espace Client

#### 5. Dashboard Client (`/espace-client`)
**Objectif:** Vue d'ensemble des missions du client

**Éléments à afficher:**
- Liste des missions avec:
  - Référence mission
  - Statut (badge coloré)
  - Prestataire assigné
  - Dates importantes
  - Montant
- Bouton "Voir détails" pour chaque mission
- Filtres possibles (statut, date)

**États:**
- Liste vide (message "Aucune mission")
- Liste avec missions
- Chargement (skeleton ou spinner)

#### 6. Détails Mission Client (`/espace-client/mission/[id]`)
**Objectif:** Consulter les détails d'une mission et interagir

**Éléments à afficher:**
- Informations mission (titre, description, dates)
- Statut actuel (badge)
- Informations prestataire
- Montant et paiement
- Section "Preuves d'accomplissement" (si disponibles)
- Bouton "Payer" (si statut = en attente paiement)
- Bouton "Valider mission" (si statut = preuves validées)
- Chat/messages avec prestataire
- Historique des mises à jour

**États:**
- Chargement
- Mission trouvée (affichage complet)
- Mission non trouvée (404)
- Différents états selon le statut de la mission

---

### Espace Prestataire

#### 7. Dashboard Prestataire (`/prestataires/espace`)
**Objectif:** Vue d'ensemble des missions assignées

**Éléments à afficher:**
- Liste des missions avec:
  - Référence mission
  - Statut (badge coloré)
  - Client
  - Dates limites
  - Montant
- Bouton "Voir détails" pour chaque mission
- Filtres (statut, date)

**États:**
- Liste vide
- Liste avec missions
- Chargement

#### 8. Détails Mission Prestataire (`/prestataires/espace/mission/[id]`)
**Objectif:** Gérer une mission assignée

**Éléments à afficher:**
- Informations mission complètes
- Statut actuel
- Actions disponibles selon le statut:
  - "Soumettre estimation" (si nouvelle mission)
  - "Prendre en charge" (si avance reçue)
  - "Uploader preuves" (si mission en cours)
- Formulaire d'estimation (modal ou section)
- Zone d'upload de preuves (photos, documents)
- Chat/messages avec client
- Historique

**États:**
- Chargement
- Mission trouvée
- Différents états selon le statut (nouvelles actions disponibles)

---

### Espace Admin

#### 9. Dashboard Admin (`/admin`)
**Objectif:** Vue d'ensemble de la plateforme

**Éléments à afficher:**
- Statistiques (nombre de demandes, missions, etc.)
- Demandes en attente (liste courte)
- Missions nécessitant action
- Navigation vers les sections principales

**États:**
- Chargement des statistiques
- Affichage des données

#### 10. Liste des Demandes (`/admin/demandes`)
**Objectif:** Gérer toutes les demandes

**Éléments à afficher:**
- Tableau/liste des demandes avec:
  - Référence
  - Client
  - Type de service
  - Date de soumission
  - Statut (badge)
- Filtres et recherche
- Bouton "Voir détails" pour chaque demande

**États:**
- Liste vide
- Liste avec demandes
- Chargement

#### 11. Détails Demande (`/admin/demandes/[id]`)
**Objectif:** Analyser et décider sur une demande

**Éléments à afficher:**
- Toutes les informations de la demande
- Fichiers joints (téléchargeables)
- Actions disponibles:
  - "Assigner un prestataire" (bouton + modal de sélection)
  - "Demander modification" (bouton + modal avec message)
  - "Rejeter" (bouton + modal avec raison)
- Historique des actions

**États:**
- Chargement
- Demande trouvée
- Modals ouverts/fermés

#### 12. Détails Mission Admin (`/admin/missions/[id]`)
**Objectif:** Gérer une mission complète

**Éléments à afficher:**
- Toutes les informations mission
- Informations client et prestataire
- Statut actuel
- Actions disponibles selon le statut:
  - "Valider estimation"
  - "Envoyer avance" (avec choix 25%, 50%, 100%)
  - "Envoyer solde"
  - "Valider preuves"
- Section preuves d'accomplissement
- Historique complet

**États:**
- Chargement
- Mission trouvée
- Différents états selon le statut

---

## 🎨 États d'interface

### États généraux

#### État vide
**Quand:** Aucune donnée à afficher  
**Design:** Message informatif + illustration/icône  
**Exemples:**
- "Aucune mission pour le moment"
- "Aucune demande en attente"

#### État chargement
**Quand:** Données en cours de récupération  
**Design:** Skeleton loaders ou spinner  
**Exemples:**
- Liste de missions en chargement
- Formulaire en cours de soumission

#### État succès
**Quand:** Action réussie  
**Design:** Message de confirmation (toast ou banner)  
**Exemples:**
- "Demande soumise avec succès"
- "Mission validée"

#### État erreur
**Quand:** Erreur lors d'une action  
**Design:** Message d'erreur visible (rouge)  
**Exemples:**
- "Erreur lors de la connexion"
- "Champ requis manquant"

### États spécifiques par écran

#### Formulaire de demande
- **Vide:** Formulaire avec placeholders
- **En cours:** Champs remplis, validation en temps réel
- **Erreur:** Messages d'erreur sous chaque champ invalide
- **Soumission:** Bouton désactivé + spinner
- **Succès:** Message de confirmation + redirection

#### Liste de missions
- **Vide:** Message "Aucune mission"
- **Chargement:** Skeleton cards
- **Remplie:** Cards avec informations
- **Erreur:** Message d'erreur + bouton réessayer

#### Détails mission
- **Chargement:** Skeleton de la page complète
- **Trouvée:** Affichage complet avec actions disponibles
- **Non trouvée:** Message 404
- **Actions:** Boutons activés/désactivés selon le statut

---

## 🎯 Actions visibles à l'écran

### Actions Client

#### Sur le dashboard
- Cliquer sur "Voir détails" d'une mission
- Filtrer les missions par statut
- (Optionnel) Rechercher une mission

#### Sur les détails mission
- Payer une mission (si statut = en attente paiement)
- Valider une mission (si statut = preuves validées)
- Télécharger des preuves
- Envoyer un message au prestataire
- Consulter l'historique

### Actions Prestataire

#### Sur le dashboard
- Cliquer sur "Voir détails" d'une mission
- Filtrer les missions

#### Sur les détails mission
- Soumettre une estimation (modal ou section)
- Prendre en charge une mission
- Uploader des preuves (photos, documents)
- Envoyer un message au client
- Consulter l'historique

### Actions Admin

#### Sur le dashboard
- Naviguer vers les sections (demandes, missions, prestataires)
- Voir les statistiques

#### Sur les détails demande
- Assigner un prestataire (modal de sélection)
- Demander modification (modal avec message)
- Rejeter la demande (modal avec raison)
- Télécharger les fichiers joints

#### Sur les détails mission
- Valider une estimation
- Envoyer avance (choix 25%, 50%, 100%)
- Envoyer solde
- Valider des preuves
- Rejeter des preuves (avec commentaires)
- Consulter tout l'historique

---

## 🎨 Guidelines de design

### Style général
- **Ton:** Professionnel, sobre, institutionnel
- **Palette:** Couleurs sobres et professionnelles
- **Typographie:** Lisible, hiérarchie claire
- **Espacement:** Aéré, confortable

### Composants récurrents

#### Badges de statut
- Différentes couleurs selon le statut
- Texte court et clair
- Style cohérent dans toute l'application

#### Boutons d'action
- Style primaire pour actions principales
- Style secondaire pour actions secondaires
- États hover et disabled visibles

#### Modals
- Overlay sombre
- Contenu centré
- Bouton de fermeture visible
- Actions en bas (annuler, confirmer)

#### Formulaires
- Labels clairs
- Messages d'erreur sous les champs
- Validation visuelle (succès/erreur)
- Bouton de soumission bien visible

#### Listes/Cards
- Informations essentielles visibles
- Actions accessibles (boutons visibles)
- États hover pour interactivité

---

## 📋 Checklist pour le designer

### À fournir pour chaque écran
- [ ] Mockup desktop
- [ ] Mockup mobile (responsive)
- [ ] États vides
- [ ] États chargement
- [ ] États erreur
- [ ] États succès
- [ ] Interactions hover/focus
- [ ] Spécifications couleurs, typographie, espacements

### Composants à designer
- [ ] Boutons (primaire, secondaire, disabled)
- [ ] Formulaires (inputs, textarea, select)
- [ ] Badges de statut
- [ ] Cards de missions/demandes
- [ ] Modals
- [ ] Messages de feedback (succès, erreur)
- [ ] Navigation
- [ ] Tableaux (si utilisés)

---

## 🔒 Informations non incluses

Pour protéger le produit, cette documentation ne contient **pas** :
- Détails techniques d'implémentation
- Architecture système
- Logique métier interne
- Diagrammes techniques
- Codes ou configurations

---

**Note:** Cette documentation est orientée UI/UX uniquement. Elle décrit ce que l'utilisateur voit et fait, sans entrer dans les détails techniques de fonctionnement.

**Objectif:** Laisser une liberté créative au designer tout en fournissant les informations nécessaires pour créer une interface utilisateur efficace et cohérente.

