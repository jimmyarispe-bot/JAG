"use client";

import type { CalendarSummaryWidget } from "@/lib/platform/integrations/connectors/google-workspace/services/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function CalendarSummary({
  widget,
  className,
}: {
  widget: CalendarSummaryWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Upcoming</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.upcomingMeetings}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Load (min)</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.meetingLoadMinutes7d}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Conflicts</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.schedulingConflicts}</dd>
        </div>
      </dl>
      {widget.nextMeeting ? (
        <p className="mt-3 text-sm text-slate-600">
          Next: <span className="font-medium text-slate-900">{widget.nextMeeting.title}</span> ·{" "}
          {widget.nextMeeting.startAt}
        </p>
      ) : null}
    </section>
  );
}
