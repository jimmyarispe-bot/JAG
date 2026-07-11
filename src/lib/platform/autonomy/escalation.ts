/**
 * Autonomous Executive Operating Loop — escalation.
 *
 * Notifies when human approval is required.
 */

import type {
  AutonomyDecisionResult,
  AutonomyEscalationNotice,
  AutonomyEscalationResult,
  AutonomyLoopRequest,
} from "@/lib/platform/autonomy/types";

export interface AutonomyEscalationDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * ESCALATE — produce human-approval notices when required.
 */
export class AutonomyEscalation {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: AutonomyEscalationDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  escalate(
    request: AutonomyLoopRequest,
    decision: AutonomyDecisionResult
  ): AutonomyEscalationResult {
    const notices: AutonomyEscalationNotice[] = [];

    if (!decision.requiresHuman) {
      return {
        requestId: request.requestId,
        notices,
        requiresHuman: false,
        summary: "No escalation — automatic execution approved",
      };
    }

    const audience =
      decision.approvalMode === "board_approval"
        ? "board"
        : decision.approvalMode === "ceo_approval"
          ? "ceo"
          : "operator";

    const severity =
      decision.approvalMode === "board_approval"
        ? "critical"
        : decision.approvalMode === "ceo_approval"
          ? "high"
          : "medium";

    notices.push({
      escalationId: this.createId("esc"),
      requestId: request.requestId,
      severity,
      audience,
      title: `Approval required: ${request.subject}`,
      message: [
        `Autonomous loop requires ${decision.approvalMode}.`,
        ...decision.rationale,
      ].join(" "),
      approvalMode: decision.approvalMode,
      createdAt: this.now().toISOString(),
      acknowledged: false,
      metadata: { decisionId: decision.decisionId },
    });

    return {
      requestId: request.requestId,
      notices,
      requiresHuman: true,
      summary: `Escalated to ${audience} (${decision.approvalMode})`,
    };
  }
}
