/**
 * Executive Graph Analyzer — recommendation projection (Sprint 025).
 */

import type { RecommendationProjector } from "@/lib/platform/intelligence/executive-graph/contracts";
import type {
  ExecutiveFinding,
  ExecutivePriority,
  GraphRecommendation,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface RecommendationProjectorDependencies {
  createId?: (prefix: string) => string;
}

/**
 * Projects executive priorities + findings into actionable recommendations.
 */
export class GraphRecommendationProjector implements RecommendationProjector {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: RecommendationProjectorDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  fromPriorities(
    priorities: ExecutivePriority[],
    findings: ExecutiveFinding[]
  ): GraphRecommendation[] {
    const findingByNode = new Map<string, ExecutiveFinding>();
    for (const finding of findings) {
      // Best-effort association via title overlap later; prefer explicit recommendation text.
      if (!findingByNode.has(finding.id)) {
        findingByNode.set(finding.id, finding);
      }
    }

    return priorities.slice(0, 10).map((priority) => {
      const related = findings.find(
        (f) =>
          f.title.toLowerCase().includes(priority.title.toLowerCase()) ||
          f.recommendation?.toLowerCase().includes(priority.title.toLowerCase())
      );

      return {
        id: this.createId("rec"),
        title: `Act on ${priority.title}`,
        action: related?.recommendation ?? `Assign owner and remediate ${priority.title}`,
        reason: priority.rationale,
        priority: priority.band,
        nodeId: priority.nodeId,
        confidence: priority.confidence,
        expectedImpact: `Reduce ${priority.domain} pressure (score ${priority.score.toFixed(2)})`,
      };
    });
  }
}
