import type { FounderMetric } from "@/lib/platform/founder/types";

const DISPLAY_KEYS = [
  "active_students",
  "new_applications",
  "tuition_collected",
  "attendance",
  "open_risks",
  "active_staff",
  "pending_approvals",
  "system_health",
] as const;

const DISPLAY_LABELS: Record<(typeof DISPLAY_KEYS)[number], string> = {
  active_students: "Students",
  new_applications: "Applications",
  tuition_collected: "Revenue",
  attendance: "Attendance",
  open_risks: "Open Risks",
  active_staff: "Active Staff",
  pending_approvals: "Outstanding Tasks",
  system_health: "System Health",
};

type ExecutiveMetricsPanelProps = {
  metrics: FounderMetric[];
};

/** KPI cards from FounderWorkspaceContext.metrics — no computation. */
export function ExecutiveMetricsPanel({ metrics }: ExecutiveMetricsPanelProps) {
  const byKey = new Map(metrics.map((m) => [m.key, m]));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="metrics-heading">
      <h2 id="metrics-heading" className="text-lg font-semibold text-slate-900">
        Executive Metrics
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DISPLAY_KEYS.map((key) => {
          const metric = byKey.get(key);
          const value =
            metric?.value == null
              ? "—"
              : metric.unit === "%"
                ? `${metric.value}%`
                : metric.unit === "USD"
                  ? metric.value.toLocaleString()
                  : String(metric.value);
          return (
            <li
              key={key}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {DISPLAY_LABELS[key]}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
              <p className="mt-1 text-xs text-slate-500">
                {metric?.status ?? "unknown"}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
