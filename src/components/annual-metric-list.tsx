import { Pencil } from "lucide-react";
import { DeleteAnnualMetricForm } from "@/components/delete-annual-metric-form";
import type { AnnualMetric } from "@/lib/types";

export function AnnualMetricList({ metrics }: { metrics: AnnualMetric[] }) {
  if (metrics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-5 text-sm leading-6 text-stone-600">
        Noch keine Jahreskennzahlen vorhanden.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="grid gap-0">
        {metrics.map((metric) => (
          <div key={metric.id} className="grid gap-3 border-b border-stone-100 p-4 last:border-b-0 lg:grid-cols-[7rem_minmax(0,1fr)_auto]">
            <div>
              <p className="text-sm font-semibold text-teal-700">{metric.year}</p>
              <p className="mt-1 text-xs text-stone-500">Reihenfolge {metric.display_order}</p>
            </div>

            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-stone-950">{metric.label}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {formatMetricValue(metric.value, metric.unit)}
                {metric.comparison_label && metric.comparison_value !== null ? (
                  <span className="text-stone-500">
                    {" "}
                    | {metric.comparison_label}: {formatMetricValue(metric.comparison_value, metric.comparison_unit)}
                  </span>
                ) : null}
              </p>
              {metric.description ? <p className="mt-2 text-sm leading-6 text-stone-600">{metric.description}</p> : null}
            </div>

            <div className="flex flex-wrap items-start gap-2 lg:justify-end">
              <a
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-800 hover:bg-stone-50"
                href={`/admin/kennzahlen/${metric.id}`}
                title="Jahreskennzahl bearbeiten"
                aria-label={`${metric.label} bearbeiten`}
              >
                <Pencil className="h-4 w-4" />
              </a>
              <DeleteAnnualMetricForm id={metric.id} label={metric.label} year={metric.year} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMetricValue(value: number, unit: string | null) {
  const formatted = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}
