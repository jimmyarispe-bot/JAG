/**
 * Part 2: contracts, models, engines for Resilience Intelligence.
 * Run after: node scripts/generate-resilience-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/resilience");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");

const AREAS = [
  ["organizational_resilience", "OrganizationalResilienceIntelligence"],
  ["business_continuity", "BusinessContinuityIntelligence"],
  ["disaster_recovery", "DisasterRecoveryIntelligence"],
  ["operational_recovery", "OperationalRecoveryIntelligence"],
  ["financial_resilience", "FinancialResilienceIntelligence"],
  ["workforce_resilience", "WorkforceResilienceIntelligence"],
  ["supply_chain_resilience", "SupplyChainResilienceIntelligence"],
  ["cyber_resilience", "CyberResilienceIntelligence"],
  ["infrastructure_resilience", "InfrastructureResilienceIntelligence"],
  ["vendor_resilience", "VendorResilienceIntelligence"],
  ["crisis_readiness", "CrisisReadinessIntelligence"],
  ["adaptive_capacity", "AdaptiveCapacityIntelligence"],
  ["redundancy_planning", "RedundancyPlanningIntelligence"],
  ["recovery_time_analysis", "RecoveryTimeAnalysisIntelligence"],
  ["stress_testing", "StressTestingIntelligence"],
  ["resilience_optimization", "ResilienceOptimizationIntelligence"],
  ["long_term_adaptability", "LongTermAdaptabilityIntelligence"],
];
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

w("contracts.ts", `import type * as T from "@/lib/platform/intelligence/resilience/types";

export interface ResilienceIntelligenceEngine { build(request: T.ResilienceRequest): T.ResilienceResult; }
export type ResilienceEngine = ResilienceIntelligenceEngine;
export interface ResilienceAreaIntelligence {
  assess(input: { baseline: T.ResilienceBaseline; now: Date; createId: (prefix: string) => string }): T.ResilienceAreaSuite;
}
export interface ResilienceForecastEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ResilienceForecastSuite;
}
export interface ResilienceScenarioEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; forecasts: T.ResilienceForecastSuite; now: Date; createId: (prefix: string) => string }): T.ResilienceScenarioSuite;
}
export interface ResilienceTrendEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ResilienceTrendSuite;
}
export interface ResilienceAnalysisEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; forecasts: T.ResilienceForecastSuite; scenarios: T.ResilienceScenarioSuite; now: Date; createId: (prefix: string) => string }): T.ResilienceAnalysisSuite;
}
export interface StressTestEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.StressTestSuite;
}
export interface RecoveryEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.RecoverySuite;
}
export interface ContinuityEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ContinuitySuite;
}
export interface AdaptiveCapacityEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; areas: Record<T.ResilienceArea, T.ResilienceAreaSuite>; now: Date; createId: (prefix: string) => string }): T.AdaptiveCapacitySuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.ResilienceBaseline; trends: T.ResilienceTrendSuite; scenarios: T.ResilienceScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface ResilienceReasonerContract {
  reason(input: { request: T.ResilienceRequest; trends: T.ResilienceTrendSuite; forecasts: T.ResilienceForecastSuite; scenarios: T.ResilienceScenarioSuite; confidence: T.ResilienceConfidenceScore }): T.ResilienceReasoningResult;
}
export interface ResilienceRepository {
  save(result: T.ResilienceResult): T.ResilienceResult;
  get(requestId: string): T.ResilienceResult | null;
  list(scope?: Partial<T.GraphScope>): T.ResilienceResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.ResilienceHistoryRecord): T.ResilienceHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.ResilienceHistoryRecord[];
  clear(): void;
}
export interface ResilienceRegistry {
  register(domain: string, capability: string): void;
  list(): T.ResiliencePublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface ResilienceIntelligenceService {
  build(request: T.ResilienceRequest): T.ResilienceResult;
  query(result: T.ResilienceResult, request: T.ResilienceQueryRequest): T.ResilienceQueryResult;
  repository(): ResilienceRepository;
}
export type ResilienceService = ResilienceIntelligenceService;
export interface ResilienceDependencies {
  engine?: ResilienceIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.ResilienceArea, ResilienceAreaIntelligence>>;
  forecastEngine?: ResilienceForecastEngineContract;
  scenarioEngine?: ResilienceScenarioEngineContract;
  trendEngine?: ResilienceTrendEngineContract;
  analysisEngine?: ResilienceAnalysisEngineContract;
  stressTestEngine?: StressTestEngineContract;
  recoveryEngine?: RecoveryEngineContract;
  continuityEngine?: ContinuityEngineContract;
  adaptiveCapacityEngine?: AdaptiveCapacityEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: ResilienceReasonerContract;
  repository?: ResilienceRepository;
  registry?: ResilienceRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
`);

w("models.ts", `import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  ResilienceBaseline, ResilienceConfidenceLevel, ResilienceConfidenceScore,
  ResilienceHealthStatus, ResilienceLens, ResilienceOutlook, ResiliencePriorityBand,
  ResilienceRequest,
} from "@/lib/platform/intelligence/resilience/types";
import { RESILIENCE_AREAS } from "@/lib/platform/intelligence/resilience/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): ResilienceHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): ResiliencePriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): ResilienceConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): ResilienceOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 82) return "hardened"; if (score >= 68) return "stable"; if (score >= 50) return "fragile"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): ResilienceConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(partial: Partial<ResilienceLens> = {}): ResilienceLens {
  return {
    organizationalReadiness: partial.organizationalReadiness ?? "Organizational readiness requires confirmation.",
    recoveryCapability: partial.recoveryCapability ?? "Recovery capability requires confirmation.",
    operationalStability: partial.operationalStability ?? "Operational stability requires confirmation.",
    financialStability: partial.financialStability ?? "Financial stability requires confirmation.",
    workforceStability: partial.workforceStability ?? "Workforce stability requires confirmation.",
    infrastructureReadiness: partial.infrastructureReadiness ?? "Infrastructure readiness requires confirmation.",
    adaptiveCapacity: partial.adaptiveCapacity ?? "Adaptive capacity requires confirmation.",
    longTermResilienceOutlook: partial.longTermResilienceOutlook ?? "Long-term resilience outlook requires confirmation.",
  };
}
export const defaultCreateId = (prefix: string) => \`\${prefix}-\${Math.random().toString(36).slice(2, 10)}\`;
export const defaultPeriodLabel = (now = new Date()) => now.toISOString().slice(0, 7);
export const emptyResilienceScope = (): GraphScope => ({ organizationId: null, schoolId: null });

export function defaultResilienceBaseline(): ResilienceBaseline {
  const areaScores = Object.fromEntries(RESILIENCE_AREAS.map(a => [a, 68])) as ResilienceBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    organizationalReadiness: 68,
    recoveryCapability: 68,
    operationalStability: 68,
    financialStability: 68,
    workforceStability: 68,
    infrastructureReadiness: 68,
    adaptiveCapacity: 68,
    longTermResilienceOutlook: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = (value: unknown, fallback: number) =>
  typeof value === "number" ? clamp(value <= 1 ? value * 100 : value) : fallback;

export function deriveResilienceBaseline(request: ResilienceRequest): ResilienceBaseline {
  const base = defaultResilienceBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const systems = lightScore(request.systemsResult?.healthScore?.value, 70);
  const systemsAdapt = lightScore(request.systemsResult?.adaptability, systems);
  const operations = lightScore(request.operationsResult?.healthScore?.value ?? request.operationsResult?.throughputScore?.value, 70);
  const legal = lightScore(request.legalComplianceRiskResult?.healthScore?.value, 70);
  const legalCompliance = lightScore(request.legalComplianceRiskResult?.complianceScore?.value, legal);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const economic = lightScore(request.economicResult?.economicScore?.value ?? request.economicResult?.healthScore?.value, 70);
  // Technology/Security soft-read via operations (tech delivery) and legal-compliance-risk (cyber/security risk).
  const techProxy = operations;
  const securityProxy = clamp((legal + legalCompliance) / 2);

  const areaScores = { ...base.areaScores };
  areaScores.organizational_resilience = clamp((systems + decision + health) / 3);
  areaScores.business_continuity = clamp((operations + systems + decision) / 3);
  areaScores.disaster_recovery = clamp((operations + techProxy + predictive) / 3);
  areaScores.operational_recovery = clamp((operations + systemsAdapt + decision) / 3);
  areaScores.financial_resilience = clamp((economic + decision + health) / 3);
  areaScores.workforce_resilience = clamp((operations + decision + predictive) / 3);
  areaScores.supply_chain_resilience = clamp((operations + economic + systems) / 3);
  areaScores.cyber_resilience = clamp((securityProxy + techProxy + systems) / 3);
  areaScores.infrastructure_resilience = clamp((techProxy + operations + systems) / 3);
  areaScores.vendor_resilience = clamp((operations + economic + legal) / 3);
  areaScores.crisis_readiness = clamp((decision + systems + predictive) / 3);
  areaScores.adaptive_capacity = clamp((systemsAdapt + predictive + decision) / 3);
  areaScores.redundancy_planning = clamp((operations + systems + decision) / 3);
  areaScores.recovery_time_analysis = clamp((areaScores.disaster_recovery + areaScores.operational_recovery + predictive) / 3);
  areaScores.stress_testing = clamp((predictive + systems + decision) / 3);
  areaScores.resilience_optimization = clamp((areaScores.organizational_resilience + opportunityFallback(economic, opportunityFromOps(operations)) + decision) / 3);
  areaScores.long_term_adaptability = clamp((areaScores.adaptive_capacity + predictive + health) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    organizationalReadiness: clamp(areaScores.organizational_resilience),
    recoveryCapability: clamp((areaScores.disaster_recovery + areaScores.operational_recovery + areaScores.recovery_time_analysis) / 3),
    operationalStability: clamp(areaScores.operational_recovery),
    financialStability: clamp(areaScores.financial_resilience),
    workforceStability: clamp(areaScores.workforce_resilience),
    infrastructureReadiness: clamp((areaScores.infrastructure_resilience + areaScores.cyber_resilience) / 2),
    adaptiveCapacity: clamp(areaScores.adaptive_capacity),
    longTermResilienceOutlook: clamp((areaScores.long_term_adaptability + areaScores.adaptive_capacity + predictive) / 3),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.stress_testing) / 2),
    evidenceCoverage: clamp((systems + operations + legal + economic) / 4),
    ...request.baselineOverrides,
  };
}

function opportunityFromOps(operations: number) { return operations; }
function opportunityFallback(economic: number, ops: number) { return (economic + ops) / 2; }

export const resilienceModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyResilienceScope,
  defaultResilienceBaseline, deriveResilienceBaseline,
};
export class ResilienceModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveResilienceBaseline;
  static baseline = defaultResilienceBaseline; static outlook = outlookFromScore;
}
`);

const lensBlock = (prefix) => `buildLens({
            organizationalReadiness: \`${prefix} organizational readiness for \${area}.\`,
            recoveryCapability: \`${prefix} recovery capability for \${area}.\`,
            operationalStability: \`${prefix} operational stability for \${area}.\`,
            financialStability: \`${prefix} financial stability for \${area}.\`,
            workforceStability: \`${prefix} workforce stability for \${area}.\`,
            infrastructureReadiness: \`${prefix} infrastructure readiness for \${area}.\`,
            adaptiveCapacity: \`${prefix} adaptive capacity for \${area}.\`,
            longTermResilienceOutlook: \`Long-term resilience outlook ${prefix.toLowerCase()} for \${area}.\`,
          })`;

w("resilience-forecast-engine.ts", `import type { ResilienceForecastEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/resilience/models";
import { RESILIENCE_AREAS, type ResilienceForecastSuite } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceForecastEngine implements ResilienceForecastEngineContract {
  assess(input: Parameters<ResilienceForecastEngineContract["assess"]>[0]): ResilienceForecastSuite {
    const forecasts = RESILIENCE_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("rsl-forecast"),
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
      narrative: \`Resilience forecast maturity \${Math.round(maturityScore)}.\`,
    };
  }
}
`);

w("resilience-trend-engine.ts", `import type { ResilienceTrendEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/resilience/models";
import { RESILIENCE_AREAS, type ResilienceTrendSuite } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceTrendEngine implements ResilienceTrendEngineContract {
  assess(input: Parameters<ResilienceTrendEngineContract["assess"]>[0]): ResilienceTrendSuite {
    const trends = RESILIENCE_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("rsl-trend"),
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
      narrative: \`Resilience trends: \${trends.filter(t => t.direction === "improving").length} improving, \${trends.filter(t => t.direction === "worsening").length} worsening.\`,
    };
  }
}
`);

w("resilience-scenario-engine.ts", `import type { ResilienceScenarioEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/resilience/models";
import { RESILIENCE_SCENARIOS, type ResilienceScenarioSuite } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceScenarioEngine implements ResilienceScenarioEngineContract {
  assess(input: Parameters<ResilienceScenarioEngineContract["assess"]>[0]): ResilienceScenarioSuite {
    const scenarios = RESILIENCE_SCENARIOS.map((kind, index) => {
      const pressure = 100 - input.baseline.adaptiveCapacity;
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("rsl-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        recoveryImpact: clamp(input.baseline.recoveryCapability - index * 2),
        continuityImpact: clamp(input.baseline.areaScores.business_continuity - index * 2),
        monitors: [\`monitor:\${kind}\`, "monitor:adaptive-capacity"],
        lenses: buildLens({
          organizationalReadiness: \`Scenario organizational readiness for \${kind}.\`,
          recoveryCapability: \`Scenario recovery capability for \${kind}.\`,
          operationalStability: \`Scenario operational stability for \${kind}.\`,
          financialStability: \`Scenario financial stability for \${kind}.\`,
          workforceStability: \`Scenario workforce stability for \${kind}.\`,
          infrastructureReadiness: \`Scenario infrastructure readiness for \${kind}.\`,
          adaptiveCapacity: \`Scenario adaptive capacity for \${kind}.\`,
          longTermResilienceOutlook: \`Long-term resilience outlook under \${kind}.\`,
        }),
        narrative: \`\${kind} probability \${Math.round(probability * 100)}% with impact \${Math.round(organizationalImpact)}.\`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: \`Primary resilience scenario \${primary.kind.replaceAll("_", " ")}.\`,
    };
  }
}
`);

w("resilience-analysis-engine.ts", `import type { ResilienceAnalysisEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/resilience/models";
import { RESILIENCE_ANALYSIS_KINDS, type ResilienceAnalysisSuite } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceAnalysisEngine implements ResilienceAnalysisEngineContract {
  assess(input: Parameters<ResilienceAnalysisEngineContract["assess"]>[0]): ResilienceAnalysisSuite {
    const scoreFor = (kind: (typeof RESILIENCE_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "organizational_readiness": return clamp(input.baseline.organizationalReadiness);
        case "recovery_capability": return clamp(input.baseline.recoveryCapability);
        case "operational_stability": return clamp(input.baseline.operationalStability);
        case "financial_stability": return clamp(input.baseline.financialStability);
        case "workforce_stability": return clamp(input.baseline.workforceStability);
        case "infrastructure_readiness": return clamp(input.baseline.infrastructureReadiness);
        case "adaptive_capacity": return clamp(input.baseline.adaptiveCapacity);
        case "stress_testing": return clamp(input.baseline.areaScores.stress_testing);
        case "early_warning": return clamp(input.baseline.longTermResilienceOutlook);
        default: return 65;
      }
    };
    const analyses = RESILIENCE_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("rsl-analysis"),
        kind,
        title: \`\${kind.replaceAll("_", " ")} analysis\`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          organizationalReadiness: \`Organizational readiness through \${kind}.\`,
          recoveryCapability: \`Recovery capability reading for \${kind}.\`,
          operationalStability: \`Operational stability for \${kind}.\`,
          financialStability: \`Financial stability around \${kind}.\`,
          workforceStability: \`Workforce stability of \${kind}.\`,
          infrastructureReadiness: \`Infrastructure readiness in \${kind}.\`,
          adaptiveCapacity: \`Adaptive capacity for \${kind}.\`,
          longTermResilienceOutlook: \`Long-term resilience outlook via \${kind}.\`,
        }),
        narrative: \`\${kind} analysis scored \${Math.round(score)}.\`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...RESILIENCE_ANALYSIS_KINDS],
      maturityScore,
      narrative: \`Resilience analysis maturity \${Math.round(maturityScore)} across \${analyses.length} kinds.\`,
    };
  }
}
`);

w("stress-test-engine.ts", `import type { StressTestEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import type { StressTestSuite } from "@/lib/platform/intelligence/resilience/types";

export class StressTestEngine implements StressTestEngineContract {
  assess(input: Parameters<StressTestEngineContract["assess"]>[0]): StressTestSuite {
    const suite = input.areas.stress_testing;
    const records = suite.records.map(record => ({
      id: input.createId("rsl-stress"),
      title: record.title,
      severity: 100 - record.score,
      lenses: record.lenses,
      narrative: \`Stress test: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      stressIndex: input.baseline.areaScores.stress_testing,
      narrative: \`Stress test suite index \${Math.round(input.baseline.areaScores.stress_testing)}.\`,
    };
  }
}
`);

w("recovery-engine.ts", `import type { RecoveryEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import type { RecoverySuite } from "@/lib/platform/intelligence/resilience/types";

export class RecoveryEngine implements RecoveryEngineContract {
  assess(input: Parameters<RecoveryEngineContract["assess"]>[0]): RecoverySuite {
    const suite = input.areas.recovery_time_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("rsl-recovery"),
      title: record.title,
      recoveryTime: 100 - record.score,
      lenses: record.lenses,
      narrative: \`Recovery analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      recoveryIndex: input.baseline.recoveryCapability,
      narrative: \`Recovery suite index \${Math.round(input.baseline.recoveryCapability)}.\`,
    };
  }
}
`);

w("continuity-engine.ts", `import type { ContinuityEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import type { ContinuitySuite } from "@/lib/platform/intelligence/resilience/types";

export class ContinuityEngine implements ContinuityEngineContract {
  assess(input: Parameters<ContinuityEngineContract["assess"]>[0]): ContinuitySuite {
    const suite = input.areas.business_continuity;
    const records = suite.records.map(record => ({
      id: input.createId("rsl-continuity"),
      title: record.title,
      continuity: record.score,
      lenses: record.lenses,
      narrative: \`Continuity analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      continuityIndex: input.baseline.areaScores.business_continuity,
      narrative: \`Continuity suite index \${Math.round(input.baseline.areaScores.business_continuity)}.\`,
    };
  }
}
`);

w("adaptive-capacity-engine.ts", `import type { AdaptiveCapacityEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import type { AdaptiveCapacitySuite } from "@/lib/platform/intelligence/resilience/types";

export class AdaptiveCapacityEngine implements AdaptiveCapacityEngineContract {
  assess(input: Parameters<AdaptiveCapacityEngineContract["assess"]>[0]): AdaptiveCapacitySuite {
    const suite = input.areas.adaptive_capacity;
    const records = suite.records.map(record => ({
      id: input.createId("rsl-adaptive"),
      title: record.title,
      capacity: record.score,
      lenses: record.lenses,
      narrative: \`Adaptive capacity: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      adaptiveIndex: input.baseline.adaptiveCapacity,
      narrative: \`Adaptive capacity suite index \${Math.round(input.baseline.adaptiveCapacity)}.\`,
    };
  }
}
`);

w("early-warning-engine.ts", `import type { EarlyWarningEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import { clamp, priorityFromScore } from "@/lib/platform/intelligence/resilience/models";
import type { EarlyWarningSuite } from "@/lib/platform/intelligence/resilience/types";

export class EarlyWarningEngine implements EarlyWarningEngineContract {
  assess(input: Parameters<EarlyWarningEngineContract["assess"]>[0]): EarlyWarningSuite {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening").slice(0, 4);
    const hot = input.scenarios.scenarios.slice(0, 3);
    const alerts = [
      ...worsening.map(t => ({
        id: input.createId("rsl-alert"),
        title: \`Trend alert: \${t.area}\`,
        severity: priorityFromScore(100 - t.magnitude),
        source: "trends",
        score: clamp(100 - t.magnitude),
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...hot.map(s => ({
        id: input.createId("rsl-alert"),
        title: \`Scenario alert: \${s.kind}\`,
        severity: s.severity,
        source: "scenarios",
        score: clamp(100 - s.organizationalImpact),
        lenses: s.lenses,
        narrative: s.narrative,
      })),
    ];
    const score = clamp(alerts.length ? alerts.reduce((s, a) => s + a.score, 0) / alerts.length : input.baseline.longTermResilienceOutlook);
    return {
      alerts,
      score,
      alertCount: alerts.length,
      narrative: \`Resilience early warning suite with \${alerts.length} alerts.\`,
    };
  }
}
`);

w("knowledge-contribution.ts", `import type { ResilienceForecastSuite, ResilienceKnowledgeContribution, ResilienceScenarioSuite } from "@/lib/platform/intelligence/resilience/types";

/**
 * Resilience knowledge contribution drafts for Knowledge Intelligence soft-read
 * and downstream learning.
 */
export class ResilienceKnowledgeContributionEngine {
  contribute(input: {
    forecasts: ResilienceForecastSuite;
    scenarios: ResilienceScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): ResilienceKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("rsl-knowledge"),
        type: "resilience_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("rsl-knowledge"),
        type: "resilience_scenario",
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
      narrative: \`\${artifacts.length} resilience learning drafts prepared for Knowledge and decision domains.\`,
    };
  }
}
`);

w("closed-learning-loop.ts", `import type {
  ClosedLearningLoopContribution,
  ResilienceRecommendationRecord,
  ResilienceScenarioSuite,
  ResilienceTrendSuite,
} from "@/lib/platform/intelligence/resilience/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: ResilienceTrendSuite;
    scenarios: ResilienceScenarioSuite;
    recommendations: ResilienceRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("rsl-learning"),
      destinations: ["systems", "operations", "legal-compliance-risk", "economic", "executive-decision", "predictive", "opportunity"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => \`\${t.area}:\${t.direction}\`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => \`\${s.kind}:\${Math.round(s.probability * 100)}\`),
      contributedAt: input.now.toISOString(),
      narrative: "Resilience evidence feeds Systems, Operations, Legal Compliance Risk, Economic, Executive Decision, Predictive, and Opportunity Intelligence.",
    };
  }
}
`);

w("resilience-reasoner.ts", `import type { ResilienceReasonerContract } from "@/lib/platform/intelligence/resilience/contracts";
import type { ResilienceReasoningResult } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceReasoner implements ResilienceReasonerContract {
  reason(input: Parameters<ResilienceReasonerContract["reason"]>[0]): ResilienceReasoningResult {
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
        \`Resilience outlook is \${input.forecasts.outlook} with primary scenario \${input.scenarios.primaryScenario.replaceAll("_", " ")}.\`,
      connectedForces,
      evidenceGaps,
      confidence: input.confidence,
      narrative: \`Reasoning used \${input.trends.trends.length} trends, \${input.forecasts.forecasts.length} forecasts, and \${input.scenarios.scenarios.length} scenarios.\`,
    };
  }
}
`);

console.log("Part 2: contracts, models, engines done.");
void AREAS;
void snakeToCamel;
