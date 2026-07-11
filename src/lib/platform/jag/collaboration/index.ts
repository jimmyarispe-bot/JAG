/**
 * JAG Multi-Agent Collaboration Engine — public API (Sprint 013).
 */

export {
  JAG_COLLABORATION_AGENT_ROLES,
  JAG_COLLABORATION_ENGINE_VERSION,
  JAG_CONSENSUS_MODES,
  JAG_PRIORITY_DIMENSIONS,
  type JagAgentRecommendation,
  type JagAgentResponse,
  type JagCollaboratingAgent,
  type JagCollaborationAgentRole,
  type JagCollaborationConfidence,
  type JagCollaborationExecutionPackage,
  type JagCollaborationLearningResult,
  type JagCollaborationMetadata,
  type JagCollaborationPlan,
  type JagCollaborationPlanStep,
  type JagCollaborationRequest,
  type JagCollaborationResult,
  type JagCollaborationTelemetry,
  type JagConflict,
  type JagConflictAnalysis,
  type JagConsensusMode,
  type JagConsensusResult,
  type JagDebateChallenge,
  type JagDebateResult,
  type JagDisagreement,
  type JagModeratedCollaboration,
  type JagModeratedRecommendation,
  type JagPriorityDimension,
  type JagPriorityRanking,
  type JagRankedRecommendation,
} from "@/lib/platform/jag/collaboration/types";

export {
  JagCollaborationCoordinator,
  type JagCollaborationCoordinatorDependencies,
} from "@/lib/platform/jag/collaboration/coordinator";

export { JagCollaborationModerator } from "@/lib/platform/jag/collaboration/moderator";

export {
  JagCollaborationConsensus,
  type JagCollaborationConsensusDependencies,
} from "@/lib/platform/jag/collaboration/consensus";

export { JagCollaborationConfidenceCalculator } from "@/lib/platform/jag/collaboration/confidence";

export {
  JagCollaborationVoting,
  type JagVoteTally,
} from "@/lib/platform/jag/collaboration/voting";

export { JagCollaborationConflicts } from "@/lib/platform/jag/collaboration/conflicts";

export { JagCollaborationDebate } from "@/lib/platform/jag/collaboration/debate";

export { JagCollaborationPriorities } from "@/lib/platform/jag/collaboration/priorities";

export { JagCollaborationPlanner } from "@/lib/platform/jag/collaboration/planner";

export {
  JagCollaborationExecution,
  type JagCollaborationExecutionDependencies,
} from "@/lib/platform/jag/collaboration/execution";

export {
  JagCollaborationLearning,
  type JagCollaborationLearningDependencies,
} from "@/lib/platform/jag/collaboration/learning";

export {
  JagCollaborationTelemetryCollector,
  type JagCollaborationTelemetryDependencies,
} from "@/lib/platform/jag/collaboration/telemetry";

export {
  createDefaultCollaborationAgents,
  type DefaultCollaborationAgentsDependencies,
} from "@/lib/platform/jag/collaboration/default-agents";

import { JagCollaborationCoordinator } from "@/lib/platform/jag/collaboration/coordinator";
import type { JagCollaborationCoordinatorDependencies } from "@/lib/platform/jag/collaboration/coordinator";

/** Factory for a fully wired collaboration coordinator. */
export function createJagCollaborationEngine(
  dependencies: JagCollaborationCoordinatorDependencies = {}
): JagCollaborationCoordinator {
  return new JagCollaborationCoordinator(dependencies);
}
