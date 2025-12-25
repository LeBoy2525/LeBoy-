# Plan d'implémentation : Classification des Prestataires (Entreprise vs Freelance)

## 🎯 Objectif
Classer les prestataires en deux groupes distincts :
- **Entreprises** : Structures légales avec documents officiels (RC, CNI, etc.)
- **Freelances** : Indépendants avec compétences/diplômes mais sans structure légale

## ✅ Checklist d'implémentation

### 1. Base de données
- [x] Ajouter champ `typePrestataire` au modèle Prisma (`entreprise` | `freelance`)
- [ ] Créer migration Prisma
- [ ] Appliquer migration en développement
- [ ] Prévoir migration en production

### 2. Formulaire d'inscription
- [ ] Ajouter sélection du type (Entreprise/Freelance) au début du formulaire
- [ ] Adapter les champs selon le type :
  - **Entreprise** : Documents officiels (RC, CNI, etc.) - obligatoires
  - **Freelance** : Diplômes/Certifications - optionnels mais recommandés
- [ ] Ajouter validation conditionnelle selon le type
- [ ] Mettre à jour les traductions FR/EN

### 3. Validation Admin
- [ ] Afficher le type dans la liste des prestataires
- [ ] Afficher le type dans la page de détails
- [ ] Ajouter badge visuel (icône Building2 pour entreprise, User pour freelance)
- [ ] Adapter la validation selon le type (vérifier documents pour entreprises)

### 4. Interface Admin - Gestion
- [ ] Créer onglets/filtres pour séparer Entreprises et Freelances
- [ ] Ajouter statistiques par type (nombre, taux de validation, etc.)
- [ ] Créer vue "Tous" qui combine les deux types
- [ ] Maintenir la recherche globale qui fonctionne sur les deux types

### 5. Algorithme de Matching
- [ ] Adapter `matchDemandeToPrestataires` pour tenir compte du type
- [ ] Maintenir le workflow actuel (ville + compétence)
- [ ] Optionnel : Prioriser entreprises pour certaines missions complexes
- [ ] Séparer les suggestions par type dans l'interface d'assignation

### 6. Interface d'assignation
- [ ] Afficher badges visuels (Entreprise/Freelance) sur chaque prestataire suggéré
- [ ] Grouper visuellement les suggestions par type
- [ ] Maintenir la section "Autres prestataires" avec filtres par type
- [ ] Ajouter statistiques rapides (X entreprises, Y freelances disponibles)

### 7. Badges et Icônes
- [ ] Créer composant `PrestataireTypeBadge` réutilisable
- [ ] Utiliser Building2 (lucide-react) pour Entreprise
- [ ] Utiliser User (lucide-react) pour Freelance
- [ ] Ajouter couleurs distinctives (bleu pour entreprise, vert pour freelance)

### 8. Statistiques Dashboard
- [ ] Ajouter widget "Répartition par type" dans le dashboard admin
- [ ] Afficher nombre total d'entreprises vs freelances
- [ ] Afficher taux de validation par type
- [ ] Afficher missions assignées par type

## 🎨 Solution innovante proposée

### 1. **Badge visuel intelligent**
- Badge coloré avec icône dans toutes les interfaces
- Tooltip explicatif au survol
- Indicateur de confiance visuel (entreprises = plus de confiance)

### 2. **Filtres intelligents dans l'assignation**
- Onglets "Entreprises", "Freelances", "Tous"
- Compteurs en temps réel
- Tri par type + score de matching

### 3. **Suggestion contextuelle**
- Certaines missions peuvent suggérer préférentiellement des entreprises
- Les freelances restent disponibles mais avec indication visuelle
- L'admin garde le contrôle total

### 4. **Statistiques visuelles**
- Graphiques de répartition dans le dashboard
- Métriques de performance par type
- Tendance d'inscription par type

## 📋 Ordre d'implémentation recommandé

1. **Phase 1 : Base de données** (30 min)
   - Modifier schema.prisma
   - Créer migration
   - Tester migration

2. **Phase 2 : Formulaire d'inscription** (45 min)
   - Ajouter sélection type
   - Adapter champs conditionnels
   - Validation

3. **Phase 3 : Interface Admin - Liste** (30 min)
   - Ajouter badges
   - Ajouter filtres/onglets
   - Statistiques

4. **Phase 4 : Interface Admin - Détails** (20 min)
   - Afficher type
   - Badge visuel

5. **Phase 5 : Matching et Assignation** (45 min)
   - Adapter algorithme
   - Interface avec badges
   - Groupement visuel

6. **Phase 6 : Statistiques Dashboard** (30 min)
   - Widgets
   - Graphiques
   - Métriques

**Total estimé : ~3h30**

## 🔄 Compatibilité ascendante

- Les prestataires existants sans type seront classés comme "freelance" par défaut
- L'admin pourra modifier le type manuellement lors de la validation
- Migration automatique des données existantes

