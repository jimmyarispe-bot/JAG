/**
 * Autonomous Intelligence orchestrator (Sprint 066).
 * Prepares execution plans — never auto-executes organizational actions.
 */

import { ApprovalEngine } from "@/lib/platform/intelligence/executive-autonomous/engine/approval-engine";
import { ExecutionPlanner } from "@/lib/platform/intelligence/executive-autonomous/engine/execution-planner";
import { OrchestrationEngine } from "@/lib/platform/intelligence/executive-autonomous/engine/orchestration-engine";
import type {
  AutonomousRequest,
  AutonomousResult,
  ExecutionPlan,
  PlanExplainability,
} from "@/lib/platform/intelligence/executive-autonomous/types";
import { EXECUTIVE_AUTONOMOUS_VERSION } from "@/lib/platform/intelligence/executive-autonomous/types";

export interface AutonomousEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
  planner?: ExecutionPlanner;
  orchestration?: OrchestrationEngine;
  approvalEngine?: ApprovalEngine;
}

export class AutonomousEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly planner: ExecutionPlanner;
  private readonly orchestration: OrchestrationEngine;

  constructor(deps: AutonomousEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
    const shared = { createId: this.createId, now: this.now };
    const approvalEngine = deps.approvalEngine ?? new ApprovalEngine(shared);
    this.planner =
      deps.planner ?? new ExecutionPlanner({ ...shared, approvalEngine });
    this.orchestration = deps.orchestration ?? new OrchestrationEngine(shared);
  }

  prepare(request: AutonomousRequest): AutonomousResult {
    const options = request.decisionResult?.recommendation?.rankedOptions ?? [];
    const plans: ExecutionPlan[] = [];

    const targets =
      options.length > 0
        ? options
        : [
            {
              id: "fallback-ops",
              title: "Stabilize operations",
              summary:
                request.decisionResult?.recommendation?.executiveSummary ??
                "Prepare an operational improvement plan from available context",
              category: "operations",
              confidence: 0.5,
              estimatedEffort: "medium",
              scorecard: { overall: 50, expectedImpact: 50, financialImpact: 40, operationalImpact: 55, risk: 40, effort: 40 },
            },
          ];

    for (const option of targets) {
      plans.push(
        this.planner.planFromOption({
          option,
          recommendation: request.decisionResult?.recommendation,
          predictive: request.predictiveResult,
          policies: request.policies,
          satisfiedPrerequisiteIds: request.satisfiedPrerequisiteIds,
          approvedRoles: request.approvedRoles,
        })
      );
    }

    const preparations = plans.map((p) => this.orchestration.prepare(p));
    const approvalQueue = plans.flatMap((p) =>
      p.requiredApprovals.filter((a) => a.status === "pending")
    );

    const primary = plans[0];
    const explainability: PlanExplainability = primary?.explainability ?? {
      whyWorkflowSelected: "No plan generated",
      recommendationId: null,
      recommendationSummary: "Empty decision context",
      predictionInfluence: [],
      applicablePolicies: [],
      assumptions: [],
      confidenceGuidance: "Provide a Decision Intelligence recommendation to prepare plans.",
    };

    const contributing = new Set<string>([
      "executive-autonomous",
      "executive-predictive",
      "decision-intelligence",
    ]);
    for (const d of request.decisionResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.predictiveResult?.contributingDomains ?? []) contributing.add(d);

    return {
      requestId: request.requestId,
      version: EXECUTIVE_AUTONOMOUS_VERSION,
      scope: request.scope,
      generatedAt: this.now().toISOString(),
      plans,
      preparations,
      approvalQueue,
      explainability,
      contributingDomains: [...contributing],
      metadata: {
        ...(request.metadata ?? {}),
        planCount: plans.length,
        periodLabel: request.periodLabel,
        autoExecute: false,
        humanInTheLoop: true,
      },
      autoExecute: false,
      humanInTheLoop: true,
    };
  }
}
