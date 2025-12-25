import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById, saveMissions } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import type { Message } from "@/lib/types";

// Fonction simple pour générer un ID unique
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET: Récupérer les messages d'une mission
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const missionUuid = resolvedParams.id; // UUID string (pas de parseInt)
    
    // Validation UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!missionUuid || typeof missionUuid !== "string" || !UUID_REGEX.test(missionUuid)) {
      return NextResponse.json(
        { error: "UUID invalide." },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionUuid);
    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier l'accès
    const userRole = await getUserRoleAsync(userEmail);
    const hasAccess =
      userRole === "admin" ||
      mission.clientEmail.toLowerCase() === userEmail.toLowerCase() ||
      (userRole === "prestataire" && mission.prestataireId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 403 }
      );
    }

    // Filtrer les messages selon le rôle de l'utilisateur pour respecter la confidentialité
    // Chaque relation est privée : client-admin, admin-prestataire
    const allMessages = mission.messages || [];
    let filteredMessages: typeof allMessages = [];

    if (userRole === "admin") {
      // L'admin voit tous les messages
      filteredMessages = allMessages;
    } else if (userRole === "client") {
      // Le client ne voit que les messages où il est impliqué (from="client" ou to="client")
      // ou où son email est dans fromEmail ou toEmail
      filteredMessages = allMessages.filter((msg: any) => {
        const isFromClient = msg.from === "client" || msg.fromEmail?.toLowerCase() === userEmail.toLowerCase();
        const isToClient = msg.to === "client" || msg.toEmail?.toLowerCase() === userEmail.toLowerCase();
        // Le client ne doit PAS voir les messages entre admin et prestataire
        const isAdminPrestataireOnly = (msg.from === "admin" && msg.to === "prestataire") || 
                                       (msg.from === "prestataire" && msg.to === "admin");
        return (isFromClient || isToClient) && !isAdminPrestataireOnly;
      });
    } else if (userRole === "prestataire") {
      // Le prestataire ne voit que les messages où il est impliqué (from="prestataire" ou to="prestataire")
      // ou où son email est dans fromEmail ou toEmail
      // Récupérer l'email du prestataire pour vérifier
      const { getPrestataireById } = await import("@/lib/dataAccess");
      const prestataire = mission.prestataireId ? await getPrestataireById(mission.prestataireId) : null;
      const prestataireEmail = prestataire?.email?.toLowerCase();
      
      filteredMessages = allMessages.filter((msg: any) => {
        const isFromPrestataire = msg.from === "prestataire" || 
                                  (prestataireEmail && msg.fromEmail?.toLowerCase() === prestataireEmail);
        const isToPrestataire = msg.to === "prestataire" || 
                               (prestataireEmail && msg.toEmail?.toLowerCase() === prestataireEmail);
        // Le prestataire ne doit PAS voir les messages entre admin et client
        const isAdminClientOnly = (msg.from === "admin" && msg.to === "client") || 
                                  (msg.from === "client" && msg.to === "admin");
        return (isFromPrestataire || isToPrestataire) && !isAdminClientOnly;
      });
    }

    return NextResponse.json(
      { messages: filteredMessages },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/missions/[id]/messages GET:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

// POST: Envoyer un message
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const missionUuid = resolvedParams.id; // UUID string (pas de parseInt)
    
    // Validation UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!missionUuid || typeof missionUuid !== "string" || !UUID_REGEX.test(missionUuid)) {
      return NextResponse.json(
        { error: "UUID invalide." },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionUuid);
    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier l'accès
    const userRole = await getUserRoleAsync(userEmail);
    const hasAccess =
      userRole === "admin" ||
      mission.clientEmail.toLowerCase() === userEmail.toLowerCase() ||
      (userRole === "prestataire" && mission.prestataireId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { to, toEmail, content, type } = body;

    if (!to || !content || !type) {
      return NextResponse.json(
        { error: "Destinataire, contenu et type requis." },
        { status: 400 }
      );
    }

    // Déterminer l'email du destinataire
    let recipientEmail = toEmail;
    const { isAdmin } = await import("@/lib/auth");
    const adminEmail = process.env.ICD_ADMIN_EMAIL || "contact.icd-relay@gmail.com";
    
    // Si l'expéditeur n'est pas admin, forcer l'envoi à l'admin
    if (!isAdmin(userEmail)) {
      // Client ou prestataire : toujours envoyer à l'admin
      recipientEmail = adminEmail;
    } else {
      // Admin : peut envoyer au client ou au prestataire
      if (!recipientEmail) {
        if (to === "client") {
          recipientEmail = mission.clientEmail;
        } else if (to === "prestataire" && mission.prestataireId) {
          // Récupérer l'email du prestataire
          const { getPrestataireById } = await import("@/lib/dataAccess");
          const prestataire = mission.prestataireId ? await getPrestataireById(mission.prestataireId) : null;
          recipientEmail = prestataire?.email || "";
        }
      }
    }

    // Créer le message
    const message: Message = {
      id: generateId(),
      missionId: missionUuid, // UUID string
      from: userRole as "client" | "prestataire" | "admin",
      fromEmail: userEmail,
      to: to as "client" | "prestataire" | "admin",
      toEmail: recipientEmail || mission.clientEmail,
      content: content.trim(),
      type: type as "chat" | "email",
      createdAt: new Date().toISOString(),
      lu: false,
    };

    // Sauvegarder le message dans la base de données via Prisma
    try {
      const { prisma } = await import("@/lib/db");
      const missionPrisma = await prisma.mission.findUnique({
        where: { id: missionUuid },
      });
      
      if (missionPrisma) {
        const currentMessages = (missionPrisma.messages as any) || [];
        const updatedMessages = [...currentMessages, message];
        
        await prisma.mission.update({
          where: { id: missionUuid },
          data: { messages: updatedMessages },
        });
      } else {
        throw new Error("Mission Prisma non trouvée");
      }
    } catch (error) {
      console.error("Erreur sauvegarde message:", error);
      // Fallback sur JSON si Prisma échoue
      if (!mission.messages) {
        mission.messages = [];
      }
      mission.messages.push(message);
      await saveMissions();
    }

    // Envoyer un email de notification au destinataire (pour chat ET email)
    // Si c'est l'admin qui écrit au prestataire, envoyer un email d'invitation à se connecter
    if (userRole === "admin" && to === "prestataire" && recipientEmail) {
      try {
        const { sendNotificationEmail } = await import("@/lib/emailService");
        const { getPrestataireById } = await import("@/lib/dataAccess");
        const prestataire = mission.prestataireId ? await getPrestataireById(mission.prestataireId) : null;
        
        if (prestataire) {
          const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
          const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
          const loginUrl = `${platformUrl}/prestataires/connexion`;
          
          await sendNotificationEmail(
            "admin-message",
            { 
              email: prestataire.email, 
              name: prestataire.nomEntreprise || prestataire.nomContact || prestataire.email 
            },
            {
              missionRef: mission.ref,
              missionTitre: mission.titre,
              messageContent: content.trim(),
              platformUrl: loginUrl,
            },
            "fr"
          );
        }
      } catch (error) {
        console.error("Erreur envoi email notification prestataire:", error);
        // Ne pas bloquer l'envoi du message si l'email échoue
      }
    }

    // Si c'est un email, envoyer l'email réellement
    if (type === "email") {
      try {
        const { sendEmail } = await import("@/lib/emailService");
        const { getDemandeById, getPrestataireById, getPrestataireByEmail } = await import("@/lib/dataAccess");
        
        // Créer un email personnalisé depuis le chat
        const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? "https" : "http";
        const platformUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`;
        
        // Déterminer le nom de l'expéditeur
        let senderName = userEmail;
        
        if (userRole === "admin") {
          senderName = "ICD Canada";
        } else if (userRole === "prestataire") {
          const prestataireSender = await getPrestataireByEmail(userEmail);
          senderName = prestataireSender?.nomEntreprise || prestataireSender?.nomContact || userEmail;
        } else {
          const demandeSender = await getDemandeById(mission.demandeId);
          senderName = demandeSender?.fullName || userEmail;
        }
        
        // Récupérer les infos du destinataire
        let recipientName: string | undefined = undefined;
        if (to === "client") {
          const demandeClient = await getDemandeById(mission.demandeId);
          recipientName = demandeClient?.fullName;
        } else if (to === "prestataire" && mission.prestataireId) {
          const prestataireRecipient = mission.prestataireId ? await getPrestataireById(mission.prestataireId) : null;
          recipientName = prestataireRecipient?.nomEntreprise || prestataireRecipient?.nomContact;
        }
        
        // Construire le lien selon le rôle du destinataire
        let missionUrl = `${platformUrl}/espace-client/mission/${mission.id}`;
        if (to === "prestataire") {
          missionUrl = `${platformUrl}/prestataires/espace/mission/${mission.id}`;
        } else if (to === "admin") {
          const demandeForAdmin = await getDemandeById(mission.demandeId);
          missionUrl = `${platformUrl}/admin/demandes/${demandeForAdmin?.id}`;
        }
        
        // Envoyer un email personnalisé
        const emailSubject = `Message concernant la mission ${mission.ref} - ICD Canada`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0A1B2A;">Nouveau message concernant votre mission</h2>
              <p>Vous avez reçu un message concernant la mission <strong>${mission.ref}</strong>.</p>
              <div style="background: #F9F9FB; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Expéditeur:</strong> ${senderName}</p>
                <p><strong>Mission:</strong> ${mission.ref} - ${mission.titre}</p>
              </div>
              <div style="background: #FFFFFF; padding: 15px; border-left: 4px solid #C8A55F; margin: 20px 0;">
                ${content.split('\n').map((line: string) => `<p style="margin: 5px 0;">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('')}
              </div>
              <p style="margin-top: 20px;">
                <a href="${missionUrl}" style="background: #C8A55F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir la mission</a>
              </p>
            </div>
          `;
        const emailText = `Message concernant la mission ${mission.ref}\n\nDe: ${senderName}\n\n${content}\n\nVoir la mission: ${missionUrl}`;
        
        await sendEmail(recipientEmail, emailSubject, emailHtml, emailText);
      } catch (error) {
        console.error("Erreur envoi email message:", error);
        // Ne pas bloquer l'envoi du message si l'email échoue
      }
    }

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur /api/missions/[id]/messages POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

