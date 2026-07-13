/**
 * Generate Sprint 054 Ethical Intelligence by transforming Cultural (053), then patching domain specifics.
 * Run: node scripts/generate-ethical-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src/lib/platform/intelligence");
const SRC = path.join(ROOT, "cultural");
const DEST = path.join(ROOT, "ethical");

const AREA_MAP = [
  ["organizational_culture", "ethical_decision_analysis"],
  ["team_culture", "values_alignment"],
  ["leadership_culture", "fairness"],
  ["mission_alignment", "transparency"],
  ["values_alignment", "accountability"],
  ["employee_engagement", "human_impact"],
  ["collaboration_culture", "ai_ethics"],
  ["communication_culture", "responsible_automation"],
  ["innovation_culture", "bias_discrimination"],
  ["learning_culture", "governance_ethics"],
  ["psychological_safety", "privacy_data_ethics"],
  ["inclusion_belonging", "sustainability_ethics"],
  ["cross_cultural", "social_responsibility"],
  ["community_culture", "ethical_risk"],
  ["cultural_risk", "ethical_opportunity"],
  ["cultural_opportunity", "ethical_stewardship"],
  ["cultural_transformation", "recommendation_validation"],
];

const AREA_FILE_MAP = [
  ["organizational-culture-intelligence.ts", "ethical-decision-analysis-intelligence.ts"],
  ["team-culture-intelligence.ts", "values-alignment-intelligence.ts"],
  ["leadership-culture-intelligence.ts", "fairness-intelligence.ts"],
  ["mission-alignment-intelligence.ts", "transparency-intelligence.ts"],
  ["values-alignment-intelligence.ts", "accountability-intelligence.ts"],
  ["employee-engagement-intelligence.ts", "human-impact-intelligence.ts"],
  ["collaboration-culture-intelligence.ts", "ai-ethics-intelligence.ts"],
  ["communication-culture-intelligence.ts", "responsible-automation-intelligence.ts"],
  ["innovation-culture-intelligence.ts", "bias-discrimination-intelligence.ts"],
  ["learning-culture-intelligence.ts", "governance-ethics-intelligence.ts"],
  ["psychological-safety-intelligence.ts", "privacy-data-ethics-intelligence.ts"],
  ["inclusion-belonging-intelligence.ts", "sustainability-ethics-intelligence.ts"],
  ["cross-cultural-intelligence.ts", "social-responsibility-intelligence.ts"],
  ["community-culture-intelligence.ts", "ethical-risk-intelligence.ts"],
  ["cultural-risk-intelligence.ts", "ethical-opportunity-intelligence.ts"],
  ["cultural-opportunity-intelligence.ts", "ethical-stewardship-intelligence.ts"],
  ["cultural-transformation-intelligence.ts", "recommendation-validation-intelligence.ts"],
];

const ENGINE_FILE_MAP = [
  ["cultural-analysis-engine.ts", "ethical-analysis-engine.ts"],
  ["culture-mapping-engine.ts", "values-alignment-engine.ts"],
  ["engagement-engine.ts", "fairness-engine.ts"],
  ["mission-alignment-engine.ts", "human-impact-engine.ts"],
  ["values-alignment-engine.ts", "ai-ethics-engine.ts"],
  ["collaboration-engine.ts", "governance-ethics-engine.ts"],
  ["early-warning-engine.ts", "early-warning-engine.ts"],
  ["cultural-forecast-engine.ts", "ethical-forecast-engine.ts"],
  ["cultural-scenario-engine.ts", "ethical-scenario-engine.ts"],
  ["cultural-trend-engine.ts", "ethical-trend-engine.ts"],
  ["cultural-intelligence.ts", "ethical-intelligence.ts"],
  ["cultural-engine.ts", "ethical-engine.ts"],
  ["cultural-reasoner.ts", "ethical-reasoner.ts"],
  ["cultural-registry.ts", "ethical-registry.ts"],
];

const CLASS_RENAMES = [
  ["OrganizationalCultureIntelligence", "EthicalDecisionAnalysisIntelligence"],
  ["TeamCultureIntelligence", "ValuesAlignmentIntelligence"],
  ["LeadershipCultureIntelligence", "FairnessIntelligence"],
  ["MissionAlignmentIntelligence", "TransparencyIntelligence"],
  ["ValuesAlignmentIntelligence", "AccountabilityIntelligence"],
  ["EmployeeEngagementIntelligence", "HumanImpactIntelligence"],
  ["CollaborationCultureIntelligence", "AiEthicsIntelligence"],
  ["CommunicationCultureIntelligence", "ResponsibleAutomationIntelligence"],
  ["InnovationCultureIntelligence", "BiasDiscriminationIntelligence"],
  ["LearningCultureIntelligence", "GovernanceEthicsIntelligence"],
  ["PsychologicalSafetyIntelligence", "PrivacyDataEthicsIntelligence"],
  ["InclusionBelongingIntelligence", "SustainabilityEthicsIntelligence"],
  ["CrossCulturalIntelligence", "SocialResponsibilityIntelligence"],
  ["CommunityCultureIntelligence", "EthicalRiskIntelligence"],
  ["CulturalRiskIntelligence", "EthicalOpportunityIntelligence"],
  ["CulturalOpportunityIntelligence", "EthicalStewardshipIntelligence"],
  ["CulturalTransformationIntelligence", "RecommendationValidationIntelligence"],
  ["ValuesAlignmentEngineContract", "AiEthicsEngineContract"],
  ["ValuesAlignmentEngine", "AiEthicsEngine"],
  ["ValuesAlignmentSuite", "AiEthicsSuite"],
  ["ValuesAlignmentRecord", "AiEthicsRecord"],
  ["ValuesAlignmentDashboard", "AiEthicsDashboard"],
  ["MissionAlignmentEngineContract", "HumanImpactEngineContract"],
  ["MissionAlignmentEngine", "HumanImpactEngine"],
  ["MissionAlignmentSuite", "HumanImpactSuite"],
  ["MissionAlignmentRecord", "HumanImpactRecord"],
  ["CultureMappingEngineContract", "ValuesAlignmentEngineContract"],
  ["CultureMappingEngine", "ValuesAlignmentEngine"],
  ["CultureMappingSuite", "ValuesAlignmentSuite"],
  ["CultureMappingRecord", "ValuesAlignmentRecord"],
  ["EngagementEngineContract", "FairnessEngineContract"],
  ["EngagementEngine", "FairnessEngine"],
  ["EngagementSuite", "FairnessSuite"],
  ["EngagementRecord", "FairnessRecord"],
  ["CollaborationEngineContract", "GovernanceEthicsEngineContract"],
  ["CollaborationEngine", "GovernanceEthicsEngine"],
  ["CollaborationSuite", "GovernanceEthicsSuite"],
  ["CollaborationRecord", "GovernanceEthicsRecord"],
  ["CulturalAnalysisEngine", "EthicalAnalysisEngine"],
  ["CulturalForecastEngine", "EthicalForecastEngine"],
  ["CulturalScenarioEngine", "EthicalScenarioEngine"],
  ["CulturalTrendEngine", "EthicalTrendEngine"],
  ["CulturalKnowledgeContributionEngine", "EthicalKnowledgeContributionEngine"],
  ["CulturalReasoner", "EthicalReasoner"],
  ["CulturalRecommendationComposer", "EthicalRecommendationComposer"],
  ["CulturalIntelligenceEngineImpl", "EthicalIntelligenceEngineImpl"],
  ["CulturalIntelligenceServiceImpl", "EthicalIntelligenceServiceImpl"],
  ["CulturalIntelligenceEngine", "EthicalIntelligenceEngine"],
  ["CulturalIntelligenceService", "EthicalIntelligenceService"],
  ["CulturalEngineImpl", "EthicalEngineImpl"],
  ["CulturalServiceImpl", "EthicalServiceImpl"],
  ["CulturalEngine", "EthicalEngine"],
  ["CulturalService", "EthicalService"],
  ["CulturalRepositoryStore", "EthicalRepositoryStore"],
  ["CulturalRegistryStore", "EthicalRegistryStore"],
  ["CulturalProjection", "EthicalProjection"],
  ["CulturalQueries", "EthicalQueries"],
  ["CulturalModels", "EthicalModels"],
  ["CulturalIntelligence", "EthicalIntelligence"],
  ["createCulturalIntelligence", "createEthicalIntelligence"],
  ["CreateCulturalOptions", "CreateEthicalOptions"],
  ["CulturalStack", "EthicalStack"],
  ["CulturalDependencies", "EthicalDependencies"],
  ["CulturalServiceDependencies", "EthicalServiceDependencies"],
  ["CulturalAreaIntelligence", "EthicalAreaIntelligence"],
  ["CulturalForecastEngineContract", "EthicalForecastEngineContract"],
  ["CulturalScenarioEngineContract", "EthicalScenarioEngineContract"],
  ["CulturalTrendEngineContract", "EthicalTrendEngineContract"],
  ["CulturalAnalysisEngineContract", "EthicalAnalysisEngineContract"],
  ["CulturalReasonerContract", "EthicalReasonerContract"],
  ["CulturalRepository", "EthicalRepository"],
  ["CulturalRegistry", "EthicalRegistry"],
  ["OrganizationalCultureDashboard", "ValuesAlignmentDashboard"],
  ["MissionValuesDashboard", "FairnessDashboard"],
  ["EmployeeEngagementDashboard", "HumanImpactDashboard"],
  ["InnovationCultureDashboard", "EthicalRiskDashboard"],
  ["CulturalTransformationDashboard", "GovernanceDashboard"],
  ["CulturalForecastDashboard", "EthicalOutlookDashboard"],
  ["ExecutiveCulturalBrief", "ExecutiveEthicalBrief"],
  ["BoardCulturalReport", "BoardEthicalReport"],
  ["CulturalDashboard", "EthicalDashboard"],
  ["CulturalHealthScore", "EthicalHealthScore"],
  ["CulturalRecommendationRecord", "EthicalRecommendationRecord"],
  ["CulturalRiskRecord", "EthicalRiskRecord"],
  ["CulturalOpportunityRecord", "EthicalOpportunityRecord"],
  ["CulturalKnowledgeContribution", "EthicalKnowledgeContribution"],
  ["CulturalKnowledgeDraft", "EthicalKnowledgeDraft"],
  ["CulturalHistoryRecord", "EthicalHistoryRecord"],
  ["CulturalPublisher", "EthicalPublisher"],
  ["CulturalQueryRequest", "EthicalQueryRequest"],
  ["CulturalQueryResult", "EthicalQueryResult"],
  ["CulturalReasoningResult", "EthicalReasoningResult"],
  ["CulturalProjectionResult", "EthicalProjectionResult"],
  ["CulturalAnalysisRecord", "EthicalAnalysisRecord"],
  ["CulturalAnalysisSuite", "EthicalAnalysisSuite"],
  ["CulturalForecastRecord", "EthicalForecastRecord"],
  ["CulturalForecastSuite", "EthicalForecastSuite"],
  ["CulturalScenarioRecord", "EthicalScenarioRecord"],
  ["CulturalScenarioSuite", "EthicalScenarioSuite"],
  ["CulturalTrendRecord", "EthicalTrendRecord"],
  ["CulturalTrendSuite", "EthicalTrendSuite"],
  ["CulturalAreaRecord", "EthicalAreaRecord"],
  ["CulturalAreaSuite", "EthicalAreaSuite"],
  ["CulturalScore", "EthicalScore"],
  ["CulturalConfidenceScore", "EthicalConfidenceScore"],
  ["CulturalBaseline", "EthicalBaseline"],
  ["CulturalRequest", "EthicalRequest"],
  ["CulturalResult", "EthicalResult"],
  ["CulturalLens", "EthicalLens"],
  ["CulturalCapability", "EthicalCapability"],
  ["CulturalArea", "EthicalArea"],
  ["CulturalScenarioKind", "EthicalScenarioKind"],
  ["CulturalAnalysisKind", "EthicalAnalysisKind"],
  ["CulturalHealthStatus", "EthicalHealthStatus"],
  ["CulturalPriorityBand", "EthicalPriorityBand"],
  ["CulturalArtifactStatus", "EthicalArtifactStatus"],
  ["CulturalConfidenceLevel", "EthicalConfidenceLevel"],
  ["CulturalOutlook", "EthicalOutlook"],
  ["CulturalMetadata", "EthicalMetadata"],
];

const CONST_RENAMES = [
  ["CULTURAL_INTELLIGENCE_VERSION", "ETHICAL_INTELLIGENCE_VERSION"],
  ["CULTURAL_CAPABILITIES", "ETHICAL_CAPABILITIES"],
  ["CULTURAL_AREAS", "ETHICAL_AREAS"],
  ["CULTURAL_SCENARIOS", "ETHICAL_SCENARIOS"],
  ["CULTURAL_ANALYSIS_KINDS", "ETHICAL_ANALYSIS_KINDS"],
  ["CULTURAL_HEALTH_STATUSES", "ETHICAL_HEALTH_STATUSES"],
  ["CULTURAL_PRIORITY_BANDS", "ETHICAL_PRIORITY_BANDS"],
  ["CULTURAL_ARTIFACT_STATUSES", "ETHICAL_ARTIFACT_STATUSES"],
  ["CULTURAL_CONFIDENCE_LEVELS", "ETHICAL_CONFIDENCE_LEVELS"],
  ["CULTURAL_OUTLOOKS", "ETHICAL_OUTLOOKS"],
];

function snakeToCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function transformContent(content) {
  let out = content;
  out = out.replaceAll("@/lib/platform/intelligence/cultural/", "@/lib/platform/intelligence/ethical/");
  out = out.replaceAll("intelligence/cultural", "intelligence/ethical");
  for (const [from, to] of CLASS_RENAMES) out = out.replaceAll(from, to);
  for (const [from, to] of CONST_RENAMES) out = out.replaceAll(from, to);
  const areas = [...AREA_MAP].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of areas) out = out.replaceAll(from, to);
  for (const [from, to] of areas) {
    const fromCamel = snakeToCamel(from);
    const toCamel = snakeToCamel(to);
    out = out.replaceAll(fromCamel + "Score", toCamel + "Score");
    out = out.replaceAll(fromCamel, toCamel);
  }
  out = out.replaceAll("Cultural", "Ethical");
  out = out.replaceAll("cultural", "ethical");
  out = out.replaceAll("CULTURAL", "ETHICAL");
  out = out.replaceAll('"cul-', '"eth-');
  out = out.replaceAll("`cul-", "`eth-");
  out = out.replaceAll("'cul-", "'eth-");
  out = out.replaceAll("cul-", "eth-");
  return out;
}

function writeFile(rel, content) {
  const full = path.join(DEST, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
}

if (fs.existsSync(DEST)) fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

const sharedFiles = [
  "types.ts", "contracts.ts", "models.ts", "area-factory.ts",
  "knowledge-contribution.ts", "closed-learning-loop.ts",
  "projection.ts", "repository.ts", "service.ts", "index.ts",
];
for (const f of sharedFiles) {
  writeFile(f, transformContent(fs.readFileSync(path.join(SRC, f), "utf8")));
}
for (const [from, to] of AREA_FILE_MAP) {
  writeFile(to, transformContent(fs.readFileSync(path.join(SRC, from), "utf8")));
}
for (const [from, to] of ENGINE_FILE_MAP) {
  writeFile(to, transformContent(fs.readFileSync(path.join(SRC, from), "utf8")));
}
console.log("Base transform done. Files so far:", fs.readdirSync(DEST).length);

console.log("Next: node scripts/generate-ethical-part2.mjs");
