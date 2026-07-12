/**
 * Innovation Intelligence — public API (Sprint 044 / 0.1.0).
 */

export {
  INNOVATION_INTELLIGENCE_VERSION,
  INNOVATION_CAPABILITIES,
  INNOVATION_HORIZONS,
  IDEA_STATUSES,
  EXPERIMENT_STATUSES,
  TECHNOLOGY_RADAR_RINGS,
  IP_KINDS,
  INNOVATION_CONFIDENCE_LEVELS,
  INNOVATION_PRIORITY_BANDS,
  INNOVATION_HEALTH_STATUSES,
  INNOVATION_ARTIFACT_STATUSES,
  type AiOpportunityRecord,
  type AiOpportunitySuite,
  type BusinessModelResultLight,
  type ContinuousImprovementRecord,
  type ContinuousImprovementSuite,
  type DecisionResultLight,
  type DocumentResultLight,
  type EmergingTechnologyRecord,
  type EmergingTechnologySuite,
  type ExecutiveInnovationBrief,
  type ExperimentDashboardResult,
  type ExperimentManagementSuite,
  type ExperimentRecord,
  type ExperimentStatus,
  type GraphScope,
  type IdeaBacklogResult,
  type IdeaManagementSuite,
  type IdeaRecord,
  type IdeaStatus,
  type ImprovementResultLight,
  type InnovationArtifactStatus,
  type InnovationBaseline,
  type InnovationCapability,
  type InnovationConfidenceLevel,
  type InnovationConfidenceScore,
  type InnovationDashboardResult,
  type InnovationHealthResult,
  type InnovationHealthStatus,
  type InnovationHistoryRecord,
  type InnovationHorizon,
  type InnovationKnowledgeContribution,
  type InnovationKnowledgeDraft,
  type InnovationLens,
  type InnovationMetadata,
  type InnovationOpportunityRecord,
  type InnovationPipelineResult,
  type InnovationPipelineStage,
  type InnovationPortfolioResult,
  type InnovationPortfolioSuite,
  type InnovationPriorityBand,
  type InnovationProjectionResult,
  type InnovationPublisher,
  type InnovationQueryRequest,
  type InnovationQueryResult,
  type InnovationReasoningResult,
  type InnovationRecommendationRecord,
  type InnovationRequest,
  type InnovationResult,
  type InnovationRiskRecord,
  type InnovationScore,
  type IntellectualPropertySuite,
  type IpAssetRecord,
  type IpKind,
  type KnowledgeResultLight,
  type MarketResultLight,
  type OpportunityResultLight,
  type PipelineDashboardResult,
  type PocRecord,
  type PortfolioDashboardResult,
  type PortfolioItemRecord,
  type PredictiveResultLight,
  type ProcessInnovationRecord,
  type ProcessInnovationSuite,
  type ProductServiceInnovationRecord,
  type ProductServiceInnovationSuite,
  type ProofOfConceptSuite,
  type RadarDashboardResult,
  type RdInitiativeRecord,
  type ResearchDevelopmentSuite,
  type RoadmapMilestoneRecord,
  type StrategicRoadmapSuite,
  type TechnologyAdoptionRecord,
  type TechnologyAdoptionSuite,
  type TechnologyRadarItem,
  type TechnologyRadarResult,
  type TechnologyRadarRing,
} from "@/lib/platform/intelligence/innovation/types";

export type {
  AiOpportunityIntelligence as AiOpportunityIntelligenceContract,
  ContinuousImprovementIntelligence as ContinuousImprovementIntelligenceContract,
  EmergingTechnologyIntelligence as EmergingTechnologyIntelligenceContract,
  ExecutiveInnovationBriefGenerator as ExecutiveInnovationBriefGeneratorContract,
  ExperimentManagementIntelligence as ExperimentManagementIntelligenceContract,
  IdeaManagementIntelligence as IdeaManagementIntelligenceContract,
  InnovationDashboard as InnovationDashboardContract,
  InnovationDependencies,
  InnovationEngine as InnovationEngineContract,
  InnovationHealth as InnovationHealthContract,
  InnovationIntelligence as InnovationIntelligenceContract,
  InnovationIntelligenceEngine as InnovationIntelligenceEngineContract,
  InnovationIntelligenceService as InnovationIntelligenceServiceContract,
  InnovationKnowledgeContributionEngine as InnovationKnowledgeContributionEngineContract,
  InnovationOpportunityAnalyzer as InnovationOpportunityAnalyzerContract,
  InnovationPortfolioIntelligence as InnovationPortfolioIntelligenceContract,
  InnovationProjection as InnovationProjectionContract,
  InnovationQueries as InnovationQueriesContract,
  InnovationReasoner as InnovationReasonerContract,
  InnovationRecommendationComposer as InnovationRecommendationComposerContract,
  InnovationRegistry as InnovationRegistryContract,
  InnovationRepository as InnovationRepositoryContract,
  InnovationRiskAnalyzer as InnovationRiskAnalyzerContract,
  InnovationService as InnovationServiceContract,
  InnovationSpecializedDashboards as InnovationSpecializedDashboardsContract,
  IntellectualPropertyIntelligence as IntellectualPropertyIntelligenceContract,
  ProcessInnovationIntelligence as ProcessInnovationIntelligenceContract,
  ProductServiceInnovationIntelligence as ProductServiceInnovationIntelligenceContract,
  ProofOfConceptIntelligence as ProofOfConceptIntelligenceContract,
  ResearchDevelopmentIntelligence as ResearchDevelopmentIntelligenceContract,
  StrategicRoadmapIntelligence as StrategicRoadmapIntelligenceContract,
  TechnologyAdoptionIntelligence as TechnologyAdoptionIntelligenceContract,
} from "@/lib/platform/intelligence/innovation/contracts";

export {
  buildConfidence,
  buildLens,
  clamp,
  clamp01,
  defaultCreateId,
  defaultInnovationBaseline,
  defaultPeriodLabel,
  deriveInnovationBaseline,
  emptyInnovationScope,
  innovationModels,
  InnovationModels,
  levelFromValue,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/innovation/models";

export { IdeaManagementIntelligence } from "@/lib/platform/intelligence/innovation/idea-management-intelligence";
export { ResearchDevelopmentIntelligence } from "@/lib/platform/intelligence/innovation/research-development-intelligence";
export { ProductServiceInnovationIntelligence } from "@/lib/platform/intelligence/innovation/product-service-innovation-intelligence";
export { ProcessInnovationIntelligence } from "@/lib/platform/intelligence/innovation/process-innovation-intelligence";
export { AiOpportunityIntelligence } from "@/lib/platform/intelligence/innovation/ai-opportunity-intelligence";
export { TechnologyAdoptionIntelligence } from "@/lib/platform/intelligence/innovation/technology-adoption-intelligence";
export { EmergingTechnologyIntelligence } from "@/lib/platform/intelligence/innovation/emerging-technology-intelligence";
export { InnovationPortfolioIntelligence } from "@/lib/platform/intelligence/innovation/innovation-portfolio-intelligence";
export { ExperimentManagementIntelligence } from "@/lib/platform/intelligence/innovation/experiment-management-intelligence";
export { ProofOfConceptIntelligence } from "@/lib/platform/intelligence/innovation/proof-of-concept-intelligence";
export { IntellectualPropertyIntelligence } from "@/lib/platform/intelligence/innovation/intellectual-property-intelligence";
export { ContinuousImprovementIntelligence } from "@/lib/platform/intelligence/innovation/continuous-improvement-intelligence";
export { StrategicRoadmapIntelligence } from "@/lib/platform/intelligence/innovation/strategic-roadmap-intelligence";
export { InnovationReasoner } from "@/lib/platform/intelligence/innovation/innovation-reasoner";
export { InnovationKnowledgeContributionEngine } from "@/lib/platform/intelligence/innovation/knowledge-contribution";
export {
  composeIdeaBacklog,
  composeInnovationPipeline,
  composeInnovationPortfolioResult,
  composeTechnologyRadar,
  defaultInnovationConfidence,
  ExecutiveInnovationBriefGenerator,
  InnovationDashboard,
  InnovationHealth,
  InnovationIntelligence,
  InnovationOpportunityAnalyzer,
  InnovationRecommendationComposer,
  InnovationRiskAnalyzer,
  InnovationSpecializedDashboards,
} from "@/lib/platform/intelligence/innovation/innovation-intelligence";
export {
  InnovationProjection,
  InnovationQueries,
} from "@/lib/platform/intelligence/innovation/projection";
export {
  InnovationRegistry,
  InnovationRegistryStore,
} from "@/lib/platform/intelligence/innovation/innovation-registry";
export {
  InnovationRepository,
  InnovationRepositoryStore,
} from "@/lib/platform/intelligence/innovation/repository";
export {
  InnovationEngine,
  InnovationEngineImpl,
  InnovationIntelligenceEngine,
  InnovationIntelligenceEngineImpl,
} from "@/lib/platform/intelligence/innovation/innovation-engine";
export {
  InnovationIntelligenceService,
  InnovationIntelligenceServiceImpl,
  InnovationService,
  InnovationServiceImpl,
} from "@/lib/platform/intelligence/innovation/service";

import { InnovationIntelligenceEngine } from "@/lib/platform/intelligence/innovation/innovation-engine";
import type { InnovationDependencies } from "@/lib/platform/intelligence/innovation/contracts";
import { InnovationIntelligenceService } from "@/lib/platform/intelligence/innovation/service";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";

export interface InnovationStack {
  service: InnovationIntelligenceService;
  engine: InnovationIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateInnovationOptions extends InnovationDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createInnovationIntelligence(options: CreateInnovationOptions = {}): InnovationStack {
  const wireDna = options.wireOrganizationDna !== false;
  const wireOios = options.wireOios !== false;
  const organizationDna =
    options.organizationDna ??
    (wireDna
      ? createOrganizationDnaIntelligence({
          ...(options.organizationDnaOptions ?? {}),
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        })
      : null);
  const oios =
    options.oios ??
    (wireOios
      ? createOiosOperatingSystem({
          ...(options.oiosOptions ?? {}),
          organizationDnaStack:
            options.oiosOptions?.organizationDnaStack ?? organizationDna ?? undefined,
          wireOrganizationDna: false,
        })
      : null);
  const engine = new InnovationIntelligenceEngine(options);
  const service = new InnovationIntelligenceService({ ...options, engine });

  return { service, engine, organizationDna, oios };
}
