"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ExternalLink, Settings, Shield, TableProperties } from "lucide-react";

const menuItems = [
  {
    href: "/admin",
    label: "Verwaltung",
    description: "Ereignisse und Medien",
    icon: TableProperties,
  },
  {
    href: "/admin/kennzahlen",
    label: "Kennzahlen",
    description: "Jahreswerte und Quoten",
    icon: BarChart3,
  },
  {
    href: "/admin/einstellungen",
    label: "App-Einstellungen",
    description: "Name, Darstellung und Backups",
    icon: Settings,
  },
  {
    href: "/admin/sicherheit",
    label: "Sicherheit",
    description: "Admins und Passwörter",
    icon: Shield,
  },
];

export function AdminMenu() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2 md:grid-cols-2 xl:grid-cols-5" aria-label="Admin-Menü">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            className={
              active
                ? "rounded-lg border border-stone-950 bg-stone-950 px-4 py-3 text-white shadow-sm"
                : "rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-850 shadow-sm hover:border-teal-700 hover:text-teal-800"
            }
            href={item.href}
          >
            <span className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap">
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        );
      })}

      <Link
        className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-850 shadow-sm hover:border-teal-700 hover:text-teal-800"
        href="/"
      >
        <span className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap">
          <ExternalLink className="h-4 w-4" />
          Öffentliche Timeline
        </span>
      </Link>
    </nav>
  );
}
