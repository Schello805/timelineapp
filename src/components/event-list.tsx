"use client";

import { useActionState, useMemo, useState } from "react";
import { Copy, ExternalLink, Pencil, Save, Search, SlidersHorizontal } from "lucide-react";
import { duplicateTimelineEvent, quickUpdateTimelineEvent } from "@/app/actions";
import { DeleteEventForm } from "@/components/delete-event-form";
import { QrCodeButton } from "@/components/qr-code-button";
import { siteConfig } from "@/lib/env";
import { formatEventDate } from "@/lib/timeline-format";
import type { TimelineEvent } from "@/lib/types";

export function EventList({ events }: { events: TimelineEvent[] }) {
  const [query, setQuery] = useState("");
  const [importanceFilter, setImportanceFilter] = useState<"all" | "standard" | "important" | "milestone">("all");
  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesQuery =
        !normalizedQuery ||
        event.title.toLowerCase().includes(normalizedQuery) ||
        event.description.toLowerCase().includes(normalizedQuery) ||
        event.slug.toLowerCase().includes(normalizedQuery) ||
        event.event_date.includes(normalizedQuery);
      const matchesImportance = importanceFilter === "all" || (event.importance ?? "standard") === importanceFilter;
      return matchesQuery && matchesImportance;
    });
  }, [events, importanceFilter, query]);

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 bg-stone-50/80 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Titel, Beschreibung, Datum oder Slug suchen"
              className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-700"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "Alle"],
              ["standard", "Standard"],
              ["important", "Wichtig"],
              ["milestone", "Meilensteine"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  importanceFilter === value
                    ? "inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-3 text-sm font-semibold text-white"
                    : "inline-flex h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-teal-700 hover:text-teal-700"
                }
                onClick={() => setImportanceFilter(value as typeof importanceFilter)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-0">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="grid gap-3 border-b border-stone-100 p-4 last:border-b-0 xl:grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)]"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 xl:block">
              <p className="text-sm font-semibold leading-6 text-teal-700">{formatEventDate(event.event_date)}</p>
              <p className="text-xs font-medium leading-5 text-stone-500">{event.slug}</p>
            </div>

            <div className="grid min-w-0 gap-3">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold leading-7 text-stone-950">{event.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className={getImportanceClassName(event.importance)}>
                      {getImportanceLabel(event.importance)}
                    </span>
                    {event.image_url ? <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">Bild</span> : null}
                    {event.gallery_urls && event.gallery_urls !== "[]" && !event.image_url ? <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">Galerie</span> : null}
                    {event.video_url ? <span className="rounded bg-orange-50 px-2 py-1 text-orange-700">Video</span> : null}
                    {event.audio_url ? <span className="rounded bg-violet-50 px-2 py-1 text-violet-700">Audio</span> : null}
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

              <p className="max-w-3xl text-sm leading-6 text-stone-600">{event.description}</p>

              <QuickEditRow event={event} />
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 ? (
          <div className="p-5 text-sm leading-6 text-stone-500">Keine Ereignisse für diese Suche oder Filter gefunden.</div>
        ) : null}
      </div>
    </div>
  );
}

function QuickEditRow({ event }: { event: TimelineEvent }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<{ ok: boolean; message: string } | null, FormData>(
    quickUpdateTimelineEvent,
    null,
  );

  return (
    <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-800">Schnellbearbeitung</p>
          <p className="text-xs leading-5 text-stone-500">Datum, Titel und Stufe direkt in der Liste ändern.</p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Schließen" : "Öffnen"}
        </button>
      </div>

      {open ? (
        <form action={formAction} className="mt-3 grid gap-3">
          <input type="hidden" name="id" value={event.id} />
          <div className="grid gap-3 lg:grid-cols-[11rem_minmax(0,1fr)_12rem_auto]">
            <input
              type="date"
              name="event_date"
              defaultValue={event.event_date}
              className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
            />
            <input
              type="text"
              name="title"
              defaultValue={event.title}
              className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
            />
            <select
              name="importance"
              defaultValue={event.importance ?? "standard"}
              className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
            >
              <option value="standard">Standard</option>
              <option value="important">Wichtig</option>
              <option value="milestone">Meilenstein</option>
            </select>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
              disabled={pending}
            >
              <Save className="h-4 w-4" />
              {pending ? "Speichert..." : "Speichern"}
            </button>
          </div>
          {state?.message ? (
            <p className={state.ok ? "text-sm font-medium text-teal-700" : "text-sm font-medium text-red-700"}>
              {state.message}
            </p>
          ) : null}
        </form>
      ) : null}
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
