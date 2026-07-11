import type { OrganizationAlert } from "@/lib/platform/intelligence/organization/types";

interface ActiveAlertsProps {
  alerts: readonly OrganizationAlert[];
}

const severityClass: Record<string, string> = {
  critical: "bg-red-50 text-red-700 ring-red-100",
  high: "bg-orange-50 text-orange-700 ring-orange-100",
  medium: "bg-amber-50 text-amber-700 ring-amber-100",
  low: "bg-slate-50 text-slate-600 ring-slate-100",
  info: "bg-sky-50 text-sky-700 ring-sky-100",
};

export function ActiveAlerts({ alerts }: ActiveAlertsProps) {
  const critical = alerts.filter((a) => a.severity === "critical" || a.severity === "high");

  return (
    <section id="critical-alerts" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Critical Alerts</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {critical.length} priority / {alerts.length} total
        </span>
      </div>
      {alerts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No active alerts in this observation cycle.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {alerts.slice(0, 8).map((alert) => (
            <li
              key={alert.alertId}
              className={`rounded-xl px-3 py-2.5 ring-1 ${severityClass[alert.severity] ?? severityClass.low}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{alert.title}</p>
                <span className="text-[11px] font-semibold uppercase tracking-wide">{alert.severity}</span>
              </div>
              <p className="mt-1 text-sm opacity-90">{alert.message}</p>
              <p className="mt-1 text-xs opacity-70">{alert.monitor.replaceAll("_", " ")}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
