/**
 * Goal Execution Engine — workflow state transitions (Sprint 011).
 */

import {
  GOAL_EXECUTION_WORKFLOW_STATUSES,
  type GoalExecutionWorkflowStatus,
} from "@/lib/platform/execution/types";

/** Allowed transitions: from → set of valid next states. */
const TRANSITIONS: Readonly<
  Record<GoalExecutionWorkflowStatus, readonly GoalExecutionWorkflowStatus[]>
> = {
  draft: ["approved", "planning", "cancelled"],
  approved: ["planning", "active", "cancelled"],
  planning: ["active", "blocked", "cancelled"],
  active: ["on_track", "at_risk", "behind", "blocked", "completed", "cancelled"],
  on_track: ["active", "at_risk", "behind", "blocked", "completed", "cancelled"],
  at_risk: ["active", "on_track", "behind", "blocked", "completed", "cancelled"],
  behind: ["active", "on_track", "at_risk", "blocked", "completed", "cancelled"],
  blocked: ["active", "planning", "at_risk", "behind", "cancelled"],
  completed: [],
  cancelled: [],
};

export interface GoalExecutionWorkflowDependencies {
  /** Optional — reserved for future policy injection. */
  allowForce?: boolean;
}

/**
 * Validates and applies workflow state transitions.
 */
export class GoalExecutionWorkflow {
  private readonly allowForce: boolean;

  constructor(dependencies: GoalExecutionWorkflowDependencies = {}) {
    this.allowForce = dependencies.allowForce ?? false;
  }

  listStatuses(): readonly GoalExecutionWorkflowStatus[] {
    return GOAL_EXECUTION_WORKFLOW_STATUSES;
  }

  canTransition(
    from: GoalExecutionWorkflowStatus,
    to: GoalExecutionWorkflowStatus
  ): boolean {
    if (from === to) {
      return true;
    }
    return TRANSITIONS[from].includes(to);
  }

  /**
   * Transition to a new status or throw when illegal (unless force allowed).
   */
  transition(
    from: GoalExecutionWorkflowStatus,
    to: GoalExecutionWorkflowStatus,
    options: { force?: boolean } = {}
  ): GoalExecutionWorkflowStatus {
    if (from === to) {
      return to;
    }
    if (this.canTransition(from, to)) {
      return to;
    }
    if (options.force || this.allowForce) {
      return to;
    }
    throw new Error(
      `Illegal Goal Execution workflow transition: ${from} → ${to}`
    );
  }

  /**
   * Suggest a status from completion and risk signals.
   */
  suggestStatus(input: {
    completionPercent: number;
    riskScore: number;
    blocked?: boolean;
    cancelled?: boolean;
  }): GoalExecutionWorkflowStatus {
    if (input.cancelled) {
      return "cancelled";
    }
    if (input.completionPercent >= 100) {
      return "completed";
    }
    if (input.blocked) {
      return "blocked";
    }
    if (input.riskScore >= 0.75) {
      return "at_risk";
    }
    if (input.riskScore >= 0.55 || input.completionPercent < 25) {
      return "behind";
    }
    if (input.completionPercent >= 40) {
      return "on_track";
    }
    if (input.completionPercent > 0) {
      return "active";
    }
    return "planning";
  }
}
