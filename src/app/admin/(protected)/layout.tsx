import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { AppLogo } from "@/components/app-logo";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/auth";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-12">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h1 className="text-2xl font-semibold">Admin-Zugang fehlt noch</h1>
          <p className="mt-3 leading-7">
            Lege eine <code>.env.local</code> anhand von <code>.env.example</code> an und setze
            <code> ADMIN_EMAIL</code>, <code> ADMIN_PASSWORD</code> und <code> ADMIN_SESSION_SECRET</code>.
            Danach ist der lokale Admin-Bereich aktiv.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center rounded-md bg-amber-950 px-4 text-sm font-semibold text-white"
            href="/"
          >
            Timeline ansehen
          </Link>
        </div>
      </main>
    );
  }

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2">
          <AppLogo compact />
          <nav className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link className="text-teal-700 hover:text-teal-900" href="/">
              Öffentliche Timeline
            </Link>
            <Link className="text-teal-700 hover:text-teal-900" href="/admin">
              Inhalte
            </Link>
            <Link className="text-teal-700 hover:text-teal-900" href="/admin/einstellungen">
              Einstellungen
            </Link>
            <Link className="text-teal-700 hover:text-teal-900" href="/admin/sicherheit">
              Sicherheit
            </Link>
          </nav>
          <h1 className="mt-2 text-3xl font-semibold text-stone-950">Admin Dashboard</h1>
        </div>
        <form action={signOut}>
          <button className="h-10 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-800 hover:bg-white">
            Ausloggen
          </button>
        </form>
      </header>
      {children}
    </main>
  );
}
