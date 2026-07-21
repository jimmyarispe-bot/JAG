"use client";

import type { WorkforceWidget } from "@/lib/platform/integrations/connectors/enterprise/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function Workforce({
  widget,
  className,
}: {
  widget: WorkforceWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Headcount</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.headcount}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Open roles</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.openRoles}</dd>
        </div>
      </dl>
    </section>
  );
}
