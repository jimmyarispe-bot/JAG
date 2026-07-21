/**
 * Execution planner — converts recommendations into structured plans (Sprint 066).
 */

import { ApprovalEngine } from "@/lib/platform/intelligence/executive-autonomous/engine/approval-engine";
import { resolvePrerequisites } from "@/lib/platform/intelligence/executive-autonomous/planning/dependencies";
import { buildRollbackPlan } from "@/lib/platform/intelligence/executive-autonomous/planning/rollback";
import {
  estimateDurationDays,
  sequenceTasks,
} from "@/lib/platform/intelligence/executive-autonomous/planning/sequencing";
import { assessReadiness } from "@/lib/platform/intelligence/executive-autonomous/planning/validation";
import {
  getWorkflowTemplate,
  resolveWorkflowKind,
} from "@/lib/platform/intelligence/executive-autonomous/workflows";
import type {
  ApprovalRole,
  DecisionIntelligenceResultLight,
  ExecutionPlan,
  ExecutivePredictiveResultLight,
  OrganizationalPolicy,
  PlanExplainability,
} from "@/lib/platform/intelligence/executive-autonomous/types";

export interface ExecutionPlannerDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
  approvalEngine?: ApprovalEngine;
}

export class ExecutionPlanner {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly approvalEngine: ApprovalEngine;

  constructor(deps: ExecutionPlannerDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
    this.approvalEngine =
      deps.approvalEngine ?? new ApprovalEngine({ createId: this.createId });
  }

  planFromOption(input: {
    option: NonNullable<
      NonNullable<DecisionIntelligenceResultLight["recommendation"]>["rankedOptions"]
    >[number];
    recommendation: DecisionIntelligenceResultLight["recommendation"];
    predictive?: ExecutivePredictiveResultLight;
    policies?: OrganizationalPolicy[];
    satisfiedPrerequisiteIds?: string[];
    approvedRoles?: ApprovalRole[];
  }): ExecutionPlan {
    const kind = resolveWorkflowKind({
      category: input.option.category,
      issueKind: input.recommendation?.issue?.kind,
      title: input.option.title,
      domains: input.recommendation?.issue?.domains,
    });
    const template = getWorkflowTemplate(kind);
    const score = input.option.scorecard;

    const { steps, violations } = this.approvalEngine.route({
      workflowKind: kind,
      policies: input.policies,
      financialImpact: (score?.financialImpact ?? 0) / 100,
      risk: score?.risk ?? 0,
      effort: score?.effort ?? 0,
      approvedRoles: input.approvedRoles,
    });

    const tasks = sequenceTasks(template.defaultTasks, this.createId);
    const prerequisites = resolvePrerequisites({
      workflowKind: kind,
      approvals: steps,
      createId: this.createId,
      satisfiedIds: input.satisfiedPrerequisiteIds,
      hasBudgetLine: input.satisfiedPrerequisiteIds?.some((id) => id.includes("budget")),
      hasRequiredInfo: input.satisfiedPrerequisiteIds?.some((id) => id.includes("info")),
      hasResources: !input.satisfiedPrerequisiteIds || input.satisfiedPrerequisiteIds.some((id) => id.includes("resource")),
      complianceClear: input.satisfiedPrerequisiteIds?.some((id) => id.includes("compliance")),
    });

    // If caller marked info/budget satisfied via ids containing those words, ok;
    // otherwise leave unmet for waiting_* states (human-in-the-loop default).

    const readiness = assessReadiness({
      prerequisites,
      approvals: steps,
      policyViolations: violations,
    });

    const predictionInfluence = this.collectPredictionInfluence(
      input.predictive,
      input.option.id
    );

    const explainability: PlanExplainability = {
      whyWorkflowSelected: `Selected "${template.label}" because recommendation category/issue signals map to ${kind}.`,
      recommendationId: input.recommendation?.id ?? input.option.id ?? null,
      recommendationSummary:
        input.option.summary ??
        input.recommendation?.executiveSummary ??
        input.option.title ??
        "Decision Intelligence recommendation",
      predictionInfluence,
      applicablePolicies: [...new Set(steps.map((s) => s.policyKey))],
      assumptions: template.assumptions.map((statement, i) => ({
        id: this.createId(`assume-${i}`),
        statement,
        critical: i === 0,
      })),
      confidenceGuidance:
        readiness.state === "ready"
          ? "Plan is prepared for human authorization — do not execute until approvals are recorded."
          : `Plan is ${readiness.state.replace(/_/g, " ")}: ${readiness.reasons[0] ?? "prerequisites incomplete"}.`,
    };

    return {
      id: this.createId(`plan-${kind}`),
      workflowKind: kind,
      objective: `${template.objectiveTemplate}: ${input.option.title}`,
      tasks,
      dependencies: prerequisites,
      estimatedDurationDays: estimateDurationDays(tasks),
      requiredApprovals: steps,
      successCriteria: [...template.successCriteria],
      rollback: buildRollbackPlan(template, input.option.title ?? "option"),
      readiness: readiness.state,
      readinessReasons: readiness.reasons,
      explainability,
      optionId: input.option.id ?? null,
      optionTitle: input.option.title ?? "Option",
      generatedAt: this.now().toISOString(),
      humanAuthorizationRequired: true,
      autoExecute: false,
    };
  }

  private collectPredictionInfluence(
    predictive: ExecutivePredictiveResultLight | undefined,
    optionId?: string
  ): string[] {
    const out: string[] = [];
    if (!predictive) {
      out.push("No predictive context attached — plan relies on decision recommendation alone.");
      return out;
    }

    const impact = predictive.decisionImpacts?.find((i) => i.optionId === optionId);
    if (impact?.narrative) {
      out.push(impact.narrative);
    } else if (impact) {
      out.push(
        `Predicted org/financial/ops impact: ${(impact.organizationalImpact ?? 0).toFixed(2)} / ${(impact.financialImpact ?? 0).toFixed(2)} / ${(impact.operationalImpact ?? 0).toFixed(2)} over ${impact.implementationHorizon ?? "horizon"}`
      );
    }

    for (const signal of predictive.emergingSignals?.slice(0, 2) ?? []) {
      out.push(`Emerging signal: ${signal.title ?? signal.narrative ?? signal.subject}`);
    }

    const expected = predictive.scenarios?.find((s) => s.kind === "expected");
    if (expected?.narrative) out.push(`Scenario context: ${expected.narrative}`);

    if (out.length === 0) {
      out.push("Predictive health and forecasts available but no option-specific impact matched.");
    }
    return out;
  }
}
