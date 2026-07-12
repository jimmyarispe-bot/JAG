/**
 * Board & Governance Intelligence — public API (Sprint 029).
 *
 * Governance layer that sits on Executive Graph + Decision + Predictive
 * intelligence to produce board-ready reporting and oversight workflows.
 */

export {
  BOARD_GOVERNANCE_INTELLIGENCE_VERSION,
  BOARD_PACKET_KINDS,
  COMPLIANCE_STATUSES,
  GOVERNANCE_ARTIFACT_STATUSES,
  GOVERNANCE_CALENDAR_EVENT_KINDS,
  GOVERNANCE_COMMITTEE_KINDS,
  GOVERNANCE_CONFIDENCE_LEVELS,
  GOVERNANCE_PRIORITY_BANDS,
  RESOLUTION_STATUSES,
  RISK_REGISTER_STATUSES,
  STRATEGIC_INITIATIVE_STATUSES,
  type BoardKpi,
  type BoardKpiDashboardView,
  type BoardPacket,
  type BoardPacketKind,
  type BoardPacketSection,
  type BoardQueryRequest,
  type BoardQueryResult,
  type BoardResolution,
  type CommitteeReport,
  type ComplianceItem,
  type ComplianceStatus,
  type ExecutiveBrief,
  type ExecutiveScorecard,
  type GovernanceArtifactStatus,
  type GovernanceBaseline,
  type GovernanceCalendarEvent,
  type GovernanceCalendarEventKind,
  type GovernanceCommitteeKind,
  type GovernanceConfidenceLevel,
  type GovernanceConfidenceScore,
  type GovernanceDashboardView,
  type GovernanceHistoryRecord,
  type GovernanceMetadata,
  type GovernancePriorityBand,
  type GovernanceProjectionResult,
  type GovernanceRequest,
  type GovernanceResult,
  type GraphScope,
  type ResolutionStatus,
  type RiskHeatMapCell,
  type RiskRegisterEntry,
  type RiskRegisterStatus,
  type StrategicInitiative,
  type StrategicInitiativeStatus,
} from "@/lib/platform/intelligence/board-governance/types";

export type {
  BoardGovernanceDependencies,
  BoardIntelligenceEngine as BoardIntelligenceEngineContract,
  BoardKPIDashboard as BoardKPIDashboardContract,
  BoardPacketGenerator as BoardPacketGeneratorContract,
  BoardQueries as BoardQueriesContract,
  CommitteeReporting as CommitteeReportingContract,
  ComplianceMonitor as ComplianceMonitorContract,
  ExecutiveBriefGenerator as ExecutiveBriefGeneratorContract,
  ExecutiveScorecards as ExecutiveScorecardsContract,
  GovernanceCalendar as GovernanceCalendarContract,
  GovernanceDashboard as GovernanceDashboardContract,
  GovernanceEngine as GovernanceEngineContract,
  GovernanceProjection as GovernanceProjectionContract,
  GovernanceRepository as GovernanceRepositoryContract,
  GovernanceService as GovernanceServiceContract,
  ResolutionTracker as ResolutionTrackerContract,
  RiskRegister as RiskRegisterContract,
  StrategicInitiativeTracker as StrategicInitiativeTrackerContract,
} from "@/lib/platform/intelligence/board-governance/contracts";

export {
  buildBoardKpis,
  clamp,
  clamp01,
  defaultGovernanceBaseline,
  defaultPeriodLabel,
  deriveGovernanceBaseline,
  emptyGovernanceScope,
  governanceModels,
  levelFromValue,
  priorityFromRisk,
  priorityFromScore,
  resolvePacketKinds,
} from "@/lib/platform/intelligence/board-governance/models";

export {
  BoardPacketGenerator,
  BoardPacketGeneratorEngine,
} from "@/lib/platform/intelligence/board-governance/board-packet-generator";

export {
  ExecutiveBriefGenerator,
  ExecutiveBriefGeneratorEngine,
} from "@/lib/platform/intelligence/board-governance/executive-brief-generator";

export {
  CommitteeReporting,
  CommitteeReportingEngine,
} from "@/lib/platform/intelligence/board-governance/committee-reporting";

export {
  StrategicInitiativeTracker,
  StrategicInitiativeTrackerEngine,
} from "@/lib/platform/intelligence/board-governance/strategic-initiative-tracker";

export {
  GovernanceDashboard,
  GovernanceDashboardEngine,
  BoardKPIDashboard,
  BoardKPIDashboardEngine,
} from "@/lib/platform/intelligence/board-governance/governance-dashboard";

export {
  RiskRegister,
  RiskRegisterEngine,
} from "@/lib/platform/intelligence/board-governance/risk-register";

export {
  ComplianceMonitor,
  ComplianceMonitorEngine,
} from "@/lib/platform/intelligence/board-governance/compliance-monitor";

export {
  ExecutiveScorecards,
  ExecutiveScorecardsEngine,
} from "@/lib/platform/intelligence/board-governance/executive-scorecards";

export {
  ResolutionTracker,
  ResolutionTrackerEngine,
} from "@/lib/platform/intelligence/board-governance/resolution-tracker";

export {
  GovernanceCalendar,
  GovernanceCalendarEngine,
} from "@/lib/platform/intelligence/board-governance/governance-calendar";

export {
  BoardQueries,
  BoardQueriesEngine,
} from "@/lib/platform/intelligence/board-governance/queries";

export {
  GovernanceProjection,
  GovernanceProjectionEngine,
} from "@/lib/platform/intelligence/board-governance/projection";

export {
  GovernanceRepository,
  GovernanceRepositoryStore,
} from "@/lib/platform/intelligence/board-governance/repository";

export {
  GovernanceEngine,
  GovernanceEngineImpl,
} from "@/lib/platform/intelligence/board-governance/governance-engine";

export {
  BoardIntelligenceEngine,
  BoardIntelligenceEngineImpl,
} from "@/lib/platform/intelligence/board-governance/board-intelligence-engine";

export {
  GovernanceService,
  GovernanceServiceImpl,
} from "@/lib/platform/intelligence/board-governance/service";

import { BoardIntelligenceEngine } from "@/lib/platform/intelligence/board-governance/board-intelligence-engine";
import type { BoardGovernanceDependencies } from "@/lib/platform/intelligence/board-governance/contracts";
import { GovernanceService } from "@/lib/platform/intelligence/board-governance/service";
import {
  createExecutiveDecisionIntelligence,
  type CreateExecutiveDecisionOptions,
  type ExecutiveDecisionStack,
} from "@/lib/platform/intelligence/executive-decision";
import {
  createExecutiveGraphAnalyzer,
  type CreateExecutiveGraphAnalyzerOptions,
  type ExecutiveGraphAnalyzerStack,
} from "@/lib/platform/intelligence/executive-graph";
import {
  createPredictiveIntelligence,
  type CreatePredictiveIntelligenceOptions,
  type PredictiveIntelligenceStack,
} from "@/lib/platform/intelligence/predictive-intelligence";

/** Wired Board & Governance Intelligence stack. */
export interface BoardGovernanceStack {
  service: GovernanceService;
  engine: BoardIntelligenceEngine;
  graphAnalyzer: ExecutiveGraphAnalyzerStack | null;
  decision: ExecutiveDecisionStack | null;
  predictive: PredictiveIntelligenceStack | null;
}

export interface CreateBoardGovernanceOptions
  extends BoardGovernanceDependencies {
  /** Attach / create an Executive Graph Analyzer for graphInput builds. */
  graphAnalyzer?: ExecutiveGraphAnalyzerStack;
  graphAnalyzerOptions?: CreateExecutiveGraphAnalyzerOptions;
  /** When true (default), auto-wire createExecutiveGraphAnalyzer if not provided. */
  wireGraphAnalyzer?: boolean;
  /** Attach / create Executive Decision Intelligence. */
  decision?: ExecutiveDecisionStack;
  decisionOptions?: CreateExecutiveDecisionOptions;
  /** When true (default), auto-wire createExecutiveDecisionIntelligence if not provided. */
  wireDecision?: boolean;
  /** Attach / create Predictive Intelligence. */
  predictive?: PredictiveIntelligenceStack;
  predictiveOptions?: CreatePredictiveIntelligenceOptions;
  /** When true (default), auto-wire createPredictiveIntelligence if not provided. */
  wirePredictive?: boolean;
}

/**
 * Create a fully wired Board & Governance Intelligence stack (DI entry point).
 */
export function createBoardGovernanceIntelligence(
  options: CreateBoardGovernanceOptions = {}
): BoardGovernanceStack {
  const wireGraph = options.wireGraphAnalyzer !== false;
  const wireDecision = options.wireDecision !== false;
  const wirePredictive = options.wirePredictive !== false;

  const graphAnalyzer =
    options.graphAnalyzer ??
    (wireGraph
      ? createExecutiveGraphAnalyzer(options.graphAnalyzerOptions ?? {})
      : null);

  const decision =
    options.decision ??
    (wireDecision
      ? createExecutiveDecisionIntelligence({
          ...(options.decisionOptions ?? {}),
          graphAnalyzer:
            options.decisionOptions?.graphAnalyzer ?? graphAnalyzer ?? undefined,
          wireGraphAnalyzer: false,
        })
      : null);

  const predictive =
    options.predictive ??
    (wirePredictive
      ? createPredictiveIntelligence({
          ...(options.predictiveOptions ?? {}),
          graphAnalyzer:
            options.predictiveOptions?.graphAnalyzer ??
            graphAnalyzer ??
            undefined,
          decision:
            options.predictiveOptions?.decision ?? decision ?? undefined,
          wireGraphAnalyzer: false,
          wireDecision: false,
        })
      : null);

  const buildAndAnalyze =
    options.buildAndAnalyze ??
    (graphAnalyzer
      ? (input?: Parameters<ExecutiveGraphAnalyzerStack["buildAndAnalyze"]>[0]) =>
          graphAnalyzer.buildAndAnalyze(input)
      : undefined);

  const engine = new BoardIntelligenceEngine({
    ...options,
    buildAndAnalyze,
  });

  const service = new GovernanceService({
    ...options,
    engine,
    buildAndAnalyze,
  });

  return {
    service,
    engine,
    graphAnalyzer,
    decision,
    predictive,
  };
}
