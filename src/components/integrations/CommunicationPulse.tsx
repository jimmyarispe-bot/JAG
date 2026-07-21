"use client";

import type { CommunicationPulseWidget } from "@/lib/platform/integrations/connectors/google-workspace/services/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function CommunicationPulse({
  widget,
  className,
}: {
  widget: CommunicationPulseWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
        <div>
          <dt className="text-slate-400">Messages</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.messages}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Unread</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.unread}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Activity</dt>
          <dd className="text-lg font-semibold text-slate-900">{widget.communicationActivity}</dd>
        </div>
      </dl>
    </section>
  );
}
