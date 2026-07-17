/**
 * End-to-End Executive Workflow Engine — shared types (Sprint 018).
 *
 * Models complete organizational lifecycles by composing existing
 * Intelligence, Autonomy, Governance, Execution, Collaboration,
 * Shared Context, and Persistent Memory services.
 * Tenant-agnostic; no database, UI, or external services.
 */

import type { AutonomyLoopResult } from "@/lib/platform/autonomy/types";
import type { GovernanceCycleResult } from "@/lib/platform/governance/types";
import type { SharedIntelligenceContext } from "@/lib/platform/intelligence/context/builder";
import type { DecisionIntelligenceResult } from "@/lib/platform/intelligence/decision/types";
import type { ExecutiveIntelligenceResult } from "@/lib/platform/intelligence/domains/executive/types";
import type { StrategicIntelligenceResult } from "@/lib/platform/intelligence/domains/strategic/types";
import type { IntelligencePersistentMemoryRecord } from "@/lib/platform/intelligence/memory/types";
import type {
  OrganizationExecutiveBrief,
  OrganizationHealthScore,
  OrganizationMetricSample,
  OrganizationObservationResult,
} from "@/lib/platform/intelligence/organization/types";
import type {
  IntelligenceEvidenceRef,
  IntelligenceMetadata,
} from "@/lib/platform/intelligence/types";
import type {
  ExecutionGoal,
  ExecutionProgressSnapshot,
} from "@/lib/platform/execution/types";
import type { JagCollaborationResult } from "@/lib/platform/jag/collaboration/types";
import type { ExecutiveWorkspaceLinks } from "@/lib/platform/jag/workspace";
import type { JagCollaborationAgentRole } from "@/lib/platform/jag/collaboration/types";
import type { GovernanceAuthorityDomain } from "@/lib/platform/governance/types";

/** Semantic version of the workflow engine. */
export const EXECUTIVE_WORKFLOW_ENGINE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type WorkflowMetadata = IntelligenceMetadata;

/** Domain packs that model complete organizational lifecycles. */
export const WORKFLOW_DOMAINS = [
  "executive",
  "strategic",
  "governance",
  "finance",
  "hr",
  "operations",
  "enrollment",
  "academics",
  "compliance",
  "board",
] as const;
export type WorkflowDomain = (typeof WORKFLOW_DOMAINS)[number];

/**
 * Ordered lifecycle stages for every end-to-end workflow.
 *
 * Detect → Analyze → Collaborate → Recommend → Decision → Approval →
 * Execution → Monitoring → Measurement → Reflection → Memory update →
 * Executive Brief update → Organization Health update
 */
export const WORKFLOW_STAGES = [
  "detect",
  "analyze",
  "collaborate",
  "recommend",
  "decision",
  "approval",
  "execution",
  "monitoring",
  "measurement",
  "reflection",
  "memory_update",
  "executive_brief_update",
  "organization_health_update",
] as const;
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

/** Workflow run status. */
export const WORKFLOW_RUN_STATUSES = [
  "completed",
  "awaiting_approval",
  "partial",
  "failed",
] as const;
export type WorkflowRunStatus = (typeof WORKFLOW_RUN_STATUSES)[number];

/** Aggregated recommendation projection (no new business logic). */
export interface WorkflowRecommendationRef {
  readonly recommendationId: string;
  readonly source:
    | "organization"
    | "strategic"
    | "decision"
    | "executive"
    | "collaboration"
    | "autonomy";
  readonly title: string;
  readonly summary: string;
  readonly stage: WorkflowStage;
}

/** Per-stage completion record. */
export interface WorkflowStageRecord {
  readonly stage: WorkflowStage;
  readonly completedAt: string;
  readonly summary: string;
  readonly ok: boolean;
}

/** Domain pack configuration — specialization only, no duplicated logic. */
export interface WorkflowDomainConfig {
  readonly domain: WorkflowDomain;
  readonly label: string;
  readonly defaultSubject: string;
  readonly authorityDomain: GovernanceAuthorityDomain;
  readonly preferredAgents: readonly JagCollaborationAgentRole[];
  readonly metricKeys: readonly string[];
  readonly description: string;
}

/** Input for an end-to-end workflow run. */
export interface WorkflowRunRequest {
  readonly requestId: string;
  readonly domain: WorkflowDomain;
  readonly organizationId: string | null;
  readonly schoolId?: string | null;
  readonly subject?: string;
  readonly description?: string;
  readonly metrics?: readonly OrganizationMetricSample[];
  readonly sharedContext?: SharedIntelligenceContext;
  /** Skip building shared context when already supplied. */
  readonly evidenceRefs?: readonly IntelligenceEvidenceRef[];
  readonly actor?: string;
  readonly metadata?: WorkflowMetadata;
}

/** Full end-to-end workflow result. */
export interface WorkflowRunResult {
  readonly requestId: string;
  readonly domain: WorkflowDomain;
  readonly status: WorkflowRunStatus;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly stages: readonly WorkflowStageRecord[];
  readonly sharedContext: SharedIntelligenceContext | null;
  readonly detection: OrganizationObservationResult | null;
  readonly executive: ExecutiveIntelligenceResult | null;
  readonly strategic: StrategicIntelligenceResult | null;
  readonly decision: DecisionIntelligenceResult | null;
  readonly collaboration: JagCollaborationResult | null;
  readonly recommendations: readonly WorkflowRecommendationRef[];
  readonly autonomy: AutonomyLoopResult | null;
  readonly governance: GovernanceCycleResult | null;
  readonly executionGoals: readonly ExecutionGoal[];
  readonly executionProgress: readonly ExecutionProgressSnapshot[];
  readonly monitoring: OrganizationObservationResult | null;
  readonly measurementSummary: string;
  readonly reflectionSummary: string;
  readonly memories: readonly IntelligencePersistentMemoryRecord[];
  readonly executiveBrief: OrganizationExecutiveBrief | null;
  readonly organizationHealth: OrganizationHealthScore | null;
  readonly workspaceLinks: ExecutiveWorkspaceLinks;
  readonly domainVersion: string;
  readonly summary: string;
  readonly metadata?: WorkflowMetadata;
}
