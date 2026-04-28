import { Copy, ExternalLink, Pencil } from "lucide-react";
import { duplicateTimelineEvent } from "@/app/actions";
import { DeleteEventForm } from "@/components/delete-event-form";
import { QrCodeButton } from "@/components/qr-code-button";
import { siteConfig } from "@/lib/env";
import { formatEventDate } from "@/lib/timeline-format";
import type { TimelineEvent } from "@/lib/types";

export function EventList({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="grid gap-0">
        {events.map((event) => (
          <div
            key={event.id}
            className="grid gap-3 border-b border-stone-100 p-4 last:border-b-0 xl:grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)]"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 xl:block">
              <p className="text-sm font-semibold leading-6 text-teal-700">{formatEventDate(event.event_date)}</p>
              <p className="text-xs font-medium leading-5 text-stone-500">{event.slug}</p>
            </div>

            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold leading-7 text-stone-950">{event.title}</h3>
                <p className="mt-2 line-clamp-3 max-w-3xl text-sm leading-6 text-stone-600">
                  {event.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className={getImportanceClassName(event.importance)}>
                    {getImportanceLabel(event.importance)}
                  </span>
                  {event.image_url ? <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">Bild</span> : null}
                  {event.video_url ? <span className="rounded bg-orange-50 px-2 py-1 text-orange-700">Video</span> : null}
                  {event.pdf_url ? <span className="rounded bg-teal-50 px-2 py-1 text-teal-700">PDF</span> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-start gap-2 lg:max-w-56 lg:justify-end">
                <QrCodeButton url={`${siteConfig.url}/ereignis/${event.slug}`} title={event.title} />
                <a
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-800 hover:bg-stone-50"
                  href={`/ereignis/${event.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Öffentliche Ansicht öffnen"
                  aria-label={`${event.title} öffentlich öffnen`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-800 hover:bg-stone-50"
                  href={`/admin/events/${event.id}`}
                  title="Ereignis bearbeiten"
                  aria-label={`${event.title} bearbeiten`}
                >
                  <Pencil className="h-4 w-4" />
                </a>
                <form action={duplicateTimelineEvent}>
                  <input type="hidden" name="id" value={event.id} />
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-800 hover:bg-stone-50"
                    title="Ereignis duplizieren"
                    aria-label={`${event.title} duplizieren`}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </form>
                <DeleteEventForm id={event.id} title={event.title} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getImportanceLabel(importance: TimelineEvent["importance"]) {
  if (importance === "milestone") return "Meilenstein";
  if (importance === "important") return "Wichtig";
  return "Standard";
}

function getImportanceClassName(importance: TimelineEvent["importance"]) {
  if (importance === "milestone") return "rounded bg-orange-100 px-2 py-1 text-orange-800";
  if (importance === "important") return "rounded bg-amber-100 px-2 py-1 text-amber-800";
  return "rounded bg-stone-100 px-2 py-1 text-stone-700";
}
