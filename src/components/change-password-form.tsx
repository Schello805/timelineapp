"use client";

import { useActionState } from "react";
import { updateAdminPassword } from "@/app/actions";

type State = { ok: boolean; message: string } | null;

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(updateAdminPassword, null);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-stone-950">Passwort ändern</h2>
      <input
        className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        name="current_password"
        type="password"
        placeholder="Aktuelles Passwort"
        required
      />
      <input
        className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        name="next_password"
        type="password"
        placeholder="Neues Passwort"
        required
      />
      <input
        className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        name="confirm_password"
        type="password"
        placeholder="Neues Passwort wiederholen"
        required
      />
      {state?.message ? (
        <p className={state.ok ? "text-sm font-medium text-teal-700" : "text-sm font-medium text-red-700"}>
          {state.message}
        </p>
      ) : null}
      <button
        className="h-11 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "Speichert..." : "Passwort speichern"}
      </button>
    </form>
  );
}
