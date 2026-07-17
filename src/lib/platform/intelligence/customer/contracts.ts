/**
 * Customer Intelligence — contracts / interfaces only (Sprint 039).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type * as T from "@/lib/platform/intelligence/customer/types";

/** Core orchestration engine. */
export interface CustomerIntelligenceEngine {
  build(request: T.CustomerRequest): T.CustomerResult;
}

/** Alias matching Sprint naming for the core engine. */
export type CustomerEngine = CustomerIntelligenceEngine;

/** Scores + health composer. */
export interface CustomerIntelligence {
  composeScores(input: {
    baseline: T.CustomerBaseline;
    journeyMap: T.JourneyMapResult;
    engagement: T.EngagementResult;
    satisfaction: T.SatisfactionSuite;
    retentionWatchlist: T.RetentionWatchlistResult;
    communityHealth: T.CommunityHealthResult;
    risks: T.CustomerRiskRecord[];
    opportunities: T.CustomerOpportunityRecord[];
  }): {
    healthScore: T.CustomerScore;
    engagementScore: T.CustomerScore;
    journeyScore: T.CustomerScore;
    satisfactionScore: T.CustomerScore;
    retentionScore: T.CustomerScore;
    communityScore: T.CustomerScore;
    riskScore: T.CustomerScore;
  };
}

export interface CustomerDashboard {
  compose(input: {
    scores: {
      healthScore: T.CustomerScore;
      engagementScore: T.CustomerScore;
      journeyScore: T.CustomerScore;
      satisfactionScore: T.CustomerScore;
      retentionScore: T.CustomerScore;
      communityScore: T.CustomerScore;
    };
    baseline: T.CustomerBaseline;
    risks: T.CustomerRiskRecord[];
    opportunities: T.CustomerOpportunityRecord[];
    now: Date;
  }): T.CustomerDashboardResult;
}

export interface CustomerHealth {
  assess(input: {
    baseline: T.CustomerBaseline;
    scores: {
      healthScore: T.CustomerScore;
      engagementScore: T.CustomerScore;
      journeyScore: T.CustomerScore;
      satisfactionScore: T.CustomerScore;
      retentionScore: T.CustomerScore;
      communityScore: T.CustomerScore;
      riskScore: T.CustomerScore;
    };
    journeyMap: T.JourneyMapResult;
    engagement: T.EngagementResult;
  }): T.CustomerHealthResult;
}

export interface JourneyMapEngine {
  map(input: {
    baseline: T.CustomerBaseline;
    now: Date;
  }): T.JourneyMapResult;
}

export interface EngagementEngine {
  assess(input: {
    baseline: T.CustomerBaseline;
    now: Date;
  }): T.EngagementResult;
}

export interface SatisfactionEngine {
  assess(input: {
    baseline: T.CustomerBaseline;
    engagement: T.EngagementResult;
    now: Date;
  }): T.SatisfactionSuite;
}

export interface RetentionRiskEngine {
  analyze(input: {
    baseline: T.CustomerBaseline;
    journeyMap: T.JourneyMapResult;
    engagement: T.EngagementResult;
    satisfaction: T.SatisfactionSuite;
    now: Date;
  }): T.RetentionWatchlistResult;
}

export interface CommunityBelongingEngine {
  assess(input: {
    baseline: T.CustomerBaseline;
    engagement: T.EngagementResult;
    now: Date;
  }): T.CommunityHealthResult;
}

export interface CustomerRiskAnalyzer {
  analyze(input: {
    baseline: T.CustomerBaseline;
    journeyMap: T.JourneyMapResult;
    engagement: T.EngagementResult;
    satisfaction: T.SatisfactionSuite;
    retentionWatchlist: T.RetentionWatchlistResult;
    communityHealth: T.CommunityHealthResult;
    now: Date;
  }): T.CustomerRiskRecord[];
}

export interface CustomerOpportunityAnalyzer {
  analyze(input: {
    baseline: T.CustomerBaseline;
    journeyMap: T.JourneyMapResult;
    engagement: T.EngagementResult;
    satisfaction: T.SatisfactionSuite;
    communityHealth: T.CommunityHealthResult;
    now: Date;
  }): T.CustomerOpportunityRecord[];
}

export interface CustomerRecommendationComposer {
  compose(input: {
    opportunities: T.CustomerOpportunityRecord[];
    risks: T.CustomerRiskRecord[];
    journeyMap: T.JourneyMapResult;
    retentionWatchlist: T.RetentionWatchlistResult;
    now: Date;
  }): T.CustomerRecommendationRecord[];
}

export interface ExecutiveCustomerBriefGenerator {
  generate(input: {
    request: T.CustomerRequest;
    baseline: T.CustomerBaseline;
    scores: {
      healthScore: T.CustomerScore;
      engagementScore: T.CustomerScore;
      journeyScore: T.CustomerScore;
      satisfactionScore: T.CustomerScore;
      retentionScore: T.CustomerScore;
      communityScore: T.CustomerScore;
    };
    risks: T.CustomerRiskRecord[];
    opportunities: T.CustomerOpportunityRecord[];
    journeyMap: T.JourneyMapResult;
    recommendations: T.CustomerRecommendationRecord[];
    confidence: T.CustomerConfidenceScore;
    now: Date;
  }): T.ExecutiveCustomerBrief;
}

export interface CustomerProjection {
  project(input: {
    request: T.CustomerRequest;
    healthScore: T.CustomerScore;
    engagementScore: T.CustomerScore;
    journeyScore: T.CustomerScore;
    satisfactionScore: T.CustomerScore;
    retentionScore: T.CustomerScore;
    communityScore: T.CustomerScore;
    journeyMap: T.JourneyMapResult;
    engagement: T.EngagementResult;
    satisfaction: T.SatisfactionSuite;
    retentionWatchlist: T.RetentionWatchlistResult;
    communityHealth: T.CommunityHealthResult;
    brief: T.ExecutiveCustomerBrief;
    confidence: T.CustomerConfidenceScore;
    dashboard: T.CustomerDashboardResult;
    baseline: T.CustomerBaseline;
  }): T.CustomerProjectionResult;
}

export interface CustomerQueries {
  ask(
    result: T.CustomerResult,
    request: T.CustomerQueryRequest
  ): T.CustomerQueryResult;
}

export interface CustomerRepository {
  save(result: T.CustomerResult): T.CustomerResult;
  get(requestId: string): T.CustomerResult | null;
  list(scope?: Partial<T.GraphScope>): T.CustomerResult[];
  remove(requestId: string): boolean;
  saveHistory(
    record: T.CustomerHistoryRecord
  ): T.CustomerHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.CustomerHistoryRecord[];
  clear(): void;
}

export interface CustomerRegistry {
  register(domain: string, capability: string): void;
  list(): T.CustomerPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}

export interface CustomerIntelligenceService {
  build(request: T.CustomerRequest): T.CustomerResult;
  query(
    result: T.CustomerResult,
    request: T.CustomerQueryRequest
  ): T.CustomerQueryResult;
  repository(): CustomerRepository;
}

/** Alias matching Sprint naming. */
export type CustomerService = CustomerIntelligenceService;

/** DI bag for the full Customer Intelligence stack. */
export interface CustomerDependencies {
  engine?: CustomerIntelligenceEngine;
  customerIntelligence?: CustomerIntelligence;
  customerDashboard?: CustomerDashboard;
  customerHealth?: CustomerHealth;
  journeyMapEngine?: JourneyMapEngine;
  engagementEngine?: EngagementEngine;
  satisfactionEngine?: SatisfactionEngine;
  retentionRiskEngine?: RetentionRiskEngine;
  communityBelongingEngine?: CommunityBelongingEngine;
  customerRiskAnalyzer?: CustomerRiskAnalyzer;
  customerOpportunityAnalyzer?: CustomerOpportunityAnalyzer;
  customerRecommendationComposer?: CustomerRecommendationComposer;
  briefGenerator?: ExecutiveCustomerBriefGenerator;
  projection?: CustomerProjection;
  queries?: CustomerQueries;
  registry?: CustomerRegistry;
  repository?: CustomerRepository;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
