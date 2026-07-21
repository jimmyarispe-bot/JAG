"use client";

import type { ReceivablesWidget } from "@/lib/platform/integrations/connectors/finance/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function Receivables({
  widget,
  className,
}: {
  widget: ReceivablesWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <p className="mt-3 text-2xl font-semibold text-slate-900">
        ${widget.receivables.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-500">Outstanding accounts receivable</p>
    </section>
  );
}
