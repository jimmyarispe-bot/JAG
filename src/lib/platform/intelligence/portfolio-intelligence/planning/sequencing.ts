/**
 * Initiative sequencing helpers for roadmap construction.
 */

import type { PriorityScorecard } from "@/lib/platform/intelligence/portfolio-intelligence/types";

export function sequenceByPriority(prioritization: PriorityScorecard[]): string[] {
  return [...prioritization]
    .sort((a, b) => a.rank - b.rank)
    .map((p) => p.initiativeId);
}
