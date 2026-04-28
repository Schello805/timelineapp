"use client";

import { Trash2 } from "lucide-react";
import { deleteAnnualMetricAction } from "@/app/actions";

export function DeleteAnnualMetricForm({ id, label, year }: { id: string; label: string; year: string }) {
  return (
    <form
      action={deleteAnnualMetricAction}
      onSubmit={(event) => {
        if (!window.confirm(`"${label}" für ${year} wirklich löschen?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
        <Trash2 className="h-4 w-4" />
        Löschen
      </button>
    </form>
  );
}
