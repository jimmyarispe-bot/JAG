"use client";

import type { ResponseTimeWidget } from "@/lib/platform/integrations/connectors/collaboration/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function ResponseTime({
  widget,
  className,
}: {
  widget: ResponseTimeWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
        <p className="text-lg font-semibold text-slate-900">{widget.avgResponseMinutes} min</p>
      </div>
      <ul className="mt-3 space-y-2">
        {widget.channels.map((channel) => (
          <li
            key={channel.label}
            className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm"
          >
            <span className="text-slate-800">{channel.label}</span>
            <span className="text-xs text-slate-500">
              {channel.avgMinutes} min · {channel.severity}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
