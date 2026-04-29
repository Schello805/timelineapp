"use client";

import { Copy } from "lucide-react";
import { duplicateAnnualMetricAction } from "@/app/actions";

export function DuplicateAnnualMetricForm({ id, label, year }: { id: string; label: string; year: string }) {
  return (
    <form action={duplicateAnnualMetricAction}>
      <input type="hidden" name="id" value={id} />
      <button
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-800 hover:bg-stone-50"
        title="Jahreskennzahl duplizieren"
        aria-label={`${label} für ${year} duplizieren`}
      >
        <Copy className="h-4 w-4" />
      </button>
    </form>
  );
}
