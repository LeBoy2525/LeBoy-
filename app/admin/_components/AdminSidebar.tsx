"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  DollarSign,
  Globe,
  Settings,
  LogOut,
  Home,
  BarChart3,
  Bell,
} from "lucide-react";
import { useLanguage } from "../../components/LanguageProvider";

interface AdminSidebarProps {
  onClose?: () => void;
}

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelFr: string;
  labelEn: string;
  badge?: number;
}

interface NavSection {
  titleFr: string;
  titleEn: string;
  items: NavItem[];
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const navSections: NavSection[] = [
    {
      titleFr: "Vue d'ensemble",
      titleEn: "Overview",
      items: [
        {
          href: "/admin",
          icon: LayoutDashboard,
          labelFr: "Tableau de bord",
          labelEn: "Dashboard",
        },
      ],
    },
    {
      titleFr: "Gestion",
      titleEn: "Management",
      items: [
        {
          href: "/admin/demandes",
          icon: FileText,
          labelFr: "Demandes",
          labelEn: "Requests",
        },
        // Missions sont gérées via les demandes, pas besoin d'une page séparée
        // {
        //   href: "/admin/missions",
        //   icon: Briefcase,
        //   labelFr: "Missions",
        //   labelEn: "Missions",
        // },
        {
          href: "/admin/prestataires",
          icon: Users,
          labelFr: "Prestataires",
          labelEn: "Providers",
        },
      ],
    },
    {
      titleFr: "Finance",
      titleEn: "Finance",
      items: [
        {
          href: "/admin/finance",
          icon: DollarSign,
          labelFr: "Finance & Comptabilité",
          labelEn: "Finance & Accounting",
        },
        {
          href: "/admin/commissions",
          icon: BarChart3,
          labelFr: "Commissions",
          labelEn: "Commissions",
        },
      ],
    },
    {
      titleFr: "Paramètres",
      titleEn: "Settings",
      items: [
        {
          href: "/admin/pays",
          icon: Globe,
          labelFr: "Pays & Zones",
          labelEn: "Countries & Zones",
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Branding premium */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0A1B2A] rounded-md flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-semibold tracking-tight">LB</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 tracking-tight">
              {lang === "fr" ? "Administration LeBoy" : "LeBoy Administration"}
            </div>
            <div className="text-xs text-gray-500 font-light tracking-wide">
              {lang === "fr" ? "Centre de contrôle opérationnel" : "Operations control center"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-6">
            <div className="px-6 mb-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {lang === "fr" ? section.titleFr : section.titleEn}
              </h3>
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors
                      ${
                        active
                          ? "bg-gray-100 text-[#0A1B2A] border-r-2 border-[#0A1B2A]"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-[#0A1B2A]" : "text-gray-500"}`} />
                    <span className="flex-1">{lang === "fr" ? item.labelFr : item.labelEn}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-[#0A1B2A] text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="border-t border-gray-200 p-4 space-y-1">
        <Link
          href="/"
          onClick={handleLinkClick}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Home className="w-5 h-5 text-gray-500" />
          <span>{lang === "fr" ? "Retour à l'accueil" : "Back to home"}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-500" />
          <span>{lang === "fr" ? "Déconnexion" : "Logout"}</span>
        </button>
      </div>
    </div>
  );
}

