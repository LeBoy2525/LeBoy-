import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { getPrestataireById } from "@/lib/dataAccess";

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

    // Vérifier que la mission est dans l'état ADMIN_CONFIRMED
    if (mission.internalState !== "ADMIN_CONFIRMED") {
      return NextResponse.json(
        { error: "La mission doit être validée avant d'envoyer le solde." },
        { status: 400 }
      );
    }

    // Vérifier que le solde n'a pas déjà été versé
    if (mission.soldeVersee) {
      return NextResponse.json(
        { error: "Le solde a déjà été versé." },
        { status: 400 }
      );
    }

    // Calculer le solde en fonction du pourcentage d'avance déjà versé
    const montantPrestataire = mission.tarifPrestataire || 0;
    const avancePercentage = mission.avancePercentage || 50; // Par défaut 50% si non défini (rétrocompatibilité)
    const soldePercentage = 100 - avancePercentage; // Si avance 25%, solde = 75%. Si avance 50%, solde = 50%
    const solde = (montantPrestataire * soldePercentage) / 100;

    // Mettre à jour la mission via Prisma avec le solde
    const { updateMission } = await import("@/repositories/missionsRepo");
    const updatedMissionPrisma = await updateMission(missionUuid, {
      soldeVersee: true,
      soldeVerseeAt: new Date(),
    });

    if (!updatedMissionPrisma) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour." },
        { status: 500 }
      );
    }

    // Convertir en JSON pour la réponse
    const { convertPrismaMissionToJSON } = await import("@/lib/dataAccess");
    const updatedMission = convertPrismaMissionToJSON(updatedMissionPrisma);

    // Envoyer une notification email au prestataire
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const prestataire = updatedMissionPrisma.prestataireId ? await getPrestataireById(updatedMissionPrisma.prestataireId) : null;
      const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
      
      if (prestataire) {
        await sendNotificationEmail(
          "advance-sent",
          { email: prestataire.email, name: prestataire.nomEntreprise || prestataire.nomContact },
          {
            missionRef: updatedMissionPrisma.ref,
            providerName: prestataire.nomEntreprise || prestataire.nomContact,
            montantAvance: solde, // C'est le solde, pas l'avance, mais on réutilise le template
            serviceType: updatedMissionPrisma.serviceType,
            platformUrl,
            missionId: missionUuid, // Utiliser l'UUID
          },
          "fr"
        );
      }
    } catch (error) {
      console.error("Erreur envoi email notification prestataire:", error);
      // Ne pas bloquer le paiement si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        message: `Solde de $${solde.toFixed(2)} envoyé avec succès.`,
        mission: updatedMission,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/[id]/pay-balance:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

