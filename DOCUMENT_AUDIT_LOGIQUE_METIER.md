# 🔄 Logique Métier & États - Documentation Complète pour Audit

**Document préparé pour audit externe - Workflow, états et règles métier**

---

## 📋 Table des Matières

1. [Vue d'Ensemble du Workflow](#vue-densemble-du-workflow)
2. [États Internes des Missions](#états-internes-des-missions)
3. [Transitions d'États](#transitions-détats)
4. [Règles Métier par Rôle](#règles-métier-par-rôle)
5. [Workflow de Paiement](#workflow-de-paiement)
6. [Workflow de Validation](#workflow-de-validation)
7. [Règles de Sécurité](#règles-de-sécurité)

---

## 🎯 Vue d'Ensemble du Workflow

### Cycle de Vie d'une Mission

```
1. Demande Client
   ↓
2. Admin Assignation Prestataires
   ↓
3. Propositions Prestataires
   ↓
4. Sélection Gagnant (Admin)
   ↓
5. Mission Créée
   ↓
6. Estimation Prestataire
   ↓
7. Génération Devis (Admin)
   ↓
8. Paiement Client
   ↓
9. Versement Avance Prestataire (Admin)
   ↓
10. Prise en Charge Prestataire
    ↓
11. Exécution Mission
    ↓
12. Soumission Preuves (Prestataire)
    ↓
13. Validation Admin
    ↓
14. Versement Solde (Admin)
    ↓
15. Clôture Mission
```

---

## 📊 États Internes des Missions

### MissionInternalState (10 états)

```typescript
type MissionInternalState =
  | "CREATED"                        // 1. Mission créée, en attente assignation
  | "ASSIGNED_TO_PROVIDER"           // 2. Assignée au prestataire, attente estimation
  | "PROVIDER_ESTIMATED"             // 3. Estimation soumise, attente validation admin
  | "WAITING_CLIENT_PAYMENT"         // 4. Devis validé, attente paiement client
  | "PAID_WAITING_TAKEOVER"          // 5. Client a payé, attente versement avance
  | "ADVANCE_SENT"                   // 6. Avance versée, attente prise en charge
  | "IN_PROGRESS"                    // 7. Mission en cours d'exécution
  | "PROVIDER_VALIDATION_SUBMITTED"  // 8. Preuves soumises, attente validation
  | "ADMIN_CONFIRMED"                // 9. Validée par admin, attente solde
  | "COMPLETED";                     // 10. Mission terminée et clôturée
```

### Mapping États → Progress

| État | Progress | Description |
|------|----------|-------------|
| `CREATED` | 10% | Mission créée |
| `ASSIGNED_TO_PROVIDER` | 20% | Assignée au prestataire |
| `PROVIDER_ESTIMATED` | 30% | Estimation reçue |
| `WAITING_CLIENT_PAYMENT` | 35% | En attente paiement |
| `PAID_WAITING_TAKEOVER` | 40% | Paiement reçu |
| `ADVANCE_SENT` | 45% | Avance versée |
| `IN_PROGRESS` | 50-80% | En cours d'exécution |
| `PROVIDER_VALIDATION_SUBMITTED` | 80% | Preuves soumises |
| `ADMIN_CONFIRMED` | 95% | Validée par admin |
| `COMPLETED` | 100% | Terminée |

---

## 🔀 Transitions d'États

### 1. CREATED → ASSIGNED_TO_PROVIDER

**Déclencheur** : Admin assigne un prestataire à une demande

**Conditions** :
- Demande existe et statut = `acceptee`
- Prestataire existe et statut = `actif`
- Mission n'existe pas encore pour cette combinaison demande/prestataire

**Actions** :
- Création Mission avec `internalState = "CREATED"`
- Envoi email au prestataire
- Notification admin
- `notifiedProviderAt = now()`
- Transition vers `ASSIGNED_TO_PROVIDER`

**Route API** : `POST /api/admin/demandes/[id]/missions`

---

### 2. ASSIGNED_TO_PROVIDER → PROVIDER_ESTIMATED

**Déclencheur** : Prestataire soumet son estimation

**Conditions** :
- `internalState === "ASSIGNED_TO_PROVIDER"`
- Prestataire authentifié = propriétaire de la mission
- Prix, délai et commentaire fournis

**Actions** :
- Mise à jour Mission avec estimation
- `internalState = "PROVIDER_ESTIMATED"`
- Notification admin
- Email admin

**Route API** : `POST /api/prestataires/espace/missions/[id]/estimation`

---

### 3. PROVIDER_ESTIMATED → WAITING_CLIENT_PAYMENT

**Déclencheur** : Admin génère le devis et valide

**Conditions** :
- `internalState === "PROVIDER_ESTIMATED"`
- Admin authentifié
- Estimation validée

**Actions** :
- Calcul commissions (base + risque)
- Génération PDF devis
- `devisGenere = true`
- `devisGenereAt = now()`
- `internalState = "WAITING_CLIENT_PAYMENT"`
- Email client avec devis

**Route API** : `POST /api/admin/missions/[id]/generate-devis`

---

### 4. WAITING_CLIENT_PAYMENT → PAID_WAITING_TAKEOVER

**Déclencheur** : Client effectue le paiement

**Conditions** :
- `internalState === "WAITING_CLIENT_PAYMENT"`
- Client authentifié = propriétaire de la mission
- **⚠️ TODO : Vérification réelle PaymentIntent Stripe**

**Actions** :
- `paiementEffectue = true`
- `paiementEffectueAt = now()`
- `internalState = "PAID_WAITING_TAKEOVER"`
- Notification admin
- Email admin

**Route API** : `POST /api/espace-client/missions/[id]/payment`

**⚠️ RISQUE IDENTIFIÉ** : Pas de validation réelle Stripe actuellement

---

### 5. PAID_WAITING_TAKEOVER → ADVANCE_SENT

**Déclencheur** : Admin verse l'avance au prestataire

**Conditions** :
- `internalState === "PAID_WAITING_TAKEOVER"`
- `paiementEffectue === true`
- Admin authentifié
- Pourcentage : 25%, 50% ou 100%

**Actions** :
- Calcul montant avance = `tarifPrestataire * percentage / 100`
- `avanceVersee = true`
- `avanceVerseeAt = now()`
- `avancePercentage = percentage`
- Si 100% : `soldeVersee = true`, `soldeVerseeAt = now()`
- `internalState = "ADVANCE_SENT"`
- **⚠️ TODO : Intégration Stripe Connect pour payout réel**
- Email prestataire

**Route API** : `POST /api/admin/missions/[id]/pay-advance`

**⚠️ RISQUE IDENTIFIÉ** : Payout Stripe non implémenté

---

### 6. ADVANCE_SENT → IN_PROGRESS

**Déclencheur** : Prestataire clique sur "Prise en charge"

**Conditions** :
- `internalState === "ADVANCE_SENT"`
- Prestataire authentifié = propriétaire de la mission

**Actions** :
- `internalState = "IN_PROGRESS"`
- `datePriseEnCharge = now()`
- `dateDebut = now()`
- Notification admin
- Email admin

**Route API** : `POST /api/prestataires/espace/missions/[id]/start`

---

### 7. IN_PROGRESS → PROVIDER_VALIDATION_SUBMITTED

**Déclencheur** : Prestataire soumet les preuves de validation

**Conditions** :
- `internalState === "IN_PROGRESS"`
- Prestataire authentifié = propriétaire
- Au moins une preuve uploadée (`proofs.length > 0`)

**Actions** :
- `internalState = "PROVIDER_VALIDATION_SUBMITTED"`
- `proofSubmissionDate = now()`
- Si `avancePercentage === 100` : Validation automatique
  - `proofValidatedByAdmin = true`
  - `proofValidatedAt = now()`
  - `proofValidatedForClient = true`
  - `internalState = "ADMIN_CONFIRMED"`
  - Email client avec preuves
- Sinon : Notification admin pour validation manuelle

**Route API** : `POST /api/prestataires/espace/missions/[id]/submit-validation`

---

### 8. PROVIDER_VALIDATION_SUBMITTED → ADMIN_CONFIRMED

**Déclencheur** : Admin valide les preuves

**Conditions** :
- `internalState === "PROVIDER_VALIDATION_SUBMITTED"`
- Admin authentifié
- `validate === true` OU paiement 100% déjà validé

**Actions** :
- `proofValidatedByAdmin = true`
- `proofValidatedAt = now()`
- Si `validateForClient === true` :
  - `proofValidatedForClient = true`
  - `proofValidatedForClientAt = now()`
  - `internalState = "ADMIN_CONFIRMED"`
  - Email client avec preuves

**Route API** : `POST /api/admin/missions/[id]/validate-proofs`

---

### 9. ADMIN_CONFIRMED → COMPLETED

**Déclencheur** : Client ou Admin clôture la mission

**Conditions** :
- `internalState === "ADMIN_CONFIRMED"`
- Client ou Admin authentifié
- Solde versé (si applicable)

**Actions** :
- `internalState = "COMPLETED"`
- `closedBy = "client" | "admin" | "auto"`
- `closedAt = now()`
- Email de confirmation

**Route API** :
- `POST /api/espace-client/missions/[id]/close` (client)
- `POST /api/admin/missions/[id]/close` (admin)

---

## 👥 Règles Métier par Rôle

### Client

**Permissions** :
- ✅ Créer des demandes
- ✅ Payer les missions
- ✅ Voir ses missions
- ✅ Voir les preuves (après validation admin)
- ✅ Clôturer mission (après validation)
- ✅ Évaluer prestataire (après clôture)
- ✅ Chat avec admin
- ❌ Voir conversations admin/prestataire

**Règles** :
- Un client ne peut payer que ses propres missions
- Un client ne peut voir les preuves qu'après validation admin
- Un client ne peut clôturer qu'après réception des preuves

---

### Prestataire

**Permissions** :
- ✅ Voir missions assignées
- ✅ Soumettre estimation
- ✅ Prendre en charge mission
- ✅ Uploader preuves
- ✅ Soumettre validation
- ✅ Chat avec admin
- ✅ Voir missions non retenues (après sélection gagnant)
- ❌ Voir conversations admin/client

**Règles** :
- Un prestataire ne peut soumettre qu'une estimation par mission
- Un prestataire ne peut prendre en charge qu'après réception avance
- Un prestataire ne peut soumettre validation qu'avec au moins une preuve
- Si paiement 100%, validation automatique des preuves

---

### Admin

**Permissions** :
- ✅ Voir toutes les demandes
- ✅ Assigner prestataires
- ✅ Sélectionner gagnant
- ✅ Générer devis
- ✅ Verser avances et soldes
- ✅ Valider preuves
- ✅ Clôturer missions
- ✅ Chat avec client et prestataire
- ✅ Voir toutes les conversations
- ✅ Gérer prestataires (valider, rejeter, suspendre)

**Règles** :
- Admin peut assigner plusieurs prestataires à une demande
- Admin sélectionne un seul gagnant parmi les propositions
- Admin peut verser avance : 25%, 50% ou 100%
- Si avance 100%, solde automatiquement marqué comme versé
- Admin valide les preuves avant envoi au client

---

## 💳 Workflow de Paiement

### Paiement Client → LeBoy

**Montant** : `tarifTotal = tarifPrestataire + commissionICD + fraisSupplementaires`

**Processus** :
1. Client reçoit devis PDF
2. Client clique "Payer maintenant"
3. **⚠️ TODO : Intégration Stripe Elements**
4. Création PaymentIntent côté serveur
5. **⚠️ TODO : Vérification PaymentIntent Stripe**
6. Mise à jour `paiementEffectue = true`
7. Transition vers `PAID_WAITING_TAKEOVER`

**Risques identifiés** :
- Pas de validation réelle Stripe
- Pas de webhook pour synchronisation
- Pas de gestion remboursements

---

### Versement Avance Prestataire

**Montants** : 25%, 50% ou 100% de `tarifPrestataire`

**Processus** :
1. Admin sélectionne pourcentage
2. Calcul montant = `tarifPrestataire * percentage / 100`
3. **⚠️ TODO : Création Transfer Stripe Connect**
4. Mise à jour `avanceVersee = true`
5. Si 100% : `soldeVersee = true` également
6. Transition vers `ADVANCE_SENT`

**Risques identifiés** :
- Payout Stripe non implémenté
- Processus manuel nécessaire

---

### Versement Solde Prestataire

**Montant** : `(100 - avancePercentage) / 100 * tarifPrestataire`

**Processus** :
1. Mission validée (`ADMIN_CONFIRMED`)
2. Admin clique "Verser solde"
3. Calcul solde = `tarifPrestataire * (100 - avance%) / 100`
4. **⚠️ TODO : Création Transfer Stripe Connect**
5. Mise à jour `soldeVersee = true`

**Route API** : `POST /api/admin/missions/[id]/pay-balance`

---

## ✅ Workflow de Validation

### Soumission Preuves (Prestataire)

**Conditions** :
- Mission en `IN_PROGRESS`
- Au moins un fichier uploadé
- Prestataire propriétaire

**Processus** :
1. Upload fichiers via `/api/missions/[id]/proofs`
2. Fichiers stockés (Blob ou Local)
3. Prestataire clique "Soumettre pour validation"
4. Si paiement 100% : Validation automatique
5. Sinon : Notification admin

---

### Validation Admin

**Conditions** :
- Preuves soumises (`PROVIDER_VALIDATION_SUBMITTED`)
- Admin authentifié

**Processus** :
1. Admin examine les preuves
2. Admin valide ou demande corrections
3. Si validé :
   - `proofValidatedByAdmin = true`
   - `proofValidatedForClient = true` (si `validateForClient`)
   - Transition vers `ADMIN_CONFIRMED`
   - Email client avec preuves

---

## 🔐 Règles de Sécurité

### Authentification

- Sessions sécurisées avec Iron Session
- Hash mots de passe avec bcrypt
- Cookies httpOnly, secure en production

### Autorisation

- Vérification rôle sur chaque route API
- Vérification propriétaire (client/prestataire)
- Middleware Next.js pour protection routes

### Validation

- UUID validation pour tous les IDs
- Validation format email
- Validation montants (entiers positifs)
- **⚠️ Manquant : Validation montants vs Stripe**

### Confidentialité

- Client ne voit que ses conversations avec admin
- Prestataire ne voit que ses conversations avec admin
- Admin voit toutes les conversations
- Preuves visibles par client seulement après validation admin

---

## 📝 Règles Spécifiques

### Génération Références

- Format : `M-YYYY-NNN` (Mission), `D-YYYY-NNN` (Demande), `P-YYYY-NNN` (Prestataire)
- Génération atomique via `MissionRefCounter`
- Un compteur par année
- Retry automatique en cas de conflit (P2002)

### Archivage vs Suppression

- **Archivage** : Mission masquée mais conservée (`archived = true`)
- **Suppression** : Soft delete avec `deletedAt`
- Les deux peuvent coexister

### Gestion Prestataires Non Retenus

- Après sélection gagnant, autres prestataires marqués comme "non retenus"
- Section "Missions non retenues" dans espace prestataire
- Email notification au prestataire non retenu

---

## ⚠️ Points d'Attention pour l'Audit

### Risques Identifiés

1. **Paiements Stripe** :
   - Pas de validation réelle PaymentIntent
   - Pas de webhooks
   - Pas de gestion remboursements

2. **Payouts Prestataires** :
   - Stripe Connect non implémenté
   - Processus manuel nécessaire

3. **Synchronisation États** :
   - Pas de réconciliation avec Stripe
   - États applicatifs peuvent diverger

4. **Gestion Erreurs** :
   - Pas de retry logic pour Stripe
   - Pas de gestion timeouts

---

**Document préparé pour audit externe - Janvier 2025**

