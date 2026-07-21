"use client";

import type { RecentMeetingsWidget } from "@/lib/platform/integrations/connectors/google-workspace/services/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function RecentMeetings({
  widget,
  className,
}: {
  widget: RecentMeetingsWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      {widget.meetings.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No recent meetings.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {widget.meetings.map((meeting) => (
            <li key={meeting.id} className="border-t border-slate-100 pt-2 text-sm">
              <p className="font-medium text-slate-800">{meeting.title}</p>
              <p className="text-xs text-slate-500">
                {meeting.durationMinutes} min · {meeting.participantCount} participants ·{" "}
                {meeting.startAt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
