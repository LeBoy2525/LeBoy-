import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMissionInternalState, getMissionById, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { getDemandeById } from "@/lib/dataAccess";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const missionUuid = resolvedParams.id;

    // Validation UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!missionUuid || typeof missionUuid !== "string" || !UUID_REGEX.test(missionUuid)) {
      return NextResponse.json(
        { error: "UUID invalide." },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionUuid);
    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier que la mission est dans l'état PROVIDER_ESTIMATED
    if (mission.internalState !== "PROVIDER_ESTIMATED") {
      return NextResponse.json(
        { error: "La mission doit être en état PROVIDER_ESTIMATED pour générer un devis." },
        { status: 400 }
      );
    }

    if (!mission.estimationPartenaire) {
      return NextResponse.json(
        { error: "Aucune estimation partenaire disponible." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { fraisSupplementaires, paiementEchelonne } = body;

    const prixFournisseur = mission.estimationPartenaire.prixFournisseur;
    const fraisSuppl = fraisSupplementaires ? parseFloat(String(fraisSupplementaires)) : 0;

    // Calculer la commission dynamique selon la catégorie de service
    const { calculateCommission, getCommissionConfigForCategory } = await import("@/lib/commissionConfig");
    const { getAllCommissionConfigs, waitForCommissionConfigsLoad } = await import("@/lib/commissionConfigStore");
    
    await waitForCommissionConfigsLoad();
    const configs = getAllCommissionConfigs();
    const config = getCommissionConfigForCategory(mission.serviceType, configs);

    // La fonction getCommissionConfigForCategory retourne toujours une configuration
    // (soit trouvée, soit mappée, soit par défaut)
    if (!config) {
      // Ce cas ne devrait jamais se produire, mais on garde une sécurité
      console.error(`⚠️ Configuration de commission introuvable pour ${mission.serviceType}, utilisation des valeurs par défaut`);
      return NextResponse.json(
        { error: `Configuration de commission introuvable pour la catégorie ${mission.serviceType}. Veuillez contacter le support.` },
        { status: 500 }
      );
    }

    // Calculer les commissions selon la formule hybride
    const commissionResult = calculateCommission(prixFournisseur, config);

    // Mettre à jour les tarifs de la mission
    mission.tarifPrestataire = prixFournisseur;
    mission.commissionHybride = commissionResult.commissionHybride;
    mission.commissionRisk = commissionResult.commissionRisk;
    mission.commissionTotale = commissionResult.commissionTotale;
    mission.commissionICD = commissionResult.commissionTotale; // Rétrocompatibilité
    mission.fraisSupplementaires = fraisSuppl > 0 ? fraisSuppl : undefined;
    mission.tarifTotal = commissionResult.prixClient + fraisSuppl; // Prix client + frais supplémentaires
    
    // Enregistrer les informations de paiement échelonné si choisi
    if (paiementEchelonne && paiementEchelonne.type === "echelonne") {
      mission.paiementEchelonne = {
        type: "echelonne",
        plan: paiementEchelonne.plan || "50-50",
        nombreTranches: paiementEchelonne.nombreTranches,
        tauxInteret: paiementEchelonne.tauxInteret || 0,
        montantsParTranche: paiementEchelonne.montantsParTranche,
        pourcentagesParTranche: paiementEchelonne.pourcentagesParTranche,
        datesEcheances: paiementEchelonne.datesEcheances,
        totalAvecInterets: paiementEchelonne.totalAvecInterets,
      };
    } else {
      mission.paiementEchelonne = {
        type: "total",
      };
    }

    // Marquer le devis comme généré
    mission.devisGenere = true;
    mission.devisGenereAt = new Date().toISOString();

    // Mettre à jour la mission via Prisma avec les tarifs et le devis
    const { updateMission } = await import("@/repositories/missionsRepo");
    const { mapInternalStateToStatus } = await import("@/lib/types");
    const newInternalState = "WAITING_CLIENT_PAYMENT";
    
    const updatedMissionPrisma = await updateMission(missionUuid, {
      tarifPrestataire: prixFournisseur,
      commissionHybride: commissionResult.commissionHybride,
      commissionRisk: commissionResult.commissionRisk,
      commissionTotale: commissionResult.commissionTotale,
      commissionICD: commissionResult.commissionTotale,
      fraisSupplementaires: fraisSuppl > 0 ? fraisSuppl : undefined,
      tarifTotal: commissionResult.prixClient + fraisSuppl,
      paiementEchelonne: (paiementEchelonne && paiementEchelonne.type === "echelonne") ? {
        type: "echelonne",
        plan: paiementEchelonne.plan || "50-50",
        nombreTranches: paiementEchelonne.nombreTranches,
        tauxInteret: paiementEchelonne.tauxInteret || 0,
        montantsParTranche: paiementEchelonne.montantsParTranche,
        pourcentagesParTranche: paiementEchelonne.pourcentagesParTranche,
        datesEcheances: paiementEchelonne.datesEcheances,
        totalAvecInterets: paiementEchelonne.totalAvecInterets,
      } as any : { type: "total" } as any,
      devisGenere: true,
      devisGenereAt: new Date(),
      internalState: newInternalState as any,
      status: mapInternalStateToStatus(newInternalState as any),
    });

    if (!updatedMissionPrisma) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    // Convertir en JSON pour la réponse
    const { convertPrismaMissionToJSON } = await import("@/lib/dataAccess");
    const updated = convertPrismaMissionToJSON(updatedMissionPrisma);

    if (!updated) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    // Plus besoin de saveMissions() car on utilise Prisma directement

    // Envoyer une notification email au client
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const demande = await getDemandeById(updatedMissionPrisma.demandeId);
      const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
      
      if (demande) {
        await sendNotificationEmail(
          "devis-ready",
          { email: demande.email, name: demande.fullName },
          {
            missionRef: updatedMissionPrisma.ref,
            clientName: demande.fullName,
            serviceType: updatedMissionPrisma.serviceType,
            tarifTotal: updated.tarifTotal || 0,
            platformUrl,
            missionId: missionUuid, // Utiliser l'UUID
          },
          "fr"
        );
      }
    } catch (error) {
      console.error("Erreur envoi email notification client:", error);
      // Ne pas bloquer la génération du devis si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        mission: updated,
        devis: {
          prixPrestataire: commissionResult.prixPrestataire,
          commissionHybride: commissionResult.commissionHybride,
          commissionRisk: commissionResult.commissionRisk,
          commissionTotale: commissionResult.commissionTotale,
          fraisSupplementaires: fraisSuppl,
          tarifTotal: updated.tarifTotal,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/[id]/generate-devis:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

