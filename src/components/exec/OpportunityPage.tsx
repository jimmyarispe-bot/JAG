"use client";

import { useMemo, useState } from "react";
import { DataModeBadge } from "@/components/exec/DataModeBadge";
import { WidgetFrame } from "@/components/exec/WidgetFrame";
import { ItemList } from "@/components/exec/WidgetPrimitives";
import type { ExecOpportunityTab, ExecOpportunityViewModel } from "@/lib/exec/view-models";

export function OpportunityPage({ data }: { data: ExecOpportunityViewModel }) {
  const [tab, setTab] = useState<ExecOpportunityTab>("all");
  const active = useMemo(
    () => data.tabs.find((t) => t.key === tab) ?? data.tabs[0],
    [data.tabs, tab]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Opportunity Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Revenue, funding, partnerships, innovation, savings, and operational improvements
          </p>
        </div>
        <DataModeBadge mode={data.dataMode} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {data.tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              t.key === tab
                ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
            }
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-80">{t.items.length}</span>
          </button>
        ))}
      </div>

      <WidgetFrame
        widgetId={`opp.${active.key}`}
        title={active.label}
        domains={["opportunity", "funding", "revenue", "innovation", "operations"]}
        dataMode={data.dataMode}
      >
        <ItemList items={active.items} empty="No opportunities in this tab" />
      </WidgetFrame>
    </div>
  );
}
