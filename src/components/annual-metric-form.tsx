"use client";

import { useActionState } from "react";
import { BarChart3 } from "lucide-react";
import { upsertAnnualMetricAction } from "@/app/actions";
import type { AnnualMetric } from "@/lib/types";

type State = { ok: boolean; message: string } | null;

export function AnnualMetricForm({ metric }: { metric?: AnnualMetric }) {
  const [state, formAction, pending] = useActionState<State, FormData>(upsertAnnualMetricAction, null);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      {metric?.id ? <input type="hidden" name="id" defaultValue={metric.id} /> : null}

      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-stone-950">
          <BarChart3 className="h-5 w-5 text-teal-700" />
          {metric ? "Jahreskennzahl bearbeiten" : "Neue Jahreskennzahl"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Eine Kennzahl gehört immer zu genau einem Jahr. Optional kannst du einen zweiten Vergleichswert ergänzen,
          aus dem die Timeline automatisch die Quote berechnet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Jahr
          <input
            name="year"
            required
            defaultValue={metric?.year ?? ""}
            placeholder="2026"
            className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Reihenfolge
          <input
            name="display_order"
            type="number"
            min="0"
            defaultValue={metric?.display_order ?? 0}
            className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        Bezeichnung
        <input
          name="label"
          required
          defaultValue={metric?.label ?? ""}
          placeholder="Geflüchtete Ukrainer"
          className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Hauptwert
          <input
            name="value"
            type="number"
            step="0.01"
            required
            defaultValue={metric?.value ?? ""}
            className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Einheit
          <input
            name="unit"
            defaultValue={metric?.unit ?? ""}
            placeholder="Personen"
            className="h-11 rounded-md border border-stone-300 px-3 outline-none focus:border-teal-700"
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <p className="text-sm font-semibold text-stone-900">Optionaler Vergleichswert</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Vergleichsbezeichnung
            <input
              name="comparison_label"
              defaultValue={metric?.comparison_label ?? ""}
              placeholder="davon berufstätig"
              className="h-11 rounded-md border border-stone-300 bg-white px-3 outline-none focus:border-teal-700"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Vergleichswert
            <input
              name="comparison_value"
              type="number"
              step="0.01"
              defaultValue={metric?.comparison_value ?? ""}
              className="h-11 rounded-md border border-stone-300 bg-white px-3 outline-none focus:border-teal-700"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-stone-800 sm:max-w-[12rem]">
          Vergleichseinheit
          <input
            name="comparison_unit"
            defaultValue={metric?.comparison_unit ?? ""}
            placeholder="Personen"
            className="h-11 rounded-md border border-stone-300 bg-white px-3 outline-none focus:border-teal-700"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        Zusatzinfo
        <textarea
          name="description"
          rows={3}
          defaultValue={metric?.description ?? ""}
          placeholder="Optional: kurze Einordnung zur Kennzahl"
          className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-teal-700"
        />
      </label>

      {state?.message ? (
        <p className={state.ok ? "text-sm font-medium text-teal-700" : "text-sm font-medium text-red-700"}>
          {state.message}
        </p>
      ) : null}

      <button
        className="h-12 rounded-md bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "Speichert..." : metric ? "Jahreskennzahl aktualisieren" : "Jahreskennzahl erstellen"}
      </button>
    </form>
  );
}
