/**
 * JAG Collaboration — planner.
 */

import type {
  JagCollaborationPlan,
  JagCollaborationPlanStep,
  JagCollaborationRequest,
  JagConsensusResult,
  JagModeratedCollaboration,
  JagPriorityRanking,
} from "@/lib/platform/jag/collaboration/types";

/**
 * Generates an ordered implementation plan from consensus + priorities.
 */
export class JagCollaborationPlanner {
  plan(
    request: JagCollaborationRequest,
    moderated: JagModeratedCollaboration,
    consensus: JagConsensusResult,
    priorities: JagPriorityRanking
  ): JagCollaborationPlan {
    const top =
      moderated.mergedRecommendations.find(
        (r) => r.recommendationKey === consensus.recommendationKey
      ) ?? moderated.mergedRecommendations[0];

    const steps: JagCollaborationPlanStep[] = [
      {
        stepId: `${request.requestId}:step:1`,
        order: 1,
        title: "Confirm executive decision",
        instruction: `Confirm consensus recommendation "${consensus.title}" with executive sponsors.`,
        ownerRole: "executive",
        dependsOn: [],
      },
      {
        stepId: `${request.requestId}:step:2`,
        order: 2,
        title: "Translate into strategic goals",
        instruction: `Map "${consensus.title}" into strategic goals and measurable objectives.`,
        ownerRole: "strategic",
        dependsOn: [`${request.requestId}:step:1`],
      },
      {
        stepId: `${request.requestId}:step:3`,
        order: 3,
        title: "Authorize decision record",
        instruction: "Record the decision package and approval posture.",
        ownerRole: "decision",
        dependsOn: [`${request.requestId}:step:2`],
      },
      {
        stepId: `${request.requestId}:step:4`,
        order: 4,
        title: "Stand up execution work",
        instruction: top
          ? `Launch execution package for: ${top.actions.slice(0, 3).join("; ") || top.summary}`
          : "Launch execution package for the agreed recommendation.",
        ownerRole: "execution",
        dependsOn: [`${request.requestId}:step:3`],
      },
    ];

    if (priorities.ranked.length > 1) {
      steps.push({
        stepId: `${request.requestId}:step:5`,
        order: 5,
        title: "Park alternate strategies",
        instruction: `Retain alternate strategies (${priorities.ranked
          .slice(1, 3)
          .map((r) => r.title)
          .join(", ")}) for contingency review.`,
        ownerRole: "operations",
        dependsOn: [`${request.requestId}:step:4`],
      });
    }

    return {
      planId: `${request.requestId}:plan`,
      steps,
      summary: `Implementation plan with ${steps.length} step(s) for "${consensus.title}".`,
    };
  }
}
