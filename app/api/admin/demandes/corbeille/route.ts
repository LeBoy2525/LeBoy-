import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllDemandes } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const allDemandes = await getAllDemandes();
    const deletedDemandes = allDemandes.filter((d) => d.deletedAt);

    return NextResponse.json(
      {
        demandes: deletedDemandes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/admin/demandes/corbeille:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
