"use client";

import type { PayablesWidget } from "@/lib/platform/integrations/connectors/finance/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function Payables({
  widget,
  className,
}: {
  widget: PayablesWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <p className="mt-3 text-2xl font-semibold text-slate-900">
        ${widget.payables.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-500">Outstanding accounts payable</p>
    </section>
  );
}
