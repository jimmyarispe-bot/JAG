/**
 * End-to-End Workflow Engine — pipeline orchestrator (Sprint 018).
 *
 * Composes existing services only — no duplicated business logic.
 */

import {
  createAutonomousExecutiveLoop,
  type AutonomousExecutiveLoop,
} from "@/lib/platform/autonomy";
import {
  createEnterpriseGovernance,
  type EnterpriseGovernanceEngine,
} from "@/lib/platform/governance";
import {
  createGoalExecutionEngine,
  type GoalExecutionEngine,
} from "@/lib/platform/execution";
import {
  createDecisionIntelligenceDomain,
  type DecisionResolver,
} from "@/lib/platform/intelligence/decision";
import {
  createExecutiveIntelligenceDomain,
  type ExecutiveResolver,
} from "@/lib/platform/intelligence/domains/executive";
import {
  createStrategicIntelligenceDomain,
  type StrategicResolver,
} from "@/lib/platform/intelligence/domains/strategic";
import {
  createOrganizationalIntelligence,
  type OrganizationObserver,
} from "@/lib/platform/intelligence/organization";
import {
  createPersistentIntelligenceMemory,
  type PersistentIntelligenceMemory,
} from "@/lib/platform/intelligence/memory/index";
import {
  createSharedIntelligenceContextBuilder,
  type SharedIntelligenceContextBuilder,
} from "@/lib/platform/intelligence/context/builder";
import {
  createJagCollaborationEngine,
  type JagCollaborationCoordinator,
} from "@/lib/platform/jag/collaboration";
import { getWorkflowDomainConfig } from "@/lib/platform/executive-workflows/domain-configs";
import {
  EXECUTIVE_WORKFLOW_ENGINE_VERSION,
  WORKFLOW_STAGES,
  type WorkflowDomainConfig,
  type WorkflowRecommendationRef,
  type WorkflowRunRequest,
  type WorkflowRunResult,
  type WorkflowRunStatus,
  type WorkflowStageRecord,
} from "@/lib/platform/executive-workflows/types";
import type { OrganizationMetricSample } from "@/lib/platform/intelligence/organization/types";
import type { ExecutiveWorkspaceLinks } from "@/lib/platform/jag/workspace";

export interface WorkflowPipelineDependencies {
  sharedContextBuilder?: SharedIntelligenceContextBuilder;
  organizationObserver?: OrganizationObserver;
  executiveResolver?: ExecutiveResolver;
  strategicResolver?: StrategicResolver;
  decisionResolver?: DecisionResolver;
  collaboration?: JagCollaborationCoordinator;
  autonomyLoop?: AutonomousExecutiveLoop;
  governance?: EnterpriseGovernanceEngine;
  goalEngine?: GoalExecutionEngine;
  memory?: PersistentIntelligenceMemory;
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * Runs the full Detect → … → Organization Health update lifecycle
 * by wiring existing platform services.
 */
export class WorkflowPipeline {
  private readonly sharedContextBuilder: SharedIntelligenceContextBuilder;
  private readonly organizationObserver: OrganizationObserver;
  private readonly executiveResolver: ExecutiveResolver;
  private readonly strategicResolver: StrategicResolver;
  private readonly decisionResolver: DecisionResolver;
  private readonly collaboration: JagCollaborationCoordinator;
  private readonly autonomyLoop: AutonomousExecutiveLoop;
  private readonly governance: EnterpriseGovernanceEngine;
  private readonly goalEngine: GoalExecutionEngine;
  private readonly memory: PersistentIntelligenceMemory;
  private readonly now: () => Date;

  constructor(dependencies: WorkflowPipelineDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId = dependencies.createId;
    this.now = now;

    this.memory =
      dependencies.memory ?? createPersistentIntelligenceMemory();
    this.goalEngine =
      dependencies.goalEngine ??
      createGoalExecutionEngine({ now, createId: createId ? () => createId("goal") : undefined });
    this.sharedContextBuilder =
      dependencies.sharedContextBuilder ??
      createSharedIntelligenceContextBuilder();
    this.organizationObserver =
      dependencies.organizationObserver ??
      createOrganizationalIntelligence({ now, createId, memory: this.memory }).observer;
    this.executiveResolver =
      dependencies.executiveResolver ?? createExecutiveIntelligenceDomain();
    this.strategicResolver =
      dependencies.strategicResolver ?? createStrategicIntelligenceDomain();
    this.decisionResolver =
      dependencies.decisionResolver ?? createDecisionIntelligenceDomain();
    this.collaboration =
      dependencies.collaboration ??
      createJagCollaborationEngine({ memory: this.memory, now });
    this.autonomyLoop =
      dependencies.autonomyLoop ??
      createAutonomousExecutiveLoop({
        memory: this.memory,
        goalEngine: this.goalEngine,
        observer: this.organizationObserver,
        now,
        createId,
      });
    this.governance =
      dependencies.governance ??
      createEnterpriseGovernance({ now, createId });
  }

  async run(request: WorkflowRunRequest): Promise<WorkflowRunResult> {
    const config = getWorkflowDomainConfig(request.domain);
    const startedAt = this.now().toISOString();
    const stages: WorkflowStageRecord[] = [];
    const subject = request.subject ?? config.defaultSubject;
    const description =
      request.description ??
      `${config.label} lifecycle: ${config.description}`;

    // ── DETECT ──────────────────────────────────────────────
    const sharedContext =
      request.sharedContext ??
      (await this.sharedContextBuilder.build({
        organizationId: request.organizationId,
        schoolId: request.schoolId ?? null,
        runId: request.requestId,
      }));

    const metrics = this.selectMetrics(request.metrics ?? [], config);
    const detection = await this.organizationObserver.observe({
      requestId: `${request.requestId}:detect`,
      organizationId: request.organizationId,
      schoolId: request.schoolId ?? null,
      observedAt: this.now().toISOString(),
      metrics,
      sharedContext,
    });
    stages.push(stage("detect", this.now, detection.brief.headline, true));

    // ── ANALYZE ─────────────────────────────────────────────
    const executive = this.executiveResolver.analyze({
      requestId: `${request.requestId}:executive`,
      subject,
      description,
      metadata: { sharedContext, domain: config.domain },
    });

    const strategic = this.strategicResolver.analyze({
      requestId: `${request.requestId}:strategic`,
      subject,
      description,
      organizationId: request.organizationId,
      schoolId: request.schoolId ?? null,
      findings: detection.alerts.slice(0, 5).map((alert) => ({
        findingId: alert.alertId,
        title: alert.title,
        summary: alert.message,
        severity:
          alert.severity === "critical"
            ? ("critical" as const)
            : alert.severity === "high"
              ? ("high" as const)
              : ("medium" as const),
        kindHints: ["organizational_risk" as const, "operational_weakness" as const],
        confidence: { value: 0.7, level: "medium" as const, factors: [] },
        signals: [alert.monitor],
      })),
      metadata: { sharedContext, domain: config.domain },
    });

    const decision = this.decisionResolver.analyze({
      requestId: `${request.requestId}:decision`,
      subject,
      description,
      organizationId: request.organizationId,
      schoolId: request.schoolId ?? null,
      sharedContext,
      strategic,
      metadata: { domain: config.domain, authorityDomain: config.authorityDomain },
    });
    stages.push(
      stage(
        "analyze",
        this.now,
        `Executive ${executive.classification.category}; strategic goals ${strategic.goals.length}; decision ${decision.recommendation.recommendedOption}`,
        true
      )
    );

    // ── COLLABORATE ─────────────────────────────────────────
    const collaboration = await this.collaboration.collaborate({
      requestId: `${request.requestId}:collab`,
      subject,
      description,
      organizationId: request.organizationId,
      schoolId: request.schoolId ?? null,
      sharedContext,
      preferredAgents: [...config.preferredAgents],
      evidenceRefs: decision.evidence.items.slice(0, 5).map((item) => ({
        evidenceId: item.evidenceId,
        label: item.title,
        weight: item.weight,
      })),
    });
    stages.push(
      stage(
        "collaborate",
        this.now,
        collaboration.consensus.summary,
        true
      )
    );

    // ── RECOMMEND (projection only) ─────────────────────────
    const recommendations = collectRecommendations({
      detection,
      strategic,
      decision,
      executive,
      collaboration,
    });
    stages.push(
      stage(
        "recommend",
        this.now,
        `${recommendations.length} recommendation(s) aggregated`,
        true
      )
    );

    // ── DECISION + EXECUTION + MEASUREMENT + REFLECTION + MEMORY via Autonomy ──
    const autonomy = await this.autonomyLoop.run({
      requestId: `${request.requestId}:autonomy`,
      organizationId: request.organizationId,
      schoolId: request.schoolId ?? null,
      subject,
      description,
      organization: detection,
      sharedContext,
      executive,
      strategic,
      decision,
      collaboration,
      evidenceRefs: request.evidenceRefs,
    });
    stages.push(
      stage(
        "decision",
        this.now,
        `Autonomy approval mode ${autonomy.decision.approvalMode}`,
        true
      )
    );

    // ── APPROVAL via Enterprise Governance ──────────────────
    const workspaceLinks = buildWorkspaceLinks({
      decision,
      autonomy,
      detection,
    });
    const governance = this.governance.run({
      requestId: `${request.requestId}:governance`,
      organizationId: request.organizationId,
      schoolId: request.schoolId ?? null,
      subject,
      description,
      sharedContext,
      autonomy,
      organization: detection,
      decision,
      collaboration,
      executionGoals: autonomy.execution.goal ? [autonomy.execution.goal] : [],
      executionProgress: autonomy.execution.progress
        ? [autonomy.execution.progress]
        : [],
      workspaceLinks,
      actor: request.actor,
      metadata: { workflowDomain: config.domain, authorityDomain: config.authorityDomain },
    });
    stages.push(
      stage(
        "approval",
        this.now,
        `${governance.approvals.length} approval(s); ${governance.motions.length} motion(s)`,
        true
      )
    );
    stages.push(
      stage("execution", this.now, autonomy.execution.summary, true)
    );

    // ── MONITORING (second observation cycle) ───────────────
    const monitoring = await this.organizationObserver.observe({
      requestId: `${request.requestId}:monitor`,
      organizationId: request.organizationId,
      schoolId: request.schoolId ?? null,
      observedAt: this.now().toISOString(),
      metrics,
      sharedContext,
      strategic,
      executive,
      decision,
      executionGoals: autonomy.execution.goal ? [autonomy.execution.goal] : [],
      executionProgress: autonomy.execution.progress
        ? [autonomy.execution.progress]
        : [],
    });
    stages.push(
      stage(
        "monitoring",
        this.now,
        `Health ${monitoring.health.score} (${monitoring.health.band})`,
        true
      )
    );

    stages.push(
      stage("measurement", this.now, autonomy.measurement.summary, true)
    );
    stages.push(
      stage("reflection", this.now, autonomy.reflection.summary, true)
    );
    stages.push(
      stage(
        "memory_update",
        this.now,
        autonomy.learning.persisted
          ? `Memory ${autonomy.learning.memoryId}`
          : autonomy.learning.summary,
        autonomy.learning.persisted || autonomy.learning.lessons.length > 0
      )
    );

    // ── EXECUTIVE BRIEF + ORGANIZATION HEALTH UPDATE ────────
    const executiveBrief = monitoring.brief;
    const organizationHealth = monitoring.health;
    stages.push(
      stage(
        "executive_brief_update",
        this.now,
        executiveBrief.headline,
        true
      )
    );
    stages.push(
      stage(
        "organization_health_update",
        this.now,
        organizationHealth.summary,
        true
      )
    );

    const memories = autonomy.learning.memoryId
      ? (
          await this.memory.findRelatedMemory({
            text: subject,
            organizationId: request.organizationId,
            limit: 8,
          })
        )
      : [];

    const completedAt = this.now().toISOString();
    const status: WorkflowRunStatus = autonomy.decision.requiresHuman
      ? "awaiting_approval"
      : stages.every((s) => s.ok)
        ? "completed"
        : "partial";

    // Ensure all stages recorded in canonical order
    const orderedStages = WORKFLOW_STAGES.map((name) => {
      const found = stages.find((s) => s.stage === name);
      return (
        found ??
        stage(name, this.now, "Skipped", false)
      );
    });

    return {
      requestId: request.requestId,
      domain: request.domain,
      status,
      startedAt,
      completedAt,
      stages: orderedStages,
      sharedContext,
      detection,
      executive,
      strategic,
      decision,
      collaboration,
      recommendations,
      autonomy,
      governance,
      executionGoals: autonomy.execution.goal ? [autonomy.execution.goal] : [],
      executionProgress: autonomy.execution.progress
        ? [autonomy.execution.progress]
        : [],
      monitoring,
      measurementSummary: autonomy.measurement.summary,
      reflectionSummary: autonomy.reflection.summary,
      memories,
      executiveBrief,
      organizationHealth,
      workspaceLinks,
      domainVersion: EXECUTIVE_WORKFLOW_ENGINE_VERSION,
      summary: [
        `${config.label} workflow ${status}`,
        detection.brief.summary,
        autonomy.decision.approvalMode,
        governance.summary,
        `Health ${organizationHealth.score}`,
      ].join(" | "),
      metadata: {
        authorityDomain: config.authorityDomain,
        stagesCompleted: orderedStages.filter((s) => s.ok).length,
      },
    };
  }

  private selectMetrics(
    metrics: readonly OrganizationMetricSample[],
    config: WorkflowDomainConfig
  ): OrganizationMetricSample[] {
    if (metrics.length === 0) return [];
    const preferred = new Set(config.metricKeys);
    const prioritized = metrics.filter((m) => preferred.has(m.key));
    return prioritized.length > 0 ? [...prioritized, ...metrics.filter((m) => !preferred.has(m.key))] : [...metrics];
  }
}

function stage(
  name: WorkflowStageRecord["stage"],
  now: () => Date,
  summary: string,
  ok: boolean
): WorkflowStageRecord {
  return {
    stage: name,
    completedAt: now().toISOString(),
    summary,
    ok,
  };
}

function collectRecommendations(input: {
  detection: NonNullable<WorkflowRunResult["detection"]>;
  strategic: NonNullable<WorkflowRunResult["strategic"]>;
  decision: NonNullable<WorkflowRunResult["decision"]>;
  executive: NonNullable<WorkflowRunResult["executive"]>;
  collaboration: NonNullable<WorkflowRunResult["collaboration"]>;
}): WorkflowRecommendationRef[] {
  const refs: WorkflowRecommendationRef[] = [];

  for (const rec of input.detection.recommendations) {
    refs.push({
      recommendationId: rec.recommendationId,
      source: "organization",
      title: rec.title,
      summary: rec.rationale,
      stage: "recommend",
    });
  }
  for (const rec of input.strategic.recommendations) {
    refs.push({
      recommendationId: rec.recommendationId,
      source: "strategic",
      title: rec.expectedImpact,
      summary: rec.recommendedActions.join(" · "),
      stage: "recommend",
    });
  }
  refs.push({
    recommendationId: input.decision.recommendation.recommendationId,
    source: "decision",
    title: input.decision.recommendation.recommendedOption,
    summary: input.decision.recommendation.rationale.join(" · "),
    stage: "recommend",
  });
  for (const rec of input.executive.recommendations.recommendations) {
    refs.push({
      recommendationId: rec.recommendationId,
      source: "executive",
      title: rec.label,
      summary: rec.instruction,
      stage: "recommend",
    });
  }
  for (const rec of input.collaboration.moderated.mergedRecommendations) {
    refs.push({
      recommendationId: rec.recommendationKey,
      source: "collaboration",
      title: rec.title,
      summary: rec.summary,
      stage: "recommend",
    });
  }

  return refs;
}

function buildWorkspaceLinks(input: {
  decision: NonNullable<WorkflowRunResult["decision"]>;
  autonomy: NonNullable<WorkflowRunResult["autonomy"]>;
  detection: NonNullable<WorkflowRunResult["detection"]>;
}): ExecutiveWorkspaceLinks {
  return {
    evidenceIds: input.decision.evidence.items.map((i) => i.evidenceId),
    memoryIds: input.autonomy.learning.memoryId
      ? [input.autonomy.learning.memoryId]
      : [],
    goalIds: input.autonomy.execution.goal
      ? [input.autonomy.execution.goal.id]
      : [],
    executionIds: input.autonomy.execution.progress
      ? [input.autonomy.execution.progress.subjectId]
      : [],
    decisionId: input.decision.requestId,
    organizationRequestId: input.detection.requestId,
  };
}
