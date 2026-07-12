/**
 * Board & Governance Intelligence — GovernanceProjection (Sprint 029).
 */

import type { GovernanceProjection as GovernanceProjectionContract } from "@/lib/platform/intelligence/board-governance/contracts";
import type {
  BoardKpiDashboardView,
  BoardPacket,
  BoardResolution,
  CommitteeReport,
  ComplianceItem,
  ExecutiveBrief,
  GovernanceConfidenceScore,
  GovernanceDashboardView,
  GovernanceProjectionResult,
  GovernanceRequest,
  RiskHeatMapCell,
  RiskRegisterEntry,
  StrategicInitiative,
} from "@/lib/platform/intelligence/board-governance/types";

/**
 * GovernanceProjection — flattens governance results for dashboards / UI.
 */
export class GovernanceProjectionEngine
  implements GovernanceProjectionContract
{
  project(input: {
    request: GovernanceRequest;
    packets: BoardPacket[];
    brief: ExecutiveBrief;
    dashboard: GovernanceDashboardView;
    kpiDashboard: BoardKpiDashboardView;
    heatMap: RiskHeatMapCell[];
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    compliance: ComplianceItem[];
    resolutions: BoardResolution[];
    committees: CommitteeReport[];
    confidence: GovernanceConfidenceScore;
  }): GovernanceProjectionResult {
    return {
      generatedAt: input.dashboard.generatedAt,
      headline: input.brief.headline || input.dashboard.headline,
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
    };
  }
}

/** Alias matching Sprint 029 naming. */
export { GovernanceProjectionEngine as GovernanceProjection };
