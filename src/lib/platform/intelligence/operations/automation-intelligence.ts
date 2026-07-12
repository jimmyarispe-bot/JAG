/**
 * Operations Intelligence — automation opportunity discovery (Sprint 038).
 */

import type { AutomationOpportunityEngine as AutomationOpportunityEngineContract } from "@/lib/platform/intelligence/operations/contracts";
import {
  buildLenses,
  clamp,
  defaultCreateId,
  priorityFromScore,
} from "@/lib/platform/intelligence/operations/models";
import type {
  AutomationOpportunityKind,
  AutomationOpportunityRecord,
  AutomationOpportunitySuite,
  OperationsBaseline,
  ProcessMonitoringSuite,
  WorkflowHealthResult,
} from "@/lib/platform/intelligence/operations/types";
import { AUTOMATION_OPPORTUNITY_KINDS } from "@/lib/platform/intelligence/operations/types";

const KIND_LABELS: Record<AutomationOpportunityKind, string> = {
  task_automation: "Task Automation",
  workflow_orchestration: "Workflow Orchestration",
  decision_support: "Decision Support",
  intake_triage: "Intake Triage",
  reporting: "Reporting Automation",
  communications: "Communications Automation",
};

export class AutomationOpportunityEngine
  implements AutomationOpportunityEngineContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  discover(input: {
    baseline: OperationsBaseline;
    workflowHealth: WorkflowHealthResult;
    processMonitoring: ProcessMonitoringSuite;
    now: Date;
  }): AutomationOpportunitySuite {
    void input.now;
    const b = input.baseline;
    const bottleneck = input.processMonitoring.hottestBottleneck;
    const handoff = input.workflowHealth.dimensions.find(
      (d) => d.dimension === "handoff_friction"
    );
    const backlog = input.workflowHealth.dimensions.find(
      (d) => d.dimension === "backlog"
    );

    const opportunities: AutomationOpportunityRecord[] =
      AUTOMATION_OPPORTUNITY_KINDS.map((kind) => {
        const score = scoreForKind(kind, b, bottleneck, handoff?.score ?? 60, backlog?.score ?? 60);
        const effort = effortForKind(kind, b);
        const expectedHoursSaved = Math.round(
          40 + score * 0.8 + (100 - b.automationReadiness) * 0.4
        );
        return {
          id: this.createId(`ops-auto-${kind}`),
          kind,
          label: KIND_LABELS[kind],
          score,
          priority: priorityFromScore(100 - score),
          effort,
          expectedHoursSaved,
          lenses: buildLenses({
            workflowHealth: `${KIND_LABELS[kind]} lifts workflow consistency.`,
            processBottlenecks: `Targets ${bottleneck} and related process friction.`,
            staffingAdequacy: "Frees staff capacity from repetitive work.",
            automationPotential: `Readiness ${Math.round(b.automationReadiness)}; effort ${effort}.`,
            capacityOutlook: `~${expectedHoursSaved}h/period capacity release.`,
            resourceUtilization: "Improves utilization by removing manual drag.",
          }),
          narrative: `${KIND_LABELS[kind]} scored ${Math.round(score)} with ${effort} effort (~${expectedHoursSaved}h saved).`,
        };
      }).sort((a, c) => c.score - a.score);

    return {
      opportunities,
      readinessScore: clamp(b.automationReadiness),
      narrative: `Automation readiness ${Math.round(b.automationReadiness)}; ${opportunities.length} opportunities across all kinds.`,
    };
  }
}

function scoreForKind(
  kind: AutomationOpportunityKind,
  b: OperationsBaseline,
  bottleneck: string,
  handoffScore: number,
  backlogScore: number
): number {
  const readinessBoost = b.automationReadiness * 0.35;
  switch (kind) {
    case "task_automation":
      return clamp(
        readinessBoost + (100 - handoffScore) * 0.35 + b.backlogPressure * 40
      );
    case "workflow_orchestration":
      return clamp(
        readinessBoost +
          b.operationalComplexity * 40 +
          (100 - b.workflowHealthScore) * 0.25
      );
    case "decision_support":
      return clamp(
        readinessBoost +
          (100 - b.processMaturity) * 0.3 +
          b.slaRisk * 35
      );
    case "intake_triage":
      return clamp(
        readinessBoost +
          (bottleneck === "admissions" || bottleneck === "enrollment"
            ? 35
            : 15) +
          b.slaRisk * 30
      );
    case "reporting":
      return clamp(
        readinessBoost +
          (100 - backlogScore) * 0.25 +
          b.operationalComplexity * 25
      );
    case "communications":
      return clamp(
        readinessBoost +
          (100 - b.staffingAdequacy) * 0.2 +
          b.backlogPressure * 30 +
          15
      );
  }
}

function effortForKind(
  kind: AutomationOpportunityKind,
  b: OperationsBaseline
): "low" | "medium" | "high" {
  if (kind === "reporting" || kind === "communications") return "low";
  if (kind === "task_automation" || kind === "intake_triage") {
    return b.operationalComplexity > 0.55 ? "medium" : "low";
  }
  return b.automationReadiness < 55 ? "high" : "medium";
}
