/**
 * Decision Intelligence — approvals / governance workflow.
 */

import type {
  DecisionAnalysisResult,
  DecisionApproval,
  DecisionApprovalStatus,
  DecisionRequest,
} from "@/lib/platform/intelligence/decision/types";

/** Options for approval workflow. */
export interface DecisionApprovalsOptions {
  now?: () => Date;
  initialStatus?: DecisionApprovalStatus;
}

/** Allowed approval transitions. */
const APPROVAL_TRANSITIONS: Readonly<
  Record<DecisionApprovalStatus, readonly DecisionApprovalStatus[]>
> = {
  draft: ["under_review", "deferred", "rejected"],
  under_review: ["approved", "rejected", "deferred", "draft"],
  approved: ["implemented", "deferred"],
  rejected: ["draft", "deferred"],
  deferred: ["draft", "under_review"],
  implemented: [],
};

/**
 * Governance workflow: Draft → Under Review → Approved / Rejected / Deferred / Implemented.
 */
export class DecisionApprovals {
  private readonly now: () => Date;
  private readonly initialStatus: DecisionApprovalStatus;

  constructor(options: DecisionApprovalsOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.initialStatus = options.initialStatus ?? "draft";
  }

  /**
   * Create an initial approval record for a decision request.
   */
  create(request: DecisionRequest, analysis: DecisionAnalysisResult): DecisionApproval {
    const updatedAt = this.now().toISOString();
    return {
      approvalId: `${request.requestId}:approval`,
      requestId: request.requestId,
      status: this.initialStatus,
      approverRole: analysis.priority === "critical" ? "Board / ELT" : "Executive Leadership Team",
      notes: [`Opened as ${this.initialStatus} for "${request.subject}"`],
      updatedAt,
      history: [{ status: this.initialStatus, at: updatedAt, note: "Created" }],
      metadata: request.metadata,
    };
  }

  canTransition(from: DecisionApprovalStatus, to: DecisionApprovalStatus): boolean {
    if (from === to) return true;
    return APPROVAL_TRANSITIONS[from].includes(to);
  }

  /**
   * Transition an approval record to a new status.
   */
  transition(
    approval: DecisionApproval,
    to: DecisionApprovalStatus,
    note?: string
  ): DecisionApproval {
    if (!this.canTransition(approval.status, to)) {
      throw new Error(
        `Illegal Decision approval transition: ${approval.status} → ${to}`
      );
    }
    const updatedAt = this.now().toISOString();
    return {
      ...approval,
      status: to,
      updatedAt,
      notes: note ? [...approval.notes, note] : [...approval.notes],
      history: [
        ...approval.history,
        { status: to, at: updatedAt, note },
      ],
    };
  }

  listStatuses(): readonly DecisionApprovalStatus[] {
    return [
      "draft",
      "under_review",
      "approved",
      "rejected",
      "deferred",
      "implemented",
    ];
  }
}
