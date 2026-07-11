/**
 * JAG Collaboration — conflicts.
 */

import type {
  JagConflict,
  JagConflictAnalysis,
  JagModeratedCollaboration,
} from "@/lib/platform/jag/collaboration/types";

/**
 * Identifies conflicting recommendations and explains why they remain valid.
 */
export class JagCollaborationConflicts {
  analyze(moderated: JagModeratedCollaboration): JagConflictAnalysis {
    const conflicts: JagConflict[] = [];
    const recs = moderated.mergedRecommendations;

    for (let i = 0; i < recs.length; i += 1) {
      for (let j = i + 1; j < recs.length; j += 1) {
        const a = recs[i]!;
        const b = recs[j]!;
        const oppositeRisk = Math.abs(a.risk - b.risk) >= 0.35;
        const oppositeCost = Math.abs(a.cost - b.cost) >= 0.35;
        const disjointSupport = a.supportingAgents.every(
          (role) => !b.supportingAgents.includes(role)
        );

        if ((oppositeRisk || oppositeCost) && disjointSupport) {
          conflicts.push({
            conflictId: `conflict:${a.recommendationKey}:${b.recommendationKey}`,
            recommendationKeys: [a.recommendationKey, b.recommendationKey],
            agents: [...a.supportingAgents, ...b.supportingAgents],
            explanation: `Conflict between "${a.title}" and "${b.title}": differing risk/cost profiles with disjoint agent support. Both may be valid strategies under different constraints.`,
            severity: Number(
              Math.min(1, Math.abs(a.risk - b.risk) + Math.abs(a.cost - b.cost)).toFixed(4)
            ),
          });
        }
      }
    }

    for (const disagreement of moderated.preservedDisagreements) {
      conflicts.push({
        conflictId: `disagreement:${disagreement.topic}`,
        recommendationKeys: disagreement.positions.map((p) => p.recommendationKey),
        agents: disagreement.positions.map((p) => p.agentRole),
        explanation: disagreement.explanation,
        severity: 0.45,
      });
    }

    return {
      conflicts,
      allowsMultipleStrategies: conflicts.length > 0 || recs.length > 1,
      summary:
        conflicts.length === 0
          ? "No material conflicts detected."
          : `Identified ${conflicts.length} conflict(s); multiple strategies remain valid.`,
    };
  }
}
