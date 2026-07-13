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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Organization Health</h1>
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
        domains={["operations", "financial", "human-capital", "customer", "legal-compliance-risk", "wisdom"]}
        dataMode={data.dataMode}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.departments.map((dept) => (
            <Link
              key={dept.key}
              href={dept.href}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
            >
              <p className="text-xs text-slate-500">{dept.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{dept.score}</p>
              <p className="mt-1 text-[11px] text-slate-400">{dept.domain}</p>
            </Link>
          ))}
        </div>
      </WidgetFrame>

      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetFrame
          widgetId="health.trend"
          title="Trends"
          domains={["organization-health"]}
          dataMode="synthetic"
        >
          <p className="mb-3 text-xs text-amber-800">
            Trend deltas use sample prior-period estimates until history connectors are live.
          </p>
          <ul className="space-y-3">
            {data.trends.map((t) => (
              <li key={t.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{t.label}</span>
                <span
                  className={
                    t.direction === "up"
                      ? "font-medium tabular-nums text-emerald-700"
                      : t.direction === "down"
                        ? "font-medium tabular-nums text-rose-700"
                        : "font-medium tabular-nums text-slate-600"
                  }
                >
                  {t.delta > 0 ? "+" : ""}
                  {t.delta}
                </span>
              </li>
            ))}
          </ul>
        </WidgetFrame>

        <WidgetFrame
          widgetId="health.history.compare"
          title="Historical comparison"
          domains={["institutional-memory"]}
          dataMode="synthetic"
        >
          <p className="mb-3 text-xs text-amber-800">
            Prior periods are simulated for layout validation — replace with repository history.
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="pb-2 font-medium">Period</th>
                <th className="pb-2 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((row) => (
                <tr key={row.period} className="border-b border-slate-100">
                  <td className="py-2 text-slate-700">{row.period}</td>
                  <td className="py-2 tabular-nums font-medium text-slate-900">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </WidgetFrame>
      </div>
    </div>
  );
}
