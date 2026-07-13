/**
 * Part 2: contracts, models, engines for Ecosystem Intelligence.
 * Run after: node scripts/generate-ecosystem-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/ecosystem");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");

const lensBlock = (prefix) => `buildLens({
            networkStrength: \`${prefix} network strength for \${area}.\`,
            strategicPartnerships: \`${prefix} strategic partnerships for \${area}.\`,
            ecosystemHealth: \`${prefix} ecosystem health for \${area}.\`,
            collaborationPotential: \`${prefix} collaboration potential for \${area}.\`,
            dependencyRisk: \`${prefix} dependency risk for \${area}.\`,
            networkEffects: \`${prefix} network effects for \${area}.\`,
            strategicPosition: \`${prefix} strategic position for \${area}.\`,
            longTermEcosystemOutlook: \`Long-term ecosystem outlook ${prefix.toLowerCase()} for \${area}.\`,
          })`;

w("contracts.ts", `import type * as T from "@/lib/platform/intelligence/ecosystem/types";

export interface EcosystemIntelligenceEngine { build(request: T.EcosystemRequest): T.EcosystemResult; }
export type EcosystemEngine = EcosystemIntelligenceEngine;
export interface EcosystemAreaIntelligence {
  assess(input: { baseline: T.EcosystemBaseline; now: Date; createId: (prefix: string) => string }): T.EcosystemAreaSuite;
}
export interface EcosystemForecastEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EcosystemForecastSuite;
}
export interface EcosystemScenarioEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; forecasts: T.EcosystemForecastSuite; now: Date; createId: (prefix: string) => string }): T.EcosystemScenarioSuite;
}
export interface EcosystemTrendEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.EcosystemTrendSuite;
}
export interface EcosystemAnalysisEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; forecasts: T.EcosystemForecastSuite; scenarios: T.EcosystemScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EcosystemAnalysisSuite;
}
export interface NetworkMappingEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.NetworkMappingSuite;
}
export interface PartnershipEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.PartnershipSuite;
}
export interface DependencyEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.DependencySuite;
}
export interface CollaborationEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollaborationSuite;
}
export interface NetworkEffectEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; areas: Record<T.EcosystemArea, T.EcosystemAreaSuite>; now: Date; createId: (prefix: string) => string }): T.NetworkEffectSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.EcosystemBaseline; trends: T.EcosystemTrendSuite; scenarios: T.EcosystemScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface EcosystemReasonerContract {
  reason(input: { request: T.EcosystemRequest; trends: T.EcosystemTrendSuite; forecasts: T.EcosystemForecastSuite; scenarios: T.EcosystemScenarioSuite; confidence: T.EcosystemConfidenceScore }): T.EcosystemReasoningResult;
}
export interface EcosystemRepository {
  save(result: T.EcosystemResult): T.EcosystemResult;
  get(requestId: string): T.EcosystemResult | null;
  list(scope?: Partial<T.GraphScope>): T.EcosystemResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.EcosystemHistoryRecord): T.EcosystemHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.EcosystemHistoryRecord[];
  clear(): void;
}
export interface EcosystemRegistry {
  register(domain: string, capability: string): void;
  list(): T.EcosystemPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface EcosystemIntelligenceService {
  build(request: T.EcosystemRequest): T.EcosystemResult;
  query(result: T.EcosystemResult, request: T.EcosystemQueryRequest): T.EcosystemQueryResult;
  repository(): EcosystemRepository;
}
export type EcosystemService = EcosystemIntelligenceService;
export interface EcosystemDependencies {
  engine?: EcosystemIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.EcosystemArea, EcosystemAreaIntelligence>>;
  forecastEngine?: EcosystemForecastEngineContract;
  scenarioEngine?: EcosystemScenarioEngineContract;
  trendEngine?: EcosystemTrendEngineContract;
  analysisEngine?: EcosystemAnalysisEngineContract;
  networkMappingEngine?: NetworkMappingEngineContract;
  partnershipEngine?: PartnershipEngineContract;
  dependencyEngine?: DependencyEngineContract;
  collaborationEngine?: CollaborationEngineContract;
  networkEffectEngine?: NetworkEffectEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: EcosystemReasonerContract;
  repository?: EcosystemRepository;
  registry?: EcosystemRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
`);

w("models.ts", `import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  EcosystemBaseline, EcosystemConfidenceLevel, EcosystemConfidenceScore,
  EcosystemHealthStatus, EcosystemLens, EcosystemOutlook, EcosystemPriorityBand,
  EcosystemRequest,
} from "@/lib/platform/intelligence/ecosystem/types";
import { ECOSYSTEM_AREAS } from "@/lib/platform/intelligence/ecosystem/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): EcosystemHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): EcosystemPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): EcosystemConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): EcosystemOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 82) return "expanding"; if (score >= 68) return "stable"; if (score >= 50) return "fragmented"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): EcosystemConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(partial: Partial<EcosystemLens> = {}): EcosystemLens {
  return {
    networkStrength: partial.networkStrength ?? "Network strength requires confirmation.",
    strategicPartnerships: partial.strategicPartnerships ?? "Strategic partnerships require confirmation.",
    ecosystemHealth: partial.ecosystemHealth ?? "Ecosystem health requires confirmation.",
    collaborationPotential: partial.collaborationPotential ?? "Collaboration potential requires confirmation.",
    dependencyRisk: partial.dependencyRisk ?? "Dependency risk requires confirmation.",
    networkEffects: partial.networkEffects ?? "Network effects require confirmation.",
    strategicPosition: partial.strategicPosition ?? "Strategic position requires confirmation.",
    longTermEcosystemOutlook: partial.longTermEcosystemOutlook ?? "Long-term ecosystem outlook requires confirmation.",
  };
}
export const defaultCreateId = (prefix: string) => \`\${prefix}-\${Math.random().toString(36).slice(2, 10)}\`;
export const defaultPeriodLabel = (now = new Date()) => now.toISOString().slice(0, 7);
export const emptyEcosystemScope = (): GraphScope => ({ organizationId: null, schoolId: null });

export function defaultEcosystemBaseline(): EcosystemBaseline {
  const areaScores = Object.fromEntries(ECOSYSTEM_AREAS.map(a => [a, 68])) as EcosystemBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    networkStrength: 68,
    strategicPartnerships: 68,
    ecosystemHealth: 68,
    collaborationPotential: 68,
    dependencyRisk: 68,
    networkEffects: 68,
    strategicPosition: 68,
    longTermEcosystemOutlook: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = (value: unknown, fallback: number) =>
  typeof value === "number" ? clamp(value <= 1 ? value * 100 : value) : fallback;

export function deriveEcosystemBaseline(request: EcosystemRequest): EcosystemBaseline {
  const base = defaultEcosystemBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const stakeholder = lightScore(request.stakeholderResult?.healthScore?.value ?? request.stakeholderResult?.engagementScore?.value, 70);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, 70);
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, 70);
  const systems = lightScore(request.systemsResult?.healthScore?.value, 70);
  const systemsAdapt = lightScore(request.systemsResult?.adaptability, systems);
  const resilience = lightScore(request.resilienceResult?.healthScore?.value ?? request.resilienceResult?.adaptiveCapacity, 70);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);

  const areaScores = { ...base.areaScores };
  areaScores.ecosystem_mapping = clamp((systems + stakeholder + market) / 3);
  areaScores.strategic_partnerships = clamp((stakeholder + competitive + opportunity) / 3);
  areaScores.supplier_ecosystems = clamp((market + systems + resilience) / 3);
  areaScores.customer_ecosystems = clamp((market + stakeholder + opportunity) / 3);
  areaScores.community_networks = clamp((stakeholder + market + decision) / 3);
  areaScores.industry_networks = clamp((competitive + market + stakeholder) / 3);
  areaScores.technology_ecosystems = clamp((systems + competitive + predictive) / 3);
  areaScores.academic_research_partnerships = clamp((opportunity + stakeholder + decision) / 3);
  areaScores.government_ecosystems = clamp((stakeholder + decision + market) / 3);
  areaScores.investor_funding_networks = clamp((opportunity + market + predictive) / 3);
  areaScores.nonprofit_ngo_relationships = clamp((stakeholder + opportunity + decision) / 3);
  areaScores.platform_ecosystems = clamp((competitive + systems + market) / 3);
  areaScores.alliance_intelligence = clamp((competitive + stakeholder + opportunity) / 3);
  areaScores.network_effects = clamp((market + systems + competitive) / 3);
  areaScores.ecosystem_dependencies = clamp((systems + resilience + competitive) / 3);
  areaScores.collaboration_opportunities = clamp((opportunity + stakeholder + decision) / 3);
  areaScores.ecosystem_risk = clamp((resilience + competitive + systemsAdapt) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    networkStrength: clamp(areaScores.ecosystem_mapping),
    strategicPartnerships: clamp(areaScores.strategic_partnerships),
    ecosystemHealth: clamp((areaScores.ecosystem_mapping + areaScores.network_effects + areaScores.ecosystem_risk) / 3),
    collaborationPotential: clamp(areaScores.collaboration_opportunities),
    dependencyRisk: clamp(100 - areaScores.ecosystem_dependencies),
    networkEffects: clamp(areaScores.network_effects),
    strategicPosition: clamp((areaScores.alliance_intelligence + areaScores.strategic_partnerships + competitive) / 3),
    longTermEcosystemOutlook: clamp((areaScores.network_effects + predictive + opportunity) / 3),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.ecosystem_risk) / 2),
    evidenceCoverage: clamp((stakeholder + competitive + market + systems + resilience) / 5),
    ...request.baselineOverrides,
  };
}

export const ecosystemModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyEcosystemScope,
  defaultEcosystemBaseline, deriveEcosystemBaseline,
};
export class EcosystemModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveEcosystemBaseline;
  static baseline = defaultEcosystemBaseline; static outlook = outlookFromScore;
}
`);

w("ecosystem-forecast-engine.ts", `import type { EcosystemForecastEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/ecosystem/models";
import { ECOSYSTEM_AREAS, type EcosystemForecastSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemForecastEngine implements EcosystemForecastEngineContract {
  assess(input: Parameters<EcosystemForecastEngineContract["assess"]>[0]): EcosystemForecastSuite {
    const forecasts = ECOSYSTEM_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("esm-forecast"),
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
      narrative: \`Ecosystem forecast maturity \${Math.round(maturityScore)}.\`,
    };
  }
}
`);

w("ecosystem-trend-engine.ts", `import type { EcosystemTrendEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ecosystem/models";
import { ECOSYSTEM_AREAS, type EcosystemTrendSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemTrendEngine implements EcosystemTrendEngineContract {
  assess(input: Parameters<EcosystemTrendEngineContract["assess"]>[0]): EcosystemTrendSuite {
    const trends = ECOSYSTEM_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("esm-trend"),
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
      narrative: \`Ecosystem trends: \${trends.filter(t => t.direction === "improving").length} improving, \${trends.filter(t => t.direction === "worsening").length} worsening.\`,
    };
  }
}
`);

w("ecosystem-scenario-engine.ts", `import type { EcosystemScenarioEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/ecosystem/models";
import { ECOSYSTEM_SCENARIOS, type EcosystemScenarioSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemScenarioEngine implements EcosystemScenarioEngineContract {
  assess(input: Parameters<EcosystemScenarioEngineContract["assess"]>[0]): EcosystemScenarioSuite {
    const scenarios = ECOSYSTEM_SCENARIOS.map((kind, index) => {
      const pressure = input.baseline.dependencyRisk;
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("esm-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        partnershipImpact: clamp(input.baseline.strategicPartnerships - index * 2),
        dependencyImpact: clamp(input.baseline.dependencyRisk + index * 2),
        monitors: [\`monitor:\${kind}\`, "monitor:ecosystem-health"],
        lenses: buildLens({
          networkStrength: \`Scenario network strength for \${kind}.\`,
          strategicPartnerships: \`Scenario strategic partnerships for \${kind}.\`,
          ecosystemHealth: \`Scenario ecosystem health for \${kind}.\`,
          collaborationPotential: \`Scenario collaboration potential for \${kind}.\`,
          dependencyRisk: \`Scenario dependency risk for \${kind}.\`,
          networkEffects: \`Scenario network effects for \${kind}.\`,
          strategicPosition: \`Scenario strategic position for \${kind}.\`,
          longTermEcosystemOutlook: \`Long-term ecosystem outlook under \${kind}.\`,
        }),
        narrative: \`\${kind} probability \${Math.round(probability * 100)}% with impact \${Math.round(organizationalImpact)}.\`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: \`Primary ecosystem scenario \${primary.kind.replaceAll("_", " ")}.\`,
    };
  }
}
`);

w("ecosystem-analysis-engine.ts", `import type { EcosystemAnalysisEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ecosystem/models";
import { ECOSYSTEM_ANALYSIS_KINDS, type EcosystemAnalysisSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemAnalysisEngine implements EcosystemAnalysisEngineContract {
  assess(input: Parameters<EcosystemAnalysisEngineContract["assess"]>[0]): EcosystemAnalysisSuite {
    const scoreFor = (kind: (typeof ECOSYSTEM_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "network_strength": return clamp(input.baseline.networkStrength);
        case "strategic_partnerships": return clamp(input.baseline.strategicPartnerships);
        case "ecosystem_health": return clamp(input.baseline.ecosystemHealth);
        case "collaboration_potential": return clamp(input.baseline.collaborationPotential);
        case "dependency_risk": return clamp(100 - input.baseline.dependencyRisk);
        case "network_effects": return clamp(input.baseline.networkEffects);
        case "strategic_position": return clamp(input.baseline.strategicPosition);
        case "ecosystem_risk": return clamp(input.baseline.areaScores.ecosystem_risk);
        case "early_warning": return clamp(input.baseline.longTermEcosystemOutlook);
        default: return 65;
      }
    };
    const analyses = ECOSYSTEM_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("esm-analysis"),
        kind,
        title: \`\${kind.replaceAll("_", " ")} analysis\`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          networkStrength: \`Network strength through \${kind}.\`,
          strategicPartnerships: \`Strategic partnerships reading for \${kind}.\`,
          ecosystemHealth: \`Ecosystem health for \${kind}.\`,
          collaborationPotential: \`Collaboration potential around \${kind}.\`,
          dependencyRisk: \`Dependency risk of \${kind}.\`,
          networkEffects: \`Network effects in \${kind}.\`,
          strategicPosition: \`Strategic position for \${kind}.\`,
          longTermEcosystemOutlook: \`Long-term ecosystem outlook via \${kind}.\`,
        }),
        narrative: \`\${kind} analysis scored \${Math.round(score)}.\`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...ECOSYSTEM_ANALYSIS_KINDS],
      maturityScore,
      narrative: \`Ecosystem analysis maturity \${Math.round(maturityScore)} across \${analyses.length} kinds.\`,
    };
  }
}
`);

w("network-mapping-engine.ts", `import type { NetworkMappingEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { NetworkMappingSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class NetworkMappingEngine implements NetworkMappingEngineContract {
  assess(input: Parameters<NetworkMappingEngineContract["assess"]>[0]): NetworkMappingSuite {
    const suite = input.areas.ecosystem_mapping;
    const records = suite.records.map(record => ({
      id: input.createId("esm-mapping"),
      title: record.title,
      coverage: record.score,
      lenses: record.lenses,
      narrative: \`Network mapping: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      mappingIndex: input.baseline.networkStrength,
      narrative: \`Network mapping suite index \${Math.round(input.baseline.networkStrength)}.\`,
    };
  }
}
`);

w("partnership-engine.ts", `import type { PartnershipEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { PartnershipSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class PartnershipEngine implements PartnershipEngineContract {
  assess(input: Parameters<PartnershipEngineContract["assess"]>[0]): PartnershipSuite {
    const suite = input.areas.strategic_partnerships;
    const records = suite.records.map(record => ({
      id: input.createId("esm-partnership"),
      title: record.title,
      strength: record.score,
      lenses: record.lenses,
      narrative: \`Partnership analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      partnershipIndex: input.baseline.strategicPartnerships,
      narrative: \`Partnership suite index \${Math.round(input.baseline.strategicPartnerships)}.\`,
    };
  }
}
`);

w("dependency-engine.ts", `import type { DependencyEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { DependencySuite } from "@/lib/platform/intelligence/ecosystem/types";

export class DependencyEngine implements DependencyEngineContract {
  assess(input: Parameters<DependencyEngineContract["assess"]>[0]): DependencySuite {
    const suite = input.areas.ecosystem_dependencies;
    const records = suite.records.map(record => ({
      id: input.createId("esm-dependency"),
      title: record.title,
      risk: 100 - record.score,
      lenses: record.lenses,
      narrative: \`Dependency analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      dependencyIndex: input.baseline.dependencyRisk,
      narrative: \`Dependency suite index \${Math.round(input.baseline.dependencyRisk)}.\`,
    };
  }
}
`);

w("collaboration-engine.ts", `import type { CollaborationEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { CollaborationSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class CollaborationEngine implements CollaborationEngineContract {
  assess(input: Parameters<CollaborationEngineContract["assess"]>[0]): CollaborationSuite {
    const suite = input.areas.collaboration_opportunities;
    const records = suite.records.map(record => ({
      id: input.createId("esm-collaboration"),
      title: record.title,
      potential: record.score,
      lenses: record.lenses,
      narrative: \`Collaboration analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      collaborationIndex: input.baseline.collaborationPotential,
      narrative: \`Collaboration suite index \${Math.round(input.baseline.collaborationPotential)}.\`,
    };
  }
}
`);

w("network-effect-engine.ts", `import type { NetworkEffectEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { NetworkEffectSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class NetworkEffectEngine implements NetworkEffectEngineContract {
  assess(input: Parameters<NetworkEffectEngineContract["assess"]>[0]): NetworkEffectSuite {
    const suite = input.areas.network_effects;
    const records = suite.records.map(record => ({
      id: input.createId("esm-network-effect"),
      title: record.title,
      effect: record.score,
      lenses: record.lenses,
      narrative: \`Network effect analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      networkEffectIndex: input.baseline.networkEffects,
      narrative: \`Network effect suite index \${Math.round(input.baseline.networkEffects)}.\`,
    };
  }
}
`);

w("early-warning-engine.ts", `import type { EarlyWarningEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { clamp, priorityFromScore } from "@/lib/platform/intelligence/ecosystem/models";
import type { EarlyWarningSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class EarlyWarningEngine implements EarlyWarningEngineContract {
  assess(input: Parameters<EarlyWarningEngineContract["assess"]>[0]): EarlyWarningSuite {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening").slice(0, 4);
    const hot = input.scenarios.scenarios.slice(0, 3);
    const alerts = [
      ...worsening.map(t => ({
        id: input.createId("esm-alert"),
        title: \`Trend alert: \${t.area}\`,
        severity: priorityFromScore(100 - t.magnitude),
        source: "trends",
        score: clamp(100 - t.magnitude),
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...hot.map(s => ({
        id: input.createId("esm-alert"),
        title: \`Scenario alert: \${s.kind}\`,
        severity: s.severity,
        source: "scenarios",
        score: clamp(100 - s.organizationalImpact),
        lenses: s.lenses,
        narrative: s.narrative,
      })),
    ];
    const score = clamp(alerts.length ? alerts.reduce((s, a) => s + a.score, 0) / alerts.length : input.baseline.longTermEcosystemOutlook);
    return {
      alerts,
      score,
      alertCount: alerts.length,
      narrative: \`Ecosystem early warning suite with \${alerts.length} alerts.\`,
    };
  }
}
`);

w("knowledge-contribution.ts", `import type { EcosystemForecastSuite, EcosystemKnowledgeContribution, EcosystemScenarioSuite } from "@/lib/platform/intelligence/ecosystem/types";

/**
 * Ecosystem knowledge contribution drafts for Knowledge Intelligence soft-read
 * and downstream learning.
 */
export class EcosystemKnowledgeContributionEngine {
  contribute(input: {
    forecasts: EcosystemForecastSuite;
    scenarios: EcosystemScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): EcosystemKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("esm-knowledge"),
        type: "ecosystem_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("esm-knowledge"),
        type: "ecosystem_scenario",
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
      narrative: \`\${artifacts.length} ecosystem learning drafts prepared for Knowledge and decision domains.\`,
    };
  }
}
`);

w("closed-learning-loop.ts", `import type {
  ClosedLearningLoopContribution,
  EcosystemRecommendationRecord,
  EcosystemScenarioSuite,
  EcosystemTrendSuite,
} from "@/lib/platform/intelligence/ecosystem/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: EcosystemTrendSuite;
    scenarios: EcosystemScenarioSuite;
    recommendations: EcosystemRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("esm-learning"),
      destinations: ["stakeholder", "competitive", "market", "systems", "resilience", "opportunity", "predictive"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => \`\${t.area}:\${t.direction}\`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => \`\${s.kind}:\${Math.round(s.probability * 100)}\`),
      contributedAt: input.now.toISOString(),
      narrative: "Ecosystem evidence feeds Stakeholder, Competitive, Market, Systems, Resilience, Opportunity, and Predictive Intelligence.",
    };
  }
}
`);

w("ecosystem-reasoner.ts", `import type { EcosystemReasonerContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { EcosystemReasoningResult } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemReasoner implements EcosystemReasonerContract {
  reason(input: Parameters<EcosystemReasonerContract["reason"]>[0]): EcosystemReasoningResult {
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
        \`Ecosystem outlook is \${input.forecasts.outlook} with primary scenario \${input.scenarios.primaryScenario.replaceAll("_", " ")}.\`,
      connectedForces,
      evidenceGaps,
      confidence: input.confidence,
      narrative: \`Reasoning used \${input.trends.trends.length} trends, \${input.forecasts.forecasts.length} forecasts, and \${input.scenarios.scenarios.length} scenarios.\`,
    };
  }
}
`);

console.log("Part 2: contracts, models, engines done.");
