import { NextResponse } from "next/server";
import { storeFile } from "@/lib/filesStore";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;
    const uploadedBy = formData.get("uploadedBy") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    if (!type || !uploadedBy) {
      return NextResponse.json(
        { error: "Type et uploader requis." },
        { status: 400 }
      );
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (maximum 10 MB)." },
        { status: 400 }
      );
    }

    // Vérifier le type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG, DOC, DOCX." },
        { status: 400 }
      );
    }

    // Convertir en base64 pour compatibilité avec l'API storeFile
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Utiliser le nouveau système de stockage (Blob ou local selon l'environnement)
    const stored = await storeFile({
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      data: dataUrl,
      uploadedBy: uploadedBy.toLowerCase(),
    });

    return NextResponse.json(
      {
        success: true,
        file: {
          id: stored.id,
          name: stored.originalName,
          type: stored.mimeType,
          size: stored.size,
          url: stored.storageUrl || `/api/files/${stored.id}`, // URL publique Blob ou fallback API
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur upload fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier." },
      { status: 500 }
    );
  }
}
