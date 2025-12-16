# ✅ Fonctionnalité de Refus avec Notification Client

## 🎯 Objectif

Permettre aux admins de refuser une demande avec une explication professionnelle envoyée automatiquement au client par email.

## ✨ Fonctionnalités Implémentées

### 1. Modal de Refus Professionnel

**Fichier:** `app/admin/demandes/[id]/page.tsx`

- ✅ Modal élégant qui s'ouvre au clic sur "Refuser la demande"
- ✅ Champ textarea pour saisir la raison du refus (obligatoire)
- ✅ Placeholder avec exemples de raisons :
  - "Cette demande sort du périmètre de nos services."
  - "Cette demande nécessite des compétences que nous ne proposons pas actuellement."
  - "Impossibilité d'intervenir dans ce cadre."
- ✅ Validation : le bouton d'envoi est désactivé si le champ est vide
- ✅ Indicateur de chargement pendant l'envoi
- ✅ Messages de confirmation après envoi

### 2. Envoi d'Email Automatique au Client

**Fichier:** `app/api/admin/demandes/[id]/route.ts`

- ✅ Email automatique envoyé au client lors du refus
- ✅ Sujet : "Votre demande [REF] - LeBoy"
- ✅ Contenu professionnel incluant :
  - Salutation personnalisée
  - Référence de la demande
  - Explication du refus (si fournie)
  - Message de remerciement
- ✅ Gestion d'erreur : le refus est enregistré même si l'email échoue

### 3. Traductions FR/EN

- ✅ Toutes les libellés traduits en français et anglais
- ✅ Messages d'erreur et de succès traduits

## 📋 Utilisation

1. **Côté Admin :**
   - Aller sur la page de détail d'une demande (`/admin/demandes/[id]`)
   - Cliquer sur le bouton rouge "Refuser la demande"
   - Le modal s'ouvre automatiquement
   - Saisir la raison du refus dans le champ textarea
   - Cliquer sur "Envoyer le refus au client"
   - Le client reçoit automatiquement un email avec l'explication

2. **Côté Client :**
   - Reçoit un email professionnel expliquant pourquoi la demande ne peut pas être traitée
   - La raison du refus est clairement indiquée dans l'email

## 🔧 Détails Techniques

### États du Composant
- `showRejectModal`: Contrôle l'affichage du modal
- `rejectReason`: Stocke la raison du refus saisie
- `isRejecting`: Indique si l'envoi est en cours

### API Endpoint
- **Route:** `PATCH /api/admin/demandes/[id]`
- **Body:** 
  ```json
  {
    "action": "rejeter",
    "raisonRejet": "Raison du refus..."
  }
  ```

### Email Template
- Format HTML professionnel
- Responsive
- Inclut la raison du refus dans un encadré stylisé
- Signature de l'équipe LeBoy

## ✅ Tests

- ✅ Build réussi
- ✅ Aucune erreur de linting
- ✅ Types TypeScript corrects
- ✅ Modal fonctionnel avec validation
- ✅ Email envoyé automatiquement

## 🎨 Design

Le modal suit le design system de l'application :
- Fond sombre semi-transparent
- Carte blanche arrondie
- Icône d'alerte rouge
- Boutons avec états hover/disabled
- Indicateur de chargement animé

---

**✅ La fonctionnalité est prête à être utilisée !**

