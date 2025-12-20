// app/api/demandes/route.ts

import { NextResponse } from "next/server";
import { createDemande, getAllDemandes } from "@/lib/dataAccess";

// Validation simple d'email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validation de téléphone (format flexible pour diaspora et Cameroun)
function isValidPhone(phone: string): boolean {
  if (!phone || phone.trim().length === 0) {
    return false;
  }

  // Nettoyer le numéro : enlever espaces, tirets, parenthèses, points, slashes
  const cleaned = phone.replace(/[\s\-\(\)\.\/]/g, "");

  // Si le numéro nettoyé est vide, c'est invalide
  if (cleaned.length === 0) {
    return false;
  }

  // Vérifier si c'est uniquement des chiffres (et éventuellement + au début)
  if (!/^\+?[0-9]+$/.test(cleaned)) {
    return false;
  }

  // Accepter les formats suivants :
  // 1. Numéros avec indicatif pays (+237, 00237, 237) suivi de 9 chiffres
  // 2. Numéros locaux camerounais (9 chiffres commençant par 6, 7, ou 8)
  // 3. Numéros internationaux (avec + et 8-15 chiffres au total)
  // 4. Numéros sans indicatif (8-15 chiffres)

  // Format avec indicatif Cameroun (+237, 00237, 237)
  if (/^(\+?237|00237|237)[0-9]{9}$/.test(cleaned)) {
    return true;
  }

  // Format local camerounais (9 chiffres commençant par 6, 7, ou 8)
  if (/^[678][0-9]{8}$/.test(cleaned)) {
    return true;
  }

  // Format international avec + (minimum 8 chiffres, maximum 15)
  if (/^\+[0-9]{8,15}$/.test(cleaned)) {
    return true;
  }

  // Format numérique simple (8-15 chiffres)
  if (/^[0-9]{8,15}$/.test(cleaned)) {
    return true;
  }

  return false;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("icd_auth")?.value;
    const userEmailCookie = cookieStore.get("icd_user_email")?.value;

    // Debug: logger tous les champs reçus
    console.log("[API /api/demandes] Champs reçus:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    // Champs venant du formulaire "Soumettre une demande"
    const fullName = ((formData.get("fullName") as string) || "").trim();
    // Si le client est connecté, utiliser son email de connexion plutôt que celui du formulaire
    // Sinon, utiliser l'email du formulaire
    const emailFromForm = ((formData.get("email") as string) || "").trim();
    const email = (authCookie === "1" && userEmailCookie) 
      ? userEmailCookie.toLowerCase().trim() 
      : emailFromForm.toLowerCase().trim();
    
    console.log(`[API /api/demandes] Email utilisé: ${email} (connecté: ${authCookie === "1" && userEmailCookie ? "oui" : "non"})`);
    const phone = ((formData.get("phone") as string) || "").trim();
    const serviceType = ((formData.get("serviceType") as string) || "").trim();
    const serviceSubcategory = ((formData.get("serviceSubcategory") as string) || "").trim();
    const description = ((formData.get("description") as string) || "").trim();

    // Nouveaux champs pour multi-pays
    const countryService = ((formData.get("countryService") as string) || "CM").trim();
    const lieuCity = ((formData.get("lieuCity") as string) || "").trim();
    const lieuDetails = ((formData.get("lieuDetails") as string) || "").trim();

    // Rétrocompatibilité avec les anciens champs
    const cameroonCity = ((formData.get("cameroonCity") as string) || lieuCity).trim();
    const cameroonLocationDetails = ((formData.get("cameroonLocationDetails") as string) || lieuDetails).trim();
    const serviceDetail = ((formData.get("serviceDetail") as string) || serviceSubcategory).trim();
    const serviceDetailOther = ((formData.get("serviceDetailOther") as string) || "").trim();

    const urgence =
      ((formData.get("urgence") as string) || "").trim() || "normal";
    const budget = ((formData.get("budget") as string) || "").trim();

    // On récupère éventuellement un deviceId envoyé par le formulaire
    const deviceIdFromForm = formData.get("deviceId");
    const deviceId = deviceIdFromForm ? String(deviceIdFromForm).trim() : null;

    // Vérifications de base avec messages détaillés
    const missingFields: string[] = [];
    if (!fullName) missingFields.push("nom complet");
    if (!email) missingFields.push("email");
    if (!phone) missingFields.push("téléphone");
    if (!serviceType) missingFields.push("type de service");
    if (!description) missingFields.push("description");
    if (!lieuCity) missingFields.push("ville");

    if (missingFields.length > 0) {
      console.error(`[API /api/demandes] Champs manquants: ${missingFields.join(", ")}`);
      return NextResponse.json(
        { error: `Merci de remplir tous les champs obligatoires. Champs manquants: ${missingFields.join(", ")}.` },
        { status: 400 }
      );
    }

    // Validation de la longueur des champs
    if (fullName.length > 100) {
      return NextResponse.json(
        { error: "Le nom complet est trop long (maximum 100 caractères)." },
        { status: 400 }
      );
    }

    if (description.length > 5000) {
      return NextResponse.json(
        { error: "La description est trop longue (maximum 5000 caractères)." },
        { status: 400 }
      );
    }

    // Validation de l'email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide." },
        { status: 400 }
      );
    }

    // Validation du téléphone
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { 
          error: "Format de téléphone invalide. Veuillez entrer un numéro valide (ex: +237 6XX XXX XXX, 6XX XXX XXX, ou format international)." 
        },
        { status: 400 }
      );
    }

    // Validation de l'urgence
    const validUrgence = ["normal", "urgent", "tres-urgent"];
    if (!validUrgence.includes(urgence)) {
      return NextResponse.json(
        { error: "Niveau d'urgence invalide." },
        { status: 400 }
      );
    }

    // Lieu : on combine ville + détails si présents
    const lieuParts = [lieuCity || cameroonCity, lieuDetails || cameroonLocationDetails]
      .map((s) => s.trim())
      .filter(Boolean);
    const lieu = lieuParts.length > 0 ? lieuParts.join(" – ") : null;

    // Si le service principal OU le sous-service = "autre",
    // on remplit serviceAutre avec ce que la personne tape.
    const serviceAutre =
      serviceType === "autre" || serviceDetail === "autre"
        ? serviceDetailOther || null
        : null;

    // Créer la demande (avec fallback automatique JSON/DB)
    const created = await createDemande({
      deviceId,
      fullName,
      email: email.toLowerCase(), // Normaliser l'email
      phone,
      serviceType,
      serviceSubcategory: serviceSubcategory || undefined,
      country: countryService || "CM", // Par défaut Cameroun pour rétrocompatibilité
      serviceAutre,
      description,
      lieu,
      budget: budget || null,
      urgence,
    });

    // Envoyer une notification email à l'admin
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const { getAdminEmail } = await import("@/lib/auth");
      
      await sendNotificationEmail(
        "demande-created",
        { email: getAdminEmail() },
        {
          ref: created.ref,
          clientName: created.fullName,
          serviceType: created.serviceType,
          clientEmail: created.email,
        },
        "fr"
      );
    } catch (error) {
      console.error("Erreur envoi email notification admin:", error);
      // Ne pas bloquer la création de la demande si l'email échoue
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Demande enregistrée avec succès.",
        demande: created,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ERREUR /api/demandes (POST) :", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Détails de l'erreur:", errorMessage);
    return NextResponse.json(
      { error: `Erreur serveur lors de l'enregistrement de la demande: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// GET : liste des demandes (accessible uniquement aux admins)
export async function GET() {
  try {
    const { cookies } = await import("next/headers");
    const { getUserRoleAsync } = await import("@/lib/auth");
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    // Vérifier l'authentification et le rôle admin
    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const role = await getUserRoleAsync(userEmail);
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs." },
        { status: 403 }
      );
    }

    // Récupérer toutes les demandes actives (avec fallback automatique JSON/DB)
    const activeDemandes = await getAllDemandes();

    console.log(`[API /api/demandes GET] ${activeDemandes?.length || 0} demande(s) récupérée(s) pour admin`);

    return NextResponse.json(
      { demandes: activeDemandes ?? [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("ERREUR /api/demandes (GET) :", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des demandes." },
      { status: 500 }
    );
  }
}
