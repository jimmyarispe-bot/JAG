"use client";

import type { ProgramFundingWidget } from "@/lib/platform/integrations/connectors/enterprise/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function ProgramFunding({
  widget,
  className,
}: {
  widget: ProgramFundingWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Funding</dt>
          <dd className="text-lg font-semibold text-slate-900">
            ${widget.programFunding.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Compliance</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.openCompliance}</dd>
        </div>
      </dl>
    </section>
  );
}
