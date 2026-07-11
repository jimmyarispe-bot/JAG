/**
 * JAG Collaboration — debate.
 *
 * Allows agents to challenge each other's recommendations.
 */

import type {
  JagDebateChallenge,
  JagDebateResult,
  JagModeratedCollaboration,
} from "@/lib/platform/jag/collaboration/types";

/**
 * Produces cross-agent challenges and rationales.
 */
export class JagCollaborationDebate {
  debate(moderated: JagModeratedCollaboration): JagDebateResult {
    const challenges: JagDebateChallenge[] = [];
    const responses = moderated.responses;

    for (let i = 0; i < responses.length; i += 1) {
      const challenger = responses[i]!;
      for (let j = 0; j < responses.length; j += 1) {
        if (i === j) continue;
        const target = responses[j]!;
        const targetRec = target.recommendations[0];
        if (!targetRec) continue;

        const challengerRec = challenger.recommendations[0];
        if (
          challengerRec &&
          challengerRec.recommendationKey === targetRec.recommendationKey
        ) {
          continue;
        }

        const riskDelta = (challengerRec?.risk ?? 0.5) - targetRec.risk;
        challenges.push({
          challengeId: `${challenger.agentRole}->${target.agentRole}:${targetRec.recommendationKey}`,
          challenger: challenger.agentRole,
          targetAgent: target.agentRole,
          targetRecommendationKey: targetRec.recommendationKey,
          challenge: `${challenger.agentName} challenges ${target.agentName} on "${targetRec.title}"`,
          rationale:
            riskDelta > 0.1
              ? `${challenger.agentName} argues the target underestimates risk (${targetRec.risk.toFixed(2)} vs preferred posture).`
              : riskDelta < -0.1
                ? `${challenger.agentName} argues the target is overly risk-averse relative to expected impact.`
                : `${challenger.agentName} prefers an alternate path with different cost/impact trade-offs.`,
        });
      }
    }

    return {
      challenges: challenges.slice(0, 12),
      summary:
        challenges.length === 0
          ? "No material debate challenges; agents are aligned."
          : `Produced ${Math.min(12, challenges.length)} debate challenge(s).`,
    };
  }
}
