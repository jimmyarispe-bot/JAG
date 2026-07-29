export function JagPlaceholderPage({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      <p className="mt-6 text-xs uppercase tracking-wide text-slate-400">
        Placeholder — Phase 1
      </p>
    </section>
  );
}
