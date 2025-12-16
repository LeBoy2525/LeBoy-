"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StagingAccessPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/staging-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok) {
        // Rediriger vers la page d'accueil
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Code incorrect");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F2] px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#0B2135] mb-2">
            Accès Staging
          </h1>
          <p className="text-[#4B4F58]">
            Entrez le code d'accès pour continuer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-[#0B2135] mb-2">
              Code d'accès
            </label>
            <input
              id="code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-2 border border-[#DDDDDD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A657] focus:border-transparent"
              placeholder="Entrez le code"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4A657] text-[#0B2135] font-semibold py-2 px-4 rounded-lg hover:bg-[#C49647] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Vérification..." : "Accéder"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#6B7280]">
          <p>Cet environnement est réservé aux tests.</p>
        </div>
      </div>
    </div>
  );
}

