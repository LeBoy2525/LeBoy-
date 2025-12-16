// app/api/admin/commission-configs/route.ts
// API pour gérer les configurations de commission

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserRole } from "@/lib/auth";
import {
  getAllCommissionConfigs,
  updateCommissionConfig,
  waitForCommissionConfigsLoad,
} from "@/lib/commissionConfigStore";
import type { CommissionConfig } from "@/lib/commissionConfig";

export const runtime = "nodejs";

// GET : Récupérer toutes les configurations
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || getUserRole(userEmail) !== "admin") {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    await waitForCommissionConfigsLoad();
    const configs = getAllCommissionConfigs();

    return NextResponse.json({ configs }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des configurations:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// PUT : Mettre à jour une configuration
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || getUserRole(userEmail) !== "admin") {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const body = await req.json();
    const { categoryId, updates } = body;

    if (!categoryId) {
      return NextResponse.json({ error: "ID de catégorie manquant." }, { status: 400 });
    }

    const updated = updateCommissionConfig(categoryId, updates);

    if (!updated) {
      return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
    }

    return NextResponse.json({ config: updated }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la configuration:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

