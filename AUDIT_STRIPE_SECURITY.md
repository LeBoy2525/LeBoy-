# 🔒 Audit Stripe & Sécurité - Documentation Technique

**Document préparé pour audit externe - Paiements Stripe & Sécurité**

---

## 📋 Table des Matières

1. [Architecture Paiements](#architecture-paiements)
2. [Intégration Stripe](#intégration-stripe)
3. [Webhooks & États](#webhooks--états)
4. [Sécurité](#sécurité)
5. [Fichiers Clés](#fichiers-clés)
6. [Workflow Paiements](#workflow-paiements)
7. [Risques Identifiés](#risques-identifiés)

---

## 🏗️ Architecture Paiements

### Vue d'Ensemble

Le système de paiement gère trois types de transactions :
1. **Paiement Client → LeBoy** : Le client paie la mission complète (tarif prestataire + commission)
2. **Avance Prestataire** : LeBoy verse une avance au prestataire (25%, 50% ou 100%)
3. **Solde Prestataire** : LeBoy verse le solde restant après validation

### États de Mission (Internal State)

```
CREATED → ASSIGNED_TO_PROVIDER → PROVIDER_ESTIMATED → WAITING_CLIENT_PAYMENT 
→ PAID_WAITING_TAKEOVER → ADVANCE_SENT → IN_PROGRESS → PROVIDER_VALIDATION_SUBMITTED 
→ ADMIN_CONFIRMED → COMPLETED
```

---

## 💳 Intégration Stripe

### Configuration

**Fichier :** `lib/stripe.ts`

```typescript
// Protection contre clés LIVE en staging
- Validation automatique des clés au démarrage
- Blocage si clés LIVE détectées en staging/dev
- Support mode TEST et LIVE
```

**Variables d'environnement :**
- `STRIPE_SECRET_KEY` - Clé secrète Stripe
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Clé publique
- `STRIPE_WEBHOOK_SECRET` - Secret pour validation webhooks
- `DISABLE_LIVE_STRIPE` - Protection supplémentaire (staging)

### Routes API Paiements

#### 1. Paiement Client
**Route :** `POST /api/espace-client/missions/[id]/payment`

**Fichier :** `app/api/espace-client/missions/[id]/payment/route.ts`

**Fonctionnalité :**
- Client paie la mission complète
- Validation UUID mission
- Vérification autorisation (client propriétaire)
- Vérification état (`WAITING_CLIENT_PAYMENT`)
- **⚠️ TODO : Vérification réelle du PaymentIntent Stripe**

**État actuel :**
```typescript
// TODO: Vérifier le paiement Stripe avec paymentIntentId
// Pour l'instant, on simule le paiement réussi
```

**Mise à jour :**
- `paiementEffectue: true`
- `paiementEffectueAt: Date`
- `internalState: "PAID_WAITING_TAKEOVER"`

#### 2. Versement Avance Prestataire
**Route :** `POST /api/admin/missions/[id]/pay-advance`

**Fichier :** `app/api/admin/missions/[id]/pay-advance/route.ts`

**Fonctionnalité :**
- Admin verse avance au prestataire (25%, 50% ou 100%)
- Vérification état (`PAID_WAITING_TAKEOVER`)
- Calcul montant selon pourcentage
- **⚠️ TODO : Intégration Stripe Connect pour payout**

**Mise à jour :**
- `avanceVersee: true`
- `avanceVerseeAt: Date`
- `avancePercentage: 25 | 50 | 100`
- `internalState: "ADVANCE_SENT"`

#### 3. Versement Solde Prestataire
**Route :** `POST /api/admin/missions/[id]/pay-balance`

**Fichier :** `app/api/admin/missions/[id]/pay-balance/route.ts`

**Fonctionnalité :**
- Admin verse solde restant après validation
- Vérification état (`ADMIN_CONFIRMED`)
- Calcul solde = 100% - avance%
- **⚠️ TODO : Intégration Stripe Connect pour payout**

**Mise à jour :**
- `soldeVersee: true`
- `soldeVerseeAt: Date`

---

## 🔔 Webhooks & États

### Webhooks Stripe

**⚠️ ÉTAT ACTUEL :** Aucun webhook Stripe implémenté

**Risque identifié :**
- Pas de validation côté serveur des paiements
- Pas de gestion des événements Stripe (payment_intent.succeeded, payment_intent.payment_failed)
- Pas de gestion des remboursements
- Pas de gestion des disputes

### États de Paiement

**Dans la base de données (Prisma) :**
```prisma
model Mission {
  paiementEffectue      Boolean?
  paiementEffectueAt    DateTime?
  avanceVersee          Boolean?
  avanceVerseeAt        DateTime?
  avancePercentage      Int?      // 25, 50 ou 100
  soldeVersee           Boolean?
  soldeVerseeAt         DateTime?
  internalState         String    // État interne du workflow
}
```

**Problème potentiel :**
- Pas de synchronisation avec Stripe
- États applicatifs peuvent diverger des états Stripe
- Pas de mécanisme de réconciliation

---

## 🔐 Sécurité

### Authentification & Autorisation

**Système :** Iron Session + Bcrypt

**Fichiers clés :**
- `lib/auth.ts` - Logique authentification
- `lib/session.ts` - Gestion sessions
- `app/middleware.ts` - Protection routes

**Vérifications dans routes paiements :**
- ✅ Authentification requise (cookie session)
- ✅ Vérification rôle utilisateur
- ✅ Vérification propriétaire (client pour paiement, admin pour versements)
- ✅ Validation UUID

### Protection Clés Stripe

**Fichier :** `lib/stripe.ts`

**Protections implémentées :**
- ✅ Validation clés au démarrage
- ✅ Blocage clés LIVE en staging
- ✅ Variable `DISABLE_LIVE_STRIPE` pour protection supplémentaire

**Protections manquantes :**
- ⚠️ Pas de rotation automatique des clés
- ⚠️ Pas de monitoring des accès API Stripe
- ⚠️ Pas de rate limiting sur routes paiements

### Validation des Données

**UUID Validation :**
- ✅ Validation format UUID sur toutes les routes
- ✅ Utilisation de `lib/uuidValidation.ts` pour standardisation

**Validation Montants :**
- ⚠️ Pas de validation stricte des montants (comparaison avec Stripe)
- ⚠️ Pas de protection contre manipulation des montants côté client

---

## 📁 Fichiers Clés

### Configuration Stripe
- `lib/stripe.ts` - Configuration et validation Stripe

### Routes API Paiements
- `app/api/espace-client/missions/[id]/payment/route.ts` - Paiement client
- `app/api/admin/missions/[id]/pay-advance/route.ts` - Versement avance
- `app/api/admin/missions/[id]/pay-balance/route.ts` - Versement solde

### Composants Frontend
- `app/components/ClientPaymentSection.tsx` - Interface paiement client
- `app/components/AdminAdvancePaymentSection.tsx` - Interface versement avance

### Types & Modèles
- `lib/types.ts` - Types TypeScript missions et paiements
- `prisma/schema.prisma` - Modèle Mission avec champs paiements

---

## 🔄 Workflow Paiements

### 1. Paiement Client

```
1. Client reçoit devis (mission.tarifTotal)
2. Client clique "Payer maintenant"
3. Frontend : ClientPaymentSection.tsx
   - TODO: Intégration Stripe Elements
   - Création PaymentIntent côté serveur
4. Backend : /api/espace-client/missions/[id]/payment
   - TODO: Vérification PaymentIntent Stripe
   - Mise à jour mission.paiementEffectue = true
   - Changement état → PAID_WAITING_TAKEOVER
5. Notification admin
```

### 2. Versement Avance Prestataire

```
1. Admin sélectionne pourcentage (25%, 50%, 100%)
2. Backend : /api/admin/missions/[id]/pay-advance
   - Calcul montant = tarifPrestataire * percentage / 100
   - TODO: Création Transfer Stripe Connect
   - Mise à jour mission.avanceVersee = true
   - Changement état → ADVANCE_SENT
3. Notification prestataire
```

### 3. Versement Solde

```
1. Mission validée (ADMIN_CONFIRMED)
2. Admin clique "Verser solde"
3. Backend : /api/admin/missions/[id]/pay-balance
   - Calcul solde = tarifPrestataire * (100 - avance%) / 100
   - TODO: Création Transfer Stripe Connect
   - Mise à jour mission.soldeVersee = true
4. Notification prestataire
```

---

## ⚠️ Risques Identifiés

### Critiques

1. **Pas de validation réelle Stripe**
   - Le paiement client accepte n'importe quel `paymentIntentId`
   - Pas de vérification avec l'API Stripe
   - **Risque :** Paiements non réels acceptés

2. **Pas de webhooks Stripe**
   - Pas de synchronisation avec Stripe
   - États applicatifs peuvent diverger
   - **Risque :** Incohérences données

3. **Pas de gestion erreurs Stripe**
   - Pas de retry logic
   - Pas de gestion timeouts
   - **Risque :** Paiements perdus

### Importants

4. **Pas de Stripe Connect pour payouts**
   - Versements prestataires non implémentés
   - **Risque :** Processus manuel nécessaire

5. **Pas de protection CSRF**
   - Routes API sensibles non protégées
   - **Risque :** Requêtes malveillantes

6. **Pas de logging paiements**
   - Pas de traçabilité complète
   - **Risque :** Difficulté audit

### Moyens

7. **Pas de rate limiting**
   - Routes paiements sans limitation
   - **Risque :** Abus/attaque

8. **Montants côté client**
   - Validation montants côté serveur faible
   - **Risque :** Manipulation possible

---

## 📝 Recommandations pour Audit

### Points à Vérifier

1. **Validation Paiements**
   - Vérifier que les PaymentIntents sont validés avec Stripe API
   - Vérifier que les montants correspondent
   - Vérifier que les statuts sont synchronisés

2. **Webhooks**
   - Implémenter webhook endpoint `/api/stripe/webhook`
   - Gérer événements : `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Idempotence des webhooks

3. **Sécurité**
   - CSRF protection sur routes paiements
   - Rate limiting
   - Logging complet des transactions

4. **Stripe Connect**
   - Implémenter payouts vers prestataires
   - Gérer les comptes connectés
   - Gérer les frais de plateforme

5. **Gestion Erreurs**
   - Retry logic pour appels Stripe
   - Gestion timeouts
   - Fallback mechanisms

---

## 🔗 Liens Utiles

- [Documentation Stripe](https://stripe.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Connect](https://stripe.com/docs/connect)
- [Stripe Security](https://stripe.com/docs/security)

---

**Document préparé pour audit externe - Janvier 2025**

