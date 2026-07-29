import { clampConfidence } from "./confidence";
import type {
  CognitivePriority,
  CognitiveRecommendation,
  CognitiveThinkRequest,
} from "./cognition-types";

/**
 * Ranks recommendations into priorities — presentation ordering only.
 * No domain scoring formulas.
 */
export class PriorityEngine {
  rank(
    recommendations: readonly CognitiveRecommendation[],
    request: CognitiveThinkRequest
  ): CognitivePriority[] {
    const intentId = request.intent?.intentId;
    const scored = recommendations.map((rec, index) => {
      let score = clampConfidence(rec.confidence) * 100;
      score += Math.max(0, 50 - (rec.priority ?? 50));
      if (rec.type === "warning") score += 20;
      if (rec.conflictFlags.length) score -= 10;
      if (rec.unsupported) score -= 40;
      if (
        intentId &&
        rec.attributes?.intentId === intentId
      ) {
        score += 15;
      }
      if (rec.evidenceRefs.length === 0) score -= 30;
      return { rec, score, index };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    });

    return scored.map(({ rec }, rank) => ({
      id: `priority_${rec.id}`,
      title: rec.title,
      rank,
      recommendationId: rec.id,
      actionCandidateId: rec.unsupported
        ? undefined
        : rec.suggestedNextAction,
      confidence: rec.confidence,
    }));
  }
}

export function createPriorityEngine(): PriorityEngine {
  return new PriorityEngine();
}
