/**
 * Board & Governance Intelligence — BoardPacketGenerator (Sprint 029).
 */

import type { BoardPacketGenerator as BoardPacketGeneratorContract } from "@/lib/platform/intelligence/board-governance/contracts";
import {
  defaultPeriodLabel,
  emptyGovernanceScope,
  priorityFromScore,
} from "@/lib/platform/intelligence/board-governance/models";
import type {
  BoardKpi,
  BoardPacket,
  BoardPacketKind,
  BoardPacketSection,
  BoardResolution,
  CommitteeReport,
  ComplianceItem,
  ExecutiveScorecard,
  GovernanceBaseline,
  GovernanceCalendarEvent,
  GovernanceConfidenceScore,
  GovernanceRequest,
  RiskRegisterEntry,
  StrategicInitiative,
} from "@/lib/platform/intelligence/board-governance/types";

export interface BoardPacketGeneratorDependencies {
  createId?: (prefix: string) => string;
}

const PACKET_TITLES: Record<BoardPacketKind, string> = {
  monthly_board_packet: "Monthly Board Packet",
  quarterly_strategic_review: "Quarterly Strategic Review",
  executive_kpi_summary: "Executive KPI Summary",
  financial_summary: "Financial Summary",
  risk_heat_map: "Risk Heat Map",
  strategic_initiative_status: "Strategic Initiative Status",
  governance_dashboard: "Governance Dashboard",
  mission_scorecard: "Mission Scorecard",
  compliance_summary: "Compliance Summary",
  executive_briefing: "Executive Briefing",
};

/**
 * BoardPacketGenerator — builds individual board packet artifacts.
 */
export class BoardPacketGeneratorEngine
  implements BoardPacketGeneratorContract
{
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: BoardPacketGeneratorDependencies = {}) {
    this.createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  generate(input: {
    kind: BoardPacketKind;
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    compliance: ComplianceItem[];
    resolutions: BoardResolution[];
    committees: CommitteeReport[];
    scorecards: ExecutiveScorecard[];
    calendar: GovernanceCalendarEvent[];
    confidence: GovernanceConfidenceScore;
    now: Date;
  }): BoardPacket {
    const period =
      input.request.periodLabel ?? defaultPeriodLabel(input.now);
    const sections = this.sectionsForKind(input);
    const recommendations = this.recommendationsForKind(input);

    return {
      id: this.createId(`packet-${input.kind}`),
      kind: input.kind,
      title: PACKET_TITLES[input.kind],
      periodLabel: period,
      generatedAt: input.now.toISOString(),
      status: "generated",
      scope: input.request.scope ?? emptyGovernanceScope(),
      sections,
      kpis: this.kpisForKind(input),
      risks: this.risksForKind(input),
      initiatives: this.initiativesForKind(input),
      compliance: this.complianceForKind(input),
      resolutions: input.resolutions,
      committees: this.committeesForKind(input),
      scorecards: this.scorecardsForKind(input),
      calendar: input.calendar,
      confidence: input.confidence,
      summary: sections.map((s) => s.summary).join(" "),
      recommendations,
      metadata: input.request.metadata,
    };
  }

  private kpisForKind(input: {
    kind: BoardPacketKind;
    kpis: BoardKpi[];
  }): BoardKpi[] {
    switch (input.kind) {
      case "financial_summary":
        return input.kpis.filter((k) => k.domain === "financial");
      case "mission_scorecard":
        return input.kpis.filter((k) =>
          ["mission", "enrollment"].includes(k.domain)
        );
      case "executive_kpi_summary":
        return input.kpis;
      default:
        return input.kpis;
    }
  }

  private risksForKind(input: {
    kind: BoardPacketKind;
    risks: RiskRegisterEntry[];
  }): RiskRegisterEntry[] {
    if (input.kind === "risk_heat_map") return input.risks;
    if (input.kind === "compliance_summary") {
      return input.risks.filter((r) =>
        r.relatedDomains.includes("compliance") || r.category === "decision"
      );
    }
    return input.risks.slice(0, 5);
  }

  private initiativesForKind(input: {
    kind: BoardPacketKind;
    initiatives: StrategicInitiative[];
  }): StrategicInitiative[] {
    if (
      input.kind === "strategic_initiative_status" ||
      input.kind === "quarterly_strategic_review"
    ) {
      return input.initiatives;
    }
    return input.initiatives.slice(0, 3);
  }

  private complianceForKind(input: {
    kind: BoardPacketKind;
    compliance: ComplianceItem[];
  }): ComplianceItem[] {
    if (input.kind === "compliance_summary") return input.compliance;
    return input.compliance.slice(0, 2);
  }

  private committeesForKind(input: {
    kind: BoardPacketKind;
    committees: CommitteeReport[];
  }): CommitteeReport[] {
    if (
      input.kind === "monthly_board_packet" ||
      input.kind === "governance_dashboard"
    ) {
      return input.committees;
    }
    return input.committees.slice(0, 2);
  }

  private scorecardsForKind(input: {
    kind: BoardPacketKind;
    scorecards: ExecutiveScorecard[];
  }): ExecutiveScorecard[] {
    if (
      input.kind === "mission_scorecard" ||
      input.kind === "executive_kpi_summary"
    ) {
      return input.scorecards;
    }
    return input.scorecards.slice(0, 2);
  }

  private sectionsForKind(input: {
    kind: BoardPacketKind;
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    compliance: ComplianceItem[];
    now: Date;
  }): BoardPacketSection[] {
    const section = (
      kind: BoardPacketKind | "custom",
      title: string,
      summary: string,
      highlights: string[],
      metrics: Record<string, number | string | null>,
      priority: BoardPacketSection["priority"]
    ): BoardPacketSection => ({
      id: this.createId(`section-${kind}`),
      kind,
      title,
      summary,
      highlights,
      metrics,
      priority,
    });

    switch (input.kind) {
      case "financial_summary":
        return [
          section(
            "financial_summary",
            "Financial Position",
            `Revenue ${input.baseline.revenue}; cash flow ${input.baseline.cashFlow}; expense ${input.baseline.expense}.`,
            [
              `Financial health ${input.baseline.financialHealthScore}`,
              `Expense ratio context available for board review`,
            ],
            {
              revenue: input.baseline.revenue,
              cashFlow: input.baseline.cashFlow,
              expense: input.baseline.expense,
            },
            priorityFromScore(input.baseline.financialHealthScore)
          ),
        ];
      case "risk_heat_map":
        return [
          section(
            "risk_heat_map",
            "Risk Heat Map",
            `${input.risks.length} risks registered for board oversight.`,
            input.risks.slice(0, 3).map((r) => `${r.title} (${r.heat})`),
            {
              riskCount: input.risks.length,
              residualIndex: Math.round(input.baseline.riskScore * 100),
            },
            priorityFromScore(100 - input.baseline.riskScore * 100)
          ),
        ];
      case "strategic_initiative_status":
        return [
          section(
            "strategic_initiative_status",
            "Initiative Status",
            `${input.initiatives.length} strategic initiatives tracked.`,
            input.initiatives.map(
              (i) => `${i.title}: ${i.progressPct}% (${i.status})`
            ),
            {
              initiativeCount: input.initiatives.length,
              avgProgress:
                input.initiatives.length > 0
                  ? Math.round(
                      input.initiatives.reduce((s, i) => s + i.progressPct, 0) /
                        input.initiatives.length
                    )
                  : 0,
            },
            priorityFromScore(input.baseline.initiativeProgress)
          ),
        ];
      case "mission_scorecard":
        return [
          section(
            "mission_scorecard",
            "Mission Outcomes",
            `Mission score ${input.baseline.missionScore}; enrollment ${input.baseline.enrollment}.`,
            [
              `Mission score ${input.baseline.missionScore}`,
              `Enrollment ${input.baseline.enrollment}`,
            ],
            {
              missionScore: input.baseline.missionScore,
              enrollment: input.baseline.enrollment,
            },
            priorityFromScore(input.baseline.missionScore)
          ),
        ];
      case "compliance_summary":
        return [
          section(
            "compliance_summary",
            "Compliance Posture",
            `Compliance score ${input.baseline.complianceScore} across ${input.compliance.length} monitored areas.`,
            input.compliance.map((c) => `${c.area}: ${c.status}`),
            {
              complianceScore: input.baseline.complianceScore,
              itemCount: input.compliance.length,
            },
            priorityFromScore(input.baseline.complianceScore)
          ),
        ];
      case "executive_kpi_summary":
        return [
          section(
            "executive_kpi_summary",
            "Executive KPIs",
            `Executive KPI index ${input.baseline.executiveKpi} across ${input.kpis.length} indicators.`,
            input.kpis.slice(0, 4).map((k) => k.narrative),
            {
              executiveKpi: input.baseline.executiveKpi,
              kpiCount: input.kpis.length,
            },
            priorityFromScore(input.baseline.executiveKpi)
          ),
        ];
      case "quarterly_strategic_review":
        return [
          section(
            "quarterly_strategic_review",
            "Strategic Review",
            "Quarterly review of initiatives, mission, risk, and financial trajectory.",
            [
              `${input.initiatives.length} initiatives`,
              `${input.risks.length} risks`,
              `Mission ${input.baseline.missionScore}`,
            ],
            {
              initiativeProgress: input.baseline.initiativeProgress,
              missionScore: input.baseline.missionScore,
              riskScore: Math.round(input.baseline.riskScore * 100),
            },
            priorityFromScore(input.baseline.executiveKpi)
          ),
        ];
      case "governance_dashboard":
        return [
          section(
            "governance_dashboard",
            "Governance Overview",
            "Board governance dashboard covering KPIs, risks, compliance, and calendar.",
            [
              `Org health ${input.baseline.organizationHealthScore}`,
              `Compliance ${input.baseline.complianceScore}`,
            ],
            {
              organizationHealth: input.baseline.organizationHealthScore,
              compliance: input.baseline.complianceScore,
            },
            priorityFromScore(input.baseline.organizationHealthScore)
          ),
        ];
      case "executive_briefing":
        return [
          section(
            "executive_briefing",
            "Executive Brief",
            "Concise leadership briefing for board distribution.",
            [
              `Executive KPI ${input.baseline.executiveKpi}`,
              `Top risk count ${input.risks.length}`,
            ],
            { executiveKpi: input.baseline.executiveKpi },
            priorityFromScore(input.baseline.executiveKpi)
          ),
        ];
      case "monthly_board_packet":
      default:
        return [
          section(
            "monthly_board_packet",
            "Monthly Oversight",
            "Integrated monthly board packet spanning finance, mission, risk, and initiatives.",
            [
              `Revenue ${input.baseline.revenue}`,
              `Mission ${input.baseline.missionScore}`,
              `Risks ${input.risks.length}`,
              `Initiatives ${input.initiatives.length}`,
            ],
            {
              revenue: input.baseline.revenue,
              missionScore: input.baseline.missionScore,
              riskCount: input.risks.length,
              initiativeCount: input.initiatives.length,
            },
            priorityFromScore(input.baseline.executiveKpi)
          ),
        ];
    }
  }

  private recommendationsForKind(input: {
    kind: BoardPacketKind;
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    compliance: ComplianceItem[];
  }): string[] {
    const recs: string[] = [];
    const topRisk = input.risks[0];
    if (topRisk) recs.push(`Address top risk: ${topRisk.title}`);
    const atRiskInit = input.initiatives.find(
      (i) => i.status === "at_risk" || i.status === "blocked"
    );
    if (atRiskInit) {
      recs.push(`Stabilize initiative: ${atRiskInit.title}`);
    }
    const nonCompliant = input.compliance.find(
      (c) => c.status === "non_compliant" || c.status === "at_risk"
    );
    if (nonCompliant) {
      recs.push(`Close compliance gap: ${nonCompliant.area}`);
    }
    if (recs.length === 0) {
      recs.push("Maintain current governance cadence and packet quality.");
    }
    return recs.slice(0, 5);
  }
}

/** Alias matching Sprint 029 naming. */
export { BoardPacketGeneratorEngine as BoardPacketGenerator };
