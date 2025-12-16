"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", labelFr: "Accueil", labelEn: "Home" },
  { href: "/services", labelFr: "Services", labelEn: "Services" },
  { href: "/apropos", labelFr: "À propos", labelEn: "About" },
  { href: "/faq", labelFr: "FAQ", labelEn: "FAQ" },
  { href: "/contact", labelFr: "Contact", labelEn: "Contact" },
];

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-6 text-sm text-[#0B2135]">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/" && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              "hover:text-[#D4A657] transition-colors" +
              (isActive ? " font-semibold text-[#0B2135]" : " text-[#4B4F58]")
            }
          >
            {link.labelFr}
          </Link>
        );
      })}
    </nav>
  );
}
