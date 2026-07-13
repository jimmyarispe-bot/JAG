/**
 * Part 3: composers, engine, service, index, docs for Ecosystem Intelligence.
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/ecosystem");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");

const AREAS = [
  ["ecosystem_mapping", "EcosystemMappingIntelligence"],
  ["strategic_partnerships", "StrategicPartnershipsIntelligence"],
  ["supplier_ecosystems", "SupplierEcosystemsIntelligence"],
  ["customer_ecosystems", "CustomerEcosystemsIntelligence"],
  ["community_networks", "CommunityNetworksIntelligence"],
  ["industry_networks", "IndustryNetworksIntelligence"],
  ["technology_ecosystems", "TechnologyEcosystemsIntelligence"],
  ["academic_research_partnerships", "AcademicResearchPartnershipsIntelligence"],
  ["government_ecosystems", "GovernmentEcosystemsIntelligence"],
  ["investor_funding_networks", "InvestorFundingNetworksIntelligence"],
  ["nonprofit_ngo_relationships", "NonprofitNgoRelationshipsIntelligence"],
  ["platform_ecosystems", "PlatformEcosystemsIntelligence"],
  ["alliance_intelligence", "AllianceIntelligence"],
  ["network_effects", "NetworkEffectsIntelligence"],
  ["ecosystem_dependencies", "EcosystemDependenciesIntelligence"],
  ["collaboration_opportunities", "CollaborationOpportunitiesIntelligence"],
  ["ecosystem_risk", "EcosystemRiskIntelligence"],
];
const AREA_KEYS = AREAS.map(([a]) => a);
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const areaFile = (area) =>
  area === "alliance_intelligence" ? "alliance-intelligence" : area.replaceAll("_", "-") + "-intelligence";

w("ecosystem-intelligence.ts", `import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/ecosystem/models";
import type {
  EcosystemArea, EcosystemAreaSuite, EcosystemBaseline, EcosystemDashboard,
  EcosystemForecastSuite, EcosystemHealthScore, EcosystemOpportunityRecord,
  EcosystemRecommendationRecord, EcosystemRiskRecord, EcosystemScenarioSuite,
  EcosystemScore, EcosystemAnalysisSuite,
} from "@/lib/platform/intelligence/ecosystem/types";
import { ECOSYSTEM_AREAS } from "@/lib/platform/intelligence/ecosystem/types";

export const score = (key: string, label: string, value: number): EcosystemScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: \`\${label} is \${statusFromScore(v)} at \${Math.round(v)}.\` };
};

const lens = (area: string, value: number) => buildLens({
  networkStrength: \`\${area} network strength scored \${Math.round(value)}.\`,
  strategicPartnerships: \`Strategic partnerships linked to \${area}.\`,
  ecosystemHealth: \`Ecosystem health around \${area}.\`,
  collaborationPotential: \`Collaboration potential relative to \${area} conditions.\`,
  dependencyRisk: \`Dependency risk reading for \${area}.\`,
  networkEffects: \`Network effects implications of \${area}.\`,
  strategicPosition: \`Strategic position pressure from \${area}.\`,
  longTermEcosystemOutlook: \`Timing window for \${area}-linked ecosystem action.\`,
});

export class EcosystemIntelligence {
  composeScores(input: {
    baseline: EcosystemBaseline;
    areas: Record<EcosystemArea, EcosystemAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    networkMapping: number;
    partnership: number;
    dependency: number;
    collaboration: number;
    networkEffect: number;
  }) {
    const areaScores = Object.fromEntries(
      ECOSYSTEM_AREAS.map(a => [a, score(\`ecosystem_\${a}\`, \`\${a} Ecosystem Score\`, input.areas[a].score)])
    ) as Record<EcosystemArea, EcosystemScore>;
    const overall =
      ECOSYSTEM_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / ECOSYSTEM_AREAS.length * .5 +
      input.baseline.networkStrength * .1 +
      input.baseline.strategicPartnerships * .1 +
      input.baseline.ecosystemHealth * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.networkMapping * .03;
    return {
      healthScore: score("ecosystem_health", "Ecosystem Health Score", overall),
      areaScores,
      forecastScore: score("ecosystem_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("ecosystem_scenario", "Scenario Score", input.scenario),
      analysisScore: score("ecosystem_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("ecosystem_early_warning", "Early Warning Score", input.earlyWarning),
      networkMappingScore: score("ecosystem_network_mapping", "Network Mapping Score", input.networkMapping),
      partnershipScore: score("ecosystem_partnership", "Partnership Score", input.partnership),
      dependencyScore: score("ecosystem_dependency", "Dependency Score", input.dependency),
      collaborationScore: score("ecosystem_collaboration", "Collaboration Score", input.collaboration),
      networkEffectScore: score("ecosystem_network_effect", "Network Effect Score", input.networkEffect),
    };
  }
}

export class EcosystemRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<EcosystemArea, EcosystemAreaSuite>,
    analysis: EcosystemAnalysisSuite,
    scenarios: EcosystemScenarioSuite,
    now: Date,
  ): EcosystemRecommendationRecord[] {
    return [...ECOSYSTEM_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("esm-rec"),
        title: \`Address \${area.replaceAll("_", " ")} ecosystem exposure\`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "ecosystem-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: \`Run an ecosystem response cycle for \${area.replaceAll("_", " ")}.\`,
        lenses: lens(area, areas[area].score),
        narrative: \`Prioritize \${area} ecosystem response.\`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<EcosystemArea, EcosystemAreaSuite>,
  createId: (prefix: string) => string,
): { risks: EcosystemRiskRecord[]; opportunities: EcosystemOpportunityRecord[] } {
  const ordered = [...ECOSYSTEM_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("esm-risk"),
      title: \`\${a.replaceAll("_", " ")} ecosystem pressure\`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: \`Strengthen monitoring and ecosystem playbooks for \${a.replaceAll("_", " ")}.\`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("esm-opp"),
      title: \`Capture \${a.replaceAll("_", " ")} ecosystem advantage\`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<EcosystemIntelligence["composeScores"]>,
  baseline: EcosystemBaseline,
  forecasts: EcosystemForecastSuite,
): EcosystemHealthScore {
  const areaScores = Object.fromEntries(ECOSYSTEM_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<EcosystemArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    partnershipScore: scores.partnershipScore.value,
    dependencyScore: scores.dependencyScore.value,
    networkEffectScore: scores.networkEffectScore.value,
    collaborationScore: scores.collaborationScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: EcosystemHealthScore,
  baseline: EcosystemBaseline,
  risks: EcosystemRiskRecord[],
  opportunities: EcosystemOpportunityRecord[],
): EcosystemDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: \`Executive Ecosystem Overview: health \${Math.round(health.overallScore)}  -  \${health.status} (\${health.outlook})\`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    networkStrength: baseline.networkStrength,
    strategicPartnerships: baseline.strategicPartnerships,
    ecosystemHealth: baseline.ecosystemHealth,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeEcosystemHealth(
  scores: ReturnType<EcosystemIntelligence["composeScores"]>,
  baseline: EcosystemBaseline,
  forecasts: EcosystemForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const ecosystemLens = lens;
`);

const areaImports = AREAS.map(([area, cls]) =>
  `import { ${cls} } from "@/lib/platform/intelligence/ecosystem/${areaFile(area)}";`
).join("\n");
const areaInit = AREAS.map(([area, cls]) => `      ${area}: new ${cls}(),`).join("\n");
const areaScoreAssign = AREA_KEYS.map(a =>
  `      ${snakeToCamel(a)}Score: scores.areaScores.${a},`
).join("\n");

w("ecosystem-engine.ts", `import type { EcosystemDependencies, EcosystemEngine as Contract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveEcosystemBaseline, emptyEcosystemScope, buildConfidence } from "@/lib/platform/intelligence/ecosystem/models";
import { ECOSYSTEM_AREAS, ECOSYSTEM_INTELLIGENCE_VERSION, type EcosystemArea, type EcosystemAreaSuite, type EcosystemRequest, type EcosystemResult } from "@/lib/platform/intelligence/ecosystem/types";
${areaImports}
import { EcosystemForecastEngine } from "@/lib/platform/intelligence/ecosystem/ecosystem-forecast-engine";
import { EcosystemScenarioEngine } from "@/lib/platform/intelligence/ecosystem/ecosystem-scenario-engine";
import { EcosystemTrendEngine } from "@/lib/platform/intelligence/ecosystem/ecosystem-trend-engine";
import { EcosystemAnalysisEngine } from "@/lib/platform/intelligence/ecosystem/ecosystem-analysis-engine";
import { NetworkMappingEngine } from "@/lib/platform/intelligence/ecosystem/network-mapping-engine";
import { PartnershipEngine } from "@/lib/platform/intelligence/ecosystem/partnership-engine";
import { DependencyEngine } from "@/lib/platform/intelligence/ecosystem/dependency-engine";
import { CollaborationEngine } from "@/lib/platform/intelligence/ecosystem/collaboration-engine";
import { NetworkEffectEngine } from "@/lib/platform/intelligence/ecosystem/network-effect-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/ecosystem/early-warning-engine";
import { EcosystemKnowledgeContributionEngine } from "@/lib/platform/intelligence/ecosystem/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/ecosystem/closed-learning-loop";
import { EcosystemReasoner } from "@/lib/platform/intelligence/ecosystem/ecosystem-reasoner";
import {
  EcosystemIntelligence, EcosystemRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, ecosystemLens,
} from "@/lib/platform/intelligence/ecosystem/ecosystem-intelligence";
import { EcosystemProjection } from "@/lib/platform/intelligence/ecosystem/projection";
import { EcosystemRepositoryStore } from "@/lib/platform/intelligence/ecosystem/repository";
import { EcosystemRegistryStore } from "@/lib/platform/intelligence/ecosystem/ecosystem-registry";
import { EcosystemQueries } from "@/lib/platform/intelligence/ecosystem/projection";

export class EcosystemIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private networkMapping; private partnership; private dependency; private collaboration; private networkEffect; private earlyWarning; private reasoner;

  constructor(d: EcosystemDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new EcosystemRepositoryStore();
    this.registry = d.registry ?? new EcosystemRegistryStore();
    this.queries = new EcosystemQueries();
    this.areas = {
${areaInit}
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new EcosystemForecastEngine();
    this.scenarios = d.scenarioEngine ?? new EcosystemScenarioEngine();
    this.trends = d.trendEngine ?? new EcosystemTrendEngine();
    this.analysis = d.analysisEngine ?? new EcosystemAnalysisEngine();
    this.networkMapping = d.networkMappingEngine ?? new NetworkMappingEngine();
    this.partnership = d.partnershipEngine ?? new PartnershipEngine();
    this.dependency = d.dependencyEngine ?? new DependencyEngine();
    this.collaboration = d.collaborationEngine ?? new CollaborationEngine();
    this.networkEffect = d.networkEffectEngine ?? new NetworkEffectEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new EcosystemReasoner();
  }

  build(request: EcosystemRequest): EcosystemResult {
    const now = this.now();
    const baseline = deriveEcosystemBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyEcosystemScope();
    const areaSuites = Object.fromEntries(
      ECOSYSTEM_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<EcosystemArea, EcosystemAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const networkMappingSuite = this.networkMapping.assess({ baseline, areas: areaSuites, now, createId });
    const partnershipSuite = this.partnership.assess({ baseline, areas: areaSuites, now, createId });
    const dependencySuite = this.dependency.assess({ baseline, areas: areaSuites, now, createId });
    const collaborationSuite = this.collaboration.assess({ baseline, areas: areaSuites, now, createId });
    const networkEffectSuite = this.networkEffect.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new EcosystemKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new EcosystemIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      networkMapping: networkMappingSuite.score,
      partnership: partnershipSuite.score,
      dependency: dependencySuite.score,
      collaboration: collaborationSuite.score,
      networkEffect: networkEffectSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new EcosystemRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = ecosystemLens("organization", health.overallScore);

    const ecosystemMapDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Ecosystem map index \${Math.round(networkMappingSuite.mappingIndex)}\`,
      score: networkMappingSuite.score,
      mappingIndex: networkMappingSuite.mappingIndex,
      signals: networkMappingSuite.records.slice(0, 4).map(r => r.title),
      narrative: networkMappingSuite.narrative,
    };
    const strategicPartnershipsDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Strategic partnerships index \${Math.round(partnershipSuite.partnershipIndex)}\`,
      score: partnershipSuite.score,
      partnershipIndex: partnershipSuite.partnershipIndex,
      signals: partnershipSuite.records.map(r => r.narrative),
      narrative: partnershipSuite.narrative,
    };
    const alliancesDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Alliances \${Math.round(areaSuites.alliance_intelligence.score)}\`,
      score: areaSuites.alliance_intelligence.score,
      allianceIndex: areaSuites.alliance_intelligence.score,
      signals: areaSuites.alliance_intelligence.records.map(r => r.signal),
      narrative: areaSuites.alliance_intelligence.narrative,
    };
    const dependenciesDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Dependencies index \${Math.round(dependencySuite.dependencyIndex)}\`,
      score: dependencySuite.score,
      dependencyIndex: dependencySuite.dependencyIndex,
      signals: dependencySuite.records.map(r => r.narrative),
      narrative: dependencySuite.narrative,
    };
    const collaborationOpportunitiesDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Collaboration opportunities \${Math.round(collaborationSuite.collaborationIndex)}\`,
      score: collaborationSuite.score,
      collaborationIndex: collaborationSuite.collaborationIndex,
      signals: collaborationSuite.records.map(r => r.narrative),
      narrative: collaborationSuite.narrative,
    };
    const ecosystemHealthDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Ecosystem health \${Math.round(baseline.ecosystemHealth)}\`,
      score: baseline.ecosystemHealth,
      healthIndex: baseline.ecosystemHealth,
      signals: [...areaSuites.ecosystem_mapping.records, ...areaSuites.ecosystem_risk.records].slice(0, 4).map(r => r.signal),
      narrative: \`Ecosystem health \${Math.round(baseline.ecosystemHealth)}; risk \${Math.round(areaSuites.ecosystem_risk.score)}.\`,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Ecosystem Forecast: \${forecastSuite.outlook}\`,
      score: forecastSuite.maturityScore,
      outlook: forecastSuite.outlook,
      signals: forecastSuite.forecasts.slice(0, 4).map(f => f.narrative),
      narrative: forecastSuite.narrative,
    };
    const brief = {
      generatedAt: now.toISOString(),
      headline: dashboard.headline,
      summary: \`\${forecastSuite.narrative} \${scenarioSuite.narrative}\`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      topRecommendations: recommendations.map(r => r.title),
      topRisks: risks.map(r => r.title),
      lenses: commonLens,
      narrative: dashboard.narrative,
    };
    const boardReport = {
      generatedAt: now.toISOString(),
      headline: \`Board Report: \${dashboard.headline}\`,
      assuranceSummary: \`Evidence coverage \${Math.round(baseline.evidenceCoverage)}; primary scenario \${scenarioSuite.primaryScenario.replaceAll("_", " ")}.\`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      partnershipScore: partnershipSuite.score,
      dependencyScore: dependencySuite.score,
      networkEffectScore: networkEffectSuite.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on partnerships, dependencies, network effects, and long-term ecosystem position.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new EcosystemProjection().project({
      generatedAt: now.toISOString(),
      headline: brief.headline,
      healthScore: health.overallScore,
      areaScores: health.areaScores,
      outlook: forecastSuite.outlook,
      dashboard,
      brief,
      overallConfidence: confidence,
    });
    const historyRecord = {
      id: createId("esm-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: EcosystemResult = {
      requestId: request.requestId,
      version: ECOSYSTEM_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
${areaScoreAssign}
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      networkMappingScore: scores.networkMappingScore,
      partnershipScore: scores.partnershipScore,
      dependencyScore: scores.dependencyScore,
      collaborationScore: scores.collaborationScore,
      networkEffectScore: scores.networkEffectScore,
      health,
      dashboard,
      ecosystemMapDashboard,
      strategicPartnershipsDashboard,
      alliancesDashboard,
      dependenciesDashboard,
      collaborationOpportunitiesDashboard,
      ecosystemHealthDashboard,
      forecastDashboard,
      brief,
      boardReport,
      recommendations,
      risks,
      opportunities,
      areaSuites,
      trendSuite,
      forecastSuite,
      scenarioSuite,
      analysisSuite,
      networkMappingSuite,
      partnershipSuite,
      dependencySuite,
      collaborationSuite,
      networkEffectSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("ecosystem", "ecosystem_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  EcosystemIntelligenceEngineImpl as EcosystemIntelligenceEngine,
  EcosystemIntelligenceEngineImpl as EcosystemEngine,
  EcosystemIntelligenceEngineImpl as EcosystemEngineImpl,
};
`);

w("projection.ts", `import { buildConfidence, outlookFromScore } from "@/lib/platform/intelligence/ecosystem/models";
import type { EcosystemProjectionResult, EcosystemQueryRequest, EcosystemQueryResult, EcosystemResult } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemProjection {
  project(input: Omit<EcosystemProjectionResult, "forecast">): EcosystemProjectionResult {
    const outlookBoost = input.outlook === "expanding" ? 6 : input.outlook === "fragmented" ? -4 : input.outlook === "stable" ? 2 : 0;
    return { ...input, forecast: Math.min(100, input.healthScore + outlookBoost) };
  }
}

export class EcosystemQueries {
  ask(result: EcosystemResult, request: EcosystemQueryRequest): EcosystemQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer = result.brief.headline;
    let references: string[] = result.recommendations.slice(0, max).map(r => r.title);
    if (focus === "trends") { answer = result.trendSuite.narrative; references = result.trendSuite.trends.slice(0, max).map(t => t.title); }
    else if (focus === "forecasts") { answer = result.forecastSuite.narrative; references = result.forecastSuite.forecasts.slice(0, max).map(f => f.narrative); }
    else if (focus === "scenarios") { answer = result.scenarioSuite.narrative; references = result.scenarioSuite.scenarios.slice(0, max).map(s => s.title); }
    else if (focus === "analysis") { answer = result.analysisSuite.narrative; references = result.analysisSuite.analyses.slice(0, max).map(a => a.title); }
    else if (focus === "reasoning") { answer = result.reasoning.answer; references = result.reasoning.connectedForces.slice(0, max); }
    else if (focus === "learning") { answer = result.closedLearningLoop.narrative; references = result.closedLearningLoop.lessons.slice(0, max); }
    else if (focus === "early_warning") { answer = result.earlyWarningSuite.narrative; references = result.earlyWarningSuite.alerts.slice(0, max).map(a => a.title); }
    else if (focus === "recommendations") { answer = \`\${result.recommendations.length} ecosystem recommendations.\`; }
    else if (focus in result.areaSuites) {
      const suite = result.areaSuites[focus as keyof typeof result.areaSuites];
      answer = suite.narrative;
      references = suite.records.slice(0, max).map(r => r.title);
    }
    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        { key: "result", label: "Result confidence", contribution: result.confidence.value },
        { key: "focus", label: "Focus specificity", contribution: focus === "general" ? .6 : .85 },
      ]),
    };
  }
}

void outlookFromScore;
`);

w("repository.ts", `import type { EcosystemRepository } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { EcosystemHistoryRecord, EcosystemResult, GraphScope } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemRepositoryStore implements EcosystemRepository {
  private results = new Map<string, EcosystemResult>();
  private history: EcosystemHistoryRecord[] = [];

  save(result: EcosystemResult): EcosystemResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): EcosystemResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): EcosystemResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter(r =>
      (scope.organizationId == null || r.scope.organizationId === scope.organizationId) &&
      (scope.schoolId == null || r.scope.schoolId === scope.schoolId)
    );
  }
  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }
  saveHistory(record: EcosystemHistoryRecord): EcosystemHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): EcosystemHistoryRecord[] {
    if (!scope) return [...this.history];
    return this.history.filter(r =>
      (scope.organizationId == null || r.scope.organizationId === scope.organizationId) &&
      (scope.schoolId == null || r.scope.schoolId === scope.schoolId)
    );
  }
  clear(): void {
    this.results.clear();
    this.history = [];
  }
}
`);

w("ecosystem-registry.ts", `import type { EcosystemRegistry } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { EcosystemPublisher } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemRegistryStore implements EcosystemRegistry {
  private publishers: EcosystemPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): EcosystemPublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
`);

w("service.ts", `import type { EcosystemDependencies, EcosystemIntelligenceService as Contract, EcosystemRepository as Repository } from "@/lib/platform/intelligence/ecosystem/contracts";
import { EcosystemIntelligenceEngineImpl } from "@/lib/platform/intelligence/ecosystem/ecosystem-engine";
import type { EcosystemQueryRequest, EcosystemQueryResult, EcosystemRequest, EcosystemResult } from "@/lib/platform/intelligence/ecosystem/types";

export interface EcosystemServiceDependencies extends EcosystemDependencies {}

export class EcosystemIntelligenceServiceImpl implements Contract {
  private engine: EcosystemIntelligenceEngineImpl;
  constructor(d: EcosystemServiceDependencies = {}) {
    this.engine = (d.engine as EcosystemIntelligenceEngineImpl | undefined) ?? new EcosystemIntelligenceEngineImpl(d);
  }
  build(request: EcosystemRequest): EcosystemResult { return this.engine.build(request); }
  query(result: EcosystemResult, request: EcosystemQueryRequest): EcosystemQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  EcosystemIntelligenceServiceImpl as EcosystemIntelligenceService,
  EcosystemIntelligenceServiceImpl as EcosystemService,
  EcosystemIntelligenceServiceImpl as EcosystemServiceImpl,
};
`);

const areaExports = AREA_KEYS.map(a =>
  `export * from "@/lib/platform/intelligence/ecosystem/${areaFile(a)}";`
).join("\n");

w("index.ts", `export * from "@/lib/platform/intelligence/ecosystem/types";
export type {
  EcosystemDependencies,
  EcosystemAreaIntelligence as EcosystemAreaIntelligenceContract,
  EcosystemForecastEngineContract,
  EcosystemScenarioEngineContract,
  EcosystemTrendEngineContract,
  EcosystemAnalysisEngineContract,
  NetworkMappingEngineContract,
  PartnershipEngineContract,
  DependencyEngineContract,
  CollaborationEngineContract,
  NetworkEffectEngineContract,
  EarlyWarningEngineContract,
  EcosystemReasonerContract,
  EcosystemRegistry as EcosystemRegistryContract,
  EcosystemRepository as EcosystemRepositoryContract,
  EcosystemEngine as EcosystemEngineContract,
  EcosystemIntelligenceEngine as EcosystemIntelligenceEngineContract,
  EcosystemIntelligenceService as EcosystemIntelligenceServiceContract,
  EcosystemService as EcosystemServiceContract,
} from "@/lib/platform/intelligence/ecosystem/contracts";
export * from "@/lib/platform/intelligence/ecosystem/models";
export * from "@/lib/platform/intelligence/ecosystem/area-factory";
${areaExports}
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-forecast-engine";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-scenario-engine";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-trend-engine";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-analysis-engine";
export * from "@/lib/platform/intelligence/ecosystem/network-mapping-engine";
export * from "@/lib/platform/intelligence/ecosystem/partnership-engine";
export * from "@/lib/platform/intelligence/ecosystem/dependency-engine";
export * from "@/lib/platform/intelligence/ecosystem/collaboration-engine";
export * from "@/lib/platform/intelligence/ecosystem/network-effect-engine";
export * from "@/lib/platform/intelligence/ecosystem/early-warning-engine";
export * from "@/lib/platform/intelligence/ecosystem/knowledge-contribution";
export * from "@/lib/platform/intelligence/ecosystem/closed-learning-loop";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-reasoner";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-intelligence";
export * from "@/lib/platform/intelligence/ecosystem/projection";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-registry";
export * from "@/lib/platform/intelligence/ecosystem/repository";
export * from "@/lib/platform/intelligence/ecosystem/ecosystem-engine";
export * from "@/lib/platform/intelligence/ecosystem/service";

import type { EcosystemDependencies } from "@/lib/platform/intelligence/ecosystem/contracts";
import { EcosystemIntelligenceEngine } from "@/lib/platform/intelligence/ecosystem/ecosystem-engine";
import { EcosystemIntelligenceService } from "@/lib/platform/intelligence/ecosystem/service";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";

export interface EcosystemStack {
  service: EcosystemIntelligenceService;
  engine: EcosystemIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateEcosystemOptions extends EcosystemDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createEcosystemIntelligence(options: CreateEcosystemOptions = {}): EcosystemStack {
  const organizationDna =
    options.organizationDna ??
    (options.wireOrganizationDna === false
      ? null
      : createOrganizationDnaIntelligence({
          ...options.organizationDnaOptions,
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        }));
  const oios =
    options.oios ??
    (options.wireOios === false
      ? null
      : createOiosOperatingSystem({
          ...options.oiosOptions,
          organizationDnaStack: options.oiosOptions?.organizationDnaStack ?? organizationDna ?? undefined,
          wireOrganizationDna: false,
        }));
  const engine = new EcosystemIntelligenceEngine(options);
  const service = new EcosystemIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
`);

w("README.md", `# Ecosystem Intelligence (Sprint 057)

**Version:** 0.1.0 | **Domain key:** \`ecosystem\` | **ID prefix:** \`esm-\`

Seventeen-area organizational ecosystem assessment for JAG. Map partnerships, networks, and dependencies so leadership can strengthen strategic position across the broader institutional landscape - composing onto Resilience (056) without regenerating that package.

## Areas (17)

ecosystem_mapping, strategic_partnerships, supplier_ecosystems, customer_ecosystems, community_networks, industry_networks, technology_ecosystems, academic_research_partnerships, government_ecosystems, investor_funding_networks, nonprofit_ngo_relationships, platform_ecosystems, alliance_intelligence, network_effects, ecosystem_dependencies, collaboration_opportunities, ecosystem_risk

## Entry point

\`\`\`ts
import { createEcosystemIntelligence } from "@/lib/platform/intelligence/ecosystem";

const { service } = createEcosystemIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "esm-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
\`\`\`

## Lens (8 fields)

networkStrength · strategicPartnerships · ecosystemHealth · collaborationPotential · dependencyRisk · networkEffects · strategicPosition · longTermEcosystemOutlook

## Hard DAG

\`["resilience"]\` - terminal platform module after Resilience Intelligence.

## Layer

External/network layer after Resilience - how partnerships, networks, and dependencies shape strategic position.
`);

w("ARCHITECTURE.md", `# Ecosystem Intelligence Architecture

## Placement

- Domain key: \`ecosystem\`
- Pipeline: terminal after \`resilience\`
- Hard DAG: \`["resilience"]\`
- OIOS hard deps: \`["organization-dna", "resilience"]\`
- Soft reads: stakeholder, competitive, market, systems, resilience, opportunity, executive-decision, predictive

## Package layout

Leaf-safe \`types\` / \`contracts\`, \`models\`, area factory + 17 area modules, specialized engines (network-mapping, partnership, dependency, collaboration, network-effect, early-warning), standard forecast/trend/scenario/analysis engines, composers, projection, repository, registry, service, \`createEcosystemIntelligence\`.

## Suites on EcosystemResult

networkMappingSuite, partnershipSuite, dependencySuite, collaborationSuite, networkEffectSuite, earlyWarningSuite, plus trend/forecast/scenario/analysis suites.

## Closed learning

Destinations: stakeholder, competitive, market, systems, resilience, opportunity, predictive.
`);

w("VERIFICATION.md", `# Ecosystem Intelligence Verification

## Commands

\`\`\`
npx tsc --noEmit
npx vitest run tests/unit/intelligence/ecosystem.test.ts tests/unit/intelligence/resilience.test.ts tests/unit/intelligence/systems.test.ts tests/unit/intelligence/infrastructure.test.ts tests/unit/intelligence/oios-core.test.ts
\`\`\`

## Checks

1. Result version is 0.1.0 with all area and engine scores populated.
2. Analysis kinds and scenarios cover ECOSYSTEM_ANALYSIS_KINDS / ECOSYSTEM_SCENARIOS.
3. Recommendations carry the eight-field EcosystemLens; IDs use \`esm-\` prefix.
4. Closed learning destinations match the seven soft-integration domains.
5. Platform module order ends \`systems\`, \`resilience\`, \`ecosystem\`.
`);

w("CHANGELOG.md", `# Ecosystem Intelligence Changelog

## 0.1.0 - Sprint 057

- Initial Ecosystem Intelligence package (17 areas, 10 scenarios, 12 analysis kinds).
- Specialized engines: NetworkMapping, Partnership, Dependency, Collaboration, NetworkEffect, EarlyWarning.
- Soft integrations from stakeholder, competitive, market, systems, resilience, predictive, decision, opportunity.
- Terminal platform module after Resilience Intelligence.
`);

console.log("Part 3 complete. Files:", fs.readdirSync(DEST).length);
