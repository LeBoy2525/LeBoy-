import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllDemandes, createMission, missionExistsForDemandeAndPrestataire, getPrestataireById, saveMissions, updateMissionInternalState } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import type { SharedFile } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { demandeId, prestataireIds, prestataireId, sharedFiles } = body; // Support pour prestataireIds (array) et prestataireId (single, rétrocompatibilité)

    // Validation des paramètres requis
    if (!demandeId) {
      return NextResponse.json(
        { error: "Demande ID est requis." },
        { status: 400 }
      );
    }

    // Support pour plusieurs prestataires ou un seul (rétrocompatibilité)
    let prestataireIdsArray: number[] = [];
    if (prestataireIds && Array.isArray(prestataireIds)) {
      prestataireIdsArray = prestataireIds.map((id: any) => 
        typeof id === 'number' ? id : parseInt(String(id))
      ).filter((id: number) => !isNaN(id));
    } else if (prestataireId) {
      // Rétrocompatibilité : si prestataireId est fourni, le convertir en array
      const id = typeof prestataireId === 'number' ? prestataireId : parseInt(String(prestataireId));
      if (!isNaN(id)) {
        prestataireIdsArray = [id];
      }
    }

    if (prestataireIdsArray.length === 0) {
      return NextResponse.json(
        { error: "Au moins un Prestataire ID est requis." },
        { status: 400 }
      );
    }

    const demandeIdNum = typeof demandeId === 'number' ? demandeId : parseInt(String(demandeId));

    const allDemandes = await getAllDemandes();
    const demande = allDemandes.find((d) => d.id === demandeIdNum);
    if (!demande) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // Date d'assignation et date limite (24h après)
    const dateAssignation = new Date();
    const dateLimiteProposition = new Date(dateAssignation);
    dateLimiteProposition.setHours(dateLimiteProposition.getHours() + 24);

    // Créer une mission pour chaque prestataire
    const missionsCreees = [];
    const errors = [];

    for (const prestataireIdNum of prestataireIdsArray) {
      try {
        // Vérifier si une mission existe déjà pour cette demande et ce prestataire
        if (await missionExistsForDemandeAndPrestataire(demandeIdNum, prestataireIdNum)) {
          errors.push(`Une mission existe déjà pour le prestataire ID ${prestataireIdNum}.`);
          continue;
        }

        // Récupérer le prestataire pour obtenir sa référence
        const prestataire = await getPrestataireById(prestataireIdNum);
        if (!prestataire) {
          errors.push(`Prestataire ID ${prestataireIdNum} non trouvé.`);
          continue;
        }

        // Créer la mission sans tarif (le tarif sera défini par le partenaire lors de son estimation)
        const mission = await createMission({
          demandeId: demandeIdNum,
          clientEmail: demande.email,
          prestataireId: prestataireIdNum,
          prestataireRef: prestataire.ref,
          titre: `${demande.serviceType} - ${demande.lieu || "Cameroun"}`,
          description: demande.description,
          serviceType: demande.serviceType,
          lieu: demande.lieu || undefined,
          urgence: demande.urgence,
          budget: demande.budget ? parseFloat(demande.budget) : undefined,
          tarifPrestataire: 0, // Sera défini lors de l'estimation du partenaire
          commissionICD: 0, // Sera défini lors de la génération du devis
          tarifTotal: 0, // Sera calculé lors de la génération du devis
          dateAssignation: dateAssignation.toISOString(),
          dateLimiteProposition: dateLimiteProposition.toISOString(),
        });

        // Ajouter les fichiers partagés si fournis
        if (sharedFiles && Array.isArray(sharedFiles) && sharedFiles.length > 0) {
          mission.sharedFiles = sharedFiles.map((file: any) => ({
            fileId: file.fileId,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            sharedAt: new Date().toISOString(),
            sharedBy: userEmail,
          }));
        }

        // Set initial internal state: ASSIGNED_TO_PROVIDER (mandat assigné, en attente d'estimation)
        await updateMissionInternalState(mission.id, "ASSIGNED_TO_PROVIDER", userEmail || "admin@icd.ca");
        
        missionsCreees.push(mission);
      } catch (error) {
        console.error(`Erreur création mission pour prestataire ${prestataireIdNum}:`, error);
        errors.push(`Erreur lors de la création de la mission pour le prestataire ID ${prestataireIdNum}.`);
      }
    }

    // Sauvegarder les modifications et attendre la sauvegarde
    await saveMissions();
    
    // Attendre un peu pour s'assurer que la DB est à jour (pour Prisma)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Envoyer les emails avec délai pour éviter rate limit Resend (2 req/s max)
    // Espacer les envois de 600ms entre chaque email (plus sûr que 500ms)
    // Stocker les IDs des prestataires avec leurs missions pour l'envoi d'emails
    const missionsWithPrestataireIds: Array<{ mission: typeof missionsCreees[0], prestataireId: number }> = [];
    for (let i = 0; i < missionsCreees.length; i++) {
      const mission = missionsCreees[i];
      // Trouver l'index dans prestataireIdsArray qui correspond à cette mission
      // On doit trouver le prestataireId qui correspond à cette mission
      const prestataireIdNum = prestataireIdsArray.find((id, idx) => {
        // Vérifier si cette mission correspond à ce prestataire
        // En comparant avec les missions créées précédemment
        return idx < missionsCreees.length && missionsCreees[idx] === mission;
      }) || prestataireIdsArray[i];
      
      if (prestataireIdNum) {
        missionsWithPrestataireIds.push({ mission, prestataireId: prestataireIdNum });
      }
    }
    
    // Envoyer les emails séquentiellement avec délai
    for (let i = 0; i < missionsWithPrestataireIds.length; i++) {
      const { mission, prestataireId } = missionsWithPrestataireIds[i];
      
      // Attendre 600ms avant chaque envoi (sauf le premier) pour respecter la limite de 2 req/s
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      try {
        const prestataire = await getPrestataireById(prestataireId);
        if (!prestataire) {
          console.warn(`Prestataire ${prestataireId} non trouvé pour l'envoi d'email`);
          continue;
        }
        
        const { sendNotificationEmail } = await import("@/lib/emailService");
        const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
        const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
        
        await sendNotificationEmail(
          "mission-assigned",
          { email: prestataire.email, name: prestataire.nomEntreprise || prestataire.nomContact },
          {
            missionRef: mission.ref,
            serviceType: mission.serviceType,
            lieu: mission.lieu || "Non spécifié",
            platformUrl,
            missionId: mission.id,
            dateLimite: dateLimiteProposition.toISOString(),
          },
          "fr"
        );
      } catch (error) {
        console.error(`Erreur envoi email notification prestataire ${prestataireId}:`, error);
        // Ne pas bloquer si l'email échoue
      }
    }

    if (missionsCreees.length === 0) {
      return NextResponse.json(
        { 
          error: "Aucune mission n'a pu être créée.",
          errors: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        missions: missionsCreees,
        count: missionsCreees.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { 
        status: 201,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Erreur /api/admin/missions/create:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
