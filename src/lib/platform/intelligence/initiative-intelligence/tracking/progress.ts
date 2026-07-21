/**
 * Progress percent helpers from milestones / work items.
 */

import { flattenWorkItems } from "@/lib/platform/intelligence/initiative-intelligence/planning/milestones";
import type { Milestone } from "@/lib/platform/intelligence/initiative-intelligence/types";

export function milestoneCompletionPct(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.status === "done").length;
  return Math.round((done / milestones.length) * 100);
}

export function workBreakdownPct(milestones: Milestone[]): number {
  const items = milestones.flatMap((m) => flattenWorkItems(m.workItems));
  if (items.length === 0) {
    return milestoneCompletionPct(milestones);
  }
  const sum = items.reduce((acc, i) => acc + i.percentComplete, 0);
  return Math.round(sum / items.length);
}
