import { AdminUsersPanel } from "@/components/admin-users-panel";
import { ChangePasswordForm } from "@/components/change-password-form";
import { listAdminUsers } from "@/lib/db";

export default function AdminSecurityPage() {
  const users = listAdminUsers();

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div>
        <h2 className="text-xl font-semibold text-stone-950">Sicherheit</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Hier verwaltest du Admin-Zugänge und Passwörter getrennt von der Inhaltsverwaltung.
        </p>
      </div>
      <AdminUsersPanel users={users} />
      <ChangePasswordForm />
    </div>
  );
}
