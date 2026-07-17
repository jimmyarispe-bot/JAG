/**
 * Innovation Intelligence — contracts only (Sprint 044).
 *
 * Leaf module: imports types only, never implementations.
 */

import type * as T from "@/lib/platform/intelligence/innovation/types";

export interface InnovationIntelligenceEngine {
  build(request: T.InnovationRequest): T.InnovationResult;
}

export type InnovationEngine = InnovationIntelligenceEngine;

export interface IdeaManagementIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): T.IdeaManagementSuite;
}

export interface ResearchDevelopmentIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    ideaManagement: T.IdeaManagementSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.ResearchDevelopmentSuite;
}

export interface ProductServiceInnovationIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    researchDevelopment: T.ResearchDevelopmentSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.ProductServiceInnovationSuite;
}

export interface ProcessInnovationIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    productServiceInnovation: T.ProductServiceInnovationSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.ProcessInnovationSuite;
}

export interface AiOpportunityIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    processInnovation: T.ProcessInnovationSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.AiOpportunitySuite;
}

export interface TechnologyAdoptionIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    aiOpportunity: T.AiOpportunitySuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.TechnologyAdoptionSuite;
}

export interface EmergingTechnologyIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    technologyAdoption: T.TechnologyAdoptionSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.EmergingTechnologySuite;
}

export interface InnovationPortfolioIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    ideaManagement: T.IdeaManagementSuite;
    researchDevelopment: T.ResearchDevelopmentSuite;
    productServiceInnovation: T.ProductServiceInnovationSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.InnovationPortfolioSuite;
}

export interface ExperimentManagementIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    ideaManagement: T.IdeaManagementSuite;
    innovationPortfolio: T.InnovationPortfolioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.ExperimentManagementSuite;
}

export interface ProofOfConceptIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    experimentManagement: T.ExperimentManagementSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.ProofOfConceptSuite;
}

export interface IntellectualPropertyIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    productServiceInnovation: T.ProductServiceInnovationSuite;
    researchDevelopment: T.ResearchDevelopmentSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.IntellectualPropertySuite;
}

export interface ContinuousImprovementIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    processInnovation: T.ProcessInnovationSuite;
    experimentManagement: T.ExperimentManagementSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.ContinuousImprovementSuite;
}

export interface StrategicRoadmapIntelligence {
  assess(input: {
    baseline: T.InnovationBaseline;
    innovationPortfolio: T.InnovationPortfolioSuite;
    emergingTechnology: T.EmergingTechnologySuite;
    continuousImprovement: T.ContinuousImprovementSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.StrategicRoadmapSuite;
}

export interface InnovationReasoner {
  reason(input: {
    baseline: T.InnovationBaseline;
    ideaManagement: T.IdeaManagementSuite;
    experimentManagement: T.ExperimentManagementSuite;
    innovationPortfolio: T.InnovationPortfolioSuite;
    strategicRoadmap: T.StrategicRoadmapSuite;
    question?: string;
    now: Date;
  }): T.InnovationReasoningResult;
}

export interface InnovationKnowledgeContributionEngine {
  contribute(input: {
    baseline: T.InnovationBaseline;
    ideaManagement: T.IdeaManagementSuite;
    experimentManagement: T.ExperimentManagementSuite;
    innovationPortfolio: T.InnovationPortfolioSuite;
    strategicRoadmap: T.StrategicRoadmapSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.InnovationKnowledgeContribution;
}

export interface InnovationIntelligence {
  composeScores(input: {
    baseline: T.InnovationBaseline;
    ideaManagement: T.IdeaManagementSuite;
    researchDevelopment: T.ResearchDevelopmentSuite;
    productServiceInnovation: T.ProductServiceInnovationSuite;
    processInnovation: T.ProcessInnovationSuite;
    aiOpportunity: T.AiOpportunitySuite;
    technologyAdoption: T.TechnologyAdoptionSuite;
    emergingTechnology: T.EmergingTechnologySuite;
    innovationPortfolio: T.InnovationPortfolioSuite;
    experimentManagement: T.ExperimentManagementSuite;
    proofOfConcept: T.ProofOfConceptSuite;
    intellectualProperty: T.IntellectualPropertySuite;
    continuousImprovement: T.ContinuousImprovementSuite;
    strategicRoadmap: T.StrategicRoadmapSuite;
    knowledgeContribution: T.InnovationKnowledgeContribution;
    reasoning: T.InnovationReasoningResult;
    risks: T.InnovationRiskRecord[];
    opportunities: T.InnovationOpportunityRecord[];
  }): {
    healthScore: T.InnovationScore;
    pipelineScore: T.InnovationScore;
    experimentScore: T.InnovationScore;
    portfolioScore: T.InnovationScore;
    radarScore: T.InnovationScore;
    ideaScore: T.InnovationScore;
    rdScore: T.InnovationScore;
    productServiceScore: T.InnovationScore;
    processScore: T.InnovationScore;
    aiOpportunityScore: T.InnovationScore;
    technologyAdoptionScore: T.InnovationScore;
    emergingTechScore: T.InnovationScore;
    pocScore: T.InnovationScore;
    ipScore: T.InnovationScore;
    continuousImprovementScore: T.InnovationScore;
    roadmapScore: T.InnovationScore;
    knowledgeScore: T.InnovationScore;
  };
}

export interface InnovationHealth {
  assess(input: {
    baseline: T.InnovationBaseline;
    scores: ReturnType<InnovationIntelligence["composeScores"]>;
    ideaManagement: T.IdeaManagementSuite;
    experimentManagement: T.ExperimentManagementSuite;
    innovationPortfolio: T.InnovationPortfolioSuite;
  }): T.InnovationHealthResult;
}

export interface InnovationDashboard {
  compose(input: {
    scores: ReturnType<InnovationIntelligence["composeScores"]>;
    risks: T.InnovationRiskRecord[];
    opportunities: T.InnovationOpportunityRecord[];
    now: Date;
  }): T.InnovationDashboardResult;
}

export interface InnovationSpecializedDashboards {
  pipeline(input: {
    ideaManagement: T.IdeaManagementSuite;
    pipeline: T.InnovationPipelineResult;
    now: Date;
  }): T.PipelineDashboardResult;
  experiment(input: {
    experimentManagement: T.ExperimentManagementSuite;
    now: Date;
  }): T.ExperimentDashboardResult;
  portfolio(input: {
    innovationPortfolio: T.InnovationPortfolioSuite;
    now: Date;
  }): T.PortfolioDashboardResult;
  radar(input: {
    technologyRadar: T.TechnologyRadarResult;
    technologyAdoption: T.TechnologyAdoptionSuite;
    emergingTechnology: T.EmergingTechnologySuite;
    now: Date;
  }): T.RadarDashboardResult;
}

export interface InnovationRiskAnalyzer {
  analyze(input: {
    baseline: T.InnovationBaseline;
    ideaManagement: T.IdeaManagementSuite;
    experimentManagement: T.ExperimentManagementSuite;
    innovationPortfolio: T.InnovationPortfolioSuite;
    intellectualProperty: T.IntellectualPropertySuite;
    now: Date;
  }): T.InnovationRiskRecord[];
}

export interface InnovationOpportunityAnalyzer {
  analyze(input: {
    baseline: T.InnovationBaseline;
    aiOpportunity: T.AiOpportunitySuite;
    emergingTechnology: T.EmergingTechnologySuite;
    continuousImprovement: T.ContinuousImprovementSuite;
    knowledgeContribution: T.InnovationKnowledgeContribution;
    now: Date;
  }): T.InnovationOpportunityRecord[];
}

export interface InnovationRecommendationComposer {
  compose(input: {
    baseline: T.InnovationBaseline;
    risks: T.InnovationRiskRecord[];
    opportunities: T.InnovationOpportunityRecord[];
    ideaManagement: T.IdeaManagementSuite;
    experimentManagement: T.ExperimentManagementSuite;
    innovationPortfolio: T.InnovationPortfolioSuite;
    strategicRoadmap: T.StrategicRoadmapSuite;
    now: Date;
  }): T.InnovationRecommendationRecord[];
}

export interface ExecutiveInnovationBriefGenerator {
  generate(input: {
    request: T.InnovationRequest;
    scores: ReturnType<InnovationIntelligence["composeScores"]>;
    risks: T.InnovationRiskRecord[];
    opportunities: T.InnovationOpportunityRecord[];
    ideaManagement: T.IdeaManagementSuite;
    recommendations: T.InnovationRecommendationRecord[];
    confidence: T.InnovationConfidenceScore;
    now: Date;
  }): T.ExecutiveInnovationBrief;
}

export interface InnovationProjection {
  project(input: {
    request: T.InnovationRequest;
    scores: ReturnType<InnovationIntelligence["composeScores"]>;
    dashboard: T.InnovationDashboardResult;
    pipelineDashboard: T.PipelineDashboardResult;
    experimentDashboard: T.ExperimentDashboardResult;
    portfolioDashboard: T.PortfolioDashboardResult;
    radarDashboard: T.RadarDashboardResult;
    brief: T.ExecutiveInnovationBrief;
    confidence: T.InnovationConfidenceScore;
    baseline: T.InnovationBaseline;
  }): T.InnovationProjectionResult;
}

export interface InnovationQueries {
  ask(result: T.InnovationResult, request: T.InnovationQueryRequest): T.InnovationQueryResult;
}

export interface InnovationRepository {
  save(result: T.InnovationResult): T.InnovationResult;
  get(requestId: string): T.InnovationResult | null;
  list(scope?: Partial<T.GraphScope>): T.InnovationResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.InnovationHistoryRecord): T.InnovationHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.InnovationHistoryRecord[];
  clear(): void;
}

export interface InnovationRegistry {
  register(domain: string, capability: string): void;
  list(): T.InnovationPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}

export interface InnovationIntelligenceService {
  build(request: T.InnovationRequest): T.InnovationResult;
  query(result: T.InnovationResult, request: T.InnovationQueryRequest): T.InnovationQueryResult;
  repository(): InnovationRepository;
}

export type InnovationService = InnovationIntelligenceService;

export interface InnovationDependencies {
  engine?: InnovationIntelligenceEngine;
  ideaManagementIntelligence?: IdeaManagementIntelligence;
  researchDevelopmentIntelligence?: ResearchDevelopmentIntelligence;
  productServiceInnovationIntelligence?: ProductServiceInnovationIntelligence;
  processInnovationIntelligence?: ProcessInnovationIntelligence;
  aiOpportunityIntelligence?: AiOpportunityIntelligence;
  technologyAdoptionIntelligence?: TechnologyAdoptionIntelligence;
  emergingTechnologyIntelligence?: EmergingTechnologyIntelligence;
  innovationPortfolioIntelligence?: InnovationPortfolioIntelligence;
  experimentManagementIntelligence?: ExperimentManagementIntelligence;
  proofOfConceptIntelligence?: ProofOfConceptIntelligence;
  intellectualPropertyIntelligence?: IntellectualPropertyIntelligence;
  continuousImprovementIntelligence?: ContinuousImprovementIntelligence;
  strategicRoadmapIntelligence?: StrategicRoadmapIntelligence;
  reasoner?: InnovationReasoner;
  knowledgeContributionEngine?: InnovationKnowledgeContributionEngine;
  intelligence?: InnovationIntelligence;
  health?: InnovationHealth;
  dashboard?: InnovationDashboard;
  specializedDashboards?: InnovationSpecializedDashboards;
  riskAnalyzer?: InnovationRiskAnalyzer;
  opportunityAnalyzer?: InnovationOpportunityAnalyzer;
  recommendationComposer?: InnovationRecommendationComposer;
  briefGenerator?: ExecutiveInnovationBriefGenerator;
  projection?: InnovationProjection;
  queries?: InnovationQueries;
  registry?: InnovationRegistry;
  repository?: InnovationRepository;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
