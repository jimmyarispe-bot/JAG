/**
 * Part 2: contracts, models, engines for Institutional Memory Intelligence.
 * Run after: node scripts/generate-institutional-memory-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/institutional-memory");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");
const PKG = "@/lib/platform/intelligence/institutional-memory";

const lensBlock = (prefix) => `buildLens({
            knowledgeConfidence: \`${prefix} knowledge confidence for \${area}.\`,
            evidenceStrength: \`${prefix} evidence strength for \${area}.\`,
            institutionalMemoryCoverage: \`${prefix} institutional memory coverage for \${area}.\`,
            knowledgeFreshness: \`${prefix} knowledge freshness for \${area}.\`,
            expertiseAvailability: \`${prefix} expertise availability for \${area}.\`,
            knowledgeGaps: \`${prefix} knowledge gaps for \${area}.\`,
            knowledgeQuality: \`${prefix} knowledge quality for \${area}.\`,
            longTermLearningValue: \`Long-term learning value ${prefix.toLowerCase()} for \${area}.\`,
          })`;

w("contracts.ts", `import type * as T from "${PKG}/types";

export interface InstitutionalMemoryIntelligenceEngine { build(request: T.InstitutionalMemoryRequest): T.InstitutionalMemoryResult; }
export type InstitutionalMemoryEngine = InstitutionalMemoryIntelligenceEngine;
export interface InstitutionalMemoryAreaIntelligence {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; now: Date; createId: (prefix: string) => string }): T.InstitutionalMemoryAreaSuite;
}
export interface InstitutionalMemoryForecastEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.InstitutionalMemoryForecastSuite;
}
export interface InstitutionalMemoryScenarioEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; forecasts: T.InstitutionalMemoryForecastSuite; now: Date; createId: (prefix: string) => string }): T.InstitutionalMemoryScenarioSuite;
}
export interface InstitutionalMemoryTrendEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.InstitutionalMemoryTrendSuite;
}
export interface InstitutionalMemoryAnalysisEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; forecasts: T.InstitutionalMemoryForecastSuite; scenarios: T.InstitutionalMemoryScenarioSuite; now: Date; createId: (prefix: string) => string }): T.InstitutionalMemoryAnalysisSuite;
}
export type KnowledgeAnalysisEngineContract = InstitutionalMemoryAnalysisEngineContract;
export interface KnowledgeGraphEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.KnowledgeGraphSuite;
}
export interface SemanticSearchEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.SemanticSearchSuite;
}
export interface ExpertiseEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ExpertiseSuite;
}
export interface KnowledgeValidationEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.KnowledgeValidationSuite;
}
export interface KnowledgeEvolutionEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; areas: Record<T.InstitutionalMemoryArea, T.InstitutionalMemoryAreaSuite>; now: Date; createId: (prefix: string) => string }): T.KnowledgeEvolutionSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.InstitutionalMemoryBaseline; trends: T.InstitutionalMemoryTrendSuite; scenarios: T.InstitutionalMemoryScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface InstitutionalMemoryReasonerContract {
  reason(input: { request: T.InstitutionalMemoryRequest; trends: T.InstitutionalMemoryTrendSuite; forecasts: T.InstitutionalMemoryForecastSuite; scenarios: T.InstitutionalMemoryScenarioSuite; confidence: T.InstitutionalMemoryConfidenceScore }): T.InstitutionalMemoryReasoningResult;
}
export interface InstitutionalMemoryRepository {
  save(result: T.InstitutionalMemoryResult): T.InstitutionalMemoryResult;
  get(requestId: string): T.InstitutionalMemoryResult | null;
  list(scope?: Partial<T.GraphScope>): T.InstitutionalMemoryResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.InstitutionalMemoryHistoryRecord): T.InstitutionalMemoryHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.InstitutionalMemoryHistoryRecord[];
  clear(): void;
}
export interface InstitutionalMemoryRegistry {
  register(domain: string, capability: string): void;
  list(): T.InstitutionalMemoryPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface InstitutionalMemoryIntelligenceService {
  build(request: T.InstitutionalMemoryRequest): T.InstitutionalMemoryResult;
  query(result: T.InstitutionalMemoryResult, request: T.InstitutionalMemoryQueryRequest): T.InstitutionalMemoryQueryResult;
  repository(): InstitutionalMemoryRepository;
}
export type InstitutionalMemoryService = InstitutionalMemoryIntelligenceService;
export interface InstitutionalMemoryDependencies {
  engine?: InstitutionalMemoryIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.InstitutionalMemoryArea, InstitutionalMemoryAreaIntelligence>>;
  forecastEngine?: InstitutionalMemoryForecastEngineContract;
  scenarioEngine?: InstitutionalMemoryScenarioEngineContract;
  trendEngine?: InstitutionalMemoryTrendEngineContract;
  analysisEngine?: InstitutionalMemoryAnalysisEngineContract;
  knowledgeGraphEngine?: KnowledgeGraphEngineContract;
  semanticSearchEngine?: SemanticSearchEngineContract;
  expertiseEngine?: ExpertiseEngineContract;
  knowledgeValidationEngine?: KnowledgeValidationEngineContract;
  knowledgeEvolutionEngine?: KnowledgeEvolutionEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: InstitutionalMemoryReasonerContract;
  repository?: InstitutionalMemoryRepository;
  registry?: InstitutionalMemoryRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
`);

w("models.ts", `import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  InstitutionalMemoryBaseline, InstitutionalMemoryConfidenceLevel, InstitutionalMemoryConfidenceScore,
  InstitutionalMemoryHealthStatus, InstitutionalMemoryLens, InstitutionalMemoryOutlook, InstitutionalMemoryPriorityBand,
  InstitutionalMemoryRequest,
} from "${PKG}/types";
import { INSTITUTIONAL_MEMORY_AREAS } from "${PKG}/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): InstitutionalMemoryHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): InstitutionalMemoryPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): InstitutionalMemoryConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): InstitutionalMemoryOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 82) return "learning"; if (score >= 68) return "stable"; if (score >= 50) return "eroding"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): InstitutionalMemoryConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(partial: Partial<InstitutionalMemoryLens> = {}): InstitutionalMemoryLens {
  return {
    knowledgeConfidence: partial.knowledgeConfidence ?? "Knowledge confidence requires confirmation.",
    evidenceStrength: partial.evidenceStrength ?? "Evidence strength requires confirmation.",
    institutionalMemoryCoverage: partial.institutionalMemoryCoverage ?? "Institutional memory coverage requires confirmation.",
    knowledgeFreshness: partial.knowledgeFreshness ?? "Knowledge freshness requires confirmation.",
    expertiseAvailability: partial.expertiseAvailability ?? "Expertise availability requires confirmation.",
    knowledgeGaps: partial.knowledgeGaps ?? "Knowledge gaps require confirmation.",
    knowledgeQuality: partial.knowledgeQuality ?? "Knowledge quality requires confirmation.",
    longTermLearningValue: partial.longTermLearningValue ?? "Long-term learning value requires confirmation.",
  };
}
export const defaultCreateId = (prefix: string) => \`\${prefix}-\${Math.random().toString(36).slice(2, 10)}\`;
export const defaultPeriodLabel = (now = new Date()) => now.toISOString().slice(0, 7);
export const emptyInstitutionalMemoryScope = (): GraphScope => ({ organizationId: null, schoolId: null });

export function defaultInstitutionalMemoryBaseline(): InstitutionalMemoryBaseline {
  const areaScores = Object.fromEntries(INSTITUTIONAL_MEMORY_AREAS.map(a => [a, 68])) as InstitutionalMemoryBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    knowledgeConfidence: 68,
    evidenceStrength: 68,
    institutionalMemoryCoverage: 68,
    knowledgeFreshness: 68,
    expertiseAvailability: 68,
    knowledgeGaps: 68,
    knowledgeQuality: 68,
    longTermLearningValue: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = (value: unknown, fallback: number) =>
  typeof value === "number" ? clamp(value <= 1 ? value * 100 : value) : fallback;

export function deriveInstitutionalMemoryBaseline(request: InstitutionalMemoryRequest): InstitutionalMemoryBaseline {
  const base = defaultInstitutionalMemoryBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const knowledge = lightScore(
    request.knowledgeResult?.knowledgeScore?.value ?? request.knowledgeResult?.healthScore?.value,
    70,
  );
  const knowledgeConfidence = lightScore(request.knowledgeResult?.baseline?.knowledgeConfidence, knowledge);
  const knowledgeFreshness = lightScore(request.knowledgeResult?.baseline?.knowledgeFreshness, knowledge);
  const knowledgeQuality = lightScore(request.knowledgeResult?.baseline?.knowledgeQuality, knowledge);
  const ecosystem = lightScore(request.ecosystemResult?.ecosystemScore?.value ?? request.ecosystemResult?.healthScore?.value, 70);
  const resilience = lightScore(request.resilienceResult?.healthScore?.value ?? request.resilienceResult?.adaptiveCapacity, 70);
  const systems = lightScore(request.systemsResult?.healthScore?.value, 70);
  const stakeholder = lightScore(request.stakeholderResult?.healthScore?.value ?? request.stakeholderResult?.engagementScore?.value, 70);
  const cultural = lightScore(request.culturalResult?.culturalScore?.value ?? request.culturalResult?.healthScore?.value, 70);
  const ethical = lightScore(request.ethicalResult?.ethicalScore?.value ?? request.ethicalResult?.healthScore?.value, 70);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, 70);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, 70);
  const behavioral = lightScore(request.behavioralResult?.behavioralScore?.value ?? request.behavioralResult?.healthScore?.value, 70);
  const operations = lightScore(request.operationsResult?.operationsScore?.value ?? request.operationsResult?.healthScore?.value, 70);
  const customer = lightScore(request.customerResult?.customerScore?.value ?? request.customerResult?.healthScore?.value, 70);
  const humanCapital = lightScore(request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, 70);

  const areaScores = { ...base.areaScores };
  areaScores.organizational_memory = clamp((knowledge + cultural + humanCapital) / 3);
  areaScores.knowledge_graph = clamp((knowledge + systems + ecosystem) / 3);
  areaScores.knowledge_mapping = clamp((knowledge + operations + systems) / 3);
  areaScores.expertise_intelligence = clamp((humanCapital + knowledge + behavioral) / 3);
  areaScores.institutional_memory = clamp((knowledge + cultural + decision) / 3);
  areaScores.lessons_learned = clamp((knowledge + opportunity + decision) / 3);
  areaScores.decision_history = clamp((decision + knowledge + ethical) / 3);
  areaScores.policy_knowledge = clamp((ethical + knowledge + stakeholder) / 3);
  areaScores.process_knowledge = clamp((operations + knowledge + systems) / 3);
  areaScores.relationship_knowledge = clamp((stakeholder + cultural + ecosystem) / 3);
  areaScores.semantic_search = clamp((knowledge + systems + predictive) / 3);
  areaScores.knowledge_validation = clamp((knowledge + ethical + decision) / 3);
  areaScores.knowledge_evolution = clamp((knowledge + predictive + opportunity) / 3);
  areaScores.knowledge_gap_detection = clamp((knowledge + competitive + market) / 3);
  areaScores.knowledge_transfer = clamp((humanCapital + knowledge + behavioral) / 3);
  areaScores.knowledge_quality = clamp((knowledgeQuality + ethical + knowledge) / 3);
  areaScores.knowledge_synthesis = clamp((knowledge + opportunity + predictive) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    knowledgeConfidence: clamp(knowledgeConfidence),
    evidenceStrength: clamp((knowledge + decision + ethical) / 3),
    institutionalMemoryCoverage: clamp(areaScores.institutional_memory),
    knowledgeFreshness: clamp(knowledgeFreshness),
    expertiseAvailability: clamp(areaScores.expertise_intelligence),
    knowledgeGaps: clamp(100 - areaScores.knowledge_gap_detection),
    knowledgeQuality: clamp(areaScores.knowledge_quality),
    longTermLearningValue: clamp((areaScores.knowledge_evolution + predictive + opportunity) / 3),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.knowledge_gap_detection) / 2),
    evidenceCoverage: clamp((knowledge + ecosystem + resilience + systems + stakeholder + cultural + ethical) / 7),
    ...request.baselineOverrides,
  };
}

export const institutionalMemoryModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyInstitutionalMemoryScope,
  defaultInstitutionalMemoryBaseline, deriveInstitutionalMemoryBaseline,
};
export class InstitutionalMemoryModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveInstitutionalMemoryBaseline;
  static baseline = defaultInstitutionalMemoryBaseline; static outlook = outlookFromScore;
}
`);

w("institutional-memory-forecast-engine.ts", `import type { InstitutionalMemoryForecastEngineContract } from "${PKG}/contracts";
import { buildLens, clamp, outlookFromScore } from "${PKG}/models";
import { INSTITUTIONAL_MEMORY_AREAS, type InstitutionalMemoryForecastSuite } from "${PKG}/types";

export class InstitutionalMemoryForecastEngine implements InstitutionalMemoryForecastEngineContract {
  assess(input: Parameters<InstitutionalMemoryForecastEngineContract["assess"]>[0]): InstitutionalMemoryForecastSuite {
    const forecasts = INSTITUTIONAL_MEMORY_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("imm-forecast"),
        area,
        horizon: "medium" as const,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence: "medium" as const,
        lenses: ${lensBlock("Forecast")},
        narrative: \`\${area} forecast \${Math.round(forecast)} from baseline \${Math.round(baseline)}.\`,
      };
    });
    const maturityScore = clamp(input.baseline.forecastMaturity);
    return {
      forecasts,
      outlook: outlookFromScore(maturityScore),
      maturityScore,
      narrative: \`Institutional memory forecast maturity \${Math.round(maturityScore)}.\`,
    };
  }
}
`);

w("institutional-memory-trend-engine.ts", `import type { InstitutionalMemoryTrendEngineContract } from "${PKG}/contracts";
import { buildLens, clamp } from "${PKG}/models";
import { INSTITUTIONAL_MEMORY_AREAS, type InstitutionalMemoryTrendSuite } from "${PKG}/types";

export class InstitutionalMemoryTrendEngine implements InstitutionalMemoryTrendEngineContract {
  assess(input: Parameters<InstitutionalMemoryTrendEngineContract["assess"]>[0]): InstitutionalMemoryTrendSuite {
    const trends = INSTITUTIONAL_MEMORY_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("imm-trend"),
        area,
        title: \`\${area.replaceAll("_", " ")} trend\`,
        direction,
        magnitude: clamp(Math.abs(score - 65) + index),
        confidence: "medium" as const,
        lenses: ${lensBlock("Trend")},
        narrative: \`\${area} is \${direction} at magnitude \${Math.round(Math.abs(score - 65))}.\`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: \`Institutional memory trends: \${trends.filter(t => t.direction === "improving").length} improving, \${trends.filter(t => t.direction === "worsening").length} worsening.\`,
    };
  }
}
`);

w("institutional-memory-scenario-engine.ts", `import type { InstitutionalMemoryScenarioEngineContract } from "${PKG}/contracts";
import { buildLens, clamp, priorityFromScore } from "${PKG}/models";
import { INSTITUTIONAL_MEMORY_SCENARIOS, type InstitutionalMemoryScenarioSuite } from "${PKG}/types";

export class InstitutionalMemoryScenarioEngine implements InstitutionalMemoryScenarioEngineContract {
  assess(input: Parameters<InstitutionalMemoryScenarioEngineContract["assess"]>[0]): InstitutionalMemoryScenarioSuite {
    const scenarios = INSTITUTIONAL_MEMORY_SCENARIOS.map((kind, index) => {
      const pressure = input.baseline.knowledgeGaps;
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("imm-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        memoryImpact: clamp(input.baseline.institutionalMemoryCoverage - index * 2),
        expertiseImpact: clamp(input.baseline.expertiseAvailability - index * 2),
        monitors: [\`monitor:\${kind}\`, "monitor:institutional-memory"],
        lenses: buildLens({
          knowledgeConfidence: \`Scenario knowledge confidence for \${kind}.\`,
          evidenceStrength: \`Scenario evidence strength for \${kind}.\`,
          institutionalMemoryCoverage: \`Scenario institutional memory coverage for \${kind}.\`,
          knowledgeFreshness: \`Scenario knowledge freshness for \${kind}.\`,
          expertiseAvailability: \`Scenario expertise availability for \${kind}.\`,
          knowledgeGaps: \`Scenario knowledge gaps for \${kind}.\`,
          knowledgeQuality: \`Scenario knowledge quality for \${kind}.\`,
          longTermLearningValue: \`Long-term learning value under \${kind}.\`,
        }),
        narrative: \`\${kind} probability \${Math.round(probability * 100)}% with impact \${Math.round(organizationalImpact)}.\`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: \`Primary institutional memory scenario \${primary.kind.replaceAll("_", " ")}.\`,
    };
  }
}
`);

w("institutional-memory-analysis-engine.ts", `import type { InstitutionalMemoryAnalysisEngineContract } from "${PKG}/contracts";
import { buildLens, clamp } from "${PKG}/models";
import { INSTITUTIONAL_MEMORY_ANALYSIS_KINDS, type InstitutionalMemoryAnalysisSuite } from "${PKG}/types";

/** Primary analysis engine (also exported as KnowledgeAnalysisEngine). */
export class InstitutionalMemoryAnalysisEngine implements InstitutionalMemoryAnalysisEngineContract {
  assess(input: Parameters<InstitutionalMemoryAnalysisEngineContract["assess"]>[0]): InstitutionalMemoryAnalysisSuite {
    const scoreFor = (kind: (typeof INSTITUTIONAL_MEMORY_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "knowledge_confidence": return clamp(input.baseline.knowledgeConfidence);
        case "evidence_strength": return clamp(input.baseline.evidenceStrength);
        case "institutional_memory_coverage": return clamp(input.baseline.institutionalMemoryCoverage);
        case "knowledge_freshness": return clamp(input.baseline.knowledgeFreshness);
        case "expertise_availability": return clamp(input.baseline.expertiseAvailability);
        case "knowledge_gaps": return clamp(100 - input.baseline.knowledgeGaps);
        case "knowledge_quality": return clamp(input.baseline.knowledgeQuality);
        case "long_term_learning_value": return clamp(input.baseline.longTermLearningValue);
        case "early_warning": return clamp(input.baseline.longTermLearningValue);
        default: return 65;
      }
    };
    const analyses = INSTITUTIONAL_MEMORY_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("imm-analysis"),
        kind,
        title: \`\${kind.replaceAll("_", " ")} analysis\`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          knowledgeConfidence: \`Knowledge confidence through \${kind}.\`,
          evidenceStrength: \`Evidence strength reading for \${kind}.\`,
          institutionalMemoryCoverage: \`Institutional memory coverage for \${kind}.\`,
          knowledgeFreshness: \`Knowledge freshness around \${kind}.\`,
          expertiseAvailability: \`Expertise availability of \${kind}.\`,
          knowledgeGaps: \`Knowledge gaps in \${kind}.\`,
          knowledgeQuality: \`Knowledge quality for \${kind}.\`,
          longTermLearningValue: \`Long-term learning value via \${kind}.\`,
        }),
        narrative: \`\${kind} analysis scored \${Math.round(score)}.\`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...INSTITUTIONAL_MEMORY_ANALYSIS_KINDS],
      maturityScore,
      narrative: \`Institutional memory analysis maturity \${Math.round(maturityScore)} across \${analyses.length} kinds.\`,
    };
  }
}

export { InstitutionalMemoryAnalysisEngine as KnowledgeAnalysisEngine };
`);

w("knowledge-graph-engine.ts", `import type { KnowledgeGraphEngineContract } from "${PKG}/contracts";
import type { KnowledgeGraphSuite } from "${PKG}/types";

export class KnowledgeGraphEngine implements KnowledgeGraphEngineContract {
  assess(input: Parameters<KnowledgeGraphEngineContract["assess"]>[0]): KnowledgeGraphSuite {
    const suite = input.areas.knowledge_graph;
    const records = suite.records.map(record => ({
      id: input.createId("imm-graph"),
      title: record.title,
      connectivity: record.score,
      lenses: record.lenses,
      narrative: \`Knowledge graph: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      graphIndex: input.baseline.institutionalMemoryCoverage,
      narrative: \`Knowledge graph suite index \${Math.round(input.baseline.institutionalMemoryCoverage)}.\`,
    };
  }
}
`);

w("semantic-search-engine.ts", `import type { SemanticSearchEngineContract } from "${PKG}/contracts";
import type { SemanticSearchSuite } from "${PKG}/types";

export class SemanticSearchEngine implements SemanticSearchEngineContract {
  assess(input: Parameters<SemanticSearchEngineContract["assess"]>[0]): SemanticSearchSuite {
    const suite = input.areas.semantic_search;
    const records = suite.records.map(record => ({
      id: input.createId("imm-search"),
      title: record.title,
      effectiveness: record.score,
      lenses: record.lenses,
      narrative: \`Semantic search: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      searchIndex: input.baseline.knowledgeConfidence,
      narrative: \`Semantic search suite index \${Math.round(input.baseline.knowledgeConfidence)}.\`,
    };
  }
}
`);

w("expertise-engine.ts", `import type { ExpertiseEngineContract } from "${PKG}/contracts";
import type { ExpertiseSuite } from "${PKG}/types";

export class ExpertiseEngine implements ExpertiseEngineContract {
  assess(input: Parameters<ExpertiseEngineContract["assess"]>[0]): ExpertiseSuite {
    const suite = input.areas.expertise_intelligence;
    const records = suite.records.map(record => ({
      id: input.createId("imm-expertise"),
      title: record.title,
      availability: record.score,
      lenses: record.lenses,
      narrative: \`Expertise analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      expertiseIndex: input.baseline.expertiseAvailability,
      narrative: \`Expertise suite index \${Math.round(input.baseline.expertiseAvailability)}.\`,
    };
  }
}
`);

w("knowledge-validation-engine.ts", `import type { KnowledgeValidationEngineContract } from "${PKG}/contracts";
import type { KnowledgeValidationSuite } from "${PKG}/types";

export class KnowledgeValidationEngine implements KnowledgeValidationEngineContract {
  assess(input: Parameters<KnowledgeValidationEngineContract["assess"]>[0]): KnowledgeValidationSuite {
    const suite = input.areas.knowledge_validation;
    const records = suite.records.map(record => ({
      id: input.createId("imm-validation"),
      title: record.title,
      strength: record.score,
      lenses: record.lenses,
      narrative: \`Knowledge validation: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      validationIndex: input.baseline.evidenceStrength,
      narrative: \`Knowledge validation suite index \${Math.round(input.baseline.evidenceStrength)}.\`,
    };
  }
}
`);

w("knowledge-evolution-engine.ts", `import type { KnowledgeEvolutionEngineContract } from "${PKG}/contracts";
import type { KnowledgeEvolutionSuite } from "${PKG}/types";

export class KnowledgeEvolutionEngine implements KnowledgeEvolutionEngineContract {
  assess(input: Parameters<KnowledgeEvolutionEngineContract["assess"]>[0]): KnowledgeEvolutionSuite {
    const suite = input.areas.knowledge_evolution;
    const records = suite.records.map(record => ({
      id: input.createId("imm-evolution"),
      title: record.title,
      pace: record.score,
      lenses: record.lenses,
      narrative: \`Knowledge evolution: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      evolutionIndex: input.baseline.knowledgeFreshness,
      narrative: \`Knowledge evolution suite index \${Math.round(input.baseline.knowledgeFreshness)}.\`,
    };
  }
}
`);

w("early-warning-engine.ts", `import type { EarlyWarningEngineContract } from "${PKG}/contracts";
import { clamp, priorityFromScore } from "${PKG}/models";
import type { EarlyWarningSuite } from "${PKG}/types";

export class EarlyWarningEngine implements EarlyWarningEngineContract {
  assess(input: Parameters<EarlyWarningEngineContract["assess"]>[0]): EarlyWarningSuite {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening").slice(0, 4);
    const hot = input.scenarios.scenarios.slice(0, 3);
    const alerts = [
      ...worsening.map(t => ({
        id: input.createId("imm-alert"),
        title: \`Trend alert: \${t.area}\`,
        severity: priorityFromScore(100 - t.magnitude),
        source: "trends",
        score: clamp(100 - t.magnitude),
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...hot.map(s => ({
        id: input.createId("imm-alert"),
        title: \`Scenario alert: \${s.kind}\`,
        severity: s.severity,
        source: "scenarios",
        score: clamp(100 - s.organizationalImpact),
        lenses: s.lenses,
        narrative: s.narrative,
      })),
    ];
    const score = clamp(alerts.length ? alerts.reduce((s, a) => s + a.score, 0) / alerts.length : input.baseline.longTermLearningValue);
    return {
      alerts,
      score,
      alertCount: alerts.length,
      narrative: \`Institutional memory early warning suite with \${alerts.length} alerts.\`,
    };
  }
}
`);

w("knowledge-contribution.ts", `import type { InstitutionalMemoryForecastSuite, InstitutionalMemoryKnowledgeContribution, InstitutionalMemoryScenarioSuite } from "${PKG}/types";

/**
 * Institutional memory knowledge contribution drafts for redistribution
 * via closed learning to knowledge and peer domains.
 */
export class InstitutionalMemoryKnowledgeContributionEngine {
  contribute(input: {
    forecasts: InstitutionalMemoryForecastSuite;
    scenarios: InstitutionalMemoryScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): InstitutionalMemoryKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("imm-knowledge"),
        type: "institutional_memory_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("imm-knowledge"),
        type: "institutional_memory_scenario",
        title: scenario.title,
        confidence: scenario.probability,
        sourceRef: scenario.id,
        validated: scenario.probability >= .35,
        metadata: { kind: scenario.kind, capturedAt: input.now.toISOString() },
      })),
    ];
    return {
      artifacts,
      contributionScore: artifacts.reduce((s, a) => s + a.confidence, 0) / Math.max(1, artifacts.length) * 100,
      validatedCount: artifacts.filter(a => a.validated).length,
      narrative: \`\${artifacts.length} institutional memory learning drafts prepared for redistribution across knowledge and peer domains.\`,
    };
  }
}
`);

w("closed-learning-loop.ts", `import type {
  ClosedLearningLoopContribution,
  InstitutionalMemoryRecommendationRecord,
  InstitutionalMemoryScenarioSuite,
  InstitutionalMemoryTrendSuite,
} from "${PKG}/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: InstitutionalMemoryTrendSuite;
    scenarios: InstitutionalMemoryScenarioSuite;
    recommendations: InstitutionalMemoryRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("imm-learning"),
      destinations: ["knowledge", "ecosystem", "opportunity", "executive-decision", "predictive", "organizational-improvement", "stakeholder"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => \`\${t.area}:\${t.direction}\`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => \`\${s.kind}:\${Math.round(s.probability * 100)}\`),
      contributedAt: input.now.toISOString(),
      narrative: "Primary institutional memory destination that redistributes validated insights via soft contribution records to Knowledge, Ecosystem, Opportunity, Executive Decision, Predictive, Organizational Improvement, and Stakeholder Intelligence.",
    };
  }
}
`);

w("institutional-memory-reasoner.ts", `import type { InstitutionalMemoryReasonerContract } from "${PKG}/contracts";
import type { InstitutionalMemoryReasoningResult } from "${PKG}/types";

export class InstitutionalMemoryReasoner implements InstitutionalMemoryReasonerContract {
  reason(input: Parameters<InstitutionalMemoryReasonerContract["reason"]>[0]): InstitutionalMemoryReasoningResult {
    const connectedForces = input.trends.trends
      .slice()
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 6)
      .map(t => t.title);
    const evidenceGaps = input.forecasts.forecasts
      .filter(f => f.confidence === "low" || f.confidence === "unknown")
      .slice(0, 6)
      .map(f => f.narrative);
    return {
      answer: input.request.question ??
        \`Institutional memory outlook is \${input.forecasts.outlook} with primary scenario \${input.scenarios.primaryScenario.replaceAll("_", " ")}.\`,
      connectedForces,
      evidenceGaps,
      confidence: input.confidence,
      narrative: \`Reasoning used \${input.trends.trends.length} trends, \${input.forecasts.forecasts.length} forecasts, and \${input.scenarios.scenarios.length} scenarios.\`,
    };
  }
}
`);

console.log("Part 2: contracts, models, engines done.");
