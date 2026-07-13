/**
 * Generate Sprint 055 Systems Intelligence package (domain-correct sources).
 * Run: node scripts/generate-systems-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/systems");
const w = (name, content) => {
  fs.mkdirSync(DEST, { recursive: true });
  fs.writeFileSync(path.join(DEST, name), content, "utf8");
};

const AREAS = [
  ["system_mapping", "SystemMappingIntelligence", ["System map clarity", "System map blind spot"], "System Mapping"],
  ["dependency_analysis", "DependencyAnalysisIntelligence", ["Dependency clarity signal", "Hidden dependency hotspot"], "Dependency Analysis"],
  ["feedback_loop_analysis", "FeedbackLoopAnalysisIntelligence", ["Feedback loop stability", "Feedback instability hotspot"], "Feedback Loop Analysis"],
  ["constraint_identification", "ConstraintIdentificationIntelligence", ["Constraint clarity", "Constraint lock hotspot"], "Constraint Identification"],
  ["bottleneck_detection", "BottleneckDetectionIntelligence", ["Bottleneck visibility", "Bottleneck saturation hotspot"], "Bottleneck Detection"],
  ["flow_optimization", "FlowOptimizationIntelligence", ["Flow efficiency signal", "Flow collapse hotspot"], "Flow Optimization"],
  ["emergent_behavior", "EmergentBehaviorIntelligence", ["Emergent pattern signal", "Emergent dysfunction hotspot"], "Emergent Behavior"],
  ["network_dynamics", "NetworkDynamicsIntelligence", ["Network dynamics strength", "Network shock hotspot"], "Network Dynamics"],
  ["organizational_complexity", "OrganizationalComplexityIntelligence", ["Complexity manageability", "Complexity overload hotspot"], "Organizational Complexity"],
  ["interdependency_modeling", "InterdependencyModelingIntelligence", ["Interdependency clarity", "Interdependency shock hotspot"], "Interdependency Modeling"],
  ["cascading_risk", "CascadingRiskIntelligence", ["Cascade containment", "Cascade failure hotspot"], "Cascading Risk"],
  ["system_stability", "SystemStabilityIntelligence", ["System stability signal", "Stability erosion hotspot"], "System Stability"],
  ["leverage_point_identification", "LeveragePointIdentificationIntelligence", ["Leverage clarity", "Leverage misapplication hotspot"], "Leverage Point Identification"],
  ["resource_flow", "ResourceFlowIntelligence", ["Resource flow health", "Resource flow collapse"], "Resource Flow"],
  ["adaptive_capacity", "AdaptiveCapacityIntelligence", ["Adaptive capacity strength", "Adaptive capacity loss"], "Adaptive Capacity"],
  ["system_evolution", "SystemEvolutionIntelligence", ["Evolution readiness", "Evolution stall hotspot"], "System Evolution"],
  ["scenario_interaction", "ScenarioInteractionIntelligence", ["Scenario interaction clarity", "Scenario interaction blind spot"], "Scenario Interaction"],
];

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const snakeToPascal = (s) => snakeToCamel(s).replace(/^[a-z]/, (c) => c.toUpperCase());

// --- area-factory + area files ---
w("area-factory.ts", `import type { SystemsAreaIntelligence } from "@/lib/platform/intelligence/systems/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/systems/models";
import type { SystemsArea, SystemsAreaSuite } from "@/lib/platform/intelligence/systems/types";

export function createAreaIntelligence(
  area: SystemsArea,
  titles: [string, string],
  forceLabel: string,
): new () => SystemsAreaIntelligence {
  return class implements SystemsAreaIntelligence {
    assess(input: Parameters<SystemsAreaIntelligence["assess"]>[0]): SystemsAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("sys-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: \`\${item.title} reading \${Math.round(value)}.\`,
          evidence: [\`baseline:\${area}\`, \`indicator:\${area}:current\`],
          lenses: buildLens({
            dependencyImpact: \`Dependency impact linked to \${area} at \${Math.round(value)}.\`,
            bottleneckRisk: \`Bottleneck risk implications of \${area} conditions.\`,
            feedbackStability: \`Feedback stability surrounding \${area}.\`,
            systemComplexity: \`System complexity reading for \${area}.\`,
            resourceFlow: \`Resource flow associated with \${area}.\`,
            cascadingRisk: \`Cascading risk reading for \${area}.\`,
            adaptability: \`Adaptability around \${area}.\`,
            longTermSystemHealth: \`Long-term system health for \${area} developments.\`,
          }),
          narrative: \`\${item.title} score \${Math.round(value)}.\`,
        };
      });
      return {
        area,
        records,
        score,
        favorableCount: records.filter(r => r.status === "favorable").length,
        atRiskCount: records.filter(r => r.status === "at_risk").length,
        narrative: \`\${forceLabel} systems score \${Math.round(score)}.\`,
      };
    }
  };
}
`);

for (const [area, cls, titles, label] of AREAS) {
  const file = area.replaceAll("_", "-") + "-intelligence.ts";
  w(file, `import { createAreaIntelligence } from "@/lib/platform/intelligence/systems/area-factory";
export class ${cls} extends createAreaIntelligence("${area}", ["${titles[0]}", "${titles[1]}"], "${label}") {}
`);
}

// --- types.ts ---
const areaScoreFields = AREAS.map(([a]) => `  ${snakeToCamel(a)}Score: SystemsScore;`).join("\n");
const areaList = AREAS.map(([a]) => `"${a}"`).join(", ");
const capExtra = [
  "systems_analysis", "dependency_analysis_engine", "feedback_loop_analysis_engine",
  "constraint_analysis", "bottleneck_analysis", "network_dynamics_analysis",
  "systems_trends", "systems_forecasts", "scenario_planning", "early_warning",
  "recommendation_generation", "knowledge_contribution", "closed_learning_loop",
];
const caps = [...AREAS.map(([a]) => a), ...capExtra].map(c => `"${c}"`).join(", ");

w("types.ts", `import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const SYSTEMS_INTELLIGENCE_VERSION = "0.1.0";
export const SYSTEMS_CAPABILITIES = [
  ${caps},
] as const;
export const SYSTEMS_AREAS = [
  ${areaList},
] as const;
export const SYSTEMS_SCENARIOS = [
  "cascade_failure", "bottleneck_saturation", "feedback_instability", "constraint_lock",
  "complexity_overload", "dependency_shock", "flow_collapse", "adaptive_capacity_loss",
  "leverage_misapplication", "emergent_dysfunction",
] as const;
export const SYSTEMS_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "dependency_impact", "bottleneck_risk", "feedback_stability",
  "system_complexity", "resource_flow", "cascading_risk", "adaptability", "leverage_points", "early_warning",
] as const;
export const SYSTEMS_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const SYSTEMS_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const SYSTEMS_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const SYSTEMS_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const SYSTEMS_OUTLOOKS = ["stable", "adaptive", "constrained", "volatile", "uncertain"] as const;

export type SystemsCapability = typeof SYSTEMS_CAPABILITIES[number];
export type SystemsArea = typeof SYSTEMS_AREAS[number];
export type SystemsScenarioKind = typeof SYSTEMS_SCENARIOS[number];
export type SystemsAnalysisKind = typeof SYSTEMS_ANALYSIS_KINDS[number];
export type SystemsHealthStatus = typeof SYSTEMS_HEALTH_STATUSES[number];
export type SystemsPriorityBand = typeof SYSTEMS_PRIORITY_BANDS[number];
export type SystemsArtifactStatus = typeof SYSTEMS_ARTIFACT_STATUSES[number];
export type SystemsConfidenceLevel = typeof SYSTEMS_CONFIDENCE_LEVELS[number];
export type SystemsOutlook = typeof SYSTEMS_OUTLOOKS[number];
export type SystemsMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every systems recommendation answers these eight leadership questions. */
export interface SystemsLens {
  dependencyImpact: string;
  bottleneckRisk: string;
  feedbackStability: string;
  systemComplexity: string;
  resourceFlow: string;
  cascadingRisk: string;
  adaptability: string;
  longTermSystemHealth: string;
}

export interface SystemsScore { key: string; label: string; value: number; status: SystemsHealthStatus; band: SystemsPriorityBand; narrative: string; }
export interface SystemsConfidenceScore { value: number; level: SystemsConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface OperationsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  throughputScore?: { value?: number };
}
export interface LegalComplianceRiskResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  legalRiskScore?: { value?: number };
  complianceScore?: { value?: number };
}
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface EconomicResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  economicScore?: { value?: number };
}
export interface BehavioralResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  decisionBehaviorScore?: { value?: number };
  collaborationScore?: { value?: number };
}
export interface EthicalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  fairnessScore?: { value?: number };
  accountabilityScore?: { value?: number };
}
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }

export interface SystemsBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<SystemsArea, number>;
  dependencyImpact: number;
  bottleneckRisk: number;
  feedbackStability: number;
  systemComplexity: number;
  resourceFlow: number;
  cascadingRisk: number;
  adaptability: number;
  longTermSystemHealth: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface SystemsAreaRecord {
  id: string; area: SystemsArea; title: string; score: number; status: SystemsArtifactStatus;
  signal: string; evidence: string[]; lenses: SystemsLens; narrative: string;
}
export interface SystemsAreaSuite {
  area: SystemsArea; records: SystemsAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface SystemsTrendRecord {
  id: string; area: SystemsArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: SystemsConfidenceLevel; lenses: SystemsLens; narrative: string;
}
export interface SystemsTrendSuite { trends: SystemsTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface SystemsForecastRecord {
  id: string; area: SystemsArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: SystemsConfidenceLevel; lenses: SystemsLens; narrative: string;
}
export interface SystemsForecastSuite {
  forecasts: SystemsForecastRecord[]; outlook: SystemsOutlook;
  maturityScore: number; narrative: string;
}

export interface SystemsScenarioRecord {
  id: string; kind: SystemsScenarioKind; title: string; probability: number;
  severity: SystemsPriorityBand; organizationalImpact: number;
  dependencyImpact: number; cascadingImpact: number; monitors: string[];
  lenses: SystemsLens; narrative: string;
}
export interface SystemsScenarioSuite {
  scenarios: SystemsScenarioRecord[]; primaryScenario: SystemsScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface SystemsAnalysisRecord {
  id: string; kind: SystemsAnalysisKind; title: string; score: number;
  status: SystemsArtifactStatus; lenses: SystemsLens; narrative: string;
}
export interface SystemsAnalysisSuite {
  analyses: SystemsAnalysisRecord[]; kindsCovered: SystemsAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface DependencyRecord {
  id: string; title: string; strength: number; lenses: SystemsLens; narrative: string;
}
export interface DependencySuite {
  records: DependencyRecord[]; score: number; dependencyIndex: number; narrative: string;
}

export interface FeedbackLoopRecord {
  id: string; title: string; stability: number; lenses: SystemsLens; narrative: string;
}
export interface FeedbackLoopSuite {
  records: FeedbackLoopRecord[]; score: number; feedbackIndex: number; narrative: string;
}

export interface ConstraintRecord {
  id: string; title: string; tightness: number; lenses: SystemsLens; narrative: string;
}
export interface ConstraintSuite {
  records: ConstraintRecord[]; score: number; constraintIndex: number; narrative: string;
}

export interface BottleneckRecord {
  id: string; title: string; saturation: number; lenses: SystemsLens; narrative: string;
}
export interface BottleneckSuite {
  records: BottleneckRecord[]; score: number; bottleneckIndex: number; narrative: string;
}

export interface NetworkDynamicsRecord {
  id: string; title: string; dynamics: number; lenses: SystemsLens; narrative: string;
}
export interface NetworkDynamicsSuite {
  records: NetworkDynamicsRecord[]; score: number; networkIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: SystemsPriorityBand; source: string;
  score: number; lenses: SystemsLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface SystemsKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: SystemsMetadata;
}
export interface SystemsKnowledgeContribution {
  artifacts: SystemsKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"operations" | "legal-compliance-risk" | "predictive" | "executive-decision" | "economic" | "behavioral" | "opportunity">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface SystemsRecommendationRecord {
  id: string; title: string; priority: SystemsPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: SystemsLens; narrative: string;
}
export interface SystemsRiskRecord {
  id: string; title: string; area: SystemsArea; severity: SystemsPriorityBand;
  score: number; mitigation: string; lenses: SystemsLens; narrative: string;
}
export interface SystemsOpportunityRecord {
  id: string; title: string; area: SystemsArea; priority: SystemsPriorityBand;
  score: number; lenses: SystemsLens; narrative: string;
}

export interface SystemsDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<SystemsArea, number>; outlook: SystemsOutlook;
  dependencyImpact: number; bottleneckRisk: number; adaptability: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface DependencyMapDashboard {
  generatedAt: string; headline: string; score: number;
  dependencyIndex: number; signals: string[]; narrative: string;
}
export interface FeedbackLoopsDashboard {
  generatedAt: string; headline: string; score: number;
  feedbackIndex: number; signals: string[]; narrative: string;
}
export interface BottlenecksDashboard {
  generatedAt: string; headline: string; score: number;
  bottleneckIndex: number; signals: string[]; narrative: string;
}
export interface SystemHealthDashboard {
  generatedAt: string; headline: string; score: number;
  stabilityIndex: number; signals: string[]; narrative: string;
}
export interface ComplexityAnalysisDashboard {
  generatedAt: string; headline: string; score: number;
  complexityIndex: number; signals: string[]; narrative: string;
}
export interface AdaptiveCapacityDashboard {
  generatedAt: string; headline: string; score: number;
  adaptiveIndex: number; signals: string[]; narrative: string;
}
export interface SystemsForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: SystemsOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveSystemsBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: SystemsOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: SystemsLens; narrative: string;
}
export interface BoardSystemsReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: SystemsOutlook; dependencyScore: number;
  bottleneckScore: number; adaptiveScore: number; recommendations: string[];
  lenses: SystemsLens; narrative: string;
}
export interface SystemsHealthScore {
  overallScore: number; status: SystemsHealthStatus; outlook: SystemsOutlook;
  areaScores: Record<SystemsArea, number>; dependencyScore: number;
  bottleneckScore: number; adaptiveScore: number; complexityScore: number;
  forecastScore: number; scenarioScore: number; lenses: SystemsLens; narrative: string;
}
export interface SystemsReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: SystemsConfidenceScore; narrative: string;
}
export interface SystemsProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<SystemsArea, number>; outlook: SystemsOutlook;
  forecast: number; dashboard: SystemsDashboard; brief: ExecutiveSystemsBrief;
  overallConfidence: SystemsConfidenceScore;
}
export interface SystemsHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: SystemsArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: SystemsMetadata;
}
export interface SystemsPublisher { domain: string; capability: string; }
export interface SystemsQueryRequest {
  question: string;
  focus?: "general" | SystemsArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface SystemsQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: SystemsConfidenceScore;
}

export interface SystemsRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  operationsResult?: OperationsResultLight;
  legalComplianceRiskResult?: LegalComplianceRiskResultLight;
  predictiveResult?: PredictiveResultLight;
  decisionResult?: DecisionResultLight;
  economicResult?: EconomicResultLight;
  behavioralResult?: BehavioralResultLight;
  ethicalResult?: EthicalResultLight;
  opportunityResult?: OpportunityResultLight;
  baselineOverrides?: Partial<SystemsBaseline>; metadata?: SystemsMetadata;
}

export interface SystemsResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: SystemsBaseline;
  healthScore: SystemsScore;
${areaScoreFields}
  forecastScore: SystemsScore; scenarioScore: SystemsScore; analysisScore: SystemsScore;
  earlyWarningScore: SystemsScore;
  dependencyScore: SystemsScore; feedbackLoopScore: SystemsScore;
  bottleneckScore: SystemsScore; networkDynamicsScore: SystemsScore; constraintScore: SystemsScore;
  health: SystemsHealthScore; dashboard: SystemsDashboard;
  dependencyMapDashboard: DependencyMapDashboard;
  feedbackLoopsDashboard: FeedbackLoopsDashboard;
  bottlenecksDashboard: BottlenecksDashboard;
  systemHealthDashboard: SystemHealthDashboard;
  complexityAnalysisDashboard: ComplexityAnalysisDashboard;
  adaptiveCapacityDashboard: AdaptiveCapacityDashboard;
  forecastDashboard: SystemsForecastDashboard;
  brief: ExecutiveSystemsBrief; boardReport: BoardSystemsReport;
  recommendations: SystemsRecommendationRecord[]; risks: SystemsRiskRecord[];
  opportunities: SystemsOpportunityRecord[];
  areaSuites: Record<SystemsArea, SystemsAreaSuite>;
  trendSuite: SystemsTrendSuite; forecastSuite: SystemsForecastSuite;
  scenarioSuite: SystemsScenarioSuite; analysisSuite: SystemsAnalysisSuite;
  dependencySuite: DependencySuite;
  feedbackLoopSuite: FeedbackLoopSuite;
  constraintSuite: ConstraintSuite;
  bottleneckSuite: BottleneckSuite;
  networkDynamicsSuite: NetworkDynamicsSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: SystemsKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: SystemsReasoningResult; projection: SystemsProjectionResult;
  historyRecord: SystemsHistoryRecord; confidence: SystemsConfidenceScore;
  requestMetadata: SystemsMetadata;
}
`);

// --- contracts.ts ---
w("contracts.ts", `import type * as T from "@/lib/platform/intelligence/systems/types";

export interface SystemsIntelligenceEngine { build(request: T.SystemsRequest): T.SystemsResult; }
export type SystemsEngine = SystemsIntelligenceEngine;
export interface SystemsAreaIntelligence {
  assess(input: { baseline: T.SystemsBaseline; now: Date; createId: (prefix: string) => string }): T.SystemsAreaSuite;
}
export interface SystemsForecastEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.SystemsForecastSuite;
}
export interface SystemsScenarioEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; forecasts: T.SystemsForecastSuite; now: Date; createId: (prefix: string) => string }): T.SystemsScenarioSuite;
}
export interface SystemsTrendEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.SystemsTrendSuite;
}
export interface SystemsAnalysisEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; forecasts: T.SystemsForecastSuite; scenarios: T.SystemsScenarioSuite; now: Date; createId: (prefix: string) => string }): T.SystemsAnalysisSuite;
}
export interface DependencyEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.DependencySuite;
}
export interface FeedbackLoopEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.FeedbackLoopSuite;
}
export interface ConstraintEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ConstraintSuite;
}
export interface BottleneckEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.BottleneckSuite;
}
export interface NetworkDynamicsEngineContract {
  assess(input: { baseline: T.SystemsBaseline; areas: Record<T.SystemsArea, T.SystemsAreaSuite>; now: Date; createId: (prefix: string) => string }): T.NetworkDynamicsSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.SystemsBaseline; trends: T.SystemsTrendSuite; scenarios: T.SystemsScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface SystemsReasonerContract {
  reason(input: { request: T.SystemsRequest; trends: T.SystemsTrendSuite; forecasts: T.SystemsForecastSuite; scenarios: T.SystemsScenarioSuite; confidence: T.SystemsConfidenceScore }): T.SystemsReasoningResult;
}
export interface SystemsRepository {
  save(result: T.SystemsResult): T.SystemsResult;
  get(requestId: string): T.SystemsResult | null;
  list(scope?: Partial<T.GraphScope>): T.SystemsResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.SystemsHistoryRecord): T.SystemsHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.SystemsHistoryRecord[];
  clear(): void;
}
export interface SystemsRegistry {
  register(domain: string, capability: string): void;
  list(): T.SystemsPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface SystemsIntelligenceService {
  build(request: T.SystemsRequest): T.SystemsResult;
  query(result: T.SystemsResult, request: T.SystemsQueryRequest): T.SystemsQueryResult;
  repository(): SystemsRepository;
}
export type SystemsService = SystemsIntelligenceService;
export interface SystemsDependencies {
  engine?: SystemsIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.SystemsArea, SystemsAreaIntelligence>>;
  forecastEngine?: SystemsForecastEngineContract;
  scenarioEngine?: SystemsScenarioEngineContract;
  trendEngine?: SystemsTrendEngineContract;
  analysisEngine?: SystemsAnalysisEngineContract;
  dependencyEngine?: DependencyEngineContract;
  feedbackLoopEngine?: FeedbackLoopEngineContract;
  constraintEngine?: ConstraintEngineContract;
  bottleneckEngine?: BottleneckEngineContract;
  networkDynamicsEngine?: NetworkDynamicsEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: SystemsReasonerContract;
  repository?: SystemsRepository;
  registry?: SystemsRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
`);

// --- models.ts ---
w("models.ts", `import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  SystemsBaseline, SystemsConfidenceLevel, SystemsConfidenceScore,
  SystemsHealthStatus, SystemsLens, SystemsOutlook, SystemsPriorityBand,
  SystemsRequest,
} from "@/lib/platform/intelligence/systems/types";
import { SYSTEMS_AREAS } from "@/lib/platform/intelligence/systems/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): SystemsHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): SystemsPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): SystemsConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): SystemsOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 78) return "adaptive"; if (score >= 62) return "stable"; if (score >= 45) return "constrained"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): SystemsConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(partial: Partial<SystemsLens> = {}): SystemsLens {
  return {
    dependencyImpact: partial.dependencyImpact ?? "Dependency impact requires confirmation.",
    bottleneckRisk: partial.bottleneckRisk ?? "Bottleneck risk requires confirmation.",
    feedbackStability: partial.feedbackStability ?? "Feedback stability requires confirmation.",
    systemComplexity: partial.systemComplexity ?? "System complexity requires confirmation.",
    resourceFlow: partial.resourceFlow ?? "Resource flow requires confirmation.",
    cascadingRisk: partial.cascadingRisk ?? "Cascading risk requires confirmation.",
    adaptability: partial.adaptability ?? "Adaptability requires confirmation.",
    longTermSystemHealth: partial.longTermSystemHealth ?? "Long-term system health requires confirmation.",
  };
}
export const defaultCreateId = (prefix: string) => \`\${prefix}-\${Math.random().toString(36).slice(2, 10)}\`;
export const defaultPeriodLabel = (now = new Date()) => now.toISOString().slice(0, 7);
export const emptySystemsScope = (): GraphScope => ({ organizationId: null, schoolId: null });

export function defaultSystemsBaseline(): SystemsBaseline {
  const areaScores = Object.fromEntries(SYSTEMS_AREAS.map(a => [a, 68])) as SystemsBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    dependencyImpact: 68,
    bottleneckRisk: 68,
    feedbackStability: 68,
    systemComplexity: 68,
    resourceFlow: 68,
    cascadingRisk: 68,
    adaptability: 68,
    longTermSystemHealth: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = (value: unknown, fallback: number) =>
  typeof value === "number" ? clamp(value <= 1 ? value * 100 : value) : fallback;

export function deriveSystemsBaseline(request: SystemsRequest): SystemsBaseline {
  const base = defaultSystemsBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const operations = lightScore(request.operationsResult?.healthScore?.value ?? request.operationsResult?.throughputScore?.value, 70);
  const legal = lightScore(request.legalComplianceRiskResult?.healthScore?.value, 70);
  const legalCompliance = lightScore(request.legalComplianceRiskResult?.complianceScore?.value, legal);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const economic = lightScore(request.economicResult?.economicScore?.value ?? request.economicResult?.healthScore?.value, 70);
  const behavioral = lightScore(request.behavioralResult?.healthScore?.value, 70);
  const ethical = lightScore(request.ethicalResult?.healthScore?.value, 70);
  const ethicalFairness = lightScore(request.ethicalResult?.fairnessScore?.value, ethical);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);

  const areaScores = { ...base.areaScores };
  areaScores.system_mapping = clamp((operations + decision + ethical) / 3);
  areaScores.dependency_analysis = clamp((operations + economic + decision) / 3);
  areaScores.feedback_loop_analysis = clamp((behavioral + ethical + operations) / 3);
  areaScores.constraint_identification = clamp((legal + legalCompliance + operations) / 3);
  areaScores.bottleneck_detection = clamp((operations + economic + predictive) / 3);
  areaScores.flow_optimization = clamp((operations + opportunity + decision) / 3);
  areaScores.emergent_behavior = clamp((behavioral + ethical + predictive) / 3);
  areaScores.network_dynamics = clamp((operations + behavioral + economic) / 3);
  areaScores.organizational_complexity = clamp((decision + ethical + legal) / 3);
  areaScores.interdependency_modeling = clamp((areaScores.dependency_analysis + areaScores.network_dynamics + decision) / 3);
  areaScores.cascading_risk = clamp(100 - ((100 - areaScores.bottleneck_detection) * .35 + (100 - areaScores.dependency_analysis) * .35 + (100 - ethicalFairness) * .3));
  areaScores.system_stability = clamp((areaScores.feedback_loop_analysis + areaScores.system_mapping + ethical) / 3);
  areaScores.leverage_point_identification = clamp((decision + opportunity + areaScores.system_mapping) / 3);
  areaScores.resource_flow = clamp((operations + economic + opportunity) / 3);
  areaScores.adaptive_capacity = clamp((behavioral + predictive + opportunity) / 3);
  areaScores.system_evolution = clamp((predictive + opportunity + areaScores.adaptive_capacity) / 3);
  areaScores.scenario_interaction = clamp((predictive + areaScores.cascading_risk + decision) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    dependencyImpact: clamp(areaScores.dependency_analysis),
    bottleneckRisk: clamp(areaScores.bottleneck_detection),
    feedbackStability: clamp(areaScores.feedback_loop_analysis),
    systemComplexity: clamp(areaScores.organizational_complexity),
    resourceFlow: clamp(areaScores.resource_flow),
    cascadingRisk: clamp(areaScores.cascading_risk),
    adaptability: clamp(areaScores.adaptive_capacity),
    longTermSystemHealth: clamp((areaScores.system_stability + areaScores.adaptive_capacity + predictive) / 3),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.scenario_interaction) / 2),
    evidenceCoverage: clamp((operations + ethical + legal + behavioral) / 4),
    ...request.baselineOverrides,
  };
}

export const systemsModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptySystemsScope,
  defaultSystemsBaseline, deriveSystemsBaseline,
};
export class SystemsModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveSystemsBaseline;
  static baseline = defaultSystemsBaseline; static outlook = outlookFromScore;
}
`);

console.log("Core types/models/areas written. Continuing engines...");
