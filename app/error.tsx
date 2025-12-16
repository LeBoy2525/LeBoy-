"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur pour le débogage
    console.error("Erreur capturée:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F2F2F5] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Lien retour à l'accueil - Toujours visible en haut */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2135] hover:text-[#D4A657] transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A657]/10 to-[#D4A657]/5 border border-[#D4A657]/20 flex items-center justify-center group-hover:bg-[#D4A657]/20 group-hover:border-[#D4A657]/40 transition-all duration-200">
              <ArrowLeft className="w-4 h-4 text-[#D4A657] group-hover:translate-x-[-2px] transition-transform duration-200" />
            </div>
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        {/* Carte d'erreur */}
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 md:p-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0B2135] mb-2">
                Une erreur s'est produite
              </h1>
              <p className="text-sm text-[#4B4F58]">
                Désolé, une erreur inattendue s'est produite. Vous pouvez retourner à la page d'accueil ou réessayer.
              </p>
            </div>
          </div>

          {/* Détails de l'erreur (en développement seulement) */}
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-mono text-red-800 break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#D4A657] text-[#0B2135] font-semibold hover:brightness-110 transition-all duration-200 shadow-lg shadow-[#D4A657]/30"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-[#0B2135] text-[#0B2135] font-semibold hover:bg-[#0B2135] hover:text-white transition-all duration-200"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

