import { NextResponse } from "next/server";
import { getFileById, getFileBuffer } from "@/lib/filesStore";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.id;
    
    // Chercher le fichier dans le store JSON
    let file = getFileById(fileId);
    
    // Si pas trouvé dans le store JSON, chercher dans les preuves de missions (Prisma)
    if (!file) {
      try {
        const { prisma } = await import("@/lib/db");
        if (prisma) {
          // Chercher dans toutes les missions qui ont des preuves
          const missions = await prisma.mission.findMany({
            where: {
              proofs: {
                not: null,
              },
            },
            select: {
              proofs: true,
            },
          });
          
          // Trouver la preuve qui contient ce fileId
          for (const mission of missions) {
            if (mission.proofs) {
              const proofs = typeof mission.proofs === "string" 
                ? JSON.parse(mission.proofs) 
                : mission.proofs;
              
              if (Array.isArray(proofs)) {
                const proof = proofs.find((p: any) => p.fileId === fileId);
                if (proof) {
                  // Reconstruire l'objet StoredFile depuis la preuve
                  file = {
                    id: proof.fileId,
                    originalName: proof.fileName,
                    mimeType: proof.fileType,
                    size: proof.fileSize,
                    storageUrl: proof.fileUrl,
                    storageKey: (proof as any).storageKey, // Clé de stockage si disponible
                    uploadedAt: proof.uploadedAt,
                    uploadedBy: proof.uploadedBy,
                  } as any;
                  break;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Erreur recherche fichier dans Prisma:", error);
      }
    }

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

    // Si on a une storageKey, récupérer depuis le système de stockage
    if ((file as any).storageKey) {
      const { getFile: getFileStorage } = await import("@/lib/storage/index");
      try {
        const result = await getFileStorage((file as any).storageKey);
        return new NextResponse(result.buffer, {
          headers: {
            "Content-Type": result.contentType || file.mimeType,
            "Content-Disposition": `inline; filename="${file.originalName}"`,
            "Content-Length": result.buffer.length.toString(),
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch (error) {
        console.error("Erreur récupération fichier depuis storage:", error);
        return NextResponse.json(
          { error: "Erreur lors du téléchargement depuis le stockage." },
          { status: 500 }
        );
      }
    }

    // Sinon, récupérer le buffer depuis le stockage (ancien système)
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

