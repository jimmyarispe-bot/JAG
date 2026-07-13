/**
 * Generate Sprint 057 Ecosystem Intelligence package (part 1: types + areas).
 * Run: node scripts/generate-ecosystem-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/ecosystem");
fs.mkdirSync(DEST, { recursive: true });
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");

const AREAS = [
  ["ecosystem_mapping", "EcosystemMappingIntelligence", ["Ecosystem map coverage", "Mapping blind spot"], "Ecosystem Mapping"],
  ["strategic_partnerships", "StrategicPartnershipsIntelligence", ["Strategic partnership strength", "Partnership fracture hotspot"], "Strategic Partnerships"],
  ["supplier_ecosystems", "SupplierEcosystemsIntelligence", ["Supplier ecosystem health", "Supplier network shock"], "Supplier Ecosystems"],
  ["customer_ecosystems", "CustomerEcosystemsIntelligence", ["Customer ecosystem strength", "Customer network gap"], "Customer Ecosystems"],
  ["community_networks", "CommunityNetworksIntelligence", ["Community network density", "Community engagement lag"], "Community Networks"],
  ["industry_networks", "IndustryNetworksIntelligence", ["Industry network position", "Industry isolation risk"], "Industry Networks"],
  ["technology_ecosystems", "TechnologyEcosystemsIntelligence", ["Technology ecosystem fit", "Tech platform exposure"], "Technology Ecosystems"],
  ["academic_research_partnerships", "AcademicResearchPartnershipsIntelligence", ["Academic partnership signal", "Research partnership lag"], "Academic Research Partnerships"],
  ["government_ecosystems", "GovernmentEcosystemsIntelligence", ["Government ecosystem alignment", "Policy ecosystem shift"], "Government Ecosystems"],
  ["investor_funding_networks", "InvestorFundingNetworksIntelligence", ["Funding network strength", "Funding contraction risk"], "Investor Funding Networks"],
  ["nonprofit_ngo_relationships", "NonprofitNgoRelationshipsIntelligence", ["NGO relationship strength", "Nonprofit network gap"], "Nonprofit NGO Relationships"],
  ["platform_ecosystems", "PlatformEcosystemsIntelligence", ["Platform ecosystem leverage", "Disintermediation exposure"], "Platform Ecosystems"],
  ["alliance_intelligence", "AllianceIntelligence", ["Alliance cohesion signal", "Alliance defection hotspot"], "Alliance Intelligence"],
  ["network_effects", "NetworkEffectsIntelligence", ["Network effect strength", "Network effect collapse risk"], "Network Effects"],
  ["ecosystem_dependencies", "EcosystemDependenciesIntelligence", ["Dependency clarity", "Dependency cascade risk"], "Ecosystem Dependencies"],
  ["collaboration_opportunities", "CollaborationOpportunitiesIntelligence", ["Collaboration potential", "Collaboration stall hotspot"], "Collaboration Opportunities"],
  ["ecosystem_risk", "EcosystemRiskIntelligence", ["Ecosystem risk posture", "Enclosure and fracture risk"], "Ecosystem Risk"],
];

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const areaList = AREAS.map(([a]) => `"${a}"`).join(", ");
const areaScoreFields = AREAS.map(([a]) => `  ${snakeToCamel(a)}Score: EcosystemScore;`).join("\n");
const capsExtra = [
  "ecosystem_analysis", "network_mapping", "partnership_analysis", "dependency_analysis",
  "collaboration_analysis", "network_effect_analysis", "ecosystem_trends", "ecosystem_forecasts",
  "scenario_planning", "early_warning", "recommendation_generation", "knowledge_contribution", "closed_learning_loop",
];
const caps = [...AREAS.map(([a]) => a), ...capsExtra].map(c => `"${c}"`).join(", ");

w("area-factory.ts", `import type { EcosystemAreaIntelligence } from "@/lib/platform/intelligence/ecosystem/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ecosystem/models";
import type { EcosystemArea, EcosystemAreaSuite } from "@/lib/platform/intelligence/ecosystem/types";

export function createAreaIntelligence(
  area: EcosystemArea,
  titles: [string, string],
  forceLabel: string,
): new () => EcosystemAreaIntelligence {
  return class implements EcosystemAreaIntelligence {
    assess(input: Parameters<EcosystemAreaIntelligence["assess"]>[0]): EcosystemAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("esm-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: \`\${item.title} reading \${Math.round(value)}.\`,
          evidence: [\`baseline:\${area}\`, \`indicator:\${area}:current\`],
          lenses: buildLens({
            networkStrength: \`Network strength linked to \${area} at \${Math.round(value)}.\`,
            strategicPartnerships: \`Strategic partnership implications of \${area} conditions.\`,
            ecosystemHealth: \`Ecosystem health surrounding \${area}.\`,
            collaborationPotential: \`Collaboration potential reading for \${area}.\`,
            dependencyRisk: \`Dependency risk associated with \${area}.\`,
            networkEffects: \`Network effects around \${area}.\`,
            strategicPosition: \`Strategic position reading for \${area}.\`,
            longTermEcosystemOutlook: \`Long-term ecosystem outlook for \${area} developments.\`,
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
        narrative: \`\${forceLabel} ecosystem score \${Math.round(score)}.\`,
      };
    }
  };
}
`);

for (const [area, cls, titles, label] of AREAS) {
  const file = area === "alliance_intelligence"
    ? "alliance-intelligence.ts"
    : area.replaceAll("_", "-") + "-intelligence.ts";
  w(file, `import { createAreaIntelligence } from "@/lib/platform/intelligence/ecosystem/area-factory";
export class ${cls} extends createAreaIntelligence("${area}", ["${titles[0]}", "${titles[1]}"], "${label}") {}
`);
}

w("types.ts", `import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

export const ECOSYSTEM_INTELLIGENCE_VERSION = "0.1.0";
export const ECOSYSTEM_CAPABILITIES = [
  ${caps},
] as const;
export const ECOSYSTEM_AREAS = [
  ${areaList},
] as const;
export const ECOSYSTEM_SCENARIOS = [
  "partnership_fracture", "supplier_network_shock", "platform_disintermediation", "alliance_defection",
  "network_effect_collapse", "dependency_cascade", "collaboration_stall", "funding_network_contraction",
  "government_ecosystem_shift", "competitor_ecosystem_enclosure",
] as const;
export const ECOSYSTEM_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "network_strength", "strategic_partnerships", "ecosystem_health",
  "collaboration_potential", "dependency_risk", "network_effects", "strategic_position", "ecosystem_risk", "early_warning",
] as const;
export const ECOSYSTEM_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const ECOSYSTEM_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const ECOSYSTEM_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const ECOSYSTEM_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const ECOSYSTEM_OUTLOOKS = ["expanding", "stable", "fragmented", "volatile", "uncertain"] as const;

export type EcosystemCapability = typeof ECOSYSTEM_CAPABILITIES[number];
export type EcosystemArea = typeof ECOSYSTEM_AREAS[number];
export type EcosystemScenarioKind = typeof ECOSYSTEM_SCENARIOS[number];
export type EcosystemAnalysisKind = typeof ECOSYSTEM_ANALYSIS_KINDS[number];
export type EcosystemHealthStatus = typeof ECOSYSTEM_HEALTH_STATUSES[number];
export type EcosystemPriorityBand = typeof ECOSYSTEM_PRIORITY_BANDS[number];
export type EcosystemArtifactStatus = typeof ECOSYSTEM_ARTIFACT_STATUSES[number];
export type EcosystemConfidenceLevel = typeof ECOSYSTEM_CONFIDENCE_LEVELS[number];
export type EcosystemOutlook = typeof ECOSYSTEM_OUTLOOKS[number];
export type EcosystemMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every ecosystem recommendation answers these eight leadership questions. */
export interface EcosystemLens {
  networkStrength: string;
  strategicPartnerships: string;
  ecosystemHealth: string;
  collaborationPotential: string;
  dependencyRisk: string;
  networkEffects: string;
  strategicPosition: string;
  longTermEcosystemOutlook: string;
}

export interface EcosystemScore { key: string; label: string; value: number; status: EcosystemHealthStatus; band: EcosystemPriorityBand; narrative: string; }
export interface EcosystemConfidenceScore { value: number; level: EcosystemConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

interface ResultLightBase { requestId?: string; healthScore?: { value?: number }; baseline?: Record<string, number | undefined>; recommendations?: unknown[]; }
export interface StakeholderResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  engagementScore?: { value?: number };
}
export interface CompetitiveResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  competitiveScore?: { value?: number };
}
export interface MarketResultLight extends ResultLightBase {
  healthScore?: { value?: number };
  marketScore?: { value?: number };
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
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }

export interface EcosystemBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<EcosystemArea, number>;
  networkStrength: number;
  strategicPartnerships: number;
  ecosystemHealth: number;
  collaborationPotential: number;
  dependencyRisk: number;
  networkEffects: number;
  strategicPosition: number;
  longTermEcosystemOutlook: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface EcosystemAreaRecord {
  id: string; area: EcosystemArea; title: string; score: number; status: EcosystemArtifactStatus;
  signal: string; evidence: string[]; lenses: EcosystemLens; narrative: string;
}
export interface EcosystemAreaSuite {
  area: EcosystemArea; records: EcosystemAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface EcosystemTrendRecord {
  id: string; area: EcosystemArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: EcosystemConfidenceLevel; lenses: EcosystemLens; narrative: string;
}
export interface EcosystemTrendSuite { trends: EcosystemTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface EcosystemForecastRecord {
  id: string; area: EcosystemArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: EcosystemConfidenceLevel; lenses: EcosystemLens; narrative: string;
}
export interface EcosystemForecastSuite {
  forecasts: EcosystemForecastRecord[]; outlook: EcosystemOutlook;
  maturityScore: number; narrative: string;
}

export interface EcosystemScenarioRecord {
  id: string; kind: EcosystemScenarioKind; title: string; probability: number;
  severity: EcosystemPriorityBand; organizationalImpact: number;
  partnershipImpact: number; dependencyImpact: number; monitors: string[];
  lenses: EcosystemLens; narrative: string;
}
export interface EcosystemScenarioSuite {
  scenarios: EcosystemScenarioRecord[]; primaryScenario: EcosystemScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface EcosystemAnalysisRecord {
  id: string; kind: EcosystemAnalysisKind; title: string; score: number;
  status: EcosystemArtifactStatus; lenses: EcosystemLens; narrative: string;
}
export interface EcosystemAnalysisSuite {
  analyses: EcosystemAnalysisRecord[]; kindsCovered: EcosystemAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface NetworkMappingRecord {
  id: string; title: string; coverage: number; lenses: EcosystemLens; narrative: string;
}
export interface NetworkMappingSuite {
  records: NetworkMappingRecord[]; score: number; mappingIndex: number; narrative: string;
}

export interface PartnershipRecord {
  id: string; title: string; strength: number; lenses: EcosystemLens; narrative: string;
}
export interface PartnershipSuite {
  records: PartnershipRecord[]; score: number; partnershipIndex: number; narrative: string;
}

export interface DependencyRecord {
  id: string; title: string; risk: number; lenses: EcosystemLens; narrative: string;
}
export interface DependencySuite {
  records: DependencyRecord[]; score: number; dependencyIndex: number; narrative: string;
}

export interface CollaborationRecord {
  id: string; title: string; potential: number; lenses: EcosystemLens; narrative: string;
}
export interface CollaborationSuite {
  records: CollaborationRecord[]; score: number; collaborationIndex: number; narrative: string;
}

export interface NetworkEffectRecord {
  id: string; title: string; effect: number; lenses: EcosystemLens; narrative: string;
}
export interface NetworkEffectSuite {
  records: NetworkEffectRecord[]; score: number; networkEffectIndex: number; narrative: string;
}

export interface EarlyWarningAlert {
  id: string; title: string; severity: EcosystemPriorityBand; source: string;
  score: number; lenses: EcosystemLens; narrative: string;
}
export interface EarlyWarningSuite {
  alerts: EarlyWarningAlert[]; score: number; alertCount: number; narrative: string;
}

export interface EcosystemKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: EcosystemMetadata;
}
export interface EcosystemKnowledgeContribution {
  artifacts: EcosystemKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"stakeholder" | "competitive" | "market" | "systems" | "resilience" | "opportunity" | "predictive">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface EcosystemRecommendationRecord {
  id: string; title: string; priority: EcosystemPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: EcosystemLens; narrative: string;
}
export interface EcosystemRiskRecord {
  id: string; title: string; area: EcosystemArea; severity: EcosystemPriorityBand;
  score: number; mitigation: string; lenses: EcosystemLens; narrative: string;
}
export interface EcosystemOpportunityRecord {
  id: string; title: string; area: EcosystemArea; priority: EcosystemPriorityBand;
  score: number; lenses: EcosystemLens; narrative: string;
}

export interface EcosystemDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<EcosystemArea, number>; outlook: EcosystemOutlook;
  networkStrength: number; strategicPartnerships: number; ecosystemHealth: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface EcosystemMapDashboard {
  generatedAt: string; headline: string; score: number;
  mappingIndex: number; signals: string[]; narrative: string;
}
export interface StrategicPartnershipsDashboard {
  generatedAt: string; headline: string; score: number;
  partnershipIndex: number; signals: string[]; narrative: string;
}
export interface AlliancesDashboard {
  generatedAt: string; headline: string; score: number;
  allianceIndex: number; signals: string[]; narrative: string;
}
export interface DependenciesDashboard {
  generatedAt: string; headline: string; score: number;
  dependencyIndex: number; signals: string[]; narrative: string;
}
export interface CollaborationOpportunitiesDashboard {
  generatedAt: string; headline: string; score: number;
  collaborationIndex: number; signals: string[]; narrative: string;
}
export interface EcosystemHealthDashboard {
  generatedAt: string; headline: string; score: number;
  healthIndex: number; signals: string[]; narrative: string;
}
export interface EcosystemForecastDashboard {
  generatedAt: string; headline: string; score: number;
  outlook: EcosystemOutlook; signals: string[]; narrative: string;
}
export interface ExecutiveEcosystemBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: EcosystemOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: EcosystemLens; narrative: string;
}
export interface BoardEcosystemReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: EcosystemOutlook; partnershipScore: number;
  dependencyScore: number; networkEffectScore: number; recommendations: string[];
  lenses: EcosystemLens; narrative: string;
}
export interface EcosystemHealthScore {
  overallScore: number; status: EcosystemHealthStatus; outlook: EcosystemOutlook;
  areaScores: Record<EcosystemArea, number>; partnershipScore: number;
  dependencyScore: number; networkEffectScore: number; collaborationScore: number;
  forecastScore: number; scenarioScore: number; lenses: EcosystemLens; narrative: string;
}
export interface EcosystemReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: EcosystemConfidenceScore; narrative: string;
}
export interface EcosystemProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<EcosystemArea, number>; outlook: EcosystemOutlook;
  forecast: number; dashboard: EcosystemDashboard; brief: ExecutiveEcosystemBrief;
  overallConfidence: EcosystemConfidenceScore;
}
export interface EcosystemHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: EcosystemArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: EcosystemMetadata;
}
export interface EcosystemPublisher { domain: string; capability: string; }
export interface EcosystemQueryRequest {
  question: string;
  focus?: "general" | EcosystemArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning" | "early_warning";
  maxResults?: number;
}
export interface EcosystemQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: EcosystemConfidenceScore;
}

export interface EcosystemRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  stakeholderResult?: StakeholderResultLight;
  competitiveResult?: CompetitiveResultLight;
  marketResult?: MarketResultLight;
  systemsResult?: SystemsResultLight;
  resilienceResult?: ResilienceResultLight;
  opportunityResult?: OpportunityResultLight;
  decisionResult?: DecisionResultLight;
  predictiveResult?: PredictiveResultLight;
  baselineOverrides?: Partial<EcosystemBaseline>; metadata?: EcosystemMetadata;
}

export interface EcosystemResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: EcosystemBaseline;
  healthScore: EcosystemScore;
${areaScoreFields}
  forecastScore: EcosystemScore; scenarioScore: EcosystemScore; analysisScore: EcosystemScore;
  earlyWarningScore: EcosystemScore;
  networkMappingScore: EcosystemScore; partnershipScore: EcosystemScore;
  dependencyScore: EcosystemScore; collaborationScore: EcosystemScore;
  networkEffectScore: EcosystemScore;
  health: EcosystemHealthScore; dashboard: EcosystemDashboard;
  ecosystemMapDashboard: EcosystemMapDashboard;
  strategicPartnershipsDashboard: StrategicPartnershipsDashboard;
  alliancesDashboard: AlliancesDashboard;
  dependenciesDashboard: DependenciesDashboard;
  collaborationOpportunitiesDashboard: CollaborationOpportunitiesDashboard;
  ecosystemHealthDashboard: EcosystemHealthDashboard;
  forecastDashboard: EcosystemForecastDashboard;
  brief: ExecutiveEcosystemBrief; boardReport: BoardEcosystemReport;
  recommendations: EcosystemRecommendationRecord[]; risks: EcosystemRiskRecord[];
  opportunities: EcosystemOpportunityRecord[];
  areaSuites: Record<EcosystemArea, EcosystemAreaSuite>;
  trendSuite: EcosystemTrendSuite; forecastSuite: EcosystemForecastSuite;
  scenarioSuite: EcosystemScenarioSuite; analysisSuite: EcosystemAnalysisSuite;
  networkMappingSuite: NetworkMappingSuite;
  partnershipSuite: PartnershipSuite;
  dependencySuite: DependencySuite;
  collaborationSuite: CollaborationSuite;
  networkEffectSuite: NetworkEffectSuite;
  earlyWarningSuite: EarlyWarningSuite;
  knowledgeContribution: EcosystemKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: EcosystemReasoningResult; projection: EcosystemProjectionResult;
  historyRecord: EcosystemHistoryRecord; confidence: EcosystemConfidenceScore;
  requestMetadata: EcosystemMetadata;
}
`);

console.log("Part 1: types and areas done.");
