"use client";

/**
 * UI shell for an ExecutiveBriefing contract (Sprint 062).
 * Named ExecutiveBriefView to avoid colliding with board-governance ExecutiveBrief types.
 */

import { MorningBrief } from "@/components/executive-briefing/MorningBrief";
import type { BriefingResult, ExecutiveBriefing } from "@/lib/platform/intelligence/briefing";

export interface ExecutiveBriefViewProps {
  briefing?: ExecutiveBriefing;
  result?: BriefingResult;
  className?: string;
}

/** @deprecated Prefer ExecutiveBriefView — kept as Sprint deliverable alias. */
export function ExecutiveBrief(props: ExecutiveBriefViewProps) {
  return <ExecutiveBriefView {...props} />;
}

export function ExecutiveBriefView({ briefing, result, className }: ExecutiveBriefViewProps) {
  const resolved = briefing ?? result?.briefing;
  if (!resolved) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
        No executive briefing available yet.
      </div>
    );
  }
  return <MorningBrief briefing={resolved} className={className} />;
}
