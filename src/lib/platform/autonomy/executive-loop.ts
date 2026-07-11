/**
 * Autonomous Executive Operating Loop — orchestrator (Sprint 016).
 *
 * OBSERVE → DIAGNOSE → PLAN → DECIDE → EXECUTE → MEASURE → LEARN →
 * REFLECT → PRIORITIZE → ESCALATE under governance.
 */

import { AutonomyDecision } from "@/lib/platform/autonomy/decision";
import { AutonomyDiagnosis } from "@/lib/platform/autonomy/diagnosis";
import { AutonomyEscalation } from "@/lib/platform/autonomy/escalation";
import { AutonomyExecution } from "@/lib/platform/autonomy/execution";
import { AutonomyGovernance } from "@/lib/platform/autonomy/governance";
import { AutonomyLearning } from "@/lib/platform/autonomy/learning";
import { AutonomyMeasurement } from "@/lib/platform/autonomy/measurement";
import { AutonomyObservation } from "@/lib/platform/autonomy/observation";
import { AutonomyPlanning } from "@/lib/platform/autonomy/planning";
import { AutonomyPrioritization } from "@/lib/platform/autonomy/prioritization";
import { AutonomyReflection } from "@/lib/platform/autonomy/reflection";
import {
  AUTONOMOUS_EXECUTIVE_LOOP_VERSION,
  type AutonomyGovernanceDecision,
  type AutonomyLoopPhase,
  type AutonomyLoopRequest,
  type AutonomyLoopResult,
  type AutonomyLoopStatus,
} from "@/lib/platform/autonomy/types";
import type { GoalExecutionEngine } from "@/lib/platform/execution";
import type { PersistentIntelligenceMemory } from "@/lib/platform/intelligence/memory/index";
import type { OrganizationObserver } from "@/lib/platform/intelligence/organization/observer";

export interface AutonomousExecutiveLoopDependencies {
  observation?: AutonomyObservation;
  diagnosis?: AutonomyDiagnosis;
  planning?: AutonomyPlanning;
  decision?: AutonomyDecision;
  execution?: AutonomyExecution;
  measurement?: AutonomyMeasurement;
  learning?: AutonomyLearning;
  reflection?: AutonomyReflection;
  prioritization?: AutonomyPrioritization;
  escalation?: AutonomyEscalation;
  governance?: AutonomyGovernance;
  observer?: OrganizationObserver;
  goalEngine?: GoalExecutionEngine;
  memory?: PersistentIntelligenceMemory;
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * Full autonomous executive operating loop.
 */
export class AutonomousExecutiveLoop {
  private readonly observation: AutonomyObservation;
  private readonly diagnosis: AutonomyDiagnosis;
  private readonly planning: AutonomyPlanning;
  private readonly decision: AutonomyDecision;
  private readonly execution: AutonomyExecution;
  private readonly measurement: AutonomyMeasurement;
  private readonly learning: AutonomyLearning;
  private readonly reflection: AutonomyReflection;
  private readonly prioritization: AutonomyPrioritization;
  private readonly escalation: AutonomyEscalation;
  private readonly governance: AutonomyGovernance;
  private readonly now: () => Date;

  constructor(dependencies: AutonomousExecutiveLoopDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId = dependencies.createId;
    this.now = now;
    this.governance =
      dependencies.governance ??
      new AutonomyGovernance({
        policies: undefined,
      });

    this.observation =
      dependencies.observation ??
      new AutonomyObservation({
        observer: dependencies.observer,
        now,
        createId,
      });
    this.diagnosis =
      dependencies.diagnosis ?? new AutonomyDiagnosis({ createId });
    this.planning =
      dependencies.planning ?? new AutonomyPlanning({ createId });
    this.decision =
      dependencies.decision ??
      new AutonomyDecision({ governance: this.governance, createId });
    this.execution =
      dependencies.execution ??
      new AutonomyExecution({
        goalEngine: dependencies.goalEngine,
        governance: this.governance,
        now,
        createId,
      });
    this.measurement =
      dependencies.measurement ??
      new AutonomyMeasurement({ now, createId });
    this.learning =
      dependencies.learning ??
      new AutonomyLearning({
        memory: dependencies.memory,
        governance: this.governance,
        createId,
      });
    this.reflection =
      dependencies.reflection ?? new AutonomyReflection({ createId });
    this.prioritization =
      dependencies.prioritization ??
      new AutonomyPrioritization({ createId });
    this.escalation =
      dependencies.escalation ??
      new AutonomyEscalation({ now, createId });
  }

  /**
   * Run one full autonomous cycle.
   */
  async run(request: AutonomyLoopRequest): Promise<AutonomyLoopResult> {
    const startedAt = this.now().toISOString();
    const phasesCompleted: AutonomyLoopPhase[] = [];
    const governanceChecks: AutonomyGovernanceDecision[] = [];

    const observeGate = this.governance.evaluate("observe", {
      policies: request.policies,
    });
    governanceChecks.push(observeGate);
    if (!observeGate.allowed) {
      return this.blockedResult(request, startedAt, governanceChecks, observeGate.reason);
    }

    const observation = await this.observation.collect(request);
    phasesCompleted.push("observe");

    const diagnoseGate = this.governance.evaluate("diagnose", {
      policies: request.policies,
    });
    governanceChecks.push(diagnoseGate);
    if (!diagnoseGate.allowed) {
      return this.partialFromObservation(
        request,
        startedAt,
        observation,
        governanceChecks,
        phasesCompleted,
        "blocked_by_policy",
        diagnoseGate.reason
      );
    }

    const diagnosis = this.diagnosis.diagnose(request, observation);
    phasesCompleted.push("diagnose");

    const planGate = this.governance.evaluate("plan", {
      policies: request.policies,
    });
    governanceChecks.push(planGate);
    if (!planGate.allowed) {
      return this.partialFromDiagnosis(
        request,
        startedAt,
        observation,
        diagnosis,
        governanceChecks,
        phasesCompleted,
        "blocked_by_policy",
        planGate.reason
      );
    }

    const plan = this.planning.plan(request, diagnosis);
    phasesCompleted.push("plan");

    const decision = this.decision.decide(
      request,
      diagnosis,
      plan,
      governanceChecks
    );
    phasesCompleted.push("decide");

    const execution = await this.execution.execute(
      request,
      plan,
      decision,
      governanceChecks
    );
    phasesCompleted.push("execute");

    const measurement = this.measurement.measure(
      request,
      execution,
      observation.organization?.health.score
    );
    phasesCompleted.push("measure");

    const learning = await this.learning.learn(
      request,
      diagnosis,
      plan,
      decision,
      measurement,
      null,
      governanceChecks
    );
    phasesCompleted.push("learn");

    const reflection = this.reflection.reflect(
      request,
      plan,
      execution,
      measurement
    );
    phasesCompleted.push("reflect");

    const prioritization = this.prioritization.prioritize(
      request,
      diagnosis,
      plan
    );
    phasesCompleted.push("prioritize");

    const escalation = this.escalation.escalate(request, decision);
    phasesCompleted.push("escalate");

    const status: AutonomyLoopStatus = decision.requiresHuman
      ? "awaiting_approval"
      : execution.status === "created"
        ? "completed"
        : execution.status === "skipped"
          ? "partial"
          : "awaiting_approval";

    const completedAt = this.now().toISOString();

    return {
      requestId: request.requestId,
      status,
      startedAt,
      completedAt,
      observation,
      diagnosis,
      plan,
      decision,
      execution,
      measurement,
      learning,
      reflection,
      prioritization,
      escalation,
      governanceChecks,
      phasesCompleted,
      domainVersion: AUTONOMOUS_EXECUTIVE_LOOP_VERSION,
      summary: [
        observation.summary,
        diagnosis.summary,
        decision.approvalMode,
        execution.summary,
        escalation.summary,
      ].join(" | "),
    };
  }

  private blockedResult(
    request: AutonomyLoopRequest,
    startedAt: string,
    governanceChecks: AutonomyGovernanceDecision[],
    reason: string
  ): AutonomyLoopResult {
    return this.emptyShell(
      request,
      startedAt,
      governanceChecks,
      [],
      "blocked_by_policy",
      reason
    );
  }

  private partialFromObservation(
    request: AutonomyLoopRequest,
    startedAt: string,
    observation: AutonomyLoopResult["observation"],
    governanceChecks: AutonomyGovernanceDecision[],
    phasesCompleted: AutonomyLoopPhase[],
    status: AutonomyLoopStatus,
    reason: string
  ): AutonomyLoopResult {
    const shell = this.emptyShell(
      request,
      startedAt,
      governanceChecks,
      phasesCompleted,
      status,
      reason
    );
    return { ...shell, observation };
  }

  private partialFromDiagnosis(
    request: AutonomyLoopRequest,
    startedAt: string,
    observation: AutonomyLoopResult["observation"],
    diagnosis: AutonomyLoopResult["diagnosis"],
    governanceChecks: AutonomyGovernanceDecision[],
    phasesCompleted: AutonomyLoopPhase[],
    status: AutonomyLoopStatus,
    reason: string
  ): AutonomyLoopResult {
    const shell = this.emptyShell(
      request,
      startedAt,
      governanceChecks,
      phasesCompleted,
      status,
      reason
    );
    return { ...shell, observation, diagnosis };
  }

  private emptyShell(
    request: AutonomyLoopRequest,
    startedAt: string,
    governanceChecks: AutonomyGovernanceDecision[],
    phasesCompleted: AutonomyLoopPhase[],
    status: AutonomyLoopStatus,
    reason: string
  ): AutonomyLoopResult {
    const completedAt = this.now().toISOString();
    const emptyConfidence = {
      value: 0,
      level: "low" as const,
      factors: [],
    };
    return {
      requestId: request.requestId,
      status,
      startedAt,
      completedAt,
      observation: {
        requestId: request.requestId,
        observedAt: startedAt,
        organization: null,
        signals: [],
        metrics: [],
        summary: reason,
      },
      diagnosis: {
        requestId: request.requestId,
        causes: [],
        primaryCauseId: null,
        summary: reason,
        confidence: emptyConfidence,
      },
      plan: {
        planId: `${request.requestId}:plan-empty`,
        requestId: request.requestId,
        title: "Blocked",
        summary: reason,
        steps: [],
        linkedCauseIds: [],
        expectedValue: "n/a",
        confidence: emptyConfidence,
      },
      decision: {
        decisionId: `${request.requestId}:decision-empty`,
        requestId: request.requestId,
        approvalMode: "approval_required",
        approvedForExecution: false,
        rationale: [reason],
        recommendedPlanId: `${request.requestId}:plan-empty`,
        confidence: emptyConfidence,
        requiresHuman: true,
      },
      execution: {
        packageId: `${request.requestId}:exec-empty`,
        requestId: request.requestId,
        status: "skipped",
        goal: null,
        progress: null,
        scorecard: null,
        holdReason: reason,
        summary: reason,
      },
      measurement: {
        measurementId: `${request.requestId}:measure-empty`,
        requestId: request.requestId,
        measuredAt: completedAt,
        progressPercent: 0,
        healthScore: 0,
        outcomeSignals: [],
        summary: reason,
      },
      learning: {
        learningId: `${request.requestId}:learn-empty`,
        requestId: request.requestId,
        memoryId: null,
        lessons: [],
        persisted: false,
        summary: reason,
      },
      reflection: {
        reflectionId: `${request.requestId}:reflect-empty`,
        requestId: request.requestId,
        expectedOutcome: "n/a",
        actualOutcome: reason,
        deltaSummary: reason,
        metExpectation: false,
        varianceScore: 0,
        insights: [reason],
        summary: reason,
      },
      prioritization: {
        requestId: request.requestId,
        ranked: [],
        topItemId: null,
        summary: reason,
      },
      escalation: {
        requestId: request.requestId,
        notices: [],
        requiresHuman: true,
        summary: reason,
      },
      governanceChecks,
      phasesCompleted,
      domainVersion: AUTONOMOUS_EXECUTIVE_LOOP_VERSION,
      summary: reason,
    };
  }
}

/** Factory for a fully wired autonomous executive loop. */
export function createAutonomousExecutiveLoop(
  dependencies: AutonomousExecutiveLoopDependencies = {}
): AutonomousExecutiveLoop {
  return new AutonomousExecutiveLoop(dependencies);
}
