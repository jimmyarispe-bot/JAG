"use client";

import type { RevenueWidget } from "@/lib/platform/integrations/connectors/finance/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function Revenue({
  widget,
  className,
}: {
  widget: RevenueWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Revenue</dt>
          <dd className="text-lg font-semibold text-slate-900">
            ${widget.revenue.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">MRR</dt>
          <dd className="text-lg font-semibold text-slate-900">
            ${widget.subscriptionMrr.toLocaleString()}
          </dd>
        </div>
      </dl>
    </section>
  );
}
