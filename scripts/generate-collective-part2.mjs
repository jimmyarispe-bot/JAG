/**
 * Part 2: contracts, models, engines for Collective Intelligence.
 * Run after: node scripts/generate-collective-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/collective");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");
const PKG = "@/lib/platform/intelligence/collective";

const lensBlock = (prefix) => `buildLens({
            consensusStrength: \`${prefix} consensus strength for \${area}.\`,
            expertiseCoverage: \`${prefix} expertise coverage for \${area}.\`,
            perspectiveDiversity: \`${prefix} perspective diversity for \${area}.\`,
            crossDomainAgreement: \`${prefix} cross-domain agreement for \${area}.\`,
            organizationalAlignment: \`${prefix} organizational alignment for \${area}.\`,
            collaborationQuality: \`${prefix} collaboration quality for \${area}.\`,
            collectiveConfidence: \`${prefix} collective confidence for \${area}.\`,
            longTermCollectiveValue: \`Long-term collective value ${prefix.toLowerCase()} for \${area}.\`,
          })`;

w("contracts.ts", `import type * as T from "${PKG}/types";

export interface CollectiveIntelligenceEngine { build(request: T.CollectiveRequest): T.CollectiveResult; }
export type CollectiveEngine = CollectiveIntelligenceEngine;
export interface CollectiveAreaIntelligence {
  assess(input: { baseline: T.CollectiveBaseline; now: Date; createId: (prefix: string) => string }): T.CollectiveAreaSuite;
}
export interface CollectiveForecastEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollectiveForecastSuite;
}
export interface CollectiveScenarioEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; forecasts: T.CollectiveForecastSuite; now: Date; createId: (prefix: string) => string }): T.CollectiveScenarioSuite;
}
export interface CollectiveTrendEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollectiveTrendSuite;
}
export interface CollectiveAnalysisEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; forecasts: T.CollectiveForecastSuite; scenarios: T.CollectiveScenarioSuite; now: Date; createId: (prefix: string) => string }): T.CollectiveAnalysisSuite;
}
export interface ConsensusEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ConsensusSuite;
}
export interface DistributedExpertiseEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.DistributedExpertiseSuite;
}
export interface CrossDomainSynthesisEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CrossDomainSynthesisSuite;
}
export interface CollaborationEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.CollaborationSuite;
}
export interface ConflictResolutionEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; areas: Record<T.CollectiveArea, T.CollectiveAreaSuite>; now: Date; createId: (prefix: string) => string }): T.ConflictResolutionSuite;
}
export interface EarlyWarningEngineContract {
  assess(input: { baseline: T.CollectiveBaseline; trends: T.CollectiveTrendSuite; scenarios: T.CollectiveScenarioSuite; now: Date; createId: (prefix: string) => string }): T.EarlyWarningSuite;
}
export interface CollectiveReasonerContract {
  reason(input: { request: T.CollectiveRequest; trends: T.CollectiveTrendSuite; forecasts: T.CollectiveForecastSuite; scenarios: T.CollectiveScenarioSuite; confidence: T.CollectiveConfidenceScore }): T.CollectiveReasoningResult;
}
export interface CollectiveRepository {
  save(result: T.CollectiveResult): T.CollectiveResult;
  get(requestId: string): T.CollectiveResult | null;
  list(scope?: Partial<T.GraphScope>): T.CollectiveResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.CollectiveHistoryRecord): T.CollectiveHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.CollectiveHistoryRecord[];
  clear(): void;
}
export interface CollectiveRegistry {
  register(domain: string, capability: string): void;
  list(): T.CollectivePublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}
export interface CollectiveIntelligenceService {
  build(request: T.CollectiveRequest): T.CollectiveResult;
  query(result: T.CollectiveResult, request: T.CollectiveQueryRequest): T.CollectiveQueryResult;
  repository(): CollectiveRepository;
}
export type CollectiveService = CollectiveIntelligenceService;
export interface CollectiveDependencies {
  engine?: CollectiveIntelligenceEngine;
  areaIntelligence?: Partial<Record<T.CollectiveArea, CollectiveAreaIntelligence>>;
  forecastEngine?: CollectiveForecastEngineContract;
  scenarioEngine?: CollectiveScenarioEngineContract;
  trendEngine?: CollectiveTrendEngineContract;
  analysisEngine?: CollectiveAnalysisEngineContract;
  consensusEngine?: ConsensusEngineContract;
  distributedExpertiseEngine?: DistributedExpertiseEngineContract;
  crossDomainSynthesisEngine?: CrossDomainSynthesisEngineContract;
  collaborationEngine?: CollaborationEngineContract;
  conflictResolutionEngine?: ConflictResolutionEngineContract;
  earlyWarningEngine?: EarlyWarningEngineContract;
  reasoner?: CollectiveReasonerContract;
  repository?: CollectiveRepository;
  registry?: CollectiveRegistry;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
`);

w("models.ts", `import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  CollectiveBaseline, CollectiveConfidenceLevel, CollectiveConfidenceScore,
  CollectiveHealthStatus, CollectiveLens, CollectiveOutlook, CollectivePriorityBand,
  CollectiveRequest,
} from "${PKG}/types";
import { COLLECTIVE_AREAS } from "${PKG}/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): CollectiveHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): CollectivePriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): CollectiveConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): CollectiveOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 82) return "aligned"; if (score >= 68) return "stable"; if (score >= 50) return "contested"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): CollectiveConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(partial: Partial<CollectiveLens> = {}): CollectiveLens {
  return {
    consensusStrength: partial.consensusStrength ?? "Consensus strength requires confirmation.",
    expertiseCoverage: partial.expertiseCoverage ?? "Expertise coverage requires confirmation.",
    perspectiveDiversity: partial.perspectiveDiversity ?? "Perspective diversity requires confirmation.",
    crossDomainAgreement: partial.crossDomainAgreement ?? "Cross-domain agreement requires confirmation.",
    organizationalAlignment: partial.organizationalAlignment ?? "Organizational alignment requires confirmation.",
    collaborationQuality: partial.collaborationQuality ?? "Collaboration quality requires confirmation.",
    collectiveConfidence: partial.collectiveConfidence ?? "Collective confidence requires confirmation.",
    longTermCollectiveValue: partial.longTermCollectiveValue ?? "Long-term collective value requires confirmation.",
  };
}
export const defaultCreateId = (prefix: string) => \`\${prefix}-\${Math.random().toString(36).slice(2, 10)}\`;
export const defaultPeriodLabel = (now = new Date()) => now.toISOString().slice(0, 7);
export const emptyCollectiveScope = (): GraphScope => ({ organizationId: null, schoolId: null });

export function defaultCollectiveBaseline(): CollectiveBaseline {
  const areaScores = Object.fromEntries(COLLECTIVE_AREAS.map(a => [a, 68])) as CollectiveBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    consensusStrength: 68,
    expertiseCoverage: 68,
    perspectiveDiversity: 68,
    crossDomainAgreement: 68,
    organizationalAlignment: 68,
    collaborationQuality: 68,
    collectiveConfidence: 68,
    longTermCollectiveValue: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = (value: unknown, fallback: number) =>
  typeof value === "number" ? clamp(value <= 1 ? value * 100 : value) : fallback;

export function deriveCollectiveBaseline(request: CollectiveRequest): CollectiveBaseline {
  const base = defaultCollectiveBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
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
  const behavioral = lightScore(request.behavioralResult?.behavioralScore?.value ?? request.behavioralResult?.healthScore?.value, 70);
  const cultural = lightScore(request.culturalResult?.culturalScore?.value ?? request.culturalResult?.healthScore?.value, 70);
  const stakeholder = lightScore(request.stakeholderResult?.healthScore?.value ?? request.stakeholderResult?.engagementScore?.value, 70);
  const systems = lightScore(request.systemsResult?.healthScore?.value, 70);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);
  const ecosystem = lightScore(request.ecosystemResult?.ecosystemScore?.value ?? request.ecosystemResult?.healthScore?.value, 70);
  const resilience = lightScore(request.resilienceResult?.healthScore?.value ?? request.resilienceResult?.adaptiveCapacity, 70);
  const ethical = lightScore(request.ethicalResult?.ethicalScore?.value ?? request.ethicalResult?.healthScore?.value, 70);
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, 70);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, 70);
  const humanCapital = lightScore(request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, 70);
  const operations = lightScore(request.operationsResult?.operationsScore?.value ?? request.operationsResult?.healthScore?.value, 70);

  const areaScores = { ...base.areaScores };
  areaScores.collective_reasoning = clamp((institutionalMemory + decision + knowledge) / 3);
  areaScores.consensus_analysis = clamp((cultural + stakeholder + decision) / 3);
  areaScores.distributed_expertise = clamp((humanCapital + knowledge + institutionalMemory) / 3);
  areaScores.collaborative_intelligence = clamp((behavioral + cultural + stakeholder) / 3);
  areaScores.multi_domain_synthesis = clamp((systems + knowledge + opportunity) / 3);
  areaScores.cross_functional_intelligence = clamp((operations + systems + humanCapital) / 3);
  areaScores.organizational_alignment = clamp((cultural + decision + stakeholder) / 3);
  areaScores.team_decision_intelligence = clamp((decision + behavioral + cultural) / 3);
  areaScores.expert_weighting = clamp((humanCapital + knowledge + decision) / 3);
  areaScores.perspective_diversity = clamp((cultural + stakeholder + behavioral) / 3);
  areaScores.conflict_resolution = clamp((cultural + stakeholder + ethical) / 3);
  areaScores.collaborative_learning = clamp((knowledge + institutionalMemory + opportunity) / 3);
  areaScores.organizational_coordination = clamp((operations + systems + cultural) / 3);
  areaScores.shared_decision_quality = clamp((decision + predictive + cultural) / 3);
  areaScores.collective_opportunity_detection = clamp((opportunity + market + competitive) / 3);
  areaScores.collective_risk_assessment = clamp((systems + resilience + ethical) / 3);
  areaScores.collective_intelligence_evolution = clamp((institutionalMemory + predictive + opportunity) / 3);

  const consensusStrength = clamp(areaScores.consensus_analysis);
  const expertiseCoverage = clamp(areaScores.distributed_expertise);
  const perspectiveDiversity = clamp(areaScores.perspective_diversity);
  const crossDomainAgreement = clamp(areaScores.multi_domain_synthesis);
  const organizationalAlignment = clamp(areaScores.organizational_alignment);
  const collaborationQuality = clamp(areaScores.collaborative_intelligence);
  const collectiveConfidence = clamp((consensusStrength + expertiseCoverage + organizationalAlignment) / 3);
  const longTermCollectiveValue = clamp((areaScores.collective_intelligence_evolution + predictive + opportunity) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    consensusStrength,
    expertiseCoverage,
    perspectiveDiversity,
    crossDomainAgreement,
    organizationalAlignment,
    collaborationQuality,
    collectiveConfidence,
    longTermCollectiveValue,
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.collective_risk_assessment) / 2),
    evidenceCoverage: clamp((institutionalMemory + knowledge + ecosystem + resilience + systems + stakeholder + cultural + ethical) / 8),
    ...request.baselineOverrides,
  };
}

export const collectiveModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyCollectiveScope,
  defaultCollectiveBaseline, deriveCollectiveBaseline,
};
export class CollectiveModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveCollectiveBaseline;
  static baseline = defaultCollectiveBaseline; static outlook = outlookFromScore;
}
`);

w("collective-forecast-engine.ts", `import type { CollectiveForecastEngineContract } from "${PKG}/contracts";
import { buildLens, clamp, outlookFromScore } from "${PKG}/models";
import { COLLECTIVE_AREAS, type CollectiveForecastSuite } from "${PKG}/types";

export class CollectiveForecastEngine implements CollectiveForecastEngineContract {
  assess(input: Parameters<CollectiveForecastEngineContract["assess"]>[0]): CollectiveForecastSuite {
    const forecasts = COLLECTIVE_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("col-forecast"),
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
      narrative: \`Collective intelligence forecast maturity \${Math.round(maturityScore)}.\`,
    };
  }
}
`);

w("collective-trend-engine.ts", `import type { CollectiveTrendEngineContract } from "${PKG}/contracts";
import { buildLens, clamp } from "${PKG}/models";
import { COLLECTIVE_AREAS, type CollectiveTrendSuite } from "${PKG}/types";

export class CollectiveTrendEngine implements CollectiveTrendEngineContract {
  assess(input: Parameters<CollectiveTrendEngineContract["assess"]>[0]): CollectiveTrendSuite {
    const trends = COLLECTIVE_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("col-trend"),
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
      narrative: \`Collective trends: \${trends.filter(t => t.direction === "improving").length} improving, \${trends.filter(t => t.direction === "worsening").length} worsening.\`,
    };
  }
}
`);

w("collective-scenario-engine.ts", `import type { CollectiveScenarioEngineContract } from "${PKG}/contracts";
import { buildLens, clamp, priorityFromScore } from "${PKG}/models";
import { COLLECTIVE_SCENARIOS, type CollectiveScenarioSuite } from "${PKG}/types";

export class CollectiveScenarioEngine implements CollectiveScenarioEngineContract {
  assess(input: Parameters<CollectiveScenarioEngineContract["assess"]>[0]): CollectiveScenarioSuite {
    const scenarios = COLLECTIVE_SCENARIOS.map((kind, index) => {
      const pressure = clamp(100 - input.baseline.collectiveConfidence);
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("col-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        consensusImpact: clamp(input.baseline.consensusStrength - index * 2),
        expertiseImpact: clamp(input.baseline.expertiseCoverage - index * 2),
        monitors: [\`monitor:\${kind}\`, "monitor:collective-intelligence"],
        lenses: buildLens({
          consensusStrength: \`Scenario consensus strength for \${kind}.\`,
          expertiseCoverage: \`Scenario expertise coverage for \${kind}.\`,
          perspectiveDiversity: \`Scenario perspective diversity for \${kind}.\`,
          crossDomainAgreement: \`Scenario cross-domain agreement for \${kind}.\`,
          organizationalAlignment: \`Scenario organizational alignment for \${kind}.\`,
          collaborationQuality: \`Scenario collaboration quality for \${kind}.\`,
          collectiveConfidence: \`Scenario collective confidence for \${kind}.\`,
          longTermCollectiveValue: \`Long-term collective value under \${kind}.\`,
        }),
        narrative: \`\${kind} probability \${Math.round(probability * 100)}% with impact \${Math.round(organizationalImpact)}.\`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: \`Primary collective scenario \${primary.kind.replaceAll("_", " ")}.\`,
    };
  }
}
`);

w("collective-analysis-engine.ts", `import type { CollectiveAnalysisEngineContract } from "${PKG}/contracts";
import { buildLens, clamp } from "${PKG}/models";
import { COLLECTIVE_ANALYSIS_KINDS, type CollectiveAnalysisSuite } from "${PKG}/types";

/** Primary analysis engine. */
export class CollectiveAnalysisEngine implements CollectiveAnalysisEngineContract {
  assess(input: Parameters<CollectiveAnalysisEngineContract["assess"]>[0]): CollectiveAnalysisSuite {
    const scoreFor = (kind: (typeof COLLECTIVE_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "consensus_strength": return clamp(input.baseline.consensusStrength);
        case "expertise_coverage": return clamp(input.baseline.expertiseCoverage);
        case "perspective_diversity": return clamp(input.baseline.perspectiveDiversity);
        case "cross_domain_agreement": return clamp(input.baseline.crossDomainAgreement);
        case "organizational_alignment": return clamp(input.baseline.organizationalAlignment);
        case "collaboration_quality": return clamp(input.baseline.collaborationQuality);
        case "collective_confidence": return clamp(input.baseline.collectiveConfidence);
        case "long_term_collective_value": return clamp(input.baseline.longTermCollectiveValue);
        case "early_warning": return clamp(input.baseline.longTermCollectiveValue);
        default: return 65;
      }
    };
    const analyses = COLLECTIVE_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("col-analysis"),
        kind,
        title: \`\${kind.replaceAll("_", " ")} analysis\`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          consensusStrength: \`Consensus strength through \${kind}.\`,
          expertiseCoverage: \`Expertise coverage reading for \${kind}.\`,
          perspectiveDiversity: \`Perspective diversity in \${kind}.\`,
          crossDomainAgreement: \`Cross-domain agreement for \${kind}.\`,
          organizationalAlignment: \`Organizational alignment of \${kind}.\`,
          collaborationQuality: \`Collaboration quality for \${kind}.\`,
          collectiveConfidence: \`Collective confidence via \${kind}.\`,
          longTermCollectiveValue: \`Long-term collective value via \${kind}.\`,
        }),
        narrative: \`\${kind} analysis scored \${Math.round(score)}.\`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...COLLECTIVE_ANALYSIS_KINDS],
      maturityScore,
      narrative: \`Collective analysis maturity \${Math.round(maturityScore)} across \${analyses.length} kinds.\`,
    };
  }
}
`);

w("consensus-engine.ts", `import type { ConsensusEngineContract } from "${PKG}/contracts";
import type { ConsensusSuite } from "${PKG}/types";

export class ConsensusEngine implements ConsensusEngineContract {
  assess(input: Parameters<ConsensusEngineContract["assess"]>[0]): ConsensusSuite {
    const suite = input.areas.consensus_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("col-consensus"),
      title: record.title,
      strength: record.score,
      lenses: record.lenses,
      narrative: \`Consensus: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      consensusIndex: input.baseline.consensusStrength,
      narrative: \`Consensus suite index \${Math.round(input.baseline.consensusStrength)}.\`,
    };
  }
}
`);

w("distributed-expertise-engine.ts", `import type { DistributedExpertiseEngineContract } from "${PKG}/contracts";
import type { DistributedExpertiseSuite } from "${PKG}/types";

export class DistributedExpertiseEngine implements DistributedExpertiseEngineContract {
  assess(input: Parameters<DistributedExpertiseEngineContract["assess"]>[0]): DistributedExpertiseSuite {
    const suite = input.areas.distributed_expertise;
    const records = suite.records.map(record => ({
      id: input.createId("col-expertise"),
      title: record.title,
      coverage: record.score,
      lenses: record.lenses,
      narrative: \`Distributed expertise: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      expertiseIndex: input.baseline.expertiseCoverage,
      narrative: \`Distributed expertise suite index \${Math.round(input.baseline.expertiseCoverage)}.\`,
    };
  }
}
`);

w("cross-domain-synthesis-engine.ts", `import type { CrossDomainSynthesisEngineContract } from "${PKG}/contracts";
import type { CrossDomainSynthesisSuite } from "${PKG}/types";

export class CrossDomainSynthesisEngine implements CrossDomainSynthesisEngineContract {
  assess(input: Parameters<CrossDomainSynthesisEngineContract["assess"]>[0]): CrossDomainSynthesisSuite {
    const suite = input.areas.multi_domain_synthesis;
    const records = suite.records.map(record => ({
      id: input.createId("col-synthesis"),
      title: record.title,
      synthesisIndex: record.score,
      lenses: record.lenses,
      narrative: \`Cross-domain synthesis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      synthesisIndex: input.baseline.crossDomainAgreement,
      narrative: \`Cross-domain synthesis suite index \${Math.round(input.baseline.crossDomainAgreement)}.\`,
    };
  }
}
`);

w("collaboration-engine.ts", `import type { CollaborationEngineContract } from "${PKG}/contracts";
import type { CollaborationSuite } from "${PKG}/types";

export class CollaborationEngine implements CollaborationEngineContract {
  assess(input: Parameters<CollaborationEngineContract["assess"]>[0]): CollaborationSuite {
    const suite = input.areas.collaborative_intelligence;
    const records = suite.records.map(record => ({
      id: input.createId("col-collab"),
      title: record.title,
      collaborationIndex: record.score,
      lenses: record.lenses,
      narrative: \`Collaboration: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      collaborationIndex: input.baseline.collaborationQuality,
      narrative: \`Collaboration suite index \${Math.round(input.baseline.collaborationQuality)}.\`,
    };
  }
}
`);

w("conflict-resolution-engine.ts", `import type { ConflictResolutionEngineContract } from "${PKG}/contracts";
import type { ConflictResolutionSuite } from "${PKG}/types";

export class ConflictResolutionEngine implements ConflictResolutionEngineContract {
  assess(input: Parameters<ConflictResolutionEngineContract["assess"]>[0]): ConflictResolutionSuite {
    const suite = input.areas.conflict_resolution;
    const records = suite.records.map(record => ({
      id: input.createId("col-conflict"),
      title: record.title,
      resolutionIndex: record.score,
      lenses: record.lenses,
      narrative: \`Conflict resolution: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      resolutionIndex: input.baseline.collaborationQuality,
      narrative: \`Conflict resolution suite index \${Math.round(input.baseline.collaborationQuality)}.\`,
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
        id: input.createId("col-alert"),
        title: \`Trend alert: \${t.area}\`,
        severity: priorityFromScore(100 - t.magnitude),
        source: "trends",
        score: clamp(100 - t.magnitude),
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...hot.map(s => ({
        id: input.createId("col-alert"),
        title: \`Scenario alert: \${s.kind}\`,
        severity: s.severity,
        source: "scenarios",
        score: clamp(100 - s.organizationalImpact),
        lenses: s.lenses,
        narrative: s.narrative,
      })),
    ];
    const score = clamp(alerts.length ? alerts.reduce((s, a) => s + a.score, 0) / alerts.length : input.baseline.longTermCollectiveValue);
    return {
      alerts,
      score,
      alertCount: alerts.length,
      narrative: \`Collective intelligence early warning suite with \${alerts.length} alerts.\`,
    };
  }
}
`);

w("knowledge-contribution.ts", `import type { CollectiveForecastSuite, CollectiveKnowledgeContribution, CollectiveScenarioSuite } from "${PKG}/types";

/**
 * Collective intelligence knowledge contribution drafts for redistribution
 * via closed learning to institutional-memory and peer domains.
 */
export class CollectiveKnowledgeContributionEngine {
  contribute(input: {
    forecasts: CollectiveForecastSuite;
    scenarios: CollectiveScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): CollectiveKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("col-knowledge"),
        type: "collective_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("col-knowledge"),
        type: "collective_scenario",
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
      narrative: \`\${artifacts.length} collective intelligence learning drafts prepared for redistribution across institutional-memory and peer domains.\`,
    };
  }
}
`);

w("closed-learning-loop.ts", `import type {
  ClosedLearningLoopContribution,
  CollectiveRecommendationRecord,
  CollectiveScenarioSuite,
  CollectiveTrendSuite,
} from "${PKG}/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: CollectiveTrendSuite;
    scenarios: CollectiveScenarioSuite;
    recommendations: CollectiveRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("col-learning"),
      destinations: ["institutional-memory", "knowledge", "executive-decision", "opportunity", "predictive", "stakeholder", "organizational-improvement"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => \`\${t.area}:\${t.direction}\`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => \`\${s.kind}:\${Math.round(s.probability * 100)}\`),
      contributedAt: input.now.toISOString(),
      narrative: "Collaborative synthesis layer that aggregates multi-domain recommendations and redistributes synthesized learning.",
    };
  }
}
`);

w("collective-reasoner.ts", `import type { CollectiveReasonerContract } from "${PKG}/contracts";
import type { CollectiveReasoningResult } from "${PKG}/types";

export class CollectiveReasoner implements CollectiveReasonerContract {
  reason(input: Parameters<CollectiveReasonerContract["reason"]>[0]): CollectiveReasoningResult {
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
        \`Collective intelligence outlook is \${input.forecasts.outlook} with primary scenario \${input.scenarios.primaryScenario.replaceAll("_", " ")}.\`,
      connectedForces,
      evidenceGaps,
      confidence: input.confidence,
      narrative: \`Reasoning used \${input.trends.trends.length} trends, \${input.forecasts.forecasts.length} forecasts, and \${input.scenarios.scenarios.length} scenarios.\`,
    };
  }
}
`);

console.log("Part 2: contracts, models, engines done.");
