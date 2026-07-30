/**
 * Chronological organizational memory timeline.
 */

import type { MemoryRecord } from "./MemoryRecord";

export type MemoryTimelineEntry = {
  readonly memoryId: string;
  readonly at: string;
  readonly type: string;
  readonly title: string;
  readonly outcome: string;
  readonly summary: string;
};

export type MemoryTimeline = {
  readonly organizationId: string;
  readonly entries: readonly MemoryTimelineEntry[];
};

export function buildMemoryTimeline(
  organizationId: string,
  records: readonly MemoryRecord[]
): MemoryTimeline {
  const entries = records
    .filter((r) => r.organizationId === organizationId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (r): MemoryTimelineEntry => ({
        memoryId: r.id,
        at: r.date,
        type: r.type,
        title: r.title,
        outcome: r.outcome,
        summary: r.outcomeSummary ?? r.description.slice(0, 160),
      })
    );
  return { organizationId, entries };
}
