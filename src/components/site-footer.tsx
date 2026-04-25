import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { getAppRevision } from "@/lib/revision";

export function SiteFooter() {
  const revision = getAppRevision();

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-8 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <AppLogo compact />
          <p>
            Open Source von Michael Schellenberger. Frei nutzbar für nicht-kommerzielle Projekte.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500">
            <a
              className="inline-flex items-center gap-2 font-semibold text-stone-700 hover:text-stone-950"
              href="https://github.com/Schello805/timelineapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon />
              GitHub
            </a>
            <span>Rev. {revision}</span>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Rechtsdokumente">
          <Link className="font-semibold text-stone-800 hover:text-stone-950" href="/admin">
            Admin
          </Link>
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

function GitHubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.93c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.82-4.57 5.07.36.32.68.95.68 1.92v2.84c0 .27.18.59.69.49A10.1 10.1 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}
