import type { OrganizationExecutiveBrief } from "@/lib/platform/intelligence/organization/types";

interface ExecutiveBriefProps {
  brief: OrganizationExecutiveBrief | null;
  generatedAt: string;
  fullName: string;
}

export function ExecutiveBrief({ brief, generatedAt, fullName }: ExecutiveBriefProps) {
  if (!brief) {
    return (
      <section id="executive-brief" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Executive Morning Brief</h2>
        <p className="mt-2 text-sm text-slate-500">No organizational brief available for this cycle.</p>
      </section>
    );
  }

  return (
    <section
      id="executive-brief"
      className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-50/80 via-white to-slate-50 p-6 shadow-sm"
      data-stream-ready="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Executive Morning Brief
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{brief.headline}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Good day, {fullName}. Generated {new Date(generatedAt).toLocaleString()}.
          </p>
        </div>
        <div className="rounded-xl bg-white/80 px-3 py-2 text-center ring-1 ring-slate-200">
          <p className="text-2xl font-semibold text-slate-900">{brief.health.score}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{brief.health.band}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-700">{brief.summary}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{brief.narrative}</p>
      {brief.recommendations.length > 0 && (
        <ul className="mt-4 space-y-2">
          {brief.recommendations.slice(0, 3).map((rec) => (
            <li key={rec.recommendationId} className="rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-100">
              <span className="font-medium text-slate-900">{rec.title}</span>
              <span className="ml-2 text-xs uppercase text-slate-500">{rec.priority}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
