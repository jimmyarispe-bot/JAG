/**
 * Generate Sprint 060 Wisdom Intelligence package (part 1: types + areas).
 * Run: node scripts/generate-wisdom-intelligence.mjs
 *
 * Final terminal synthesis layer after Collective Intelligence that unifies
 * judgment, trade-offs, uncertainty, and long-term impact into executive wisdom.
 * Hard DAG: ["collective"].
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/wisdom");
fs.mkdirSync(DEST, { recursive: true });
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");
const PKG = "@/lib/platform/intelligence/wisdom";

const AREAS = [
  ["executive_judgment", "ExecutiveJudgmentIntelligence", ["Executive judgment quality", "Judgment failure hotspot"], "Executive Judgment"],
  ["strategic_reasoning", "StrategicReasoningIntelligence", ["Strategic reasoning strength", "Strategic reasoning gap"], "Strategic Reasoning"],
  ["trade_off_analysis", "TradeOffAnalysisIntelligence", ["Trade-off analysis quality", "Trade-off paralysis hotspot"], "Trade Off Analysis"],
  ["long_term_thinking", "LongTermThinkingIntelligence", ["Long-term thinking strength", "Short-termism hotspot"], "Long Term Thinking"],
  ["cross_domain_synthesis", "CrossDomainSynthesisIntelligence", ["Cross-domain synthesis quality", "Cross-domain blindness risk"], "Cross Domain Synthesis"],
  ["decision_quality_assessment", "DecisionQualityAssessmentIntelligence", ["Decision quality assessment", "Decision quality erosion"], "Decision Quality Assessment"],
  ["uncertainty_analysis", "UncertaintyAnalysisIntelligence", ["Uncertainty analysis quality", "Uncertainty denial hotspot"], "Uncertainty Analysis"],
  ["confidence_calibration", "ConfidenceCalibrationIntelligence", ["Confidence calibration accuracy", "Confidence miscalibration risk"], "Confidence Calibration"],
  ["organizational_prioritization", "OrganizationalPrioritizationIntelligence", ["Organizational prioritization", "Priority misalignment hotspot"], "Organizational Prioritization"],
  ["mission_alignment", "MissionAlignmentIntelligence", ["Mission alignment strength", "Mission drift risk"], "Mission Alignment"],
  ["values_alignment", "ValuesAlignmentIntelligence", ["Values alignment strength", "Values conflict hotspot"], "Values Alignment"],
  ["ethical_judgment", "EthicalJudgmentIntelligence", ["Ethical judgment quality", "Ethical compromise hotspot"], "Ethical Judgment"],
  ["strategic_timing", "StrategicTimingIntelligence", ["Strategic timing quality", "Timing error hotspot"], "Strategic Timing"],
  ["opportunity_cost_analysis", "OpportunityCostAnalysisIntelligence", ["Opportunity cost analysis", "Opportunity cost blindness"], "Opportunity Cost Analysis"],
  ["executive_recommendation_validation", "ExecutiveRecommendationValidationIntelligence", ["Recommendation validation", "Validation gap risk"], "Executive Recommendation Validation"],
  ["organizational_judgment_evolution", "OrganizationalJudgmentEvolutionIntelligence", ["Judgment evolution strength", "Judgment stagnation risk"], "Organizational Judgment Evolution"],
  ["institutional_wisdom", "InstitutionalWisdomIntelligence", ["Institutional wisdom strength", "Institutional wisdom erosion"], "Institutional Wisdom"],
];

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const areaFile = (area) => area.replaceAll("_", "-") + "-intelligence";
const areaList = AREAS.map(([a]) => `"${a}"`).join(", ");
const areaScoreFields = AREAS.map(([a]) => `  ${snakeToCamel(a)}Score: WisdomScore;`).join("\n");
const capsExtra = [
  "wisdom_analysis", "strategic_reasoning_engine", "cross_domain_synthesis", "trade_off_analysis_engine",
  "uncertainty_analysis_engine", "executive_judgment_engine", "confidence_calibration_engine",
  "wisdom_trends", "wisdom_forecasts", "scenario_planning", "early_warning",
  "recommendation_generation", "knowledge_contribution", "closed_learning_loop",
];
const caps = [...AREAS.map(([a]) => a), ...capsExtra].map(c => `"${c}"`).join(", ");

w("area-factory.ts", `import type { WisdomAreaIntelligence } from "${PKG}/contracts";
import { buildLens, clamp } from "${PKG}/models";
import type { WisdomArea, WisdomAreaSuite } from "${PKG}/types";

export function createAreaIntelligence(
  area: WisdomArea,
  titles: [string, string],
  forceLabel: string,
): new () => WisdomAreaIntelligence {
  return class implements WisdomAreaIntelligence {
    assess(input: Parameters<WisdomAreaIntelligence["assess"]>[0]): WisdomAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("wis-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: \`\${item.title} reading \${Math.round(value)}.\`,
          evidence: [\`baseline:\${area}\`, \`indicator:\${area}:current\`],
          lenses: buildLens({
            strategicValue: \`Strategic value linked to \${area} at \${Math.round(value)}.\`,
            longTermImpact: \`Long-term impact implications of \${area} conditions.\`,
            confidenceLevel: \`Confidence level surrounding \${area}.\`,
            evidenceQuality: \`Evidence quality reading for \${area}.\`,
            tradeOffBalance: \`Trade-off balance associated with \${area}.\`,
            organizationalAlignment: \`Organizational alignment reading for \${area}.\`,
            ethicalIntegrity: \`Ethical integrity in \${area}.\`,
            wisdomScore: \`Wisdom score for \${area} developments.\`,
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
        narrative: \`\${forceLabel} wisdom intelligence score \${Math.round(score)}.\`,
      };
    }
  };
}
`);

for (const [area, cls, titles, label] of AREAS) {
  w(areaFile(area) + ".ts", `import { createAreaIntelligence } from "${PKG}/area-factory";
export class ${cls} extends createAreaIntelligence("${area}", ["${titles[0]}", "${titles[1]}"], "${label}") {}
`);
}

w("types.ts", `import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const WISDOM_INTELLIGENCE_VERSION = "0.1.0";
export const WISDOM_CAPABILITIES = [
  ${caps},
] as const;
export const WISDOM_AREAS = [
  ${areaList},
] as const;
export const WISDOM_SCENARIOS = [
  "judgment_failure", "trade_off_paralysis", "confidence_miscalibration", "short_termism",
  "cross_domain_blindness", "ethical_compromise", "timing_error", "opportunity_cost_blindness",
  "uncertainty_denial", "institutional_wisdom_erosion",
] as const;
export const WISDOM_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "strategic_value", "long_term_impact", "confidence_level",
  "evidence_quality", "trade_off_balance", "organizational_alignment", "ethical_integrity",
  "wisdom_score", "early_warning",
] as const;
export const WISDOM_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const WISDOM_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const WISDOM_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const WISDOM_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const WISDOM_OUTLOOKS = ["wise", "stable", "shortsighted", "volatile", "uncertain"] as const;

export type WisdomCapability = typeof WISDOM_CAPABILITIES[number];
export type WisdomArea = typeof WISDOM_AREAS[number];
export type WisdomScenarioKind = typeof WISDOM_SCENARIOS[number];
export type WisdomAnalysisKind = typeof WISDOM_ANALYSIS_KINDS[number];
export type WisdomHealthStatus = typeof WISDOM_HEALTH_STATUSES[number];
export type WisdomPriorityBand = typeof WISDOM_PRIORITY_BANDS[number];
export type WisdomArtifactStatus = typeof WISDOM_ARTIFACT_STATUSES[number];
export type WisdomConfidenceLevel = typeof WISDOM_CONFIDENCE_LEVELS[number];
export type WisdomOutlook = typeof WISDOM_OUTLOOKS[number];
export type WisdomMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every wisdom recommendation answers these eight leadership questions. */
export interface WisdomLens {
  strategicValue: string;
  longTermImpact: string;
  confidenceLevel: string;
  evidenceQuality: string;
  tradeOffBalance: string;
  organizationalAlignment: string;
  ethicalIntegrity: string;
  wisdomScore: string;
}

/** Executive Judgment Framework: what leadership should do and why. */
export interface ExecutiveJudgmentFramework {
  whatLeadershipShouldDo: string;
  why: string;
  whyNow: string;
  whyNotAlternatives: string;
  risksRemaining: string;
  assumptions: string;
  evidence: string;
  expectedOutcome: string;
}

export interface WisdomScore { key: string; label: string; value: number; status: WisdomHealthStatus; band: WisdomPriorityBand; narrative: string; }
export interface WisdomConfidenceScore { value: number; level: WisdomConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
/** Soft-read of Sprint 059 Collective Intelligence. */
export interface CollectiveResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  collectiveConfidence?: number;
  baseline?: { collectiveConfidence?: number; collaborationQuality?: number; consensusStrength?: number };
}
export interface InstitutionalMemoryResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  institutionalMemoryScore?: { value?: number };
  baseline?: { knowledgeConfidence?: number; institutionalMemoryCoverage?: number; knowledgeQuality?: number };
}
export interface KnowledgeResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  knowledgeScore?: { value?: number };
  baseline?: { knowledgeConfidence?: number; knowledgeFreshness?: number; knowledgeQuality?: number };
}
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
export interface EthicalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  ethicalScore?: { value?: number };
}
export interface SystemsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  adaptability?: number;
  cascadingRisk?: number;
}
export interface ResilienceResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  adaptiveCapacity?: number;
}
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface BehavioralResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  behavioralScore?: { value?: number };
}
export interface CulturalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  culturalScore?: { value?: number };
}
export interface StakeholderResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  engagementScore?: { value?: number };
}
export interface EcosystemResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  ecosystemScore?: { value?: number };
}
export interface MarketResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  marketScore?: { value?: number };
}
export interface CompetitiveResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  competitiveScore?: { value?: number };
}
export interface EconomicResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  economicScore?: { value?: number };
}
export interface OperationsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  operationsScore?: { value?: number };
}
export interface HumanCapitalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  humanCapitalScore?: { value?: number };
}
export interface EnvironmentalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  environmentalScore?: { value?: number };
}
export interface PoliticalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  politicalScore?: { value?: number };
}
export interface ReputationResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  reputationScore?: { value?: number };
}

export interface WisdomBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<WisdomArea, number>;
  strategicValue: number;
  longTermImpact: number;
  confidenceLevel: number;
  evidenceQuality: number;
  tradeOffBalance: number;
  organizationalAlignment: number;
  ethicalIntegrity: number;
  wisdomScore: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface WisdomAreaRecord {
  id: string; area: WisdomArea; title: string; score: number; status: WisdomArtifactStatus;
  signal: string; evidence: string[]; lenses: WisdomLens; narrative: string;
}
export interface WisdomAreaSuite {
  area: WisdomArea; records: WisdomAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface WisdomTrendRecord {
  id: string; area: WisdomArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: WisdomConfidenceLevel; lenses: WisdomLens; narrative: string;
}
export interface WisdomTrendSuite { trends: WisdomTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface WisdomForecastRecord {
  id: string; area: WisdomArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: WisdomConfidenceLevel; lenses: WisdomLens; narrative: string;
}
export interface WisdomForecastSuite {
  forecasts: WisdomForecastRecord[]; outlook: WisdomOutlook;
  maturityScore: number; narrative: string;
}

export interface WisdomScenarioRecord {
  id: string; kind: WisdomScenarioKind; title: string; probability: number;
  severity: WisdomPriorityBand; organizationalImpact: number;
  judgmentImpact: number; timingImpact: number; monitors: string[];
  lenses: WisdomLens; narrative: string;
}
export interface WisdomScenarioSuite {
  scenarios: WisdomScenarioRecord[]; primaryScenario: WisdomScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface WisdomAnalysisRecord {
  id: string; kind: WisdomAnalysisKind; title: string; score: number;
  status: WisdomArtifactStatus; lenses: WisdomLens; narrative: string;
}
export interface WisdomAnalysisSuite {
  analyses: WisdomAnalysisRecord[]; kindsCovered: WisdomAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface StrategicReasoningRecord {
  id: string; title: string; reasoningIndex: number; lenses: WisdomLens; narrative: string;
}
export interface StrategicReasoningSuite {
  records: StrategicReasoningRecord[]; score: number; reasoningIndex: number; narrative: string;
}

export interface CrossDomainSynthesisRecord {
  id: string; title: string; synthesisIndex: number; lenses: WisdomLens; narrative: string;
}
export interface CrossDomainSynthesisSuite {
  records: CrossDomainSynthesisRecord[]; score: number; synthesisIndex: number; narrative: string;
}

export interface TradeOffRecord {
  id: string; title: string; balanceIndex: number; lenses: WisdomLens; narrative: string;
}
export interface TradeOffSuite {
  records: TradeOffRecord[]; score: number; balanceIndex: number; narrative: string;
}

export interface UncertaintyRecord {
  id: string; title: string; uncertaintyIndex: number; lenses: WisdomLens; narrative: string;
}
export interface UncertaintySuite {
  records: UncertaintyRecord[]; score: number; uncertaintyIndex: number; narrative: string;
}

export interface ExecutiveJudgmentRecord {
  id: string; title: string; judgmentIndex: number; lenses: WisdomLens;
  framework: ExecutiveJudgmentFramework; narrative: string;
}
export interface ExecutiveJudgmentSuite {
  records: ExecutiveJudgmentRecord[]; score: number; judgmentIndex: number;
  framework: ExecutiveJudgmentFramework; narrative: string;
}

export interface ConfidenceRecord {
  id: string; title: string; calibrationIndex: number; lenses: WisdomLens; narrative: string;
}
export interface ConfidenceSuite {
  records: ConfidenceRecord[]; score: number; calibrationIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: WisdomPriorityBand; source: string;
  score: number; lenses: WisdomLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface WisdomKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: WisdomMetadata;
}
export interface WisdomKnowledgeContribution {
  artifacts: WisdomKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"collective" | "institutional-memory" | "knowledge" | "executive-decision" | "opportunity" | "predictive" | "ethical">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface WisdomRecommendationRecord {
  id: string; title: string; priority: WisdomPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: WisdomLens; narrative: string;
}
export interface WisdomRiskRecord {
  id: string; title: string; area: WisdomArea; severity: WisdomPriorityBand;
  score: number; mitigation: string; lenses: WisdomLens; narrative: string;
}
export interface WisdomOpportunityRecord {
  id: string; title: string; area: WisdomArea; priority: WisdomPriorityBand;
  score: number; lenses: WisdomLens; narrative: string;
}

export interface WisdomDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<WisdomArea, number>; outlook: WisdomOutlook;
  strategicValue: number; longTermImpact: number; wisdomScore: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface StrategicJudgmentDashboard {
  generatedAt: string; headline: string; score: number;
  judgmentIndex: number; signals: string[]; narrative: string;
}
export interface CrossDomainSynthesisDashboard {
  generatedAt: string; headline: string; score: number;
  synthesisIndex: number; signals: string[]; narrative: string;
}
export interface TradeOffAnalysisDashboard {
  generatedAt: string; headline: string; score: number;
  balanceIndex: number; signals: string[]; narrative: string;
}
export interface OrganizationalPrioritiesDashboard {
  generatedAt: string; headline: string; score: number;
  priorityIndex: number; signals: string[]; narrative: string;
}
export interface ConfidenceDashboard {
  generatedAt: string; headline: string; score: number;
  calibrationIndex: number; signals: string[]; narrative: string;
}
export interface LongTermOutlookDashboard {
  generatedAt: string; headline: string; score: number;
  longTermImpact: number; signals: string[]; narrative: string;
}
export interface WisdomForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: WisdomOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveWisdomBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: WisdomOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: WisdomLens; judgment: ExecutiveJudgmentFramework; narrative: string;
}
export interface BoardWisdomReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: WisdomOutlook; executiveJudgmentScore: number;
  tradeOffScore: number; crossDomainSynthesisScore: number; recommendations: string[];
  lenses: WisdomLens; narrative: string;
}
export interface WisdomHealthScore {
  overallScore: number; status: WisdomHealthStatus; outlook: WisdomOutlook;
  areaScores: Record<WisdomArea, number>; executiveJudgmentScore: number;
  strategicReasoningScore: number; crossDomainSynthesisScore: number;
  forecastScore: number; scenarioScore: number; lenses: WisdomLens; narrative: string;
}
export interface WisdomReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: WisdomConfidenceScore; narrative: string;
}
export interface WisdomProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<WisdomArea, number>; outlook: WisdomOutlook;
  forecast: number; dashboard: WisdomDashboard; brief: ExecutiveWisdomBrief;
  overallConfidence: WisdomConfidenceScore;
}
export interface WisdomHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: WisdomArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: WisdomMetadata;
}
export interface WisdomPublisher { domain: string; capability: string; }
export interface WisdomQueryRequest {
  question: string;
  focus?: "general" | WisdomArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface WisdomQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: WisdomConfidenceScore;
}

export interface WisdomRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  collectiveResult?: CollectiveResultLight;
  institutionalMemoryResult?: InstitutionalMemoryResultLight;
  knowledgeResult?: KnowledgeResultLight;
  decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight;
  ethicalResult?: EthicalResultLight;
  systemsResult?: SystemsResultLight;
  resilienceResult?: ResilienceResultLight;
  opportunityResult?: OpportunityResultLight;
  behavioralResult?: BehavioralResultLight;
  culturalResult?: CulturalResultLight;
  stakeholderResult?: StakeholderResultLight;
  ecosystemResult?: EcosystemResultLight;
  marketResult?: MarketResultLight;
  competitiveResult?: CompetitiveResultLight;
  economicResult?: EconomicResultLight;
  operationsResult?: OperationsResultLight;
  humanCapitalResult?: HumanCapitalResultLight;
  environmentalResult?: EnvironmentalResultLight;
  politicalResult?: PoliticalResultLight;
  reputationResult?: ReputationResultLight;
  baselineOverrides?: Partial<WisdomBaseline>; metadata?: WisdomMetadata;
}

export interface WisdomResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: WisdomBaseline;
  healthScore: WisdomScore;
${areaScoreFields}
  forecastScore: WisdomScore; scenarioScore: WisdomScore; analysisScore: WisdomScore;
  earlyWarningScore: WisdomScore;
  strategicReasoningEngineScore: WisdomScore; crossDomainSynthesisEngineScore: WisdomScore;
  tradeOffEngineScore: WisdomScore; uncertaintyEngineScore: WisdomScore;
  executiveJudgmentEngineScore: WisdomScore; confidenceEngineScore: WisdomScore;
  health: WisdomHealthScore; dashboard: WisdomDashboard;
  strategicJudgmentDashboard: StrategicJudgmentDashboard;
  crossDomainSynthesisDashboard: CrossDomainSynthesisDashboard;
  tradeOffAnalysisDashboard: TradeOffAnalysisDashboard;
  organizationalPrioritiesDashboard: OrganizationalPrioritiesDashboard;
  confidenceDashboard: ConfidenceDashboard;
  longTermOutlookDashboard: LongTermOutlookDashboard;
  forecastDashboard: WisdomForecastDashboard;
  brief: ExecutiveWisdomBrief; boardReport: BoardWisdomReport;
  recommendations: WisdomRecommendationRecord[]; risks: WisdomRiskRecord[];
  opportunities: WisdomOpportunityRecord[];
  areaSuites: Record<WisdomArea, WisdomAreaSuite>;
  trendSuite: WisdomTrendSuite; forecastSuite: WisdomForecastSuite;
  scenarioSuite: WisdomScenarioSuite; analysisSuite: WisdomAnalysisSuite;
  strategicReasoningSuite: StrategicReasoningSuite;
  crossDomainSynthesisSuite: CrossDomainSynthesisSuite;
  tradeOffSuite: TradeOffSuite;
  uncertaintySuite: UncertaintySuite;
  executiveJudgmentSuite: ExecutiveJudgmentSuite;
  confidenceSuite: ConfidenceSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: WisdomKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: WisdomReasoningResult; projection: WisdomProjectionResult;
  historyRecord: WisdomHistoryRecord; confidence: WisdomConfidenceScore;
  requestMetadata: WisdomMetadata;
}
`);

console.log("Part 1: types and areas done. Files:", fs.readdirSync(DEST).length);
export { AREAS, areaFile, snakeToCamel, PKG, DEST };
