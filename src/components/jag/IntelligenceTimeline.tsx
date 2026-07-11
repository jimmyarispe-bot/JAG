import type { OrganizationTimelineEntry } from "@/lib/platform/intelligence/organization/types";

interface IntelligenceTimelineProps {
  timeline: readonly OrganizationTimelineEntry[];
}

export function IntelligenceTimeline({ timeline }: IntelligenceTimelineProps) {
  return (
    <section id="intelligence-timeline" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Intelligence Timeline</h2>
      {timeline.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No timeline entries for this cycle.</p>
      ) : (
        <ol className="mt-4 space-y-3 border-l border-slate-200 pl-4">
          {timeline.slice(0, 16).map((entry) => (
            <li key={entry.entryId} className="relative">
              <span className="absolute -left-[1.3125rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{entry.title}</p>
                <time className="text-xs text-slate-500" dateTime={entry.occurredAt}>
                  {new Date(entry.occurredAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">{entry.kind}</p>
              <p className="mt-1 text-sm text-slate-600">{entry.detail}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
