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

    // Support pour plusieurs prestataires ou un seul (UUID strings maintenant)
    let prestataireIdsArray: string[] = [];
    if (prestataireIds && Array.isArray(prestataireIds)) {
      prestataireIdsArray = prestataireIds
        .map((id: any) => typeof id === 'string' ? id : String(id))
        .filter((id: string) => id && id.length > 0);
    } else if (prestataireId) {
      const id = typeof prestataireId === 'string' ? prestataireId : String(prestataireId);
      if (id && id.length > 0) {
        prestataireIdsArray = [id];
      }
    }

    if (prestataireIdsArray.length === 0) {
      console.error(`[${traceId}] ❌ Aucun prestataireId valide`);
      return NextResponse.json(
        { error: "Au moins un Prestataire ID valide (UUID) est requis." },
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

    // demandeId est maintenant un UUID string
    const demandeIdUUID = typeof demandeId === 'string' ? demandeId : String(demandeId);
    
    // Validation UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!demandeIdUUID || !UUID_REGEX.test(demandeIdUUID)) {
      console.error(`[${traceId}] ❌ demandeId invalide (UUID attendu): ${demandeId}`);
      return NextResponse.json(
        { error: "Demande ID invalide (UUID attendu)." },
        { status: 400 }
      );
    }

    console.log(`[${traceId}] ✅ Validation OK - demandeId UUID: ${demandeIdUUID}, prestataires: ${prestataireIdsArray.length}, fichiers: ${safeSharedFiles.length}`);

    // ============================================
    // RÉCUPÉRATION DE LA DEMANDE VIA PRISMA DIRECTEMENT
    // ============================================
    console.log(`[${traceId}] 🔍 Recherche demande avec UUID: ${demandeIdUUID}`);
    const { prisma } = await import("@/lib/db");
    if (!prisma) {
      console.error(`[${traceId}] ❌ Prisma non disponible`);
      return NextResponse.json(
        { error: "Erreur serveur (DB non disponible)." },
        { status: 500 }
      );
    }
    
    const demandePrisma = await prisma.demande.findUnique({
      where: { id: demandeIdUUID },
    });
    
    if (!demandePrisma) {
      console.error(`[${traceId}] ❌ Demande UUID ${demandeIdUUID} non trouvée dans Prisma`);
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }
    
    console.log(`[${traceId}] ✅ Demande trouvée: UUID=${demandePrisma.id}, ref=${demandePrisma.ref}`);
    
    // Convertir Prisma vers JSON pour compatibilité avec le reste du code
    const { getDemandeById } = await import("@/lib/dataAccess");
    const demande = await getDemandeById(demandeIdUUID);
    
    if (!demande) {
      // Ce cas ne devrait jamais arriver car on vient de trouver la demande
      console.error(`[${traceId}] ❌ Erreur lors de la conversion de la demande`);
      return NextResponse.json(
        { error: "Erreur serveur." },
        { status: 500 }
      );
    }

    // Validation des champs essentiels de la demande
    if (!demande.serviceType || !demande.description) {
      console.error(`[${traceId}] ❌ Demande UUID ${demandeIdUUID} incomplète (serviceType ou description manquant)`);
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
    const missionsCreees: Array<{ mission: any, prestataireId: string }> = [];
    const errors: string[] = [];
    const emailErrors: Array<{ prestataireId: string; error: string }> = [];

    for (const prestataireIdUUID of prestataireIdsArray) {
      try {
        // ============================================
        // DIAGNOSTIC 1: LOGS DÉTAILLÉS AVANT ASSIGNATION
        // ============================================
        console.log(`[${traceId}] ========================================`);
        console.log(`[${traceId}] 🔍 DIAGNOSTIC ASSIGNATION ADMIN`);
        console.log(`[${traceId}] ========================================`);
        console.log(`[${traceId}] 📋 demandeId UUID: ${demandeIdUUID}`);
        console.log(`[${traceId}] 👤 prestataireId UUID sélectionné: ${prestataireIdUUID}`);
        console.log(`[${traceId}] 📧 Email admin: ${userEmail}`);
        
        // Vérifier si une mission existe déjà pour cette demande et ce prestataire
        const missionExists = await missionExistsForDemandeAndPrestataire(demandeIdUUID, prestataireIdUUID);
        console.log(`[${traceId}] 🔍 Mission existe déjà? ${missionExists ? "OUI ⚠️" : "NON ✅"}`);
        
        if (missionExists) {
          const errorMsg = `Une mission existe déjà pour le prestataire UUID ${prestataireIdUUID}.`;
          console.warn(`[${traceId}] ⚠️ ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        // Récupérer le prestataire pour obtenir sa référence
        const prestataire = await getPrestataireById(prestataireIdUUID);
        if (!prestataire) {
          const errorMsg = `Prestataire UUID ${prestataireIdUUID} non trouvé.`;
          console.error(`[${traceId}] ❌ ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        console.log(`[${traceId}] ✅ Prestataire trouvé: ${prestataire.email} (ref: ${prestataire.ref})`);

        // Validation des champs essentiels du prestataire
        if (!prestataire.email) {
          const errorMsg = `Prestataire UUID ${prestataireIdUUID} n'a pas d'email.`;
          console.error(`[${traceId}] ❌ ${errorMsg}`);
          errors.push(errorMsg);
          continue;
        }

        // ============================================
        // ACTION DB: CRÉER MISSION
        // ============================================
        console.log(`[${traceId}] 📝 Action DB: CREATE Mission`);
        console.log(`[${traceId}]   - demandeId UUID: ${demandeIdUUID} (type: ${typeof demandeIdUUID})`);
        console.log(`[${traceId}]   - prestataireId UUID: ${prestataireIdUUID} (type: ${typeof prestataireIdUUID})`);
        console.log(`[${traceId}]   - dateAssignation: ${dateAssignation.toISOString()}`);
        console.log(`[${traceId}]   - dateLimiteProposition: ${dateLimiteProposition.toISOString()}`);

        // Créer la mission sans tarif (le tarif sera défini par le partenaire lors de son estimation)
        const mission = await createMission({
          demandeId: demandeIdUUID,
          clientEmail: demande.email || 'unknown@example.com',
          prestataireId: prestataireIdUUID,
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

        // ============================================
        // DIAGNOSTIC 2: RÉSULTAT DB RENVOYÉ
        // ============================================
        console.log(`[${traceId}] ✅ Mission créée dans DB:`);
        console.log(`[${traceId}]   - id: ${mission.id} (type: ${typeof mission.id})`);
        console.log(`[${traceId}]   - ref: ${mission.ref}`);
        console.log(`[${traceId}]   - demandeId: ${mission.demandeId} (type: ${typeof mission.demandeId})`);
        console.log(`[${traceId}]   - prestataireId: ${mission.prestataireId} (type: ${typeof mission.prestataireId})`);
        console.log(`[${traceId}]   - internalState: ${mission.internalState}`);
        console.log(`[${traceId}]   - status: ${mission.status}`);
        console.log(`[${traceId}]   - deleted: ${mission.deleted}`);
        console.log(`[${traceId}]   - archived: ${mission.archived}`);
        
        // Vérifier cohérence des UUIDs
        if (mission.demandeId !== demandeIdUUID) {
          console.error(`[${traceId}] ❌ ERREUR: demandeId mismatch!`);
          console.error(`[${traceId}]   Attendu: ${demandeIdUUID} (type: ${typeof demandeIdUUID})`);
          console.error(`[${traceId}]   Reçu: ${mission.demandeId} (type: ${typeof mission.demandeId})`);
        } else {
          console.log(`[${traceId}] ✅ demandeId cohérent: ${mission.demandeId}`);
        }
        
        if (mission.prestataireId !== prestataireIdUUID) {
          console.error(`[${traceId}] ❌ ERREUR: prestataireId mismatch!`);
          console.error(`[${traceId}]   Attendu: ${prestataireIdUUID} (type: ${typeof prestataireIdUUID})`);
          console.error(`[${traceId}]   Reçu: ${mission.prestataireId} (type: ${typeof mission.prestataireId})`);
        } else {
          console.log(`[${traceId}] ✅ prestataireId cohérent: ${mission.prestataireId}`);
        }

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
        console.log(`[${traceId}] 📝 Action DB: UPDATE Mission internalState → ASSIGNED_TO_PROVIDER`);
        const dbMissionId = (mission as any).dbId;
        if (!dbMissionId) {
          console.error(`[${traceId}] ❌ Mission dbId (UUID) manquant après création`);
        } else {
          await updateMissionInternalState(dbMissionId, "ASSIGNED_TO_PROVIDER", userEmail || "admin@icd.ca");

          // (optionnel) recharger via repo Prisma plutôt que getMissionById numérique
          const { getMissionById: getMissionByIdDB } = await import("@/repositories/missionsRepo");
          const missionAfterUpdate = await getMissionByIdDB(dbMissionId);

          console.log(`[${traceId}] ✅ Mission après update:`);
          console.log(`[${traceId}]   - internalState: ${missionAfterUpdate?.internalState}`);
          console.log(`[${traceId}]   - status: ${missionAfterUpdate?.status}`);
        }
        
        missionsCreees.push({ mission, prestataireId: prestataireIdUUID });
        console.log(`[${traceId}] ✅ Mission créée et assignée: ${mission.ref} pour prestataire UUID ${prestataireIdUUID}`);
        console.log(`[${traceId}] ========================================`);
        
      } catch (error: any) {
        const errorMsg = `Erreur lors de la création de la mission pour le prestataire UUID ${prestataireIdUUID}: ${error?.message || String(error)}`;
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
          const dbMissionId = (mission as any).dbId;
          if (!dbMissionId) continue;
          
          const { getMissionById: getMissionByIdDB } = await import("@/repositories/missionsRepo");
          const missionCheck = await getMissionByIdDB(dbMissionId);
          
          // Vérifier si la mission a déjà été notifiée (notifiedProviderAt existe dans Prisma mais pas dans le type TS)
          const notifiedAt = (missionCheck as any)?.notifiedProviderAt;
          if (notifiedAt) {
            console.log(`[${traceId}] ⚠️ Mission ${mission.ref} déjà notifiée le ${notifiedAt}, skip email`);
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
            // Marquer la mission comme notifiée en DB
            try {
              const { updateMission } = await import("@/repositories/missionsRepo");
              await updateMission(dbMissionId, {
                notifiedProviderAt: new Date(),
              } as any);
              console.log(`[${traceId}] ✅ Email envoyé et mission marquée comme notifiée pour prestataire ${prestataireId}, mission ${mission.ref}`);
            } catch (updateError: any) {
              console.error(`[${traceId}] ⚠️ Échec mise à jour notifiedProviderAt pour mission ${dbMissionId}:`, updateError);
              // Ne pas bloquer - l'email est déjà envoyé
            }
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
