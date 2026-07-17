/**
 * Market Intelligence — contracts only (Sprint 043).
 *
 * Leaf module: imports types only, never implementations.
 */

import type * as T from "@/lib/platform/intelligence/market/types";

export interface MarketIntelligenceEngine {
  build(request: T.MarketRequest): T.MarketResult;
}

export type MarketEngine = MarketIntelligenceEngine;

export interface IndustryIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): T.IndustrySuite;
}

export interface CompetitiveIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    industry: T.IndustrySuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.CompetitiveSuite;
}

export interface MarketSizeIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    industry: T.IndustrySuite;
    competitive: T.CompetitiveSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.MarketSizeSuite;
}

export interface PricingIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    competitive: T.CompetitiveSuite;
    marketSize: T.MarketSizeSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.PricingSuite;
}

export interface CustomerDemandIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    pricing: T.PricingSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.CustomerDemandSuite;
}

export interface DemographicIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    customerDemand: T.CustomerDemandSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.DemographicSuite;
}

export interface GeographicExpansionIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    demographic: T.DemographicSuite;
    marketSize: T.MarketSizeSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.GeographicExpansionSuite;
}

export interface EconomicTrendIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): T.EconomicTrendSuite;
}

export interface TechnologyTrendIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    economicTrend: T.EconomicTrendSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.TechnologyTrendSuite;
}

export interface PartnershipIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    competitive: T.CompetitiveSuite;
    geographicExpansion: T.GeographicExpansionSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.PartnershipSuite;
}

export interface MergersAcquisitionsIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    competitive: T.CompetitiveSuite;
    industry: T.IndustrySuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.MergersAcquisitionsSuite;
}

export interface WhiteSpaceIntelligence {
  assess(input: {
    baseline: T.MarketBaseline;
    customerDemand: T.CustomerDemandSuite;
    competitive: T.CompetitiveSuite;
    marketSize: T.MarketSizeSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.WhiteSpaceSuite;
}

export interface MarketReasoner {
  reason(input: {
    baseline: T.MarketBaseline;
    competitive: T.CompetitiveSuite;
    whiteSpace: T.WhiteSpaceSuite;
    geographicExpansion: T.GeographicExpansionSuite;
    signals: T.MarketSignalsSuite;
    question?: string;
    now: Date;
  }): T.MarketReasoningResult;
}

export interface MarketKnowledgeContributionEngine {
  contribute(input: {
    baseline: T.MarketBaseline;
    industry: T.IndustrySuite;
    competitive: T.CompetitiveSuite;
    whiteSpace: T.WhiteSpaceSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.MarketKnowledgeContribution;
}

export interface MarketIntelligence {
  composeScores(input: {
    baseline: T.MarketBaseline;
    industry: T.IndustrySuite;
    competitive: T.CompetitiveSuite;
    marketSize: T.MarketSizeSuite;
    pricing: T.PricingSuite;
    customerDemand: T.CustomerDemandSuite;
    demographic: T.DemographicSuite;
    geographicExpansion: T.GeographicExpansionSuite;
    economicTrend: T.EconomicTrendSuite;
    technologyTrend: T.TechnologyTrendSuite;
    partnership: T.PartnershipSuite;
    mergersAcquisitions: T.MergersAcquisitionsSuite;
    whiteSpace: T.WhiteSpaceSuite;
    signals: T.MarketSignalsSuite;
    knowledgeContribution: T.MarketKnowledgeContribution;
    reasoning: T.MarketReasoningResult;
    risks: T.MarketRiskRecord[];
    opportunities: T.MarketOpportunityRecord[];
  }): {
    healthScore: T.MarketScore;
    competitivePositionScore: T.MarketScore;
    expansionOpportunityScore: T.MarketScore;
    marketRiskScore: T.MarketScore;
    industryScore: T.MarketScore;
    marketSizeScore: T.MarketScore;
    pricingScore: T.MarketScore;
    demandScore: T.MarketScore;
    demographicScore: T.MarketScore;
    geographicScore: T.MarketScore;
    economicScore: T.MarketScore;
    technologyScore: T.MarketScore;
    partnershipScore: T.MarketScore;
    maScore: T.MarketScore;
    whiteSpaceScore: T.MarketScore;
    knowledgeScore: T.MarketScore;
  };
}

export interface MarketHealth {
  assess(input: {
    baseline: T.MarketBaseline;
    scores: ReturnType<MarketIntelligence["composeScores"]>;
    competitive: T.CompetitiveSuite;
    whiteSpace: T.WhiteSpaceSuite;
    geographicExpansion: T.GeographicExpansionSuite;
  }): T.MarketHealthResult;
}

export interface MarketDashboard {
  compose(input: {
    scores: ReturnType<MarketIntelligence["composeScores"]>;
    risks: T.MarketRiskRecord[];
    opportunities: T.MarketOpportunityRecord[];
    now: Date;
  }): T.MarketDashboardResult;
}

export interface MarketSpecializedDashboards {
  competitive(input: {
    competitive: T.CompetitiveSuite;
    now: Date;
  }): T.CompetitiveDashboardResult;
  expansion(input: {
    geographicExpansion: T.GeographicExpansionSuite;
    whiteSpace: T.WhiteSpaceSuite;
    now: Date;
  }): T.ExpansionDashboardResult;
  trend(input: {
    economicTrend: T.EconomicTrendSuite;
    technologyTrend: T.TechnologyTrendSuite;
    customerDemand: T.CustomerDemandSuite;
    signals: T.MarketSignalsSuite;
    now: Date;
  }): T.TrendDashboardResult;
}

export interface MarketRiskAnalyzer {
  analyze(input: {
    baseline: T.MarketBaseline;
    competitive: T.CompetitiveSuite;
    technologyTrend: T.TechnologyTrendSuite;
    economicTrend: T.EconomicTrendSuite;
    mergersAcquisitions: T.MergersAcquisitionsSuite;
    now: Date;
  }): T.MarketRiskRecord[];
}

export interface MarketOpportunityAnalyzer {
  analyze(input: {
    baseline: T.MarketBaseline;
    whiteSpace: T.WhiteSpaceSuite;
    geographicExpansion: T.GeographicExpansionSuite;
    partnership: T.PartnershipSuite;
    knowledgeContribution: T.MarketKnowledgeContribution;
    now: Date;
  }): T.MarketOpportunityRecord[];
}

export interface MarketRecommendationComposer {
  compose(input: {
    baseline: T.MarketBaseline;
    risks: T.MarketRiskRecord[];
    opportunities: T.MarketOpportunityRecord[];
    competitive: T.CompetitiveSuite;
    marketSize: T.MarketSizeSuite;
    whiteSpace: T.WhiteSpaceSuite;
    geographicExpansion: T.GeographicExpansionSuite;
    now: Date;
  }): T.MarketRecommendationRecord[];
}

export interface ExecutiveMarketBriefGenerator {
  generate(input: {
    request: T.MarketRequest;
    scores: ReturnType<MarketIntelligence["composeScores"]>;
    risks: T.MarketRiskRecord[];
    opportunities: T.MarketOpportunityRecord[];
    signals: T.MarketSignalsSuite;
    recommendations: T.MarketRecommendationRecord[];
    confidence: T.MarketConfidenceScore;
    now: Date;
  }): T.ExecutiveMarketBrief;
}

export interface MarketProjection {
  project(input: {
    request: T.MarketRequest;
    scores: ReturnType<MarketIntelligence["composeScores"]>;
    dashboard: T.MarketDashboardResult;
    competitiveDashboard: T.CompetitiveDashboardResult;
    expansionDashboard: T.ExpansionDashboardResult;
    trendDashboard: T.TrendDashboardResult;
    brief: T.ExecutiveMarketBrief;
    confidence: T.MarketConfidenceScore;
    baseline: T.MarketBaseline;
    marketSize: T.MarketSizeSuite;
  }): T.MarketProjectionResult;
}

export interface MarketQueries {
  ask(result: T.MarketResult, request: T.MarketQueryRequest): T.MarketQueryResult;
}

export interface MarketRepository {
  save(result: T.MarketResult): T.MarketResult;
  get(requestId: string): T.MarketResult | null;
  list(scope?: Partial<T.GraphScope>): T.MarketResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.MarketHistoryRecord): T.MarketHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.MarketHistoryRecord[];
  clear(): void;
}

export interface MarketRegistry {
  register(domain: string, capability: string): void;
  list(): T.MarketPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}

export interface MarketIntelligenceService {
  build(request: T.MarketRequest): T.MarketResult;
  query(result: T.MarketResult, request: T.MarketQueryRequest): T.MarketQueryResult;
  repository(): MarketRepository;
}

export type MarketService = MarketIntelligenceService;

export interface MarketDependencies {
  engine?: MarketIntelligenceEngine;
  industryIntelligence?: IndustryIntelligence;
  competitiveIntelligence?: CompetitiveIntelligence;
  marketSizeIntelligence?: MarketSizeIntelligence;
  pricingIntelligence?: PricingIntelligence;
  customerDemandIntelligence?: CustomerDemandIntelligence;
  demographicIntelligence?: DemographicIntelligence;
  geographicExpansionIntelligence?: GeographicExpansionIntelligence;
  economicTrendIntelligence?: EconomicTrendIntelligence;
  technologyTrendIntelligence?: TechnologyTrendIntelligence;
  partnershipIntelligence?: PartnershipIntelligence;
  mergersAcquisitionsIntelligence?: MergersAcquisitionsIntelligence;
  whiteSpaceIntelligence?: WhiteSpaceIntelligence;
  reasoner?: MarketReasoner;
  knowledgeContributionEngine?: MarketKnowledgeContributionEngine;
  intelligence?: MarketIntelligence;
  health?: MarketHealth;
  dashboard?: MarketDashboard;
  specializedDashboards?: MarketSpecializedDashboards;
  riskAnalyzer?: MarketRiskAnalyzer;
  opportunityAnalyzer?: MarketOpportunityAnalyzer;
  recommendationComposer?: MarketRecommendationComposer;
  briefGenerator?: ExecutiveMarketBriefGenerator;
  projection?: MarketProjection;
  queries?: MarketQueries;
  registry?: MarketRegistry;
  repository?: MarketRepository;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
