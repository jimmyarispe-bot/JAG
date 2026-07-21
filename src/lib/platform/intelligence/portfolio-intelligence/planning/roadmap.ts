/**
 * Portfolio roadmap builder.
 */

import { sequenceByPriority } from "@/lib/platform/intelligence/portfolio-intelligence/planning/sequencing";
import type {
  InitiativeLight,
  PriorityScorecard,
  RoadmapItem,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

export function buildRoadmap(
  initiatives: InitiativeLight[],
  prioritization: PriorityScorecard[]
): RoadmapItem[] {
  const byId = new Map(initiatives.map((i, idx) => [i.id ?? `init-${idx}`, i]));
  const order = sequenceByPriority(prioritization);
  return order.map((id, index) => {
    const init = byId.get(id);
    return {
      initiativeId: id,
      title: init?.title ?? prioritization.find((p) => p.initiativeId === id)?.title ?? id,
      sequence: index + 1,
      endHint: init?.targetCompletionDate,
      theme: typeof init?.metadata?.category === "string" ? init.metadata.category : undefined,
    };
  });
}
