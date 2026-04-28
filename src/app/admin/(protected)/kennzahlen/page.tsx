import { AnnualMetricForm } from "@/components/annual-metric-form";
import { AnnualMetricList } from "@/components/annual-metric-list";
import { getAnnualMetrics, getTimelineEvents } from "@/lib/timeline";

export default async function AdminMetricsPage() {
  const annualMetrics = await getAnnualMetrics();
  const events = await getTimelineEvents();
  const yearOptions = buildYearOptions(events.map((event) => event.event_date.slice(0, 4)), annualMetrics.map((metric) => metric.year));

  return (
    <section className="grid gap-8 lg:grid-cols-[420px_1fr]">
      <div className="grid gap-5">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Kennzahlen</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Flexible Jahreskennzahlen mit optionalem Vergleichswert und automatisch berechneter Quote.
            Ideal für Werte wie Geflüchtete gesamt, davon berufstätig, Umsatz oder Mitarbeiterzahl.
          </p>
        </div>
        <AnnualMetricForm yearOptions={yearOptions} />
      </div>
      <div>
        <h2 className="mb-4 text-xl font-semibold text-stone-950">Alle Jahreskennzahlen</h2>
        <AnnualMetricList metrics={annualMetrics} />
      </div>
    </section>
  );
}

function buildYearOptions(eventYears: string[], metricYears: string[]) {
  const currentYear = new Date().getFullYear();
  const years = new Set<string>();

  for (let year = currentYear - 5; year <= currentYear + 5; year += 1) {
    years.add(String(year));
  }

  for (const year of [...eventYears, ...metricYears]) {
    if (year) years.add(year);
  }

  return [...years].sort((a, b) => Number(a) - Number(b));
}
