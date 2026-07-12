/**
 * Market Intelligence — scores, health, dashboards, briefs,
 * and risk/opportunity/recommendation analyzers.
 */

import type {
  ExecutiveMarketBriefGenerator as ExecutiveMarketBriefGeneratorContract,
  MarketDashboard as MarketDashboardContract,
  MarketHealth as MarketHealthContract,
  MarketIntelligence as MarketIntelligenceContract,
  MarketOpportunityAnalyzer as MarketOpportunityAnalyzerContract,
  MarketRecommendationComposer as MarketRecommendationComposerContract,
  MarketRiskAnalyzer as MarketRiskAnalyzerContract,
  MarketSpecializedDashboards as MarketSpecializedDashboardsContract,
} from "@/lib/platform/intelligence/market/contracts";
import {
  buildConfidence,
  buildLens,
  clamp,
  defaultCreateId,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/market/models";
import type {
  CompetitiveDashboardResult,
  CompetitiveSuite,
  CustomerDemandSuite,
  DemographicSuite,
  EconomicTrendSuite,
  ExecutiveMarketBrief,
  ExpansionDashboardResult,
  IndustrySuite,
  MarketBaseline,
  MarketConfidenceScore,
  MarketDashboardResult,
  MarketHealthResult,
  MarketOpportunityRecord,
  MarketRecommendationRecord,
  MarketRiskRecord,
  MarketScore,
  MarketSignalKind,
  MarketSignalRecord,
  MarketSignalsSuite,
  MergersAcquisitionsSuite,
  TechnologyTrendSuite,
  TrendDashboardResult,
} from "@/lib/platform/intelligence/market/types";
import { MARKET_SIGNAL_KINDS } from "@/lib/platform/intelligence/market/types";

type ScoreBundle = ReturnType<MarketIntelligenceContract["composeScores"]>;

export function defaultMarketConfidence(input: {
  baseline: MarketBaseline;
  competitive: { positionScore: number };
  marketSize: { sizeIndex: number };
  signals: { densityScore: number };
}): MarketConfidenceScore {
  return buildConfidence([
    { key: "competitive", label: "Competitive position", contribution: input.competitive.positionScore / 100 },
    { key: "market_size", label: "Market size clarity", contribution: input.marketSize.sizeIndex / 100 },
    { key: "signals", label: "Signal density", contribution: input.signals.densityScore / 100 },
    { key: "baseline", label: "Organization health", contribution: input.baseline.organizationHealthScore / 100 },
  ]);
}

export function composeMarketSignals(input: {
  baseline: MarketBaseline;
  industry: IndustrySuite;
  competitive: CompetitiveSuite;
  customerDemand: CustomerDemandSuite;
  demographic: DemographicSuite;
  economicTrend: EconomicTrendSuite;
  technologyTrend: TechnologyTrendSuite;
  mergersAcquisitions: MergersAcquisitionsSuite;
  createId: (prefix: string) => string;
}): MarketSignalsSuite {
  const kindBuilders: Record<MarketSignalKind, () => { title: string; intensity: number; sourceRef: string }> = {
    competitor_launches: () => ({
      title: `${input.competitive.launchSignalCount} competitor launch signals`,
      intensity: clamp(input.competitive.launchSignalCount * 12 + input.competitive.competitivePressure * 0.4),
      sourceRef: input.competitive.competitors[0]?.id ?? "competitive",
    }),
    competitor_pricing: () => ({
      title: `${input.competitive.pricingSignalCount} competitor pricing signals`,
      intensity: clamp(input.competitive.pricingSignalCount * 14 + input.competitive.competitivePressure * 0.35),
      sourceRef: input.competitive.competitors[0]?.id ?? "competitive",
    }),
    industry_reports: () => ({
      title: "Industry attractiveness and consolidation reports",
      intensity: clamp(input.industry.attractivenessScore * 0.6 + input.industry.consolidationPressure * 0.4),
      sourceRef: input.industry.segments[0]?.id ?? "industry",
    }),
    customer_demand_shifts: () => ({
      title: "Customer demand shift pressure",
      intensity: clamp(input.customerDemand.shiftPressure),
      sourceRef: input.customerDemand.signals[0]?.id ?? "demand",
    }),
    population_changes: () => ({
      title: "Population / demographic momentum",
      intensity: clamp(input.demographic.populationMomentum),
      sourceRef: input.demographic.cohorts[0]?.id ?? "demographic",
    }),
    employment_trends: () => ({
      title: "Employment alignment trends",
      intensity: clamp(input.demographic.employmentAlignment),
      sourceRef: input.demographic.cohorts[0]?.id ?? "demographic",
    }),
    economic_indicators: () => ({
      title: "Economic tailwind indicators",
      intensity: clamp(input.economicTrend.tailwindScore),
      sourceRef: input.economicTrend.indicators[0]?.id ?? "economic",
    }),
    regulatory_changes: () => ({
      title: "Regulatory pressure on market access",
      intensity: clamp(input.baseline.legalRegulatoryPressure * 100),
      sourceRef: "legal-compliance-risk",
    }),
    technology_disruption: () => ({
      title: "Technology disruption signals",
      intensity: clamp(input.technologyTrend.disruptionScore),
      sourceRef: input.technologyTrend.trends[0]?.id ?? "technology",
    }),
    emerging_markets: () => ({
      title: "Emerging market / expansion signals",
      intensity: clamp(input.baseline.geographicExpansionReadiness * 0.7 + input.baseline.whiteSpaceScore * 0.3),
      sourceRef: "expansion",
    }),
    industry_consolidation: () => ({
      title: "Industry consolidation / M&A activity",
      intensity: clamp(input.mergersAcquisitions.consolidationPressure),
      sourceRef: input.mergersAcquisitions.targets[0]?.id ?? "ma",
    }),
  };

  const signals: MarketSignalRecord[] = MARKET_SIGNAL_KINDS.map((kind) => {
    const built = kindBuilders[kind]();
    return {
      id: input.createId("mkt-signal"),
      kind,
      title: built.title,
      intensity: built.intensity,
      sourceRef: built.sourceRef,
      narrative: `${kind}: ${built.title} (intensity ${Math.round(built.intensity)}).`,
    };
  });

  const byKind = Object.fromEntries(
    MARKET_SIGNAL_KINDS.map((kind) => {
      const match = signals.find((signal) => signal.kind === kind);
      return [kind, match?.intensity ?? 0];
    })
  ) as Record<MarketSignalKind, number>;

  const hottest = [...signals].sort((a, b) => b.intensity - a.intensity)[0];
  const densityScore = clamp(
    signals.reduce((sum, signal) => sum + signal.intensity, 0) / signals.length
  );

  return {
    signals,
    byKind,
    densityScore,
    hottestKind: hottest?.kind ?? "industry_reports",
    narrative: `Market signal density ${Math.round(densityScore)}; hottest ${hottest?.kind ?? "industry_reports"}.`,
  };
}

export class MarketIntelligence implements MarketIntelligenceContract {
  composeScores(input: Parameters<MarketIntelligenceContract["composeScores"]>[0]): ScoreBundle {
    const industryValue = clamp(input.industry.attractivenessScore);
    const competitiveValue = clamp(input.competitive.positionScore);
    const marketSizeValue = clamp(input.marketSize.sizeIndex);
    const pricingValue = clamp(input.pricing.pricingPower);
    const demandValue = clamp(input.customerDemand.demandScore);
    const demographicValue = clamp(input.demographic.fitScore);
    const geographicValue = clamp(input.geographicExpansion.readinessScore);
    const economicValue = clamp(input.economicTrend.tailwindScore);
    const technologyValue = clamp(input.technologyTrend.opportunityScore);
    const partnershipValue = clamp(input.partnership.densityScore);
    const maValue = clamp(input.mergersAcquisitions.activityScore);
    const whiteSpaceValue = clamp(input.whiteSpace.whiteSpaceScore);
    const knowledgeValue = clamp(input.knowledgeContribution.contributionScore);

    const pressure =
      input.competitive.competitivePressure * 0.35 +
      input.technologyTrend.disruptionScore * 0.25 +
      input.economicTrend.volatilityPressure * 0.2 +
      input.baseline.legalRegulatoryPressure * 100 * 0.2;
    const marketRiskHealth = clamp(100 - pressure);

    const expansionOpportunity = clamp(
      geographicValue * 0.35 + whiteSpaceValue * 0.35 + partnershipValue * 0.15 + marketSizeValue * 0.15
    );

    const healthValue = clamp(
      competitiveValue * 0.12 +
        expansionOpportunity * 0.12 +
        marketRiskHealth * 0.12 +
        industryValue * 0.08 +
        marketSizeValue * 0.08 +
        pricingValue * 0.07 +
        demandValue * 0.07 +
        demographicValue * 0.06 +
        geographicValue * 0.06 +
        economicValue * 0.06 +
        technologyValue * 0.06 +
        partnershipValue * 0.05 +
        whiteSpaceValue * 0.05
    );

    void input.reasoning;
    void input.risks;
    void input.opportunities;
    void input.signals;

    return {
      healthScore: score("market_health", "Market Health Score", healthValue),
      competitivePositionScore: score("market_competitive_position", "Competitive Position Score", competitiveValue),
      expansionOpportunityScore: score("market_expansion", "Expansion Opportunity Score", expansionOpportunity),
      marketRiskScore: invertedRiskScore(pressure),
      industryScore: score("market_industry", "Industry Score", industryValue),
      marketSizeScore: score("market_size", "Market Size Score", marketSizeValue),
      pricingScore: score("market_pricing", "Pricing Score", pricingValue),
      demandScore: score("market_demand", "Demand Score", demandValue),
      demographicScore: score("market_demographic", "Demographic Score", demographicValue),
      geographicScore: score("market_geographic", "Geographic Expansion Score", geographicValue),
      economicScore: score("market_economic", "Economic Trend Score", economicValue),
      technologyScore: score("market_technology", "Technology Trend Score", technologyValue),
      partnershipScore: score("market_partnership", "Partnership Score", partnershipValue),
      maScore: score("market_ma", "M&A Score", maValue),
      whiteSpaceScore: score("market_white_space", "White Space Score", whiteSpaceValue),
      knowledgeScore: score("market_knowledge", "Knowledge Contribution Score", knowledgeValue),
    };
  }
}

export class MarketHealth implements MarketHealthContract {
  assess(input: Parameters<MarketHealthContract["assess"]>[0]): MarketHealthResult {
    const dimensions: Record<string, number> = {
      competitive: input.scores.competitivePositionScore.value,
      expansion: input.scores.expansionOpportunityScore.value,
      riskResilience: input.scores.marketRiskScore.value,
      industry: input.scores.industryScore.value,
      marketSize: input.scores.marketSizeScore.value,
      demand: input.scores.demandScore.value,
      whiteSpace: input.scores.whiteSpaceScore.value,
    };
    const overallScore = clamp(
      Object.values(dimensions).reduce((sum, value) => sum + value, 0) / Object.values(dimensions).length
    );
    const status = statusFromScore(overallScore);
    return {
      overallScore,
      status,
      dimensions,
      lenses: buildLens({
        marketOpportunityExists: `White space score ${Math.round(input.whiteSpace.whiteSpaceScore)}; expansion candidate ${input.geographicExpansion.topCandidate ?? "none"}.`,
        evidenceSupports: input.competitive.narrative,
        competitorsInvolved: input.competitive.competitors.slice(0, 3).map((c) => c.name).join(", "),
        estimatedMarketSize: `Market size index ${Math.round(input.scores.marketSizeScore.value)}.`,
        risksExist: `Competitive pressure ${Math.round(input.competitive.competitivePressure)}.`,
        investmentRequired: "Prioritized market capture and expansion investment.",
        expectedReturn: `Expansion opportunity ${Math.round(input.scores.expansionOpportunityScore.value)}.`,
        organizationalCapabilitiesRequired: "Competitive intelligence, expansion ops, partnership capacity.",
      }),
      narrative: `Market health ${status} (${Math.round(overallScore)}).`,
    };
  }
}

export class MarketDashboard implements MarketDashboardContract {
  compose(input: Parameters<MarketDashboardContract["compose"]>[0]): MarketDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Market health ${Math.round(input.scores.healthScore.value)} - ${input.scores.healthScore.status}`,
      overall: input.scores.healthScore.value,
      competitivePositionScore: input.scores.competitivePositionScore.value,
      expansionOpportunityScore: input.scores.expansionOpportunityScore.value,
      marketRiskScore: input.scores.marketRiskScore.value,
      industryScore: input.scores.industryScore.value,
      marketSizeScore: input.scores.marketSizeScore.value,
      topRisks: input.risks.slice(0, 5).map((risk) => risk.title),
      topOpportunities: input.opportunities.slice(0, 5).map((opportunity) => opportunity.title),
      narrative: `Market dashboard: health ${Math.round(input.scores.healthScore.value)}, competitive ${Math.round(input.scores.competitivePositionScore.value)}, expansion ${Math.round(input.scores.expansionOpportunityScore.value)}.`,
    };
  }
}

export class MarketSpecializedDashboards implements MarketSpecializedDashboardsContract {
  competitive(input: Parameters<MarketSpecializedDashboardsContract["competitive"]>[0]): CompetitiveDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Competitive position ${Math.round(input.competitive.positionScore)} - pressure ${Math.round(input.competitive.competitivePressure)}`,
      positionScore: input.competitive.positionScore,
      competitivePressure: input.competitive.competitivePressure,
      competitorCount: input.competitive.competitors.length,
      topCompetitors: input.competitive.competitors
        .slice()
        .sort((a, b) => b.threatScore - a.threatScore)
        .slice(0, 5)
        .map((competitor) => competitor.name),
      launchSignals: input.competitive.launchSignalCount,
      narrative: input.competitive.narrative,
    };
  }

  expansion(input: Parameters<MarketSpecializedDashboardsContract["expansion"]>[0]): ExpansionDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Expansion readiness ${Math.round(input.geographicExpansion.readinessScore)} - top ${input.geographicExpansion.topCandidate ?? "none"}`,
      readinessScore: input.geographicExpansion.readinessScore,
      candidateCount: input.geographicExpansion.candidates.length,
      topCandidate: input.geographicExpansion.topCandidate,
      whiteSpaceScore: input.whiteSpace.whiteSpaceScore,
      narrative: `${input.geographicExpansion.narrative} ${input.whiteSpace.narrative}`,
    };
  }

  trend(input: Parameters<MarketSpecializedDashboardsContract["trend"]>[0]): TrendDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Trends: economic ${Math.round(input.economicTrend.tailwindScore)}, tech disruption ${Math.round(input.technologyTrend.disruptionScore)}`,
      economicTailwind: input.economicTrend.tailwindScore,
      technologyDisruption: input.technologyTrend.disruptionScore,
      demandMomentum: input.customerDemand.demandScore,
      hottestSignal: input.signals.hottestKind,
      narrative: `Trend dashboard hottest signal ${input.signals.hottestKind}; demand ${Math.round(input.customerDemand.demandScore)}.`,
    };
  }
}

export class MarketRiskAnalyzer implements MarketRiskAnalyzerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: Parameters<MarketRiskAnalyzerContract["analyze"]>[0]): MarketRiskRecord[] {
    const risks: MarketRiskRecord[] = [
      risk(
        this.createId,
        "Competitive pressure escalation",
        "competitive",
        clamp(input.competitive.competitivePressure),
        "Strengthen differentiation and pricing posture.",
        input.competitive.competitors.slice(0, 3).map((c) => c.name)
      ),
      risk(
        this.createId,
        "Technology disruption exposure",
        "technology",
        clamp(input.technologyTrend.disruptionScore),
        "Prioritize adoption roadmap for high-disruption trends.",
        []
      ),
      risk(
        this.createId,
        "Economic volatility impact",
        "economic",
        clamp(input.economicTrend.volatilityPressure),
        "Scenario-plan enrollment and pricing under weaker indicators.",
        []
      ),
      risk(
        this.createId,
        "Industry consolidation squeeze",
        "ma",
        clamp(input.mergersAcquisitions.consolidationPressure),
        "Clarify M&A posture and partnership alternatives.",
        input.mergersAcquisitions.targets.slice(0, 2).map((t) => t.name)
      ),
    ];
    return risks.sort((left, right) => right.score - left.score);
  }
}

export class MarketOpportunityAnalyzer implements MarketOpportunityAnalyzerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: Parameters<MarketOpportunityAnalyzerContract["analyze"]>[0]): MarketOpportunityRecord[] {
    const topWhite = input.whiteSpace.opportunities[0];
    const topGeo = input.geographicExpansion.candidates[0];
    return [
      opportunity(
        this.createId,
        topWhite?.unmetNeed ?? "Capture unmet market needs",
        priorityFromScore(input.whiteSpace.whiteSpaceScore),
        clamp(input.whiteSpace.whiteSpaceScore + 8),
        topWhite?.sizeEstimate ?? Math.round(input.baseline.whiteSpaceScore * 20_000),
        "strategy"
      ),
      opportunity(
        this.createId,
        topGeo ? `Expand into ${topGeo.region}` : "Advance geographic expansion readiness",
        priorityFromScore(input.geographicExpansion.readinessScore),
        clamp(input.geographicExpansion.readinessScore + 6),
        topGeo?.expectedReturn ?? Math.round(input.baseline.geographicExpansionReadiness * 15_000),
        "growth"
      ),
      opportunity(
        this.createId,
        "Deepen strategic partnership density",
        priorityFromScore(input.partnership.densityScore),
        clamp(input.partnership.densityScore + 5),
        Math.round(input.partnership.densityScore * 12_000),
        "partnerships"
      ),
      opportunity(
        this.createId,
        "Publish market intelligence knowledge drafts",
        priorityFromScore(input.knowledgeContribution.contributionScore),
        clamp(input.knowledgeContribution.contributionScore + 4),
        Math.round(input.knowledgeContribution.contributionScore * 5_000),
        "knowledge"
      ),
    ].sort((left, right) => right.score - left.score);
  }
}

export class MarketRecommendationComposer implements MarketRecommendationComposerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  compose(input: Parameters<MarketRecommendationComposerContract["compose"]>[0]): MarketRecommendationRecord[] {
    const now = input.now;
    const dueSoon = new Date(now.getTime() + 30 * 86_400_000).toISOString();
    const dueMedium = new Date(now.getTime() + 60 * 86_400_000).toISOString();
    const recommendations: MarketRecommendationRecord[] = [];
    const competitorNames = input.competitive.competitors.slice(0, 4).map((c) => c.name);

    const topRisk = input.risks[0];
    if (topRisk) {
      recommendations.push({
        id: this.createId("mkt-rec"),
        title: `Mitigate ${topRisk.category} market risk`,
        priority: topRisk.severity,
        evidenceRefs: [`risk:${topRisk.id}`],
        confidenceScore: clamp(input.baseline.executionScore),
        riskScore: topRisk.score,
        marketSizeEstimate: input.marketSize.estimates.sam,
        investmentEstimate: Math.round(topRisk.score * 4_000),
        expectedReturnEstimate: Math.round(topRisk.score * 5_500),
        competitors: competitorNames,
        capabilitiesRequired: ["competitive_intelligence", "executive_sponsorship"],
        owner: "strategy",
        dueDate: dueSoon,
        rationale: topRisk.narrative,
        action: topRisk.mitigation,
        lenses: topRisk.lenses,
        narrative: `Prioritize ${topRisk.category} market risk mitigation.`,
      });
    }

    const topWhite = input.whiteSpace.opportunities[0];
    if (topWhite) {
      recommendations.push({
        id: this.createId("mkt-rec"),
        title: `Capture white space: ${topWhite.unmetNeed}`,
        priority: priorityFromScore(100 - topWhite.captureScore),
        evidenceRefs: [`white_space:${topWhite.id}`],
        confidenceScore: clamp(topWhite.captureScore),
        riskScore: clamp(100 - topWhite.captureScore),
        marketSizeEstimate: topWhite.sizeEstimate,
        investmentEstimate: Math.round(topWhite.sizeEstimate * 0.12),
        expectedReturnEstimate: Math.round(topWhite.sizeEstimate * 0.28),
        competitors: competitorNames,
        capabilitiesRequired: ["program_design", "go_to_market", "operations_capacity"],
        owner: "growth",
        dueDate: dueMedium,
        rationale: topWhite.narrative,
        action: `Design and pilot offering for ${topWhite.segment}.`,
        lenses: topWhite.lenses,
        narrative: topWhite.narrative,
      });
    }

    const topGeo = input.geographicExpansion.candidates[0];
    if (topGeo) {
      recommendations.push({
        id: this.createId("mkt-rec"),
        title: `Advance expansion into ${topGeo.region}`,
        priority: priorityFromScore(topGeo.readiness),
        evidenceRefs: [`geo:${topGeo.id}`],
        confidenceScore: clamp(topGeo.readiness),
        riskScore: clamp(topGeo.competitiveIntensity),
        marketSizeEstimate: input.marketSize.estimates.sam,
        investmentEstimate: topGeo.investmentEstimate,
        expectedReturnEstimate: topGeo.expectedReturn,
        competitors: competitorNames,
        capabilitiesRequired: ["geographic_expansion", "local_partnerships", "funding"],
        owner: "growth",
        dueDate: dueMedium,
        rationale: topGeo.narrative,
        action: `Complete feasibility and launch plan for ${topGeo.region}.`,
        lenses: topGeo.lenses,
        narrative: topGeo.narrative,
      });
    }

    for (const record of input.opportunities.slice(0, 2)) {
      recommendations.push({
        id: this.createId("mkt-rec"),
        title: record.title,
        priority: record.priority,
        evidenceRefs: [`opportunity:${record.id}`],
        confidenceScore: clamp(record.score),
        riskScore: clamp(100 - record.score),
        marketSizeEstimate: record.marketSizeEstimate,
        investmentEstimate: Math.round(record.expectedValue * 0.4),
        expectedReturnEstimate: record.expectedValue,
        competitors: competitorNames,
        capabilitiesRequired: ["market_intelligence", "execution"],
        owner: record.lenses.organizationalCapabilitiesRequired.split(",")[0]?.trim() || "strategy",
        dueDate: dueMedium,
        rationale: record.narrative,
        action: record.lenses.marketOpportunityExists,
        lenses: record.lenses,
        narrative: record.narrative,
      });
    }

    return recommendations
      .sort((left, right) => right.riskScore - left.riskScore)
      .slice(0, 8);
  }
}

export class ExecutiveMarketBriefGenerator implements ExecutiveMarketBriefGeneratorContract {
  generate(input: Parameters<ExecutiveMarketBriefGeneratorContract["generate"]>[0]): ExecutiveMarketBrief {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Market health ${Math.round(input.scores.healthScore.value)} - hottest signal ${input.signals.hottestKind}`,
      summary:
        input.request.question ??
        "Where is the market moving, how are we positioned, and which opportunities should leadership pursue?",
      healthScore: input.scores.healthScore.value,
      competitivePositionScore: input.scores.competitivePositionScore.value,
      expansionOpportunityScore: input.scores.expansionOpportunityScore.value,
      marketRiskScore: input.scores.marketRiskScore.value,
      topRecommendations: input.recommendations.slice(0, 5).map((recommendation) => recommendation.title),
      topRisks: input.risks.slice(0, 5).map((risk) => risk.title),
      topOpportunities: input.opportunities.slice(0, 5).map((opportunity) => opportunity.title),
      hottestSignal: input.signals.hottestKind,
      lenses: buildLens({
        marketOpportunityExists: `${input.opportunities.length} market opportunities surfaced.`,
        evidenceSupports: `Confidence ${input.confidence.level}; signal density ${Math.round(input.signals.densityScore)}.`,
        competitorsInvolved: input.risks[0]?.lenses.competitorsInvolved ?? "Peer competitive set",
        estimatedMarketSize: `Market size score ${Math.round(input.scores.marketSizeScore.value)}.`,
        risksExist: `${input.risks.length} material market risks tracked.`,
        investmentRequired: "Prioritized expansion and white-space capture investment.",
        expectedReturn: `Expansion opportunity ${Math.round(input.scores.expansionOpportunityScore.value)}.`,
        organizationalCapabilitiesRequired: "Strategy, growth ops, partnerships, market intelligence.",
      }),
      narrative: `Executive market brief: health ${Math.round(input.scores.healthScore.value)}, competitive ${Math.round(input.scores.competitivePositionScore.value)}, confidence ${input.confidence.level}.`,
    };
  }
}

function score(key: string, label: string, value: number): MarketScore {
  const normalized = clamp(value);
  const status = statusFromScore(normalized);
  return {
    key,
    label,
    value: normalized,
    status,
    band: priorityFromScore(normalized),
    narrative: scoreNarrative(label, normalized, status),
  };
}

/** Higher = healthier / lower risk (inverted pressure semantics). */
function invertedRiskScore(pressure: number): MarketScore {
  const health = clamp(100 - pressure);
  return {
    key: "market_risk",
    label: "Market Risk Score",
    value: health,
    status: statusFromScore(health),
    band: priorityFromRisk(pressure / 100),
    narrative: `Market risk health is ${priorityFromRisk(pressure / 100)} at ${Math.round(health)} (pressure ${Math.round(pressure)}).`,
  };
}

function risk(
  createId: (prefix: string) => string,
  title: string,
  category: string,
  scoreValue: number,
  mitigation: string,
  competitors: string[]
): MarketRiskRecord {
  return {
    id: createId("mkt-risk"),
    title,
    category,
    severity: priorityFromRisk(scoreValue / 100),
    score: scoreValue,
    mitigation,
    lenses: buildLens({
      marketOpportunityExists: `Mitigating ${title} protects market position.`,
      evidenceSupports: title,
      competitorsInvolved: competitors.join(", ") || "Market peers",
      estimatedMarketSize: "Impacts addressable share and capture potential.",
      risksExist: title,
      investmentRequired: "Risk mitigation investment required.",
      expectedReturn: "Reduced competitive and disruption exposure.",
      organizationalCapabilitiesRequired: "Strategy and domain owners.",
    }),
    narrative: title,
  };
}

function opportunity(
  createId: (prefix: string) => string,
  title: string,
  priority: MarketOpportunityRecord["priority"],
  scoreValue: number,
  marketSizeEstimate: number,
  owner: string
): MarketOpportunityRecord {
  return {
    id: createId("mkt-opp"),
    title,
    priority,
    score: scoreValue,
    expectedValue: Math.round(scoreValue * 2_500),
    marketSizeEstimate,
    lenses: buildLens({
      marketOpportunityExists: title,
      evidenceSupports: title,
      competitorsInvolved: "Selected peer set",
      estimatedMarketSize: `Approx $${marketSizeEstimate.toLocaleString()}.`,
      risksExist: "Execution and competitive response risk.",
      investmentRequired: "Capture investment required.",
      expectedReturn: `Expected value ~$${Math.round(scoreValue * 2_500).toLocaleString()}.`,
      organizationalCapabilitiesRequired: owner,
    }),
    narrative: title,
  };
}
