import { AnnualMetricForm } from "@/components/annual-metric-form";
import { AnnualMetricList } from "@/components/annual-metric-list";
import { EventForm } from "@/components/event-form";
import { EventList } from "@/components/event-list";
import { getAnnualMetrics, getTimelineEvents } from "@/lib/timeline";

export default async function AdminPage() {
  const events = await getTimelineEvents();
  const annualMetrics = await getAnnualMetrics();

  return (
    <div className="grid gap-8">
      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-stone-950">Verwaltung</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Ereignisse anlegen, Medien hochladen und die Stufe `Standard`, `Wichtig` oder `Meilenstein`
              bewusst vergeben.
            </p>
          </div>
          <div className="grid gap-5">
            <h3 className="text-base font-semibold text-stone-950">Neues Ereignis</h3>
            <EventForm />
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-xl font-semibold text-stone-950">Alle Ereignisse</h2>
          <EventList events={events} />
        </section>
      </div>

      <section className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <div className="grid gap-5">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">Jahreskennzahlen</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Flexible Kennzahlen pro Jahr, inklusive optionalem Vergleichswert mit automatisch berechneter Quote.
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
    </div>
  );
}
