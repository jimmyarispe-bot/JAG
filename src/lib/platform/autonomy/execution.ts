/**
 * Autonomous Executive Operating Loop — execution.
 *
 * Creates Goal Execution Engine packages when approved.
 */

import type { GoalExecutionEngine } from "@/lib/platform/execution";
import { AutonomyGovernance } from "@/lib/platform/autonomy/governance";
import type {
  AutonomyDecisionResult,
  AutonomyExecutionPackage,
  AutonomyGovernanceDecision,
  AutonomyLoopRequest,
  AutonomyPlan,
} from "@/lib/platform/autonomy/types";

export interface AutonomyExecutionDependencies {
  goalEngine?: GoalExecutionEngine;
  governance?: AutonomyGovernance;
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * EXECUTE — create Goal Execution packages when governance allows.
 */
export class AutonomyExecution {
  private readonly goalEngine: GoalExecutionEngine | null;
  private readonly governance: AutonomyGovernance;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: AutonomyExecutionDependencies = {}) {
    this.goalEngine = dependencies.goalEngine ?? null;
    this.governance = dependencies.governance ?? new AutonomyGovernance();
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  async execute(
    request: AutonomyLoopRequest,
    plan: AutonomyPlan,
    decision: AutonomyDecisionResult,
    governanceChecks: AutonomyGovernanceDecision[]
  ): Promise<AutonomyExecutionPackage> {
    const packageId = this.createId("exec-pkg");

    if (!decision.approvedForExecution) {
      return {
        packageId,
        requestId: request.requestId,
        status: "held",
        goal: null,
        progress: null,
        scorecard: null,
        holdReason: `Awaiting ${decision.approvalMode}`,
        summary: `Execution held for ${decision.approvalMode}`,
      };
    }

    const gate = this.governance.evaluate("execute_automatic", {
      confidence: decision.confidence.value,
      policies: request.policies,
    });
    governanceChecks.push(gate);

    if (!gate.allowed) {
      return {
        packageId,
        requestId: request.requestId,
        status: "held",
        goal: null,
        progress: null,
        scorecard: null,
        holdReason: gate.reason,
        summary: `Execution blocked by governance: ${gate.reason}`,
      };
    }

    if (!this.goalEngine) {
      return {
        packageId,
        requestId: request.requestId,
        status: "skipped",
        goal: null,
        progress: null,
        scorecard: null,
        holdReason: "Goal Execution Engine not injected",
        summary: "Execution skipped — no Goal Execution Engine",
      };
    }

    const target = new Date(this.now());
    target.setUTCDate(target.getUTCDate() + 90);

    const goal = await this.goalEngine.goals.create({
      id: `${request.requestId}:autonomy-goal`,
      title: plan.title,
      description: plan.summary,
      priority: decision.confidence.value >= 0.75 ? "high" : "medium",
      status: "active",
      targetDate: target.toISOString(),
      expectedValue: plan.expectedValue,
      confidence: plan.confidence,
      organizationId: request.organizationId,
      schoolId: request.schoolId ?? null,
      metadata: {
        source: "autonomous_executive_loop",
        planId: plan.planId,
        decisionId: decision.decisionId,
      },
    });

    const objective = await this.goalEngine.objectives.create({
      id: `${goal.id}:objective:1`,
      goalId: goal.id,
      title: "Autonomy plan realization",
      description: plan.expectedValue,
      baseline: 0,
      target: 100,
      currentValue: 0,
      measurementMethod: "Execution completion percent",
      frequency: "weekly",
      successCriteria: "Complete planned autonomy steps",
      status: "active",
    });

    const initiative = await this.goalEngine.initiatives.create({
      id: `${goal.id}:initiative:1`,
      goalId: goal.id,
      objectiveIds: [objective.id],
      title: `Initiative: ${plan.title}`,
      description: plan.summary,
      status: "active",
      budgetAmount: 0,
      budgetCurrency: "USD",
      budgetSpent: 0,
      resources: plan.steps.map((s) => s.ownerRole),
      startDate: this.now().toISOString(),
      endDate: target.toISOString(),
    });

    for (const step of plan.steps) {
      await this.goalEngine.tasks.create({
        goalId: goal.id,
        initiativeId: initiative.id,
        title: step.title,
        description: step.instruction,
        owner: step.ownerRole,
        dueDate: target.toISOString(),
        priority: step.order === 1 ? "high" : "medium",
        status: "draft",
        metadata: { stepId: step.stepId, autonomy: true },
      });
    }

    const progress = await this.goalEngine.progress.calculateGoal(goal.id);
    const scorecard = await this.goalEngine.scorecards.generate(goal.id);

    return {
      packageId,
      requestId: request.requestId,
      status: "created",
      goal,
      progress,
      scorecard,
      holdReason: null,
      summary: `Created execution goal ${goal.id} with ${plan.steps.length} tasks`,
    };
  }
}
