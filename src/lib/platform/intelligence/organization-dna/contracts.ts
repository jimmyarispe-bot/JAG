/**
 * Organizational DNA & Company Builder — contracts / interfaces only (Sprint 030).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type {
  BusinessModel,
  BusinessPlan,
  CompanyBuilderArtifact,
  CompanyBuilderArtifactKind,
  CompanyBuilderSeed,
  CompanyReadinessAssessment,
  CustomerPersona,
  DnaConfidenceScore,
  ExecutivePriority,
  ExecutiveRoadmap,
  FundingModel,
  GoToMarketPlan,
  GraphScope,
  KpiRecommendation,
  LeanCanvas,
  OrganizationBlueprint,
  OrganizationCapabilities,
  OrganizationConstraints,
  OrganizationCulture,
  OrganizationDNA,
  OrganizationDnaBaseline,
  OrganizationDnaHistoryRecord,
  OrganizationDnaProjectionResult,
  OrganizationDnaQueryRequest,
  OrganizationDnaQueryResult,
  OrganizationDnaRequest,
  OrganizationDnaResult,
  OrganizationMission,
  OrganizationProfile,
  OrganizationStage,
  OrganizationValues,
  OrganizationVision,
  OrganizationalGoals,
  OrganizationalScore,
  ReadinessScoring,
  RevenueModel,
  SwotAnalysis,
  ValueProposition,
} from "@/lib/platform/intelligence/organization-dna/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";

export interface OrganizationDnaEngine {
  build(request: OrganizationDnaRequest): OrganizationDnaResult;
}

export interface CompanyBuilder {
  build(input: {
    request: OrganizationDnaRequest;
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    profile: OrganizationProfile;
    dna: OrganizationDNA;
    now: Date;
  }): CompanyBuilderArtifact[];
}

export interface OrganizationStageDetector {
  detect(input: {
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stageOverride?: OrganizationStage | null;
  }): OrganizationStage;
}

export interface OrganizationLifecycle {
  resolve(input: {
    stage: OrganizationStage;
  }): {
    previous: OrganizationStage | null;
    next: OrganizationStage | null;
    transitions: OrganizationStage[];
  };
}

export interface BusinessModelEngine {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    valueProposition: ValueProposition;
    revenueModel: RevenueModel;
    personas: CustomerPersona[];
    now: Date;
  }): BusinessModel;
}

export interface BusinessPlanBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    profile: OrganizationProfile;
    businessModel: BusinessModel;
    goToMarket: GoToMarketPlan;
    readiness: CompanyReadinessAssessment;
    roadmap: ExecutiveRoadmap;
    swot: SwotAnalysis;
    now: Date;
  }): BusinessPlan;
}

export interface LeanCanvasGenerator {
  generate(input: {
    seed: CompanyBuilderSeed;
    valueProposition: ValueProposition;
    personas: CustomerPersona[];
    revenueModel: RevenueModel;
    goToMarket: GoToMarketPlan;
    now: Date;
  }): LeanCanvas;
}

export interface SwotGenerator {
  generate(input: {
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    capabilities: OrganizationCapabilities;
    constraints: OrganizationConstraints;
    now: Date;
  }): SwotAnalysis;
}

export interface ValuePropositionBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    personas: CustomerPersona[];
    now: Date;
  }): ValueProposition;
}

export interface CustomerPersonaBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    createId: (prefix: string) => string;
    now: Date;
  }): CustomerPersona[];
}

export interface RevenueModelBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    createId: (prefix: string) => string;
    now: Date;
  }): RevenueModel;
}

export interface FundingModelBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    baseline: OrganizationDnaBaseline;
    now: Date;
  }): FundingModel;
}

export interface GoToMarketPlanner {
  plan(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    personas: CustomerPersona[];
    createId: (prefix: string) => string;
    now: Date;
  }): GoToMarketPlan;
}

export interface CompanyReadinessAssessmentEngine {
  assess(input: {
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    capabilities: OrganizationCapabilities;
    constraints: OrganizationConstraints;
    createId: (prefix: string) => string;
    now: Date;
  }): CompanyReadinessAssessment;
}

export interface ReadinessScoringEngine {
  score(input: {
    readiness: CompanyReadinessAssessment;
    baseline: OrganizationDnaBaseline;
    confidence: DnaConfidenceScore;
  }): ReadinessScoring;
}

export interface ExecutiveRoadmapBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    nextStage: OrganizationStage | null;
    readiness: CompanyReadinessAssessment;
    createId: (prefix: string) => string;
    now: Date;
  }): ExecutiveRoadmap;
}

export interface OrganizationBlueprintBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    profile: OrganizationProfile;
    stage: OrganizationStage;
    valueProposition: ValueProposition;
    capabilities: OrganizationCapabilities;
    readiness: CompanyReadinessAssessment;
    now: Date;
  }): OrganizationBlueprint;
}

export interface OrganizationalGoalsBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    createId: (prefix: string) => string;
    now: Date;
  }): OrganizationalGoals;
}

export interface OrganizationConstraintsBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    createId: (prefix: string) => string;
    now: Date;
  }): OrganizationConstraints;
}

export interface OrganizationCapabilitiesBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    createId: (prefix: string) => string;
    now: Date;
  }): OrganizationCapabilities;
}

export interface OrganizationCultureBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    now: Date;
  }): OrganizationCulture;
}

export interface OrganizationMissionBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    now: Date;
  }): OrganizationMission;
}

export interface OrganizationVisionBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    now: Date;
  }): OrganizationVision;
}

export interface OrganizationValuesBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    createId: (prefix: string) => string;
    now: Date;
  }): OrganizationValues;
}

export interface OrganizationProfileBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    mission: OrganizationMission;
    vision: OrganizationVision;
    values: OrganizationValues;
    culture: OrganizationCulture;
    goals: OrganizationalGoals;
    constraints: OrganizationConstraints;
    capabilities: OrganizationCapabilities;
    personas: CustomerPersona[];
    createId: (prefix: string) => string;
    now: Date;
  }): OrganizationProfile;
}

export interface OrganizationalScoreBuilder {
  build(input: {
    baseline: OrganizationDnaBaseline;
    readiness: CompanyReadinessAssessment;
    scoring: ReadinessScoring;
    stage: OrganizationStage;
  }): OrganizationalScore;
}

export interface ExecutivePrioritiesBuilder {
  build(input: {
    seed: CompanyBuilderSeed;
    stage: OrganizationStage;
    readiness: CompanyReadinessAssessment;
    swot: SwotAnalysis;
    createId: (prefix: string) => string;
    now: Date;
  }): ExecutivePriority[];
}

export interface KpiRecommendationsBuilder {
  build(input: {
    stage: OrganizationStage;
    businessModel: BusinessModel;
    createId: (prefix: string) => string;
    now: Date;
  }): KpiRecommendation[];
}

export interface OrganizationDnaComposer {
  compose(input: {
    request: OrganizationDnaRequest;
    baseline: OrganizationDnaBaseline;
    stage: OrganizationStage;
    previousStage: OrganizationStage | null;
    nextStage: OrganizationStage | null;
    profile: OrganizationProfile;
    businessModel: BusinessModel;
    leanCanvas: LeanCanvas;
    swot: SwotAnalysis;
    valueProposition: ValueProposition;
    revenueModel: RevenueModel;
    fundingModel: FundingModel;
    goToMarket: GoToMarketPlan;
    readiness: CompanyReadinessAssessment;
    scoring: ReadinessScoring;
    blueprint: OrganizationBlueprint;
    roadmap: ExecutiveRoadmap;
    businessPlan: BusinessPlan;
    priorities: ExecutivePriority[];
    score: OrganizationalScore;
    kpiRecommendations: KpiRecommendation[];
    artifacts: CompanyBuilderArtifact[];
    confidence: DnaConfidenceScore;
    now: Date;
    createId: (prefix: string) => string;
  }): OrganizationDnaResult;
}

export interface OrganizationDnaQueries {
  ask(
    result: OrganizationDnaResult,
    request: OrganizationDnaQueryRequest
  ): OrganizationDnaQueryResult;
}

export interface OrganizationDnaProjection {
  project(input: {
    dna: OrganizationDNA;
    artifacts: CompanyBuilderArtifact[];
  }): OrganizationDnaProjectionResult;
}

export interface OrganizationDnaRepository {
  save(dna: OrganizationDNA): OrganizationDNA;
  get(dnaId: string): OrganizationDNA | null;
  list(scope?: Partial<GraphScope>): OrganizationDNA[];
  remove(dnaId: string): boolean;
  saveArtifact(artifact: CompanyBuilderArtifact): CompanyBuilderArtifact;
  listArtifacts(kinds?: CompanyBuilderArtifactKind[]): CompanyBuilderArtifact[];
  saveHistory(
    record: OrganizationDnaHistoryRecord
  ): OrganizationDnaHistoryRecord;
  listHistory(scope?: Partial<GraphScope>): OrganizationDnaHistoryRecord[];
  clear(): void;
}

export interface OrganizationService {
  build(request: OrganizationDnaRequest): OrganizationDnaResult;
  buildFromSeed(
    seed: CompanyBuilderSeed,
    options?: {
      graph?: Graph;
      analysis?: GraphAnalysisResult;
      graphInput?: GraphBuildInput;
      decisionResult?: ExecutiveDecisionResult;
      predictionResult?: PredictionResult;
      governanceResult?: GovernanceResult;
      baselineOverrides?: Partial<OrganizationDnaBaseline>;
      stageOverride?: OrganizationStage | null;
      scope?: GraphScope;
    }
  ): OrganizationDnaResult;
  query(
    result: OrganizationDnaResult,
    request: OrganizationDnaQueryRequest
  ): OrganizationDnaQueryResult;
  repository(): OrganizationDnaRepository;
}

/** DI bag for the full Organizational DNA & Company Builder stack. */
export interface OrganizationDnaDependencies {
  engine?: OrganizationDnaEngine;
  companyBuilder?: CompanyBuilder;
  stageDetector?: OrganizationStageDetector;
  lifecycle?: OrganizationLifecycle;
  businessModelEngine?: BusinessModelEngine;
  businessPlanBuilder?: BusinessPlanBuilder;
  leanCanvasGenerator?: LeanCanvasGenerator;
  swotGenerator?: SwotGenerator;
  valuePropositionBuilder?: ValuePropositionBuilder;
  customerPersonaBuilder?: CustomerPersonaBuilder;
  revenueModelBuilder?: RevenueModelBuilder;
  fundingModelBuilder?: FundingModelBuilder;
  goToMarketPlanner?: GoToMarketPlanner;
  readinessAssessment?: CompanyReadinessAssessmentEngine;
  readinessScoring?: ReadinessScoringEngine;
  executiveRoadmap?: ExecutiveRoadmapBuilder;
  organizationBlueprint?: OrganizationBlueprintBuilder;
  organizationalGoals?: OrganizationalGoalsBuilder;
  organizationConstraints?: OrganizationConstraintsBuilder;
  organizationCapabilities?: OrganizationCapabilitiesBuilder;
  organizationCulture?: OrganizationCultureBuilder;
  organizationMission?: OrganizationMissionBuilder;
  organizationVision?: OrganizationVisionBuilder;
  organizationValues?: OrganizationValuesBuilder;
  organizationProfile?: OrganizationProfileBuilder;
  organizationalScore?: OrganizationalScoreBuilder;
  executivePriorities?: ExecutivePrioritiesBuilder;
  kpiRecommendations?: KpiRecommendationsBuilder;
  composer?: OrganizationDnaComposer;
  queries?: OrganizationDnaQueries;
  projection?: OrganizationDnaProjection;
  repository?: OrganizationDnaRepository;
  /** Optional graph stack hooks. */
  buildAndAnalyze?: (input?: GraphBuildInput) => {
    graph: Graph;
    analysis: GraphAnalysisResult;
  };
  now?: () => Date;
  createId?: (prefix: string) => string;
}
