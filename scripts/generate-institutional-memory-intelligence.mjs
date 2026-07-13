/**
 * Generate Sprint 058 Institutional Memory Intelligence package (part 1: types + areas).
 * Run: node scripts/generate-institutional-memory-intelligence.mjs
 *
 * NOTE: This is the Knowledge Intelligence evolution terminal layer.
 * Sprint 040 knowledge/ remains frozen mid-pipeline. Do not regenerate knowledge/.
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/institutional-memory");
fs.mkdirSync(DEST, { recursive: true });
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");
const PKG = "@/lib/platform/intelligence/institutional-memory";

const AREAS = [
  ["organizational_memory", "OrganizationalMemoryIntelligence", ["Organizational memory coverage", "Memory loss hotspot"], "Organizational Memory"],
  ["knowledge_graph", "KnowledgeGraphIntelligence", ["Knowledge graph connectivity", "Graph fragmentation hotspot"], "Knowledge Graph"],
  ["knowledge_mapping", "KnowledgeMappingIntelligence", ["Knowledge map coverage", "Mapping blind spot"], "Knowledge Mapping"],
  ["expertise_intelligence", "ExpertiseIntelligence", ["Expertise availability", "Expertise departure risk"], "Expertise Intelligence"],
  ["institutional_memory", "InstitutionalMemoryAreaIntelligence", ["Institutional memory depth", "Institutional amnesia risk"], "Institutional Memory"],
  ["lessons_learned", "LessonsLearnedIntelligence", ["Lessons learned capture", "Transfer breakdown hotspot"], "Lessons Learned"],
  ["decision_history", "DecisionHistoryIntelligence", ["Decision history integrity", "Provenance break risk"], "Decision History"],
  ["policy_knowledge", "PolicyKnowledgeIntelligence", ["Policy knowledge currency", "Policy staleness hotspot"], "Policy Knowledge"],
  ["process_knowledge", "ProcessKnowledgeIntelligence", ["Process knowledge clarity", "Process knowledge gap"], "Process Knowledge"],
  ["relationship_knowledge", "RelationshipKnowledgeIntelligence", ["Relationship knowledge strength", "Relationship knowledge loss"], "Relationship Knowledge"],
  ["semantic_search", "SemanticSearchIntelligence", ["Semantic search effectiveness", "Search retrieval gap"], "Semantic Search"],
  ["knowledge_validation", "KnowledgeValidationIntelligence", ["Knowledge validation strength", "Validation failure hotspot"], "Knowledge Validation"],
  ["knowledge_evolution", "KnowledgeEvolutionIntelligence", ["Knowledge evolution pace", "Staleness cascade risk"], "Knowledge Evolution"],
  ["knowledge_gap_detection", "KnowledgeGapDetectionIntelligence", ["Gap detection coverage", "Gap cascade hotspot"], "Knowledge Gap Detection"],
  ["knowledge_transfer", "KnowledgeTransferIntelligence", ["Knowledge transfer effectiveness", "Transfer breakdown risk"], "Knowledge Transfer"],
  ["knowledge_quality", "KnowledgeQualityIntelligence", ["Knowledge quality score", "Quality erosion hotspot"], "Knowledge Quality"],
  ["knowledge_synthesis", "KnowledgeSynthesisIntelligence", ["Knowledge synthesis strength", "Synthesis failure risk"], "Knowledge Synthesis"],
];

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const areaFile = (area) =>
  area === "institutional_memory" ? "institutional-memory-area-intelligence" : area.replaceAll("_", "-") + "-intelligence";
const areaList = AREAS.map(([a]) => `"${a}"`).join(", ");
const areaScoreFields = AREAS.map(([a]) => `  ${snakeToCamel(a)}Score: InstitutionalMemoryScore;`).join("\n");
const capsExtra = [
  "knowledge_analysis", "knowledge_graph_engine", "semantic_search_engine", "expertise_analysis",
  "knowledge_validation_analysis", "knowledge_evolution_analysis", "memory_trends", "memory_forecasts",
  "scenario_planning", "early_warning", "recommendation_generation", "knowledge_contribution", "closed_learning_loop",
];
const caps = [...AREAS.map(([a]) => a), ...capsExtra].map(c => `"${c}"`).join(", ");

w("area-factory.ts", `import type { InstitutionalMemoryAreaIntelligence } from "${PKG}/contracts";
import { buildLens, clamp } from "${PKG}/models";
import type { InstitutionalMemoryArea, InstitutionalMemoryAreaSuite } from "${PKG}/types";

export function createAreaIntelligence(
  area: InstitutionalMemoryArea,
  titles: [string, string],
  forceLabel: string,
): new () => InstitutionalMemoryAreaIntelligence {
  return class implements InstitutionalMemoryAreaIntelligence {
    assess(input: Parameters<InstitutionalMemoryAreaIntelligence["assess"]>[0]): InstitutionalMemoryAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("imm-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: \`\${item.title} reading \${Math.round(value)}.\`,
          evidence: [\`baseline:\${area}\`, \`indicator:\${area}:current\`],
          lenses: buildLens({
            knowledgeConfidence: \`Knowledge confidence linked to \${area} at \${Math.round(value)}.\`,
            evidenceStrength: \`Evidence strength implications of \${area} conditions.\`,
            institutionalMemoryCoverage: \`Institutional memory coverage surrounding \${area}.\`,
            knowledgeFreshness: \`Knowledge freshness reading for \${area}.\`,
            expertiseAvailability: \`Expertise availability associated with \${area}.\`,
            knowledgeGaps: \`Knowledge gaps around \${area}.\`,
            knowledgeQuality: \`Knowledge quality reading for \${area}.\`,
            longTermLearningValue: \`Long-term learning value for \${area} developments.\`,
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
        narrative: \`\${forceLabel} institutional memory score \${Math.round(score)}.\`,
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

export const INSTITUTIONAL_MEMORY_INTELLIGENCE_VERSION = "0.1.0";
export const INSTITUTIONAL_MEMORY_CAPABILITIES = [
  ${caps},
] as const;
export const INSTITUTIONAL_MEMORY_AREAS = [
  ${areaList},
] as const;
export const INSTITUTIONAL_MEMORY_SCENARIOS = [
  "memory_loss", "expertise_departure", "knowledge_staleness", "validation_failure",
  "graph_fragmentation", "gap_cascade", "transfer_breakdown", "synthesis_failure",
  "provenance_break", "institutional_amnesia",
] as const;
export const INSTITUTIONAL_MEMORY_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "knowledge_confidence", "evidence_strength",
  "institutional_memory_coverage", "knowledge_freshness", "expertise_availability",
  "knowledge_gaps", "knowledge_quality", "long_term_learning_value", "early_warning",
] as const;
export const INSTITUTIONAL_MEMORY_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const INSTITUTIONAL_MEMORY_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const INSTITUTIONAL_MEMORY_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const INSTITUTIONAL_MEMORY_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const INSTITUTIONAL_MEMORY_OUTLOOKS = ["learning", "stable", "eroding", "volatile", "uncertain"] as const;

export type InstitutionalMemoryCapability = typeof INSTITUTIONAL_MEMORY_CAPABILITIES[number];
export type InstitutionalMemoryArea = typeof INSTITUTIONAL_MEMORY_AREAS[number];
export type InstitutionalMemoryScenarioKind = typeof INSTITUTIONAL_MEMORY_SCENARIOS[number];
export type InstitutionalMemoryAnalysisKind = typeof INSTITUTIONAL_MEMORY_ANALYSIS_KINDS[number];
export type InstitutionalMemoryHealthStatus = typeof INSTITUTIONAL_MEMORY_HEALTH_STATUSES[number];
export type InstitutionalMemoryPriorityBand = typeof INSTITUTIONAL_MEMORY_PRIORITY_BANDS[number];
export type InstitutionalMemoryArtifactStatus = typeof INSTITUTIONAL_MEMORY_ARTIFACT_STATUSES[number];
export type InstitutionalMemoryConfidenceLevel = typeof INSTITUTIONAL_MEMORY_CONFIDENCE_LEVELS[number];
export type InstitutionalMemoryOutlook = typeof INSTITUTIONAL_MEMORY_OUTLOOKS[number];
export type InstitutionalMemoryMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every institutional memory recommendation answers these eight leadership questions. */
export interface InstitutionalMemoryLens {
  knowledgeConfidence: string;
  evidenceStrength: string;
  institutionalMemoryCoverage: string;
  knowledgeFreshness: string;
  expertiseAvailability: string;
  knowledgeGaps: string;
  knowledgeQuality: string;
  longTermLearningValue: string;
}

export interface InstitutionalMemoryScore { key: string; label: string; value: number; status: InstitutionalMemoryHealthStatus; band: InstitutionalMemoryPriorityBand; narrative: string; }
export interface InstitutionalMemoryConfidenceScore { value: number; level: InstitutionalMemoryConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
/** Soft-read of Sprint 040 Knowledge Intelligence (frozen mid-pipeline). */
export interface KnowledgeResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  knowledgeScore?: { value?: number };
  baseline?: { knowledgeConfidence?: number; knowledgeFreshness?: number; knowledgeQuality?: number };
}
export interface EcosystemResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  ecosystemScore?: { value?: number };
}
export interface ResilienceResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  adaptiveCapacity?: number;
}
export interface SystemsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  adaptability?: number;
  cascadingRisk?: number;
}
export interface StakeholderResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  engagementScore?: { value?: number };
}
export interface CulturalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  culturalScore?: { value?: number };
}
export interface EthicalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  ethicalScore?: { value?: number };
}
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface MarketResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  marketScore?: { value?: number };
}
export interface CompetitiveResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  competitiveScore?: { value?: number };
}
export interface BehavioralResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  behavioralScore?: { value?: number };
}
export interface OperationsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  operationsScore?: { value?: number };
}
export interface CustomerResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  customerScore?: { value?: number };
}
export interface HumanCapitalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  humanCapitalScore?: { value?: number };
}

export interface InstitutionalMemoryBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<InstitutionalMemoryArea, number>;
  knowledgeConfidence: number;
  evidenceStrength: number;
  institutionalMemoryCoverage: number;
  knowledgeFreshness: number;
  expertiseAvailability: number;
  knowledgeGaps: number;
  knowledgeQuality: number;
  longTermLearningValue: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface InstitutionalMemoryAreaRecord {
  id: string; area: InstitutionalMemoryArea; title: string; score: number; status: InstitutionalMemoryArtifactStatus;
  signal: string; evidence: string[]; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface InstitutionalMemoryAreaSuite {
  area: InstitutionalMemoryArea; records: InstitutionalMemoryAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface InstitutionalMemoryTrendRecord {
  id: string; area: InstitutionalMemoryArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: InstitutionalMemoryConfidenceLevel; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface InstitutionalMemoryTrendSuite { trends: InstitutionalMemoryTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface InstitutionalMemoryForecastRecord {
  id: string; area: InstitutionalMemoryArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: InstitutionalMemoryConfidenceLevel; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface InstitutionalMemoryForecastSuite {
  forecasts: InstitutionalMemoryForecastRecord[]; outlook: InstitutionalMemoryOutlook;
  maturityScore: number; narrative: string;
}

export interface InstitutionalMemoryScenarioRecord {
  id: string; kind: InstitutionalMemoryScenarioKind; title: string; probability: number;
  severity: InstitutionalMemoryPriorityBand; organizationalImpact: number;
  memoryImpact: number; expertiseImpact: number; monitors: string[];
  lenses: InstitutionalMemoryLens; narrative: string;
}
export interface InstitutionalMemoryScenarioSuite {
  scenarios: InstitutionalMemoryScenarioRecord[]; primaryScenario: InstitutionalMemoryScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface InstitutionalMemoryAnalysisRecord {
  id: string; kind: InstitutionalMemoryAnalysisKind; title: string; score: number;
  status: InstitutionalMemoryArtifactStatus; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface InstitutionalMemoryAnalysisSuite {
  analyses: InstitutionalMemoryAnalysisRecord[]; kindsCovered: InstitutionalMemoryAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface KnowledgeGraphRecord {
  id: string; title: string; connectivity: number; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface KnowledgeGraphSuite {
  records: KnowledgeGraphRecord[]; score: number; graphIndex: number; narrative: string;
}

export interface SemanticSearchRecord {
  id: string; title: string; effectiveness: number; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface SemanticSearchSuite {
  records: SemanticSearchRecord[]; score: number; searchIndex: number; narrative: string;
}

export interface ExpertiseRecord {
  id: string; title: string; availability: number; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface ExpertiseSuite {
  records: ExpertiseRecord[]; score: number; expertiseIndex: number; narrative: string;
}

export interface KnowledgeValidationRecord {
  id: string; title: string; strength: number; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface KnowledgeValidationSuite {
  records: KnowledgeValidationRecord[]; score: number; validationIndex: number; narrative: string;
}

export interface KnowledgeEvolutionRecord {
  id: string; title: string; pace: number; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface KnowledgeEvolutionSuite {
  records: KnowledgeEvolutionRecord[]; score: number; evolutionIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: InstitutionalMemoryPriorityBand; source: string;
  score: number; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface InstitutionalMemoryKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: InstitutionalMemoryMetadata;
}
export interface InstitutionalMemoryKnowledgeContribution {
  artifacts: InstitutionalMemoryKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"knowledge" | "ecosystem" | "opportunity" | "executive-decision" | "predictive" | "organizational-improvement" | "stakeholder">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface InstitutionalMemoryRecommendationRecord {
  id: string; title: string; priority: InstitutionalMemoryPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface InstitutionalMemoryRiskRecord {
  id: string; title: string; area: InstitutionalMemoryArea; severity: InstitutionalMemoryPriorityBand;
  score: number; mitigation: string; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface InstitutionalMemoryOpportunityRecord {
  id: string; title: string; area: InstitutionalMemoryArea; priority: InstitutionalMemoryPriorityBand;
  score: number; lenses: InstitutionalMemoryLens; narrative: string;
}

export interface InstitutionalMemoryDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<InstitutionalMemoryArea, number>; outlook: InstitutionalMemoryOutlook;
  knowledgeConfidence: number; evidenceStrength: number; institutionalMemoryCoverage: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface KnowledgeGraphDashboard {
  generatedAt: string; headline: string; score: number;
  graphIndex: number; signals: string[]; narrative: string;
}
export interface OrganizationalMemoryDashboard {
  generatedAt: string; headline: string; score: number;
  memoryIndex: number; signals: string[]; narrative: string;
}
export interface ExpertiseMapDashboard {
  generatedAt: string; headline: string; score: number;
  expertiseIndex: number; signals: string[]; narrative: string;
}
export interface LessonsLearnedDashboard {
  generatedAt: string; headline: string; score: number;
  lessonsIndex: number; signals: string[]; narrative: string;
}
export interface KnowledgeQualityDashboard {
  generatedAt: string; headline: string; score: number;
  qualityIndex: number; signals: string[]; narrative: string;
}
export interface KnowledgeGapsDashboard {
  generatedAt: string; headline: string; score: number;
  gapsIndex: number; signals: string[]; narrative: string;
}
export interface InstitutionalMemoryForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: InstitutionalMemoryOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveKnowledgeBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: InstitutionalMemoryOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: InstitutionalMemoryLens; narrative: string;
}
export interface BoardKnowledgeReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: InstitutionalMemoryOutlook; knowledgeGraphScore: number;
  expertiseScore: number; knowledgeQualityScore: number; recommendations: string[];
  lenses: InstitutionalMemoryLens; narrative: string;
}
export interface InstitutionalMemoryHealthScore {
  overallScore: number; status: InstitutionalMemoryHealthStatus; outlook: InstitutionalMemoryOutlook;
  areaScores: Record<InstitutionalMemoryArea, number>; knowledgeGraphScore: number;
  expertiseScore: number; validationScore: number; evolutionScore: number;
  forecastScore: number; scenarioScore: number; lenses: InstitutionalMemoryLens; narrative: string;
}
export interface InstitutionalMemoryReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: InstitutionalMemoryConfidenceScore; narrative: string;
}
export interface InstitutionalMemoryProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<InstitutionalMemoryArea, number>; outlook: InstitutionalMemoryOutlook;
  forecast: number; dashboard: InstitutionalMemoryDashboard; brief: ExecutiveKnowledgeBrief;
  overallConfidence: InstitutionalMemoryConfidenceScore;
}
export interface InstitutionalMemoryHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: InstitutionalMemoryArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: InstitutionalMemoryMetadata;
}
export interface InstitutionalMemoryPublisher { domain: string; capability: string; }
export interface InstitutionalMemoryQueryRequest {
  question: string;
  focus?: "general" | InstitutionalMemoryArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface InstitutionalMemoryQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: InstitutionalMemoryConfidenceScore;
}

export interface InstitutionalMemoryRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  knowledgeResult?: KnowledgeResultLight;
  ecosystemResult?: EcosystemResultLight;
  resilienceResult?: ResilienceResultLight;
  systemsResult?: SystemsResultLight;
  stakeholderResult?: StakeholderResultLight;
  culturalResult?: CulturalResultLight;
  ethicalResult?: EthicalResultLight;
  opportunityResult?: OpportunityResultLight;
  decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight;
  marketResult?: MarketResultLight;
  competitiveResult?: CompetitiveResultLight;
  behavioralResult?: BehavioralResultLight;
  operationsResult?: OperationsResultLight;
  customerResult?: CustomerResultLight;
  humanCapitalResult?: HumanCapitalResultLight;
  baselineOverrides?: Partial<InstitutionalMemoryBaseline>; metadata?: InstitutionalMemoryMetadata;
}

export interface InstitutionalMemoryResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: InstitutionalMemoryBaseline;
  healthScore: InstitutionalMemoryScore;
${areaScoreFields}
  forecastScore: InstitutionalMemoryScore; scenarioScore: InstitutionalMemoryScore; analysisScore: InstitutionalMemoryScore;
  earlyWarningScore: InstitutionalMemoryScore;
  knowledgeGraphScore: InstitutionalMemoryScore; semanticSearchScore: InstitutionalMemoryScore;
  expertiseScore: InstitutionalMemoryScore; knowledgeValidationScore: InstitutionalMemoryScore;
  knowledgeEvolutionScore: InstitutionalMemoryScore;
  health: InstitutionalMemoryHealthScore; dashboard: InstitutionalMemoryDashboard;
  knowledgeGraphDashboard: KnowledgeGraphDashboard;
  organizationalMemoryDashboard: OrganizationalMemoryDashboard;
  expertiseMapDashboard: ExpertiseMapDashboard;
  lessonsLearnedDashboard: LessonsLearnedDashboard;
  knowledgeQualityDashboard: KnowledgeQualityDashboard;
  knowledgeGapsDashboard: KnowledgeGapsDashboard;
  forecastDashboard: InstitutionalMemoryForecastDashboard;
  brief: ExecutiveKnowledgeBrief; boardReport: BoardKnowledgeReport;
  recommendations: InstitutionalMemoryRecommendationRecord[]; risks: InstitutionalMemoryRiskRecord[];
  opportunities: InstitutionalMemoryOpportunityRecord[];
  areaSuites: Record<InstitutionalMemoryArea, InstitutionalMemoryAreaSuite>;
  trendSuite: InstitutionalMemoryTrendSuite; forecastSuite: InstitutionalMemoryForecastSuite;
  scenarioSuite: InstitutionalMemoryScenarioSuite; analysisSuite: InstitutionalMemoryAnalysisSuite;
  knowledgeGraphSuite: KnowledgeGraphSuite;
  semanticSearchSuite: SemanticSearchSuite;
  expertiseSuite: ExpertiseSuite;
  knowledgeValidationSuite: KnowledgeValidationSuite;
  knowledgeEvolutionSuite: KnowledgeEvolutionSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: InstitutionalMemoryKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: InstitutionalMemoryReasoningResult; projection: InstitutionalMemoryProjectionResult;
  historyRecord: InstitutionalMemoryHistoryRecord; confidence: InstitutionalMemoryConfidenceScore;
  requestMetadata: InstitutionalMemoryMetadata;
}
`);

console.log("Part 1: types and areas done. Files:", fs.readdirSync(DEST).length);
export { AREAS, areaFile, snakeToCamel, PKG, DEST };
