/**
 * JAG Intelligence — Phase 1 foundation public API.
 *
 * Shared cognitive services for the autonomous intelligence layer.
 * See `docs/architecture/JAG_INTELLIGENCE_ARCHITECTURE.md`.
 */

export * from "@/lib/platform/intelligence/types";
export * from "@/lib/platform/intelligence/context";
export * from "@/lib/platform/intelligence/context/builder";
export * from "@/lib/platform/intelligence/context/cache";
export * from "@/lib/platform/intelligence/context/executive-context";
export * from "@/lib/platform/intelligence/context/finance-context";
export * from "@/lib/platform/intelligence/context/student-context";
export * from "@/lib/platform/intelligence/context/organization-context";
export * from "@/lib/platform/intelligence/memory";
export * from "@/lib/platform/intelligence/memory/index";
export * from "@/lib/platform/intelligence/reasoning";
export * from "@/lib/platform/intelligence/planner";
export * from "@/lib/platform/intelligence/execution";
export * from "@/lib/platform/intelligence/knowledge";
export * from "@/lib/platform/intelligence/confidence";
export * from "@/lib/platform/intelligence/learning";
export * from "@/lib/platform/intelligence/case-engine";
export * from "@/lib/platform/intelligence/events";
export * from "@/lib/platform/intelligence/explain";
export * from "@/lib/platform/intelligence/orchestrator";
export * from "@/lib/platform/intelligence/contracts";
export * from "@/lib/platform/intelligence/registry";
export * from "@/lib/platform/intelligence/router";
export * from "@/lib/platform/intelligence/service";
export * from "@/lib/platform/intelligence/create-service";
export * from "@/lib/platform/intelligence/domains/support";
export * from "@/lib/platform/intelligence/domains/executive";
export * from "@/lib/platform/intelligence/domains/strategic";
export * from "@/lib/platform/intelligence/decision";
export * from "@/lib/platform/intelligence/organization";
export {
  EXECUTIVE_GRAPH_ANALYZER_VERSION,
  createExecutiveGraphAnalyzer,
  GraphAnalyzer,
  GraphBuilder,
  GraphRepository,
  RootCauseAnalyzer,
  DependencyAnalyzer,
  CascadeAnalyzer,
  RiskPropagation,
  ExecutiveReasoner,
  OpportunityEngine,
  ConstraintEngine,
  CriticalityScore,
  ExecutivePriority as ExecutiveGraphPriorityRanker,
  ConfidenceScore as ExecutiveGraphConfidenceScorer,
  ExecutiveQueries,
  GraphSearch,
  DashboardProjection as ExecutiveGraphDashboardProjector,
} from "@/lib/platform/intelligence/executive-graph";
export type {
  CreateExecutiveGraphAnalyzerOptions,
  ExecutiveGraphAnalyzerStack,
  Graph as ExecutiveReasoningGraph,
  GraphNode as ExecutiveReasoningGraphNode,
  GraphEdge as ExecutiveReasoningGraphEdge,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph";
export {
  EXECUTIVE_DECISION_INTELLIGENCE_VERSION,
  createExecutiveDecisionIntelligence,
  createPresetScenario,
  DecisionEngine,
  ExecutiveDecisionService,
  ScenarioSimulator,
  RecommendationEngine,
  StrategyEngine,
  TradeoffAnalyzer,
  ImpactForecast,
  DecisionConfidence,
  DecisionHistory,
  ScenarioRepository,
  DecisionQueries,
  DecisionScoring,
  DecisionProjection,
  decisionModels,
} from "@/lib/platform/intelligence/executive-decision";
export type {
  CreateExecutiveDecisionOptions,
  ExecutiveDecisionStack,
  ExecutiveDecisionRequest,
  ExecutiveDecisionResult,
  ExecutiveDecisionRecommendation,
  DecisionScenarioDefinition,
  ScenarioSimulationResult,
  DecisionProjectionResult,
} from "@/lib/platform/intelligence/executive-decision";
export {
  PREDICTIVE_INTELLIGENCE_VERSION,
  createPredictiveIntelligence,
  createForecastScenario,
  PredictionEngine,
  PredictionService,
  ForecastEngine,
  TrendAnalyzer,
  ForecastRepository,
  ForecastQueries,
  ForecastProjection,
  PredictionConfidence,
  ForecastScoring,
  ForecastHistory,
  predictionModels,
} from "@/lib/platform/intelligence/predictive-intelligence";
export type {
  CreatePredictiveIntelligenceOptions,
  PredictiveIntelligenceStack,
  PredictionRequest,
  PredictionResult,
  ForecastScenarioDefinition,
  ForecastProjectionResult,
  ScenarioForecast,
  DomainForecast,
} from "@/lib/platform/intelligence/predictive-intelligence";
export {
  BOARD_GOVERNANCE_INTELLIGENCE_VERSION,
  createBoardGovernanceIntelligence,
  BoardIntelligenceEngine,
  GovernanceService,
  GovernanceEngine,
  BoardPacketGenerator,
  ExecutiveBriefGenerator,
  CommitteeReporting,
  StrategicInitiativeTracker,
  GovernanceDashboard,
  BoardKPIDashboard,
  RiskRegister,
  ComplianceMonitor,
  ExecutiveScorecards,
  ResolutionTracker,
  GovernanceCalendar,
  BoardQueries,
  GovernanceProjection,
  GovernanceRepository,
  governanceModels,
} from "@/lib/platform/intelligence/board-governance";
export type {
  CreateBoardGovernanceOptions,
  BoardGovernanceStack,
  GovernanceRequest,
  GovernanceResult,
  BoardPacket,
  BoardPacketKind,
  ExecutiveBrief,
  GovernanceDashboardView,
  BoardKpiDashboardView,
} from "@/lib/platform/intelligence/board-governance";
export {
  INTELLIGENCE_PLATFORM_VERSION,
  createIntelligencePlatform,
  createIntelligenceRegistry,
  createIntelligencePipeline,
  createDefaultIntelligenceModules,
  IntelligenceRegistry,
  IntelligencePipeline,
  IntelligenceCache,
  IntelligenceMetrics,
  IntelligenceTelemetry,
  IntelligenceLifecycle,
  IntelligenceScheduler,
  IntelligenceConfiguration,
  IntelligenceHealth,
  IntelligenceDiagnostics,
  IntelligenceVersioning,
  IntelligenceEvents,
  IntelligenceProvider,
} from "@/lib/platform/intelligence/infrastructure";
export type {
  CreateIntelligencePlatformOptions,
  IntelligencePlatformStack,
  IntelligenceModule,
  IntelligenceExecutionRequest,
  IntelligencePipelineResult,
  IntelligencePlatformHealth,
  IntelligenceDiagnosticsReport,
} from "@/lib/platform/intelligence/infrastructure";
