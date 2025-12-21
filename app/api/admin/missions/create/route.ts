import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllDemandes, createMission, missionExistsForDemandeAndPrestataire, getPrestataireById, saveMissions, updateMissionInternalState } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import type { SharedFile } from "@/lib/types";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  // Générer un traceId pour le suivi des logs
  const traceId = randomUUID().substring(0, 8);
  
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
    const { demandeId, prestataireIds, prestataireId, sharedFiles, requestId } = body;

    // ============================================
    // VALIDATION STRICTE DU BODY
    // ============================================
    console.log(`[${traceId}] Validation requête création mission`);
    
    if (!demandeId) {
      console.error(`[${traceId}] ❌ demandeId manquant`);
      return NextResponse.json(
        { error: "Demande ID est requis." },
        { status: 400 }
      );
    }

    // Support pour plusieurs prestataires ou un seul (rétrocompatibilité)
    let prestataireIdsArray: number[] = [];
    if (prestataireIds && Array.isArray(prestataireIds)) {
      prestataireIdsArray = prestataireIds
        .map((id: any) => typeof id === 'number' ? id : parseInt(String(id)))
        .filter((id: number) => !isNaN(id) && id > 0);
    } else if (prestataireId) {
      const id = typeof prestataireId === 'number' ? prestataireId : parseInt(String(prestataireId));
      if (!isNaN(id) && id > 0) {
        prestataireIdsArray = [id];
      }
    }

    if (prestataireIdsArray.length === 0) {
      console.error(`[${traceId}] ❌ Aucun prestataireId valide`);
      return NextResponse.json(
        { error: "Au moins un Prestataire ID valide est requis." },
        { status: 400 }
      );
    }

    // Validation sharedFiles (safe access)
    const safeSharedFiles: SharedFile[] = Array.isArray(sharedFiles) 
      ? sharedFiles.filter((file: any) => {
          // Validation stricte de chaque fichier
          return file && 
                 typeof file === 'object' &&
                 (file.fileId || file.fileName) &&
                 typeof (file.fileName || '') === 'string';
        }).map((file: any) => ({
          fileId: file.fileId || null,
          fileName: file.fileName || 'unknown',
          fileType: file.fileType || 'application/octet-stream',
          fileSize: typeof file.fileSize === 'number' ? file.fileSize : 0,
          sharedAt: file.sharedAt || new Date().toISOString(),
          sharedBy: file.sharedBy || userEmail || 'admin',
        }))
      : [];

    const demandeIdNum = typeof demandeId === 'number' ? demandeId : parseInt(String(demandeId));
    if (isNaN(demandeIdNum) || demandeIdNum <= 0) {
      console.error(`[${traceId}] ❌ demandeId invalide: ${demandeId}`);
      return NextResponse.json(
        { error: "Demande ID invalide." },
        { status: 400 }
      );
    }

    console.log(`[${traceId}] ✅ Validation OK - demandeId: ${demandeIdNum}, prestataires: ${prestataireIdsArray.length}, fichiers: ${safeSharedFiles.length}`);

    // ============================================
    // RÉCUPÉRATION DE LA DEMANDE
    // ============================================
    const allDemandes = await getAllDemandes();
    const demande = allDemandes.find((d) => d.id === demandeIdNum);
    
    if (!demande) {
      console.error(`[${traceId}] ❌ Demande ${demandeIdNum} non trouvée`);
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // Validation des champs essentiels de la demande
    if (!demande.serviceType || !demande.description) {
      console.error(`[${traceId}] ❌ Demande ${demandeIdNum} incomplète (serviceType ou description manquant)`);
      return NextResponse.json(
        { error: "La demande est incomplète (serviceType ou description manquant)." },
        { status: 400 }
      );
    }

    // Date d'assignation et date limite (24h après)
    const dateAssignation = new Date();
    const dateLimiteProposition = new Date(dateAssignation);
    dateLimiteProposition.setHours(dateLimiteProposition.getHours() + 24);

    // ============================================
    // CRÉATION DES MISSIONS (SANS EMAIL)
    // ============================================
    const missionsCreees: Array<{ mission: any, prestataireId: number }> = [];
    const errors: string[] = [];
    const emailErrors: Array<{ prestataireId: number; error: string }> = [];

    for (const prestataireIdNum of prestataireIdsArray) {
      try {
        // Vérifier si une mission existe déjà pour cette demande et ce prestataire
        if (await missionExistsForDemandeAndPrestataire(demandeIdNum, prestataireIdNum)) {
          const errorMsg = `Une mission existe déjà pour le prestataire ID ${prestataireIdNum}.`;
          console.warn(`[${traceId}] ⚠️ ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        // Récupérer le prestataire pour obtenir sa référence
        const prestataire = await getPrestataireById(prestataireIdNum);
        if (!prestataire) {
          const errorMsg = `Prestataire ID ${prestataireIdNum} non trouvé.`;
          console.error(`[${traceId}] ❌ ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        // Validation des champs essentiels du prestataire
        if (!prestataire.email) {
          const errorMsg = `Prestataire ID ${prestataireIdNum} n'a pas d'email.`;
          console.error(`[${traceId}] ❌ ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        // Créer la mission sans tarif (le tarif sera défini par le partenaire lors de son estimation)
        const mission = await createMission({
          demandeId: demandeIdNum,
          clientEmail: demande.email || 'unknown@example.com',
          prestataireId: prestataireIdNum,
          prestataireRef: prestataire.ref || null,
          titre: `${demande.serviceType} - ${demande.lieu || "Cameroun"}`,
          description: demande.description || '',
          serviceType: demande.serviceType,
          lieu: demande.lieu || undefined,
          urgence: demande.urgence || 'normale',
          budget: demande.budget ? parseFloat(String(demande.budget)) : undefined,
          tarifPrestataire: 0, // Sera défini lors de l'estimation du partenaire
          commissionICD: 0, // Sera défini lors de la génération du devis
          tarifTotal: 0, // Sera calculé lors de la génération du devis
          dateAssignation: dateAssignation.toISOString(),
          dateLimiteProposition: dateLimiteProposition.toISOString(),
        });

        // Ajouter les fichiers partagés si fournis (safe access)
        if (safeSharedFiles.length > 0) {
          mission.sharedFiles = safeSharedFiles.map((file) => ({
            fileId: file.fileId,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            sharedAt: file.sharedAt,
            sharedBy: file.sharedBy,
          }));
        }

        // Set initial internal state: ASSIGNED_TO_PROVIDER (mandat assigné, en attente d'estimation)
        await updateMissionInternalState(mission.id, "ASSIGNED_TO_PROVIDER", userEmail || "admin@icd.ca");
        
        missionsCreees.push({ mission, prestataireId: prestataireIdNum });
        console.log(`[${traceId}] ✅ Mission créée: ${mission.ref} pour prestataire ${prestataireIdNum}`);
        
      } catch (error: any) {
        const errorMsg = `Erreur lors de la création de la mission pour le prestataire ID ${prestataireIdNum}: ${error?.message || String(error)}`;
        console.error(`[${traceId}] ❌ ${errorMsg}`, error);
        errors.push(errorMsg);
      }
    }

    // Sauvegarder les modifications et attendre la sauvegarde
    await saveMissions();
    
    // Attendre un peu pour s'assurer que la DB est à jour (pour Prisma)
    await new Promise(resolve => setTimeout(resolve, 100));

    // ============================================
    // RÉPONSE IMMÉDIATE (AVANT EMAILS)
    // ============================================
    if (missionsCreees.length === 0) {
      console.error(`[${traceId}] ❌ Aucune mission créée`);
      return NextResponse.json(
        { 
          error: "Aucune mission n'a pu être créée.",
          errors: errors,
        },
        { status: 400 }
      );
    }

    // Extraire uniquement les missions pour la réponse (sans les prestataireIds)
    const missionsOnly = missionsCreees.map(item => item.mission);

    // Réponse immédiate avec succès
    const response = NextResponse.json(
      {
        success: true,
        missions: missionsOnly,
        count: missionsCreees.length,
        errors: errors.length > 0 ? errors : undefined,
        traceId, // Pour le debugging
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

    // ============================================
    // ENVOI DES EMAILS (ASYNCHRONE, NE BLOQUE PAS)
    // ============================================
    // IMPORTANT: Les emails sont envoyés APRÈS la réponse pour ne jamais bloquer la création
    // Utiliser setImmediate ou Promise.resolve().then() pour exécuter en arrière-plan
    Promise.resolve().then(async () => {
      console.log(`[${traceId}] 📧 Début envoi emails pour ${missionsCreees.length} mission(s)`);
      
      for (const { mission, prestataireId } of missionsCreees) {
        try {
          // Vérifier si la mission a déjà été notifiée (éviter double-envoi)
          const { getMissionById } = await import("@/lib/dataAccess");
          const missionCheck = await getMissionById(mission.id);
          
          if (missionCheck?.notifiedProviderAt) {
            console.log(`[${traceId}] ⚠️ Mission ${mission.ref} déjà notifiée le ${missionCheck.notifiedProviderAt}, skip email`);
            continue;
          }
          
          const prestataire = await getPrestataireById(prestataireId);
          if (!prestataire || !prestataire.email) {
            console.warn(`[${traceId}] ⚠️ Prestataire ${prestataireId} non trouvé ou sans email pour l'envoi d'email`);
            emailErrors.push({ prestataireId, error: "Prestataire non trouvé ou sans email" });
            continue;
          }
          
          const { sendNotificationEmail } = await import("@/lib/emailService");
          const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
          const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
          
          const emailSent = await sendNotificationEmail(
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

          if (emailSent) {
            // Marquer la mission comme notifiée
            const { updateMissionInternalState } = await import("@/lib/dataAccess");
            // On pourrait ajouter un champ notifiedProviderAt dans la mission, mais pour l'instant on log juste
            console.log(`[${traceId}] ✅ Email envoyé pour prestataire ${prestataireId}, mission ${mission.ref}`);
          } else {
            emailErrors.push({ prestataireId, error: "Échec envoi email (voir logs)" });
            console.warn(`[${traceId}] ⚠️ Échec envoi email pour prestataire ${prestataireId}`);
          }
        } catch (error: any) {
          const errorMsg = error?.message || String(error);
          emailErrors.push({ prestataireId, error: errorMsg });
          console.error(`[${traceId}] ❌ Erreur envoi email prestataire ${prestataireId}:`, error);
          // Ne pas bloquer - l'email est optionnel
        }
      }
      
      if (emailErrors.length > 0) {
        console.warn(`[${traceId}] ⚠️ ${emailErrors.length} email(s) non envoyé(s) sur ${missionsCreees.length}`);
      } else {
        console.log(`[${traceId}] ✅ Tous les emails envoyés avec succès`);
      }
    }).catch((error) => {
      // Catch global pour éviter que les erreurs d'email ne remontent
      console.error(`[${traceId}] ❌ Erreur globale dans la queue d'emails:`, error);
    });

    return response;

  } catch (error: any) {
    console.error(`[${traceId}] ❌ Erreur serveur /api/admin/missions/create:`, error);
    console.error(`[${traceId}] Stack:`, error?.stack);
    
    return NextResponse.json(
      { 
        error: "Erreur serveur.",
        traceId,
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
