# 📋 Guide d'Accès pour Auditeur Externe

**Document préparé pour :** Audit Stripe & Sécurité  
**Date :** Janvier 2025

---

## 🎯 Objectif de l'Audit

Audit ponctuel sur :
- **Paiements Stripe** : Validation des choix, identification des risques production
- **Webhooks** : Gestion des événements Stripe
- **États** : Cohérence des états applicatifs avec Stripe
- **Sécurité** : Bonnes pratiques et risques identifiés

**Durée estimée :** ~2 heures (appel intro + audit + retour)

---

## 🔐 Accès au Repository

### Option 1 : Collaborateur GitHub (Recommandé)

1. Fournissez votre **email GitHub** ou **nom d'utilisateur GitHub**
2. Accès en **lecture seule** sera accordé au repository : `https://github.com/LeBoy2525/LeBoy-`
3. Vous pourrez cloner le repository et explorer le code

### Option 2 : Token d'Accès (Alternative)

Si vous préférez un accès via token :
1. Un token d'accès GitHub en lecture seule sera généré
2. Le token vous sera communiqué de manière sécurisée

---

## 📚 Documentation Disponible

### Documents Essentiels pour l'Audit

1. **[README.md](./README.md)** - Vue d'ensemble et quick start
2. **[AUDIT_STRIPE_SECURITY.md](./AUDIT_STRIPE_SECURITY.md)** - ⭐ **Document principal pour l'audit**
   - Architecture paiements
   - Intégration Stripe actuelle
   - Webhooks & états
   - Sécurité
   - Risques identifiés
   - Fichiers clés à examiner

3. **[PRESENTATION_TECHNIQUE_POUR_DEVELOPPEUR.md](./PRESENTATION_TECHNIQUE_POUR_DEVELOPPEUR.md)** - Présentation technique complète
4. **[DOCUMENTATION_SAUVEGARDE_COMPLETE.md](./DOCUMENTATION_SAUVEGARDE_COMPLETE.md)** - Architecture et configuration complète
5. **[WORKFLOW_CHECKLIST.md](./WORKFLOW_CHECKLIST.md)** - Workflow métier détaillé

### Fichiers de Code à Examiner

#### Paiements Stripe
- `lib/stripe.ts` - Configuration Stripe
- `app/api/espace-client/missions/[id]/payment/route.ts` - Paiement client
- `app/api/admin/missions/[id]/pay-advance/route.ts` - Versement avance
- `app/api/admin/missions/[id]/pay-balance/route.ts` - Versement solde
- `app/components/ClientPaymentSection.tsx` - Interface paiement frontend

#### Sécurité
- `lib/auth.ts` - Authentification
- `lib/session.ts` - Gestion sessions
- `app/middleware.ts` - Protection routes
- `lib/uuidValidation.ts` - Validation UUIDs

#### Modèles de Données
- `prisma/schema.prisma` - Schéma base de données (modèle Mission)

---

## 🚀 Setup Local (Optionnel)

Si vous souhaitez tester localement :

```bash
# Cloner le repository
git clone https://github.com/LeBoy2525/LeBoy-.git
cd LeBoy-

# Installer les dépendances
npm install

# Démarrer PostgreSQL local (Docker)
docker-compose up -d

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Stripe TEST

# Migrations Prisma
npx prisma migrate dev

# Démarrer le serveur de développement
npm run dev
```

**Note :** Les clés Stripe en `.env.local` doivent être en mode **TEST uniquement**.

---

## 🔍 Points d'Attention pour l'Audit

### 1. Validation Paiements

**Fichier :** `app/api/espace-client/missions/[id]/payment/route.ts`

**À vérifier :**
- ✅ Comment les PaymentIntents sont créés ?
- ⚠️ Comment sont-ils validés côté serveur ?
- ⚠️ Y a-t-il une vérification avec l'API Stripe ?

**État actuel :** TODO dans le code - validation non implémentée

### 2. Webhooks Stripe

**À vérifier :**
- ⚠️ Existe-t-il un endpoint webhook ?
- ⚠️ Comment sont gérés les événements Stripe ?
- ⚠️ Y a-t-il une gestion d'idempotence ?

**État actuel :** Aucun webhook implémenté

### 3. États & Synchronisation

**À vérifier :**
- Comment les états applicatifs sont-ils synchronisés avec Stripe ?
- Y a-t-il un mécanisme de réconciliation ?
- Comment gérer les divergences ?

**Fichiers :**
- `lib/types.ts` - Définition des états
- `repositories/missionsRepo.ts` - Mise à jour états

### 4. Sécurité

**À vérifier :**
- Protection CSRF sur routes paiements
- Rate limiting
- Validation des montants
- Logging des transactions
- Gestion des erreurs

### 5. Stripe Connect (Payouts)

**À vérifier :**
- Comment les payouts vers prestataires sont-ils gérés ?
- Y a-t-il une intégration Stripe Connect ?
- Comment sont gérés les frais de plateforme ?

**État actuel :** Payouts non implémentés (TODOs dans le code)

---

## 📊 Schéma de Données Paiements

**Modèle Mission (Prisma) :**
```prisma
model Mission {
  // Paiement client
  paiementEffectue      Boolean?
  paiementEffectueAt    DateTime?
  
  // Avance prestataire
  avanceVersee          Boolean?
  avanceVerseeAt        DateTime?
  avancePercentage      Int?      // 25, 50 ou 100
  
  // Solde prestataire
  soldeVersee           Boolean?
  soldeVerseeAt         DateTime?
  
  // Tarifs
  tarifPrestataire      Int?
  tarifTotal            Int?
  commissionICD         Int?
  
  // État
  internalState         String    // État workflow
  status                String    // Statut métier
}
```

---

## 🎯 Résultats Attendus de l'Audit

### Livrables

1. **Rapport d'audit structuré** avec :
   - Constats techniques
   - Risques identifiés (critiques, importants, moyens)
   - Recommandations concrètes
   - Priorisation des actions

2. **Points spécifiques à couvrir :**
   - Validation paiements Stripe
   - Implémentation webhooks
   - Gestion états et synchronisation
   - Sécurité (CSRF, rate limiting, validation)
   - Stripe Connect pour payouts
   - Gestion erreurs et retry logic

---

## 📞 Contact & Questions

Pour toute question pendant l'audit :
- **Repository :** Issues GitHub ou discussions
- **Contact direct :** Via les canaux convenus

---

## ✅ Checklist Pré-Audit

- [ ] Accès repository GitHub accordé
- [ ] Documentation lue (AUDIT_STRIPE_SECURITY.md)
- [ ] Environnement local configuré (optionnel)
- [ ] Clés Stripe TEST disponibles (si test local)
- [ ] Questions préparées pour l'appel intro

---

**Bon audit ! 🚀**

