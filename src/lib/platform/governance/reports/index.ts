/**
 * Enterprise Governance — reports.
 */

import type {
  GovernanceMetricSample,
  GovernanceReport,
  GovernanceScorecard,
} from "@/lib/platform/governance/types";

export interface GovernanceReportsDependencies {
  now?: () => Date;
  createId?: (prefix: string) => string;
}

export class GovernanceReports {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: GovernanceReportsDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  build(input: {
    subject: string;
    scorecard: GovernanceScorecard;
    metrics: readonly GovernanceMetricSample[];
    openApprovals: number;
    openAccountability: number;
    openFindings: number;
    auditEventCount: number;
  }): GovernanceReport {
    const narrative = [
      `Governance report for "${input.subject}".`,
      input.scorecard.summary,
      `${input.openApprovals} open approval(s), ${input.openAccountability} open accountability item(s), ${input.openFindings} open finding(s).`,
      `Audit captured ${input.auditEventCount} event(s) including every recommendation.`,
    ].join(" ");

    return {
      reportId: this.createId("greport"),
      title: `Governance Report — ${input.subject}`,
      generatedAt: this.now().toISOString(),
      narrative,
      scorecard: input.scorecard,
      metrics: input.metrics,
      openApprovals: input.openApprovals,
      openAccountability: input.openAccountability,
      openFindings: input.openFindings,
      auditEventCount: input.auditEventCount,
    };
  }
}
