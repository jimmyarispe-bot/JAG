/**
 * Board & Governance Intelligence — CommitteeReporting (Sprint 029).
 */

import type { CommitteeReporting as CommitteeReportingContract } from "@/lib/platform/intelligence/board-governance/contracts";
import {
  defaultPeriodLabel,
  levelFromValue,
} from "@/lib/platform/intelligence/board-governance/models";
import type {
  BoardKpi,
  CommitteeReport,
  GovernanceBaseline,
  GovernanceCommitteeKind,
  GovernanceConfidenceScore,
  GovernanceRequest,
  RiskRegisterEntry,
  StrategicInitiative,
} from "@/lib/platform/intelligence/board-governance/types";

export interface CommitteeReportingDependencies {
  createId?: (prefix: string) => string;
}

/**
 * CommitteeReporting — committee-ready board sections.
 */
export class CommitteeReportingEngine implements CommitteeReportingContract {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: CommitteeReportingDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  build(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    confidence: GovernanceConfidenceScore;
    now: Date;
  }): CommitteeReport[] {
    const period =
      input.request.periodLabel ?? defaultPeriodLabel(input.now);

    const make = (
      committee: GovernanceCommitteeKind,
      title: string,
      summary: string,
      kpiDomains: string[],
      decisionsNeeded: string[],
      recommendations: string[]
    ): CommitteeReport => {
      const kpiHighlights = input.kpis.filter((k) =>
        kpiDomains.includes(k.domain)
      );
      const risks = input.risks
        .filter((r) =>
          r.relatedDomains.some((d) =>
            kpiDomains.includes(d) || d === committee || d === "risk"
          )
        )
        .slice(0, 3)
        .map((r) => r.title);

      return {
        id: this.createId(`committee-${committee}`),
        committee,
        title,
        periodLabel: period,
        summary,
        decisionsNeeded,
        risks:
          risks.length > 0
            ? risks
            : input.risks.slice(0, 2).map((r) => r.title),
        kpiHighlights,
        recommendations,
        confidence: input.confidence,
      };
    };

    return [
      make(
        "finance",
        "Finance Committee Report",
        `Financial posture: revenue ${input.baseline.revenue}, cash ${input.baseline.cashFlow}.`,
        ["financial"],
        ["Approve cash recovery plan updates"],
        ["Review collections cadence and expense controls"]
      ),
      make(
        "academic",
        "Academic / Mission Committee Report",
        `Mission score ${input.baseline.missionScore}; enrollment ${input.baseline.enrollment}.`,
        ["mission", "enrollment"],
        ["Endorse mission interventions for the quarter"],
        ["Track enrollment retention and academic outcomes"]
      ),
      make(
        "audit",
        "Audit / Compliance Committee Report",
        `Compliance score ${input.baseline.complianceScore}.`,
        ["compliance", "risk"],
        ["Confirm closure plan for open findings"],
        ["Maintain evidence pack for board packet"]
      ),
      make(
        "governance",
        "Governance Committee Report",
        "Board packet readiness, resolutions, and calendar oversight.",
        ["executive", "strategy", "operations"],
        ["Confirm packet distribution timeline"],
        [
          `Monitor ${input.initiatives.length} strategic initiatives and open resolutions`,
        ]
      ),
      make(
        "risk",
        "Risk Committee Report",
        `Residual risk index ${(input.baseline.riskScore * 100).toFixed(0)}.`,
        ["risk", "financial"],
        ["Validate top residual risks and owners"],
        ["Refresh heat map before full board meeting"]
      ),
    ].map((report) => ({
      ...report,
      confidence: {
        value: input.confidence.value,
        level: levelFromValue(input.confidence.value),
        factors: input.confidence.factors,
      },
    }));
  }
}

/** Alias matching Sprint 029 naming. */
export { CommitteeReportingEngine as CommitteeReporting };
