/**
 * JAG Collaboration — consensus.
 */

import type {
  JagCollaboratingAgent,
  JagCollaborationRequest,
  JagConsensusMode,
  JagConsensusResult,
  JagModeratedCollaboration,
  JagModeratedRecommendation,
} from "@/lib/platform/jag/collaboration/types";

export interface JagCollaborationConsensusDependencies {
  agents: readonly JagCollaboratingAgent[];
}

/**
 * Calculates overall recommendation via unanimous / majority / weighted / override.
 */
export class JagCollaborationConsensus {
  private readonly agents: readonly JagCollaboratingAgent[];

  constructor(dependencies: JagCollaborationConsensusDependencies) {
    this.agents = dependencies.agents;
  }

  decide(
    request: JagCollaborationRequest,
    moderated: JagModeratedCollaboration
  ): JagConsensusResult {
    const mode: JagConsensusMode = request.consensusMode ?? "weighted";
    const totalAgents = moderated.responses.length;
    const weightByRole = new Map(this.agents.map((a) => [a.role, a.weight] as const));
    const totalWeight = moderated.responses.reduce(
      (sum, response) => sum + (weightByRole.get(response.agentRole) ?? 1),
      0
    );

    if (request.executiveOverride) {
      const overrideRec =
        moderated.mergedRecommendations.find(
          (r) => r.recommendationKey === request.executiveOverride!.recommendationKey
        ) ??
        ({
          recommendationKey: request.executiveOverride.recommendationKey,
          title: request.executiveOverride.recommendationKey,
          summary: request.executiveOverride.rationale,
          actions: [],
          supportingAgents: ["executive"],
          risk: 0.5,
          urgency: 0.8,
          impact: 0.7,
          cost: 0.5,
          missionAlignment: 0.7,
          confidence: { value: 0.7, level: "medium", factors: [] },
          evidenceRefs: [],
        } satisfies JagModeratedRecommendation);

      return {
        mode: "executive_override",
        recommendationKey: overrideRec.recommendationKey,
        title: overrideRec.title,
        summary: overrideRec.summary,
        supportCount: totalAgents,
        totalAgents,
        supportWeight: totalWeight,
        totalWeight,
        unanimous: false,
        overridden: true,
        rationale: [
          `Executive override applied: ${request.executiveOverride.rationale}`,
        ],
      };
    }

    if (moderated.mergedRecommendations.length === 0) {
      return {
        mode,
        recommendationKey: "no-recommendation",
        title: "No recommendation",
        summary: "No agent recommendations were available.",
        supportCount: 0,
        totalAgents,
        supportWeight: 0,
        totalWeight,
        unanimous: false,
        overridden: false,
        rationale: ["No merged recommendations"],
      };
    }

    const scored = moderated.mergedRecommendations.map((rec) => {
      const supportCount = rec.supportingAgents.length;
      const supportWeight = rec.supportingAgents.reduce(
        (sum, role) => sum + (weightByRole.get(role) ?? 1),
        0
      );
      return { rec, supportCount, supportWeight };
    });

    if (mode === "unanimous") {
      const unanimous = scored.find((s) => s.supportCount === totalAgents);
      const chosen = unanimous ?? scored.sort((a, b) => b.supportCount - a.supportCount)[0]!;
      return this.toResult(
        "unanimous",
        chosen,
        totalAgents,
        totalWeight,
        Boolean(unanimous),
        unanimous
          ? ["All participating agents support this recommendation"]
          : ["Unanimous consensus not reached; fell back to highest support"]
      );
    }

    if (mode === "majority") {
      const chosen = [...scored].sort((a, b) => b.supportCount - a.supportCount)[0]!;
      return this.toResult(
        "majority",
        chosen,
        totalAgents,
        totalWeight,
        chosen.supportCount === totalAgents,
        [
          `Majority support ${chosen.supportCount}/${totalAgents}`,
        ]
      );
    }

    // weighted (default)
    const chosen = [...scored].sort((a, b) => b.supportWeight - a.supportWeight)[0]!;
    return this.toResult(
      "weighted",
      chosen,
      totalAgents,
      totalWeight,
      chosen.supportCount === totalAgents,
      [
        `Weighted support ${chosen.supportWeight.toFixed(2)}/${totalWeight.toFixed(2)}`,
      ]
    );
  }

  private toResult(
    mode: JagConsensusMode,
    chosen: {
      rec: JagModeratedRecommendation;
      supportCount: number;
      supportWeight: number;
    },
    totalAgents: number,
    totalWeight: number,
    unanimous: boolean,
    rationale: string[]
  ): JagConsensusResult {
    return {
      mode,
      recommendationKey: chosen.rec.recommendationKey,
      title: chosen.rec.title,
      summary: chosen.rec.summary,
      supportCount: chosen.supportCount,
      totalAgents,
      supportWeight: chosen.supportWeight,
      totalWeight,
      unanimous,
      overridden: false,
      rationale,
    };
  }
}
