import Link from "next/link";
import { notFound } from "next/navigation";
import { AnnualMetricForm } from "@/components/annual-metric-form";
import { getAnnualMetricById } from "@/lib/db";

export default async function EditAnnualMetricPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const metric = getAnnualMetricById(id);

  if (!metric) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-2xl">
      <Link className="text-sm font-semibold text-teal-700 hover:text-teal-900" href="/admin/kennzahlen">
        Zurück zu den Kennzahlen
      </Link>
      <h2 className="mb-4 mt-3 text-2xl font-semibold text-stone-950">Jahreskennzahl bearbeiten</h2>
      <AnnualMetricForm metric={metric} />
    </section>
  );
}
