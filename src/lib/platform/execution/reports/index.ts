/**
 * Goal Execution Engine — reports (Sprint 011).
 */

import type { GoalExecutionDashboard } from "@/lib/platform/execution/dashboard";
import type { GoalExecutionImpact } from "@/lib/platform/execution/impact";
import type { GoalExecutionScorecardService } from "@/lib/platform/execution/scorecard";
import type {
  ExecutionImpactAssessment,
  ExecutionReport,
  ExecutionScorecard,
} from "@/lib/platform/execution/types";

export interface GoalExecutionReportsDependencies {
  dashboard: GoalExecutionDashboard;
  scorecards: GoalExecutionScorecardService;
  impact: GoalExecutionImpact;
  now?: () => Date;
  createId?: () => string;
}

/**
 * Generates executive execution reports.
 */
export class GoalExecutionReports {
  private readonly dashboard: GoalExecutionDashboard;
  private readonly scorecards: GoalExecutionScorecardService;
  private readonly impact: GoalExecutionImpact;
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(dependencies: GoalExecutionReportsDependencies) {
    this.dashboard = dependencies.dashboard;
    this.scorecards = dependencies.scorecards;
    this.impact = dependencies.impact;
    this.now = dependencies.now ?? (() => new Date());
    this.createId =
      dependencies.createId ??
      (() => `exec-report-${this.now().toISOString()}`);
  }

  async generate(options: {
    organizationId?: string | null;
    schoolId?: string | null;
    title?: string;
  } = {}): Promise<ExecutionReport> {
    const model = await this.dashboard.build({
      organizationId: options.organizationId,
      schoolId: options.schoolId,
    });

    const scorecards: ExecutionScorecard[] = [];
    const impact: ExecutionImpactAssessment[] = [];
    for (const goal of model.goals) {
      scorecards.push(await this.scorecards.generate(goal.id));
      impact.push(await this.impact.assess(goal.id));
    }

    const goalSummaries = model.goals.map((goal) => {
      const card = scorecards.find((s) => s.goalId === goal.id);
      return `${goal.title}: ${card?.progressPercent ?? 0}% (${card?.healthLabel ?? "unknown"})`;
    });

    const riskHighlights = [
      ...scorecards
        .filter((s) => s.riskScore >= 0.55)
        .map((s) => `Goal ${s.goalId} risk ${s.riskScore}`),
      ...model.notifications
        .filter((n) => n.kind === "risk" || n.kind === "overdue")
        .map((n) => n.title),
    ].slice(0, 10);

    const progressHighlights = scorecards
      .map(
        (s) =>
          `${s.goalId}: progress ${s.progressPercent}%, timeline ${s.timelineAdherencePercent}%, budget ${s.budgetUtilizationPercent}%`
      )
      .slice(0, 10);

    const recommendedActions = model.adjustments
      .flatMap((a) => [...a.recommendedActions])
      .slice(0, 8);

    if (recommendedActions.length === 0) {
      recommendedActions.push("Continue monitoring active goals on the weekly cadence");
    }

    const executiveSummary = `Execution report for ${model.goals.length} goal(s): ${model.summary.activeGoals} active, ${model.summary.atRiskItems} at-risk signals, ${model.summary.overdueTasks} overdue task(s), average completion ${model.summary.averageCompletion}%.`;

    const narrative = [
      `Executive Summary: ${executiveSummary}`,
      `Goals: ${goalSummaries.join("; ") || "None"}`,
      `Risks: ${riskHighlights.join("; ") || "None"}`,
      `Progress: ${progressHighlights.join("; ") || "None"}`,
      `Recommended Actions: ${recommendedActions.join("; ")}`,
    ].join("\n\n");

    return {
      reportId: this.createId(),
      title: options.title ?? "Executive Goal Execution Report",
      generatedAt: this.now().toISOString(),
      organizationId: options.organizationId ?? null,
      schoolId: options.schoolId ?? null,
      executiveSummary,
      goalSummaries,
      riskHighlights,
      progressHighlights,
      recommendedActions,
      scorecards,
      impact,
      narrative,
      metadata: {
        dashboardId: model.dashboardId,
      },
    };
  }
}
