import { NextResponse } from "next/server";

export async function GET() {
  // Pendant le build, retourner une réponse simple sans essayer de se connecter à la DB
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        status: "ok",
        database: "skipped",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  try {
    const { prisma } = await import("@/lib/db");
    // Vérifier la connexion à la base de données
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

