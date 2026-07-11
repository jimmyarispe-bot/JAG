/**
 * Autonomous Executive Operating Loop — learning.
 *
 * Writes lessons into Persistent Memory.
 */

import type { PersistentIntelligenceMemory } from "@/lib/platform/intelligence/memory/index";
import { AutonomyGovernance } from "@/lib/platform/autonomy/governance";
import type {
  AutonomyDecisionResult,
  AutonomyDiagnosisResult,
  AutonomyGovernanceDecision,
  AutonomyLearningResult,
  AutonomyLoopRequest,
  AutonomyMeasurementResult,
  AutonomyPlan,
  AutonomyReflectionResult,
} from "@/lib/platform/autonomy/types";

export interface AutonomyLearningDependencies {
  memory?: PersistentIntelligenceMemory;
  governance?: AutonomyGovernance;
  createId?: (prefix: string) => string;
}

/**
 * LEARN — persist loop lessons into Persistent Memory.
 */
export class AutonomyLearning {
  private readonly memory: PersistentIntelligenceMemory | null;
  private readonly governance: AutonomyGovernance;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: AutonomyLearningDependencies = {}) {
    this.memory = dependencies.memory ?? null;
    this.governance = dependencies.governance ?? new AutonomyGovernance();
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  async learn(
    request: AutonomyLoopRequest,
    diagnosis: AutonomyDiagnosisResult,
    plan: AutonomyPlan,
    decision: AutonomyDecisionResult,
    measurement: AutonomyMeasurementResult,
    reflection: AutonomyReflectionResult | null,
    governanceChecks: AutonomyGovernanceDecision[]
  ): Promise<AutonomyLearningResult> {
    const learningId = this.createId("learn");
    const lessons = [
      `Loop "${request.subject}" decided ${decision.approvalMode}`,
      diagnosis.summary,
      plan.summary,
      measurement.summary,
      ...(reflection ? [reflection.summary, ...reflection.insights] : []),
    ];

    const gate = this.governance.evaluate("write_memory", {
      confidence: decision.confidence.value,
      policies: request.policies,
    });
    governanceChecks.push(gate);

    if (!gate.allowed) {
      return {
        learningId,
        requestId: request.requestId,
        memoryId: null,
        lessons,
        persisted: false,
        summary: `Memory write blocked: ${gate.reason}`,
      };
    }

    if (!this.memory) {
      return {
        learningId,
        requestId: request.requestId,
        memoryId: null,
        lessons,
        persisted: false,
        summary: "Memory service not injected; lessons not persisted",
      };
    }

    const record = this.memory.createMemory({
      domain: "executive",
      executionId: request.requestId,
      organizationId: request.organizationId,
      schoolId: request.schoolId ?? null,
      observations: lessons,
      recommendations: plan.steps.slice(0, 5).map((s) => s.title),
      assumptions: [
        "Autonomous loop outcomes are provisional until human-validated",
      ],
      evidence: (request.evidenceRefs ?? []).map((ref) => ({ ...ref })),
      confidence: decision.confidence,
      contextSnapshot: {
        sharedContextRequestId: request.sharedContext?.requestId ?? null,
        approvalMode: decision.approvalMode,
        planId: plan.planId,
      },
      request: {
        subject: request.subject,
        description: request.description ?? null,
      },
      metadata: {
        source: "autonomous_executive_loop",
        learningId,
      },
    });

    return {
      learningId,
      requestId: request.requestId,
      memoryId: record.id,
      lessons,
      persisted: true,
      summary: `Persisted ${lessons.length} lesson(s) to memory ${record.id}`,
    };
  }
}
