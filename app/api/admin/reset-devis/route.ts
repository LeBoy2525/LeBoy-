import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";
import { getMissionsByDemandeId, saveMissions } from "@/lib/dataAccess";
import { getPropositionsByDemandeId, updatePropositionStatut } from "@/lib/dataAccess";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { demandeId } = body;

    if (!demandeId || isNaN(parseInt(String(demandeId)))) {
      return NextResponse.json(
        { error: "ID de demande invalide." },
        { status: 400 }
      );
    }

    const demandeIdNum = parseInt(String(demandeId));

    // Trouver toutes les missions de cette demande avec devis généré
    const allMissions = await getMissionsByDemandeId(demandeIdNum);
    const missionsToReset = allMissions.filter(
      (m) => m.devisGenere === true
    );

    if (missionsToReset.length === 0) {
      return NextResponse.json(
        { message: "Aucune mission avec devis généré trouvée pour cette demande." },
        { status: 200 }
      );
    }

    // Réinitialiser les missions
    for (const mission of missionsToReset) {
      // Réinitialiser le flag devisGenere
      mission.devisGenere = false;
      delete mission.devisGenereAt;
      
      // Réinitialiser les tarifs et commissions
      delete mission.tarifTotal;
      delete mission.commissionHybride;
      delete mission.commissionRisk;
      delete mission.commissionTotale;
      delete mission.commissionICD;
      delete mission.fraisSupplementaires;
      delete mission.paiementEchelonne;
      
      // Remettre l'état à PROVIDER_ESTIMATED si nécessaire
      if (mission.internalState === "WAITING_CLIENT_PAYMENT") {
        mission.internalState = "PROVIDER_ESTIMATED";
        mission.status = "evaluation_recue_quebec";
      }
    }

    // Réinitialiser les propositions acceptées pour cette demande
    const propositions = await getPropositionsByDemandeId(demandeIdNum);
    for (const prop of propositions) {
      if (prop.statut === "acceptee") {
        await updatePropositionStatut(prop.id, "en_attente", userEmail);
      }
    }

    // Sauvegarder les modifications
    await saveMissions();

    return NextResponse.json(
      {
        success: true,
        message: `${missionsToReset.length} mission(s) réinitialisée(s) avec succès.`,
        missionsReset: missionsToReset.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/reset-devis:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

