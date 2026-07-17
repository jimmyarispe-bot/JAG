/**
 * Board & Governance Intelligence — contracts / interfaces only (Sprint 029).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type {
  BoardKpi,
  BoardKpiDashboardView,
  BoardPacket,
  BoardPacketKind,
  BoardQueryRequest,
  BoardQueryResult,
  BoardResolution,
  CommitteeReport,
  ComplianceItem,
  ExecutiveBrief,
  ExecutiveScorecard,
  GovernanceBaseline,
  GovernanceCalendarEvent,
  GovernanceConfidenceScore,
  GovernanceDashboardView,
  GovernanceHistoryRecord,
  GovernanceProjectionResult,
  GovernanceRequest,
  GovernanceResult,
  GraphScope,
  RiskHeatMapCell,
  RiskRegisterEntry,
  StrategicInitiative,
} from "@/lib/platform/intelligence/board-governance/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";

export interface BoardIntelligenceEngine {
  generate(request: GovernanceRequest): GovernanceResult;
}

export interface GovernanceEngine {
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
  }): GovernanceResult;
}

export interface BoardPacketGenerator {
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
  }): BoardPacket;
}

export interface ExecutiveBriefGenerator {
  generate(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    compliance: ComplianceItem[];
    resolutions: BoardResolution[];
    confidence: GovernanceConfidenceScore;
    now: Date;
  }): ExecutiveBrief;
}

export interface CommitteeReporting {
  build(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    confidence: GovernanceConfidenceScore;
    now: Date;
  }): CommitteeReport[];
}

export interface StrategicInitiativeTracker {
  track(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    now: Date;
  }): StrategicInitiative[];
}

export interface GovernanceDashboard {
  build(input: {
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    risks: RiskRegisterEntry[];
    initiatives: StrategicInitiative[];
    compliance: ComplianceItem[];
    resolutions: BoardResolution[];
    calendar: GovernanceCalendarEvent[];
    now: Date;
  }): GovernanceDashboardView;
}

export interface BoardKPIDashboard {
  build(input: {
    kpis: BoardKpi[];
    periodLabel: string;
    now: Date;
  }): BoardKpiDashboardView;
}

export interface RiskRegister {
  build(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    now: Date;
  }): RiskRegisterEntry[];
  heatMap(risks: RiskRegisterEntry[]): RiskHeatMapCell[];
}

export interface ComplianceMonitor {
  monitor(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    now: Date;
  }): ComplianceItem[];
}

export interface ExecutiveScorecards {
  build(input: {
    request: GovernanceRequest;
    baseline: GovernanceBaseline;
    kpis: BoardKpi[];
    now: Date;
  }): ExecutiveScorecard[];
}

export interface ResolutionTracker {
  track(input: {
    request: GovernanceRequest;
    initiatives: StrategicInitiative[];
    now: Date;
  }): BoardResolution[];
}

export interface GovernanceCalendar {
  build(input: {
    request: GovernanceRequest;
    resolutions: BoardResolution[];
    now: Date;
  }): GovernanceCalendarEvent[];
}

export interface BoardQueries {
  ask(result: GovernanceResult, request: BoardQueryRequest): BoardQueryResult;
}

export interface GovernanceProjection {
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
  }): GovernanceProjectionResult;
}

/** Governance* façade names; Board* used for packet/KPI DTOs. */
export interface GovernanceRepository {
  save(packet: BoardPacket): BoardPacket;
  get(packetId: string): BoardPacket | null;
  list(scope?: Partial<GraphScope>): BoardPacket[];
  remove(packetId: string): boolean;
  saveHistory(record: GovernanceHistoryRecord): GovernanceHistoryRecord;
  listHistory(scope?: Partial<GraphScope>): GovernanceHistoryRecord[];
  clear(): void;
}

/** Governance* façade names; Board* used for packet/KPI DTOs. */
export interface GovernanceService {
  generate(request: GovernanceRequest): GovernanceResult;
  generatePacket(
    kind: BoardPacketKind,
    options?: {
      graph?: Graph;
      analysis?: GraphAnalysisResult;
      graphInput?: GraphBuildInput;
      decisionResult?: ExecutiveDecisionResult;
      predictionResult?: PredictionResult;
      baselineOverrides?: Partial<GovernanceBaseline>;
      periodLabel?: string;
      scope?: GraphScope;
    }
  ): BoardPacket;
  query(result: GovernanceResult, request: BoardQueryRequest): BoardQueryResult;
  repository(): GovernanceRepository;
}

/** DI bag for the full Board & Governance Intelligence stack. */
export interface BoardGovernanceDependencies {
  boardIntelligence?: BoardIntelligenceEngine;
  governanceEngine?: GovernanceEngine;
  packetGenerator?: BoardPacketGenerator;
  briefGenerator?: ExecutiveBriefGenerator;
  committeeReporting?: CommitteeReporting;
  initiativeTracker?: StrategicInitiativeTracker;
  governanceDashboard?: GovernanceDashboard;
  kpiDashboard?: BoardKPIDashboard;
  riskRegister?: RiskRegister;
  complianceMonitor?: ComplianceMonitor;
  scorecards?: ExecutiveScorecards;
  resolutionTracker?: ResolutionTracker;
  calendar?: GovernanceCalendar;
  queries?: BoardQueries;
  projection?: GovernanceProjection;
  repository?: GovernanceRepository;
  engine?: BoardIntelligenceEngine;
  /** Optional graph stack hooks. */
  buildAndAnalyze?: (input?: GraphBuildInput) => {
    graph: Graph;
    analysis: GraphAnalysisResult;
  };
  now?: () => Date;
  createId?: (prefix: string) => string;
}
