"use client";

import type { MeetingLoadWidget } from "@/lib/platform/integrations/connectors/collaboration/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function MeetingLoad({
  widget,
  className,
}: {
  widget: MeetingLoadWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Minutes</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.meetingLoadMinutes}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Meetings</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.meetingCount}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Severity</dt>
          <dd className="text-lg font-semibold capitalize text-slate-900">{widget.severity}</dd>
        </div>
      </dl>
    </section>
  );
}
