export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <article className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-semibold text-stone-950">{title}</h1>
        <div className="mt-6 space-y-5 text-base leading-7 text-stone-650">{children}</div>
      </article>
    </main>
  );
}
