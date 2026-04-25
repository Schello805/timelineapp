"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  FileText,
  ImageIcon,
  LinkIcon,
  Minus,
  Play,
  Plus,
  Search,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TimelineEvent } from "@/lib/types";
import { formatEventDate, getYear } from "@/lib/timeline-format";
import { AppLogo } from "@/components/app-logo";
import { VideoFrame } from "@/components/video-frame";

type ZoomLevel = "years" | "months" | "events";
type MediaFilter = "all" | "image" | "video" | "pdf";
type SortOrder = "asc" | "desc";

const zoomLevels: Array<{ id: ZoomLevel; label: string; unit: string }> = [
  { id: "years", label: "Jahre", unit: "Überblick" },
  { id: "months", label: "Monate", unit: "Genauer" },
  { id: "events", label: "Ereignisse", unit: "Details" },
];

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const pinchThreshold = 0.16;
const collapsedDescriptionLength = 210;

export function TimelineClient({ events }: { events: TimelineEvent[] }) {
  const [zoom, setZoom] = useState<ZoomLevel>("years");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(events.at(0) ?? null);
  const [selectedImage, setSelectedImage] = useState<TimelineEvent | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TimelineEvent | null>(null);
  const [query, setQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{
    distance: number;
    zoom: ZoomLevel;
    centerRatio: number;
    centerX: number;
  } | null>(null);

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

  const timelineEvents = sortedEvents.length ? sortedEvents : allEvents;
  const timeline = useMemo(() => buildTimeline(timelineEvents, zoom), [timelineEvents, zoom]);
  const yearNavigation = useMemo(() => buildYearNavigation(timelineEvents), [timelineEvents]);

  const scrollToEvent = useCallback((id: string) => {
    const targets = [...document.querySelectorAll<HTMLElement>(`[data-event-id="${id}"]`)];
    const target = targets.find((element) => element.offsetParent !== null) ?? targets.at(0);
    target?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  useEffect(() => {
    const selectFromHash = () => {
      const eventKey = decodeURIComponent(window.location.hash.replace(/^#event-/, ""));
      if (!eventKey) return;

      const event = sortedEvents.find((item) => item.id === eventKey || item.slug === eventKey);
      if (!event) return;

      setSelectedEvent(event);
      window.requestAnimationFrame(() => scrollToEvent(event.id));
    };

    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [scrollToEvent, sortedEvents]);

  if (allEvents.length === 0) {
    return (
      <section className="min-h-[calc(100svh-4rem)] bg-[#f6f3ee]">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-8">
          <AppLogo />
          <div className="mt-10 rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              Timeline
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              Noch keine Ereignisse vorhanden.
            </h1>
            <p className="mt-3 max-w-xl leading-7 text-stone-650">
              Sobald im Admin-Bereich Inhalte angelegt sind, erscheint hier die zoombare Zeitachse.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function setZoomLevel(
    nextZoom: ZoomLevel,
    options?: { preserveViewport?: boolean; centerRatio?: number; centerX?: number },
  ) {
    setZoom(nextZoom);
    window.requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      if (options?.preserveViewport && scroller && options.centerRatio !== undefined && options.centerX !== undefined) {
        scroller.scrollLeft = scroller.scrollWidth * options.centerRatio - options.centerX;
        return;
      }

      if (selectedEvent) scrollToEvent(selectedEvent.id);
    });
  }

  function zoomBy(
    direction: 1 | -1,
    options?: { preserveViewport?: boolean; centerRatio?: number; centerX?: number },
  ) {
    const index = zoomLevels.findIndex((item) => item.id === zoom);
    const next = zoomLevels[Math.min(Math.max(index + direction, 0), zoomLevels.length - 1)];
    setZoomLevel(next.id, options);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2) return;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const centerX = getTouchCenterX(event.touches, scroller);
    pinchRef.current = {
      distance: getTouchDistance(event.touches),
      zoom,
      centerX,
      centerRatio: (scroller.scrollLeft + centerX) / Math.max(scroller.scrollWidth, 1),
    };
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const pinch = pinchRef.current;
    if (!pinch || event.touches.length !== 2) return;

    event.preventDefault();
    const scale = getTouchDistance(event.touches) / pinch.distance;
    const startIndex = zoomLevels.findIndex((level) => level.id === pinch.zoom);
    const direction = scale > 1 + pinchThreshold ? 1 : scale < 1 - pinchThreshold ? -1 : 0;
    if (!direction) return;

    const next = zoomLevels[Math.min(Math.max(startIndex + direction, 0), zoomLevels.length - 1)];
    if (next.id === zoom) return;

    setZoomLevel(next.id, {
      preserveViewport: true,
      centerRatio: pinch.centerRatio,
      centerX: pinch.centerX,
    });
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchRef.current = null;
    }
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) return;

    event.preventDefault();
    const scroller = scrollerRef.current;
    const rect = scroller?.getBoundingClientRect();
    const centerX = rect ? event.clientX - rect.left : 0;
    const centerRatio = scroller ? (scroller.scrollLeft + centerX) / Math.max(scroller.scrollWidth, 1) : 0.5;
    zoomBy(event.deltaY < 0 ? 1 : -1, { preserveViewport: true, centerRatio, centerX });
  }

  function selectEvent(event: TimelineEvent) {
    setSelectedEvent(event);
    scrollToEvent(event.id);
    window.history.replaceState(null, "", `#event-${encodeURIComponent(event.slug || event.id)}`);
  }

  function selectYear(year: string) {
    const event = yearNavigation.find((item) => item.year === year)?.firstEvent;
    if (!event) return;

    selectEvent(event);
  }

  return (
    <>
      <section className="min-h-[calc(100svh-4rem)] bg-[#f6f3ee]">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-6 sm:py-8">
          <header className="flex flex-col gap-5 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <AppLogo />
              <div className="mt-6 max-w-3xl">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-teal-700">
                  <CalendarDays className="h-4 w-4" />
                  Zoombare Medien-Zeitliste
                </p>
                <h1 className="text-3xl font-semibold leading-tight text-stone-950 sm:text-5xl">
                  Vom Jahresüberblick bis zum einzelnen Ereignis.
                </h1>
              </div>
            </div>

            <div className="hidden flex-wrap items-center gap-2 lg:flex">
              <button
                className="flex h-11 w-11 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-800 hover:border-teal-700 hover:text-teal-700"
                onClick={() => zoomBy(-1)}
                aria-label="Herauszoomen"
              >
                <Minus className="h-5 w-5" />
              </button>
              <div className="flex rounded-md border border-stone-300 bg-white p-1">
                {zoomLevels.map((level) => (
                  <button
                    key={level.id}
                    className={
                      zoom === level.id
                        ? "h-9 rounded px-3 text-sm font-semibold bg-stone-950 text-white"
                        : "h-9 rounded px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                    }
                    onClick={() => setZoomLevel(level.id)}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-800 hover:border-teal-700 hover:text-teal-700"
                onClick={() => zoomBy(1)}
                aria-label="Reinzoomen"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="mt-5 grid gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm xl:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                className="h-11 w-full rounded-md border border-stone-300 pl-9 pr-3 text-sm outline-none focus:border-teal-700"
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
                      ? "h-11 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
                      : "h-11 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-700 hover:border-teal-700 hover:text-teal-700"
                  }
                  onClick={() => setMediaFilter(id as MediaFilter)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex rounded-md border border-stone-300 bg-stone-50 p-1">
              {[
                ["asc", "Alt nach neu"],
                ["desc", "Neu nach alt"],
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

          {sortedEvents.length === 0 ? (
            <div className="mt-5 rounded-lg border border-stone-200 bg-white p-6 text-sm font-semibold text-stone-700 shadow-sm">
              Keine Ereignisse für diese Suche gefunden.
            </div>
          ) : null}

          <MobileTimeline
            events={sortedEvents}
            yearNavigation={yearNavigation}
            onSelect={selectEvent}
            onYearSelect={selectYear}
            onImage={setSelectedImage}
            onVideo={setSelectedVideo}
          />

          <div className="mt-5 hidden gap-5 lg:grid lg:grid-cols-[1fr_380px]">
            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm text-stone-600">
                <span className="font-semibold text-stone-900">
                  {zoomLevels.find((level) => level.id === zoom)?.unit}
                </span>
                <span>Pinch zum Zoomen · {timeline.startYear} bis {timeline.endYear}</span>
              </div>

              <div
                ref={scrollerRef}
                className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm [scrollbar-width:thin]"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onWheel={handleWheel}
                style={{ touchAction: "pan-x" }}
                aria-label="Zoombare Timeline"
              >
                <div className="relative h-[560px]" style={{ width: timeline.width }}>
                  <div className="absolute left-0 right-0 top-64 h-px bg-stone-300" />
                  <div className="absolute left-0 right-0 top-64 h-px bg-gradient-to-r from-blue-700 via-teal-600 to-orange-500" />

                  {timeline.ticks.map((tick) => (
                    <div
                      key={tick.id}
                      className="absolute top-48 h-28"
                      style={{ left: tick.left }}
                    >
                      <div className={tick.major ? "h-16 w-px bg-stone-800" : "ml-px h-10 w-px bg-stone-300"} />
                      <span
                        className={
                          tick.major
                            ? "absolute top-[-2rem] -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-stone-900"
                            : "absolute top-[-1.65rem] -translate-x-1/2 whitespace-nowrap text-xs font-medium text-stone-500"
                        }
                      >
                        {tick.label}
                      </span>
                    </div>
                  ))}

                  {sortedEvents.map((event, index) => {
                    const left = timeline.position(event.event_date);
                    const isSelected = selectedEvent?.id === event.id;
                    const labelClass = getEventLabelClass(index);

                    return (
                      <motion.button
                        key={event.id}
                        data-event-id={event.id}
                        className="absolute top-64 -translate-x-1/2 -translate-y-1/2 text-left"
                        style={{ left }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(index * 0.05, 0.25) }}
                        onClick={() => selectEvent(event)}
                        aria-label={`${event.title} auswählen`}
                      >
                        <span
                          className={
                            isSelected
                              ? "relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white ring-8 ring-orange-100"
                              : "relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white ring-4 ring-white hover:bg-orange-500"
                          }
                        >
                          {event.video_url ? <Video className="h-3.5 w-3.5" /> : event.pdf_url ? <FileText className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
                        </span>
                        <span
                          className={labelClass}
                        >
                          <span className="block rounded-md border border-stone-200 bg-white px-3 py-2 shadow-sm">
                            <span className="block text-xs font-semibold text-teal-700">
                              {formatEventDate(event.event_date)}
                            </span>
                            <span className="mt-1 line-clamp-2 block text-sm font-semibold leading-5 text-stone-950">
                              {event.title}
                            </span>
                          </span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <EventDetail
              event={selectedEvent}
              onImage={() => selectedEvent?.image_url && setSelectedImage(selectedEvent)}
              onVideo={() => selectedEvent?.video_url && setSelectedVideo(selectedEvent)}
            />
          </div>

          {yearNavigation.length > 1 ? (
            <div className="mt-5 hidden gap-2 overflow-x-auto pb-2 [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden">
              {yearNavigation.map((item) => {
                const isActive = selectedEvent ? getYear(selectedEvent.event_date) === item.year : false;

                return (
                  <button
                    key={item.year}
                    className={
                      isActive
                        ? "h-10 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
                        : "h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-teal-700 hover:text-teal-700"
                    }
                    onClick={() => selectYear(item.year)}
                    aria-label={`Zum Jahr ${item.year} springen`}
                  >
                    {item.year}
                    <span className={isActive ? "ml-2 text-white/70" : "ml-2 text-stone-400"}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
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
              <EventImage
                src={selectedImage.image_url ?? ""}
                alt={selectedImage.title}
                className="object-contain"
              />
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

function MobileTimeline({
  events,
  yearNavigation,
  onSelect,
  onYearSelect,
  onImage,
  onVideo,
}: {
  events: TimelineEvent[];
  yearNavigation: Array<{ year: string; count: number; firstEvent: TimelineEvent }>;
  onSelect: (event: TimelineEvent) => void;
  onYearSelect: (year: string) => void;
  onImage: (event: TimelineEvent) => void;
  onVideo: (event: TimelineEvent) => void;
}) {
  if (events.length === 0) return null;

  return (
    <div className="mt-5 lg:hidden">
      <div className="mb-3 flex items-center justify-between text-sm text-stone-600">
        <span className="font-semibold text-stone-900">Zeitliste</span>
        <span>{events.length} Ereignisse</span>
      </div>

      {yearNavigation.length > 1 ? (
        <div className="sticky top-0 z-20 -mx-5 mb-4 border-y border-stone-200 bg-[#f6f3ee]/95 px-5 py-2 backdrop-blur">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {yearNavigation.map((item) => (
              <button
                key={item.year}
                className="h-9 shrink-0 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 shadow-sm"
                onClick={() => onYearSelect(item.year)}
                aria-label={`Zum Jahr ${item.year} springen`}
              >
                {item.year}
                <span className="ml-2 text-stone-400">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative grid gap-5 pl-6">
        <div className="absolute bottom-0 left-[0.7rem] top-0 w-px bg-gradient-to-b from-blue-700 via-teal-600 to-orange-500" />

        {events.map((event, index) => (
          <MobileTimelineItem
            key={event.id}
            event={event}
            index={index}
            onSelect={onSelect}
            onImage={onImage}
            onVideo={onVideo}
          />
        ))}
      </div>
    </div>
  );
}

function MobileTimelineItem({
  event,
  index,
  onSelect,
  onImage,
  onVideo,
}: {
  event: TimelineEvent;
  index: number;
  onSelect: (event: TimelineEvent) => void;
  onImage: (event: TimelineEvent) => void;
  onVideo: (event: TimelineEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLongDescription = event.description.length > collapsedDescriptionLength;
  const visibleDescription =
    expanded || !isLongDescription
      ? event.description
      : `${event.description.slice(0, collapsedDescriptionLength).trim()}...`;

  return (
    <motion.article
      data-event-id={event.id}
      className="relative rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(index * 0.03, 0.18) }}
    >
      <span className="absolute -left-[1.98rem] top-5 flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white ring-4 ring-[#f6f3ee]">
        {event.video_url ? (
          <Video className="h-3.5 w-3.5" />
        ) : event.pdf_url ? (
          <FileText className="h-3.5 w-3.5" />
        ) : (
          <Search className="h-3.5 w-3.5" />
        )}
      </span>

      <button className="block w-full text-left" onClick={() => onSelect(event)}>
        <p className="text-sm font-semibold text-teal-700">{formatEventDate(event.event_date)}</p>
        <h2 className="mt-1 text-xl font-semibold leading-tight text-stone-950">{event.title}</h2>
      </button>
      <p className="mt-3 text-sm leading-6 text-stone-650">{visibleDescription}</p>
      {isLongDescription ? (
        <button
          className="mt-2 text-sm font-semibold text-teal-700 hover:text-teal-900"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
        </button>
      ) : null}

      {event.image_url ? (
        <button
          className="group relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-lg bg-stone-100"
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

      {event.video_url ? (
        <div className="mt-4 aspect-video overflow-hidden rounded-lg bg-black">
          <VideoFrame url={event.video_url} title={event.title} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
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
    </motion.article>
  );
}

function EventDetail({
  event,
  onImage,
  onVideo,
}: {
  event: TimelineEvent | null;
  onImage: () => void;
  onVideo: () => void;
}) {
  if (!event) {
    return (
      <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-stone-900">Kein Ereignis ausgewählt.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-teal-700">{formatEventDate(event.event_date)}</p>
      <h2 className="mt-2 text-2xl font-semibold leading-tight text-stone-950">{event.title}</h2>
      <p className="mt-3 text-sm leading-6 text-stone-650">{event.description}</p>

      {event.image_url ? (
        <button
          className="group relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-lg bg-stone-100"
          onClick={onImage}
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
        <div className="mt-5 aspect-video overflow-hidden rounded-lg bg-black">
          <VideoFrame url={event.video_url} title={event.title} />
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <CopyEventLinkButton event={event} />
        {event.video_url ? (
          <button
            className="inline-flex h-11 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
            onClick={onVideo}
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
    </aside>
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

function buildTimeline(events: TimelineEvent[], zoom: ZoomLevel) {
  const times = events.map((event) => getTime(event.event_date));
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));
  const startYear = first.getFullYear();
  const endYear = last.getFullYear();
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const range = Math.max(end - start, 1);
  const years = Math.max(endYear - startYear + 1, 1);
  const pxPerYear = zoom === "years" ? 150 : zoom === "months" ? 720 : 1180;
  const width = Math.max(980, years * pxPerYear);

  return {
    startYear,
    endYear,
    width,
    position(date: string) {
      return 80 + ((getTime(date) - start) / range) * (width - 160);
    },
    ticks: buildTicks(startYear, endYear, zoom, width),
  };
}

function buildTicks(startYear: number, endYear: number, zoom: ZoomLevel, width: number) {
  const ticks: Array<{ id: string; label: string; left: number; major: boolean }> = [];
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const range = Math.max(end - start, 1);

  for (let year = startYear; year <= endYear; year += 1) {
    const left = 80 + ((new Date(year, 0, 1).getTime() - start) / range) * (width - 160);
    ticks.push({ id: `year-${year}`, label: String(year), left, major: true });

    if (zoom !== "years") {
      for (let month = 1; month < 12; month += zoom === "months" ? 1 : 1) {
        const monthLeft = 80 + ((new Date(year, month, 1).getTime() - start) / range) * (width - 160);
        ticks.push({
          id: `month-${year}-${month}`,
          label: zoom === "events" || month % 3 === 0 ? monthNames[month] : "",
          left: monthLeft,
          major: false,
        });
      }
    }
  }

  return ticks;
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

function getEventLabelClass(index: number) {
  const lanes = [
    "absolute bottom-10 left-1/2 w-52 -translate-x-1/2",
    "absolute left-1/2 top-10 w-52 -translate-x-1/2",
    "absolute bottom-28 left-1/2 w-52 -translate-x-1/2",
    "absolute left-1/2 top-28 w-52 -translate-x-1/2",
    "absolute bottom-44 left-1/2 w-52 -translate-x-1/2",
    "absolute left-1/2 top-44 w-52 -translate-x-1/2",
  ];

  return lanes[index % lanes.length];
}

function getTime(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date(`${date.slice(0, 4)}-01-01`).getTime() : parsed.getTime();
}

function getTouchDistance(touches: React.TouchList) {
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) return 1;

  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

function getTouchCenterX(touches: React.TouchList, element: HTMLElement) {
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) return element.clientWidth / 2;

  const rect = element.getBoundingClientRect();
  return (first.clientX + second.clientX) / 2 - rect.left;
}
