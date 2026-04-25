import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, ImageIcon } from "lucide-react";
import { VideoFrame } from "@/components/video-frame";
import { getTimelineEventBySlug } from "@/lib/db";
import { siteConfig } from "@/lib/env";
import { formatEventDate } from "@/lib/timeline-format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = getTimelineEventBySlug(slug);

  if (!event) {
    return {
      title: "Ereignis nicht gefunden",
    };
  }

  const description = shorten(event.description, 155);
  const image = event.image_url || "/logo-timeline.png";
  const url = `/ereignis/${encodeURIComponent(event.slug)}`;

  return {
    title: `${event.title} | ${siteConfig.name}`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: event.title,
      description,
      url,
      type: "article",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: [image],
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = getTimelineEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8">
      <Link className="text-sm font-semibold text-teal-700 hover:text-teal-900" href={`/#event-${event.slug}`}>
        In der Timeline anzeigen
      </Link>

      <article className="mt-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-sm font-semibold text-teal-700">{formatEventDate(event.event_date)}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-stone-950 sm:text-5xl">{event.title}</h1>
        <p className="mt-5 whitespace-pre-line leading-7 text-stone-700">{event.description}</p>

        {event.image_url ? (
          <div className="mt-6 aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
            {/* Event images may come from arbitrary external URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="mt-6 flex aspect-[4/3] items-center justify-center rounded-lg bg-stone-100 text-stone-400">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        {event.video_url ? (
          <div className="mt-6 aspect-video overflow-hidden rounded-lg bg-black">
            <VideoFrame url={event.video_url} title={event.title} />
          </div>
        ) : null}

        {event.pdf_url ? (
          <a
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-md border border-stone-300 px-4 text-sm font-semibold text-stone-900 hover:bg-stone-50"
            href={event.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText className="h-4 w-4" />
            Dokument öffnen
          </a>
        ) : null}
      </article>
    </main>
  );
}

function shorten(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 3).trim()}...`;
}
