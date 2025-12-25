"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { Mission } from "@/lib/types";

interface AdminRatingSectionProps {
  mission: Mission;
  lang?: "fr" | "en";
  onRatingSubmitted: () => void;
}

const TEXT = {
  fr: {
    title: "Évaluer le prestataire",
    subtitle: "Votre évaluation aide à améliorer la qualité des services et influence la priorité d'assignation",
    ratingLabel: "Note du prestataire",
    commentLabel: "Commentaire (optionnel)",
    commentPlaceholder: "Commentaires sur la qualité du travail, la communication, les délais...",
    submit: "Soumettre l'évaluation",
    submitted: "Évaluation soumise",
    alreadyRated: "Vous avez déjà évalué ce prestataire pour cette mission",
    prestataire: "Prestataire",
  },
  en: {
    title: "Rate the provider",
    subtitle: "Your rating helps improve service quality and influences assignment priority",
    ratingLabel: "Provider rating",
    commentLabel: "Comment (optional)",
    commentPlaceholder: "Comments on work quality, communication, deadlines...",
    submit: "Submit rating",
    submitted: "Rating submitted",
    alreadyRated: "You have already rated this provider for this mission",
    prestataire: "Provider",
  },
} as const;

export function AdminRatingSection({
  mission,
  lang = "fr",
  onRatingSubmitted,
}: AdminRatingSectionProps) {
  const t = TEXT[lang];
  const [rating, setRating] = useState<number>(mission.noteAdminPourPrestataire || 0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!mission.noteAdminPourPrestataire);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert(lang === "fr" ? "Veuillez sélectionner une note" : "Please select a rating");
      return;
    }

    setSubmitting(true);

    try {
      const missionId = (mission as any).dbId || mission.id;
      const res = await fetch(`/api/admin/missions/${missionId}/rate-provider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteAdminPourPrestataire: rating,
          commentaireAdminPourPrestataire: comment,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        alert(lang === "fr" ? "✅ Évaluation soumise avec succès !" : "✅ Rating submitted successfully!");
        onRatingSubmitted();
      } else {
        alert(data.error || (lang === "fr" ? "Erreur lors de la soumission" : "Error submitting rating"));
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert(lang === "fr" ? "Erreur lors de la soumission" : "Error submitting rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h3 className="font-heading text-lg font-semibold text-green-900">
            {t.submitted}
          </h3>
        </div>
        <p className="text-sm text-green-700 mb-2">
          {t.prestataire}: <span className="font-semibold">{mission.prestataireRef || "N/A"}</span>
        </p>
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= rating
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              }`}
            />
          ))}
          <span className="ml-2 text-sm text-green-700">({rating}/5)</span>
        </div>
        {comment && (
          <p className="mt-3 text-sm text-green-800 italic">"{comment}"</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold text-purple-900 mb-1">
          {t.title}
        </h3>
        <p className="text-sm text-purple-700">{t.subtitle}</p>
        <p className="text-xs text-purple-600 mt-1">
          {t.prestataire}: <span className="font-semibold">{mission.prestataireRef || "N/A"}</span>
        </p>
      </div>

      {/* Sélection de la note */}
      <div>
        <label className="block text-sm font-medium text-purple-900 mb-2">
          {t.ratingLabel} *
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= rating
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300 hover:text-yellow-400"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-purple-700">
            ({rating}/5)
          </span>
        </div>
      </div>

      {/* Commentaire */}
      <div>
        <label className="block text-sm font-medium text-purple-900 mb-2">
          {t.commentLabel}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.commentPlaceholder}
          rows={3}
          className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
      </div>

      {/* Bouton de soumission */}
      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full px-6 py-2 bg-purple-600 text-white text-sm font-semibold rounded-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? lang === "fr" ? "Soumission..." : "Submitting..."
          : t.submit}
      </button>
    </div>
  );
}

