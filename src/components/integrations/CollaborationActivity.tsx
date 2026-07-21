"use client";

import type { CollaborationActivityWidget } from "@/lib/platform/integrations/connectors/google-workspace/services/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function CollaborationActivity({
  widget,
  className,
}: {
  widget: CollaborationActivityWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{widget.collaborationScore}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
        <div>Tasks {widget.openTasks}</div>
        <div>Files {widget.driveFiles}</div>
        <div>Users {widget.users}</div>
      </dl>
      <ul className="mt-3 space-y-2">
        {widget.timeline.map((item) => (
          <li key={item.id} className="border-t border-slate-100 pt-2 text-sm">
            <p className="font-medium text-slate-800">{item.title}</p>
            <p className="text-xs text-slate-500">{item.subtitle}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
