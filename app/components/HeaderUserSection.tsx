"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Settings } from "lucide-react";

type AuthState = {
  loading: boolean;
  authenticated: boolean;
  userEmail?: string;
  role?: "client" | "admin" | "prestataire";
  prestataireId?: number | null;
};

export default function HeaderUserSection() {
  const [auth, setAuth] = useState<AuthState>({
    loading: true,
    authenticated: false,
  });

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function fetchAuth() {
      try {
        const res = await fetch("/api/auth/me", { 
          cache: "no-store",
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        // Vérifier si la réponse est OK, sinon traiter comme non authentifié
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        if (!cancelled) {
          setAuth({
            loading: false,
            authenticated: !!data?.authenticated,
            userEmail: data?.user?.email,
            role: data?.user?.role,
            prestataireId: data?.user?.prestataireId,
          });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'authentification:", error);
        if (!cancelled) {
          setAuth({ loading: false, authenticated: false });
        }
      }
    }

    fetchAuth();
    
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const handleStorageChange = () => {
      fetch("/api/auth/me", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          setAuth({
            loading: false,
            authenticated: !!data?.authenticated,
            userEmail: data?.user?.email,
            role: data?.user?.role,
            prestataireId: data?.user?.prestataireId,
          });
        })
        .catch(() => {
          setAuth({ loading: false, authenticated: false });
        });
    };

    window.addEventListener("focus", handleStorageChange);
    
    return () => {
      window.removeEventListener("focus", handleStorageChange);
    };
  }, []);

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setAuth({ loading: false, authenticated: false });
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
      setAuth({ loading: false, authenticated: false });
      router.push("/");
      router.refresh();
    }
  }

  if (auth.loading) {
    return (
      <div className="h-8 w-24 rounded-full bg-[#F2F2F5] animate-pulse" />
    );
  }

  if (!auth.authenticated) {
    return (
      <Link
        href="/connexion"
        className="rounded-full border border-[#0B2135] px-3 py-1.5 text-xs font-semibold text-[#0B2135] hover:bg-[#0B2135] hover:text-white transition"
      >
        Connexion
      </Link>
    );
  }

  const onClientSpace = pathname?.startsWith("/espace-client");
  const onAdminSpace = pathname?.startsWith("/admin");
  const onPrestataireSpace = pathname?.startsWith("/prestataires/espace");

  return (
    <div className="flex items-center gap-2">
      {/* Bouton selon le rôle */}
      {auth.role === "client" && !onClientSpace && (
        <Link
          href="/espace-client"
          className="rounded-full bg-[#0B2135] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0B2135] transition"
        >
          Mon espace
        </Link>
      )}

      {auth.role === "admin" && !onAdminSpace && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#D4A657] px-3 py-1.5 text-xs font-semibold text-[#0B2135] hover:brightness-95 transition"
        >
          <Settings className="w-3.5 h-3.5" />
          Admin
        </Link>
      )}

      {auth.role === "prestataire" && !onPrestataireSpace && (
        <Link
          href="/prestataires/espace"
          className="rounded-full bg-[#0B2135] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0B2135] transition"
        >
          Mon espace
        </Link>
      )}
      
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-[#0B2135] px-3 py-1.5 text-xs font-semibold text-[#0B2135] hover:bg-[#0B2135] hover:text-white transition"
      >
        Déconnexion
      </button>
    </div>
  );
}
