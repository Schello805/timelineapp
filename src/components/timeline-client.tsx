"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText, ImageIcon, LinkIcon, Play, Search, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppLogo } from "@/components/app-logo";
import { VideoFrame } from "@/components/video-frame";
import type { TimelineEvent } from "@/lib/types";
import { formatEventDate, getYear } from "@/lib/timeline-format";

type MediaFilter = "all" | "image" | "video" | "pdf";
type SortOrder = "asc" | "desc";
type TimelineZoom = "compact" | "normal" | "detail";
type TimelineGroup = {
  id: string;
  year: string;
  month?: string;
  monthLabel?: string;
  events: TimelineEvent[];
};

const zoomLevels: Array<{ id: TimelineZoom; label: string; descriptionLength: number }> = [
  { id: "compact", label: "Kompakt", descriptionLength: 110 },
  { id: "normal", label: "Normal", descriptionLength: 260 },
  { id: "detail", label: "Detail", descriptionLength: 520 },
];
const pinchThreshold = 0.18;

export function TimelineClient({ events, ownerName }: { events: TimelineEvent[]; ownerName: string }) {
  const [selectedImage, setSelectedImage] = useState<TimelineEvent | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TimelineEvent | null>(null);
  const [query, setQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [timelineZoom, setTimelineZoom] = useState<TimelineZoom>("compact");
  const pinchRef = useRef<{ distance: number; zoom: TimelineZoom } | null>(null);

  const allEvents = useMemo(
    () => [...events].sort((a, b) => getTime(a.event_date) - getTime(b.event_date)),
    [events],
  );
  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

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
  }, [allEvents, mediaFilter, query]);
  const sortedEvents = useMemo(() => {
    const direction = sortOrder === "asc" ? 1 : -1;
    return [...filteredEvents].sort((a, b) => (getTime(a.event_date) - getTime(b.event_date)) * direction);
  }, [filteredEvents, sortOrder]);
  const timelineGroups = useMemo(() => buildTimelineGroups(sortedEvents, timelineZoom), [sortedEvents, timelineZoom]);
  const yearNavigation = useMemo(() => buildYearNavigation(sortedEvents.length ? sortedEvents : allEvents), [
    allEvents,
    sortedEvents,
  ]);

  const scrollToEvent = useCallback((id: string) => {
    const target = document.querySelector<HTMLElement>(`[data-event-id="${id}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const selectFromHash = () => {
      const eventKey = decodeURIComponent(window.location.hash.replace(/^#event-/, ""));
      if (!eventKey) return;

      const event = allEvents.find((item) => item.id === eventKey || item.slug === eventKey);
      if (!event) return;

      window.requestAnimationFrame(() => scrollToEvent(event.id));
    };

    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [allEvents, scrollToEvent]);

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
    const event = yearNavigation.find((item) => item.year === year)?.firstEvent;
    if (!event) return;

    scrollToEvent(event.id);
  }

  function setZoomByDirection(direction: 1 | -1, startZoom = timelineZoom) {
    const currentIndex = zoomLevels.findIndex((item) => item.id === startZoom);
    const next = zoomLevels[Math.min(Math.max(currentIndex + direction, 0), zoomLevels.length - 1)];
    setTimelineZoom(next.id);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    if (event.touches.length !== 2) return;

    pinchRef.current = {
      distance: getTouchDistance(event.touches),
      zoom: timelineZoom,
    };
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    const pinch = pinchRef.current;
    if (!pinch || event.touches.length !== 2) return;

    event.preventDefault();
    const scale = getTouchDistance(event.touches) / pinch.distance;
    const direction = scale > 1 + pinchThreshold ? 1 : scale < 1 - pinchThreshold ? -1 : 0;
    if (!direction) return;

    setZoomByDirection(direction, pinch.zoom);
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLElement>) {
    if (event.touches.length < 2) {
      pinchRef.current = null;
    }
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

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm text-stone-600 shadow-sm">
              {yearNavigation.length > 1 ? (
                <div className="hidden gap-2 overflow-x-auto [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
                  {yearNavigation.map((item) => (
                    <button
                      key={item.year}
                      className="h-8 shrink-0 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-teal-700 hover:text-teal-700"
                      onClick={() => selectYear(item.year)}
                      aria-label={`Zum Jahr ${item.year} springen`}
                    >
                      {item.year}
                      <span className="ml-2 text-stone-400">{item.count}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="hidden text-xs font-medium md:inline">Pinch zum Zoomen</span>
              )}
              <span className="text-xs font-medium md:hidden">Pinch zum Zoomen</span>
              <div className="flex rounded-md border border-stone-300 bg-stone-50 p-1">
                {zoomLevels.map((level) => (
                  <button
                    key={level.id}
                    className={
                      timelineZoom === level.id
                        ? "h-8 rounded bg-teal-700 px-3 text-xs font-semibold text-white"
                        : "h-8 rounded px-3 text-xs font-semibold text-stone-700 hover:bg-white"
                    }
                    onClick={() => setTimelineZoom(level.id)}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {yearNavigation.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
                {yearNavigation.map((item) => (
                  <button
                    key={item.year}
                    className="h-8 shrink-0 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-teal-700 hover:text-teal-700"
                    onClick={() => selectYear(item.year)}
                    aria-label={`Zum Jahr ${item.year} springen`}
                  >
                    {item.year}
                    <span className="ml-2 text-stone-400">{item.count}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="mx-auto w-full max-w-5xl px-5 py-6 sm:py-8"
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
            <VerticalTimeline
              groups={timelineGroups}
              zoom={timelineZoom}
              onImage={setSelectedImage}
              onVideo={setSelectedVideo}
            />
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedImage ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/88 p-4"
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

        {selectedVideo ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/88 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVideo(null)}
          >
            <button
              className="absolute right-4 top-4 rounded-md bg-white px-3 py-2 text-sm font-semibold text-stone-950"
              onClick={() => setSelectedVideo(null)}
            >
              Schließen
            </button>
            <div
              className="aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-black"
              onClick={(event) => event.stopPropagation()}
            >
              <VideoFrame url={selectedVideo.video_url} title={selectedVideo.title} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function VerticalTimeline({
  groups,
  zoom,
  onImage,
  onVideo,
}: {
  groups: TimelineGroup[];
  zoom: TimelineZoom;
  onImage: (event: TimelineEvent) => void;
  onVideo: (event: TimelineEvent) => void;
}) {
  const gapClass = zoom === "compact" ? "gap-3" : zoom === "detail" ? "gap-8" : "gap-5";

  return (
    <div className={`relative grid ${gapClass}`}>
      {groups.map((group, index) => (
        <TimelineGroupBlock
          key={group.id}
          group={group}
          index={index}
          zoom={zoom}
          onImage={onImage}
          onVideo={onVideo}
        />
      ))}
    </div>
  );
}

function TimelineGroupBlock({
  group,
  index,
  zoom,
  onImage,
  onVideo,
}: {
  group: TimelineGroup;
  index: number;
  zoom: TimelineZoom;
  onImage: (event: TimelineEvent) => void;
  onVideo: (event: TimelineEvent) => void;
}) {
  return (
    <motion.section
      className="grid grid-cols-[4.6rem_1.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[6rem_1.75rem_minmax(0,1fr)] sm:gap-4"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(index * 0.03, 0.18) }}
    >
      <div className="pt-1 text-right">
        <p className="text-base font-semibold leading-tight text-stone-950 sm:text-lg">{group.year}</p>
        {group.monthLabel ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 sm:text-sm">
            {group.monthLabel}
          </p>
        ) : null}
      </div>

      <div className="relative flex justify-center">
        <div className="absolute bottom-[-1rem] top-0 w-px bg-gradient-to-b from-blue-700 via-teal-600 to-orange-500" />
        <span className="relative mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white ring-4 ring-[#f6f3ee]">
          {zoom === "compact" ? group.events.length : group.events.some((event) => event.video_url) ? (
            <Video className="h-3.5 w-3.5" />
          ) : group.events.some((event) => event.pdf_url) ? (
            <FileText className="h-3.5 w-3.5" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
        </span>
      </div>

      {zoom === "compact" ? (
        <YearSummary group={group} />
      ) : (
        <div className={zoom === "detail" ? "grid gap-5" : "grid gap-3"}>
          {group.events.map((event) => (
            <TimelineItem
              key={event.id}
              event={event}
              zoom={zoom}
              onImage={onImage}
              onVideo={onVideo}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}

function YearSummary({ group }: { group: TimelineGroup }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-semibold text-stone-950">
        {group.events.length} {group.events.length === 1 ? "Ereignis" : "Ereignisse"}
      </p>
      <div className="mt-2 grid gap-1">
        {group.events.map((event) => (
          <a
            key={event.id}
            data-event-id={event.id}
            className="rounded-md px-2 py-1 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:text-teal-800"
            href={`#event-${encodeURIComponent(event.slug || event.id)}`}
          >
            <span className="font-semibold text-teal-700">{formatEventDate(event.event_date)}</span>
            <span className="ml-2">{event.title}</span>
          </a>
        ))}
      </div>
    </article>
  );
}

function TimelineItem({
  event,
  zoom,
  onImage,
  onVideo,
}: {
  event: TimelineEvent;
  zoom: TimelineZoom;
  onImage: (event: TimelineEvent) => void;
  onVideo: (event: TimelineEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const zoomConfig = zoomLevels.find((item) => item.id === zoom) ?? zoomLevels[1];
  const isLongDescription = event.description.length > zoomConfig.descriptionLength;
  const visibleDescription =
    expanded || !isLongDescription
      ? event.description
      : `${event.description.slice(0, zoomConfig.descriptionLength).trim()}...`;
  const compact = zoom === "compact";
  const detail = zoom === "detail";

  return (
    <article
      data-event-id={event.id}
      className={
        compact
          ? "scroll-mt-72 rounded-lg border border-stone-200 bg-white p-3 shadow-sm sm:p-4"
          : "relative scroll-mt-72 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      }
    >
      <p className="text-sm font-semibold text-teal-700">{formatEventDate(event.event_date)}</p>
      <h2
        className={
          compact
            ? "mt-1 text-lg font-semibold leading-tight text-stone-950"
            : "mt-1 text-xl font-semibold leading-tight text-stone-950 sm:text-2xl"
        }
      >
        {event.title}
      </h2>
      <p
        className={
          compact
            ? "mt-2 whitespace-pre-line text-sm leading-6 text-stone-650"
            : "mt-3 whitespace-pre-line text-sm leading-6 text-stone-650 sm:text-base sm:leading-7"
        }
      >
        {visibleDescription}
      </p>
      {isLongDescription ? (
        <button
          className="mt-2 text-sm font-semibold text-teal-700 hover:text-teal-900"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
        </button>
      ) : null}

      {event.image_url && zoom !== "compact" ? (
        <button
          className={
            detail
              ? "group relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-lg bg-stone-100"
              : "group relative mt-4 aspect-video w-full overflow-hidden rounded-lg bg-stone-100"
          }
          onClick={() => onImage(event)}
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

      {event.video_url && zoom !== "compact" ? (
        <div className={detail ? "mt-5 aspect-video overflow-hidden rounded-lg bg-black" : "mt-4 aspect-video overflow-hidden rounded-lg bg-black"}>
          <VideoFrame url={event.video_url} title={event.title} />
        </div>
      ) : null}

      <div className={compact ? "mt-3 flex flex-wrap gap-2" : "mt-4 flex flex-wrap gap-2"}>
        <CopyEventLinkButton event={event} />
        {event.video_url ? (
          <button
            className="inline-flex h-11 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
            onClick={() => onVideo(event)}
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
    </article>
  );
}

function getTouchDistance(touches: React.TouchList) {
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) return 1;

  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
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

function buildYearNavigation(events: TimelineEvent[]) {
  const years = new Map<string, { year: string; count: number; firstEvent: TimelineEvent }>();

  for (const event of events) {
    const year = getYear(event.event_date);
    const existing = years.get(year);

    if (existing) {
      existing.count += 1;
    } else {
      years.set(year, { year, count: 1, firstEvent: event });
    }
  }

  return [...years.values()];
}

function buildTimelineGroups(events: TimelineEvent[], zoom: TimelineZoom): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  for (const event of events) {
    const date = parseEventDate(event.event_date);
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const key = zoom === "compact" ? year : `${year}-${month}`;
    const existing = groups.get(key);

    if (existing) {
      existing.events.push(event);
      continue;
    }

    groups.set(key, {
      id: key,
      year,
      month: zoom === "compact" ? undefined : month,
      monthLabel: zoom === "compact" ? undefined : formatMonth(date),
      events: [event],
    });
  }

  return [...groups.values()];
}

function parseEventDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date(`${date.slice(0, 4)}-01-01`) : parsed;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("de-DE", { month: "short" }).format(date);
}

function getTime(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date(`${date.slice(0, 4)}-01-01`).getTime() : parsed.getTime();
}
