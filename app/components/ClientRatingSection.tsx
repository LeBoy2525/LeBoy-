"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { Mission } from "@/lib/types";

interface ClientRatingSectionProps {
  mission: Mission;
  lang?: "fr" | "en";
  onRatingSubmitted: () => void;
}

const TEXT = {
  fr: {
    title: "Évaluez votre expérience avec LeBoy",
    subtitle: "Votre avis nous aide à améliorer nos services",
    ratingLabel: "Note",
    commentLabel: "Commentaire (optionnel)",
    commentPlaceholder: "Partagez votre expérience, vos suggestions...",
    submit: "Soumettre l'évaluation",
    submitted: "Merci pour votre évaluation !",
    alreadyRated: "Vous avez déjà évalué cette mission",
  },
  en: {
    title: "Rate your experience with LeBoy",
    subtitle: "Your feedback helps us improve our services",
    ratingLabel: "Rating",
    commentLabel: "Comment (optional)",
    commentPlaceholder: "Share your experience, suggestions...",
    submit: "Submit rating",
    submitted: "Thank you for your rating!",
    alreadyRated: "You have already rated this mission",
  },
} as const;

export function ClientRatingSection({
  mission,
  lang = "fr",
  onRatingSubmitted,
}: ClientRatingSectionProps) {
  const t = TEXT[lang];
  const [rating, setRating] = useState<number>(mission.noteICD || 0);
  const [comment, setComment] = useState<string>(mission.commentaireICD || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!mission.noteICD);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert(lang === "fr" ? "Veuillez sélectionner une note" : "Please select a rating");
      return;
    }

    setSubmitting(true);

    try {
      const missionId = (mission as any).dbId || mission.id;
      const res = await fetch(`/api/espace-client/missions/${missionId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteICD: rating,
          commentaireICD: comment,
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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold text-blue-900 mb-1">
          {t.title}
        </h3>
        <p className="text-sm text-blue-700">{t.subtitle}</p>
      </div>

      {/* Sélection de la note */}
      <div>
        <label className="block text-sm font-medium text-blue-900 mb-2">
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
          <span className="ml-2 text-sm text-blue-700">
            ({rating}/5)
          </span>
        </div>
      </div>

      {/* Commentaire */}
      <div>
        <label className="block text-sm font-medium text-blue-900 mb-2">
          {t.commentLabel}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.commentPlaceholder}
          rows={3}
          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Bouton de soumission */}
      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? lang === "fr" ? "Soumission..." : "Submitting..."
          : t.submit}
      </button>
    </div>
  );
}

