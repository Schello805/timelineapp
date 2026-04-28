import { AnnualMetricForm } from "@/components/annual-metric-form";
import { AnnualMetricList } from "@/components/annual-metric-list";
import { getAnnualMetrics } from "@/lib/timeline";

export default async function AdminMetricsPage() {
  const annualMetrics = await getAnnualMetrics();

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
        <AnnualMetricForm />
      </div>
      <div>
        <h2 className="mb-4 text-xl font-semibold text-stone-950">Alle Jahreskennzahlen</h2>
        <AnnualMetricList metrics={annualMetrics} />
      </div>
    </section>
  );
}
