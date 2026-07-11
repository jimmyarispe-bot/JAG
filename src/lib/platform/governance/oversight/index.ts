/**
 * Enterprise Governance — oversight.
 */

import type {
  GovernanceAccountabilityItem,
  GovernanceApprovalRequest,
  GovernanceComplianceFinding,
  GovernanceCycleRequest,
  GovernanceOversightReview,
} from "@/lib/platform/governance/types";

export interface GovernanceOversightDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceOversight {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernanceOversightReview>();

  constructor(dependencies: GovernanceOversightDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  reviewCycle(
    request: GovernanceCycleRequest,
    context: {
      approvals: readonly GovernanceApprovalRequest[];
      accountability: readonly GovernanceAccountabilityItem[];
      compliance: readonly GovernanceComplianceFinding[];
    }
  ): GovernanceOversightReview {
    const findings: string[] = [];
    const recommendations: string[] = [];

    const pending = context.approvals.filter((a) => a.status === "pending");
    if (pending.length > 0) {
      findings.push(`${pending.length} approval(s) awaiting decision`);
      recommendations.push("Complete pending approval chain before execution");
    }

    const overdue = context.accountability.filter((a) => a.status === "overdue");
    if (overdue.length > 0) {
      findings.push(`${overdue.length} overdue accountability item(s)`);
      recommendations.push("Reassign or escalate overdue owners");
    }

    const nonCompliant = context.compliance.filter(
      (c) => c.status === "non_compliant" || c.status === "at_risk"
    );
    if (nonCompliant.length > 0) {
      findings.push(`${nonCompliant.length} compliance exception(s)`);
      recommendations.push("Document remediation and attach evidence");
    }

    if (request.autonomy?.escalation.requiresHuman) {
      findings.push("Autonomous loop escalated for human approval");
      recommendations.push(
        `Route to ${request.autonomy.escalation.notices[0]?.audience ?? "operator"}`
      );
    }

    if (findings.length === 0) {
      findings.push("No material oversight exceptions this cycle");
      recommendations.push("Continue standard monitoring cadence");
    }

    const audience =
      request.autonomy?.decision.approvalMode === "board_approval"
        ? "board"
        : request.autonomy?.decision.approvalMode === "ceo_approval"
          ? "ceo"
          : "executive_team";

    return this.record({
      title: `Oversight: ${request.subject}`,
      reviewer: request.actor ?? "governance-oversight",
      audience,
      findings,
      recommendations,
    });
  }

  record(input: {
    title: string;
    reviewer: string;
    audience: GovernanceOversightReview["audience"];
    findings: readonly string[];
    recommendations: readonly string[];
  }): GovernanceOversightReview {
    const review: GovernanceOversightReview = {
      reviewId: this.createId("oversight"),
      title: input.title,
      reviewer: input.reviewer,
      audience: input.audience,
      findings: [...input.findings],
      recommendations: [...input.recommendations],
      reviewedAt: this.now().toISOString(),
    };
    this.store.set(review.reviewId, review);
    return review;
  }

  list(): readonly GovernanceOversightReview[] {
    return Array.from(this.store.values());
  }
}
