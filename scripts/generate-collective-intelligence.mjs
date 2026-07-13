/**
 * Generate Sprint 059 Collective Intelligence package (part 1: types + areas).
 * Run: node scripts/generate-collective-intelligence.mjs
 *
 * Collaborative synthesis layer that aggregates multi-domain recommendations
 * and redistributes synthesized learning. Hard DAG: ["institutional-memory"].
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/collective");
fs.mkdirSync(DEST, { recursive: true });
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");
const PKG = "@/lib/platform/intelligence/collective";

const AREAS = [
  ["collective_reasoning", "CollectiveReasoningIntelligence", ["Collective reasoning quality", "Reasoning fragmentation hotspot"], "Collective Reasoning"],
  ["consensus_analysis", "ConsensusAnalysisIntelligence", ["Consensus strength", "Consensus collapse hotspot"], "Consensus Analysis"],
  ["distributed_expertise", "DistributedExpertiseIntelligence", ["Distributed expertise coverage", "Expertise silo risk"], "Distributed Expertise"],
  ["collaborative_intelligence", "CollaborativeIntelligence", ["Collaborative intelligence strength", "Collaboration breakdown hotspot"], "Collaborative Intelligence"],
  ["multi_domain_synthesis", "MultiDomainSynthesisIntelligence", ["Multi-domain synthesis quality", "Synthesis stalemate risk"], "Multi Domain Synthesis"],
  ["cross_functional_intelligence", "CrossFunctionalIntelligence", ["Cross-functional intelligence", "Cross-domain conflict hotspot"], "Cross Functional Intelligence"],
  ["organizational_alignment", "OrganizationalAlignmentIntelligence", ["Organizational alignment", "Alignment failure hotspot"], "Organizational Alignment"],
  ["team_decision_intelligence", "TeamDecisionIntelligence", ["Team decision quality", "Shared decision gap"], "Team Decision Intelligence"],
  ["expert_weighting", "ExpertWeightingIntelligence", ["Expert weighting accuracy", "Weighting distortion risk"], "Expert Weighting"],
  ["perspective_diversity", "PerspectiveDiversityIntelligence", ["Perspective diversity", "Perspective polarization hotspot"], "Perspective Diversity"],
  ["conflict_resolution", "ConflictResolutionIntelligence", ["Conflict resolution effectiveness", "Unresolved conflict hotspot"], "Conflict Resolution"],
  ["collaborative_learning", "CollaborativeLearningIntelligence", ["Collaborative learning strength", "Learning loop gap"], "Collaborative Learning"],
  ["organizational_coordination", "OrganizationalCoordinationIntelligence", ["Organizational coordination", "Coordination failure hotspot"], "Organizational Coordination"],
  ["shared_decision_quality", "SharedDecisionQualityIntelligence", ["Shared decision quality", "Decision quality erosion"], "Shared Decision Quality"],
  ["collective_opportunity_detection", "CollectiveOpportunityDetectionIntelligence", ["Collective opportunity detection", "Opportunity blind spot"], "Collective Opportunity Detection"],
  ["collective_risk_assessment", "CollectiveRiskAssessmentIntelligence", ["Collective risk assessment", "Distributed blind spot risk"], "Collective Risk Assessment"],
  ["collective_intelligence_evolution", "CollectiveIntelligenceEvolutionIntelligence", ["Collective intelligence evolution", "Evolution stall risk"], "Collective Intelligence Evolution"],
];

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const areaFile = (area) => area.replaceAll("_", "-") + "-intelligence";
const areaList = AREAS.map(([a]) => `"${a}"`).join(", ");
const areaScoreFields = AREAS.map(([a]) => `  ${snakeToCamel(a)}Score: CollectiveScore;`).join("\n");
const capsExtra = [
  "collective_analysis", "consensus_analysis_engine", "distributed_expertise_engine", "cross_domain_synthesis",
  "collaboration_analysis", "conflict_resolution_engine", "collective_trends", "collective_forecasts",
  "scenario_planning", "early_warning", "recommendation_generation", "knowledge_contribution", "closed_learning_loop",
];
const caps = [...AREAS.map(([a]) => a), ...capsExtra].map(c => `"${c}"`).join(", ");

w("area-factory.ts", `import type { CollectiveAreaIntelligence } from "${PKG}/contracts";
import { buildLens, clamp } from "${PKG}/models";
import type { CollectiveArea, CollectiveAreaSuite } from "${PKG}/types";

export function createAreaIntelligence(
  area: CollectiveArea,
  titles: [string, string],
  forceLabel: string,
): new () => CollectiveAreaIntelligence {
  return class implements CollectiveAreaIntelligence {
    assess(input: Parameters<CollectiveAreaIntelligence["assess"]>[0]): CollectiveAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("col-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: \`\${item.title} reading \${Math.round(value)}.\`,
          evidence: [\`baseline:\${area}\`, \`indicator:\${area}:current\`],
          lenses: buildLens({
            consensusStrength: \`Consensus strength linked to \${area} at \${Math.round(value)}.\`,
            expertiseCoverage: \`Expertise coverage implications of \${area} conditions.\`,
            perspectiveDiversity: \`Perspective diversity surrounding \${area}.\`,
            crossDomainAgreement: \`Cross-domain agreement reading for \${area}.\`,
            organizationalAlignment: \`Organizational alignment associated with \${area}.\`,
            collaborationQuality: \`Collaboration quality reading for \${area}.\`,
            collectiveConfidence: \`Collective confidence in \${area}.\`,
            longTermCollectiveValue: \`Long-term collective value for \${area} developments.\`,
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
        narrative: \`\${forceLabel} collective intelligence score \${Math.round(score)}.\`,
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

export const COLLECTIVE_INTELLIGENCE_VERSION = "0.1.0";
export const COLLECTIVE_CAPABILITIES = [
  ${caps},
] as const;
export const COLLECTIVE_AREAS = [
  ${areaList},
] as const;
export const COLLECTIVE_SCENARIOS = [
  "consensus_collapse", "expertise_silo", "perspective_polarization", "cross_domain_conflict",
  "alignment_failure", "collaboration_breakdown", "expert_weighting_distortion", "synthesis_stalemate",
  "collective_overconfidence", "distributed_blind_spot",
] as const;
export const COLLECTIVE_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "consensus_strength", "expertise_coverage",
  "perspective_diversity", "cross_domain_agreement", "organizational_alignment",
  "collaboration_quality", "collective_confidence", "long_term_collective_value", "early_warning",
] as const;
export const COLLECTIVE_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const COLLECTIVE_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const COLLECTIVE_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const COLLECTIVE_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const COLLECTIVE_OUTLOOKS = ["aligned", "stable", "contested", "volatile", "uncertain"] as const;

export type CollectiveCapability = typeof COLLECTIVE_CAPABILITIES[number];
export type CollectiveArea = typeof COLLECTIVE_AREAS[number];
export type CollectiveScenarioKind = typeof COLLECTIVE_SCENARIOS[number];
export type CollectiveAnalysisKind = typeof COLLECTIVE_ANALYSIS_KINDS[number];
export type CollectiveHealthStatus = typeof COLLECTIVE_HEALTH_STATUSES[number];
export type CollectivePriorityBand = typeof COLLECTIVE_PRIORITY_BANDS[number];
export type CollectiveArtifactStatus = typeof COLLECTIVE_ARTIFACT_STATUSES[number];
export type CollectiveConfidenceLevel = typeof COLLECTIVE_CONFIDENCE_LEVELS[number];
export type CollectiveOutlook = typeof COLLECTIVE_OUTLOOKS[number];
export type CollectiveMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every collective recommendation answers these eight leadership questions. */
export interface CollectiveLens {
  consensusStrength: string;
  expertiseCoverage: string;
  perspectiveDiversity: string;
  crossDomainAgreement: string;
  organizationalAlignment: string;
  collaborationQuality: string;
  collectiveConfidence: string;
  longTermCollectiveValue: string;
}

export interface CollectiveScore { key: string; label: string; value: number; status: CollectiveHealthStatus; band: CollectivePriorityBand; narrative: string; }
export interface CollectiveConfidenceScore { value: number; level: CollectiveConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
/** Soft-read of Sprint 058 Institutional Memory Intelligence. */
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
export interface SystemsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  adaptability?: number;
  cascadingRisk?: number;
}
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface EcosystemResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  ecosystemScore?: { value?: number };
}
export interface ResilienceResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  adaptiveCapacity?: number;
}
export interface EthicalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  ethicalScore?: { value?: number };
}
export interface MarketResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  marketScore?: { value?: number };
}
export interface CompetitiveResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  competitiveScore?: { value?: number };
}
export interface HumanCapitalResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  humanCapitalScore?: { value?: number };
}
export interface OperationsResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  operationsScore?: { value?: number };
}

export interface CollectiveBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<CollectiveArea, number>;
  consensusStrength: number;
  expertiseCoverage: number;
  perspectiveDiversity: number;
  crossDomainAgreement: number;
  organizationalAlignment: number;
  collaborationQuality: number;
  collectiveConfidence: number;
  longTermCollectiveValue: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface CollectiveAreaRecord {
  id: string; area: CollectiveArea; title: string; score: number; status: CollectiveArtifactStatus;
  signal: string; evidence: string[]; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveAreaSuite {
  area: CollectiveArea; records: CollectiveAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface CollectiveTrendRecord {
  id: string; area: CollectiveArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: CollectiveConfidenceLevel; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveTrendSuite { trends: CollectiveTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface CollectiveForecastRecord {
  id: string; area: CollectiveArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: CollectiveConfidenceLevel; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveForecastSuite {
  forecasts: CollectiveForecastRecord[]; outlook: CollectiveOutlook;
  maturityScore: number; narrative: string;
}

export interface CollectiveScenarioRecord {
  id: string; kind: CollectiveScenarioKind; title: string; probability: number;
  severity: CollectivePriorityBand; organizationalImpact: number;
  consensusImpact: number; expertiseImpact: number; monitors: string[];
  lenses: CollectiveLens; narrative: string;
}
export interface CollectiveScenarioSuite {
  scenarios: CollectiveScenarioRecord[]; primaryScenario: CollectiveScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface CollectiveAnalysisRecord {
  id: string; kind: CollectiveAnalysisKind; title: string; score: number;
  status: CollectiveArtifactStatus; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveAnalysisSuite {
  analyses: CollectiveAnalysisRecord[]; kindsCovered: CollectiveAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface ConsensusRecord {
  id: string; title: string; strength: number; lenses: CollectiveLens; narrative: string;
}
export interface ConsensusSuite {
  records: ConsensusRecord[]; score: number; consensusIndex: number; narrative: string;
}

export interface DistributedExpertiseRecord {
  id: string; title: string; coverage: number; lenses: CollectiveLens; narrative: string;
}
export interface DistributedExpertiseSuite {
  records: DistributedExpertiseRecord[]; score: number; expertiseIndex: number; narrative: string;
}

export interface CrossDomainSynthesisRecord {
  id: string; title: string; synthesisIndex: number; lenses: CollectiveLens; narrative: string;
}
export interface CrossDomainSynthesisSuite {
  records: CrossDomainSynthesisRecord[]; score: number; synthesisIndex: number; narrative: string;
}

export interface CollaborationRecord {
  id: string; title: string; collaborationIndex: number; lenses: CollectiveLens; narrative: string;
}
export interface CollaborationSuite {
  records: CollaborationRecord[]; score: number; collaborationIndex: number; narrative: string;
}

export interface ConflictResolutionRecord {
  id: string; title: string; resolutionIndex: number; lenses: CollectiveLens; narrative: string;
}
export interface ConflictResolutionSuite {
  records: ConflictResolutionRecord[]; score: number; resolutionIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: CollectivePriorityBand; source: string;
  score: number; lenses: CollectiveLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface CollectiveKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: CollectiveMetadata;
}
export interface CollectiveKnowledgeContribution {
  artifacts: CollectiveKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"institutional-memory" | "knowledge" | "executive-decision" | "opportunity" | "predictive" | "stakeholder" | "organizational-improvement">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface CollectiveRecommendationRecord {
  id: string; title: string; priority: CollectivePriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveRiskRecord {
  id: string; title: string; area: CollectiveArea; severity: CollectivePriorityBand;
  score: number; mitigation: string; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveOpportunityRecord {
  id: string; title: string; area: CollectiveArea; priority: CollectivePriorityBand;
  score: number; lenses: CollectiveLens; narrative: string;
}

export interface CollectiveDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<CollectiveArea, number>; outlook: CollectiveOutlook;
  consensusStrength: number; collaborationQuality: number; collectiveConfidence: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface ConsensusDashboard {
  generatedAt: string; headline: string; score: number;
  consensusIndex: number; signals: string[]; narrative: string;
}
export interface CrossDomainIntelligenceDashboard {
  generatedAt: string; headline: string; score: number;
  synthesisIndex: number; signals: string[]; narrative: string;
}
export interface ExpertiseNetworkDashboard {
  generatedAt: string; headline: string; score: number;
  expertiseIndex: number; signals: string[]; narrative: string;
}
export interface OrganizationalAlignmentDashboard {
  generatedAt: string; headline: string; score: number;
  alignmentIndex: number; signals: string[]; narrative: string;
}
export interface CollaborationHealthDashboard {
  generatedAt: string; headline: string; score: number;
  collaborationIndex: number; signals: string[]; narrative: string;
}
export interface CollectiveLearningDashboard {
  generatedAt: string; headline: string; score: number;
  learningIndex: number; signals: string[]; narrative: string;
}
export interface CollectiveForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: CollectiveOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveCollectiveBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: CollectiveOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: CollectiveLens; narrative: string;
}
export interface BoardCollectiveReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: CollectiveOutlook; consensusEngineScore: number;
  collaborationEngineScore: number; crossDomainSynthesisScore: number; recommendations: string[];
  lenses: CollectiveLens; narrative: string;
}
export interface CollectiveHealthScore {
  overallScore: number; status: CollectiveHealthStatus; outlook: CollectiveOutlook;
  areaScores: Record<CollectiveArea, number>; consensusEngineScore: number;
  collaborationEngineScore: number; crossDomainSynthesisScore: number;
  forecastScore: number; scenarioScore: number; lenses: CollectiveLens; narrative: string;
}
export interface CollectiveReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: CollectiveConfidenceScore; narrative: string;
}
export interface CollectiveProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<CollectiveArea, number>; outlook: CollectiveOutlook;
  forecast: number; dashboard: CollectiveDashboard; brief: ExecutiveCollectiveBrief;
  overallConfidence: CollectiveConfidenceScore;
}
export interface CollectiveHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: CollectiveArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: CollectiveMetadata;
}
export interface CollectivePublisher { domain: string; capability: string; }
export interface CollectiveQueryRequest {
  question: string;
  focus?: "general" | CollectiveArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface CollectiveQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: CollectiveConfidenceScore;
}

export interface CollectiveRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  institutionalMemoryResult?: InstitutionalMemoryResultLight;
  knowledgeResult?: KnowledgeResultLight;
  decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight;
  behavioralResult?: BehavioralResultLight;
  culturalResult?: CulturalResultLight;
  stakeholderResult?: StakeholderResultLight;
  systemsResult?: SystemsResultLight;
  opportunityResult?: OpportunityResultLight;
  ecosystemResult?: EcosystemResultLight;
  resilienceResult?: ResilienceResultLight;
  ethicalResult?: EthicalResultLight;
  marketResult?: MarketResultLight;
  competitiveResult?: CompetitiveResultLight;
  humanCapitalResult?: HumanCapitalResultLight;
  operationsResult?: OperationsResultLight;
  baselineOverrides?: Partial<CollectiveBaseline>; metadata?: CollectiveMetadata;
}

export interface CollectiveResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: CollectiveBaseline;
  healthScore: CollectiveScore;
${areaScoreFields}
  forecastScore: CollectiveScore; scenarioScore: CollectiveScore; analysisScore: CollectiveScore;
  earlyWarningScore: CollectiveScore;
  consensusEngineScore: CollectiveScore; distributedExpertiseEngineScore: CollectiveScore;
  crossDomainSynthesisScore: CollectiveScore; collaborationEngineScore: CollectiveScore;
  conflictResolutionEngineScore: CollectiveScore;
  health: CollectiveHealthScore; dashboard: CollectiveDashboard;
  consensusDashboard: ConsensusDashboard;
  crossDomainIntelligenceDashboard: CrossDomainIntelligenceDashboard;
  expertiseNetworkDashboard: ExpertiseNetworkDashboard;
  organizationalAlignmentDashboard: OrganizationalAlignmentDashboard;
  collaborationHealthDashboard: CollaborationHealthDashboard;
  collectiveLearningDashboard: CollectiveLearningDashboard;
  forecastDashboard: CollectiveForecastDashboard;
  brief: ExecutiveCollectiveBrief; boardReport: BoardCollectiveReport;
  recommendations: CollectiveRecommendationRecord[]; risks: CollectiveRiskRecord[];
  opportunities: CollectiveOpportunityRecord[];
  areaSuites: Record<CollectiveArea, CollectiveAreaSuite>;
  trendSuite: CollectiveTrendSuite; forecastSuite: CollectiveForecastSuite;
  scenarioSuite: CollectiveScenarioSuite; analysisSuite: CollectiveAnalysisSuite;
  consensusSuite: ConsensusSuite;
  distributedExpertiseSuite: DistributedExpertiseSuite;
  crossDomainSynthesisSuite: CrossDomainSynthesisSuite;
  collaborationSuite: CollaborationSuite;
  conflictResolutionSuite: ConflictResolutionSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: CollectiveKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: CollectiveReasoningResult; projection: CollectiveProjectionResult;
  historyRecord: CollectiveHistoryRecord; confidence: CollectiveConfidenceScore;
  requestMetadata: CollectiveMetadata;
}
`);

console.log("Part 1: types and areas done. Files:", fs.readdirSync(DEST).length);
export { AREAS, areaFile, snakeToCamel, PKG, DEST };
