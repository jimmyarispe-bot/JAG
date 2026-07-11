/**
 * Goal Execution Engine — adjustments (Sprint 011).
 *
 * Accepts feedback from users, KPIs, and Intelligence domains;
 * generates recommended course corrections.
 */

import type { GoalExecutionRepository } from "@/lib/platform/execution/repository";
import {
  DEFAULT_EXECUTION_CONFIDENCE,
  type ExecutionAdjustment,
  type ExecutionFeedbackInput,
  type GoalExecutionPriority,
} from "@/lib/platform/execution/types";

export interface GoalExecutionAdjustmentsDependencies {
  repository: GoalExecutionRepository;
  now?: () => Date;
  createId?: () => string;
}

function defaultId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `exec-adj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Course-correction engine driven by feedback signals.
 */
export class GoalExecutionAdjustments {
  private readonly repository: GoalExecutionRepository;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: GoalExecutionAdjustmentsDependencies) {
    this.repository = dependencies.repository;
    this.now = dependencies.now ?? (() => new Date());
    this.createId = dependencies.createId ?? defaultId;
  }

  /**
   * Accept feedback and persist a recommended adjustment.
   */
  async acceptFeedback(input: ExecutionFeedbackInput): Promise<ExecutionAdjustment> {
    const urgency = inferUrgency(input);
    const actions = recommendActions(input);
    const progress = await this.repository.listProgress({
      subjectId: input.subjectId,
    });
    const latest = progress[0];

    const adjustment: ExecutionAdjustment = {
      id: this.createId(),
      subjectKind: input.subjectKind,
      subjectId: input.subjectId,
      source: input.source,
      summary: buildSummary(input, latest?.riskScore),
      recommendedActions: Object.freeze(actions),
      urgency,
      confidence: {
        ...DEFAULT_EXECUTION_CONFIDENCE,
        value:
          input.source === "strategic_intelligence" ||
          input.source === "executive_intelligence"
            ? 0.75
            : input.source === "kpi"
              ? 0.7
              : 0.55,
        level:
          input.source === "kpi" ||
          input.source === "strategic_intelligence" ||
          input.source === "executive_intelligence"
            ? "high"
            : "medium",
        factors: [
          {
            key: "feedback_source",
            label: "Feedback Source",
            contribution: 0.4,
            reason: input.source,
          },
        ],
      },
      createdAt: this.now().toISOString(),
      metadata: {
        ...(input.metadata ?? {}),
        kpiKey: input.kpiKey ?? null,
        kpiValue: input.kpiValue ?? null,
        priorRiskScore: latest?.riskScore ?? null,
      },
    };

    return this.repository.saveAdjustment(adjustment);
  }

  async list(filter?: { subjectId?: string }): Promise<ExecutionAdjustment[]> {
    return this.repository.listAdjustments(filter);
  }
}

function inferUrgency(input: ExecutionFeedbackInput): GoalExecutionPriority {
  const text = input.message.toLowerCase();
  if (
    text.includes("critical") ||
    text.includes("blocked") ||
    text.includes("overdue") ||
    (typeof input.kpiValue === "number" && input.kpiValue < 0)
  ) {
    return "critical";
  }
  if (input.source === "strategic_intelligence" || input.source === "kpi") {
    return "high";
  }
  if (text.includes("watch") || text.includes("minor")) {
    return "low";
  }
  return "medium";
}

function recommendActions(input: ExecutionFeedbackInput): string[] {
  const actions: string[] = [];
  const text = input.message.toLowerCase();

  if (text.includes("budget") || input.kpiKey?.includes("budget")) {
    actions.push("Re-baseline budget and freeze non-critical spend");
  }
  if (text.includes("staff") || text.includes("capacity")) {
    actions.push("Reallocate capacity to the critical path");
  }
  if (text.includes("timeline") || text.includes("behind") || text.includes("delay")) {
    actions.push("Compress timeline by deferring low-priority scope");
  }
  if (text.includes("risk") || text.includes("blocked")) {
    actions.push("Escalate blockers to the executive sponsor");
  }
  if (input.source === "executive_intelligence") {
    actions.push("Incorporate executive briefing recommendations into the plan");
  }
  if (input.source === "strategic_intelligence") {
    actions.push("Align initiative scope with latest strategic opportunities");
  }
  if (actions.length === 0) {
    actions.push("Review progress with the primary owner within 7 days");
    actions.push("Update task completion evidence and risk notes");
  }
  return actions;
}

function buildSummary(
  input: ExecutionFeedbackInput,
  priorRiskScore: number | undefined
): string {
  const riskClause =
    priorRiskScore !== undefined
      ? ` Prior risk score ${priorRiskScore}.`
      : "";
  return `Feedback from ${input.source}: ${input.message}.${riskClause}`;
}
