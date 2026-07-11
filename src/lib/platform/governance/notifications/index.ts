/**
 * Enterprise Governance — notifications.
 */

import type {
  GovernanceApprovalRequest,
  GovernanceComplianceFinding,
  GovernanceCycleRequest,
  GovernanceNotification,
  GovernanceOversightReview,
} from "@/lib/platform/governance/types";

export interface GovernanceNotificationsDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceNotifications {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly store = new Map<string, GovernanceNotification>();

  constructor(dependencies: GovernanceNotificationsDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  notifyCycle(
    request: GovernanceCycleRequest,
    context: {
      approvals: readonly GovernanceApprovalRequest[];
      compliance: readonly GovernanceComplianceFinding[];
      oversight: readonly GovernanceOversightReview[];
    }
  ): GovernanceNotification[] {
    const notices: GovernanceNotification[] = [];

    for (const approval of context.approvals.filter((a) => a.status === "pending")) {
      const audience =
        approval.chain.find((s) => s.status === "pending")?.role === "board"
          ? "board"
          : approval.chain.find((s) => s.status === "pending")?.role === "ceo"
            ? "ceo"
            : "executive_team";
      notices.push(
        this.send({
          audience,
          title: `Approval needed: ${approval.subject}`,
          message: approval.description,
          severity: approval.domain === "financial" ? "high" : "medium",
          relatedIds: [approval.approvalId],
        })
      );
    }

    for (const finding of context.compliance.filter(
      (c) => c.status === "non_compliant" || c.status === "at_risk"
    )) {
      notices.push(
        this.send({
          audience: finding.severity === "critical" ? "board" : "ceo",
          title: finding.title,
          message: finding.remediation,
          severity: finding.severity,
          relatedIds: [finding.findingId],
        })
      );
    }

    for (const review of context.oversight) {
      notices.push(
        this.send({
          audience: review.audience,
          title: review.title,
          message: review.recommendations.join(" · "),
          severity: review.findings.length > 2 ? "high" : "medium",
          relatedIds: [review.reviewId],
        })
      );
    }

    for (const esc of request.autonomy?.escalation.notices ?? []) {
      notices.push(
        this.send({
          audience:
            esc.audience === "board"
              ? "board"
              : esc.audience === "ceo"
                ? "ceo"
                : "owner",
          title: esc.title,
          message: esc.message,
          severity: esc.severity,
          relatedIds: [esc.escalationId],
        })
      );
    }

    return notices;
  }

  send(input: {
    audience: GovernanceNotification["audience"];
    title: string;
    message: string;
    severity: GovernanceNotification["severity"];
    relatedIds?: readonly string[];
  }): GovernanceNotification {
    const notification: GovernanceNotification = {
      notificationId: this.createId("gnotif"),
      audience: input.audience,
      title: input.title,
      message: input.message,
      severity: input.severity,
      createdAt: this.now().toISOString(),
      acknowledged: false,
      relatedIds: [...(input.relatedIds ?? [])],
    };
    this.store.set(notification.notificationId, notification);
    return notification;
  }

  acknowledge(notificationId: string): GovernanceNotification {
    const existing = this.store.get(notificationId);
    if (!existing) throw new Error(`Notification not found: ${notificationId}`);
    const updated: GovernanceNotification = { ...existing, acknowledged: true };
    this.store.set(notificationId, updated);
    return updated;
  }

  list(): readonly GovernanceNotification[] {
    return Array.from(this.store.values());
  }
}
