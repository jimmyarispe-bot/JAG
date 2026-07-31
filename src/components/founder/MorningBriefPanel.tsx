import type { FounderBriefingSection } from "@/lib/platform/founder/types";

const SECTION_TITLES: Record<string, string> = {
  platform_status: "Platform Status",
  admissions: "Admissions",
  enrollment: "Enrollment",
  attendance: "Attendance",
  finance: "Finance",
  staffing: "Staffing",
  technology: "Technology",
  security: "Security",
  critical_issues: "Risks",
  ai_summary: "Executive Summary",
};

type MorningBriefPanelProps = {
  sections: FounderBriefingSection[];
  generatedAt: string;
  emptyMessage?: string;
};

/** Renders Sprint 064 intelligence sections — no computation. */
export function MorningBriefPanel({
  sections,
  generatedAt,
  emptyMessage = "No morning brief sections available.",
}: MorningBriefPanelProps) {
  if (!sections.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="morning-brief-heading">
        <h2 id="morning-brief-heading" className="text-lg font-semibold text-slate-900">
          Executive Morning Brief
        </h2>
        <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="morning-brief-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="morning-brief-heading" className="text-lg font-semibold text-slate-900">
          Executive Morning Brief
        </h2>
        <p className="text-xs text-slate-500">
          As of {new Date(generatedAt).toLocaleString()}
        </p>
      </div>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <li
            key={section.id}
            className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              {SECTION_TITLES[section.id] ?? section.title}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {section.keyInsight || section.summary || "No insight for this section."}
            </p>
            {(section.supportingMetrics?.length ?? 0) > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {section.supportingMetrics!.map((m) => (
                  <li key={m.key}>
                    {m.label}: {m.value ?? "n/a"}
                    {m.unit === "%" ? "%" : m.unit ? ` ${m.unit}` : ""}
                  </li>
                ))}
              </ul>
            )}
            {(section.recommendedActions?.length ?? 0) > 0 ? (
              <p className="mt-3 text-xs text-slate-700">
                <span className="font-semibold">Recommended: </span>
                {section.recommendedActions![0]}
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-400">No recommended action.</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
