"use client";

import { Building2, User } from "lucide-react";

interface PrestataireTypeBadgeProps {
  type: "entreprise" | "freelance";
  lang?: "fr" | "en";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "minimal";
}

const TEXT = {
  fr: {
    entreprise: "Entreprise",
    freelance: "Freelance",
  },
  en: {
    entreprise: "Company",
    freelance: "Freelance",
  },
} as const;

export function PrestataireTypeBadge({
  type,
  lang = "fr",
  size = "md",
  variant = "default",
}: PrestataireTypeBadgeProps) {
  const t = TEXT[lang];
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const baseClasses = `inline-flex items-center font-semibold rounded-md transition ${
    sizeClasses[size]
  }`;

  if (variant === "minimal") {
    return (
      <span className={`${baseClasses} text-[#6B7280]`}>
        {type === "entreprise" ? (
          <Building2 className={iconSizes[size]} />
        ) : (
          <User className={iconSizes[size]} />
        )}
        <span>{t[type]}</span>
      </span>
    );
  }

  if (variant === "outline") {
    return (
      <span
        className={`${baseClasses} border-2 ${
          type === "entreprise"
            ? "border-blue-500 text-blue-700 bg-blue-50"
            : "border-green-500 text-green-700 bg-green-50"
        }`}
      >
        {type === "entreprise" ? (
          <Building2 className={iconSizes[size]} />
        ) : (
          <User className={iconSizes[size]} />
        )}
        <span>{t[type]}</span>
      </span>
    );
  }

  // Default variant
  return (
    <span
      className={`${baseClasses} ${
        type === "entreprise"
          ? "bg-blue-100 text-blue-800 border border-blue-200"
          : "bg-green-100 text-green-800 border border-green-200"
      }`}
    >
      {type === "entreprise" ? (
        <Building2 className={iconSizes[size]} />
      ) : (
        <User className={iconSizes[size]} />
      )}
      <span>{t[type]}</span>
    </span>
  );
}

