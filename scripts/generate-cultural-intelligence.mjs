/**
 * Generate Sprint 053 Cultural Intelligence from Behavioral (052) patterns.
 * Run: node scripts/generate-cultural-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src/lib/platform/intelligence");
const SRC = path.join(ROOT, "behavioral");
const DEST = path.join(ROOT, "cultural");

const AREA_MAP = [
  ["decision_behavior", "organizational_culture"],
  ["cognitive_bias", "team_culture"],
  ["motivation", "leadership_culture"],
  ["incentive_modeling", "mission_alignment"],
  ["organizational_change", "values_alignment"],
  ["change_resistance", "employee_engagement"],
  ["leadership_behavior", "collaboration_culture"],
  ["team_dynamics", "communication_culture"],
  ["collaboration", "innovation_culture"],
  ["communication_patterns", "learning_culture"],
  ["conflict_behavior", "psychological_safety"],
  ["customer_behavior", "inclusion_belonging"],
  ["employee_behavior", "cross_cultural"],
  ["learning_adaptation", "community_culture"],
  ["adoption_forecasting", "cultural_risk"],
  ["behavioral_risk", "cultural_opportunity"],
  ["behavioral_opportunity", "cultural_transformation"],
];

const AREA_FILE_MAP = [
  ["decision-behavior-intelligence.ts", "organizational-culture-intelligence.ts"],
  ["cognitive-bias-intelligence.ts", "team-culture-intelligence.ts"],
  ["motivation-intelligence.ts", "leadership-culture-intelligence.ts"],
  ["incentive-modeling-intelligence.ts", "mission-alignment-intelligence.ts"],
  ["organizational-change-intelligence.ts", "values-alignment-intelligence.ts"],
  ["change-resistance-intelligence.ts", "employee-engagement-intelligence.ts"],
  ["leadership-behavior-intelligence.ts", "collaboration-culture-intelligence.ts"],
  ["team-dynamics-intelligence.ts", "communication-culture-intelligence.ts"],
  ["collaboration-intelligence.ts", "innovation-culture-intelligence.ts"],
  ["communication-patterns-intelligence.ts", "learning-culture-intelligence.ts"],
  ["conflict-behavior-intelligence.ts", "psychological-safety-intelligence.ts"],
  ["customer-behavior-intelligence.ts", "inclusion-belonging-intelligence.ts"],
  ["employee-behavior-intelligence.ts", "cross-cultural-intelligence.ts"],
  ["learning-adaptation-intelligence.ts", "community-culture-intelligence.ts"],
  ["adoption-forecasting-intelligence.ts", "cultural-risk-intelligence.ts"],
  ["behavioral-risk-intelligence.ts", "cultural-opportunity-intelligence.ts"],
  ["behavioral-opportunity-intelligence.ts", "cultural-transformation-intelligence.ts"],
];

const ENGINE_FILE_MAP = [
  ["behavioral-analysis-engine.ts", "cultural-analysis-engine.ts"],
  ["decision-modeling-engine.ts", "culture-mapping-engine.ts"],
  ["cognitive-bias-engine.ts", "engagement-engine.ts"],
  ["motivation-engine.ts", "mission-alignment-engine.ts"],
  ["collaboration-engine.ts", "collaboration-engine.ts"],
  ["change-adoption-engine.ts", "values-alignment-engine.ts"],
  ["early-warning-engine.ts", "early-warning-engine.ts"],
  ["behavioral-forecast-engine.ts", "cultural-forecast-engine.ts"],
  ["behavioral-scenario-engine.ts", "cultural-scenario-engine.ts"],
  ["behavioral-trend-engine.ts", "cultural-trend-engine.ts"],
  ["behavioral-intelligence.ts", "cultural-intelligence.ts"],
  ["behavioral-engine.ts", "cultural-engine.ts"],
  ["behavioral-reasoner.ts", "cultural-reasoner.ts"],
  ["behavioral-registry.ts", "cultural-registry.ts"],
];

const CLASS_RENAMES = [
  ["DecisionBehaviorIntelligence", "OrganizationalCultureIntelligence"],
  ["CognitiveBiasIntelligence", "TeamCultureIntelligence"],
  ["MotivationIntelligence", "LeadershipCultureIntelligence"],
  ["IncentiveModelingIntelligence", "MissionAlignmentIntelligence"],
  ["OrganizationalChangeIntelligence", "ValuesAlignmentIntelligence"],
  ["ChangeResistanceIntelligence", "EmployeeEngagementIntelligence"],
  ["LeadershipBehaviorIntelligence", "CollaborationCultureIntelligence"],
  ["TeamDynamicsIntelligence", "CommunicationCultureIntelligence"],
  ["CollaborationIntelligence", "InnovationCultureIntelligence"],
  ["CommunicationPatternsIntelligence", "LearningCultureIntelligence"],
  ["ConflictBehaviorIntelligence", "PsychologicalSafetyIntelligence"],
  ["CustomerBehaviorIntelligence", "InclusionBelongingIntelligence"],
  ["EmployeeBehaviorIntelligence", "CrossCulturalIntelligence"],
  ["LearningAdaptationIntelligence", "CommunityCultureIntelligence"],
  ["AdoptionForecastingIntelligence", "CulturalRiskIntelligence"],
  ["BehavioralRiskIntelligence", "CulturalOpportunityIntelligence"],
  ["BehavioralOpportunityIntelligence", "CulturalTransformationIntelligence"],
  ["DecisionModelingEngine", "CultureMappingEngine"],
  ["DecisionModelingEngineContract", "CultureMappingEngineContract"],
  ["DecisionModelingSuite", "CultureMappingSuite"],
  ["DecisionModelingRecord", "CultureMappingRecord"],
  ["CognitiveBiasEngine", "EngagementEngine"],
  ["CognitiveBiasEngineContract", "EngagementEngineContract"],
  ["CognitiveBiasSuite", "EngagementSuite"],
  ["CognitiveBiasRecord", "EngagementRecord"],
  ["MotivationEngine", "MissionAlignmentEngine"],
  ["MotivationEngineContract", "MissionAlignmentEngineContract"],
  ["MotivationSuite", "MissionAlignmentSuite"],
  ["MotivationRecord", "MissionAlignmentRecord"],
  ["ChangeAdoptionEngine", "ValuesAlignmentEngine"],
  ["ChangeAdoptionEngineContract", "ValuesAlignmentEngineContract"],
  ["ChangeAdoptionSuite", "ValuesAlignmentSuite"],
  ["ChangeAdoptionRecord", "ValuesAlignmentRecord"],
  ["BehavioralAnalysisEngine", "CulturalAnalysisEngine"],
  ["BehavioralForecastEngine", "CulturalForecastEngine"],
  ["BehavioralScenarioEngine", "CulturalScenarioEngine"],
  ["BehavioralTrendEngine", "CulturalTrendEngine"],
  ["BehavioralKnowledgeContributionEngine", "CulturalKnowledgeContributionEngine"],
  ["BehavioralReasoner", "CulturalReasoner"],
  ["BehavioralRecommendationComposer", "CulturalRecommendationComposer"],
  ["BehavioralIntelligenceEngineImpl", "CulturalIntelligenceEngineImpl"],
  ["BehavioralIntelligenceServiceImpl", "CulturalIntelligenceServiceImpl"],
  ["BehavioralIntelligenceEngine", "CulturalIntelligenceEngine"],
  ["BehavioralIntelligenceService", "CulturalIntelligenceService"],
  ["BehavioralEngineImpl", "CulturalEngineImpl"],
  ["BehavioralServiceImpl", "CulturalServiceImpl"],
  ["BehavioralEngine", "CulturalEngine"],
  ["BehavioralService", "CulturalService"],
  ["BehavioralRepositoryStore", "CulturalRepositoryStore"],
  ["BehavioralRegistryStore", "CulturalRegistryStore"],
  ["BehavioralProjection", "CulturalProjection"],
  ["BehavioralQueries", "CulturalQueries"],
  ["BehavioralModels", "CulturalModels"],
  ["BehavioralIntelligence", "CulturalIntelligence"],
  ["createBehavioralIntelligence", "createCulturalIntelligence"],
  ["CreateBehavioralOptions", "CreateCulturalOptions"],
  ["BehavioralStack", "CulturalStack"],
  ["BehavioralDependencies", "CulturalDependencies"],
  ["BehavioralServiceDependencies", "CulturalServiceDependencies"],
  ["BehavioralAreaIntelligence", "CulturalAreaIntelligence"],
  ["BehavioralForecastEngineContract", "CulturalForecastEngineContract"],
  ["BehavioralScenarioEngineContract", "CulturalScenarioEngineContract"],
  ["BehavioralTrendEngineContract", "CulturalTrendEngineContract"],
  ["BehavioralAnalysisEngineContract", "CulturalAnalysisEngineContract"],
  ["BehavioralReasonerContract", "CulturalReasonerContract"],
  ["BehavioralRepository", "CulturalRepository"],
  ["BehavioralRegistry", "CulturalRegistry"],
  ["DecisionIntelligenceDashboard", "OrganizationalCultureDashboard"],
  ["OrganizationalChangeDashboard", "MissionValuesDashboard"],
  ["LeadershipDashboard", "EmployeeEngagementDashboard"],
  ["TeamDynamicsDashboard", "InnovationCultureDashboard"],
  ["AdoptionForecastDashboard", "CulturalTransformationDashboard"],
  ["BehavioralOutlookDashboard", "CulturalForecastDashboard"],
  ["ExecutiveBehavioralBrief", "ExecutiveCulturalBrief"],
  ["BoardBehavioralReport", "BoardCulturalReport"],
  ["BehavioralDashboard", "CulturalDashboard"],
  ["BehavioralHealthScore", "CulturalHealthScore"],
  ["BehavioralRecommendationRecord", "CulturalRecommendationRecord"],
  ["BehavioralRiskRecord", "CulturalRiskRecord"],
  ["BehavioralOpportunityRecord", "CulturalOpportunityRecord"],
  ["BehavioralKnowledgeContribution", "CulturalKnowledgeContribution"],
  ["BehavioralKnowledgeDraft", "CulturalKnowledgeDraft"],
  ["BehavioralHistoryRecord", "CulturalHistoryRecord"],
  ["BehavioralPublisher", "CulturalPublisher"],
  ["BehavioralQueryRequest", "CulturalQueryRequest"],
  ["BehavioralQueryResult", "CulturalQueryResult"],
  ["BehavioralReasoningResult", "CulturalReasoningResult"],
  ["BehavioralProjectionResult", "CulturalProjectionResult"],
  ["BehavioralAnalysisRecord", "CulturalAnalysisRecord"],
  ["BehavioralAnalysisSuite", "CulturalAnalysisSuite"],
  ["BehavioralForecastRecord", "CulturalForecastRecord"],
  ["BehavioralForecastSuite", "CulturalForecastSuite"],
  ["BehavioralScenarioRecord", "CulturalScenarioRecord"],
  ["BehavioralScenarioSuite", "CulturalScenarioSuite"],
  ["BehavioralTrendRecord", "CulturalTrendRecord"],
  ["BehavioralTrendSuite", "CulturalTrendSuite"],
  ["BehavioralAreaRecord", "CulturalAreaRecord"],
  ["BehavioralAreaSuite", "CulturalAreaSuite"],
  ["BehavioralScore", "CulturalScore"],
  ["BehavioralConfidenceScore", "CulturalConfidenceScore"],
  ["BehavioralBaseline", "CulturalBaseline"],
  ["BehavioralRequest", "CulturalRequest"],
  ["BehavioralResult", "CulturalResult"],
  ["BehavioralLens", "CulturalLens"],
  ["BehavioralCapability", "CulturalCapability"],
  ["BehavioralArea", "CulturalArea"],
  ["BehavioralScenarioKind", "CulturalScenarioKind"],
  ["BehavioralAnalysisKind", "CulturalAnalysisKind"],
  ["BehavioralHealthStatus", "CulturalHealthStatus"],
  ["BehavioralPriorityBand", "CulturalPriorityBand"],
  ["BehavioralArtifactStatus", "CulturalArtifactStatus"],
  ["BehavioralConfidenceLevel", "CulturalConfidenceLevel"],
  ["BehavioralOutlook", "CulturalOutlook"],
  ["BehavioralMetadata", "CulturalMetadata"],
];

const CONST_RENAMES = [
  ["BEHAVIORAL_INTELLIGENCE_VERSION", "CULTURAL_INTELLIGENCE_VERSION"],
  ["BEHAVIORAL_CAPABILITIES", "CULTURAL_CAPABILITIES"],
  ["BEHAVIORAL_AREAS", "CULTURAL_AREAS"],
  ["BEHAVIORAL_SCENARIOS", "CULTURAL_SCENARIOS"],
  ["BEHAVIORAL_ANALYSIS_KINDS", "CULTURAL_ANALYSIS_KINDS"],
  ["BEHAVIORAL_HEALTH_STATUSES", "CULTURAL_HEALTH_STATUSES"],
  ["BEHAVIORAL_PRIORITY_BANDS", "CULTURAL_PRIORITY_BANDS"],
  ["BEHAVIORAL_ARTIFACT_STATUSES", "CULTURAL_ARTIFACT_STATUSES"],
  ["BEHAVIORAL_CONFIDENCE_LEVELS", "CULTURAL_CONFIDENCE_LEVELS"],
  ["BEHAVIORAL_OUTLOOKS", "CULTURAL_OUTLOOKS"],
];

function snakeToCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function snakeToPascal(s) {
  const camel = snakeToCamel(s);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function transformContent(content) {
  let out = content;

  // Path renames first
  out = out.replaceAll("@/lib/platform/intelligence/behavioral/", "@/lib/platform/intelligence/cultural/");
  out = out.replaceAll("intelligence/behavioral", "intelligence/cultural");

  // Class/type renames (longest first already ordered)
  for (const [from, to] of CLASS_RENAMES) {
    out = out.replaceAll(from, to);
  }
  for (const [from, to] of CONST_RENAMES) {
    out = out.replaceAll(from, to);
  }

  // Area snake_case (longest first)
  const areas = [...AREA_MAP].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of areas) {
    out = out.replaceAll(from, to);
  }

  // CamelCase area score field names from old areas
  for (const [from, to] of areas) {
    const fromCamel = snakeToCamel(from);
    const toCamel = snakeToCamel(to);
    out = out.replaceAll(`${fromCamel}Score`, `${toCamel}Score`);
    out = out.replaceAll(fromCamel, toCamel);
  }

  // Generic Behavioral -> Cultural word replacements
  out = out.replaceAll("Behavioral", "Cultural");
  out = out.replaceAll("behavioral", "cultural");
  out = out.replaceAll("BEHAVIORAL", "CULTURAL");

  // ID prefix
  out = out.replaceAll('"beh-', '"cul-');
  out = out.replaceAll("`beh-", "`cul-");
  out = out.replaceAll("'beh-", "'cul-");
  out = out.replaceAll("beh-", "cul-");

  // Soft light types: cultural should soft-read behavioral (not reputation/customer)
  // After global replace, ReputationResultLight -> still need BehavioralResultLight
  // Fix soft integrations on request

  return out;
}

function writeFile(rel, content) {
  const full = path.join(DEST, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
}

// Clean dest
if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true, force: true });
}
fs.mkdirSync(DEST, { recursive: true });

const skipDocs = new Set(["README.md", "ARCHITECTURE.md", "VERIFICATION.md", "CHANGELOG.md"]);

// Copy shared non-area files
const sharedFiles = [
  "types.ts", "contracts.ts", "models.ts", "area-factory.ts",
  "knowledge-contribution.ts", "closed-learning-loop.ts",
  "projection.ts", "repository.ts", "service.ts", "index.ts",
];

for (const f of sharedFiles) {
  const raw = fs.readFileSync(path.join(SRC, f), "utf8");
  writeFile(f, transformContent(raw));
}

for (const [from, to] of AREA_FILE_MAP) {
  const raw = fs.readFileSync(path.join(SRC, from), "utf8");
  writeFile(to, transformContent(raw));
}

for (const [from, to] of ENGINE_FILE_MAP) {
  const raw = fs.readFileSync(path.join(SRC, from), "utf8");
  writeFile(to, transformContent(raw));
}

console.log("Base transform done. Applying domain-specific patches...");

// ========== DOMAIN-SPECIFIC PATCHES ==========

// --- types.ts ---
const types = `import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const CULTURAL_INTELLIGENCE_VERSION = "0.1.0";
export const CULTURAL_CAPABILITIES = [
  "organizational_culture", "team_culture", "leadership_culture", "mission_alignment", "values_alignment",
  "employee_engagement", "collaboration_culture", "communication_culture", "innovation_culture", "learning_culture",
  "psychological_safety", "inclusion_belonging", "cross_cultural", "community_culture", "cultural_risk",
  "cultural_opportunity", "cultural_transformation",
  "cultural_analysis", "culture_mapping", "engagement_analysis", "mission_alignment_analysis", "values_alignment_analysis",
  "collaboration_analysis", "cultural_trends", "cultural_forecasts",
  "scenario_planning", "early_warning", "recommendation_generation", "knowledge_contribution",
  "closed_learning_loop",
] as const;
export const CULTURAL_AREAS = [
  "organizational_culture", "team_culture", "leadership_culture", "mission_alignment", "values_alignment",
  "employee_engagement", "collaboration_culture", "communication_culture", "innovation_culture", "learning_culture",
  "psychological_safety", "inclusion_belonging", "cross_cultural", "community_culture", "cultural_risk",
  "cultural_opportunity", "cultural_transformation",
] as const;
export const CULTURAL_SCENARIOS = [
  "culture_fragmentation", "values_drift", "engagement_collapse", "psychological_safety_failure",
  "mission_misalignment", "innovation_stagnation", "inclusion_backslide", "collaboration_breakdown",
  "transformation_resistance", "cross_cultural_friction",
] as const;
export const CULTURAL_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "culture_mapping", "mission_alignment", "values_alignment",
  "engagement_quality", "collaboration_quality", "innovation_readiness", "psychological_safety",
  "cultural_risk", "early_warning",
] as const;
export const CULTURAL_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const CULTURAL_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const CULTURAL_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const CULTURAL_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const CULTURAL_OUTLOOKS = ["cohesive", "stable", "fragmented", "volatile", "uncertain"] as const;

export type CulturalCapability = typeof CULTURAL_CAPABILITIES[number];
export type CulturalArea = typeof CULTURAL_AREAS[number];
export type CulturalScenarioKind = typeof CULTURAL_SCENARIOS[number];
export type CulturalAnalysisKind = typeof CULTURAL_ANALYSIS_KINDS[number];
export type CulturalHealthStatus = typeof CULTURAL_HEALTH_STATUSES[number];
export type CulturalPriorityBand = typeof CULTURAL_PRIORITY_BANDS[number];
export type CulturalArtifactStatus = typeof CULTURAL_ARTIFACT_STATUSES[number];
export type CulturalConfidenceLevel = typeof CULTURAL_CONFIDENCE_LEVELS[number];
export type CulturalOutlook = typeof CULTURAL_OUTLOOKS[number];
export type CulturalMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every cultural recommendation answers these eight leadership questions. */
export interface CulturalLens {
  missionAlignment: string;
  valuesAlignment: string;
  culturalHealth: string;
  collaborationQuality: string;
  innovationReadiness: string;
  psychologicalSafety: string;
  engagement: string;
  longTermCulturalOutlook: string;
}

export interface CulturalScore { key: string; label: string; value: number; status: CulturalHealthStatus; band: CulturalPriorityBand; narrative: string; }
export interface CulturalConfidenceScore { value: number; level: CulturalConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface BehavioralResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  decisionBehaviorScore?: { value?: number };
  motivationScore?: { value?: number };
  collaborationScore?: { value?: number };
}
export interface StakeholderResultLight extends ResultLightBase {
  stakeholderScore?: { value?: number };
  trustLevel?: number;
  engagementQuality?: number;
  relationshipStrength?: number;
}
export interface HumanCapitalResultLight extends ResultLightBase {
  humanCapitalScore?: { value?: number };
  engagementScore?: { value?: number };
  leadershipScore?: { value?: number };
}
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }
/** Soft-read when knowledge context is attached (future-ready soft optional light). */
export interface KnowledgeResultLight extends ResultLightBase {
  knowledgeScore?: { value?: number };
  coverageScore?: { value?: number };
}

export interface CulturalBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<CulturalArea, number>;
  missionAlignment: number;
  valuesAlignment: number;
  culturalHealth: number;
  collaborationQuality: number;
  innovationReadiness: number;
  psychologicalSafety: number;
  engagement: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface CulturalAreaRecord {
  id: string; area: CulturalArea; title: string; score: number; status: CulturalArtifactStatus;
  signal: string; evidence: string[]; lenses: CulturalLens; narrative: string;
}
export interface CulturalAreaSuite {
  area: CulturalArea; records: CulturalAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface CulturalTrendRecord {
  id: string; area: CulturalArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: CulturalConfidenceLevel; lenses: CulturalLens; narrative: string;
}
export interface CulturalTrendSuite { trends: CulturalTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface CulturalForecastRecord {
  id: string; area: CulturalArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: CulturalConfidenceLevel; lenses: CulturalLens; narrative: string;
}
export interface CulturalForecastSuite {
  forecasts: CulturalForecastRecord[]; outlook: CulturalOutlook;
  maturityScore: number; narrative: string;
}

export interface CulturalScenarioRecord {
  id: string; kind: CulturalScenarioKind; title: string; probability: number;
  severity: CulturalPriorityBand; organizationalImpact: number;
  missionImpact: number; engagementImpact: number; monitors: string[];
  lenses: CulturalLens; narrative: string;
}
export interface CulturalScenarioSuite {
  scenarios: CulturalScenarioRecord[]; primaryScenario: CulturalScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface CulturalAnalysisRecord {
  id: string; kind: CulturalAnalysisKind; title: string; score: number;
  status: CulturalArtifactStatus; lenses: CulturalLens; narrative: string;
}
export interface CulturalAnalysisSuite {
  analyses: CulturalAnalysisRecord[]; kindsCovered: CulturalAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface CultureMappingRecord {
  id: string; title: string; confidence: number; lenses: CulturalLens; narrative: string;
}
export interface CultureMappingSuite {
  records: CultureMappingRecord[]; score: number; cultureIndex: number; narrative: string;
}

export interface EngagementRecord {
  id: string; title: string; engagement: number; lenses: CulturalLens; narrative: string;
}
export interface EngagementSuite {
  records: EngagementRecord[]; score: number; engagementIndex: number; narrative: string;
}

export interface MissionAlignmentRecord {
  id: string; title: string; alignment: number; lenses: CulturalLens; narrative: string;
}
export interface MissionAlignmentSuite {
  records: MissionAlignmentRecord[]; score: number; missionIndex: number; narrative: string;
}

export interface ValuesAlignmentRecord {
  id: string; title: string; alignment: number; lenses: CulturalLens; narrative: string;
}
export interface ValuesAlignmentSuite {
  records: ValuesAlignmentRecord[]; score: number; valuesIndex: number; narrative: string;
}

export interface CollaborationRecord {
  id: string; title: string; collaboration: number; lenses: CulturalLens; narrative: string;
}
export interface CollaborationSuite {
  records: CollaborationRecord[]; score: number; collaborationIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: CulturalPriorityBand; source: string;
  score: number; lenses: CulturalLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface CulturalKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: CulturalMetadata;
}
export interface CulturalKnowledgeContribution {
  artifacts: CulturalKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"behavioral" | "stakeholder" | "human-capital" | "opportunity" | "knowledge" | "executive-decision" | "predictive">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface CulturalRecommendationRecord {
  id: string; title: string; priority: CulturalPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: CulturalLens; narrative: string;
}
export interface CulturalRiskRecord {
  id: string; title: string; area: CulturalArea; severity: CulturalPriorityBand;
  score: number; mitigation: string; lenses: CulturalLens; narrative: string;
}
export interface CulturalOpportunityRecord {
  id: string; title: string; area: CulturalArea; priority: CulturalPriorityBand;
  score: number; lenses: CulturalLens; narrative: string;
}

export interface CulturalDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<CulturalArea, number>; outlook: CulturalOutlook;
  missionAlignment: number; valuesAlignment: number; engagement: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface OrganizationalCultureDashboard {
  generatedAt: string; headline: string; score: number;
  cultureIndex: number; signals: string[]; narrative: string;
}
export interface MissionValuesDashboard {
  generatedAt: string; headline: string; score: number;
  missionAlignment: number; valuesAlignment: number; signals: string[]; narrative: string;
}
export interface EmployeeEngagementDashboard {
  generatedAt: string; headline: string; score: number;
  engagement: number; signals: string[]; narrative: string;
}
export interface CollaborationDashboard {
  generatedAt: string; headline: string; score: number;
  collaborationIndex: number; signals: string[]; narrative: string;
}
export interface InnovationCultureDashboard {
  generatedAt: string; headline: string; score: number;
  innovationReadiness: number; signals: string[]; narrative: string;
}
export interface CulturalTransformationDashboard {
  generatedAt: string; headline: string; score: number;
  transformationScore: number; signals: string[]; narrative: string;
}
export interface CulturalForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: CulturalOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveCulturalBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: CulturalOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: CulturalLens; narrative: string;
}
export interface BoardCulturalReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: CulturalOutlook; missionScore: number;
  engagementScore: number; valuesScore: number; recommendations: string[];
  lenses: CulturalLens; narrative: string;
}
export interface CulturalHealthScore {
  overallScore: number; status: CulturalHealthStatus; outlook: CulturalOutlook;
  areaScores: Record<CulturalArea, number>; missionScore: number;
  engagementScore: number; collaborationScore: number; valuesScore: number;
  forecastScore: number; scenarioScore: number; lenses: CulturalLens; narrative: string;
}
export interface CulturalReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: CulturalConfidenceScore; narrative: string;
}
export interface CulturalProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<CulturalArea, number>; outlook: CulturalOutlook;
  forecast: number; dashboard: CulturalDashboard; brief: ExecutiveCulturalBrief;
  overallConfidence: CulturalConfidenceScore;
}
export interface CulturalHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: CulturalArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: CulturalMetadata;
}
export interface CulturalPublisher { domain: string; capability: string; }
export interface CulturalQueryRequest {
  question: string;
  focus?: "general" | CulturalArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface CulturalQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: CulturalConfidenceScore;
}

export interface CulturalRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  behavioralResult?: BehavioralResultLight; stakeholderResult?: StakeholderResultLight;
  humanCapitalResult?: HumanCapitalResultLight;
  opportunityResult?: OpportunityResultLight; decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight; knowledgeResult?: KnowledgeResultLight;
  baselineOverrides?: Partial<CulturalBaseline>; metadata?: CulturalMetadata;
}

export interface CulturalResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: CulturalBaseline;
  healthScore: CulturalScore;
  organizationalCultureScore: CulturalScore;
  teamCultureScore: CulturalScore;
  leadershipCultureScore: CulturalScore;
  missionAlignmentScore: CulturalScore;
  valuesAlignmentScore: CulturalScore;
  employeeEngagementScore: CulturalScore;
  collaborationCultureScore: CulturalScore;
  communicationCultureScore: CulturalScore;
  innovationCultureScore: CulturalScore;
  learningCultureScore: CulturalScore;
  psychologicalSafetyScore: CulturalScore;
  inclusionBelongingScore: CulturalScore;
  crossCulturalScore: CulturalScore;
  communityCultureScore: CulturalScore;
  culturalRiskScore: CulturalScore;
  culturalOpportunityScore: CulturalScore;
  culturalTransformationScore: CulturalScore;
  forecastScore: CulturalScore; scenarioScore: CulturalScore; analysisScore: CulturalScore;
  earlyWarningScore: CulturalScore;
  cultureMappingScore: CulturalScore;
  engagementScore: CulturalScore;
  health: CulturalHealthScore; dashboard: CulturalDashboard;
  organizationalCultureDashboard: OrganizationalCultureDashboard;
  missionValuesDashboard: MissionValuesDashboard;
  employeeEngagementDashboard: EmployeeEngagementDashboard;
  collaborationDashboard: CollaborationDashboard;
  innovationCultureDashboard: InnovationCultureDashboard;
  culturalTransformationDashboard: CulturalTransformationDashboard;
  forecastDashboard: CulturalForecastDashboard;
  brief: ExecutiveCulturalBrief; boardReport: BoardCulturalReport;
  recommendations: CulturalRecommendationRecord[]; risks: CulturalRiskRecord[];
  opportunities: CulturalOpportunityRecord[];
  areaSuites: Record<CulturalArea, CulturalAreaSuite>;
  trendSuite: CulturalTrendSuite; forecastSuite: CulturalForecastSuite;
  scenarioSuite: CulturalScenarioSuite; analysisSuite: CulturalAnalysisSuite;
  cultureMappingSuite: CultureMappingSuite;
  engagementSuite: EngagementSuite;
  missionAlignmentSuite: MissionAlignmentSuite;
  valuesAlignmentSuite: ValuesAlignmentSuite;
  collaborationSuite: CollaborationSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: CulturalKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: CulturalReasoningResult; projection: CulturalProjectionResult;
  historyRecord: CulturalHistoryRecord; confidence: CulturalConfidenceScore;
  requestMetadata: CulturalMetadata;
}
`;
writeFile("types.ts", types);

// --- contracts.ts ---
const contracts = `import type * as T from "@/lib/platform/intelligence/cultural/types";

export interface CulturalIntelligenceEngine { build(request: T.CulturalRequest): T.CulturalResult; }
export type CulturalEngine = CulturalIntelligenceEngine;
export interface CulturalAreaIntelligence {
  assess(input: { baseline: T.CulturalBaseline; now: Date; createId: (prefix: string) => string }): T.CulturalAreaSuite;
}
export interface CulturalForecastEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CulturalForecastSuite;
}
export interface CulturalScenarioEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; forecasts: T.CulturalForecastSuite; now: Date; createId: (prefix: string) => string }): T.CulturalScenarioSuite;
}
export interface CulturalTrendEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CulturalTrendSuite;
}
export interface CulturalAnalysisEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; forecasts: T.CulturalForecastSuite; scenarios: T.CulturalScenarioSuite; now: Date; createId: (prefix: string) => string }): T.CulturalAnalysisSuite;
}
export interface CultureMappingEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CultureMappingSuite;
}
export interface EngagementEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EngagementSuite;
}
export interface MissionAlignmentEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.MissionAlignmentSuite;
}
export interface ValuesAlignmentEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ValuesAlignmentSuite;
}
export interface CollaborationEngineContract {
  assess(input: { baseline: T.CulturalBaseline; areas: Record<T.CulturalArea, T.CulturalAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollaborationSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.CulturalBaseline; trends: T.CulturalTrendSuite; scenarios: T.CulturalScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface CulturalReasonerContract {
  reason(input: { request: T.CulturalRequest; trends: T.CulturalTrendSuite; forecasts: T.CulturalForecastSuite; scenarios: T.CulturalScenarioSuite; confidence: T.CulturalConfidenceScore }): T.CulturalReasoningResult;
}
export interface CulturalRepository {
  save(result: T.CulturalResult): T.CulturalResult;
  get(requestId: string): T.CulturalResult | null;
  list(scope?: Partial<T.GraphScope>): T.CulturalResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.CulturalHistoryRecord): T.CulturalHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.CulturalHistoryRecord[];
  clear(): void;
}
export interface CulturalRegistry {
  register(domain: string, capability: string): void;
  list(): T.CulturalPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface CulturalIntelligenceService {
  build(request: T.CulturalRequest): T.CulturalResult;
  query(result: T.CulturalResult, request: T.CulturalQueryRequest): T.CulturalQueryResult;
  repository(): CulturalRepository;
}
export type CulturalService = CulturalIntelligenceService;
export interface CulturalDependencies {
  engine?: CulturalIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.CulturalArea, CulturalAreaIntelligence>>;
  forecastEngine?: CulturalForecastEngineContract;
  scenarioEngine?: CulturalScenarioEngineContract;
  trendEngine?: CulturalTrendEngineContract;
  analysisEngine?: CulturalAnalysisEngineContract;
  cultureMappingEngine?: CultureMappingEngineContract;
  engagementEngine?: EngagementEngineContract;
  missionAlignmentEngine?: MissionAlignmentEngineContract;
  valuesAlignmentEngine?: ValuesAlignmentEngineContract;
  collaborationEngine?: CollaborationEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: CulturalReasonerContract;
  repository?: CulturalRepository;
  registry?: CulturalRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
`;
writeFile("contracts.ts", contracts);

// --- models.ts ---
const models = `import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  CulturalBaseline, CulturalConfidenceLevel, CulturalConfidenceScore,
  CulturalHealthStatus, CulturalLens, CulturalOutlook, CulturalPriorityBand,
  CulturalRequest,
} from "@/lib/platform/intelligence/cultural/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): CulturalHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): CulturalPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): CulturalConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): CulturalOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 78) return "cohesive"; if (score >= 62) return "stable"; if (score >= 45) return "fragmented"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): CulturalConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(lens: CulturalLens): CulturalLens {
  return {
    missionAlignment: lens.missionAlignment,
    valuesAlignment: lens.valuesAlignment,
    culturalHealth: lens.culturalHealth,
    collaborationQuality: lens.collaborationQuality,
    innovationReadiness: lens.innovationReadiness,
    psychologicalSafety: lens.psychologicalSafety,
    engagement: lens.engagement,
    longTermCulturalOutlook: lens.longTermCulturalOutlook,
  };
}
export const defaultCreateId = (prefix: string) => \`\${prefix}-\${Math.random().toString(36).slice(2, 10)}\`;
export const defaultPeriodLabel = (now = new Date()) => \`\${now.getUTCFullYear()}-Q\${Math.floor(now.getUTCMonth() / 3) + 1}\`;
export const emptyCulturalScope = (): GraphScope => ({ organizationId: null, schoolId: null });
const lightScore = (value: unknown, fallback: number) => typeof value === "number" ? (value <= 1 ? value * 100 : value) : fallback;

export function defaultCulturalBaseline(): CulturalBaseline {
  return {
    organizationHealthScore: 72, executionScore: 68,
    areaScores: {
      organizational_culture: 64,
      team_culture: 63,
      leadership_culture: 62,
      mission_alignment: 61,
      values_alignment: 60,
      employee_engagement: 59,
      collaboration_culture: 58,
      communication_culture: 57,
      innovation_culture: 64,
      learning_culture: 63,
      psychological_safety: 62,
      inclusion_belonging: 61,
      cross_cultural: 60,
      community_culture: 59,
      cultural_risk: 58,
      cultural_opportunity: 57,
      cultural_transformation: 64,
    },
    missionAlignment: 62, valuesAlignment: 61, culturalHealth: 60,
    collaborationQuality: 58, innovationReadiness: 60, psychologicalSafety: 61,
    engagement: 59,
    forecastMaturity: 60, scenarioMaturity: 58, evidenceCoverage: 62,
  };
}

export function deriveCulturalBaseline(request: CulturalRequest): CulturalBaseline {
  const base = defaultCulturalBaseline();
  const health = request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore;
  const behavioral = lightScore(request.behavioralResult?.healthScore?.value, base.culturalHealth);
  const behDecision = lightScore(request.behavioralResult?.decisionBehaviorScore?.value, base.missionAlignment);
  const behMotivation = lightScore(request.behavioralResult?.motivationScore?.value, base.engagement);
  const behCollaboration = lightScore(request.behavioralResult?.collaborationScore?.value, base.collaborationQuality);
  const stakeholder = lightScore(request.stakeholderResult?.stakeholderScore?.value ?? request.stakeholderResult?.healthScore?.value, base.collaborationQuality);
  const stakeholderTrust = lightScore(request.stakeholderResult?.trustLevel, stakeholder);
  const stakeholderEngagement = lightScore(request.stakeholderResult?.engagementQuality, base.engagement);
  const humanCapital = lightScore(request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, base.areaScores.employee_engagement);
  const hcEngagement = lightScore(request.humanCapitalResult?.engagementScore?.value, stakeholderEngagement);
  const hcLeadership = lightScore(request.humanCapitalResult?.leadershipScore?.value, base.areaScores.leadership_culture);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, base.areaScores.cultural_opportunity);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const knowledge = lightScore(request.knowledgeResult?.knowledgeScore?.value ?? request.knowledgeResult?.coverageScore?.value ?? request.knowledgeResult?.healthScore?.value, base.areaScores.learning_culture);

  const areaScores = { ...base.areaScores };
  areaScores.organizational_culture = clamp((behavioral + stakeholderTrust + decision) / 3);
  areaScores.team_culture = clamp((humanCapital + behCollaboration + stakeholder) / 3);
  areaScores.leadership_culture = clamp((hcLeadership + decision + behDecision) / 3);
  areaScores.mission_alignment = clamp((behDecision + decision + knowledge) / 3);
  areaScores.values_alignment = clamp((areaScores.mission_alignment + stakeholderTrust + behavioral) / 3);
  areaScores.employee_engagement = clamp((hcEngagement + stakeholderEngagement + behMotivation) / 3);
  areaScores.collaboration_culture = clamp((behCollaboration + stakeholder + areaScores.team_culture) / 3);
  areaScores.communication_culture = clamp((areaScores.collaboration_culture + knowledge + knowledge) / 3);
  areaScores.innovation_culture = clamp((opportunity + knowledge + areaScores.collaboration_culture) / 3);
  areaScores.learning_culture = clamp((knowledge + predictive + areaScores.innovation_culture) / 3);
  areaScores.psychological_safety = clamp((areaScores.team_culture + areaScores.employee_engagement + (100 - (100 - behavioral) * .4)) / 3);
  areaScores.inclusion_belonging = clamp((stakeholder + areaScores.psychological_safety + hcEngagement) / 3);
  areaScores.cross_cultural = clamp((areaScores.inclusion_belonging + stakeholder + knowledge) / 3);
  areaScores.community_culture = clamp((stakeholder + areaScores.organizational_culture + areaScores.inclusion_belonging) / 3);
  areaScores.cultural_risk = clamp(100 - ((100 - areaScores.psychological_safety) * .35 + (100 - areaScores.values_alignment) * .35 + (100 - areaScores.employee_engagement) * .3));
  areaScores.cultural_opportunity = clamp((opportunity + areaScores.innovation_culture + areaScores.learning_culture) / 3);
  areaScores.cultural_transformation = clamp((areaScores.mission_alignment + areaScores.employee_engagement + predictive) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(lightScore(health, 72)),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    missionAlignment: clamp(areaScores.mission_alignment),
    valuesAlignment: clamp(areaScores.values_alignment),
    culturalHealth: clamp(areaScores.organizational_culture),
    collaborationQuality: clamp(areaScores.collaboration_culture),
    innovationReadiness: clamp(areaScores.innovation_culture),
    psychologicalSafety: clamp(areaScores.psychological_safety),
    engagement: clamp(areaScores.employee_engagement),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.cultural_risk) / 2),
    evidenceCoverage: clamp((behavioral + stakeholder + humanCapital + knowledge) / 4),
    ...request.baselineOverrides,
  };
}

export const culturalModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyCulturalScope,
  defaultCulturalBaseline, deriveCulturalBaseline,
};
export class CulturalModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveCulturalBaseline;
  static baseline = defaultCulturalBaseline; static outlook = outlookFromScore;
}
`;
writeFile("models.ts", models);

console.log("types/contracts/models written");
console.log("Files so far:", fs.readdirSync(DEST).length);
