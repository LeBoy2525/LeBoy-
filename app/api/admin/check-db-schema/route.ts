// Route API pour vérifier la structure de la base de données
// Utile pour déboguer les problèmes de schéma Prisma

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Prisma non disponible" },
        { status: 503 }
      );
    }

    // Essayer de récupérer les colonnes de la table prestataires
    const result = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'prestataires' 
      ORDER BY ordinal_position;
    `;

    // Essayer aussi de compter les prestataires
    let count = 0;
    try {
      count = await prisma.prestataire.count();
    } catch (error: any) {
      console.error("Erreur count prestataires:", error);
    }

    return NextResponse.json(
      {
        success: true,
        table: "prestataires",
        columns: result,
        count,
        schemaVersion: process.env.PRISMA_SCHEMA_VERSION || "unknown",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur vérification schéma:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la vérification du schéma",
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

