/**
 * Business Model Intelligence — contracts / interfaces only (Sprint 037).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type * as T from "@/lib/platform/intelligence/business-model/types";

/** Core orchestration engine. */
export interface BusinessModelIntelligenceEngine {
  build(request: T.BusinessModelRequest): T.BusinessModelResult;
}

/** Alias matching Sprint naming for the core engine. */
export type BusinessModelEngine = BusinessModelIntelligenceEngine;

/** Scores + health composer. */
export interface BusinessModelIntelligence {
  composeScores(input: {
    baseline: T.BusinessModelBaseline;
    canvas: T.BusinessModelCanvasResult;
    leanCanvas: T.LeanCanvasResult;
    risks: T.BusinessModelRiskRecord[];
    opportunities: T.BusinessModelOpportunityRecord[];
    competitive: T.CompetitivePositionResult;
  }): {
    healthScore: T.BusinessModelScore;
    clarityScore: T.BusinessModelScore;
    scalabilityScore: T.BusinessModelScore;
    sustainabilityScore: T.BusinessModelScore;
    riskScore: T.BusinessModelScore;
  };
}

export interface BusinessModelDashboard {
  compose(input: {
    scores: {
      healthScore: T.BusinessModelScore;
      clarityScore: T.BusinessModelScore;
      scalabilityScore: T.BusinessModelScore;
      sustainabilityScore: T.BusinessModelScore;
    };
    baseline: T.BusinessModelBaseline;
    risks: T.BusinessModelRiskRecord[];
    opportunities: T.BusinessModelOpportunityRecord[];
    now: Date;
  }): T.BusinessModelDashboardResult;
}

export interface BusinessModelHealth {
  assess(input: {
    baseline: T.BusinessModelBaseline;
    scores: {
      healthScore: T.BusinessModelScore;
      clarityScore: T.BusinessModelScore;
      scalabilityScore: T.BusinessModelScore;
      sustainabilityScore: T.BusinessModelScore;
      riskScore: T.BusinessModelScore;
    };
    canvas: T.BusinessModelCanvasResult;
    competitive: T.CompetitivePositionResult;
  }): T.BusinessModelHealthResult;
}

export interface BusinessModelCanvasBuilder {
  build(input: {
    baseline: T.BusinessModelBaseline;
    dna: OrganizationDNA | null | undefined;
    now: Date;
  }): T.BusinessModelCanvasResult;
}

export interface LeanCanvasBuilder {
  build(input: {
    baseline: T.BusinessModelBaseline;
    dna: OrganizationDNA | null | undefined;
    now: Date;
  }): T.LeanCanvasResult;
}

export interface OrganizationDesignEngine {
  analyze(input: {
    baseline: T.BusinessModelBaseline;
    now: Date;
  }): T.OrganizationDesignSuite;
}

export interface BusinessModelSimulator {
  simulate(input: {
    baseline: T.BusinessModelBaseline;
    design: T.OrganizationDesignSuite;
    scenarios: T.BusinessModelScenarioSuite;
    now: Date;
  }): {
    simulations: T.BusinessModelSimulationRecord[];
    comparison: T.BusinessModelComparisonResult;
  };
}

export interface BusinessModelScenarioPlanner {
  plan(input: {
    baseline: T.BusinessModelBaseline;
    design: T.OrganizationDesignSuite;
    now: Date;
  }): T.BusinessModelScenarioSuite;
}

export interface CompetitivePositionAnalyzer {
  analyze(input: {
    baseline: T.BusinessModelBaseline;
    canvas: T.BusinessModelCanvasResult;
    now: Date;
  }): T.CompetitivePositionResult;
}

export interface BusinessModelRiskAnalyzer {
  analyze(input: {
    baseline: T.BusinessModelBaseline;
    canvas: T.BusinessModelCanvasResult;
    design: T.OrganizationDesignSuite;
    now: Date;
  }): T.BusinessModelRiskRecord[];
}

export interface BusinessModelOpportunityAnalyzer {
  analyze(input: {
    baseline: T.BusinessModelBaseline;
    canvas: T.BusinessModelCanvasResult;
    leanCanvas: T.LeanCanvasResult;
    scenarios: T.BusinessModelScenarioSuite;
    now: Date;
  }): T.BusinessModelOpportunityRecord[];
}

export interface BusinessModelEvolutionPlanner {
  plan(input: {
    baseline: T.BusinessModelBaseline;
    opportunities: T.BusinessModelOpportunityRecord[];
    risks: T.BusinessModelRiskRecord[];
    scenarios: T.BusinessModelScenarioSuite;
    now: Date;
  }): T.BusinessModelEvolutionRoadmap;
}

export interface BusinessModelRecommendationComposer {
  compose(input: {
    opportunities: T.BusinessModelOpportunityRecord[];
    risks: T.BusinessModelRiskRecord[];
    roadmap: T.BusinessModelEvolutionRoadmap;
    design: T.OrganizationDesignSuite;
    now: Date;
  }): T.BusinessModelRecommendationRecord[];
}

export interface ExecutiveBusinessBriefGenerator {
  generate(input: {
    request: T.BusinessModelRequest;
    baseline: T.BusinessModelBaseline;
    scores: {
      healthScore: T.BusinessModelScore;
      clarityScore: T.BusinessModelScore;
      scalabilityScore: T.BusinessModelScore;
      sustainabilityScore: T.BusinessModelScore;
    };
    risks: T.BusinessModelRiskRecord[];
    opportunities: T.BusinessModelOpportunityRecord[];
    scenarios: T.BusinessModelScenarioSuite;
    recommendations: T.BusinessModelRecommendationRecord[];
    confidence: T.BusinessModelConfidenceScore;
    now: Date;
  }): T.ExecutiveBusinessBrief;
}

export interface BusinessModelProjection {
  project(input: {
    request: T.BusinessModelRequest;
    healthScore: T.BusinessModelScore;
    clarityScore: T.BusinessModelScore;
    scalabilityScore: T.BusinessModelScore;
    sustainabilityScore: T.BusinessModelScore;
    canvas: T.BusinessModelCanvasResult;
    leanCanvas: T.LeanCanvasResult;
    brief: T.ExecutiveBusinessBrief;
    confidence: T.BusinessModelConfidenceScore;
    dashboard: T.BusinessModelDashboardResult;
    baseline: T.BusinessModelBaseline;
  }): T.BusinessModelProjectionResult;
}

export interface BusinessModelQueries {
  ask(
    result: T.BusinessModelResult,
    request: T.BusinessModelQueryRequest
  ): T.BusinessModelQueryResult;
}

export interface BusinessModelRegistry {
  register(domain: string, capability: string): void;
  list(): T.BusinessModelPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}

export interface BusinessModelRepository {
  save(result: T.BusinessModelResult): T.BusinessModelResult;
  get(requestId: string): T.BusinessModelResult | null;
  list(scope?: Partial<T.GraphScope>): T.BusinessModelResult[];
  remove(requestId: string): boolean;
  saveHistory(
    record: T.BusinessModelHistoryRecord
  ): T.BusinessModelHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.BusinessModelHistoryRecord[];
  clear(): void;
}

export interface BusinessModelIntelligenceService {
  build(request: T.BusinessModelRequest): T.BusinessModelResult;
  query(
    result: T.BusinessModelResult,
    request: T.BusinessModelQueryRequest
  ): T.BusinessModelQueryResult;
  repository(): BusinessModelRepository;
}

/** Alias matching Sprint naming. */
export type BusinessModelService = BusinessModelIntelligenceService;

/** DI bag for the full Business Model Intelligence stack. */
export interface BusinessModelDependencies {
  engine?: BusinessModelIntelligenceEngine;
  businessModelIntelligence?: BusinessModelIntelligence;
  businessModelDashboard?: BusinessModelDashboard;
  businessModelHealth?: BusinessModelHealth;
  businessModelCanvasBuilder?: BusinessModelCanvasBuilder;
  leanCanvasBuilder?: LeanCanvasBuilder;
  organizationDesignEngine?: OrganizationDesignEngine;
  businessModelSimulator?: BusinessModelSimulator;
  businessModelScenarioPlanner?: BusinessModelScenarioPlanner;
  competitivePositionAnalyzer?: CompetitivePositionAnalyzer;
  businessModelRiskAnalyzer?: BusinessModelRiskAnalyzer;
  businessModelOpportunityAnalyzer?: BusinessModelOpportunityAnalyzer;
  businessModelEvolutionPlanner?: BusinessModelEvolutionPlanner;
  businessModelRecommendationComposer?: BusinessModelRecommendationComposer;
  briefGenerator?: ExecutiveBusinessBriefGenerator;
  projection?: BusinessModelProjection;
  queries?: BusinessModelQueries;
  registry?: BusinessModelRegistry;
  repository?: BusinessModelRepository;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
