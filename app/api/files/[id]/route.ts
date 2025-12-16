import { NextResponse } from "next/server";
import { getFileById, getFileBuffer } from "@/lib/filesStore";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const file = getFileById(resolvedParams.id);

    if (!file) {
      return NextResponse.json(
        { error: "Fichier non trouvé." },
        { status: 404 }
      );
    }

    // Si on a une URL publique (Blob), rediriger directement
    if (file.storageUrl && (file.storageUrl.startsWith("http://") || file.storageUrl.startsWith("https://"))) {
      return NextResponse.redirect(file.storageUrl, 302);
    }

    // Sinon, récupérer le buffer depuis le stockage
    const buffer = await getFileBuffer(file);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${file.originalName}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable", // Cache 1 an pour les fichiers statiques
      },
    });
  } catch (error) {
    console.error("Erreur téléchargement fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléchargement." },
      { status: 500 }
    );
  }
}

