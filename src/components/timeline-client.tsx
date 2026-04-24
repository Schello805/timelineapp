"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  FileText,
  ImageIcon,
  Minus,
  Play,
  Plus,
  Search,
  Video,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { TimelineEvent } from "@/lib/types";
import { formatEventDate, getYear } from "@/lib/timeline-format";
import { AppLogo } from "@/components/app-logo";
import { VideoFrame } from "@/components/video-frame";

type ZoomLevel = "years" | "months" | "events";

const zoomLevels: Array<{ id: ZoomLevel; label: string; unit: string }> = [
  { id: "years", label: "Jahre", unit: "Ueberblick" },
  { id: "months", label: "Monate", unit: "Genauer" },
  { id: "events", label: "Ereignisse", unit: "Details" },
];

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function TimelineClient({ events }: { events: TimelineEvent[] }) {
  const [zoom, setZoom] = useState<ZoomLevel>("years");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(events.at(0) ?? null);
  const [selectedImage, setSelectedImage] = useState<TimelineEvent | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TimelineEvent | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => getTime(a.event_date) - getTime(b.event_date)),
    [events],
  );

  const timeline = useMemo(() => buildTimeline(sortedEvents, zoom), [sortedEvents, zoom]);

  if (sortedEvents.length === 0) {
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

  function setZoomLevel(nextZoom: ZoomLevel) {
    setZoom(nextZoom);
    window.requestAnimationFrame(() => {
      if (selectedEvent) scrollToEvent(selectedEvent.id);
    });
  }

  function zoomBy(direction: 1 | -1) {
    const index = zoomLevels.findIndex((item) => item.id === zoom);
    const next = zoomLevels[Math.min(Math.max(index + direction, 0), zoomLevels.length - 1)];
    setZoomLevel(next.id);
  }

  function scrollToEvent(id: string) {
    const target = document.querySelector(`[data-event-id="${id}"]`);
    target?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function selectEvent(event: TimelineEvent) {
    setSelectedEvent(event);
    scrollToEvent(event.id);
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
                  Vom Jahresueberblick bis zum einzelnen Ereignis.
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3 text-sm text-stone-600">
                <span className="font-semibold text-stone-900">
                  {zoomLevels.find((level) => level.id === zoom)?.unit}
                </span>
                <span>{timeline.startYear} bis {timeline.endYear}</span>
              </div>

              <div
                ref={scrollerRef}
                className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm [scrollbar-width:thin]"
                aria-label="Zoombare Timeline"
              >
                <div className="relative h-[420px]" style={{ width: timeline.width }}>
                  <div className="absolute left-0 right-0 top-44 h-px bg-stone-300" />
                  <div className="absolute left-0 right-0 top-44 h-px bg-gradient-to-r from-blue-700 via-teal-600 to-orange-500" />

                  {timeline.ticks.map((tick) => (
                    <div
                      key={tick.id}
                      className="absolute top-28 h-28"
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
                    const above = index % 2 === 0;

                    return (
                      <motion.button
                        key={event.id}
                        data-event-id={event.id}
                        className="absolute top-44 -translate-x-1/2 -translate-y-1/2 text-left"
                        style={{ left }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(index * 0.05, 0.25) }}
                        onClick={() => selectEvent(event)}
                        aria-label={`${event.title} auswaehlen`}
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
                          className={
                            above
                              ? "absolute bottom-9 left-1/2 w-48 -translate-x-1/2"
                              : "absolute left-1/2 top-9 w-48 -translate-x-1/2"
                          }
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

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sortedEvents.map((event) => (
              <button
                key={event.id}
                className={
                  selectedEvent?.id === event.id
                    ? "h-10 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
                    : "h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-teal-700 hover:text-teal-700"
                }
                onClick={() => selectEvent(event)}
              >
                {getYear(event.event_date)}
              </button>
            ))}
          </div>
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
              Schliessen
            </button>
            <div className="relative h-[80svh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
              <Image
                src={selectedImage.image_url ?? ""}
                alt={selectedImage.title}
                fill
                sizes="90vw"
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
              Schliessen
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
        <p className="text-sm font-semibold text-stone-900">Kein Ereignis ausgewaehlt.</p>
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
          aria-label={`${event.title} als grosses Bild oeffnen`}
        >
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="380px"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-stone-900 shadow-sm">
            <ImageIcon className="h-5 w-5" />
          </span>
        </button>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
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
            Dokument oeffnen
          </a>
        ) : null}
      </div>
    </aside>
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

function getTime(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date(`${date.slice(0, 4)}-01-01`).getTime() : parsed.getTime();
}
