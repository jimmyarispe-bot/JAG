/**
 * Part 2: contracts, models, engines for Wisdom Intelligence.
 * Run after: node scripts/generate-wisdom-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/wisdom");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");
const PKG = "@/lib/platform/intelligence/wisdom";

const lensBlock = (prefix) => `buildLens({
            strategicValue: \`${prefix} strategic value for \${area}.\`,
            longTermImpact: \`${prefix} long-term impact for \${area}.\`,
            confidenceLevel: \`${prefix} confidence level for \${area}.\`,
            evidenceQuality: \`${prefix} evidence quality for \${area}.\`,
            tradeOffBalance: \`${prefix} trade-off balance for \${area}.\`,
            organizationalAlignment: \`${prefix} organizational alignment for \${area}.\`,
            ethicalIntegrity: \`${prefix} ethical integrity for \${area}.\`,
            wisdomScore: \`Wisdom score ${prefix.toLowerCase()} for \${area}.\`,
          })`;

w("contracts.ts", `import type * as T from "${PKG}/types";

export interface WisdomIntelligenceEngine { build(request: T.WisdomRequest): T.WisdomResult; }
export type WisdomEngine = WisdomIntelligenceEngine;
export interface WisdomAreaIntelligence {
  assess(input: { baseline: T.WisdomBaseline; now: Date; createId: (prefix: string) => string }): T.WisdomAreaSuite;
}
export interface WisdomForecastEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.WisdomForecastSuite;
}
export interface WisdomScenarioEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; forecasts: T.WisdomForecastSuite; now: Date; createId: (prefix: string) => string }): T.WisdomScenarioSuite;
}
export interface WisdomTrendEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.WisdomTrendSuite;
}
export interface WisdomAnalysisEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; forecasts: T.WisdomForecastSuite; scenarios: T.WisdomScenarioSuite; now: Date; createId: (prefix: string) => string }): T.WisdomAnalysisSuite;
}
export interface StrategicReasoningEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.StrategicReasoningSuite;
}
export interface CrossDomainSynthesisEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CrossDomainSynthesisSuite;
}
export interface TradeOffEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.TradeOffSuite;
}
export interface UncertaintyEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.UncertaintySuite;
}
export interface ExecutiveJudgmentEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ExecutiveJudgmentSuite;
}
export interface ConfidenceEngineContract {
  assess(input: { baseline: T.WisdomBaseline; areas: Record<T.WisdomArea, T.WisdomAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ConfidenceSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.WisdomBaseline; trends: T.WisdomTrendSuite; scenarios: T.WisdomScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface WisdomReasonerContract {
  reason(input: { request: T.WisdomRequest; trends: T.WisdomTrendSuite; forecasts: T.WisdomForecastSuite; scenarios: T.WisdomScenarioSuite; confidence: T.WisdomConfidenceScore }): T.WisdomReasoningResult;
}
export interface WisdomRepository {
  save(result: T.WisdomResult): T.WisdomResult;
  get(requestId: string): T.WisdomResult | null;
  list(scope?: Partial<T.GraphScope>): T.WisdomResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.WisdomHistoryRecord): T.WisdomHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.WisdomHistoryRecord[];
  clear(): void;
}
export interface WisdomRegistry {
  register(domain: string, capability: string): void;
  list(): T.WisdomPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface WisdomIntelligenceService {
  build(request: T.WisdomRequest): T.WisdomResult;
  query(result: T.WisdomResult, request: T.WisdomQueryRequest): T.WisdomQueryResult;
  repository(): WisdomRepository;
}
export type WisdomService = WisdomIntelligenceService;
export interface WisdomDependencies {
  engine?: WisdomIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.WisdomArea, WisdomAreaIntelligence>>;
  forecastEngine?: WisdomForecastEngineContract;
  scenarioEngine?: WisdomScenarioEngineContract;
  trendEngine?: WisdomTrendEngineContract;
  analysisEngine?: WisdomAnalysisEngineContract;
  strategicReasoningEngine?: StrategicReasoningEngineContract;
  crossDomainSynthesisEngine?: CrossDomainSynthesisEngineContract;
  tradeOffEngine?: TradeOffEngineContract;
  uncertaintyEngine?: UncertaintyEngineContract;
  executiveJudgmentEngine?: ExecutiveJudgmentEngineContract;
  confidenceEngine?: ConfidenceEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: WisdomReasonerContract;
  repository?: WisdomRepository;
  registry?: WisdomRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
`);

w("models.ts", `import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  WisdomBaseline, WisdomConfidenceLevel, WisdomConfidenceScore,
  WisdomHealthStatus, WisdomLens, WisdomOutlook, WisdomPriorityBand,
  WisdomRequest,
} from "${PKG}/types";
import { WISDOM_AREAS } from "${PKG}/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): WisdomHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): WisdomPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): WisdomConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): WisdomOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 82) return "wise"; if (score >= 68) return "stable"; if (score >= 50) return "shortsighted"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): WisdomConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(partial: Partial<WisdomLens> = {}): WisdomLens {
  return {
    strategicValue: partial.strategicValue ?? "Strategic value requires confirmation.",
    longTermImpact: partial.longTermImpact ?? "Long-term impact requires confirmation.",
    confidenceLevel: partial.confidenceLevel ?? "Confidence level requires confirmation.",
    evidenceQuality: partial.evidenceQuality ?? "Evidence quality requires confirmation.",
    tradeOffBalance: partial.tradeOffBalance ?? "Trade-off balance requires confirmation.",
    organizationalAlignment: partial.organizationalAlignment ?? "Organizational alignment requires confirmation.",
    ethicalIntegrity: partial.ethicalIntegrity ?? "Ethical integrity requires confirmation.",
    wisdomScore: partial.wisdomScore ?? "Wisdom score requires confirmation.",
  };
}
export const defaultCreateId = (prefix: string) => \`\${prefix}-\${Math.random().toString(36).slice(2, 10)}\`;
export const defaultPeriodLabel = (now = new Date()) => now.toISOString().slice(0, 7);
export const emptyWisdomScope = (): GraphScope => ({ organizationId: null, schoolId: null });

export function defaultWisdomBaseline(): WisdomBaseline {
  const areaScores = Object.fromEntries(WISDOM_AREAS.map(a => [a, 68])) as WisdomBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    strategicValue: 68,
    longTermImpact: 68,
    confidenceLevel: 68,
    evidenceQuality: 68,
    tradeOffBalance: 68,
    organizationalAlignment: 68,
    ethicalIntegrity: 68,
    wisdomScore: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = (value: unknown, fallback: number) =>
  typeof value === "number" ? clamp(value <= 1 ? value * 100 : value) : fallback;

export function deriveWisdomBaseline(request: WisdomRequest): WisdomBaseline {
  const base = defaultWisdomBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const collective = lightScore(
    request.collectiveResult?.healthScore?.value ?? request.collectiveResult?.collectiveConfidence ?? request.collectiveResult?.baseline?.collectiveConfidence,
    70,
  );
  const institutionalMemory = lightScore(
    request.institutionalMemoryResult?.healthScore?.value ?? request.institutionalMemoryResult?.institutionalMemoryScore?.value,
    70,
  );
  const knowledge = lightScore(
    request.knowledgeResult?.knowledgeScore?.value ?? request.knowledgeResult?.healthScore?.value,
    70,
  );
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const ethical = lightScore(request.ethicalResult?.ethicalScore?.value ?? request.ethicalResult?.healthScore?.value, 70);
  const systems = lightScore(request.systemsResult?.healthScore?.value, 70);
  const resilience = lightScore(request.resilienceResult?.healthScore?.value ?? request.resilienceResult?.adaptiveCapacity, 70);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);
  const behavioral = lightScore(request.behavioralResult?.behavioralScore?.value ?? request.behavioralResult?.healthScore?.value, 70);
  const cultural = lightScore(request.culturalResult?.culturalScore?.value ?? request.culturalResult?.healthScore?.value, 70);
  const stakeholder = lightScore(request.stakeholderResult?.healthScore?.value ?? request.stakeholderResult?.engagementScore?.value, 70);
  const ecosystem = lightScore(request.ecosystemResult?.ecosystemScore?.value ?? request.ecosystemResult?.healthScore?.value, 70);
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, 70);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, 70);
  const economic = lightScore(request.economicResult?.economicScore?.value ?? request.economicResult?.healthScore?.value, 70);
  const operations = lightScore(request.operationsResult?.operationsScore?.value ?? request.operationsResult?.healthScore?.value, 70);
  const humanCapital = lightScore(request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, 70);
  const environmental = lightScore(request.environmentalResult?.environmentalScore?.value ?? request.environmentalResult?.healthScore?.value, 70);
  const political = lightScore(request.politicalResult?.politicalScore?.value ?? request.politicalResult?.healthScore?.value, 70);
  const reputation = lightScore(request.reputationResult?.reputationScore?.value ?? request.reputationResult?.healthScore?.value, 70);

  const areaScores = { ...base.areaScores };
  areaScores.executive_judgment = clamp((collective + decision + ethical) / 3);
  areaScores.strategic_reasoning = clamp((decision + predictive + collective) / 3);
  areaScores.trade_off_analysis = clamp((opportunity + economic + decision) / 3);
  areaScores.long_term_thinking = clamp((predictive + institutionalMemory + resilience) / 3);
  areaScores.cross_domain_synthesis = clamp((collective + systems + knowledge) / 3);
  areaScores.decision_quality_assessment = clamp((decision + collective + knowledge) / 3);
  areaScores.uncertainty_analysis = clamp((predictive + systems + resilience) / 3);
  areaScores.confidence_calibration = clamp((decision + knowledge + collective) / 3);
  areaScores.organizational_prioritization = clamp((opportunity + decision + cultural) / 3);
  areaScores.mission_alignment = clamp((cultural + ethical + stakeholder) / 3);
  areaScores.values_alignment = clamp((ethical + cultural + reputation) / 3);
  areaScores.ethical_judgment = clamp((ethical + cultural + decision) / 3);
  areaScores.strategic_timing = clamp((opportunity + market + predictive) / 3);
  areaScores.opportunity_cost_analysis = clamp((opportunity + economic + competitive) / 3);
  areaScores.executive_recommendation_validation = clamp((collective + decision + knowledge) / 3);
  areaScores.organizational_judgment_evolution = clamp((institutionalMemory + collective + predictive) / 3);
  areaScores.institutional_wisdom = clamp((institutionalMemory + knowledge + collective) / 3);

  const strategicValue = clamp(areaScores.strategic_reasoning);
  const longTermImpact = clamp(areaScores.long_term_thinking);
  const confidenceLevel = clamp(areaScores.confidence_calibration);
  const evidenceQuality = clamp((knowledge + institutionalMemory + collective) / 3);
  const tradeOffBalance = clamp(areaScores.trade_off_analysis);
  const organizationalAlignment = clamp((areaScores.mission_alignment + areaScores.values_alignment) / 2);
  const ethicalIntegrity = clamp(areaScores.ethical_judgment);
  const wisdomScore = clamp((strategicValue + longTermImpact + tradeOffBalance + ethicalIntegrity + confidenceLevel) / 5);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    strategicValue,
    longTermImpact,
    confidenceLevel,
    evidenceQuality,
    tradeOffBalance,
    organizationalAlignment,
    ethicalIntegrity,
    wisdomScore,
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.uncertainty_analysis) / 2),
    evidenceCoverage: clamp((collective + institutionalMemory + knowledge + ethical + systems + resilience + opportunity + behavioral + cultural + stakeholder + ecosystem + market + operations + humanCapital + environmental + political + reputation + economic) / 18),
    ...request.baselineOverrides,
  };
}

export const wisdomModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyWisdomScope,
  defaultWisdomBaseline, deriveWisdomBaseline,
};
export class WisdomModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveWisdomBaseline;
  static baseline = defaultWisdomBaseline; static outlook = outlookFromScore;
}
`);

w("wisdom-forecast-engine.ts", `import type { WisdomForecastEngineContract } from "${PKG}/contracts";
import { buildLens, clamp, outlookFromScore } from "${PKG}/models";
import { WISDOM_AREAS, type WisdomForecastSuite } from "${PKG}/types";

export class WisdomForecastEngine implements WisdomForecastEngineContract {
  assess(input: Parameters<WisdomForecastEngineContract["assess"]>[0]): WisdomForecastSuite {
    const forecasts = WISDOM_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("wis-forecast"),
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
      narrative: \`Wisdom intelligence forecast maturity \${Math.round(maturityScore)}.\`,
    };
  }
}
`);

w("wisdom-trend-engine.ts", `import type { WisdomTrendEngineContract } from "${PKG}/contracts";
import { buildLens, clamp } from "${PKG}/models";
import { WISDOM_AREAS, type WisdomTrendSuite } from "${PKG}/types";

export class WisdomTrendEngine implements WisdomTrendEngineContract {
  assess(input: Parameters<WisdomTrendEngineContract["assess"]>[0]): WisdomTrendSuite {
    const trends = WISDOM_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("wis-trend"),
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
      narrative: \`Wisdom trends: \${trends.filter(t => t.direction === "improving").length} improving, \${trends.filter(t => t.direction === "worsening").length} worsening.\`,
    };
  }
}
`);

w("wisdom-scenario-engine.ts", `import type { WisdomScenarioEngineContract } from "${PKG}/contracts";
import { buildLens, clamp, priorityFromScore } from "${PKG}/models";
import { WISDOM_SCENARIOS, type WisdomScenarioSuite } from "${PKG}/types";

export class WisdomScenarioEngine implements WisdomScenarioEngineContract {
  assess(input: Parameters<WisdomScenarioEngineContract["assess"]>[0]): WisdomScenarioSuite {
    const scenarios = WISDOM_SCENARIOS.map((kind, index) => {
      const pressure = clamp(100 - input.baseline.wisdomScore);
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("wis-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        judgmentImpact: clamp(input.baseline.strategicValue - index * 2),
        timingImpact: clamp(input.baseline.longTermImpact - index * 2),
        monitors: [\`monitor:\${kind}\`, "monitor:wisdom-intelligence"],
        lenses: buildLens({
          strategicValue: \`Scenario strategic value for \${kind}.\`,
          longTermImpact: \`Scenario long-term impact for \${kind}.\`,
          confidenceLevel: \`Scenario confidence level for \${kind}.\`,
          evidenceQuality: \`Scenario evidence quality for \${kind}.\`,
          tradeOffBalance: \`Scenario trade-off balance for \${kind}.\`,
          organizationalAlignment: \`Scenario organizational alignment for \${kind}.\`,
          ethicalIntegrity: \`Scenario ethical integrity for \${kind}.\`,
          wisdomScore: \`Wisdom score under \${kind}.\`,
        }),
        narrative: \`\${kind} probability \${Math.round(probability * 100)}% with impact \${Math.round(organizationalImpact)}.\`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: \`Primary wisdom scenario \${primary.kind.replaceAll("_", " ")}.\`,
    };
  }
}
`);

w("wisdom-analysis-engine.ts", `import type { WisdomAnalysisEngineContract } from "${PKG}/contracts";
import { buildLens, clamp } from "${PKG}/models";
import { WISDOM_ANALYSIS_KINDS, type WisdomAnalysisSuite } from "${PKG}/types";

/** Primary analysis engine. */
export class WisdomAnalysisEngine implements WisdomAnalysisEngineContract {
  assess(input: Parameters<WisdomAnalysisEngineContract["assess"]>[0]): WisdomAnalysisSuite {
    const scoreFor = (kind: (typeof WISDOM_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "strategic_value": return clamp(input.baseline.strategicValue);
        case "long_term_impact": return clamp(input.baseline.longTermImpact);
        case "confidence_level": return clamp(input.baseline.confidenceLevel);
        case "evidence_quality": return clamp(input.baseline.evidenceQuality);
        case "trade_off_balance": return clamp(input.baseline.tradeOffBalance);
        case "organizational_alignment": return clamp(input.baseline.organizationalAlignment);
        case "ethical_integrity": return clamp(input.baseline.ethicalIntegrity);
        case "wisdom_score": return clamp(input.baseline.wisdomScore);
        case "early_warning": return clamp(input.baseline.wisdomScore);
        default: return 65;
      }
    };
    const analyses = WISDOM_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("wis-analysis"),
        kind,
        title: \`\${kind.replaceAll("_", " ")} analysis\`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          strategicValue: \`Strategic value through \${kind}.\`,
          longTermImpact: \`Long-term impact reading for \${kind}.\`,
          confidenceLevel: \`Confidence level in \${kind}.\`,
          evidenceQuality: \`Evidence quality for \${kind}.\`,
          tradeOffBalance: \`Trade-off balance of \${kind}.\`,
          organizationalAlignment: \`Organizational alignment for \${kind}.\`,
          ethicalIntegrity: \`Ethical integrity via \${kind}.\`,
          wisdomScore: \`Wisdom score via \${kind}.\`,
        }),
        narrative: \`\${kind} analysis scored \${Math.round(score)}.\`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...WISDOM_ANALYSIS_KINDS],
      maturityScore,
      narrative: \`Wisdom analysis maturity \${Math.round(maturityScore)} across \${analyses.length} kinds.\`,
    };
  }
}
`);

w("strategic-reasoning-engine.ts", `import type { StrategicReasoningEngineContract } from "${PKG}/contracts";
import type { StrategicReasoningSuite } from "${PKG}/types";

export class StrategicReasoningEngine implements StrategicReasoningEngineContract {
  assess(input: Parameters<StrategicReasoningEngineContract["assess"]>[0]): StrategicReasoningSuite {
    const suite = input.areas.strategic_reasoning;
    const records = suite.records.map(record => ({
      id: input.createId("wis-reasoning"),
      title: record.title,
      reasoningIndex: record.score,
      lenses: record.lenses,
      narrative: \`Strategic reasoning: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      reasoningIndex: input.baseline.strategicValue,
      narrative: \`Strategic reasoning suite index \${Math.round(input.baseline.strategicValue)}.\`,
    };
  }
}
`);

w("cross-domain-synthesis-engine.ts", `import type { CrossDomainSynthesisEngineContract } from "${PKG}/contracts";
import type { CrossDomainSynthesisSuite } from "${PKG}/types";

export class CrossDomainSynthesisEngine implements CrossDomainSynthesisEngineContract {
  assess(input: Parameters<CrossDomainSynthesisEngineContract["assess"]>[0]): CrossDomainSynthesisSuite {
    const suite = input.areas.cross_domain_synthesis;
    const records = suite.records.map(record => ({
      id: input.createId("wis-synthesis"),
      title: record.title,
      synthesisIndex: record.score,
      lenses: record.lenses,
      narrative: \`Cross-domain synthesis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      synthesisIndex: input.baseline.strategicValue,
      narrative: \`Cross-domain synthesis suite index \${Math.round(input.baseline.strategicValue)}.\`,
    };
  }
}
`);

w("trade-off-engine.ts", `import type { TradeOffEngineContract } from "${PKG}/contracts";
import type { TradeOffSuite } from "${PKG}/types";

export class TradeOffEngine implements TradeOffEngineContract {
  assess(input: Parameters<TradeOffEngineContract["assess"]>[0]): TradeOffSuite {
    const suite = input.areas.trade_off_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("wis-tradeoff"),
      title: record.title,
      balanceIndex: record.score,
      lenses: record.lenses,
      narrative: \`Trade-off: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      balanceIndex: input.baseline.tradeOffBalance,
      narrative: \`Trade-off suite index \${Math.round(input.baseline.tradeOffBalance)}.\`,
    };
  }
}
`);

w("uncertainty-engine.ts", `import type { UncertaintyEngineContract } from "${PKG}/contracts";
import type { UncertaintySuite } from "${PKG}/types";

export class UncertaintyEngine implements UncertaintyEngineContract {
  assess(input: Parameters<UncertaintyEngineContract["assess"]>[0]): UncertaintySuite {
    const suite = input.areas.uncertainty_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("wis-uncertainty"),
      title: record.title,
      uncertaintyIndex: record.score,
      lenses: record.lenses,
      narrative: \`Uncertainty: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      uncertaintyIndex: input.baseline.confidenceLevel,
      narrative: \`Uncertainty suite index \${Math.round(input.baseline.confidenceLevel)}.\`,
    };
  }
}
`);

w("executive-judgment-engine.ts", `import type { ExecutiveJudgmentEngineContract } from "${PKG}/contracts";
import type { ExecutiveJudgmentFramework, ExecutiveJudgmentSuite } from "${PKG}/types";

export class ExecutiveJudgmentEngine implements ExecutiveJudgmentEngineContract {
  assess(input: Parameters<ExecutiveJudgmentEngineContract["assess"]>[0]): ExecutiveJudgmentSuite {
    const suite = input.areas.executive_judgment;
    const framework: ExecutiveJudgmentFramework = {
      whatLeadershipShouldDo: "Prioritize the weakest wisdom areas with the highest long-term impact.",
      why: \`Executive judgment scored \${Math.round(suite.score)} against a wisdom baseline of \${Math.round(input.baseline.wisdomScore)}.\`,
      whyNow: "Judgment windows compress when confidence calibration and trade-off balance drift.",
      whyNotAlternatives: "Deferring or over-optimizing near-term metrics raises short-termism and opportunity-cost blindness.",
      risksRemaining: "Residual uncertainty, ethical compromise pressure, and institutional wisdom erosion.",
      assumptions: "Collective, ethical, and predictive soft signals remain directionally valid.",
      evidence: suite.records.map(r => r.signal).join("; "),
      expectedOutcome: "Higher wisdomScore with clearer strategic timing and validated recommendations.",
    };
    const records = suite.records.map(record => ({
      id: input.createId("wis-judgment"),
      title: record.title,
      judgmentIndex: record.score,
      lenses: record.lenses,
      framework,
      narrative: \`Executive judgment: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      judgmentIndex: input.baseline.wisdomScore,
      framework,
      narrative: \`Executive judgment suite index \${Math.round(input.baseline.wisdomScore)}.\`,
    };
  }
}
`);

w("confidence-engine.ts", `import type { ConfidenceEngineContract } from "${PKG}/contracts";
import type { ConfidenceSuite } from "${PKG}/types";

export class ConfidenceEngine implements ConfidenceEngineContract {
  assess(input: Parameters<ConfidenceEngineContract["assess"]>[0]): ConfidenceSuite {
    const suite = input.areas.confidence_calibration;
    const records = suite.records.map(record => ({
      id: input.createId("wis-confidence"),
      title: record.title,
      calibrationIndex: record.score,
      lenses: record.lenses,
      narrative: \`Confidence calibration: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      calibrationIndex: input.baseline.confidenceLevel,
      narrative: \`Confidence suite index \${Math.round(input.baseline.confidenceLevel)}.\`,
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
        id: input.createId("wis-alert"),
        title: \`Trend alert: \${t.area}\`,
        severity: priorityFromScore(100 - t.magnitude),
        source: "trends",
        score: clamp(100 - t.magnitude),
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...hot.map(s => ({
        id: input.createId("wis-alert"),
        title: \`Scenario alert: \${s.kind}\`,
        severity: s.severity,
        source: "scenarios",
        score: clamp(100 - s.organizationalImpact),
        lenses: s.lenses,
        narrative: s.narrative,
      })),
    ];
    const score = clamp(alerts.length ? alerts.reduce((s, a) => s + a.score, 0) / alerts.length : input.baseline.wisdomScore);
    return {
      alerts,
      score,
      alertCount: alerts.length,
      narrative: \`Wisdom intelligence early warning suite with \${alerts.length} alerts.\`,
    };
  }
}
`);

w("knowledge-contribution.ts", `import type { WisdomForecastSuite, WisdomKnowledgeContribution, WisdomScenarioSuite } from "${PKG}/types";

/**
 * Wisdom intelligence knowledge contribution drafts for redistribution
 * via closed learning to collective and peer domains.
 */
export class WisdomKnowledgeContributionEngine {
  contribute(input: {
    forecasts: WisdomForecastSuite;
    scenarios: WisdomScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): WisdomKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("wis-knowledge"),
        type: "wisdom_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("wis-knowledge"),
        type: "wisdom_scenario",
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
      narrative: \`\${artifacts.length} wisdom intelligence learning drafts prepared for redistribution across collective and peer domains.\`,
    };
  }
}
`);

w("closed-learning-loop.ts", `import type {
  ClosedLearningLoopContribution,
  WisdomRecommendationRecord,
  WisdomScenarioSuite,
  WisdomTrendSuite,
} from "${PKG}/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: WisdomTrendSuite;
    scenarios: WisdomScenarioSuite;
    recommendations: WisdomRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("wis-learning"),
      destinations: ["collective", "institutional-memory", "knowledge", "executive-decision", "opportunity", "predictive", "ethical"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => \`\${t.area}:\${t.direction}\`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => \`\${s.kind}:\${Math.round(s.probability * 100)}\`),
      contributedAt: input.now.toISOString(),
      narrative: "Final terminal synthesis layer that unifies judgment, trade-offs, uncertainty, and long-term impact into executive wisdom.",
    };
  }
}
`);

w("wisdom-reasoner.ts", `import type { WisdomReasonerContract } from "${PKG}/contracts";
import type { WisdomReasoningResult } from "${PKG}/types";

export class WisdomReasoner implements WisdomReasonerContract {
  reason(input: Parameters<WisdomReasonerContract["reason"]>[0]): WisdomReasoningResult {
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
        \`Wisdom intelligence outlook is \${input.forecasts.outlook} with primary scenario \${input.scenarios.primaryScenario.replaceAll("_", " ")}.\`,
      connectedForces,
      evidenceGaps,
      confidence: input.confidence,
      narrative: \`Reasoning used \${input.trends.trends.length} trends, \${input.forecasts.forecasts.length} forecasts, and \${input.scenarios.scenarios.length} scenarios.\`,
    };
  }
}
`);

console.log("Part 2: contracts, models, engines done.");
