import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById } from "@/lib/dataAccess";
import { getDemandeById } from "@/lib/dataAccess";
import { getPrestataireById } from "@/lib/dataAccess";
import { getFileById, getFileBuffer } from "@/lib/filesStore";
import { getUserRoleAsync } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const missionId = parseInt(resolvedParams.id);
    if (isNaN(missionId)) {
      return NextResponse.json(
        { error: "ID invalide." },
        { status: 400 }
      );
    }

    const mission = await getMissionById(missionId);
    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier que la mission est clôturée
    if (mission.internalState !== "COMPLETED") {
      return NextResponse.json(
        { error: "Le rapport n'est disponible que pour les missions clôturées." },
        { status: 400 }
      );
    }

    // Vérifier les autorisations (client ou admin)
    const userRole = await getUserRoleAsync(userEmail);
    if (userRole === "client" && mission.clientEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 403 }
      );
    }

    // Récupérer la demande liée
    const demande = await getDemandeById(mission.demandeId);
    if (!demande) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    // Récupérer le prestataire
    const prestataire = mission.prestataireId ? await getPrestataireById(mission.prestataireId) : null;

    // Créer le PDF
    const PDFDoc = require("pdfkit");
    const doc = new PDFDoc({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Buffer pour stocker le PDF
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    
    // Attendre la fin de la génération
    await new Promise<void>((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);

      let yPosition = 50;

      // En-tête avec logo et informations ICD
      doc
        .fontSize(20)
        .fillColor("#0A1B2A")
        .font("Helvetica-Bold")
        .text("ICD Canada", 50, yPosition, { align: "center" });

      doc
        .fontSize(12)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text("Plateforme de services au Cameroun", 50, yPosition + 25, { align: "center" });

      yPosition += 60;

      // Ligne de séparation
      doc
        .moveTo(50, yPosition)
        .lineTo(550, yPosition)
        .strokeColor("#C8A55F")
        .lineWidth(2)
        .stroke();

      yPosition += 20;

      // Titre du document
      doc
        .fontSize(16)
        .fillColor("#0A1B2A")
        .font("Helvetica-Bold")
        .text("RAPPORT DE MISSION", 50, yPosition, { align: "center" });

      yPosition += 40;

      // Informations de la mission
      doc
        .fontSize(10)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text("Référence mission:", 50, yPosition);

      doc
        .fontSize(12)
        .fillColor("#0A1B2A")
        .font("Helvetica-Bold")
        .text(mission.ref, 180, yPosition);

      yPosition += 20;

      doc
        .fontSize(10)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text("Date de clôture:", 50, yPosition);

      const clotureDate = mission.dateFin 
        ? new Date(mission.dateFin).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : new Date().toLocaleDateString("fr-FR");
      
      doc
        .fontSize(12)
        .fillColor("#0A1B2A")
        .font("Helvetica")
        .text(clotureDate, 180, yPosition);

      yPosition += 40;

      // Informations client
      doc
        .fontSize(14)
        .fillColor("#0A1B2A")
        .font("Helvetica-Bold")
        .text("Informations client", 50, yPosition);

      yPosition += 20;

      doc
        .fontSize(10)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text(`Nom: ${demande.fullName}`, 50, yPosition);

      yPosition += 15;

      doc
        .fontSize(10)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text(`Email: ${demande.email}`, 50, yPosition);

      yPosition += 15;

      doc
        .fontSize(10)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text(`Téléphone: ${demande.phone}`, 50, yPosition);

      yPosition += 40;

      // Détails de la mission
      doc
        .fontSize(14)
        .fillColor("#0A1B2A")
        .font("Helvetica-Bold")
        .text("Détails de la mission", 50, yPosition);

      yPosition += 20;

      doc
        .fontSize(10)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text(`Titre: ${mission.titre}`, 50, yPosition, { width: 500 });

      yPosition += 20;

      doc
        .fontSize(10)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text(`Service: ${mission.serviceType}`, 50, yPosition);

      yPosition += 15;

      if (mission.lieu) {
        doc
          .fontSize(10)
          .fillColor("#6B7280")
          .font("Helvetica")
          .text(`Lieu: ${mission.lieu}`, 50, yPosition);
        yPosition += 15;
      }

      if (prestataire) {
        doc
          .fontSize(10)
          .fillColor("#6B7280")
          .font("Helvetica")
          .text(`Prestataire: ${prestataire.nomEntreprise || prestataire.nomContact}`, 50, yPosition);
        yPosition += 15;
      }

      // Dates importantes
      yPosition += 10;
      if (mission.dateDebut) {
        doc
          .fontSize(10)
          .fillColor("#6B7280")
          .font("Helvetica")
          .text(`Date de début: ${new Date(mission.dateDebut).toLocaleDateString("fr-FR")}`, 50, yPosition);
        yPosition += 15;
      }

      if (mission.dateFin) {
        doc
          .fontSize(10)
          .fillColor("#6B7280")
          .font("Helvetica")
          .text(`Date de fin: ${new Date(mission.dateFin).toLocaleDateString("fr-FR")}`, 50, yPosition);
        yPosition += 15;
      }

      yPosition += 20;

      // Description de la mission
      if (mission.description) {
        doc
          .fontSize(12)
          .fillColor("#0A1B2A")
          .font("Helvetica-Bold")
          .text("Description", 50, yPosition);

        yPosition += 15;

        doc
          .fontSize(10)
          .fillColor("#6B7280")
          .font("Helvetica")
          .text(mission.description, 50, yPosition, {
            width: 500,
            align: "left",
          });

        // Calculer la hauteur du texte pour ajuster yPosition
        const descriptionHeight = doc.heightOfString(mission.description, {
          width: 500,
        });
        yPosition += descriptionHeight + 20;
      }

      // Commentaire du prestataire
      if (mission.commentairePrestataire) {
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > doc.page.height - 150) {
          doc.addPage();
          yPosition = 50;
        }

        doc
          .fontSize(12)
          .fillColor("#0A1B2A")
          .font("Helvetica-Bold")
          .text("Résumé du travail effectué", 50, yPosition);

        yPosition += 15;

        doc
          .fontSize(10)
          .fillColor("#6B7280")
          .font("Helvetica")
          .text(mission.commentairePrestataire, 50, yPosition, {
            width: 500,
            align: "left",
          });

        const commentaireHeight = doc.heightOfString(mission.commentairePrestataire, {
          width: 500,
        });
        yPosition += commentaireHeight + 20;
      }

      // Récapitulatif des montants
      if (yPosition > doc.page.height - 200) {
        doc.addPage();
        yPosition = 50;
      }

      doc
        .fontSize(14)
        .fillColor("#0A1B2A")
        .font("Helvetica-Bold")
        .text("Récapitulatif financier", 50, yPosition);

      yPosition += 25;

      // En-tête du tableau
      doc
        .fontSize(10)
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .rect(50, yPosition, 500, 25)
        .fillColor("#C8A55F")
        .fill()
        .fillColor("#FFFFFF")
        .text("Description", 60, yPosition + 8)
        .text("Montant", 480, yPosition + 8, { align: "right" });

      yPosition += 25;

      // Ligne 1: Prix prestataire
      doc
        .fontSize(10)
        .fillColor("#0A1B2A")
        .font("Helvetica")
        .rect(50, yPosition, 500, 25)
        .fillColor("#F9F9FB")
        .fill()
        .fillColor("#0A1B2A")
        .text("Prix prestataire", 60, yPosition + 8)
        .text(`$${(mission.tarifPrestataire || 0).toFixed(2)}`, 480, yPosition + 8, { align: "right" });

      yPosition += 25;

      // Ligne 2: Commission ICD
      if (mission.commissionICD && mission.commissionICD > 0) {
        const margePourcentage = mission.tarifPrestataire && mission.tarifPrestataire > 0
          ? ((mission.commissionICD / mission.tarifPrestataire) * 100).toFixed(1)
          : "15";
        
        doc
          .fontSize(10)
          .fillColor("#0A1B2A")
          .font("Helvetica")
          .rect(50, yPosition, 500, 25)
          .fillColor("#FFFFFF")
          .fill()
          .fillColor("#0A1B2A")
          .text(`Commission ICD (${margePourcentage}%)`, 60, yPosition + 8)
          .text(`$${mission.commissionICD.toFixed(2)}`, 480, yPosition + 8, { align: "right" });

        yPosition += 25;
      }

      // Ligne 3: Frais supplémentaires (si applicable)
      if (mission.fraisSupplementaires && mission.fraisSupplementaires > 0) {
        doc
          .fontSize(10)
          .fillColor("#0A1B2A")
          .font("Helvetica")
          .rect(50, yPosition, 500, 25)
          .fillColor("#F9F9FB")
          .fill()
          .fillColor("#0A1B2A")
          .text("Frais supplémentaires", 60, yPosition + 8)
          .text(`$${mission.fraisSupplementaires.toFixed(2)}`, 480, yPosition + 8, { align: "right" });

        yPosition += 25;
      }

      // Ligne totale
      doc
        .fontSize(12)
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .rect(50, yPosition, 500, 30)
        .fillColor("#0A1B2A")
        .fill()
        .fillColor("#FFFFFF")
        .text("TOTAL TTC", 60, yPosition + 10)
        .text(`$${(mission.tarifTotal || 0).toFixed(2)}`, 480, yPosition + 10, { align: "right" });

      yPosition += 50;

      // Preuves de validation
      if (mission.proofs && mission.proofs.length > 0) {
        // Nouvelle page pour les preuves si nécessaire
        if (yPosition > doc.page.height - 200) {
          doc.addPage();
          yPosition = 50;
        }

        doc
          .fontSize(14)
          .fillColor("#0A1B2A")
          .font("Helvetica-Bold")
          .text("Preuves d'accomplissement", 50, yPosition);

        yPosition += 25;

        // Parcourir les preuves
        for (let i = 0; i < mission.proofs.length; i++) {
          const proof = mission.proofs[i];
          
          // Vérifier si on a besoin d'une nouvelle page
          if (yPosition > doc.page.height - 250) {
            doc.addPage();
            yPosition = 50;
          }

          // Nom du fichier et type
          doc
            .fontSize(11)
            .fillColor("#0A1B2A")
            .font("Helvetica-Bold")
            .text(`${i + 1}. ${proof.fileName}`, 50, yPosition);

          yPosition += 15;

          // Type de fichier et date
          doc
            .fontSize(9)
            .fillColor("#6B7280")
            .font("Helvetica")
            .text(
              `Type: ${proof.fileType} | Uploadé le: ${new Date(proof.uploadedAt).toLocaleDateString("fr-FR")}`,
              50,
              yPosition
            );

          yPosition += 15;

          // Description si disponible
          if (proof.description) {
            doc
              .fontSize(9)
              .fillColor("#6B7280")
              .font("Helvetica")
              .text(proof.description, 50, yPosition, { width: 500 });
            
            const descHeight = doc.heightOfString(proof.description, { width: 500 });
            yPosition += descHeight + 10;
          }

          // Essayer d'intégrer l'image si c'est une image
          if (proof.fileType.startsWith("image/")) {
            try {
              const file = getFileById(proof.fileId);
              if (file) {
                // Récupérer le buffer depuis le stockage (Blob ou local)
                const imageBuffer = (await getFileBuffer(file));

                // Vérifier si l'image peut tenir sur la page
                if (yPosition + 150 > doc.page.height - 50) {
                  doc.addPage();
                  yPosition = 50;
                }

                // Intégrer l'image (max 200px de largeur)
                doc.image(imageBuffer, 50, yPosition, {
                  width: 200,
                  height: 150,
                  fit: [200, 150],
                  align: "left",
                });

                yPosition += 160;
              } else {
                doc
                  .fontSize(9)
                  .fillColor("#999999")
                  .font("Helvetica-Italic")
                  .text("(Image non disponible)", 50, yPosition);
                yPosition += 15;
              }
            } catch (error) {
              console.error(`Erreur lors de l'intégration de l'image ${proof.fileName}:`, error);
              doc
                .fontSize(9)
                .fillColor("#999999")
                .font("Helvetica-Italic")
                .text("(Image non disponible)", 50, yPosition);
              yPosition += 15;
            }
          } else {
            // Pour les autres types de fichiers (PDF, vidéos, etc.), juste une note
            doc
              .fontSize(9)
              .fillColor("#999999")
              .font("Helvetica-Italic")
              .text(
                `(Fichier ${proof.fileType} - non affiché dans le PDF, disponible en téléchargement sur la plateforme)`,
                50,
                yPosition,
                { width: 500 }
              );
            yPosition += 20;
          }

          yPosition += 10;
        }
      }

      // Pied de page
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .fillColor("#6B7280")
          .font("Helvetica")
          .text(
            "ICD Canada - Plateforme de services au Cameroun",
            50,
            doc.page.height - 80,
            { align: "center" }
          );

        doc
          .fontSize(8)
          .fillColor("#6B7280")
          .font("Helvetica")
          .text(
            `Page ${i + 1} / ${pageCount}`,
            50,
            doc.page.height - 65,
            { align: "center" }
          );
      }

      // Finaliser le document
      doc.end();
    });

    // Concaténer les chunks
    const pdfBuffer = Buffer.concat(chunks);

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rapport-${mission.ref}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur /api/missions/[id]/report-pdf:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du rapport PDF." },
      { status: 500 }
    );
  }
}

