/**
 * JAG Multi-Agent Collaboration Engine — shared contracts (Sprint 013).
 *
 * Coordinates specialized agents around one executive request.
 * Integrates Shared Context, Persistent Memory, Executive / Strategic /
 * Decision Intelligence, and the Goal Execution Engine.
 * No database, UI, or external services.
 */

import type { SharedIntelligenceContext } from "@/lib/platform/intelligence/context/builder";
import type {
  CreateExecutionGoalInput,
  CreateExecutionInitiativeInput,
  CreateExecutionObjectiveInput,
  CreateExecutionTaskInput,
} from "@/lib/platform/execution";
import type { IntelligencePersistentMemoryRecord } from "@/lib/platform/intelligence/memory/types";
import type {
  IntelligenceConfidenceScore,
  IntelligenceEvidenceRef,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";

/** Semantic version of the collaboration engine. */
export const JAG_COLLABORATION_ENGINE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type JagCollaborationMetadata = IntelligenceMetadata;

/** Known collaborating agent roles. */
export const JAG_COLLABORATION_AGENT_ROLES = [
  "executive",
  "strategic",
  "decision",
  "operations",
  "finance",
  "execution",
  "research",
  "compliance",
] as const;
export type JagCollaborationAgentRole =
  (typeof JAG_COLLABORATION_AGENT_ROLES)[number];

/** Consensus modes. */
export const JAG_CONSENSUS_MODES = [
  "unanimous",
  "majority",
  "weighted",
  "executive_override",
] as const;
export type JagConsensusMode = (typeof JAG_CONSENSUS_MODES)[number];

/** Priority ranking dimensions. */
export const JAG_PRIORITY_DIMENSIONS = [
  "risk",
  "urgency",
  "impact",
  "confidence",
  "cost",
  "mission_alignment",
] as const;
export type JagPriorityDimension = (typeof JAG_PRIORITY_DIMENSIONS)[number];

/** Executive collaboration request. */
export interface JagCollaborationRequest {
  readonly requestId: string;
  readonly subject: string;
  readonly description?: string;
  readonly organizationId?: string | null;
  readonly schoolId?: string | null;
  readonly sharedContext?: SharedIntelligenceContext;
  readonly memories?: readonly IntelligencePersistentMemoryRecord[];
  readonly evidenceRefs?: readonly IntelligenceEvidenceRef[];
  readonly preferredAgents?: readonly JagCollaborationAgentRole[];
  readonly consensusMode?: JagConsensusMode;
  /** Optional executive override recommendation id / text. */
  readonly executiveOverride?: {
    readonly recommendationKey: string;
    readonly rationale: string;
  };
  readonly metadata?: JagCollaborationMetadata;
}

/** Single recommendation emitted by an agent. */
export interface JagAgentRecommendation {
  readonly recommendationKey: string;
  readonly title: string;
  readonly summary: string;
  readonly actions: readonly string[];
  readonly risk: number;
  readonly urgency: number;
  readonly impact: number;
  readonly cost: number;
  readonly missionAlignment: number;
  readonly confidence: IntelligenceConfidenceScore;
  readonly evidenceRefs: readonly IntelligenceEvidenceRef[];
  readonly metadata?: JagCollaborationMetadata;
}

/** Normalized response from one collaborating agent. */
export interface JagAgentResponse {
  readonly responseId: string;
  readonly agentRole: JagCollaborationAgentRole;
  readonly agentName: string;
  readonly summary: string;
  readonly recommendations: readonly JagAgentRecommendation[];
  readonly concerns: readonly string[];
  readonly confidence: IntelligenceConfidenceScore;
  readonly elapsedMs: number;
  readonly metadata?: JagCollaborationMetadata;
}

/**
 * Injectable collaborating agent port.
 * Concrete agents (executive/strategic/decision/…) implement this.
 */
export interface JagCollaboratingAgent {
  readonly role: JagCollaborationAgentRole;
  readonly name: string;
  readonly weight: number;
  participate(request: JagCollaborationRequest): Promise<JagAgentResponse> | JagAgentResponse;
}

/** Moderator output after normalization / merge. */
export interface JagModeratedCollaboration {
  readonly responses: readonly JagAgentResponse[];
  readonly mergedRecommendations: readonly JagModeratedRecommendation[];
  readonly preservedDisagreements: readonly JagDisagreement[];
  readonly duplicatesRemoved: number;
  readonly summary: string;
}

export interface JagModeratedRecommendation {
  readonly recommendationKey: string;
  readonly title: string;
  readonly summary: string;
  readonly actions: readonly string[];
  readonly supportingAgents: readonly JagCollaborationAgentRole[];
  readonly risk: number;
  readonly urgency: number;
  readonly impact: number;
  readonly cost: number;
  readonly missionAlignment: number;
  readonly confidence: IntelligenceConfidenceScore;
  readonly evidenceRefs: readonly IntelligenceEvidenceRef[];
}

export interface JagDisagreement {
  readonly topic: string;
  readonly positions: readonly {
    readonly agentRole: JagCollaborationAgentRole;
    readonly recommendationKey: string;
    readonly stance: string;
  }[];
  readonly explanation: string;
}

/** Consensus result. */
export interface JagConsensusResult {
  readonly mode: JagConsensusMode;
  readonly recommendationKey: string;
  readonly title: string;
  readonly summary: string;
  readonly supportCount: number;
  readonly totalAgents: number;
  readonly supportWeight: number;
  readonly totalWeight: number;
  readonly unanimous: boolean;
  readonly overridden: boolean;
  readonly rationale: readonly string[];
}

/** Collaboration confidence package. */
export interface JagCollaborationConfidence {
  readonly score: IntelligenceConfidenceScore;
  readonly agreement: number;
  readonly historicalAccuracy: number;
  readonly evidenceQuality: number;
  readonly memorySimilarity: number;
  readonly sharedContextCompleteness: number;
  readonly uncertainty: number;
  readonly summary: string;
}

/** Conflict package. */
export interface JagConflictAnalysis {
  readonly conflicts: readonly JagConflict[];
  readonly allowsMultipleStrategies: boolean;
  readonly summary: string;
}

export interface JagConflict {
  readonly conflictId: string;
  readonly recommendationKeys: readonly string[];
  readonly agents: readonly JagCollaborationAgentRole[];
  readonly explanation: string;
  readonly severity: number;
}

/** Debate package. */
export interface JagDebateResult {
  readonly challenges: readonly JagDebateChallenge[];
  readonly summary: string;
}

export interface JagDebateChallenge {
  readonly challengeId: string;
  readonly challenger: JagCollaborationAgentRole;
  readonly targetAgent: JagCollaborationAgentRole;
  readonly targetRecommendationKey: string;
  readonly challenge: string;
  readonly rationale: string;
}

/** Prioritized recommendation ranking. */
export interface JagPriorityRanking {
  readonly ranked: readonly JagRankedRecommendation[];
  readonly summary: string;
}

export interface JagRankedRecommendation {
  readonly recommendationKey: string;
  readonly title: string;
  readonly score: number;
  readonly dimensions: Readonly<Record<JagPriorityDimension, number>>;
  readonly rank: number;
}

/** Ordered implementation plan. */
export interface JagCollaborationPlan {
  readonly planId: string;
  readonly steps: readonly JagCollaborationPlanStep[];
  readonly summary: string;
}

export interface JagCollaborationPlanStep {
  readonly stepId: string;
  readonly order: number;
  readonly title: string;
  readonly instruction: string;
  readonly ownerRole: JagCollaborationAgentRole;
  readonly dependsOn: readonly string[];
}

/** Execution package compatible with Goal Execution Engine. */
export interface JagCollaborationExecutionPackage {
  readonly packageId: string;
  readonly goal: CreateExecutionGoalInput;
  readonly objectives: readonly CreateExecutionObjectiveInput[];
  readonly initiatives: readonly CreateExecutionInitiativeInput[];
  readonly tasks: readonly Omit<CreateExecutionTaskInput, "goalId" | "initiativeId">[];
  readonly summary: string;
}

/** Learning / memory persistence outcome. */
export interface JagCollaborationLearningResult {
  readonly memoryId: string | null;
  readonly observations: readonly string[];
  readonly recommendations: readonly string[];
  readonly trackedForAccuracy: boolean;
  readonly summary: string;
}

/** Telemetry for one collaboration run. */
export interface JagCollaborationTelemetry {
  readonly runId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly executionTimeMs: number;
  readonly participatingAgents: readonly JagCollaborationAgentRole[];
  readonly confidence: number;
  readonly consensusMode: JagConsensusMode;
  readonly consensusKey: string;
  readonly disagreementCount: number;
  readonly metadata?: JagCollaborationMetadata;
}

/** Aggregate collaboration result. */
export interface JagCollaborationResult {
  readonly requestId: string;
  readonly moderated: JagModeratedCollaboration;
  readonly consensus: JagConsensusResult;
  readonly confidence: JagCollaborationConfidence;
  readonly conflicts: JagConflictAnalysis;
  readonly debate: JagDebateResult;
  readonly priorities: JagPriorityRanking;
  readonly plan: JagCollaborationPlan;
  readonly execution: JagCollaborationExecutionPackage;
  readonly learning: JagCollaborationLearningResult;
  readonly telemetry: JagCollaborationTelemetry;
  readonly domainVersion: string;
  readonly completedAt: string;
  readonly metadata?: JagCollaborationMetadata;
}
