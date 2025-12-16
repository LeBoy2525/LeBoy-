"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type AuthState = {
  role?: "client" | "admin" | "prestataire";
  loading: boolean;
};

export default function HeaderNav() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState>({ loading: true });

  useEffect(() => {
    async function fetchAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (data?.authenticated) {
          setAuth({ role: data?.user?.role, loading: false });
        } else {
          setAuth({ loading: false });
        }
      } catch {
        setAuth({ loading: false });
      }
    }
    fetchAuth();
  }, [pathname]);

  return (
    <nav className="flex items-center gap-4 text-sm text-[#0A1B2A]">
      <Link href="/" className="hover:text-[#C8A55F]">
        Accueil
      </Link>
      <Link href="/services" className="hover:text-[#C8A55F]">
        Services
      </Link>
      <Link href="/apropos" className="hover:text-[#C8A55F]">
        À propos
      </Link>
      <Link href="/faq" className="hover:text-[#C8A55F]">
        FAQ
      </Link>
      <Link href="/contact" className="hover:text-[#C8A55F]">
        Contact
      </Link>

      {/* Lien admin - SEULEMENT visible pour les admins connectés */}
      {!auth.loading && auth.role === "admin" && (
        <Link
          href="/admin"
          className="text-sm font-medium text-[#4B4F58] hover:text-[#0A1B2A] transition"
        >
          Administration
        </Link>
      )}
    </nav>
  );
}
