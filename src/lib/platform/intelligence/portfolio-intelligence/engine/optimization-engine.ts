/**
 * Advisory roadmap / portfolio optimizations — never auto-executes (Sprint 066 governance).
 */

import type {
  CapacitySnapshot,
  CrossInitiativeDependency,
  OptimizationRecommendation,
  PriorityScorecard,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

const GOVERNANCE =
  "Advisory only. Human authorization required via Autonomous Intelligence approval policies (Sprint 066).";

export class OptimizationEngine {
  constructor(private readonly createId: (prefix: string) => string) {}

  recommend(input: {
    prioritization: PriorityScorecard[];
    capacity: CapacitySnapshot;
    dependencies: CrossInitiativeDependency[];
  }): OptimizationRecommendation[] {
    const recs: OptimizationRecommendation[] = [];
    const { prioritization, capacity, dependencies } = input;

    if (capacity.overcommitted && prioritization.length >= 2) {
      const lowest = prioritization[prioritization.length - 1]!;
      recs.push({
        id: this.createId("opt-defer"),
        kind: "defer",
        title: `Defer ${lowest.title}`,
        summary: "Portfolio overcommitted — defer lowest-ranked initiative to restore capacity.",
        initiativeIds: [lowest.initiativeId],
        advisory: true,
        governanceNote: GOVERNANCE,
        expectedImpact: 70,
      });
    }

    if (prioritization.length >= 2) {
      const top = prioritization[0]!;
      const second = prioritization[1]!;
      if (top.composite - second.composite < 8) {
        recs.push({
          id: this.createId("opt-seq"),
          kind: "sequence_change",
          title: "Re-sequence near-tied priorities",
          summary: `${top.title} and ${second.title} are closely scored — validate sequencing with sponsors.`,
          initiativeIds: [top.initiativeId, second.initiativeId],
          advisory: true,
          governanceNote: GOVERNANCE,
          expectedImpact: 55,
        });
      }
    }

    const conflict = dependencies.find((d) => d.kind === "conflicting_timeline");
    if (conflict) {
      recs.push({
        id: this.createId("opt-shift"),
        kind: "resource_shift",
        title: "Resolve timeline conflict",
        summary: conflict.label,
        initiativeIds: [conflict.fromInitiativeId, conflict.toInitiativeId],
        advisory: true,
        governanceNote: GOVERNANCE,
        expectedImpact: 65,
      });
    }

    const lowAlign = prioritization.filter((p) => p.alignment < 45);
    for (const p of lowAlign.slice(0, 2)) {
      recs.push({
        id: this.createId("opt-retire"),
        kind: "retire",
        title: `Review retirement of ${p.title}`,
        summary: "Low strategic alignment — consider consolidation or retirement.",
        initiativeIds: [p.initiativeId],
        advisory: true,
        governanceNote: GOVERNANCE,
        expectedImpact: 50,
      });
    }

    if (capacity.underutilized && prioritization[0]) {
      recs.push({
        id: this.createId("opt-accel"),
        kind: "accelerate",
        title: `Accelerate ${prioritization[0].title}`,
        summary: "Capacity underutilized — accelerate top-ranked initiative.",
        initiativeIds: [prioritization[0].initiativeId],
        advisory: true,
        governanceNote: GOVERNANCE,
        expectedImpact: 60,
      });
    }

    if (prioritization.length >= 3) {
      const bottom = prioritization.slice(-2);
      if (bottom.every((p) => p.alignment < 55)) {
        recs.push({
          id: this.createId("opt-consol"),
          kind: "consolidate",
          title: "Consolidate lower-alignment work",
          summary: "Merge overlapping lower-ranked initiatives to reduce overhead.",
          initiativeIds: bottom.map((p) => p.initiativeId),
          advisory: true,
          governanceNote: GOVERNANCE,
          expectedImpact: 58,
        });
      }
    }

    return recs;
  }
}
