/**
 * Enterprise Governance — scorecards.
 */

import type {
  GovernanceMetricSample,
  GovernanceScorecard,
} from "@/lib/platform/governance/types";

export interface GovernanceScorecardsDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceScorecards {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: GovernanceScorecardsDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  generate(metrics: readonly GovernanceMetricSample[]): GovernanceScorecard {
    const value = (key: string, fallback = 0) =>
      metrics.find((m) => m.key === key)?.value ?? fallback;

    const openAcct = value("open_accountability");
    const openFindings = value("open_compliance_findings");
    const pendingApprovals = value("pending_approvals");
    const avgCompletion = value("avg_accountability_completion");
    const auditEvents = value("audit_event_count");
    const recommendationAudits = value("recommendation_audit_events");
    const boardGoals = value("board_goals");
    const motions = value("motions");

    const accountabilityScore = clamp(
      avgCompletion * 0.7 + Math.max(0, 100 - openAcct * 10) * 0.3
    );
    const complianceScore = clamp(100 - openFindings * 20);
    const approvalLatencyDays = pendingApprovals > 0 ? pendingApprovals * 2 : 0;
    const boardThroughput = boardGoals + motions;
    const auditCoverage = clamp(
      auditEvents === 0
        ? 0
        : (recommendationAudits / Math.max(1, auditEvents)) * 100
    );

    const overallScore = clamp(
      accountabilityScore * 0.3 +
        complianceScore * 0.3 +
        Math.max(0, 100 - approvalLatencyDays * 5) * 0.2 +
        Math.min(100, boardThroughput * 15 + auditCoverage * 0.4) * 0.2
    );

    const band =
      overallScore >= 80
        ? "strong"
        : overallScore >= 60
          ? "adequate"
          : overallScore >= 40
            ? "weak"
            : "critical";

    return {
      scorecardId: this.createId("gscore"),
      generatedAt: this.now().toISOString(),
      accountabilityScore: Math.round(accountabilityScore),
      complianceScore: Math.round(complianceScore),
      approvalLatencyDays,
      boardThroughput,
      auditCoverage: Math.round(auditCoverage),
      overallScore: Math.round(overallScore),
      band,
      summary: `Governance ${band}: overall ${Math.round(overallScore)}; accountability ${Math.round(accountabilityScore)}; compliance ${Math.round(complianceScore)}`,
    };
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
