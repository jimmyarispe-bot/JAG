"use client";

import type { CommunicationHealthWidget } from "@/lib/platform/integrations/connectors/collaboration/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function CommunicationHealth({
  widget,
  className,
}: {
  widget: CommunicationHealthWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Score</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.score}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Silos</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.siloCount}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Bottlenecks</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.bottleneckCount}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-slate-500">{widget.explainability}</p>
    </section>
  );
}
