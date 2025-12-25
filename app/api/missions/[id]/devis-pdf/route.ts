import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById } from "@/lib/dataAccess";
import { getDemandeById } from "@/lib/dataAccess";
import { getPrestataireById } from "@/lib/dataAccess";
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

    // Vérifier que le devis a été généré
    if (!mission.devisGenere) {
      return NextResponse.json(
        { error: "Le devis n'a pas encore été généré." },
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

      // En-tête avec logo et informations ICD
      doc
        .fontSize(20)
        .fillColor("#0A1B2A")
        .font("Helvetica-Bold")
        .text("ICD Canada", 50, 50, { align: "center" });

      doc
        .fontSize(12)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text("Plateforme de services au Cameroun", 50, 75, { align: "center" });

      // Ligne de séparation
      doc
        .moveTo(50, 100)
        .lineTo(550, 100)
        .strokeColor("#C8A55F")
        .lineWidth(2)
        .stroke();

      // Titre du document
      doc
        .fontSize(16)
        .fillColor("#0A1B2A")
        .font("Helvetica-Bold")
        .text("DEVIS PROFORMA", 50, 120, { align: "center" });

      let yPosition = 170;

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
        .text("Date du devis:", 50, yPosition);

      const devisDate = mission.devisGenereAt 
        ? new Date(mission.devisGenereAt).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : new Date().toLocaleDateString("fr-FR");
      
      doc
        .fontSize(12)
        .fillColor("#0A1B2A")
        .font("Helvetica")
        .text(devisDate, 180, yPosition);

      yPosition += 30;

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

      yPosition += 30;

      // Informations de la mission
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
          .text(`Prestataire: ${prestataire.nomEntreprise || prestataire.nomContact || prestataire.nomContact}`, 50, yPosition);
        yPosition += 15;
      }

      yPosition += 20;

      // Tableau des montants
      doc
        .fontSize(14)
        .fillColor("#0A1B2A")
        .font("Helvetica-Bold")
        .text("Récapitulatif des montants", 50, yPosition);

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

      // Conditions et notes
      doc
        .fontSize(10)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text("Ce devis est valable pour une durée de 30 jours.", 50, yPosition, {
          width: 500,
        });

      yPosition += 15;

      doc
        .fontSize(10)
        .fillColor("#6B7280")
        .font("Helvetica")
        .text(
          "Pour procéder au paiement et débuter la mission, veuillez utiliser la plateforme en ligne.",
          50,
          yPosition,
          {
            width: 500,
          }
        );

      yPosition += 30;

      // Pied de page
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
          "Pour toute question, contactez-nous via la plateforme.",
          50,
          doc.page.height - 65,
          { align: "center" }
        );

      // Finaliser le document
      doc.end();
    });

    // Concaténer les chunks
    const pdfBuffer = Buffer.concat(chunks);

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="devis-${mission.ref}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur /api/missions/[id]/devis-pdf:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF." },
      { status: 500 }
    );
  }
}

