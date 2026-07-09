"use client";

import type { ReactNode } from "react";
import { DetailDrawer, QuickActionsPanel, SidePanel } from "@/components/workspace-design-system";
import { JourneyTimeline, ProgressTimeline, EvidenceTimeline } from "@/components/workspace-design-system";
import { AiInsightCard } from "@/components/workspace-design-system";
import type { XesQuickAction, XesTimelineEntry } from "../types";
import { cn } from "@/components/workspace-design-system/utils";

export { DetailDrawer as DetailPanel };

export function TimelinePanel({
  title = "Timeline",
  entries,
  variant = "progress",
  className,
}: {
  title?: string;
  entries: XesTimelineEntry[];
  variant?: "progress" | "evidence" | "journey";
  className?: string;
}) {
  const props = { entries, className };
  if (variant === "journey") return <JourneyTimeline {...props} />;
  if (variant === "evidence") return <EvidenceTimeline {...props} />;
  return <ProgressTimeline {...props} />;
}

export function AiInsightPanel({
  title,
  insight,
  confidence,
  source,
  children,
  className,
}: {
  title: string;
  insight: string;
  confidence?: number;
  source?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <AiInsightCard title={title} insight={insight} confidence={confidence} source={source} />
      {children}
    </div>
  );
}

export function NotesPanel({
  title = "Notes",
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SidePanel title={title} className={className}>
      {children}
    </SidePanel>
  );
}

export function ActivityPanel({
  title = "Recent activity",
  entries,
  className,
}: {
  title?: string;
  entries: { id: string; label: string; timestamp: string }[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-slate-100 bg-slate-50/80 p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {entries.length ? (
        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          {entries.map((e) => (
            <li key={e.id} className="flex justify-between gap-2">
              <span>{e.label}</span>
              <time className="shrink-0 text-xs text-slate-400">{new Date(e.timestamp).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No recent activity.</p>
      )}
    </div>
  );
}

export function QuickActions({ actions, title }: { actions: XesQuickAction[]; title?: string }) {
  return <QuickActionsPanel actions={actions} title={title} />;
}
