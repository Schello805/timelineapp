"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, FileText, ImageIcon, Play } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { TimelineEvent } from "@/lib/types";
import { formatEventDate, getYear } from "@/lib/timeline-format";
import { AppLogo } from "@/components/app-logo";
import { VideoFrame } from "@/components/video-frame";

export function TimelineClient({ events }: { events: TimelineEvent[] }) {
  const [selectedImage, setSelectedImage] = useState<TimelineEvent | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TimelineEvent | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const years = useMemo(
    () => Array.from(new Set(events.map((event) => getYear(event.event_date)))),
    [events],
  );

  function scrollToYear(year: string) {
    const target = document.querySelector(`[data-year="${year}"]`);
    target?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <>
      <section className="relative overflow-hidden bg-[#f6f3ee]">
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col px-5 pb-28 pt-8 sm:pt-12">
          <div className="mb-8 max-w-3xl">
            <div className="mb-8">
              <AppLogo />
            </div>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-teal-700">
              <CalendarDays className="h-4 w-4" />
              Interaktive Medien-Timeline
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-stone-950 sm:text-6xl">
              Erinnerungen, Medien und Dokumente in einem Zeitstrahl.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-650 sm:text-lg">
              Swipe durch Ereignisse, oeffne Bilder gross, spiele Videos direkt ab und
              lade PDF-Dokumente in einem neuen Tab.
            </p>
          </div>

          <div
            ref={scrollerRef}
            className="flex snap-x gap-4 overflow-x-auto pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Timeline Ereignisse"
          >
            {events.map((event, index) => (
              <motion.article
                key={event.id}
                data-year={getYear(event.event_date)}
                className="min-w-[82vw] snap-center overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm sm:min-w-[420px]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: Math.min(index * 0.04, 0.22) }}
              >
                <div className="relative aspect-[4/3] bg-stone-100">
                  {event.image_url ? (
                    <button
                      className="group relative h-full w-full"
                      onClick={() => setSelectedImage(event)}
                      aria-label={`${event.title} als grosses Bild oeffnen`}
                    >
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        sizes="(max-width: 640px) 82vw, 420px"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                      <span className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-stone-900 shadow-sm">
                        <ImageIcon className="h-5 w-5" />
                      </span>
                    </button>
                  ) : event.video_url ? (
                    <button
                      className="flex h-full w-full items-center justify-center bg-stone-900 text-white"
                      onClick={() => setSelectedVideo(event)}
                      aria-label={`${event.title} Video abspielen`}
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-stone-950">
                        <Play className="h-7 w-7 fill-current" />
                      </span>
                    </button>
                  ) : (
                    <div className="flex h-full items-center justify-center text-stone-400">
                      <CalendarDays className="h-12 w-12" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-sm font-semibold text-teal-700">
                    {formatEventDate(event.event_date)}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-stone-950">{event.title}</h2>
                  <p className="mt-3 text-base leading-7 text-stone-650">{event.description}</p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {event.video_url && event.image_url ? (
                      <button
                        className="inline-flex h-11 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
                        onClick={() => setSelectedVideo(event)}
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
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {years.map((year) => (
              <button
                key={year}
                className="h-10 min-w-20 rounded-md border border-stone-200 px-4 text-sm font-semibold text-stone-700 hover:border-teal-600 hover:text-teal-700"
                onClick={() => scrollToYear(year)}
              >
                {year}
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
