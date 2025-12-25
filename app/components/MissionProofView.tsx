"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Image, Video, CheckCircle2, XCircle, Eye, Calendar } from "lucide-react";
import type { MissionProof } from "@/lib/types";

interface MissionProofViewProps {
  missionId: string | number; // UUID string ou number (pour compatibilité)
  userRole: "admin" | "client" | "prestataire";
  lang?: "fr" | "en";
  onValidationChange?: () => void;
}

const TEXT = {
  fr: {
    title: "Preuves d'accomplissement",
    noProofs: "Aucune preuve disponible",
    waitingValidation: "En attente de validation par l'administrateur",
    validated: "Validées",
    rejected: "Rejetées",
    validate: "Valider les preuves",
    reject: "Rejeter les preuves",
    rejectReason: "Raison du rejet (optionnel)",
    validating: "Validation en cours...",
    validatedSuccess: "Preuves validées avec succès",
    rejectedSuccess: "Preuves rejetées",
    error: "Erreur lors de la validation",
    uploadedAt: "Téléversé le",
    validatedAt: "Validé le",
    archivedAt: "Archivé le",
    download: "Télécharger",
    view: "Voir",
    description: "Description",
    fileSize: "Taille",
    validateForClient: "Valider et donner accès au client",
    clientCanView: "Le client peut maintenant voir ces preuves",
    clientCannotView: "Les preuves ne sont pas encore validées",
  },
  en: {
    title: "Proof of completion",
    noProofs: "No proof available",
    waitingValidation: "Waiting for administrator validation",
    validated: "Validated",
    rejected: "Rejected",
    validate: "Validate proofs",
    reject: "Reject proofs",
    rejectReason: "Rejection reason (optional)",
    validating: "Validating...",
    validatedSuccess: "Proofs validated successfully",
    rejectedSuccess: "Proofs rejected",
    error: "Error validating proofs",
    uploadedAt: "Uploaded on",
    validatedAt: "Validated on",
    archivedAt: "Archived on",
    download: "Download",
    view: "View",
    description: "Description",
    fileSize: "Size",
    validateForClient: "Validate and give client access",
    clientCanView: "The client can now view these proofs",
    clientCannotView: "Proofs are not yet validated",
  },
} as const;

export function MissionProofView({ missionId, userRole, lang = "fr", onValidationChange }: MissionProofViewProps) {
  const t = TEXT[lang];
  const [proofs, setProofs] = useState<MissionProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [proofValidatedForClient, setProofValidatedForClient] = useState(false);

  useEffect(() => {
    fetchProofs();
  }, [missionId]);

  const fetchProofs = async () => {
    try {
      const res = await fetch(`/api/missions/${missionId}/proofs`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProofs(data.proofs || []);
        setProofValidatedForClient(data.proofValidatedForClient || false);
      }
    } catch (error) {
      console.error("Erreur chargement preuves:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (validate: boolean, validateForClient: boolean = false) => {
    if (userRole !== "admin") return;

    setValidating(true);
    try {
      const res = await fetch(`/api/admin/missions/${missionId}/validate-proofs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validate,
          rejectReason: validate ? undefined : rejectReason,
          validateForClient,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.error);
      }

      if (validate) {
        if (validateForClient) {
          alert(lang === "fr" ? "✅ Preuves validées et mission validée pour le client !" : "✅ Proofs validated and mission validated for client!");
        } else {
          alert(t.validatedSuccess);
        }
      } else {
        alert(t.rejectedSuccess);
      }
      setShowRejectModal(false);
      setRejectReason("");
      fetchProofs();
      onValidationChange?.();
    } catch (error: any) {
      console.error("Erreur validation:", error);
      alert(error.message || t.error);
    } finally {
      setValidating(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="w-5 h-5" />;
    if (fileType.startsWith("video/")) return <Video className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
        <p className="text-sm text-[#6B7280]">{lang === "fr" ? "Chargement..." : "Loading..."}</p>
      </div>
    );
  }

  if (proofs.length === 0) {
    return (
      <div className="bg-white border border-[#DDDDDD] rounded-xl p-6">
        <h3 className="font-heading text-lg font-semibold text-[#0A1B2A] mb-2">{t.title}</h3>
        <p className="text-sm text-[#6B7280]">{t.noProofs}</p>
      </div>
    );
  }

  const allValidated = proofs.every((p) => p.validatedByAdmin);
  const anyValidated = proofs.some((p) => p.validatedByAdmin);

  return (
    <div className="bg-white border border-[#DDDDDD] rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-[#0A1B2A]">{t.title}</h3>
        {userRole === "admin" && (
          <div className="flex items-center gap-2">
            {!allValidated && (
              <>
                <button
                  onClick={() => handleValidate(true, false)}
                  disabled={validating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t.validate}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={validating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {t.reject}
                </button>
              </>
            )}
            {allValidated && !proofValidatedForClient && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.validated}
                </span>
                <button
                  onClick={() => handleValidate(true, true)}
                  disabled={validating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t.validateForClient}
                </button>
              </div>
            )}
            {allValidated && proofValidatedForClient && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                {t.clientCanView}
              </span>
            )}
          </div>
        )}
        {userRole === "client" && (
          <div>
            {proofValidatedForClient ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                {t.clientCanView}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                <Calendar className="w-4 h-4" />
                {t.clientCannotView}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Statut pour prestataire */}
      {userRole === "prestataire" && (
        <div>
          {allValidated ? (
            <p className="text-sm text-green-600 font-medium">{t.validated}</p>
          ) : anyValidated ? (
            <p className="text-sm text-yellow-600 font-medium">{t.waitingValidation}</p>
          ) : (
            <p className="text-sm text-blue-600 font-medium">{t.waitingValidation}</p>
          )}
        </div>
      )}

      {/* Liste des preuves */}
      <div className="grid md:grid-cols-2 gap-4">
        {proofs.map((proof) => (
          <div
            key={proof.id}
            className={`p-4 border rounded-lg ${
              proof.validatedByAdmin
                ? "border-green-300 bg-green-50"
                : "border-[#DDDDDD] bg-[#F9F9FB]"
            }`}
          >
            <div className="flex items-start gap-3">
              {getFileIcon(proof.fileType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0A1B2A] truncate">{proof.fileName}</p>
                <p className="text-xs text-[#6B7280] mt-1">
                  {t.fileSize}: {formatFileSize(proof.fileSize)}
                </p>
                {proof.description && (
                  <p className="text-xs text-[#6B7280] mt-1 italic">"{proof.description}"</p>
                )}
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#6B7280] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t.uploadedAt}: {formatDate(proof.uploadedAt)}
                  </p>
                  {proof.validatedAt && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.validatedAt}: {formatDate(proof.validatedAt)}
                    </p>
                  )}
                  {proof.archivedAt && (
                    <p className="text-xs text-[#6B7280] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {t.archivedAt}: {formatDate(proof.archivedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={`/api/files/${proof.fileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0A1B2A] text-white text-xs font-semibold rounded-md hover:bg-[#07121e] transition"
              >
                <Eye className="w-3 h-3" />
                {t.view}
              </a>
              <a
                href={`/api/files/${proof.fileId}`}
                download={proof.fileName}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#DDDDDD] text-[#0A1B2A] text-xs font-semibold rounded-md hover:bg-[#F9F9FB] transition"
              >
                <Download className="w-3 h-3" />
                {t.download}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de rejet (admin) */}
      {showRejectModal && userRole === "admin" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-heading text-xl font-semibold text-[#0A1B2A]">{t.reject}</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t.rejectReason}
              rows={4}
              className="w-full px-4 py-2 text-sm border border-[#DDDDDD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C8A55F] resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-[#DDDDDD] text-[#4B4F58] text-sm font-semibold rounded-md hover:bg-[#F9F9FB] transition"
              >
                {lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button
                onClick={() => handleValidate(false, false)}
                disabled={validating}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition disabled:opacity-50"
              >
                {validating ? t.validating : t.reject}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

