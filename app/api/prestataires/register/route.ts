import { NextResponse } from "next/server";
import { createPrestataire } from "@/lib/dataAccess";
import { type ServiceType } from "@/lib/prestatairesStore";
import bcrypt from "bcryptjs";

// Validation simple d'email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validation de téléphone
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  return /^\+?[0-9]{8,15}$/.test(cleaned);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nomEntreprise = (formData.get("nomEntreprise") as string)?.trim() || "";
    const nomContact = (formData.get("nomContact") as string)?.trim() || "";
    const email = (formData.get("email") as string)?.trim() || "";
    const phone = (formData.get("phone") as string)?.trim() || "";
    const adresse = (formData.get("adresse") as string)?.trim() || "";
    const ville = (formData.get("ville") as string)?.trim() || "";
    const specialitesRaw = formData.get("specialites") as string;
    const zonesInterventionRaw = formData.get("zonesIntervention") as string;
    const certificationsRaw = formData.get("certifications") as string;
    const anneeExperience = parseInt(formData.get("anneeExperience") as string) || 0;
    const tarifType = (formData.get("tarifType") as "fixe" | "pourcentage" | "horaire") || "fixe";
    // Plus de commission fixe - le système de commission dynamique sera utilisé lors de la génération du devis
    const commissionICD = 0; // DEPRECATED - Ne plus utiliser
    const description = (formData.get("description") as string)?.trim() || "";
    const countriesRaw = formData.get("countries") as string;
    const typePrestataire = (formData.get("typePrestataire") as "entreprise" | "freelance") || "freelance";

    // Parsing des pays
    const countries = countriesRaw
      ? (JSON.parse(countriesRaw) as string[])
      : [];

    // Validations
    if (!nomEntreprise || !nomContact || !email || !phone || !ville) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants." },
        { status: 400 }
      );
    }

    if (countries.length === 0) {
      return NextResponse.json(
        { error: "Veuillez sélectionner au moins un pays d'opération." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide." },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Format de téléphone invalide." },
        { status: 400 }
      );
    }

    // Parsing des tableaux
    const specialites = specialitesRaw
      ? (JSON.parse(specialitesRaw) as ServiceType[])
      : [];
    // zonesIntervention peut être un JSON array ou une chaîne séparée par des virgules (rétrocompatibilité)
    let zonesIntervention: string[] = [];
    if (zonesInterventionRaw) {
      try {
        // Essayer de parser comme JSON d'abord
        zonesIntervention = JSON.parse(zonesInterventionRaw) as string[];
      } catch {
        // Sinon, traiter comme une chaîne séparée par des virgules
        zonesIntervention = zonesInterventionRaw.split(",").map((z) => z.trim()).filter(Boolean);
      }
    }
    const certifications = certificationsRaw
      ? certificationsRaw.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

    if (specialites.length === 0) {
      return NextResponse.json(
        { error: "Veuillez sélectionner au moins une spécialité." },
        { status: 400 }
      );
    }

    // Ajouter le hash du mot de passe
    const password = (formData.get("password") as string) || "";
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Récupérer les documents (IDs des fichiers uploadés)
    const documentsRaw = formData.get("documents") as string;
    const documents = documentsRaw ? JSON.parse(documentsRaw) : [];

    // Création du prestataire
    console.log(`[API Register] 🚀 Création prestataire avec email: ${email.toLowerCase()}, type: ${typePrestataire}`);
    const prestataire = await createPrestataire({
      nomEntreprise,
      nomContact,
      email: email.toLowerCase(),
      phone,
      adresse,
      ville,
      specialites,
      zonesIntervention,
      countries, // Pays d'opération sélectionnés
      certifications,
      anneeExperience,
      tarifType,
      commissionICD,
      description,
      capaciteMaxMissions: 5, // Par défaut
      passwordHash, // Ajouter ce champ
      typePrestataire, // Type de prestataire (entreprise | freelance)
      documents: documents.map((doc: any) => ({
        id: doc.id,
        type: doc.type,
        name: doc.name,
        url: doc.url,
        uploadedAt: new Date().toISOString(),
      })),
    });
    
    console.log(`[API Register] ✅ Prestataire créé:`, {
      id: prestataire.id,
      ref: prestataire.ref,
      email: prestataire.email,
      statut: prestataire.statut,
      typePrestataire: prestataire.typePrestataire,
      createdAt: prestataire.createdAt,
    });

    // Créer une notification admin pour la nouvelle inscription
    try {
      const { USE_DB } = await import("@/lib/dbFlag");
      
      if (USE_DB) {
        // Notification via Prisma
        const { createNotification } = await import("@/repositories/notificationsRepo");
        await createNotification({
          type: "other",
          title: "Nouvelle inscription prestataire",
          message: `Un nouveau prestataire s'est inscrit : ${prestataire.nomEntreprise} (${prestataire.ref}). Type : ${typePrestataire === "entreprise" ? "Entreprise" : "Freelance"}. Ville : ${ville}.`,
          prestataireName: prestataire.nomEntreprise,
          createdAt: new Date().toISOString(),
          read: false,
        });
        console.log(`✅ Notification admin créée dans la base de données pour ${prestataire.ref}`);
      } else {
        // Notification via JSON store
        const { addAdminNotification } = await import("@/lib/adminNotificationsStore");
        addAdminNotification({
          type: "other",
          title: "Nouvelle inscription prestataire",
          message: `Un nouveau prestataire s'est inscrit : ${prestataire.nomEntreprise} (${prestataire.ref}). Type : ${typePrestataire === "entreprise" ? "Entreprise" : "Freelance"}. Ville : ${ville}.`,
          prestataireName: prestataire.nomEntreprise,
        });
        console.log(`✅ Notification admin créée dans le store JSON pour ${prestataire.ref}`);
      }
    } catch (error: any) {
      console.error("Erreur création notification admin:", error);
      console.error("Détails:", error?.message, error?.code);
      // Ne pas bloquer l'inscription si la notification échoue
      // Si c'est une erreur de table manquante, c'est normal en production avant migration
      if (error?.code === "P2021") {
        console.warn("⚠️ Table admin_notifications n'existe pas encore. La migration sera appliquée au prochain déploiement.");
      }
    }

    // Envoyer email de confirmation au prestataire (dossier en attente)
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
      
      await sendNotificationEmail(
        "provider-registered", // Template pour inscription en attente (pas de validation)
        { email: prestataire.email, name: prestataire.nomContact },
        {
          prestataireRef: prestataire.ref,
          prestataireName: prestataire.nomEntreprise,
          platformUrl,
        },
        "fr"
      );
      console.log(`✅ Email de confirmation d'inscription envoyé à ${prestataire.email}`);
    } catch (error) {
      console.error("Erreur envoi email confirmation prestataire:", error);
      // Ne pas bloquer l'inscription si l'email échoue
    }

    // Envoyer notification email à l'admin
    try {
      const { sendNotificationEmail } = await import("@/lib/emailService");
      const { getAdminEmail } = await import("@/lib/auth");
      
      await sendNotificationEmail(
        "demande-created", // Réutiliser le template de demande (sera adapté)
        { email: getAdminEmail() },
        {
          ref: prestataire.ref,
          clientName: prestataire.nomEntreprise,
          serviceType: `Inscription prestataire (${typePrestataire})`,
          clientEmail: prestataire.email,
        },
        "fr"
      );
      console.log(`✅ Email de notification envoyé à l'admin pour ${prestataire.ref}`);
    } catch (error) {
      console.error("Erreur envoi email notification admin:", error);
      // Ne pas bloquer l'inscription si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        message: "Votre demande d'inscription a été enregistrée. Elle sera examinée par l'équipe LeBoy.",
        prestataire: {
          ref: prestataire.ref,
          nomEntreprise: prestataire.nomEntreprise,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'inscription du prestataire:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de votre demande." },
      { status: 500 }
    );
  }
}
