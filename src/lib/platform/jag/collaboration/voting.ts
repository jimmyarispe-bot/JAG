/**
 * JAG Collaboration — voting helpers.
 */

import type {
  JagCollaboratingAgent,
  JagCollaborationAgentRole,
  JagModeratedCollaboration,
} from "@/lib/platform/jag/collaboration/types";

export interface JagVoteTally {
  readonly recommendationKey: string;
  readonly votes: number;
  readonly weight: number;
  readonly voters: readonly JagCollaborationAgentRole[];
}

/**
 * Tallies agent votes for moderated recommendations.
 */
export class JagCollaborationVoting {
  tally(
    moderated: JagModeratedCollaboration,
    agents: readonly JagCollaboratingAgent[]
  ): readonly JagVoteTally[] {
    const weightByRole = new Map(agents.map((a) => [a.role, a.weight] as const));
    return moderated.mergedRecommendations.map((rec) => ({
      recommendationKey: rec.recommendationKey,
      votes: rec.supportingAgents.length,
      weight: rec.supportingAgents.reduce(
        (sum, role) => sum + (weightByRole.get(role) ?? 1),
        0
      ),
      voters: rec.supportingAgents,
    }));
  }
}
