"use client";

import type { CashPositionWidget } from "@/lib/platform/integrations/connectors/finance/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function CashPosition({
  widget,
  className,
}: {
  widget: CashPositionWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Cash</dt>
          <dd className="text-lg font-semibold text-slate-900">
            ${widget.cashPosition.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Health</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.financialHealth}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-slate-500">
        {widget.providersConnected.length
          ? widget.providersConnected.join(" · ")
          : "No finance providers connected"}
      </p>
    </section>
  );
}
