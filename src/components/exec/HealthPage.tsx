import Link from "next/link";
import { DataModeBadge } from "@/components/exec/DataModeBadge";
import { WidgetFrame } from "@/components/exec/WidgetFrame";
import { ScoreHero } from "@/components/exec/WidgetPrimitives";
import type { ExecHealthViewModel } from "@/lib/exec/view-models";

export function HealthPage({ data }: { data: ExecHealthViewModel }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Organization Health
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Is the organization healthy, improving, or deteriorating — and where?
          </p>
        </div>
        <DataModeBadge mode={data.dataMode} />
      </div>

      <WidgetFrame
        widgetId="health.overall"
        title="Overall health score"
        domains={["organization-health", "oios-core"]}
        dataMode={data.dataMode}
      >
        <ScoreHero score={data.overall.score} band={data.overall.band} label="Composite" />
        <p className="mt-3 text-sm text-slate-600">{data.overall.narrative}</p>
      </WidgetFrame>

      <WidgetFrame
        widgetId="health.departments"
        title="Department / domain scores"
        domains={[
          "operations",
          "financial",
          "human-capital",
          "customer",
          "legal-compliance-risk",
          "wisdom",
        ]}
        dataMode={data.dataMode}
      >
        {data.departments.length === 0 ? (
          <p className="text-sm text-slate-500">No department scores available yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.departments.map((dept) => (
              <Link
                key={dept.key}
                href={dept.href}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <p className="text-xs text-slate-500">{dept.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                  {dept.score}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{dept.domain}</p>
              </Link>
            ))}
          </div>
        )}
      </WidgetFrame>
    </div>
  );
}
