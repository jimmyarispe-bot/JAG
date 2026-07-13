import { DataModeBadge } from "@/components/exec/DataModeBadge";
import { WidgetFrame } from "@/components/exec/WidgetFrame";
import { ItemList } from "@/components/exec/WidgetPrimitives";
import type { ExecRiskViewModel } from "@/lib/exec/view-models";

export function RiskPage({ data }: { data: ExecRiskViewModel }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Risk Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Prioritized portfolio across financial, operational, legal, compliance, cyber, reputation,
            economic, political, and environmental risk
          </p>
        </div>
        <DataModeBadge mode={data.dataMode} />
      </div>

      <WidgetFrame
        widgetId="risk.heatmap"
        title="Category pressure"
        domains={["legal-compliance-risk"]}
        dataMode={data.dataMode}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((cat) => (
            <div key={cat.key} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{cat.label}</p>
                <p className="text-lg font-semibold tabular-nums text-slate-900">{cat.pressure}</p>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{cat.domains.join(" · ")}</p>
              <div className="mt-3">
                <ItemList items={cat.items.slice(0, 2)} empty="No open items" />
              </div>
            </div>
          ))}
        </div>
      </WidgetFrame>

      <WidgetFrame
        widgetId="risk.priority.list"
        title="Prioritized risks"
        domains={["legal-compliance-risk", "wisdom"]}
        dataMode={data.dataMode}
      >
        <ItemList items={data.prioritized} />
      </WidgetFrame>
    </div>
  );
}
