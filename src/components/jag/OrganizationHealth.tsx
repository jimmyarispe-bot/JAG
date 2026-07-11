import type { OrganizationHealthScore } from "@/lib/platform/intelligence/organization/types";
import type { ExecutiveKPIs } from "@/lib/executive/kpis";

interface OrganizationHealthProps {
  health: OrganizationHealthScore | null;
  kpis: ExecutiveKPIs | null;
}

export function OrganizationHealth({ health, kpis }: OrganizationHealthProps) {
  const monitors = health ? Object.entries(health.monitorScores) : [];

  return (
    <section id="organization-health" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Organization Health</h2>
      {health ? (
        <>
          <p className="mt-1 text-sm text-slate-500">{health.summary}</p>
          <div className="mt-4 flex items-end gap-4">
            <div>
              <p className="text-3xl font-semibold text-slate-900">{health.score}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{health.band}</p>
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${Math.min(100, Math.max(0, health.score))}%` }}
              />
            </div>
          </div>
          {monitors.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {monitors.map(([key, score]) => (
                <li key={key} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="capitalize text-slate-600">{key.replaceAll("_", " ")}</span>
                  <span className="font-medium text-slate-900">{score}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Health score unavailable.</p>
      )}
      {kpis && (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Enrollment", value: kpis.enrollment },
            { label: "Attendance", value: `${kpis.studentAttendance}%` },
            { label: "Staff", value: kpis.staff },
            { label: "Revenue", value: kpis.revenue },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-100 px-3 py-2">
              <dt className="text-xs text-slate-500">{item.label}</dt>
              <dd className="text-sm font-semibold text-slate-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
