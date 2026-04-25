import { notFound, redirect } from "next/navigation";
import { getTimelineEventBySlug } from "@/lib/db";

export default async function EventRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getTimelineEventBySlug(slug);

  if (!event) {
    notFound();
  }

  redirect(`/#event-${encodeURIComponent(event.slug)}`);
}
