import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/event-form";
import { getTimelineEvents } from "@/lib/timeline";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await getTimelineEvents();
  const event = events.find((item) => item.id === id);

  if (!event) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-2xl">
      <Link className="text-sm font-semibold text-teal-700 hover:text-teal-900" href="/admin">
        Zurueck zur Uebersicht
      </Link>
      <h2 className="mb-4 mt-3 text-2xl font-semibold text-stone-950">Ereignis bearbeiten</h2>
      <EventForm event={event} />
    </section>
  );
}
