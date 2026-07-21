/**
 * Orchestration — autonomous preparation packages (Sprint 066).
 * Prepares checklists / owners / timelines — never submits or executes.
 */

import type {
  AutonomousPreparation,
  ExecutionPlan,
} from "@/lib/platform/intelligence/executive-autonomous/types";

export interface OrchestrationEngineDeps {
  createId?: (prefix: string) => string;
}

export class OrchestrationEngine {
  private readonly createId: (prefix: string) => string;

  constructor(deps: OrchestrationEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
  }

  prepare(plan: ExecutionPlan): AutonomousPreparation {
    const checklist = plan.tasks.flatMap((t) => t.checklist);
    const requiredDocuments = this.documentsFor(plan);
    const responsibleOwners = [
      ...new Set(plan.tasks.map((t) => t.ownerRole.replace(/_/g, " "))),
    ];
    let day = 0;
    const timeline = plan.tasks.map((t) => {
      day += t.estimatedDays;
      return {
        milestone: t.milestone ?? t.title,
        dayOffset: day,
      };
    });

    return {
      id: this.createId("prep"),
      planId: plan.id,
      checklist,
      requiredDocuments,
      responsibleOwners,
      timeline,
      milestones: timeline.map((t) => t.milestone),
      dependencies: plan.dependencies.map((d) => d.label),
      approvalChain: plan.requiredApprovals.map((a) => a.role),
      authorizationNote:
        "No organizational action (submission, hire, posting, or spend) occurs without recorded human authorization.",
    };
  }

  private documentsFor(plan: ExecutionPlan): string[] {
    switch (plan.workflowKind) {
      case "grants":
        return [
          "Grant guidelines extract",
          "Narrative draft",
          "Budget worksheet",
          "Letters of support",
          "Eligibility checklist",
        ];
      case "staffing":
        return ["Role profile", "Budget authorization", "Interview rubric", "Offer letter draft"];
      case "finance":
        return ["Variance analysis", "Revised budget schedule", "Approval packet"];
      case "enrollment":
        return ["Segment list", "Message templates", "Consent / compliance review"];
      case "compliance":
        return ["Finding record", "Evidence pack", "Retest results"];
      default:
        return ["Process map", "KPI baseline", "Pilot charter"];
    }
  }
}
