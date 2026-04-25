import { ChangePasswordForm } from "@/components/change-password-form";

export default function AdminSecurityPage() {
  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-950">Sicherheit</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Hier änderst du den Admin-Zugang getrennt von der Inhaltsverwaltung.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
