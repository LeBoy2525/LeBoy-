// Route API pour migrer les prestataires existants vers "entreprise"
// Cette route doit être appelée une seule fois après l'ajout du champ typePrestataire

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Vérifier que Prisma est disponible
    if (!prisma) {
      return NextResponse.json(
        { error: "Base de données non disponible. Utilisez le mode JSON." },
        { status: 503 }
      );
    }

    console.log("🚀 Début de la migration des types de prestataires...");

    // Récupérer tous les prestataires existants (non supprimés)
    const prestataires = await prisma.prestataire.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        ref: true,
        nomEntreprise: true,
        typePrestataire: true,
      },
    });

    console.log(`📊 ${prestataires.length} prestataire(s) trouvé(s)`);

    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Mettre à jour tous les prestataires qui sont "freelance" ou null vers "entreprise"
    for (const prestataire of prestataires) {
      if (!prestataire.typePrestataire || prestataire.typePrestataire === "freelance") {
        try {
          await prisma.prestataire.update({
            where: { id: prestataire.id },
            data: {
              typePrestataire: "entreprise",
            },
          });
          updatedCount++;
          console.log(`✅ ${prestataire.ref} (${prestataire.nomEntreprise}) → entreprise`);
        } catch (error: any) {
          const errorMsg = `Erreur mise à jour ${prestataire.ref}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      } else {
        skippedCount++;
        console.log(`⏭️  ${prestataire.ref} (${prestataire.nomEntreprise}) → déjà ${prestataire.typePrestataire}`);
      }
    }

    console.log(`\n✅ Migration terminée !`);
    console.log(`   - ${updatedCount} prestataire(s) mis à jour → entreprise`);
    console.log(`   - ${skippedCount} prestataire(s) déjà configuré(s)`);
    if (errors.length > 0) {
      console.log(`   - ${errors.length} erreur(s)`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Migration terminée avec succès",
        stats: {
          total: prestataires.length,
          updated: updatedCount,
          skipped: skippedCount,
          errors: errors.length,
        },
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Erreur lors de la migration:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la migration",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

