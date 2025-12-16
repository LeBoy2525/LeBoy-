// app/espace-client/dossier/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "../../../components/LanguageProvider";

const TEXT = {
  fr: {
    tag: "Dossier LeBoy",
    title: "Dossier",
    subtitle:
      "Cette page est prévue pour le suivi détaillé d'un dossier (étapes, échanges, documents, statut, etc.).",
    notFoundTag: "Dossier introuvable (V1)",
    notFoundTitle:
      "Le suivi détaillé de ce dossier n'est pas encore activé.",
    notFoundText1:
      "Votre demande est bien enregistrée et visible dans votre espace client. Dans cette première version du site, la page de suivi détaillé des dossiers n'est pas encore connectée à toutes les informations internes (étapes, pièces, échanges, etc.).",
    notFoundText2:
      "Cette page servira plus tard à consulter, étape par étape, ce qui a été fait sur un dossier donné : réception, analyse, mandats, comptes rendus, clôture, etc.",
    backToClientSpace: "Retour à mon espace client",
    askQuestion: "Poser une question sur ce dossier",
  },
  en: {
    tag: "LeBoy File",
    title: "File",
    subtitle:
      "This page is intended for detailed follow-up of a file (steps, exchanges, documents, status, etc.).",
    notFoundTag: "File not found (V1)",
    notFoundTitle: "The detailed follow-up of this file is not yet activated.",
    notFoundText1:
      "Your request is registered and visible in your client space. In this first version of the site, the detailed file follow-up page is not yet connected to all internal information (steps, documents, exchanges, etc.).",
    notFoundText2:
      "This page will later serve to consult, step by step, what has been done on a given file: reception, analysis, mandates, reports, closure, etc.",
    backToClientSpace: "Back to my client space",
    askQuestion: "Ask a question about this file",
  },
} as const;

export default function DossierPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [dossierId, setDossierId] = useState<string>("");
  const [dossierRef, setDossierRef] = useState<string>("");

  useEffect(() => {
    // On récupère l'ID ou la ref du dossier dans l'URL
    const rawId = params?.id;
    const id = rawId ? (typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "") : "";
    
    // Si c'est une ref (commence par D-), on la traite comme une ref
    // Sinon, on la traite comme un ID numérique
    if (id.startsWith("D-")) {
      setDossierRef(id);
      setDossierId("");
    } else {
      setDossierId(id);
      setDossierRef("");
    }
  }, [params]);

  // Rediriger vers la route avec ID et ref si on a seulement une ref
  useEffect(() => {
    if (dossierRef && !dossierId) {
      // Essayer de récupérer l'ID depuis l'API
      async function fetchDossierId() {
        try {
          const res = await fetch(`/api/espace-client/dossier/${encodeURIComponent(dossierRef)}`, {
            cache: "no-store",
          });
          if (res.ok) {
            const data = await res.json();
            if (data.dossier && data.dossier.id) {
              // Rediriger vers la route complète avec ID et ref
              router.push(`/espace-client/dossier/${data.dossier.id}/${encodeURIComponent(dossierRef)}`);
              return;
            }
          }
        } catch (e) {
          console.error("Erreur récupération dossier:", e);
        }
      }
      fetchDossierId();
    }
  }, [dossierRef, dossierId]);

  // 👉 Dans la V1, on n'a pas encore de vraie table "Dossier"
  // et pas encore de logique complète de récupération.
  // Donc pour l'instant, on affiche simplement un écran "propre"
  // si le dossier n'est pas trouvé.

  const dossier = null; // plus tard : appel API / base de données
  const hasDossier = !!dossier;

  return (
    <main className="bg-[#F2F2F5] min-h-screen">
      {/* EN-TÊTE */}
      <section className="bg-white border-b border-[#DDDDDD]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A55F]">
            {t.tag}
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-[#0A1B2A]">
            {t.title} {dossierId || "—"}
          </h1>
          <p className="text-xs md:text-sm text-[#4B4F58] max-w-3xl">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* CONTENU */}
      <section className="py-8 md:py-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {!hasDossier && (
            <div className="bg-white border border-[#F97373]/40 rounded-xl shadow-sm p-5 md:p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.18em] text-[#F97373]">
                  {t.notFoundTag}
                </p>
                <h2 className="font-heading text-lg md:text-xl font-semibold text-[#0A1B2A]">
                  {t.notFoundTitle}
                </h2>
              </div>

              <p
                className="text-sm md:text-base text-[#4B4F58]"
                style={{ textAlign: "justify" }}
              >
                {t.notFoundText1}
              </p>

              <p
                className="text-xs md:text-sm text-[#4B4F58]"
                style={{ textAlign: "justify" }}
              >
                {t.notFoundText2}
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/espace-client"
                  className="inline-flex items-center justify-center rounded-md bg-[#0A1B2A] text-white px-4 py-2 text-xs md:text-sm font-semibold hover:bg-[#07121e] transition"
                >
                  {t.backToClientSpace}
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md border border-[#C8A55F] text-[#0A1B2A] px-4 py-2 text-xs md:text-sm font-semibold hover:bg-[#C8A55F] hover:text-[#0A1B2A] transition"
                >
                  {t.askQuestion}
                </Link>
              </div>
            </div>
          )}

          {/* Plus tard, quand on aura un vrai "dossier" :
              on pourra afficher ici les infos, la timeline, les étapes, etc. */}
        </div>
      </section>
    </main>
  );
}
