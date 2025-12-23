"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, FileText, Image as ImageIcon, Video, CheckCircle2, AlertCircle } from "lucide-react";
import type { MissionProof } from "@/lib/types";

interface MissionProofUploadProps {
  missionId: string | number; // UUID string ou number (pour compatibilité)
  lang?: "fr" | "en";
  onUploadSuccess?: () => void;
  onFinalSubmit?: (commentaire: string) => void;
  isModal?: boolean;
  onClose?: () => void;
  existingProofs?: MissionProof[]; // Preuves déjà uploadées
}

const TEXT = {
  fr: {
    title: "Preuves d'accomplissement",
    subtitle: "Téléversez des preuves de l'accomplissement de la mission (photos, documents, vidéos)",
    required: "Obligatoire",
    uploadFiles: "Téléverser des fichiers",
    selectFiles: "Sélectionner des fichiers",
    description: "Description (optionnel)",
    descriptionPlaceholder: "Décrivez brièvement les preuves...",
    commentaire: "Commentaire / Résumé du travail effectué",
    commentairePlaceholder: "Résumez le travail effectué, ajoutez des remarques importantes...",
    submit: "Soumettre les preuves",
    terminerEtEnvoyer: "Terminer et envoyer pour validation",
    submitting: "Soumission en cours...",
    filesSelected: "fichier(s) sélectionné(s)",
    remove: "Retirer",
    maxSize: "Taille max: 50 MB par fichier",
    allowedTypes: "Formats acceptés: PDF, JPG, PNG, WEBP, MP4, MOV, DOC, DOCX",
    compression: "Compression automatique en cours...",
    success: "Preuves soumises avec succès !",
    error: "Erreur lors de la soumission des preuves",
    atLeastOne: "Veuillez sélectionner au moins un fichier",
    uploading: "Téléversement en cours...",
  },
  en: {
    title: "Proof of completion",
    subtitle: "Upload proof of mission completion (photos, documents, videos)",
    required: "Required",
    uploadFiles: "Upload files",
    selectFiles: "Select files",
    description: "Description (optional)",
    descriptionPlaceholder: "Briefly describe the proofs...",
    commentaire: "Comment / Summary of work completed",
    commentairePlaceholder: "Summarize the work completed, add important remarks...",
    submit: "Submit proofs",
    terminerEtEnvoyer: "Finish and send for validation",
    submitting: "Submitting...",
    filesSelected: "file(s) selected",
    remove: "Remove",
    maxSize: "Max size: 50 MB per file",
    allowedTypes: "Accepted formats: PDF, JPG, PNG, WEBP, MP4, MOV, DOC, DOCX",
    compression: "Automatic compression in progress...",
    success: "Proofs submitted successfully!",
    error: "Error submitting proofs",
    atLeastOne: "Please select at least one file",
    uploading: "Uploading...",
  },
} as const;

// Fonction de compression simple pour les images (côté client)
async function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(file); // Pas une image, retourner tel quel
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Redimensionner si nécessaire
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function MissionProofUpload({ missionId, lang = "fr", onUploadSuccess, onFinalSubmit, isModal = false, onClose, existingProofs = [] }: MissionProofUploadProps) {
  const t = TEXT[lang];
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [hasUploadedProofs, setHasUploadedProofs] = useState(existingProofs.length > 0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mettre à jour hasUploadedProofs si des preuves existent déjà
  useEffect(() => {
    if (existingProofs.length > 0) {
      setHasUploadedProofs(true);
    }
  }, [existingProofs]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert(t.atLeastOne);
      return;
    }

    setUploading(true);
    setCompressing(true);

    try {
      // Compresser les images
      const processedFiles: File[] = [];
      for (const file of selectedFiles) {
        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          processedFiles.push(compressed);
        } else {
          processedFiles.push(file);
        }
      }

      setCompressing(false);

      // Créer FormData
      const formData = new FormData();
      processedFiles.forEach((file) => {
        formData.append("files", file);
      });
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      const res = await fetch(`/api/missions/${missionId}/proofs`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.error);
      }

      // Ne pas afficher d'alerte ici, on attend la soumission finale
      setSelectedFiles([]);
      setDescription("");
      setHasUploadedProofs(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploadSuccess?.();
    } catch (error: any) {
      console.error("Erreur upload preuves:", error);
      alert(error.message || t.error);
    } finally {
      setUploading(false);
      setCompressing(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
    if (file.type.startsWith("video/")) return <Video className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold text-[#0A1B2A] flex items-center gap-2">
          {t.title}
          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">{t.required}</span>
        </h3>
        <p className="text-sm text-[#6B7280] mt-1">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Zone de téléversement */}
        <div className="border-2 border-dashed border-[#DDDDDD] rounded-lg p-6 text-center hover:border-[#C8A55F] transition">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.mov,.doc,.docx"
            className="hidden"
            id="proof-upload"
            disabled={uploading}
          />
          <label
            htmlFor="proof-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="w-8 h-8 text-[#6B7280]" />
            <span className="text-sm font-medium text-[#0A1B2A]">{t.selectFiles}</span>
            <span className="text-xs text-[#6B7280]">{t.maxSize}</span>
            <span className="text-xs text-[#6B7280]">{t.allowedTypes}</span>
          </label>
        </div>

        {/* Fichiers sélectionnés */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#0A1B2A]">
              {selectedFiles.length} {t.filesSelected}
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-[#F9F9FB] border border-[#DDDDDD] rounded-lg"
                >
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0A1B2A] truncate">{file.name}</p>
                    <p className="text-xs text-[#6B7280]">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description pour les fichiers */}
        <div>
          <label className="block text-sm font-medium text-[#0A1B2A] mb-2">
            {t.description}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
            rows={3}
            className="w-full px-4 py-2 text-sm border border-[#DDDDDD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8A55F] resize-none"
            disabled={uploading}
          />
        </div>

        {/* Commentaire / Résumé du travail effectué */}
        <div>
          <label className="block text-sm font-medium text-[#0A1B2A] mb-2">
            {t.commentaire}
          </label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder={t.commentairePlaceholder}
            rows={4}
            className="w-full px-4 py-2 text-sm border border-[#DDDDDD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8A55F] resize-none"
            disabled={uploading}
          />
        </div>

        {/* Message de compression */}
        {compressing && (
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <AlertCircle className="w-4 h-4 animate-pulse" />
            {t.compression}
          </div>
        )}

        {/* Bouton de soumission des fichiers - seulement si on n'a pas encore uploadé de preuves */}
        {!hasUploadedProofs && (
          <button
            type="submit"
            disabled={selectedFiles.length === 0 || uploading || compressing}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0A1B2A] text-white text-sm font-semibold rounded-md hover:bg-[#07121e] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <span className="animate-spin">⏳</span>
                {t.uploading}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t.submit}
              </>
            )}
          </button>
        )}
      </form>

      {/* Bouton "Terminer et envoyer pour validation" - affiché après upload de preuves OU si des preuves existent déjà */}
      {hasUploadedProofs && (
        <div className="pt-4 border-t border-[#E2E2E8]">
          <button
            onClick={() => {
              if (onFinalSubmit) {
                onFinalSubmit(commentaire);
              }
            }}
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5" />
            {t.terminerEtEnvoyer}
          </button>
        </div>
      )}
    </div>
  );
}

