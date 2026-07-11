/**
 * Enterprise Governance — metrics.
 */

import type {
  GovernanceAccountabilityItem,
  GovernanceApprovalRequest,
  GovernanceAuditEvent,
  GovernanceComplianceFinding,
  GovernanceMetricSample,
} from "@/lib/platform/governance/types";

export interface GovernanceMetricsDependencies {
  now?: () => Date;
}

export class GovernanceMetrics {
  private readonly now: () => Date;

  constructor(dependencies: GovernanceMetricsDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
  }

  collect(input: {
    approvals: readonly GovernanceApprovalRequest[];
    accountability: readonly GovernanceAccountabilityItem[];
    compliance: readonly GovernanceComplianceFinding[];
    auditEvents: readonly GovernanceAuditEvent[];
    boardGoalCount: number;
    motionCount: number;
  }): GovernanceMetricSample[] {
    const observedAt = this.now().toISOString();
    const pendingApprovals = input.approvals.filter((a) => a.status === "pending").length;
    const openAcct = input.accountability.filter(
      (a) => a.status === "open" || a.status === "in_progress" || a.status === "overdue"
    ).length;
    const openFindings = input.compliance.filter(
      (c) => c.status !== "compliant" && c.status !== "waived"
    ).length;
    const recommendationAudits = input.auditEvents.filter(
      (e) => e.kind === "recommendation"
    ).length;
    const avgCompletion =
      input.accountability.length === 0
        ? 0
        : input.accountability.reduce((s, a) => s + a.completionPercent, 0) /
          input.accountability.length;

    return [
      {
        key: "pending_approvals",
        label: "Pending approvals",
        value: pendingApprovals,
        observedAt,
      },
      {
        key: "open_accountability",
        label: "Open accountability items",
        value: openAcct,
        observedAt,
      },
      {
        key: "open_compliance_findings",
        label: "Open compliance findings",
        value: openFindings,
        observedAt,
      },
      {
        key: "recommendation_audit_events",
        label: "Recommendation audit events",
        value: recommendationAudits,
        observedAt,
      },
      {
        key: "board_goals",
        label: "Board goals tracked",
        value: input.boardGoalCount,
        observedAt,
      },
      {
        key: "motions",
        label: "Motions",
        value: input.motionCount,
        observedAt,
      },
      {
        key: "avg_accountability_completion",
        label: "Avg accountability completion",
        value: Math.round(avgCompletion),
        unit: "%",
        observedAt,
      },
      {
        key: "audit_event_count",
        label: "Audit events",
        value: input.auditEvents.length,
        observedAt,
      },
    ];
  }
}
