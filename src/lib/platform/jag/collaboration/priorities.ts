/**
 * JAG Collaboration — priorities.
 */

import type {
  JagConsensusResult,
  JagModeratedCollaboration,
  JagPriorityDimension,
  JagPriorityRanking,
  JagRankedRecommendation,
} from "@/lib/platform/jag/collaboration/types";
import { JAG_PRIORITY_DIMENSIONS } from "@/lib/platform/jag/collaboration/types";

/**
 * Ranks recommendations by risk, urgency, impact, confidence, cost, mission.
 */
export class JagCollaborationPriorities {
  rank(
    moderated: JagModeratedCollaboration,
    consensus: JagConsensusResult
  ): JagPriorityRanking {
    const ranked: JagRankedRecommendation[] = moderated.mergedRecommendations
      .map((rec) => {
        const dimensions: Record<JagPriorityDimension, number> = {
          risk: 1 - rec.risk,
          urgency: rec.urgency,
          impact: rec.impact,
          confidence: rec.confidence.value,
          cost: 1 - rec.cost,
          mission_alignment: rec.missionAlignment,
        };

        const consensusBoost =
          rec.recommendationKey === consensus.recommendationKey ? 0.08 : 0;

        const score = Number(
          (
            dimensions.risk * 0.18 +
            dimensions.urgency * 0.18 +
            dimensions.impact * 0.2 +
            dimensions.confidence * 0.16 +
            dimensions.cost * 0.12 +
            dimensions.mission_alignment * 0.16 +
            consensusBoost
          ).toFixed(4)
        );

        return {
          recommendationKey: rec.recommendationKey,
          title: rec.title,
          score,
          dimensions,
          rank: 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return {
      ranked,
      summary:
        ranked[0]
          ? `Top priority: "${ranked[0].title}" (score ${ranked[0].score}).`
          : "No recommendations to prioritize.",
    };
  }

  listDimensions(): readonly JagPriorityDimension[] {
    return JAG_PRIORITY_DIMENSIONS;
  }
}
