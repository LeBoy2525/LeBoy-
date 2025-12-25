import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMissionById } from "@/lib/dataAccess";
import { getPrestataireByEmail } from "@/lib/dataAccess";
import { getUserRoleAsync } from "@/lib/auth";
import { storeFile } from "@/lib/filesStore";
import type { MissionProof } from "@/lib/types";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB avant compression
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// POST: Uploader des preuves (prestataire uniquement)
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("icd_user_email")?.value;

    if (!userEmail || (await getUserRoleAsync(userEmail)) !== "prestataire") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const missionUuid = resolvedParams.id;

    // Validation UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!missionUuid || typeof missionUuid !== "string" || !UUID_REGEX.test(missionUuid)) {
      return NextResponse.json(
        { error: "UUID invalide." },
        { status: 400 }
      );
    }

    console.log(`[proofs POST] 🔍 Recherche mission avec UUID: ${missionUuid}`);
    const mission = await getMissionById(missionUuid);
    console.log(`[proofs POST] ${mission ? "✅ Mission trouvée" : "❌ Mission non trouvée"}: ${mission ? mission.ref : "N/A"}`);

    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    // Vérifier que le prestataire est bien assigné à cette mission
    const prestataire = await getPrestataireByEmail(userEmail);
    if (!prestataire || mission.prestataireId !== prestataire.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à uploader des preuves pour cette mission." },
        { status: 403 }
      );
    }

    // Vérifier que la mission est dans l'état IN_PROGRESS
    if (mission.internalState !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Vous ne pouvez uploader des preuves que pour une mission en cours." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const description = formData.get("description") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    // Récupérer les preuves existantes depuis Prisma
    const { getMissionById: getMissionByIdDB } = await import("@/repositories/missionsRepo");
    const missionPrisma = await getMissionByIdDB(missionUuid);
    
    if (!missionPrisma) {
      return NextResponse.json(
        { error: "Mission non trouvée dans la base de données." },
        { status: 404 }
      );
    }

    // Initialiser proofs si nécessaire
    const existingProofs = missionPrisma.proofs ? JSON.parse(JSON.stringify(missionPrisma.proofs)) : [];
    const uploadedProofs: MissionProof[] = [];

    for (const file of files) {
      // Vérifier la taille
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Le fichier ${file.name} est trop volumineux (maximum 50 MB).` },
          { status: 400 }
        );
      }

      // Vérifier le type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Type de fichier non autorisé pour ${file.name}. Formats acceptés : PDF, JPG, PNG, WEBP, MP4, MOV, DOC, DOCX.` },
          { status: 400 }
        );
      }

      // Convertir en base64 pour compatibilité avec l'API storeFile
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;

      // Stocker le fichier dans le système de stockage (Blob ou local)
      const stored = await storeFile({
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        data: dataUrl,
        uploadedBy: userEmail.toLowerCase(),
      });

      // Créer la preuve
      const proof: MissionProof = {
        id: `proof-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        missionId: missionUuid,
        fileId: stored.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "prestataire",
        description: description || undefined,
        validated: false,
      };

      existingProofs.push(proof);
      uploadedProofs.push(proof);
    }

    // Mettre à jour la mission via Prisma
    const { updateMission } = await import("@/repositories/missionsRepo");
    const now = new Date();
    
    // Mettre à jour la date de soumission si c'est la première fois
    const updateData: any = {
      proofs: existingProofs,
    };
    
    if (!missionPrisma.proofSubmissionDate) {
      updateData.proofSubmissionDate = now;
    }

    const updatedMissionPrisma = await updateMission(missionUuid, updateData);
    
    if (!updatedMissionPrisma) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour de la mission." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        proofs: uploadedProofs,
        message: `${uploadedProofs.length} preuve(s) uploadée(s) avec succès.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/missions/[id]/proofs POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

// GET: Récupérer les preuves (admin, client si validées, prestataire)
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
    const missionUuid = resolvedParams.id;

    // Validation UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!missionUuid || typeof missionUuid !== "string" || !UUID_REGEX.test(missionUuid)) {
      return NextResponse.json(
        { error: "UUID invalide." },
        { status: 400 }
      );
    }

    console.log(`[proofs GET] 🔍 Recherche mission avec UUID: ${missionUuid}`);
    const mission = await getMissionById(missionUuid);
    console.log(`[proofs GET] ${mission ? "✅ Mission trouvée" : "❌ Mission non trouvée"}: ${mission ? mission.ref : "N/A"}`);

    if (!mission) {
      return NextResponse.json(
        { error: "Mission non trouvée." },
        { status: 404 }
      );
    }

    const userRole = await getUserRoleAsync(userEmail);

    // Prestataire peut voir ses propres preuves
    if (userRole === "prestataire" && mission.prestataireId) {
      // Vérifier que c'est bien le prestataire de la mission
      const prestataire = await getPrestataireByEmail(userEmail);
      
      if (!prestataire || mission.prestataireId !== prestataire.id) {
        return NextResponse.json(
          { error: "Non autorisé." },
          { status: 403 }
        );
      }
    }

    // Client peut voir les preuves seulement si validées par l'admin
    if (userRole === "client") {
      if (mission.clientEmail.toLowerCase() !== userEmail.toLowerCase()) {
        return NextResponse.json(
          { error: "Non autorisé." },
          { status: 403 }
        );
      }
      if (!mission.proofValidatedForClient) {
        return NextResponse.json(
          { error: "Les preuves ne sont pas encore disponibles." },
          { status: 403 }
        );
      }
    }

    // Admin peut toujours voir les preuves
    if (userRole !== "admin" && userRole !== "prestataire" && userRole !== "client") {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        proofs: mission.proofs || [],
        proofSubmissionDate: mission.proofSubmissionDate,
        proofValidatedByAdmin: mission.proofValidatedByAdmin,
        proofValidatedAt: mission.proofValidatedAt,
        proofValidatedForClient: mission.proofValidatedForClient,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/missions/[id]/proofs GET:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

