"use client";

import { useActionState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { createAdminUserAction, deleteAdminUserAction } from "@/app/actions";
import type { AdminUser } from "@/lib/types";

type State = { ok: boolean; message: string } | null;

export function AdminUsersPanel({ users }: { users: AdminUser[] }) {
  const [state, formAction, pending] = useActionState<State, FormData>(createAdminUserAction, null);

  return (
    <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-stone-950">Benutzerverwaltung</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Weitere Admins können hier lokal angelegt und verwaltet werden. Der erste Admin bleibt dauerhaft geschützt.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-stone-100 bg-stone-50 p-4">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col gap-3 rounded-md border border-stone-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-950">{user.email}</p>
              <p className="mt-1 text-xs text-stone-500">
                {user.is_primary ? "Primärer Admin" : "Zusätzlicher Admin"}
              </p>
            </div>

            {user.is_primary ? (
              <span className="inline-flex h-9 items-center rounded-md border border-stone-200 px-3 text-sm font-semibold text-stone-500">
                Nicht löschbar
              </span>
            ) : (
              <form action={deleteAdminUserAction}>
                <input type="hidden" name="user_id" value={user.id} />
                <button className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                  Entfernen
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      <form action={formAction} className="grid gap-3 border-t border-stone-200 pt-4">
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          E-Mail
          <input
            name="email"
            type="email"
            required
            className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Passwort
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
          />
          <span className="text-xs font-normal text-stone-500">Mindestens 8 Zeichen.</span>
        </label>

        {state?.message ? (
          <p className={state.ok ? "text-sm font-medium text-teal-700" : "text-sm font-medium text-red-700"}>
            {state.message}
          </p>
        ) : null}

        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
          disabled={pending}
        >
          <UserPlus className="h-4 w-4" />
          {pending ? "Legt an..." : "Admin hinzufügen"}
        </button>
      </form>
    </section>
  );
}
