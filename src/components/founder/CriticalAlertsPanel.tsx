import type { FounderAlert, FounderAlertCategory } from "@/lib/platform/founder/types";

const CATEGORY_ORDER: FounderAlertCategory[] = [
  "critical",
  "high",
  "medium",
  "informational",
];

const CATEGORY_LABEL: Record<FounderAlertCategory, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  informational: "Informational",
};

type CriticalAlertsPanelProps = {
  alerts: FounderAlert[];
  organizationNames: Record<string, string>;
  applicationNames: Record<string, string>;
};

/** Groups pre-categorized alerts for display only. */
export function CriticalAlertsPanel({
  alerts,
  organizationNames,
  applicationNames,
}: CriticalAlertsPanelProps) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: alerts.filter((a) => a.category === category),
  }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="alerts-heading">
      <h2 id="alerts-heading" className="text-lg font-semibold text-slate-900">
        Critical Alerts
      </h2>
      {alerts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No open alerts.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {grouped.map(({ category, items }) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {CATEGORY_LABEL[category]} ({items.length})
              </p>
              {items.length === 0 ? (
                <p className="mt-1 text-xs text-slate-400">None</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {items.map((alert) => (
                    <li
                      key={alert.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {alert.organizationId
                          ? organizationNames[alert.organizationId] ?? alert.organizationId
                          : "Platform"}
                        {" · "}
                        {alert.applicationKey
                          ? applicationNames[alert.applicationKey] ?? alert.applicationKey
                          : "—"}
                        {" · "}
                        {new Date(alert.createdAt).toLocaleString()}
                        {" · "}
                        {alert.unread ? "Unread" : "Read"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
