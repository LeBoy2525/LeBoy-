// Route API pour vérifier la structure de la base de données
// Utile pour déboguer les problèmes de schéma Prisma

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Prisma non disponible", USE_DB: process.env.USE_DB },
        { status: 503 }
      );
    }

    const diagnostics: any = {
      prismaAvailable: true,
      USE_DB: process.env.USE_DB,
      DATABASE_URL: process.env.DATABASE_URL ? "définie" : "non définie",
    };

    // Essayer de récupérer les colonnes de la table prestataires
    try {
      const columns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'prestataires' 
        ORDER BY ordinal_position;
      `;
      diagnostics.prestatairesColumns = columns;
      diagnostics.prestatairesColumnCount = columns.length;
      
      // Vérifier si typePrestataire existe
      const hasTypePrestataire = columns.some(c => c.column_name === "typePrestataire");
      diagnostics.hasTypePrestataire = hasTypePrestataire;
    } catch (error: any) {
      diagnostics.prestatairesColumnsError = error.message;
      diagnostics.prestatairesColumnsCode = error.code;
    }

    // Essayer de compter les prestataires
    try {
      const count = await prisma.prestataire.count();
      diagnostics.prestatairesCount = count;
    } catch (error: any) {
      diagnostics.prestatairesCountError = error.message;
      diagnostics.prestatairesCountCode = error.code;
    }

    // Essayer de récupérer un prestataire
    try {
      const sample = await prisma.prestataire.findFirst({
        take: 1,
      });
      diagnostics.samplePrestataire = sample ? {
        id: sample.id,
        ref: sample.ref,
        email: sample.email,
        statut: sample.statut,
        typePrestataire: (sample as any).typePrestataire,
      } : null;
    } catch (error: any) {
      diagnostics.samplePrestataireError = error.message;
      diagnostics.samplePrestataireCode = error.code;
    }

    // Vérifier la table admin_notifications
    try {
      const notificationsColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'admin_notifications';
      `;
      diagnostics.adminNotificationsExists = notificationsColumns.length > 0;
      diagnostics.adminNotificationsColumns = notificationsColumns.length;
    } catch (error: any) {
      diagnostics.adminNotificationsError = error.message;
    }

    return NextResponse.json(
      {
        success: true,
        diagnostics,
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
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

