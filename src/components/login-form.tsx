"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { signIn } from "@/app/actions";

type State = { ok: boolean; message: string } | null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(signIn, null);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <LockKeyhole className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-3xl font-semibold text-stone-950">Admin Login</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Melde dich mit dem lokalen Admin-Benutzer aus deiner <code>.env.local</code> an.
        </p>
      </div>

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
          className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        />
      </label>

      {state?.message ? <p className="text-sm font-medium text-red-700">{state.message}</p> : null}

      <button
        className="h-12 rounded-md bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "Meldet an..." : "Einloggen"}
      </button>
    </form>
  );
}
