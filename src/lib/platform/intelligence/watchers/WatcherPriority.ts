/**
 * WatcherPriority helpers — Sprint 206.
 */

import type { WatcherPriority } from "./WatcherRule";

const RANK: Record<WatcherPriority, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  informational: 1,
};

export function priorityRank(p: WatcherPriority): number {
  return RANK[p];
}

export function maxPriority(
  a: WatcherPriority,
  b: WatcherPriority
): WatcherPriority {
  return priorityRank(a) >= priorityRank(b) ? a : b;
}

export function priorityFromScore(score: number): WatcherPriority {
  if (score >= 0.85) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score >= 0.3) return "low";
  return "informational";
}

export function sortByPriorityDesc<T extends { severity: WatcherPriority }>(
  items: readonly T[]
): T[] {
  return [...items].sort(
    (a, b) => priorityRank(b.severity) - priorityRank(a.severity)
  );
}
