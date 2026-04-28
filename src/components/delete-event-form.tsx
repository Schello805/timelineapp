"use client";

import { Trash2 } from "lucide-react";
import { deleteTimelineEvent } from "@/app/actions";

export function DeleteEventForm({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteTimelineEvent}
      onSubmit={(event) => {
        if (!window.confirm(`"${title}" wirklich löschen?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
        title="Ereignis löschen"
        aria-label={`${title} löschen`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
