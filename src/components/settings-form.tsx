"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateTimelineSettings } from "@/app/actions";

type State = { ok: boolean; message: string } | null;

export function SettingsForm({ ownerName }: { ownerName: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(updateTimelineSettings, null);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-stone-800" htmlFor="timeline_owner_name">
          Name für die öffentliche Timeline
        </label>
        <input
          id="timeline_owner_name"
          name="timeline_owner_name"
          defaultValue={ownerName}
          required
          maxLength={100}
          className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        />
        <p className="text-sm leading-6 text-stone-600">
          Die öffentliche Überschrift lautet dann: <strong>Timeline für {ownerName}</strong>
        </p>
      </div>

      {state?.message ? (
        <p className={state.ok ? "text-sm font-medium text-teal-700" : "text-sm font-medium text-red-700"}>
          {state.message}
        </p>
      ) : null}

      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        disabled={pending}
      >
        <Save className="h-4 w-4" />
        {pending ? "Speichert..." : "Einstellungen speichern"}
      </button>
    </form>
  );
}

