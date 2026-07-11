/**
 * Enterprise Governance & Accountability — cycle orchestrator (Sprint 017).
 */

import { GovernanceAccountability } from "@/lib/platform/governance/accountability";
import { GovernanceApprovals } from "@/lib/platform/governance/approvals";
import { GovernanceAudit } from "@/lib/platform/governance/audit";
import { GovernanceAuthority } from "@/lib/platform/governance/authority";
import { GovernanceBoard } from "@/lib/platform/governance/board";
import { GovernanceCommittees } from "@/lib/platform/governance/committees";
import { GovernanceCompliance } from "@/lib/platform/governance/compliance";
import { GovernanceDelegations } from "@/lib/platform/governance/delegations";
import { GovernanceEvidence } from "@/lib/platform/governance/evidence";
import { GovernanceHistory } from "@/lib/platform/governance/history";
import { GovernanceMetrics } from "@/lib/platform/governance/metrics";
import { GovernanceNotifications } from "@/lib/platform/governance/notifications";
import { GovernanceOversight } from "@/lib/platform/governance/oversight";
import { GovernancePolicies } from "@/lib/platform/governance/policies";
import { GovernanceReports } from "@/lib/platform/governance/reports";
import { GovernanceScorecards } from "@/lib/platform/governance/scorecards";
import { GovernanceVoting } from "@/lib/platform/governance/voting";
import {
  ENTERPRISE_GOVERNANCE_VERSION,
  type GovernanceCycleRequest,
  type GovernanceCycleResult,
} from "@/lib/platform/governance/types";

export interface EnterpriseGovernanceEngineDependencies {
  policies?: GovernancePolicies;
  approvals?: GovernanceApprovals;
  delegations?: GovernanceDelegations;
  board?: GovernanceBoard;
  committees?: GovernanceCommittees;
  voting?: GovernanceVoting;
  accountability?: GovernanceAccountability;
  audit?: GovernanceAudit;
  evidence?: GovernanceEvidence;
  compliance?: GovernanceCompliance;
  authority?: GovernanceAuthority;
  oversight?: GovernanceOversight;
  reports?: GovernanceReports;
  scorecards?: GovernanceScorecards;
  metrics?: GovernanceMetrics;
  history?: GovernanceHistory;
  notifications?: GovernanceNotifications;
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * Fully wired Enterprise Governance engine.
 */
export class EnterpriseGovernanceEngine {
  readonly policies: GovernancePolicies;
  readonly approvals: GovernanceApprovals;
  readonly delegations: GovernanceDelegations;
  readonly board: GovernanceBoard;
  readonly committees: GovernanceCommittees;
  readonly voting: GovernanceVoting;
  readonly accountability: GovernanceAccountability;
  readonly audit: GovernanceAudit;
  readonly evidence: GovernanceEvidence;
  readonly compliance: GovernanceCompliance;
  readonly authority: GovernanceAuthority;
  readonly oversight: GovernanceOversight;
  readonly reports: GovernanceReports;
  readonly scorecards: GovernanceScorecards;
  readonly metrics: GovernanceMetrics;
  readonly history: GovernanceHistory;
  readonly notifications: GovernanceNotifications;
  private readonly now: () => Date;

  constructor(dependencies: EnterpriseGovernanceEngineDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId = dependencies.createId;
    this.now = now;

    this.policies =
      dependencies.policies ?? new GovernancePolicies({ now, createId });
    this.approvals =
      dependencies.approvals ?? new GovernanceApprovals({ now, createId });
    this.delegations =
      dependencies.delegations ?? new GovernanceDelegations({ now, createId });
    this.board = dependencies.board ?? new GovernanceBoard({ now, createId });
    this.committees =
      dependencies.committees ?? new GovernanceCommittees({ createId });
    this.voting = dependencies.voting ?? new GovernanceVoting({ now, createId });
    this.accountability =
      dependencies.accountability ??
      new GovernanceAccountability({ now, createId });
    this.audit = dependencies.audit ?? new GovernanceAudit({ now, createId });
    this.evidence =
      dependencies.evidence ?? new GovernanceEvidence({ now, createId });
    this.compliance =
      dependencies.compliance ?? new GovernanceCompliance({ now, createId });
    this.authority =
      dependencies.authority ?? new GovernanceAuthority({ createId });
    this.oversight =
      dependencies.oversight ?? new GovernanceOversight({ now, createId });
    this.reports =
      dependencies.reports ?? new GovernanceReports({ now, createId });
    this.scorecards =
      dependencies.scorecards ?? new GovernanceScorecards({ now, createId });
    this.metrics = dependencies.metrics ?? new GovernanceMetrics({ now });
    this.history =
      dependencies.history ?? new GovernanceHistory({ createId });
    this.notifications =
      dependencies.notifications ??
      new GovernanceNotifications({ now, createId });
  }

  /**
   * Run one enterprise governance accountability cycle.
   */
  run(request: GovernanceCycleRequest): GovernanceCycleResult {
    const policies = this.policies.list();
    const approvals = this.approvals.createFromCycle(request);
    const boardPack = this.board.syncFromCycle(request);
    const committees = this.committees.list();
    const evidence = this.evidence.syncFromCycle(request);
    const accountability = this.accountability.syncFromCycle(request, approvals);
    const compliance = this.compliance.evaluate(request, policies);

    const votes = boardPack.motions.map((motion) => {
      const vote = this.voting.open({
        subjectId: motion.motionId,
        subjectKind: "motion",
      });
      return vote;
    });

    const delegations = this.delegations.list();
    const authority = this.authority.list();

    const auditEvents = this.audit.recordCycle(request, {
      approvals,
      motions: boardPack.motions,
      resolutions: boardPack.resolutions,
      delegations,
    });

    for (const vote of votes) {
      this.audit.record({
        kind: "vote",
        title: `Vote opened for ${vote.subjectId}`,
        detail: `Subject kind ${vote.subjectKind}`,
        actor: request.actor ?? "governance-engine",
        relatedIds: [vote.voteId, vote.subjectId],
        organizationId: request.organizationId,
        schoolId: request.schoolId ?? null,
      });
    }

    const allAudit = this.audit.list();
    const oversight = [
      this.oversight.reviewCycle(request, {
        approvals,
        accountability,
        compliance,
      }),
    ];

    for (const review of oversight) {
      this.audit.record({
        kind: "oversight_review",
        title: review.title,
        detail: review.findings.join("; "),
        actor: review.reviewer,
        relatedIds: [review.reviewId],
        organizationId: request.organizationId,
        schoolId: request.schoolId ?? null,
      });
    }

    const notifications = this.notifications.notifyCycle(request, {
      approvals,
      compliance,
      oversight,
    });

    const history = this.history.fromAudit(this.audit.list());

    const metrics = this.metrics.collect({
      approvals,
      accountability,
      compliance,
      auditEvents: this.audit.list(),
      boardGoalCount: boardPack.goals.length,
      motionCount: boardPack.motions.length,
    });

    const scorecard = this.scorecards.generate(metrics);
    const openApprovals = approvals.filter((a) => a.status === "pending").length;
    const openAccountability = accountability.filter(
      (a) =>
        a.status === "open" ||
        a.status === "in_progress" ||
        a.status === "overdue"
    ).length;
    const openFindings = compliance.filter(
      (c) => c.status !== "compliant" && c.status !== "waived"
    ).length;

    const report = this.reports.build({
      subject: request.subject,
      scorecard,
      metrics,
      openApprovals,
      openAccountability,
      openFindings,
      auditEventCount: this.audit.list().length,
    });

    return {
      requestId: request.requestId,
      completedAt: this.now().toISOString(),
      policies,
      approvals,
      delegations,
      boardGoals: boardPack.goals,
      boardDecisions: boardPack.decisions,
      motions: boardPack.motions,
      resolutions: boardPack.resolutions,
      committees,
      votes,
      accountability,
      auditEvents: this.audit.list(),
      evidence,
      compliance,
      authority,
      oversight,
      notifications,
      history,
      metrics,
      scorecard,
      report,
      domainVersion: ENTERPRISE_GOVERNANCE_VERSION,
      summary: report.narrative,
      metadata: {
        recommendationAuditCount: allAudit.filter((e) => e.kind === "recommendation")
          .length,
        sourceAutonomyId: request.autonomy?.requestId ?? null,
        sourceDecisionId: request.decision?.requestId ?? null,
      },
    };
  }
}

/** Factory for a fully wired enterprise governance engine. */
export function createEnterpriseGovernance(
  dependencies: EnterpriseGovernanceEngineDependencies = {}
): EnterpriseGovernanceEngine {
  return new EnterpriseGovernanceEngine(dependencies);
}
