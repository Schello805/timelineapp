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
  Sparkles,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AudioPlayer } from "@/components/audio-player";
import { AppLogo } from "@/components/app-logo";
import { VideoFrame } from "@/components/video-frame";
import type { AnnualMetric, TimelineEvent } from "@/lib/types";
import { formatEventDate, formatEventDateNumeric, getYear } from "@/lib/timeline-format";

type SortOrder = "asc" | "desc";
type EventWeight = "brief" | "standard" | "milestone";
type EventViewMode = "compact" | "normal" | "detail";
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
  metrics: AnnualMetric[];
};

export function TimelineClient({
  events,
  annualMetrics,
  ownerName,
}: {
  events: TimelineEvent[];
  annualMetrics: AnnualMetric[];
  ownerName: string;
}) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [selectedImage, setSelectedImage] = useState<TimelineEvent | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [activeYear, setActiveYear] = useState<string>("");
  const [showYearJump, setShowYearJump] = useState(false);

  const allEvents = useMemo(
    () => [...events].sort((a, b) => getTime(a.event_date) - getTime(b.event_date)),
    [events],
  );
  const filteredEvents = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return allEvents.filter((event) => {
      if (!normalizedQuery) return true;

      return (
        event.title.toLowerCase().includes(normalizedQuery) ||
        event.description.toLowerCase().includes(normalizedQuery) ||
        event.event_date.includes(normalizedQuery)
      );
    });
  }, [allEvents, deferredQuery]);
  const sortedEvents = useMemo(() => {
    const direction = sortOrder === "asc" ? 1 : -1;
    return [...filteredEvents].sort((a, b) => (getTime(a.event_date) - getTime(b.event_date)) * direction);
  }, [filteredEvents, sortOrder]);
  const yearNavigation = useMemo(() => buildYearNavigation(sortedEvents.length ? sortedEvents : allEvents), [
    allEvents,
    sortedEvents,
  ]);
  const timelineYears = useMemo(() => buildTimelineYears(sortedEvents, annualMetrics), [annualMetrics, sortedEvents]);

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

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("[data-year-anchor]")];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          .at(0);
        const year = visible?.target.getAttribute("data-year-anchor");
        if (year) {
          setActiveYear(year);
        }
      },
      {
        rootMargin: "-18% 0px -62% 0px",
        threshold: [0.15, 0.4, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [timelineYears]);

  useEffect(() => {
    const onScroll = () => setShowYearJump(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const visibleYear = activeYear || yearNavigation[0]?.year || "";

  return (
    <>
      <section className="min-h-[calc(100svh-4rem)] bg-[radial-gradient(circle_at_top,#fbfaf6_0%,#f6f3ee_45%,#efe7dc_100%)]">
        <div className="border-b border-stone-200/90 bg-[#f6f3ee]/92 backdrop-blur md:sticky md:top-0 md:z-30">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2">
            <header className="flex items-center justify-between gap-3">
              <AppLogo compact label={`Timeline für ${ownerName}`} />
              <div className="hidden items-center md:flex">
                <span className="rounded-full bg-stone-950 px-2.5 py-0.5 text-xs font-semibold text-white">{visibleYear}</span>
              </div>
            </header>

            <div className="grid gap-1.5 rounded-xl border border-stone-200/90 bg-white/95 p-1.5 shadow-[0_16px_40px_-30px_rgba(37,35,32,0.32)] md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-teal-700"
                  placeholder="Titel, Beschreibung oder Datum suchen"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="flex gap-2 overflow-x-auto pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  ["asc", "Älteste zuerst"],
                  ["desc", "Neueste zuerst"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={
                      sortOrder === id
                        ? "h-10 shrink-0 rounded-lg bg-stone-950 px-3.5 text-sm font-semibold text-white"
                        : "h-10 shrink-0 rounded-lg border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-700 hover:border-teal-700 hover:text-teal-700"
                    }
                    onClick={() => setSortOrder(id as SortOrder)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden gap-1.5 rounded-xl border border-stone-200/90 bg-white/90 px-1.5 py-1.5 shadow-sm md:grid md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex gap-2 overflow-x-auto pr-6 [scrollbar-width:none] [scroll-padding-inline:1rem] [&::-webkit-scrollbar]:hidden">
                {yearNavigation.map((item) => (
                  <button
                    key={item.year}
                    className={
                      visibleYear === item.year
                        ? "h-8 shrink-0 rounded-lg bg-[#0f766e] px-2.5 text-sm font-semibold text-white shadow-sm"
                        : "h-8 shrink-0 rounded-lg border border-stone-300 bg-white px-2.5 text-sm font-semibold text-stone-700 hover:border-teal-700 hover:text-teal-700"
                    }
                    onClick={() => selectYear(item.year)}
                    aria-label={`Zum Jahr ${item.year} springen`}
                  >
                    {item.year}
                    <span
                      className={
                        visibleYear === item.year
                          ? "ml-1.5 text-xs italic text-white/75"
                          : "ml-1.5 text-xs italic text-stone-400"
                      }
                    >
                      ({item.count})
                    </span>
                  </button>
                ))}
                <span aria-hidden="true" className="block h-px w-6 shrink-0" />
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500">
                  {visibleYear}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-5 sm:py-8">
          {sortedEvents.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm font-semibold text-stone-700 shadow-sm">
              Keine Ereignisse für diese Suche gefunden.
            </div>
          ) : (
            <div className="grid gap-8">
              {timelineYears.map((yearGroup) => (
                <YearSection
                  key={yearGroup.id}
                  group={yearGroup}
                  onOpenEvent={setSelectedEvent}
                  onOpenImage={setSelectedImage}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedEvent ? (
          <motion.div
            className="fixed inset-0 z-50 bg-stone-950/54 md:flex md:items-center md:justify-center md:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              className="fixed inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto rounded-t-[1.75rem] border border-stone-200 bg-white p-5 shadow-2xl md:relative md:inset-auto md:w-full md:max-w-4xl md:rounded-3xl md:p-7"
              initial={{ opacity: 0, y: 44, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-stone-200 md:hidden" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-teal-700">{formatEventDate(selectedEvent.event_date)}</p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight text-stone-950 sm:text-4xl">
                    {selectedEvent.title}
                  </h2>
                  <EventMetaBadges event={selectedEvent} className="mt-3" />
                </div>
                <button
                  className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-50"
                  onClick={() => setSelectedEvent(null)}
                >
                  Schließen
                </button>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] md:items-start">
                <section className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 md:p-5">
                  <div className="text-sm leading-7 text-stone-700 sm:text-base">
                    <RichDescription text={selectedEvent.description} />
                  </div>
                </section>

                <aside className="grid gap-4">
                  <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Medien</p>
                    <EventMediaStack event={selectedEvent} detail onOpenImage={setSelectedImage} />
                  </section>

                  <section className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Aktionen</p>
                    <div className="flex flex-wrap gap-2">
                      <CopyEventLinkButton event={selectedEvent} />
                      {selectedEvent.pdf_url ? (
                        <a
                          className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-900 hover:bg-stone-50"
                          href={selectedEvent.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="h-4 w-4" />
                          PDF öffnen
                        </a>
                      ) : null}
                    </div>
                  </section>
                </aside>
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
              className="absolute right-4 top-4 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-stone-950"
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

      <AnimatePresence>
        {showYearJump && visibleYear ? (
          <motion.button
            className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_-18px_rgba(0,0,0,0.55)] md:hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            onClick={() => selectYear(visibleYear)}
          >
            <CalendarDays className="h-4 w-4" />
            {visibleYear}
          </motion.button>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function YearSection({
  group,
  onOpenEvent,
  onOpenImage,
}: {
  group: TimelineYear;
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
      <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-5">
        <div
          className={
            hasExpandedEvents(group.events)
              ? "relative hidden pt-2 pr-4 text-right md:block md:pr-10"
              : "relative pt-2 pr-4 text-right md:pr-10"
          }
        >
          <p className="relative z-10 inline-block bg-[#f6f3ee] pr-1 text-xl font-semibold leading-none text-stone-950 md:pr-2 md:text-3xl">
            {group.year}
          </p>
          <YearSummaryChips group={group} />
          <div className="absolute right-0.5 top-0 flex h-full justify-center md:right-1">
            <div className="absolute bottom-[-0.75rem] top-2 w-px bg-gradient-to-b from-blue-700 via-teal-600 to-orange-500" />
            <span className="relative mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-950 text-white ring-4 ring-[#f6f3ee] md:h-7 md:w-7">
              <CalendarDays className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </span>
          </div>
        </div>
        <div className="grid gap-3">
          {hasExpandedEvents(group.events) ? (
            <div className="grid gap-3">
            {group.metrics.length ? <MetricTimelineRow year={group.year} metrics={group.metrics} /> : null}
            {group.months.map((month) => (
              <MonthSection
                key={month.id}
                year={group.year}
                month={month}
                onOpenEvent={onOpenEvent}
                onOpenImage={onOpenImage}
              />
            ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {group.metrics.length ? <MetricTimelineRow year={group.year} metrics={group.metrics} /> : null}
              <CompactYearCard events={group.events} onOpenEvent={onOpenEvent} />
            </div>
          )}
        </div>
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
    <motion.article
      layout
      className="w-[calc(100vw-6.35rem)] max-w-full rounded-2xl border border-stone-200/90 bg-white/95 p-4 shadow-[0_18px_40px_-32px_rgba(33,31,28,0.45)] md:w-full"
    >
      <p className="text-sm font-semibold text-stone-950">
        {events.length} {events.length === 1 ? "Ereignis" : "Ereignisse"}
      </p>
      {events.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-stone-500">Für dieses Jahr sind aktuell nur Kennzahlen hinterlegt.</p>
      ) : null}
      <div className="mt-3 grid gap-2">
        {events.map((event) => {
          const weight = getEventWeight(event);

          return (
            <button
              key={event.id}
              data-event-id={event.id}
              className={
                weight === "milestone"
                  ? "grid w-full gap-1 rounded-xl border border-orange-200 border-l-4 border-l-orange-400 bg-[linear-gradient(135deg,#fffdf8_0%,#fff3e2_100%)] px-3 py-3 text-left shadow-sm transition hover:border-orange-400"
                  : event.importance === "important"
                    ? "grid w-full gap-1 rounded-xl border border-amber-200 border-l-4 border-l-amber-300 bg-amber-50/40 px-3 py-3 text-left transition hover:border-amber-400 hover:bg-white"
                    : "grid w-full gap-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-left transition hover:border-teal-700 hover:bg-white"
              }
              onClick={() => onOpenEvent(event)}
            >
              <EventMetaBadges event={event} compact />
              <span className="text-sm font-semibold text-teal-700">{formatEventDateNumeric(event.event_date)}</span>
              <span className="text-base font-semibold leading-tight text-stone-950">{event.title}</span>
              <span className="line-clamp-2 text-sm leading-6 text-stone-600">{event.description}</span>
            </button>
          );
        })}
      </div>
    </motion.article>
  );
}

function MetricTimelineRow({ year, metrics }: { year: string; metrics: AnnualMetric[] }) {
  return (
    <motion.article
      layout
      className="grid w-full min-w-0 gap-2"
      transition={{ layout: { type: "spring", stiffness: 180, damping: 22 } }}
    >
      <div className="w-[calc(100vw-6.35rem)] min-w-0 max-w-full rounded-2xl border border-dashed border-stone-200/90 bg-[#f8f5ef]/85 px-4 py-3 md:w-full md:px-5 md:py-3.5">
        <div className="flex flex-wrap items-center gap-2 text-left">
          <span className="text-sm font-semibold text-stone-500">{year}</span>
          <span className="rounded-full border border-stone-200 bg-white/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-400">
            Kennzahlen
          </span>
        </div>

        <div className="mt-2.5 grid gap-2.5">
          {metrics.map((metric) => {
            const hasComparison = metric.comparison_label && metric.comparison_value !== null && metric.value > 0;
            const ratio = hasComparison ? Math.min((metric.comparison_value! / metric.value) * 100, 999) : null;
            const valueParts = formatMetricParts(metric.value, metric.unit);

            return (
              <article
                key={metric.id}
                className="grid gap-2 border-l-2 border-teal-700/25 pl-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-6 text-stone-700">{metric.label}</p>
                  {hasComparison ? (
                    <p className="mt-0.5 text-sm leading-5 text-stone-500">
                      {metric.comparison_label}: {formatMetricValue(metric.comparison_value!, metric.comparison_unit)}
                    </p>
                  ) : null}
                  {metric.description ? <p className="mt-0.5 text-sm leading-5 text-stone-400">{metric.description}</p> : null}
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:justify-end">
                  <span className="text-lg font-semibold leading-none text-stone-900">{valueParts.value}</span>
                  {valueParts.unit ? (
                    <span className="text-sm font-medium leading-none text-stone-500">{valueParts.unit}</span>
                  ) : null}
                  {hasComparison ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-700/10">
                      {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(ratio!)} %
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </motion.article>
  );
}

function YearSummaryChips({ group }: { group: TimelineYear }) {
  const milestoneCount = group.events.filter((event) => event.importance === "milestone").length;
  const importantCount = group.events.filter((event) => event.importance === "important").length;

  return (
    <div className="mt-3 hidden flex-wrap justify-end gap-1.5 md:flex">
      {group.metrics.length ? (
        <span className="rounded-full bg-white/85 px-2 py-1 text-[11px] font-semibold text-stone-500 ring-1 ring-stone-200">
          {group.metrics.length} Kennzahl{group.metrics.length === 1 ? "" : "en"}
        </span>
      ) : null}
      {milestoneCount ? (
        <span className="rounded-full bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-800 ring-1 ring-orange-100">
          {milestoneCount} Meilenstein{milestoneCount === 1 ? "" : "e"}
        </span>
      ) : null}
      {importantCount ? (
        <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-100">
          {importantCount} wichtig
        </span>
      ) : null}
    </div>
  );
}

function EventMetaBadges({
  event,
  compact = false,
  className = "",
}: {
  event: TimelineEvent;
  compact?: boolean;
  className?: string;
}) {
  const badges = [];

  if (event.importance === "milestone") {
    badges.push(
      <span
        key="milestone"
        className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-800"
      >
        <Sparkles className="h-3 w-3" />
        Meilenstein
      </span>,
    );
  } else if (event.importance === "important") {
    badges.push(
      <span
        key="important"
        className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800"
      >
        Wichtig
      </span>,
    );
  }

  if (!compact) {
    if (event.image_url) badges.push(<span key="image" className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Bild</span>);
    if (event.video_url) badges.push(<span key="video" className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">Video</span>);
    if (event.audio_url) badges.push(<span key="audio" className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">Audio</span>);
    if (event.pdf_url) badges.push(<span key="pdf" className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">PDF</span>);
  }

  if (badges.length === 0) return null;

  return <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>{badges}</div>;
}

function MonthSection({
  year,
  month,
  onOpenEvent,
  onOpenImage,
}: {
  year: string;
  month: TimelineMonth;
  onOpenEvent: (event: TimelineEvent) => void;
  onOpenImage: (event: TimelineEvent) => void;
}) {
  return (
    <motion.div
      layout
      className="grid grid-cols-[4.6rem_minmax(0,1fr)] gap-2 md:grid-cols-[8rem_minmax(0,1fr)] md:gap-4"
      transition={{ layout: { type: "spring", stiffness: 180, damping: 22 } }}
    >
      <div className="relative pr-3 pt-1 text-right md:pr-4">
        <p className="relative z-10 inline-block bg-[#f6f3ee] pr-1 text-xl font-semibold leading-none text-stone-950 md:hidden">
          {year}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-teal-700 md:mt-2 md:text-sm md:tracking-[0.16em]">
          {month.monthLabel}
        </p>
        <div className="absolute right-0.5 top-0 z-20 flex h-full justify-center">
          <div className="absolute bottom-[-1rem] top-2 w-px bg-stone-300" />
          <span className="relative mt-1 h-3 w-3 rounded-full bg-teal-700 ring-4 ring-[#f6f3ee] md:h-3.5 md:w-3.5" />
        </div>
      </div>
      <div className="grid min-w-0 gap-2.5">
        {month.events.map((event) => (
          <EventRow
            key={event.id}
            event={event}
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
  onOpenEvent,
  onOpenImage,
}: {
  event: TimelineEvent;
  onOpenEvent: (event: TimelineEvent) => void;
  onOpenImage: (event: TimelineEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const viewMode = getEventViewMode(event);
  const zoomConfig = getViewConfig(viewMode);
  const isLongDescription = event.description.length > zoomConfig.descriptionLength;
  const description =
    expanded || !isLongDescription
      ? event.description
      : `${event.description.slice(0, zoomConfig.descriptionLength).trim()}...`;
  const detail = viewMode === "detail";
  const compact = viewMode === "compact";
  const weight = getEventWeight(event);

  return (
    <motion.article
      layout
      data-event-id={event.id}
      className="grid w-full min-w-0 gap-2"
      transition={{ layout: { type: "spring", stiffness: 180, damping: 22 } }}
    >
      <div
        className={
          weight === "milestone"
            ? "w-[calc(100vw-6.35rem)] min-w-0 max-w-full rounded-2xl border border-orange-200/90 border-l-4 border-l-orange-400 bg-[linear-gradient(180deg,#fffdf8_0%,#fff6ea_100%)] p-5 shadow-[0_18px_45px_-34px_rgba(188,122,37,0.45)] md:w-full md:p-6"
            : compact
              ? "w-[calc(100vw-6.35rem)] min-w-0 max-w-full rounded-2xl border border-stone-200/90 bg-white/95 p-4 shadow-sm md:w-full md:p-4"
            : weight === "brief"
              ? "w-[calc(100vw-6.35rem)] min-w-0 max-w-full rounded-2xl border border-stone-200/90 bg-white/95 p-4 shadow-sm md:w-full md:p-4.5"
              : event.importance === "important"
                ? "w-[calc(100vw-6.35rem)] min-w-0 max-w-full rounded-2xl border border-amber-200/80 border-l-4 border-l-amber-300 bg-[linear-gradient(180deg,#fffefb_0%,#fffdfa_100%)] p-4 shadow-[0_18px_40px_-34px_rgba(161,98,7,0.22)] md:w-full md:p-5"
                : "w-[calc(100vw-6.35rem)] min-w-0 max-w-full rounded-2xl border border-stone-200/90 bg-white/95 p-4 shadow-[0_18px_40px_-32px_rgba(33,31,28,0.42)] md:w-full md:p-5"
        }
      >
        <button className="w-full min-w-0 text-left" onClick={() => onOpenEvent(event)}>
          <span className="text-sm font-semibold text-stone-500">{formatEventDateNumeric(event.event_date)}</span>
          <EventMetaBadges event={event} className="mt-2" compact />
          <h2
            className={
              detail || weight === "milestone"
                ? "mt-2 text-2xl font-semibold leading-tight text-stone-950"
                : compact
                  ? "mt-1 text-lg font-semibold leading-tight text-stone-950"
                  : "mt-1 text-xl font-semibold leading-tight text-stone-950"
            }
          >
            {event.title}
          </h2>
        </button>

        <div className={compact ? "mt-2 text-sm leading-6 text-stone-700" : "mt-3 text-sm leading-6 text-stone-700 md:text-base md:leading-7"}>
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

        {viewMode !== "compact" || weight === "milestone" ? (
          <EventMediaStack event={event} detail={detail || weight === "milestone"} onOpenImage={onOpenImage} />
        ) : (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {event.image_url ? <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Bild</span> : null}
            {event.video_url ? <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">Video</span> : null}
            {event.audio_url ? <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">Audio</span> : null}
            {event.pdf_url ? <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">PDF</span> : null}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
            onClick={() => onOpenEvent(event)}
          >
            <ChevronRight className="h-4 w-4" />
            Bericht öffnen
          </button>
          <CopyEventLinkButton event={event} />
          {event.video_url ? (
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-900 hover:bg-stone-50"
              onClick={() => onOpenEvent(event)}
            >
              <Play className="h-4 w-4 fill-current" />
              Video ansehen
            </button>
          ) : null}
          {event.audio_url ? (
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-900 hover:bg-stone-50"
              onClick={() => onOpenEvent(event)}
            >
              <Play className="h-4 w-4 fill-current" />
              Audio anhören
            </button>
          ) : null}
          {event.pdf_url ? (
            <a
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-900 hover:bg-stone-50"
              href={event.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="h-4 w-4" />
              PDF öffnen
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
  if (!event.image_url && !event.video_url && !event.audio_url) return null;

  return (
    <div className={detail ? "mt-5 grid gap-4" : "mt-4 grid gap-3"}>
      {event.image_url ? (
        <button
          className="group relative flex min-h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl bg-stone-100 p-2 md:min-h-[280px] md:max-h-[500px]"
          onClick={() => onOpenImage(event)}
          aria-label={`${event.title} als grosses Bild öffnen`}
        >
          <EventImage
            src={event.image_url}
            alt={event.title}
            className="max-h-[320px] w-full object-contain transition duration-300 group-hover:scale-[1.01] md:max-h-[500px]"
          />
          <span className="absolute right-3 top-3 rounded-full bg-white/92 p-2 text-stone-900 shadow-sm">
            <ImageIcon className="h-5 w-5" />
          </span>
        </button>
      ) : null}

      {event.video_url ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <VideoFrame url={event.video_url} title={event.title} />
        </div>
      ) : null}

      {event.audio_url ? <AudioPlayer url={event.audio_url} title={event.title} /> : null}
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
      className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-900 hover:bg-stone-50"
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
  const years = new Map<string, { year: string; firstEvent: TimelineEvent; count: number }>();

  for (const event of events) {
    const year = getYear(event.event_date);
    const existing = years.get(year);

    if (existing) {
      existing.count += 1;
    } else {
      years.set(year, { year, firstEvent: event, count: 1 });
    }
  }

  return [...years.values()];
}

function buildTimelineYears(events: TimelineEvent[], annualMetrics: AnnualMetric[]) {
  const years = new Map<string, TimelineYear>();
  const metricsByYear = new Map<string, AnnualMetric[]>();

  for (const metric of annualMetrics) {
    const existing = metricsByYear.get(metric.year);
    if (existing) {
      existing.push(metric);
    } else {
      metricsByYear.set(metric.year, [metric]);
    }
  }

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
        metrics: metricsByYear.get(year) ?? [],
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

  for (const [year, metrics] of metricsByYear) {
    if (years.has(year)) continue;

    years.set(year, {
      id: year,
      year,
      events: [],
      metrics,
      months: [],
    });
  }

  return [...years.values()].sort((a, b) => Number(a.year) - Number(b.year));
}

function getEventWeight(event: TimelineEvent): EventWeight {
  if (event.importance === "milestone") return "milestone";
  if (event.importance === "important") return "standard";
  if (event.importance === "standard") {
    const mediaCount = [event.image_url, event.video_url, event.audio_url, event.pdf_url].filter(Boolean).length;
    if (event.video_url || event.audio_url || mediaCount >= 2 || event.description.length > 520) return "milestone";
    if (event.description.length < 120 && !event.image_url && !event.video_url && !event.audio_url) return "brief";
    return "standard";
  }

  const mediaCount = [event.image_url, event.video_url, event.audio_url, event.pdf_url].filter(Boolean).length;
  if (event.video_url || event.audio_url || mediaCount >= 2 || event.description.length > 520) return "milestone";
  if (event.description.length < 120 && !event.image_url && !event.video_url && !event.audio_url) return "brief";
  return "standard";
}

function hasExpandedEvents(events: TimelineEvent[]) {
  return events.some((event) => getEventViewMode(event) !== "compact");
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

function getEventViewMode(event: TimelineEvent): EventViewMode {
  if (event.importance === "milestone") return "detail";
  if (event.importance === "important") return "normal";
  return "compact";
}

function formatMetricValue(value: number, unit: string | null) {
  const formatted = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatMetricParts(value: number, unit: string | null) {
  return {
    value: new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(value),
    unit: unit ?? null,
  };
}

function getViewConfig(viewMode: EventViewMode) {
  if (viewMode === "detail") {
    return { descriptionLength: 520 };
  }

  if (viewMode === "normal") {
    return { descriptionLength: 220 };
  }

  return { descriptionLength: 110 };
}
