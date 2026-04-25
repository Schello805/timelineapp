import { Pencil, Trash2 } from "lucide-react";
import { deleteTimelineEvent } from "@/app/actions";
import { formatEventDate } from "@/lib/timeline-format";
import type { TimelineEvent } from "@/lib/types";

export function EventList({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="grid gap-0">
        {events.map((event) => (
          <div key={event.id} className="grid gap-4 border-b border-stone-100 p-4 last:border-b-0 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-semibold text-teal-700">{formatEventDate(event.event_date)}</p>
              <h3 className="mt-1 text-lg font-semibold text-stone-950">{event.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">{event.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                href={`/admin/events/${event.id}`}
              >
                <Pencil className="h-4 w-4" />
                Bearbeiten
              </a>
              <form action={deleteTimelineEvent}>
                <input type="hidden" name="id" value={event.id} />
                <button className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
