"use client";

import type { BurnRateWidget } from "@/lib/platform/integrations/connectors/finance/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function BurnRate({
  widget,
  className,
}: {
  widget: BurnRateWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Monthly</dt>
          <dd className="text-lg font-semibold text-slate-900">
            ${widget.burnRateMonthly.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Runway</dt>
          <dd className="text-lg font-semibold text-slate-900">
            {widget.runwayMonths != null ? `${widget.runwayMonths} mo` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Severity</dt>
          <dd className="text-lg font-semibold capitalize text-slate-900">{widget.severity}</dd>
        </div>
      </dl>
    </section>
  );
}
