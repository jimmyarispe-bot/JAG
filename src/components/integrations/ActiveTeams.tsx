"use client";

import type { ActiveTeamsWidget } from "@/lib/platform/integrations/connectors/collaboration/intelligence/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function ActiveTeams({
  widget,
  className,
}: {
  widget: ActiveTeamsWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
        <p className="text-lg font-semibold text-slate-900">{widget.activeTeams}</p>
      </div>
      <ul className="mt-3 space-y-2">
        {widget.teams.map((team) => (
          <li
            key={team.label}
            className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm"
          >
            <span className="text-slate-800">{team.label}</span>
            <span className="text-xs text-slate-500">
              Density {team.density}% · {team.messageCount} messages
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
