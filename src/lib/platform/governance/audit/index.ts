/**
 * Enterprise Governance — audit.
 *
 * Records every recommendation, decision, action, approval, escalation,
 * delegation, motion, resolution, vote, and related governance act.
 */

import type {
  GovernanceApprovalRequest,
  GovernanceAuditEvent,
  GovernanceAuditEventKind,
  GovernanceBoardMotion,
  GovernanceBoardResolution,
  GovernanceCycleRequest,
  GovernanceDelegation,
} from "@/lib/platform/governance/types";
import type { IntelligenceEvidenceRef } from "@/lib/platform/intelligence/types";

export interface GovernanceAuditDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceAudit {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly events: GovernanceAuditEvent[] = [];

  constructor(dependencies: GovernanceAuditDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  record(input: {
    kind: GovernanceAuditEventKind;
    title: string;
    detail: string;
    actor?: string;
    relatedIds?: readonly string[];
    evidenceRefs?: readonly IntelligenceEvidenceRef[];
    organizationId?: string | null;
    schoolId?: string | null;
  }): GovernanceAuditEvent {
    const event: GovernanceAuditEvent = {
      eventId: this.createId("audit"),
      kind: input.kind,
      title: input.title,
      detail: input.detail,
      actor: input.actor ?? "system",
      occurredAt: this.now().toISOString(),
      relatedIds: [...(input.relatedIds ?? [])],
      evidenceRefs: [...(input.evidenceRefs ?? [])],
      organizationId: input.organizationId ?? null,
      schoolId: input.schoolId ?? null,
    };
    this.events.push(event);
    return event;
  }

  /**
   * Capture a full audit trail for one governance cycle.
   */
  recordCycle(
    request: GovernanceCycleRequest,
    context: {
      approvals: readonly GovernanceApprovalRequest[];
      motions: readonly GovernanceBoardMotion[];
      resolutions: readonly GovernanceBoardResolution[];
      delegations?: readonly GovernanceDelegation[];
    }
  ): GovernanceAuditEvent[] {
    const actor = request.actor ?? "governance-engine";
    const org = request.organizationId;
    const school = request.schoolId ?? null;
    const recorded: GovernanceAuditEvent[] = [];

    // Every recommendation
    for (const rec of request.organization?.recommendations ?? []) {
      recorded.push(
        this.record({
          kind: "recommendation",
          title: rec.title,
          detail: rec.rationale,
          actor,
          relatedIds: [rec.recommendationId],
          organizationId: org,
          schoolId: school,
        })
      );
    }
    for (const rec of request.collaboration?.moderated.mergedRecommendations ?? []) {
      recorded.push(
        this.record({
          kind: "recommendation",
          title: rec.title,
          detail: rec.summary,
          actor,
          relatedIds: [rec.recommendationKey],
          evidenceRefs: rec.evidenceRefs,
          organizationId: org,
          schoolId: school,
        })
      );
    }
    if (request.decision?.recommendation) {
      recorded.push(
        this.record({
          kind: "recommendation",
          title: request.decision.recommendation.recommendedOption,
          detail: request.decision.recommendation.rationale.join(" · "),
          actor,
          relatedIds: [request.decision.recommendation.recommendationId],
          organizationId: org,
          schoolId: school,
        })
      );
    }
    for (const step of request.autonomy?.plan.steps ?? []) {
      recorded.push(
        this.record({
          kind: "recommendation",
          title: step.title,
          detail: step.instruction,
          actor,
          relatedIds: [step.stepId],
          organizationId: org,
          schoolId: school,
        })
      );
    }

    if (request.decision) {
      recorded.push(
        this.record({
          kind: "decision",
          title: request.decision.analysis.decisionQuestion,
          detail: request.decision.brief.narrative,
          actor,
          relatedIds: [request.decision.requestId],
          organizationId: org,
          schoolId: school,
        })
      );
    }

    if (request.autonomy?.decision) {
      recorded.push(
        this.record({
          kind: "decision",
          title: `Autonomy ${request.autonomy.decision.approvalMode}`,
          detail: request.autonomy.decision.rationale.join(" "),
          actor,
          relatedIds: [request.autonomy.decision.decisionId],
          organizationId: org,
          schoolId: school,
        })
      );
    }

    if (request.autonomy?.execution.goal) {
      recorded.push(
        this.record({
          kind: "action",
          title: `Execute ${request.autonomy.execution.goal.title}`,
          detail: request.autonomy.execution.summary,
          actor,
          relatedIds: [request.autonomy.execution.goal.id],
          organizationId: org,
          schoolId: school,
        })
      );
    }

    for (const approval of context.approvals) {
      recorded.push(
        this.record({
          kind: "approval",
          title: approval.subject,
          detail: `Status ${approval.status}; chain ${approval.chain.map((s) => s.label).join(" → ")}`,
          actor,
          relatedIds: [approval.approvalId],
          organizationId: org,
          schoolId: school,
        })
      );
    }

    for (const notice of request.autonomy?.escalation.notices ?? []) {
      recorded.push(
        this.record({
          kind: "escalation",
          title: notice.title,
          detail: notice.message,
          actor,
          relatedIds: [notice.escalationId],
          organizationId: org,
          schoolId: school,
        })
      );
    }

    for (const motion of context.motions) {
      recorded.push(
        this.record({
          kind: "motion",
          title: motion.title,
          detail: motion.text,
          actor: motion.movedBy,
          relatedIds: [motion.motionId],
          organizationId: org,
          schoolId: school,
        })
      );
    }

    for (const resolution of context.resolutions) {
      recorded.push(
        this.record({
          kind: "resolution",
          title: resolution.title,
          detail: resolution.text,
          actor,
          relatedIds: [resolution.resolutionId],
          organizationId: org,
          schoolId: school,
        })
      );
    }

    for (const delegation of context.delegations ?? []) {
      recorded.push(
        this.record({
          kind: "delegation",
          title: `Delegate ${delegation.domain}`,
          detail: delegation.rationale,
          actor,
          relatedIds: [delegation.delegationId],
          organizationId: org,
          schoolId: school,
        })
      );
    }

    return recorded;
  }

  list(kind?: GovernanceAuditEventKind): readonly GovernanceAuditEvent[] {
    return kind
      ? this.events.filter((e) => e.kind === kind)
      : [...this.events];
  }
}
