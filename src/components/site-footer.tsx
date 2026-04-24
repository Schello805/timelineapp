import Link from "next/link";
import { AppLogo } from "@/components/app-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-8 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <AppLogo compact />
          <p>Frei nutzbar fuer nicht-kommerzielle Projekte.</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Rechtsdokumente">
          <Link className="hover:text-stone-950" href="/impressum">
            Impressum
          </Link>
          <Link className="hover:text-stone-950" href="/datenschutz">
            Datenschutz
          </Link>
          <Link className="hover:text-stone-950" href="/cookies">
            Cookiehinweise
          </Link>
        </nav>
      </div>
    </footer>
  );
}
