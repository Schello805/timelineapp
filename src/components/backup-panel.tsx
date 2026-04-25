"use client";

import { useActionState } from "react";
import { Download, RotateCcw, UploadCloud } from "lucide-react";
import { restoreTimelineBackupAction } from "@/app/actions";

type State = { ok: boolean; message: string } | null;

export function BackupPanel() {
  const [state, formAction, pending] = useActionState<State, FormData>(restoreTimelineBackupAction, null);

  return (
    <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-stone-950">Backup & Restore</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Exportiert Ereignisse und lokale Uploads als JSON. Beim Wiederherstellen wird die aktuelle Timeline ersetzt.
        </p>
      </div>

      <a
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
        href="/admin/backup/export"
      >
        <Download className="h-4 w-4" />
        JSON-Backup herunterladen
      </a>

      <form action={formAction} className="grid gap-3 border-t border-stone-200 pt-4">
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Backup-Datei
          <input
            className="rounded-md border border-stone-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            name="backup_file"
            type="file"
            accept="application/json,.json"
            required
          />
        </label>

        <label className="flex gap-2 text-sm leading-6 text-stone-700">
          <input className="mt-1 h-4 w-4 accent-teal-700" name="confirm_restore" type="checkbox" value="yes" required />
          Ich weiß, dass die aktuelle Timeline durch dieses Backup ersetzt wird.
        </label>

        {state?.message ? (
          <p className={state.ok ? "text-sm font-medium text-teal-700" : "text-sm font-medium text-red-700"}>
            {state.message}
          </p>
        ) : null}

        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          disabled={pending}
        >
          {pending ? <RotateCcw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {pending ? "Stellt wieder her..." : "Backup wiederherstellen"}
        </button>
      </form>
    </section>
  );
}
