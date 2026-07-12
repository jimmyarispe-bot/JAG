/**
 * Board & Governance Intelligence — GovernanceEngine (Sprint 029).
 *
 * Composes board artifacts into a GovernanceResult.
 */

import type { GovernanceEngine as GovernanceEngineContract } from "@/lib/platform/intelligence/board-governance/contracts";
import { BOARD_GOVERNANCE_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/board-governance/types";
import { emptyGovernanceScope } from "@/lib/platform/intelligence/board-governance/models";
import type {
  BoardKpi,
  BoardKpiDashboardView,
  BoardPacket,
  BoardResolution,
  CommitteeReport,
  ComplianceItem,
  ExecutiveBrief,
  ExecutiveScorecard,
  GovernanceBaseline,
  GovernanceCalendarEvent,
  GovernanceConfidenceScore,
  GovernanceDashboardView,
  GovernanceRequest,
  GovernanceResult,
  RiskHeatMapCell,
  RiskRegisterEntry,
  StrategicInitiative,
} from "@/lib/platform/intelligence/board-governance/types";

/**
 * GovernanceEngine — assembles the final governance result DTO.
 */
export class GovernanceEngineImpl implements GovernanceEngineContract {
  compose(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    compliance: ComplianceItem[];
    resolutions: BoardResolution[];
    scorecards: ExecutiveScorecard[];
    committees: CommitteeReport[];
    calendar: GovernanceCalendarEvent[];
    packets: BoardPacket[];
    brief: ExecutiveBrief;
    dashboard: GovernanceDashboardView;
    kpiDashboard: BoardKpiDashboardView;
    heatMap: RiskHeatMapCell[];
    confidence: GovernanceConfidenceScore;
    now: Date;
  }): GovernanceResult {
    const recommendations = [
      ...input.brief.decisionsNeeded.slice(0, 2),
      ...input.dashboard.alerts.slice(0, 2),
      ...input.packets[0]?.recommendations.slice(0, 2) ?? [],
    ].slice(0, 6);

    const historyRecord = {
      id: `gov-hist-${input.request.requestId}`,
      requestId: input.request.requestId,
      generatedAt: input.now.toISOString(),
      status: "generated" as const,
      packetIds: input.packets.map((p) => p.id),
      summary: input.brief.headline,
      scope: input.request.scope ?? emptyGovernanceScope(),
      confidence: input.confidence,
    };

    return {
      requestId: input.request.requestId,
      version: BOARD_GOVERNANCE_INTELLIGENCE_VERSION,
      generatedAt: input.now.toISOString(),
      periodLabel: input.brief.periodLabel,
      scope: input.request.scope ?? emptyGovernanceScope(),
      packets: input.packets,
      brief: input.brief,
      dashboard: input.dashboard,
      kpiDashboard: input.kpiDashboard,
      heatMap: input.heatMap,
      scorecards: input.scorecards,
      risks: input.risks,
      initiatives: input.initiatives,
      compliance: input.compliance,
      resolutions: input.resolutions,
      committees: input.committees,
      calendar: input.calendar,
      projection: {
        generatedAt: input.now.toISOString(),
        headline: input.brief.headline,
        packetKinds: input.packets.map((p) => p.kind),
        dashboard: input.dashboard,
        kpiDashboard: input.kpiDashboard,
        brief: input.brief,
        heatMap: input.heatMap,
        metrics: {
          packetCount: input.packets.length,
          riskCount: input.risks.length,
          initiativeCount: input.initiatives.length,
          complianceCount: input.compliance.length,
          resolutionCount: input.resolutions.length,
          committeeCount: input.committees.length,
        },
        overallConfidence: input.confidence,
      },
      confidence: input.confidence,
      historyRecord,
      recommendations:
        recommendations.length > 0
          ? recommendations
          : ["Maintain board governance cadence."],
    };
  }
}

/** Alias matching Sprint 029 naming. */
export { GovernanceEngineImpl as GovernanceEngine };
