// app/api/prestataires/espace/propositions/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPropositionsByPrestataireId, createProposition } from "@/lib/dataAccess";
import { getPrestataireByEmail } from "@/lib/dataAccess";
import { getDemandeById } from "@/lib/dataAccess";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    // Trouver le prestataire par email
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire || prestataire.statut === "rejete") {
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    const propositions = await getPropositionsByPrestataireId(prestataire.id);

    return NextResponse.json(
      { propositions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/propositions:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    // Trouver le prestataire par email
    const prestataire = await getPrestataireByEmail(userEmail);

    if (!prestataire || prestataire.statut === "rejete") {
      return NextResponse.json(
        { error: "Prestataire non trouvé." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { demandeId, prix_prestataire, delai_estime, commentaire, difficulte_estimee } = body;

    // Validations
    if (!demandeId || !prix_prestataire || !delai_estime || !commentaire || !difficulte_estimee) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    if (difficulte_estimee < 1 || difficulte_estimee > 5) {
      return NextResponse.json(
        { error: "La difficulté estimée doit être entre 1 et 5." },
        { status: 400 }
      );
    }

    // Vérifier que la demande existe
    const demande = await getDemandeById(demandeId);
    if (!demande) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas déjà une proposition pour cette demande et ce prestataire
    const existingPropositions = await getPropositionsByPrestataireId(prestataire.id);
    const alreadyProposed = existingPropositions.some(
      (p) => p.demandeId === demandeId && p.statut === "en_attente"
    );

    if (alreadyProposed) {
      return NextResponse.json(
        { error: "Vous avez déjà soumis une proposition pour cette demande." },
        { status: 400 }
      );
    }

    // Créer la proposition
    const proposition = await createProposition({
      demandeId,
      prestataireId: prestataire.id,
      prix_prestataire: parseFloat(prix_prestataire),
      delai_estime: parseInt(delai_estime),
      commentaire: commentaire.trim(),
      difficulte_estimee: parseInt(difficulte_estimee),
    });

    // Envoyer notification à l'admin (via email)
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
      
      await sendNotificationEmail(
        "proposition-submitted",
        { email: process.env.ICD_ADMIN_EMAIL || "admin@leboy.ca", name: "Administrateur LeBoy" },
        {
          propositionRef: proposition.ref,
          demandeRef: demande.ref,
          prestataireNom: prestataire.nomEntreprise,
          prix: proposition.prix_prestataire,
          delai: proposition.delai_estime,
          platformUrl,
          demandeId: demande.id,
        },
        "fr"
      );
    } catch (error) {
      console.error("Erreur envoi email notification admin:", error);
      // Ne pas bloquer la création de la proposition si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        proposition,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur /api/prestataires/espace/propositions:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

