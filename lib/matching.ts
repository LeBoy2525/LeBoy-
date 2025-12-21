// lib/matching.ts
import type { DemandeICD } from "./demandesStore";
import type { Prestataire, ServiceType } from "./prestatairesStore";
import {
  getPrestatairesBySpecialite,
  getPrestatairesByVille,
  getPrestatairesActifs,
  prestatairesStore,
} from "./prestatairesStore";

export type MatchScore = {
  prestataire: Prestataire;
  score: number;
  reasons: string[];
};

/**
 * Trouve les meilleurs prestataires pour une demande donnée
 * @param demande - La demande à matcher
 * @param prestatairesList - Liste des prestataires (optionnel, utilise prestatairesStore par défaut)
 */
export function matchDemandeToPrestataires(
  demande: DemandeICD,
  prestatairesList?: Prestataire[]
): MatchScore[] {
  // Utiliser la liste fournie ou fallback sur prestatairesStore
  const prestatairesToUse = prestatairesList || prestatairesStore;
  const matches: MatchScore[] = [];

  console.log("🔍 Matching pour demande:", {
    id: demande.id,
    serviceType: demande.serviceType,
    lieu: demande.lieu,
  });

  // 1. Filtrer par spécialité (catégorie de service)
  // Le serviceType de la demande correspond maintenant directement à une catégorie LeBoy
  const serviceTypeMap: Record<string, ServiceType> = {
    // Anciens types (rétrocompatibilité)
    administratif: "administratif_government",
    fiscalite: "financier_fiscal",
    entrepreneuriat: "entrepreneuriat_projets",
    assistance_personnalisee: "sante_assistance",
    autre: "sante_assistance", // Par défaut pour "autre"
    // Nouveaux types LeBoy (catégories principales)
    administratif_government: "administratif_government",
    immobilier_foncier: "immobilier_foncier",
    financier_fiscal: "financier_fiscal",
    sante_assistance: "sante_assistance",
    logistique_livraison: "logistique_livraison",
    entrepreneuriat_projets: "entrepreneuriat_projets",
  };

  // Utiliser directement serviceType qui est maintenant la catégorie principale
  const specialite = serviceTypeMap[demande.serviceType] || demande.serviceType as ServiceType || "sante_assistance";
  console.log("🔍 Catégorie de service recherchée:", specialite, "(depuis demande.serviceType:", demande.serviceType, ")");
  
  // Fonction pour vérifier si un prestataire a la spécialité recherchée (avec mapping rétrocompatibilité)
  const hasSpecialite = (prestataire: Prestataire, specialiteRecherchee: ServiceType): boolean => {
    // Vérifier directement
    if (prestataire.specialites.includes(specialiteRecherchee)) {
      return true;
    }
    // Vérifier avec mapping inverse (anciennes valeurs vers nouvelles)
    const reverseMapping: Record<string, string[]> = {
      "administratif_government": ["administratif"],
      "financier_fiscal": ["fiscalite"],
      "entrepreneuriat_projets": ["entrepreneuriat"],
      "sante_assistance": ["assistance_personnalisee"],
      "logistique_livraison": [],
      "immobilier_foncier": ["immobilier_foncier"],
    };
    const anciennesValeurs = reverseMapping[specialiteRecherchee] || [];
    return prestataire.specialites.some((spec) => 
      anciennesValeurs.includes(spec) || spec === specialiteRecherchee
    );
  };
  
  // D'abord, essayer de trouver par spécialité ET statut actif (avec mapping rétrocompatibilité)
  let candidates = prestatairesToUse.filter((p) => 
    p.statut === "actif" && !p.deletedAt && hasSpecialite(p, specialite)
  );
  console.log("🔍 Candidats après filtrage spécialité (actifs):", candidates.length);

  // Si aucun candidat par spécialité, prendre tous les prestataires actifs (toutes spécialités)
  if (candidates.length === 0) {
    console.log("⚠️ Aucun prestataire actif avec cette spécialité, recherche tous les prestataires actifs");
    candidates = prestatairesToUse.filter(p => p.statut === "actif" && !p.deletedAt);
    console.log("🔍 Tous les prestataires actifs:", candidates.length);
  }

  // Si toujours aucun, inclure aussi les prestataires en attente (pour l'admin)
  if (candidates.length === 0) {
    console.log("⚠️ Aucun prestataire actif trouvé, vérification de la liste...");
    console.log("📊 Total prestataires dans la liste:", prestatairesToUse.length);
    console.log("📊 Prestataires par statut:", {
      en_attente: prestatairesToUse.filter(p => p.statut === "en_attente").length,
      actif: prestatairesToUse.filter(p => p.statut === "actif").length,
      suspendu: prestatairesToUse.filter(p => p.statut === "suspendu").length,
      rejete: prestatairesToUse.filter(p => p.statut === "rejete").length,
    });
    
    // Pour l'admin, permettre de voir tous les prestataires non rejetés
    // (même en attente ou suspendus, mais avec un score plus bas)
    const allNonRejected = prestatairesToUse.filter(p => p.statut !== "rejete" && !p.deletedAt);
    if (allNonRejected.length > 0) {
      console.log("⚠️ Utilisation de tous les prestataires non rejetés pour l'admin");
      candidates = allNonRejected;
    }
  } else {
    // Si on a des candidats actifs, ajouter aussi les prestataires en attente avec la bonne spécialité
    // pour donner plus de choix à l'admin
    const enAttenteAvecSpecialite = prestatairesToUse.filter(
      p => p.statut === "en_attente" && !p.deletedAt && hasSpecialite(p, specialite)
    );
    if (enAttenteAvecSpecialite.length > 0) {
      console.log("➕ Ajout de", enAttenteAvecSpecialite.length, "prestataire(s) en attente avec la spécialité");
      // Éviter les doublons
      const existingIds = new Set(candidates.map(p => p.id));
      const newCandidates = enAttenteAvecSpecialite.filter(p => !existingIds.has(p.id));
      candidates = [...candidates, ...newCandidates];
    }
  }

  // 2. Filtrer STRICTEMENT par localisation (ville) - OBLIGATOIRE
  // Un prestataire qui n'opère pas dans la ville de la demande ne peut pas recevoir la demande
  if (demande.lieu) {
    const ville = extractVille(demande.lieu);
    if (ville) {
      // Ne garder QUE les prestataires qui opèrent dans cette ville (avec normalisation des accents)
      candidates = candidates.filter((p) => 
        p.zonesIntervention && p.zonesIntervention.length > 0 && 
        p.zonesIntervention.some((zone) => villesMatch(zone, ville))
      );
      console.log("🔍 Candidats après filtrage STRICT par ville:", candidates.length, "(ville recherchée:", ville, ")");
    }
  }

  // 3. Filtrer STRICTEMENT par pays - OBLIGATOIRE
  // Un prestataire qui n'opère pas dans le pays de la demande ne peut pas recevoir la demande
  if (demande.country) {
    const paysDemande = demande.country.toUpperCase().trim();
    candidates = candidates.filter((p) => {
      // Si le prestataire n'a pas de pays défini, on considère qu'il opère au Cameroun par défaut
      if (!p.countries || p.countries.length === 0) {
        return paysDemande === "CM"; // Par défaut, Cameroun
      }
      // Le prestataire doit opérer dans le pays de la demande
      return p.countries.some((country) => 
        country.toUpperCase().trim() === paysDemande
      );
    });
    console.log("🔍 Candidats après filtrage STRICT par pays:", candidates.length, "(pays recherché:", paysDemande, ")");
  }

  // 4. Calculer un score pour chaque candidat
  for (const prestataire of candidates) {
    // Ne pas exclure les prestataires "charge" ou "indisponible" pour l'admin
    // L'admin peut quand même les assigner s'il le souhaite
    // if (prestataire.disponibilite !== "disponible") continue;

    let score = 0;
    const reasons: string[] = [];

    // Score de base : vérifier si la catégorie correspond (avec mapping rétrocompatibilité)
    const hasSpecialiteMatch = hasSpecialite(prestataire, specialite);
    if (hasSpecialiteMatch) {
      score += 50; // Bonus très important pour correspondance catégorie
      reasons.push(`✅ Catégorie correspondante: ${specialite}`);
    } else {
      // Ne devrait pas arriver car on filtre déjà par spécialité, mais on garde pour sécurité
      score -= 100; // Malus très important - ne devrait pas être sélectionné
      reasons.push(`❌ Catégorie non correspondante (recherchée: ${specialite})`);
    }

    // Bonus : localisation correspondante (déjà filtré, mais bonus pour confirmation)
    if (demande.lieu) {
      const ville = extractVille(demande.lieu);
      if (ville && prestataire.zonesIntervention && prestataire.zonesIntervention.some((zone) => villesMatch(zone, ville))) {
        score += 30;
        reasons.push(`✅ Opère dans la ville: ${ville}`);
      }
    }

    // Bonus : pays correspondant (déjà filtré, mais bonus pour confirmation)
    if (demande.country) {
      const paysDemande = demande.country.toUpperCase().trim();
      const hasCountry = !prestataire.countries || prestataire.countries.length === 0 
        ? paysDemande === "CM" // Par défaut Cameroun
        : prestataire.countries.some((country) => country.toUpperCase().trim() === paysDemande);
      if (hasCountry) {
        score += 20;
        reasons.push(`✅ Opère dans le pays: ${paysDemande}`);
      }
    }

    // Bonus : note élevée (PRIORITÉ MAJEURE - les bonnes notes mettent en tête de file)
    // Le score est multiplié par un facteur pour donner plus de poids aux notes
    if (prestataire.noteMoyenne >= 4.5 && prestataire.nombreEvaluations && prestataire.nombreEvaluations >= 3) {
      score += 40; // Bonus très élevé pour excellente note avec plusieurs évaluations
      reasons.push(`⭐⭐⭐ Excellente note (${prestataire.noteMoyenne.toFixed(1)}/5 - ${prestataire.nombreEvaluations} éval.)`);
    } else if (prestataire.noteMoyenne >= 4.0 && prestataire.nombreEvaluations && prestataire.nombreEvaluations >= 2) {
      score += 30; // Bonus élevé pour très bonne note
      reasons.push(`⭐⭐ Excellente note (${prestataire.noteMoyenne.toFixed(1)}/5 - ${prestataire.nombreEvaluations} éval.)`);
    } else if (prestataire.noteMoyenne >= 3.5) {
      score += 20; // Bonus pour bonne note
      reasons.push(`⭐ Bonne note (${prestataire.noteMoyenne.toFixed(1)}/5)`);
    } else if (prestataire.noteMoyenne >= 3.0) {
      score += 10; // Petit bonus pour note acceptable
      reasons.push(`Note acceptable (${prestataire.noteMoyenne.toFixed(1)}/5)`);
    } else if (prestataire.noteMoyenne > 0 && prestataire.noteMoyenne < 3.0) {
      score -= 10; // Malus pour note faible
      reasons.push(`⚠️ Note faible (${prestataire.noteMoyenne.toFixed(1)}/5)`);
    } else if (prestataire.noteMoyenne === 0 || !prestataire.nombreEvaluations) {
      // Pas encore évalué - pas de bonus ni malus, mais sera derrière les évalués
      reasons.push("Pas encore évalué");
    }

    // Bonus : expérience
    if (prestataire.anneeExperience >= 10) {
      score += 10;
      reasons.push("Expérience confirmée");
    } else if (prestataire.anneeExperience >= 5) {
      score += 5;
      reasons.push("Expérience solide");
    }

    // Bonus : taux de réussite élevé
    if (prestataire.tauxReussite >= 90) {
      score += 10;
      reasons.push("Taux de réussite élevé");
    }

    // Bonus : certifications
    if (prestataire.certifications.length > 0) {
      score += 5;
      reasons.push("Certifications professionnelles");
    }

    // Malus : trop de missions en cours
    if (prestataire.nombreMissions >= prestataire.capaciteMaxMissions) {
      score -= 20;
      reasons.push("Capacité maximale atteinte");
    }

    // Malus : indisponible
    if (prestataire.disponibilite !== "disponible") {
      score -= 10;
      reasons.push(`Disponibilité: ${prestataire.disponibilite}`);
    }

    // Malus : en attente de validation
    if (prestataire.statut === "en_attente") {
      score -= 15;
      reasons.push("En attente de validation");
    } else if (prestataire.statut === "suspendu") {
      score -= 25;
      reasons.push("Compte suspendu");
    }

    matches.push({
      prestataire,
      score,
      reasons,
    });
  }

  console.log("🔍 Total matches trouvés:", matches.length);

  // Trier par score décroissant, puis par note moyenne décroissante (priorité aux meilleures notes)
  // Si deux prestataires ont le même score, celui avec la meilleure note moyenne passe en premier
  matches.sort((a, b) => {
    // D'abord par score
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Si scores égaux, trier par note moyenne (les meilleures notes en premier)
    const noteA = a.prestataire.noteMoyenne || 0;
    const noteB = b.prestataire.noteMoyenne || 0;
    if (noteB !== noteA) {
      return noteB - noteA;
    }
    // Si notes égales, trier par nombre d'évaluations (plus d'évaluations = plus fiable)
    const evalA = a.prestataire.nombreEvaluations || 0;
    const evalB = b.prestataire.nombreEvaluations || 0;
    return evalB - evalA;
  });

  console.log("🔍 Matches triés par priorité (score + note moyenne):", matches.map(m => ({
    id: m.prestataire.id,
    nom: m.prestataire.nomEntreprise,
    score: m.score,
    noteMoyenne: m.prestataire.noteMoyenne,
    nombreEvaluations: m.prestataire.nombreEvaluations,
  })));

  // Retourner tous les matches (pas de limite) pour permettre la sélection multiple
  // Les prestataires sont déjà triés par score décroissant
  return matches;
}

/**
 * Normalise une chaîne en supprimant les accents et en convertissant en minuscules
 */
function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .toLowerCase()
    .trim();
}

/**
 * Vérifie si deux villes correspondent (normalisation des accents)
 */
function villesMatch(ville1: string, ville2: string): boolean {
  const normalized1 = normalizeString(ville1);
  const normalized2 = normalizeString(ville2);
  return normalized1 === normalized2 || 
         normalized1.includes(normalized2) || 
         normalized2.includes(normalized1);
}

/**
 * Extrait la ville depuis une chaîne de lieu
 */
function extractVille(lieu: string): string | null {
  const villes = [
    "Yaoundé",
    "Douala",
    "Bafoussam",
    "Garoua",
    "Maroua",
    "Buea",
    "Bamenda",
    "Ebolowa",
    "Kribi",
    "Limbe",
    "Bazou",
    "Ogola",
    "Jauvence",
  ];

  const lieuNormalized = normalizeString(lieu);
  
  for (const ville of villes) {
    if (normalizeString(ville).includes(lieuNormalized) || lieuNormalized.includes(normalizeString(ville))) {
      return ville; // Retourner la version standardisée avec accent
    }
  }

  return null;
}
