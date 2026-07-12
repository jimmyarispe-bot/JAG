/**
 * JAG Intelligence Orchestrator — Phase 1 foundation.
 *
 * Coordinates the mandatory cognitive pipeline. Does not implement
 * domain business logic — each stage delegates to an injected service.
 *
 * See `docs/architecture/JAG_ORCHESTRATION_ARCHITECTURE.md`.
 */

import type { IntelligenceConfidenceService } from "@/lib/platform/intelligence/confidence";
import type {
  BuildIntelligenceContextInput,
  IntelligenceContext,
  IntelligenceContextService,
} from "@/lib/platform/intelligence/context";
import type {
  IntelligenceEvent,
  IntelligenceEventService,
} from "@/lib/platform/intelligence/events";
import type { IntelligenceExplainService } from "@/lib/platform/intelligence/explain";
import type {
  IntelligenceKnowledgeResult,
  IntelligenceKnowledgeService,
} from "@/lib/platform/intelligence/knowledge/foundation";
import type {
  IntelligenceLearningRecord,
  IntelligenceLearningService,
} from "@/lib/platform/intelligence/learning";
import type {
  IntelligenceMemoryEntry,
  IntelligenceMemoryService,
} from "@/lib/platform/intelligence/memory";
import type {
  IntelligencePlan,
  IntelligencePlannerService,
} from "@/lib/platform/intelligence/planner";
import type {
  IntelligenceReasoningResult,
  IntelligenceReasoningService,
} from "@/lib/platform/intelligence/reasoning";
import {
  INTELLIGENCE_ENGINE_VERSION,
  type IntelligenceConfidenceScore,
  type IntelligenceExplanation,
  type IntelligenceMetadata,
  type IntelligenceOutcome,
  type IntelligenceRunRequest,
  type IntelligenceRunStatus,
} from "@/lib/platform/intelligence/types";

/** Ordered orchestrator pipeline stages (governing architecture). */
export const INTELLIGENCE_ORCHESTRATOR_STAGES = [
  "build_context",
  "retrieve_knowledge",
  "load_memory",
  "generate_reasoning",
  "score_confidence",
  "build_action_plan",
  "generate_explanation",
  "record_learning",
  "emit_events",
] as const;

export type IntelligenceOrchestratorStage = (typeof INTELLIGENCE_ORCHESTRATOR_STAGES)[number];

/** Typed error codes thrown by {@link IntelligenceOrchestrator}. */
export const INTELLIGENCE_ORCHESTRATOR_ERROR_CODES = [
  "CONTEXT_FAILED",
  "KNOWLEDGE_FAILED",
  "MEMORY_FAILED",
  "REASONING_FAILED",
  "CONFIDENCE_FAILED",
  "PLANNING_FAILED",
  "EXPLANATION_FAILED",
  "LEARNING_FAILED",
  "EVENT_FAILED",
  "UNEXPECTED",
] as const;

export type IntelligenceOrchestratorErrorCode =
  (typeof INTELLIGENCE_ORCHESTRATOR_ERROR_CODES)[number];

const STAGE_ERROR_CODES: Record<
  IntelligenceOrchestratorStage,
  IntelligenceOrchestratorErrorCode
> = {
  build_context: "CONTEXT_FAILED",
  retrieve_knowledge: "KNOWLEDGE_FAILED",
  load_memory: "MEMORY_FAILED",
  generate_reasoning: "REASONING_FAILED",
  score_confidence: "CONFIDENCE_FAILED",
  build_action_plan: "PLANNING_FAILED",
  generate_explanation: "EXPLANATION_FAILED",
  record_learning: "LEARNING_FAILED",
  emit_events: "EVENT_FAILED",
};

/**
 * Typed error for orchestrator pipeline failures.
 * Wraps underlying service errors without losing stage identity.
 */
export class IntelligenceOrchestratorError extends Error {
  readonly code: IntelligenceOrchestratorErrorCode;
  readonly stage: IntelligenceOrchestratorStage | null;
  readonly runId: string | null;
  override readonly cause: unknown;

  constructor(options: {
    code: IntelligenceOrchestratorErrorCode;
    message: string;
    stage?: IntelligenceOrchestratorStage | null;
    runId?: string | null;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = "IntelligenceOrchestratorError";
    this.code = options.code;
    this.stage = options.stage ?? null;
    this.runId = options.runId ?? null;
    this.cause = options.cause;
  }
}

/** Injected cognitive services required by the orchestrator. */
export interface IntelligenceOrchestratorDependencies {
  context: IntelligenceContextService;
  knowledge: IntelligenceKnowledgeService;
  memory: IntelligenceMemoryService;
  reasoning: IntelligenceReasoningService;
  confidence: IntelligenceConfidenceService;
  planner: IntelligencePlannerService;
  explain: IntelligenceExplainService;
  learning: IntelligenceLearningService;
  events: IntelligenceEventService;
}

/** Strongly typed result of a completed orchestrator pipeline run. */
export interface IntelligenceResult {
  runId: string;
  status: IntelligenceRunStatus;
  engineVersion: string;
  context: IntelligenceContext;
  knowledge: IntelligenceKnowledgeResult;
  memory: IntelligenceMemoryEntry[];
  reasoning: IntelligenceReasoningResult;
  confidence: IntelligenceConfidenceScore;
  plan: IntelligencePlan;
  explanation: IntelligenceExplanation;
  learning: IntelligenceLearningRecord;
  events: IntelligenceEvent[];
  completedAt: string;
  metadata?: IntelligenceMetadata;
}

/**
 * Coordinates the JAG Intelligence pipeline.
 *
 * Stage order is fixed. Domain logic lives in injected services only.
 */
export class IntelligenceOrchestrator {
  private readonly deps: IntelligenceOrchestratorDependencies;

  /**
   * Create an orchestrator with explicit service dependencies.
   * @param dependencies - Cognitive services used by each pipeline stage.
   */
  constructor(dependencies: IntelligenceOrchestratorDependencies) {
    this.deps = dependencies;
  }

  /**
   * Execute the full intelligence pipeline for a run request.
   *
   * Stages: context → knowledge → memory → reasoning → confidence →
   * plan → explanation → learning → events → result.
   *
   * @param request - Domain intent, actor, and tenant scope for the run.
   * @returns Strongly typed {@link IntelligenceResult} when all stages succeed.
   * @throws {IntelligenceOrchestratorError} When any stage fails.
   */
  async run(request: IntelligenceRunRequest): Promise<IntelligenceResult> {
    // TODO: Replace with durable run-id allocator / persistence key.
    const runId = request.runId ?? `intel-run-${Date.now()}`;
    const emittedEvents: IntelligenceEvent[] = [];

    const context = await this.runStage("build_context", runId, () =>
      this.deps.context.build(this.toContextInput(request))
    );

    // TODO: Enforce context.validate() fail-closed before continuing.
    await this.runStage("build_context", runId, () => this.deps.context.validate(context));

    const knowledge = await this.runStage("retrieve_knowledge", runId, () =>
      this.deps.knowledge.query(context, {
        text: request.intent,
        // TODO: Map request.input entity refs into knowledge query filters.
        metadata: request.metadata,
      })
    );

    const memory = await this.runStage("load_memory", runId, () =>
      this.deps.memory.recall(context, {
        organizationId: context.scope.organizationId,
        schoolId: context.scope.schoolId,
        // TODO: Split short-term vs long-term recall into explicit working-set assembly.
        limit: undefined,
      })
    );

    const reasoning = await this.runStage("generate_reasoning", runId, () =>
      this.deps.reasoning.reason(context, {
        intent: request.intent,
        // TODO: Derive observations and evidenceRefs from knowledge + memory working sets.
        observations: memory.map((entry) => entry.content),
        stage: request.stage,
        metadata: request.input,
      })
    );

    const primaryHypothesis =
      reasoning.primaryHypothesis ?? reasoning.hypotheses[0] ?? undefined;

    const confidence = await this.runStage("score_confidence", runId, () =>
      this.deps.confidence.score(context, {
        hypothesis: primaryHypothesis,
        evidenceRefs: primaryHypothesis?.evidenceRefs,
        // TODO: Fold knowledge completeness and memory reinforcement into scoring input.
        metadata: request.metadata,
      })
    );

    const plan = await this.runStage("build_action_plan", runId, () =>
      this.deps.planner.plan(context, {
        intent: request.intent,
        hypotheses: reasoning.hypotheses,
        // TODO: Apply authority policy and human-gate constraints from domain packs.
        constraints: request.input,
        metadata: request.metadata,
      })
    );

    const explanation = await this.runStage("generate_explanation", runId, () =>
      this.deps.explain.explain(context, {
        recommendation: plan.primaryRecommendation ?? undefined,
        hypotheses: reasoning.hypotheses,
        // TODO: Pass full run snapshot once persistence exists.
        metadata: {
          confidence,
          knowledgeNodeCount: knowledge.nodes.length,
          memoryEntryCount: memory.length,
        },
      })
    );

    // TODO: Insert authorize / execute / measure_outcome stages before learning
    // when execution guidance is wired (see JAG_ORCHESTRATION_ARCHITECTURE.md).
    const deferredOutcome = this.createDeferredOutcome(runId, plan);

    const learning = await this.runStage("record_learning", runId, () =>
      this.deps.learning.record(context, {
        domain: context.domain,
        outcome: deferredOutcome,
        recommendation: plan.primaryRecommendation ?? undefined,
        // TODO: Derive patternKey from hypothesis / case classification.
        summary: explanation.summary,
        metadata: request.metadata,
      })
    );

    const completionEvent = await this.runStage("emit_events", runId, () =>
      this.deps.events.publish(context, {
        eventType: "intelligence.run.completed",
        runId,
        payload: {
          domain: context.domain,
          intent: request.intent,
          hypothesisCount: reasoning.hypotheses.length,
          hasRecommendation: plan.primaryRecommendation !== null,
          learningId: learning.learningId,
        },
        metadata: request.metadata,
      })
    );
    emittedEvents.push(completionEvent);

    // TODO: Emit intermediate events (run.started, hypothesis.generated,
    // recommendation.created, learning.recorded) at their stage boundaries.

    return {
      runId,
      // TODO: Reflect awaiting_authorization / failed statuses from real gates.
      status: "completed",
      engineVersion: INTELLIGENCE_ENGINE_VERSION,
      context,
      knowledge,
      memory,
      reasoning,
      confidence,
      plan,
      explanation,
      learning,
      events: emittedEvents,
      completedAt: new Date().toISOString(),
      metadata: request.metadata,
    };
  }

  /**
   * Map a run request into context-builder input.
   * Pure field projection — no domain rules.
   */
  private toContextInput(request: IntelligenceRunRequest): BuildIntelligenceContextInput {
    return {
      organizationId: request.scope.organizationId,
      schoolId: request.scope.schoolId,
      userId: request.actor.userId,
      roleKeys: request.actor.roleKeys,
      domain: request.domain,
      // TODO: Thread sessionId / conversationId / workflowKey from request.input.
      metadata: request.metadata,
    };
  }

  /**
   * Placeholder outcome until execute / measure_outcome stages exist.
   * Structural only — not a measured business result.
   */
  private createDeferredOutcome(runId: string, plan: IntelligencePlan): IntelligenceOutcome {
    return {
      // TODO: Replace with measured outcome from execution stage.
      outcomeId: `deferred-outcome:${runId}`,
      recommendationId: plan.primaryRecommendation?.recommendationId,
      success: false,
      summary: "Outcome measurement deferred — execution stage not yet wired",
      measuredAt: new Date().toISOString(),
      metadata: { deferred: true },
    };
  }

  /**
   * Run a single pipeline stage, wrapping failures as typed orchestrator errors.
   */
  private async runStage<T>(
    stage: IntelligenceOrchestratorStage,
    runId: string,
    operation: () => T | Promise<T>
  ): Promise<T> {
    try {
      return await Promise.resolve(operation());
    } catch (cause) {
      if (cause instanceof IntelligenceOrchestratorError) {
        throw cause;
      }
      throw new IntelligenceOrchestratorError({
        code: STAGE_ERROR_CODES[stage],
        message: `JAG Intelligence orchestrator stage "${stage}" failed for run ${runId}`,
        stage,
        runId,
        cause,
      });
    }
  }
}
