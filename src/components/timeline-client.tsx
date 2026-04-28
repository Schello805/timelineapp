"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  ImageIcon,
  LinkIcon,
  Play,
  Search,
} from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AppLogo } from "@/components/app-logo";
import { VideoFrame } from "@/components/video-frame";
import type { TimelineEvent } from "@/lib/types";
import { formatEventDate, formatEventDateNumeric, getYear } from "@/lib/timeline-format";

type MediaFilter = "all" | "image" | "video" | "pdf";
type SortOrder = "asc" | "desc";
type TimelineZoom = "compact" | "normal" | "detail";
type TimelineMonth = {
  id: string;
  monthLabel: string;
  events: TimelineEvent[];
};
type TimelineYear = {
  id: string;
  year: string;
  events: TimelineEvent[];
  months: TimelineMonth[];
};

const zoomLevels: Array<{ id: TimelineZoom; label: string; descriptionLength: number }> = [
  { id: "compact", label: "Kompakt", descriptionLength: 120 },
  { id: "normal", label: "Monate", descriptionLength: 220 },
  { id: "detail", label: "Detail", descriptionLength: 520 },
];

export function TimelineClient({ events, ownerName }: { events: TimelineEvent[]; ownerName: string }) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [selectedImage, setSelectedImage] = useState<TimelineEvent | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [timelineZoom, setTimelineZoom] = useState<TimelineZoom>("compact");
  const [pinchScale, setPinchScale] = useState(1);
  const pinchRef = useRef<{ distance: number } | null>(null);

  const allEvents = useMemo(
    () => [...events].sort((a, b) => getTime(a.event_date) - getTime(b.event_date)),
    [events],
  );
  const filteredEvents = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return allEvents.filter((event) => {
      const matchesQuery =
        !normalizedQuery ||
        event.title.toLowerCase().includes(normalizedQuery) ||
        event.description.toLowerCase().includes(normalizedQuery) ||
        event.event_date.includes(normalizedQuery);
      const matchesMedia =
        mediaFilter === "all" ||
        (mediaFilter === "image" && Boolean(event.image_url)) ||
        (mediaFilter === "video" && Boolean(event.video_url)) ||
        (mediaFilter === "pdf" && Boolean(event.pdf_url));

      return matchesQuery && matchesMedia;
    });
  }, [allEvents, deferredQuery, mediaFilter]);
  const sortedEvents = useMemo(() => {
    const direction = sortOrder === "asc" ? 1 : -1;
    return [...filteredEvents].sort((a, b) => (getTime(a.event_date) - getTime(b.event_date)) * direction);
  }, [filteredEvents, sortOrder]);
  const yearNavigation = useMemo(() => buildYearNavigation(sortedEvents.length ? sortedEvents : allEvents), [
    allEvents,
    sortedEvents,
  ]);
  const timelineYears = useMemo(() => buildTimelineYears(sortedEvents), [sortedEvents]);

  useEffect(() => {
    const selectFromHash = () => {
      const eventKey = decodeURIComponent(window.location.hash.replace(/^#event-/, ""));
      if (!eventKey) return;

      const event = allEvents.find((item) => item.id === eventKey || item.slug === eventKey);
      if (!event) return;

      const target = document.querySelector<HTMLElement>(`[data-event-id="${event.id}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => setSelectedEvent(event), 180);
    };

    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [allEvents]);

  if (allEvents.length === 0) {
    return (
      <section className="min-h-[calc(100svh-4rem)] bg-[#f6f3ee]">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-8">
          <AppLogo />
          <div className="mt-10 rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Timeline</p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">Noch keine Ereignisse vorhanden.</h1>
            <p className="mt-3 max-w-xl leading-7 text-stone-650">
              Sobald im Admin-Bereich Inhalte angelegt sind, erscheint hier die Zeitliste.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function selectYear(year: string) {
    const target = document.querySelector<HTMLElement>(`[data-year-anchor="${year}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function changeZoom(nextZoom: TimelineZoom) {
    startTransition(() => setTimelineZoom(nextZoom));
  }

  function setZoomByDirection(direction: 1 | -1) {
    const currentIndex = zoomLevels.findIndex((item) => item.id === timelineZoom);
    const next = zoomLevels[Math.min(Math.max(currentIndex + direction, 0), zoomLevels.length - 1)];
    changeZoom(next.id);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    if (event.touches.length !== 2) return;
    pinchRef.current = { distance: getTouchDistance(event.touches) };
    setPinchScale(1);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    const pinch = pinchRef.current;
    if (!pinch || event.touches.length !== 2) return;

    event.preventDefault();
    const nextScale = getTouchDistance(event.touches) / pinch.distance;
    setPinchScale(clamp(nextScale, 0.84, 1.18));
  }

  function handleTouchEnd() {
    if (!pinchRef.current) return;

    if (pinchScale >= 1.11) {
      setZoomByDirection(1);
    } else if (pinchScale <= 0.89) {
      setZoomByDirection(-1);
    }

    pinchRef.current = null;
    setPinchScale(1);
  }

  return (
    <>
      <section className="min-h-[calc(100svh-4rem)] bg-[#f6f3ee]">
        <div className="border-b border-stone-200 bg-[#f6f3ee]/95 backdrop-blur md:sticky md:top-0 md:z-30">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2 sm:px-5 sm:py-3">
            <header className="flex items-center justify-between gap-3">
              <AppLogo compact label={`Timeline für ${ownerName}`} />
            </header>

            <div className="grid gap-2 rounded-lg border border-stone-200 bg-white p-2 shadow-sm xl:grid-cols-[1fr_auto_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  className="h-10 w-full rounded-md border border-stone-300 pl-9 pr-3 text-sm outline-none focus:border-teal-700"
                  placeholder="Titel, Beschreibung oder Datum suchen"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "Alle"],
                  ["image", "Bilder"],
                  ["video", "Videos"],
                  ["pdf", "PDFs"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={
                      mediaFilter === id
                        ? "h-10 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white"
                        : "h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700 hover:border-teal-700 hover:text-teal-700"
                    }
                    onClick={() => setMediaFilter(id as MediaFilter)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-md border border-stone-300 bg-stone-50 p-1">
                {[
                  ["asc", "Älteste zuerst"],
                  ["desc", "Neueste zuerst"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={
                      sortOrder === id
                        ? "h-9 rounded bg-stone-950 px-3 text-sm font-semibold text-white"
                        : "h-9 rounded px-3 text-sm font-semibold text-stone-700 hover:bg-white"
                    }
                    onClick={() => setSortOrder(id as SortOrder)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 rounded-lg border border-stone-200 bg-white px-2 py-1.5 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex flex-wrap gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {yearNavigation.map((item) => (
                  <button
                    key={item.year}
                    className="h-8 shrink-0 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-teal-700 hover:text-teal-700"
                    onClick={() => selectYear(item.year)}
                    aria-label={`Zum Jahr ${item.year} springen`}
                  >
                    {item.year}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <span className="text-xs font-medium text-stone-500 md:hidden">Pinch zum Zoomen</span>
                <span className="hidden text-xs font-medium text-stone-500 md:inline">Jahresansicht und Zoom</span>
                <div className="flex rounded-md border border-stone-300 bg-stone-50 p-1">
                  {zoomLevels.map((level) => (
                    <button
                      key={level.id}
                      className={
                        timelineZoom === level.id
                          ? "h-8 rounded bg-teal-700 px-3 text-xs font-semibold text-white"
                          : "h-8 rounded px-3 text-xs font-semibold text-stone-700 hover:bg-white"
                      }
                      onClick={() => changeZoom(level.id)}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-5 sm:py-8"
          animate={{ scale: pinchScale }}
          transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.9 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ touchAction: "pan-y" }}
        >
          {sortedEvents.length === 0 ? (
            <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm font-semibold text-stone-700 shadow-sm">
              Keine Ereignisse für diese Suche gefunden.
            </div>
          ) : (
            <div className="grid gap-8">
              {timelineYears.map((yearGroup) => (
                <YearSection
                  key={yearGroup.id}
                  group={yearGroup}
                  zoom={timelineZoom}
                  onOpenEvent={setSelectedEvent}
                  onOpenImage={setSelectedImage}
                />
              ))}
            </div>
          )}
        </motion.div>
      </section>

      <AnimatePresence>
        {selectedEvent ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/82 p-3 sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              className="max-h-[92svh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-7"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-teal-700">{formatEventDate(selectedEvent.event_date)}</p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight text-stone-950 sm:text-4xl">
                    {selectedEvent.title}
                  </h2>
                </div>
                <button
                  className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-50"
                  onClick={() => setSelectedEvent(null)}
                >
                  Schließen
                </button>
              </div>

              <div className="mt-5 text-sm leading-7 text-stone-700 sm:text-base">
                <RichDescription text={selectedEvent.description} />
              </div>

              <EventMediaStack event={selectedEvent} detail onOpenImage={setSelectedImage} />

              <div className="mt-5 flex flex-wrap gap-2">
                <CopyEventLinkButton event={selectedEvent} />
                {selectedEvent.pdf_url ? (
                  <a
                    className="inline-flex h-11 items-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-900 hover:bg-stone-50"
                    href={selectedEvent.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4" />
                    Dokument öffnen
                  </a>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {selectedImage ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/88 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute right-4 top-4 rounded-md bg-white px-3 py-2 text-sm font-semibold text-stone-950"
              onClick={() => setSelectedImage(null)}
            >
              Schließen
            </button>
            <div className="relative h-[80svh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
              <EventImage src={selectedImage.image_url ?? ""} alt={selectedImage.title} className="object-contain" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function YearSection({
  group,
  zoom,
  onOpenEvent,
  onOpenImage,
}: {
  group: TimelineYear;
  zoom: TimelineZoom;
  onOpenEvent: (event: TimelineEvent) => void;
  onOpenImage: (event: TimelineEvent) => void;
}) {
  return (
    <motion.section
      layout
      data-year-anchor={group.year}
      className="grid gap-3"
      transition={{ layout: { type: "spring", stiffness: 180, damping: 22 } }}
    >
      <div className="grid grid-cols-[minmax(4.5rem,5.5rem)_1.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[7rem_2rem_minmax(0,1fr)] sm:gap-4">
        <div className="pt-2 text-right">
          <p className="text-2xl font-semibold leading-none text-stone-950 sm:text-3xl">{group.year}</p>
        </div>
        <div className="relative flex justify-center">
          <div className="absolute bottom-[-0.75rem] top-0 w-px bg-gradient-to-b from-blue-700 via-teal-600 to-orange-500" />
          <span className="relative mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-stone-950 text-white ring-4 ring-[#f6f3ee]">
            <CalendarDays className="h-4 w-4" />
          </span>
        </div>
        {zoom === "compact" ? (
          <CompactYearCard events={group.events} onOpenEvent={onOpenEvent} />
        ) : (
          <div className="grid gap-4">
            {group.months.map((month) => (
              <MonthSection
                key={month.id}
                month={month}
                zoom={zoom}
                onOpenEvent={onOpenEvent}
                onOpenImage={onOpenImage}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

function CompactYearCard({
  events,
  onOpenEvent,
}: {
  events: TimelineEvent[];
  onOpenEvent: (event: TimelineEvent) => void;
}) {
  return (
    <motion.article layout className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-stone-950">
        {events.length} {events.length === 1 ? "Ereignis" : "Ereignisse"}
      </p>
      <div className="mt-3 grid gap-2">
        {events.map((event) => (
          <button
            key={event.id}
            data-event-id={event.id}
            className="grid gap-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-left transition hover:border-teal-700 hover:bg-white"
            onClick={() => onOpenEvent(event)}
          >
            <span className="text-sm font-semibold text-teal-700">{formatEventDateNumeric(event.event_date)}</span>
            <span className="text-base font-semibold leading-tight text-stone-950">{event.title}</span>
            <span className="line-clamp-2 text-sm leading-6 text-stone-600">{event.description}</span>
          </button>
        ))}
      </div>
    </motion.article>
  );
}

function MonthSection({
  month,
  zoom,
  onOpenEvent,
  onOpenImage,
}: {
  month: TimelineMonth;
  zoom: TimelineZoom;
  onOpenEvent: (event: TimelineEvent) => void;
  onOpenImage: (event: TimelineEvent) => void;
}) {
  return (
    <motion.div
      layout
      className="grid grid-cols-[minmax(4.5rem,5.5rem)_1.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[7rem_2rem_minmax(0,1fr)] sm:gap-4"
      transition={{ layout: { type: "spring", stiffness: 180, damping: 22 } }}
    >
      <div className="pt-2 text-right">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 sm:text-sm">{month.monthLabel}</p>
      </div>
      <div className="relative flex justify-center">
        <div className="absolute bottom-[-1rem] top-0 w-px bg-stone-300" />
        <span className="relative mt-1 h-3.5 w-3.5 rounded-full bg-teal-700 ring-4 ring-[#f6f3ee]" />
      </div>
      <div className="grid gap-3">
        {month.events.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            zoom={zoom}
            onOpenEvent={onOpenEvent}
            onOpenImage={onOpenImage}
          />
        ))}
      </div>
    </motion.div>
  );
}

function EventRow({
  event,
  zoom,
  onOpenEvent,
  onOpenImage,
}: {
  event: TimelineEvent;
  zoom: TimelineZoom;
  onOpenEvent: (event: TimelineEvent) => void;
  onOpenImage: (event: TimelineEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const zoomConfig = zoomLevels.find((item) => item.id === zoom) ?? zoomLevels[1];
  const isLongDescription = event.description.length > zoomConfig.descriptionLength;
  const description =
    expanded || !isLongDescription
      ? event.description
      : `${event.description.slice(0, zoomConfig.descriptionLength).trim()}...`;
  const detail = zoom === "detail";

  return (
    <motion.article
      layout
      data-event-id={event.id}
      className="grid gap-2 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4"
      transition={{ layout: { type: "spring", stiffness: 180, damping: 22 } }}
    >
      <button
        className="inline-flex h-fit items-center justify-start rounded-md px-0 py-2 text-left text-sm font-semibold text-stone-500 hover:text-teal-700"
        onClick={() => onOpenEvent(event)}
      >
        {formatEventDateNumeric(event.event_date)}-
      </button>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <button className="w-full text-left" onClick={() => onOpenEvent(event)}>
          <h2 className={detail ? "text-2xl font-semibold leading-tight text-stone-950" : "text-xl font-semibold leading-tight text-stone-950"}>
            {event.title}
          </h2>
        </button>

        <div className="mt-3 text-sm leading-6 text-stone-700 sm:text-base sm:leading-7">
          <RichDescription text={description} />
        </div>

        {isLongDescription ? (
          <button
            className="mt-2 text-sm font-semibold text-teal-700 hover:text-teal-900"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
          </button>
        ) : null}

        {zoom === "detail" ? (
          <EventMediaStack event={event} detail onOpenImage={onOpenImage} />
        ) : (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {event.image_url ? <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Bild</span> : null}
            {event.video_url ? <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">Video</span> : null}
            {event.pdf_url ? <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">PDF</span> : null}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
            onClick={() => onOpenEvent(event)}
          >
            <ChevronRight className="h-4 w-4" />
            Bericht öffnen
          </button>
          <CopyEventLinkButton event={event} />
          {event.video_url ? (
            <button
              className="inline-flex h-11 items-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-900 hover:bg-stone-50"
              onClick={() => onOpenEvent(event)}
            >
              <Play className="h-4 w-4 fill-current" />
              Video ansehen
            </button>
          ) : null}
          {event.pdf_url ? (
            <a
              className="inline-flex h-11 items-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-900 hover:bg-stone-50"
              href={event.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="h-4 w-4" />
              Dokument öffnen
            </a>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

function EventMediaStack({
  event,
  detail = false,
  onOpenImage,
}: {
  event: TimelineEvent;
  detail?: boolean;
  onOpenImage: (event: TimelineEvent) => void;
}) {
  if (!event.image_url && !event.video_url) return null;

  return (
    <div className={detail ? "mt-5 grid gap-4" : "mt-4 grid gap-3"}>
      {event.image_url ? (
        <button
          className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100"
          onClick={() => onOpenImage(event)}
          aria-label={`${event.title} als grosses Bild öffnen`}
        >
          <EventImage
            src={event.image_url}
            alt={event.title}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-stone-900 shadow-sm">
            <ImageIcon className="h-5 w-5" />
          </span>
        </button>
      ) : null}

      {event.video_url ? (
        <div className="aspect-video overflow-hidden rounded-xl bg-black">
          <VideoFrame url={event.video_url} title={event.title} />
        </div>
      ) : null}
    </div>
  );
}

function EventImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-stone-100 px-5 text-center text-sm font-semibold text-stone-500">
        <ImageIcon className="h-7 w-7 text-stone-400" />
        Bild konnte nicht geladen werden
      </span>
    );
  }

  return (
    // Event images may come from arbitrary external URLs. A plain img avoids Next image domain 400s.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`h-full w-full ${className ?? ""}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function CopyEventLinkButton({ event }: { event: TimelineEvent }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/ereignis/${encodeURIComponent(event.slug || event.id)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="inline-flex h-11 items-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-900 hover:bg-stone-50"
      onClick={copyLink}
    >
      <LinkIcon className="h-4 w-4" />
      {copied ? "Link kopiert" : "Link kopieren"}
    </button>
  );
}

function RichDescription({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap">
      {splitTextWithLinks(text).map((part, index) =>
        part.type === "link" ? (
          <a
            key={`${part.value}-${index}`}
            className="font-medium text-teal-700 underline decoration-teal-300 underline-offset-2 hover:text-teal-900"
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
          >
            {part.value}
          </a>
        ) : (
          <span key={`${part.value}-${index}`}>{part.value}</span>
        ),
      )}
    </div>
  );
}

function splitTextWithLinks(text: string) {
  const matches = text.match(/https?:\/\/[^\s]+/g);
  if (!matches) {
    return [{ type: "text" as const, value: text }];
  }

  const parts: Array<{ type: "text" | "link"; value: string }> = [];
  let remaining = text;

  for (const match of matches) {
    const index = remaining.indexOf(match);
    if (index > 0) {
      parts.push({ type: "text", value: remaining.slice(0, index) });
    }
    parts.push({ type: "link", value: match });
    remaining = remaining.slice(index + match.length);
  }

  if (remaining) {
    parts.push({ type: "text", value: remaining });
  }

  return parts;
}

function buildYearNavigation(events: TimelineEvent[]) {
  const years = new Map<string, { year: string; firstEvent: TimelineEvent }>();

  for (const event of events) {
    const year = getYear(event.event_date);
    if (!years.has(year)) {
      years.set(year, { year, firstEvent: event });
    }
  }

  return [...years.values()];
}

function buildTimelineYears(events: TimelineEvent[]) {
  const years = new Map<string, TimelineYear>();

  for (const event of events) {
    const date = parseEventDate(event.event_date);
    const year = String(date.getFullYear());
    const monthKey = String(date.getMonth() + 1).padStart(2, "0");
    const monthId = `${year}-${monthKey}`;
    const existingYear = years.get(year);

    if (!existingYear) {
      years.set(year, {
        id: year,
        year,
        events: [event],
        months: [
          {
            id: monthId,
            monthLabel: formatMonth(date),
            events: [event],
          },
        ],
      });
      continue;
    }

    existingYear.events.push(event);
    const existingMonth = existingYear.months.find((item) => item.id === monthId);
    if (existingMonth) {
      existingMonth.events.push(event);
    } else {
      existingYear.months.push({
        id: monthId,
        monthLabel: formatMonth(date),
        events: [event],
      });
    }
  }

  return [...years.values()];
}

function getTouchDistance(touches: React.TouchList) {
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) return 1;

  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

function parseEventDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date(`${date.slice(0, 4)}-01-01`) : parsed;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("de-DE", { month: "long" }).format(date);
}

function getTime(date: string) {
  return parseEventDate(date).getTime();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
