import type { FounderSystemStatusItem } from "@/lib/platform/founder/system-status-display";

export type SystemStatusItem = FounderSystemStatusItem;

type SystemStatusPanelProps = {
  items: FounderSystemStatusItem[];
};

const STATUS_LABEL: Record<FounderSystemStatusItem["status"], string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  unavailable: "Unavailable",
  not_monitored: "Not yet monitored",
};

export function SystemStatusPanel({ items }: SystemStatusPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="system-status-heading">
      <h2 id="system-status-heading" className="text-lg font-semibold text-slate-900">
        System Status
      </h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
          >
            <p className="text-sm font-medium text-slate-900">{item.label}</p>
            <p className="mt-1 text-xs font-semibold text-slate-700">
              {STATUS_LABEL[item.status]}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
