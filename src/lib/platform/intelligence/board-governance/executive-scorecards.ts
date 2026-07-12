/**
 * Board & Governance Intelligence — ExecutiveScorecards (Sprint 029).
 */

import type { ExecutiveScorecards as ExecutiveScorecardsContract } from "@/lib/platform/intelligence/board-governance/contracts";
import {
  defaultPeriodLabel,
  priorityFromScore,
} from "@/lib/platform/intelligence/board-governance/models";
import type {
  BoardKpi,
  ExecutiveScorecard,
  GovernanceBaseline,
  GovernanceRequest,
} from "@/lib/platform/intelligence/board-governance/types";

export interface ExecutiveScorecardsDependencies {
  createId?: (prefix: string) => string;
}

/**
 * ExecutiveScorecards — role-oriented board scorecards.
 */
export class ExecutiveScorecardsEngine implements ExecutiveScorecardsContract {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: ExecutiveScorecardsDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  build(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    now: Date;
  }): ExecutiveScorecard[] {
    const period =
      input.request.periodLabel ?? defaultPeriodLabel(input.now);
    const byDomain = (domains: string[]) =>
      input.kpis.filter((k) => domains.includes(k.domain));

    const financial = byDomain(["financial"]);
    const mission = byDomain(["mission", "enrollment"]);
    const ops = byDomain(["operations", "executive", "strategy", "compliance"]);

    const scoreOf = (kpis: BoardKpi[], fallback: number) => {
      if (kpis.length === 0) return fallback;
      return Math.round(
        kpis.reduce((sum, k) => sum + k.value, 0) / kpis.length
      );
    };

    return [
      {
        id: this.createId("score-ceo"),
        title: "CEO / Head of School Scorecard",
        ownerRole: "CEO / Head of School",
        periodLabel: period,
        overallScore: input.baseline.executiveKpi,
        status: priorityFromScore(input.baseline.executiveKpi),
        kpis: ops.length > 0 ? ops : input.kpis.slice(0, 4),
        highlights: [
          `Executive KPI index at ${input.baseline.executiveKpi}`,
          `Organization health ${input.baseline.organizationHealthScore}`,
        ],
        concerns:
          input.baseline.riskScore >= 0.5
            ? ["Elevated residual risk requires board attention"]
            : [],
        recommendations: [
          "Prioritize cash and enrollment initiatives in board narrative",
        ],
      },
      {
        id: this.createId("score-cfo"),
        title: "CFO Financial Scorecard",
        ownerRole: "CFO",
        periodLabel: period,
        overallScore: scoreOf(financial, input.baseline.financialHealthScore),
        status: priorityFromScore(
          scoreOf(financial, input.baseline.financialHealthScore)
        ),
        kpis: financial,
        highlights: [
          `Revenue ${input.baseline.revenue}`,
          `Cash flow ${input.baseline.cashFlow}`,
        ],
        concerns:
          input.baseline.cashFlow < 10000
            ? ["Cash flow below comfort threshold"]
            : [],
        recommendations: ["Present collections recovery plan to finance committee"],
      },
      {
        id: this.createId("score-mission"),
        title: "Mission / Academic Scorecard",
        ownerRole: "Academic Lead",
        periodLabel: period,
        overallScore: scoreOf(mission, input.baseline.missionScore),
        status: priorityFromScore(
          scoreOf(mission, input.baseline.missionScore)
        ),
        kpis: mission,
        highlights: [`Mission score ${input.baseline.missionScore}`],
        concerns:
          input.baseline.missionScore < 80
            ? ["Mission outcomes below board target"]
            : [],
        recommendations: ["Include mission evidence pack in quarterly review"],
      },
    ];
  }
}

/** Alias matching Sprint 029 naming. */
export { ExecutiveScorecardsEngine as ExecutiveScorecards };
