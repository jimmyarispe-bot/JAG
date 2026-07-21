"use client";

import type { UnifiedCommunicationDashboard as Dashboard } from "@/lib/platform/integrations/connectors/microsoft-365/services/unified-communication";
import { cn } from "@/components/workspace-design-system/utils";

export function UnifiedCommunicationDashboard({
  dashboard,
  className,
}: {
  dashboard: Dashboard;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{dashboard.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {dashboard.providersConnected.length} connected provider
            {dashboard.providersConnected.length === 1 ? "" : "s"} · provider-neutral for Copilot
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-slate-600 sm:grid-cols-4">
        <div>
          <dt className="text-slate-400">Meetings</dt>
          <dd className="text-lg font-semibold text-slate-900">{dashboard.totals.upcomingMeetings}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Messages</dt>
          <dd className="text-lg font-semibold text-slate-900">{dashboard.totals.messages}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Chats</dt>
          <dd className="text-lg font-semibold text-slate-900">{dashboard.totals.chats}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Score</dt>
          <dd className="text-lg font-semibold text-slate-900">{dashboard.totals.collaborationScore}</dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Recent meetings
          </h4>
          <ul className="mt-2 space-y-2">
            {dashboard.recentMeetings.map((meeting) => (
              <li key={meeting.id} className="border-t border-slate-100 pt-2 text-sm">
                <p className="font-medium text-slate-800">{meeting.title}</p>
                <p className="text-xs text-slate-500">
                  Meeting · {meeting.durationMinutes} min · {meeting.participantCount} participants
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Recent communications
          </h4>
          <ul className="mt-2 space-y-2">
            {dashboard.recentCommunications.map((item) => (
              <li key={item.id} className="border-t border-slate-100 pt-2 text-sm">
                <p className="font-medium text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">Communication · {item.at}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
