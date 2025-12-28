// Route API pour forcer la régénération du client Prisma et vérifier les migrations
// À appeler en cas d'erreur P2022 (colonne manquante)

import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Cette route ne peut pas régénérer Prisma en runtime
    // Mais elle peut vérifier l'état de la base de données
    
    const { prisma } = await import("@/lib/db");
    
    if (!prisma) {
      return NextResponse.json(
        { error: "Prisma non disponible" },
        { status: 503 }
      );
    }

    // Vérifier si la colonne typePrestataire existe
    const checkColumn = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'prestataires' 
      AND column_name = 'typePrestataire';
    `;

    const columnExists = checkColumn.length > 0;

    // Essayer de récupérer un prestataire pour tester
    let testQuery = false;
    try {
      await prisma.prestataire.findFirst({
        take: 1,
      });
      testQuery = true;
    } catch (error: any) {
      console.error("Erreur test query:", error);
    }

    return NextResponse.json(
      {
        success: true,
        typePrestataireColumnExists: columnExists,
        testQueryWorks: testQuery,
        message: columnExists 
          ? "La colonne typePrestataire existe. Le problème vient peut-être du client Prisma qui n'a pas été régénéré."
          : "La colonne typePrestataire n'existe pas. Il faut appliquer les migrations.",
        actionRequired: !columnExists 
          ? "Exécuter: npx prisma migrate deploy" 
          : "Régénérer le client Prisma: npx prisma generate",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur vérification schéma:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la vérification",
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

