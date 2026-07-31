import type { PrioritizedInsight } from "@/lib/platform/intelligence/executive-layer";

type ActivePrioritiesPanelProps = {
  priorities: PrioritizedInsight[];
};

export function ActivePrioritiesPanel({ priorities }: ActivePrioritiesPanelProps) {
  const top = priorities.slice(0, 8);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="priorities-heading">
      <h2 id="priorities-heading" className="text-lg font-semibold text-slate-900">
        Active Priorities
      </h2>
      {top.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No prioritized insights.</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {top.map((item, index) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-900">
                  <span className="mr-2 text-xs font-semibold text-slate-400">
                    {index + 1}.
                  </span>
                  {item.statement}
                </p>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200">
                  {item.priority}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
