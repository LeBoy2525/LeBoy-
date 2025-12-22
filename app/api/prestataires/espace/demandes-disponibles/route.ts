// app/api/prestataires/espace/demandes-disponibles/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllDemandes } from "@/lib/dataAccess";
import { getPrestataireByEmail } from "@/lib/dataAccess";
import { getPropositionsByPrestataireId } from "@/lib/dataAccess";
import { getMissionsByPrestataire } from "@/lib/dataAccess";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    // Trouver le prestataire par email
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire || prestataire.statut === "rejete") {
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    // Récupérer les propositions déjà soumises par ce prestataire
    const propositions = await getPropositionsByPrestataireId(prestataire.id);
    const demandeIdsAvecProposition = new Set(propositions.map((p) => p.demandeId));

    // Récupérer les missions assignées à ce prestataire
    const missionsAssignees = await getMissionsByPrestataire(prestataire.id);
    const demandeIdsAvecMission = new Set(missionsAssignees.map((m) => m.demandeId));

    // Date actuelle pour vérifier le délai de 24h
    const maintenant = new Date();

    // Récupérer toutes les demandes
    const allDemandes = await getAllDemandes();

    // Filtrer les demandes :
    // 1. Non supprimées
    // 2. En attente (pas encore rejetées)
    // 3. Correspondant aux spécialités du prestataire
    // 4. Pour lesquelles le prestataire n'a pas encore soumis de proposition
    // 5. Pour lesquelles une mission a été assignée au prestataire
    // 6. Pour lesquelles le délai de 24h n'est pas dépassé
    const demandesDisponibles = allDemandes
      .filter((demande) => {
        // Ne pas inclure les demandes supprimées
        if (demande.deletedAt) return false;

        // Ne pas inclure les demandes rejetées
        if (demande.statut === "rejetee") return false;

        // Vérifier que le prestataire n'a pas déjà soumis une proposition
        if (demandeIdsAvecProposition.has(demande.id)) return false;

        // Vérifier qu'une mission a été assignée pour cette demande
        if (!demandeIdsAvecMission.has(demande.id)) return false;

        // Vérifier que le délai de 24h n'est pas dépassé
        const mission = missionsAssignees.find((m) => m.demandeId === demande.id);
        if (mission && mission.dateLimiteProposition) {
          const dateLimite = new Date(mission.dateLimiteProposition);
          if (maintenant > dateLimite) {
            // Le délai est dépassé, ne pas inclure cette demande
            return false;
          }
        } else {
          // Pas de date limite définie, ne pas inclure (mission mal configurée)
          return false;
        }

        // Vérifier que la catégorie de service correspond aux spécialités du prestataire
        // Le serviceType de la demande correspond à une catégorie LeBoy
        const serviceTypeMap: Record<string, string> = {
          administratif: "administratif_government",
          fiscalite: "financier_fiscal",
          entrepreneuriat: "entrepreneuriat_projets",
          assistance_personnalisee: "sante_assistance",
          autre: "sante_assistance",
          administratif_government: "administratif_government",
          immobilier_foncier: "immobilier_foncier",
          financier_fiscal: "financier_fiscal",
          sante_assistance: "sante_assistance",
          logistique_livraison: "logistique_livraison",
          entrepreneuriat_projets: "entrepreneuriat_projets",
        };

        const specialiteDemande = serviceTypeMap[demande.serviceType] || demande.serviceType;
        return prestataire.specialites.includes(specialiteDemande as any);
      })
      .map((demande) => {
        const mission = missionsAssignees.find((m) => m.demandeId === demande.id);
        return {
          id: demande.id,
          ref: demande.ref,
          createdAt: demande.createdAt,
          serviceType: demande.serviceType,
          serviceSubcategory: demande.serviceSubcategory,
          description: demande.description,
          lieu: demande.lieu,
          urgence: demande.urgence,
          budget: demande.budget,
          missionId: mission?.id,
          dateLimiteProposition: mission?.dateLimiteProposition,
          dateAssignation: mission?.dateAssignation,
        };
      });

    return NextResponse.json(
      { demandes: demandesDisponibles },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/demandes-disponibles:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

