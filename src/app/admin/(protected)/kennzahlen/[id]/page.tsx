import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnualMetricForm } from "@/components/annual-metric-form";
import { getAnnualMetricById } from "@/lib/db";
import { getTimelineEvents } from "@/lib/timeline";

export default async function EditAnnualMetricPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const metric = getAnnualMetricById(id);
  const events = await getTimelineEvents();

  if (!metric) {
    notFound();
  }

  const yearOptions = buildYearOptions(events.map((event) => event.event_date.slice(0, 4)));

  return (
    <section className="mx-auto max-w-2xl">
      <Link className="text-sm font-semibold text-teal-700 hover:text-teal-900" href="/admin/kennzahlen">
        Zurück zu den Kennzahlen
      </Link>
      <h2 className="mb-4 mt-3 text-2xl font-semibold text-stone-950">Jahreskennzahl bearbeiten</h2>
      <AnnualMetricForm metric={metric} yearOptions={yearOptions} />
    </section>
  );
}

function buildYearOptions(eventYears: string[]) {
  const years = new Set<string>();

  for (const year of eventYears) {
    if (year) years.add(year);
  }

  return [...years].sort((a, b) => Number(a) - Number(b));
}
