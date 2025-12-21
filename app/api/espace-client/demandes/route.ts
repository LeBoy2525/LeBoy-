// app/api/espace-client/demandes/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRoleAsync } from "@/lib/auth";
import { getAllDemandes } from "@/lib/dataAccess";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("icd_auth")?.value;
    const userEmail = cookieStore.get("icd_user_email")?.value;

    // Pas connecté → aucune demande
    if (!authCookie || authCookie !== "1" || !userEmail) {
      return NextResponse.json({ demandes: [] }, { status: 200 });
    }

    // Vérifier que c'est bien un client
    const role = await getUserRoleAsync(userEmail);
    if (role !== "client") {
      return NextResponse.json({ demandes: [] }, { status: 200 });
    }

    const email = userEmail.toLowerCase();

    // On filtre les demandes par email (exclure les supprimées)
    const allDemandes = await getAllDemandes();
    const demandes = allDemandes
      .filter((d) => d.email.toLowerCase() === email && !d.deletedAt)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    console.log(`[API] Récupération demandes pour ${email}: ${demandes.length} demande(s) trouvée(s)`);

    return NextResponse.json(
      { demandes }, 
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
    console.error("ERREUR /api/espace-client/demandes (GET) :", error);
    return NextResponse.json(
      { demandes: [], error: "Erreur lors du chargement des demandes." },
      { status: 500 }
    );
  }
}
