/**
 * Innovation Intelligence Engine — Sprint 044 orchestrator.
 */

import type {
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
  InnovationSpecializedDashboards as InnovationSpecializedDashboardsContract,
  IntellectualPropertyIntelligence as IntellectualPropertyIntelligenceContract,
  ProcessInnovationIntelligence as ProcessInnovationIntelligenceContract,
  ProductServiceInnovationIntelligence as ProductServiceInnovationIntelligenceContract,
  ProofOfConceptIntelligence as ProofOfConceptIntelligenceContract,
  ResearchDevelopmentIntelligence as ResearchDevelopmentIntelligenceContract,
  StrategicRoadmapIntelligence as StrategicRoadmapIntelligenceContract,
  TechnologyAdoptionIntelligence as TechnologyAdoptionIntelligenceContract,
} from "@/lib/platform/intelligence/innovation/contracts";
import { AiOpportunityIntelligence } from "@/lib/platform/intelligence/innovation/ai-opportunity-intelligence";
import { ContinuousImprovementIntelligence } from "@/lib/platform/intelligence/innovation/continuous-improvement-intelligence";
import { EmergingTechnologyIntelligence } from "@/lib/platform/intelligence/innovation/emerging-technology-intelligence";
import { ExperimentManagementIntelligence } from "@/lib/platform/intelligence/innovation/experiment-management-intelligence";
import { IdeaManagementIntelligence } from "@/lib/platform/intelligence/innovation/idea-management-intelligence";
import { InnovationKnowledgeContributionEngine } from "@/lib/platform/intelligence/innovation/knowledge-contribution";
import { InnovationPortfolioIntelligence } from "@/lib/platform/intelligence/innovation/innovation-portfolio-intelligence";
import { InnovationReasoner } from "@/lib/platform/intelligence/innovation/innovation-reasoner";
import { InnovationRegistryStore } from "@/lib/platform/intelligence/innovation/innovation-registry";
import { IntellectualPropertyIntelligence } from "@/lib/platform/intelligence/innovation/intellectual-property-intelligence";
import { ProcessInnovationIntelligence } from "@/lib/platform/intelligence/innovation/process-innovation-intelligence";
import { ProductServiceInnovationIntelligence } from "@/lib/platform/intelligence/innovation/product-service-innovation-intelligence";
import { ProofOfConceptIntelligence } from "@/lib/platform/intelligence/innovation/proof-of-concept-intelligence";
import { ResearchDevelopmentIntelligence } from "@/lib/platform/intelligence/innovation/research-development-intelligence";
import { StrategicRoadmapIntelligence } from "@/lib/platform/intelligence/innovation/strategic-roadmap-intelligence";
import { TechnologyAdoptionIntelligence } from "@/lib/platform/intelligence/innovation/technology-adoption-intelligence";
import {
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
import {
  InnovationProjection,
  InnovationQueries,
} from "@/lib/platform/intelligence/innovation/projection";
import { InnovationRepositoryStore } from "@/lib/platform/intelligence/innovation/repository";
import {
  defaultCreateId,
  defaultPeriodLabel,
  deriveInnovationBaseline,
  emptyInnovationScope,
} from "@/lib/platform/intelligence/innovation/models";
import {
  INNOVATION_INTELLIGENCE_VERSION,
  type InnovationRequest,
  type InnovationResult,
  type PredictiveResultLight,
} from "@/lib/platform/intelligence/innovation/types";

export interface InnovationEngineDependencies extends InnovationDependencies {}

export class InnovationIntelligenceEngineImpl implements InnovationEngineContract {
  private readonly ideaManagementIntelligence: IdeaManagementIntelligenceContract;
  private readonly researchDevelopmentIntelligence: ResearchDevelopmentIntelligenceContract;
  private readonly productServiceInnovationIntelligence: ProductServiceInnovationIntelligenceContract;
  private readonly processInnovationIntelligence: ProcessInnovationIntelligenceContract;
  private readonly aiOpportunityIntelligence: AiOpportunityIntelligenceContract;
  private readonly technologyAdoptionIntelligence: TechnologyAdoptionIntelligenceContract;
  private readonly emergingTechnologyIntelligence: EmergingTechnologyIntelligenceContract;
  private readonly innovationPortfolioIntelligence: InnovationPortfolioIntelligenceContract;
  private readonly experimentManagementIntelligence: ExperimentManagementIntelligenceContract;
  private readonly proofOfConceptIntelligence: ProofOfConceptIntelligenceContract;
  private readonly intellectualPropertyIntelligence: IntellectualPropertyIntelligenceContract;
  private readonly continuousImprovementIntelligence: ContinuousImprovementIntelligenceContract;
  private readonly strategicRoadmapIntelligence: StrategicRoadmapIntelligenceContract;
  private readonly reasoner: InnovationReasonerContract;
  private readonly knowledgeContributionEngine: InnovationKnowledgeContributionEngineContract;
  private readonly intelligence: InnovationIntelligenceContract;
  private readonly health: InnovationHealthContract;
  private readonly dashboard: InnovationDashboardContract;
  private readonly specializedDashboards: InnovationSpecializedDashboardsContract;
  private readonly riskAnalyzer: InnovationRiskAnalyzerContract;
  private readonly opportunityAnalyzer: InnovationOpportunityAnalyzerContract;
  private readonly recommendationComposer: InnovationRecommendationComposerContract;
  private readonly briefGenerator: ExecutiveInnovationBriefGeneratorContract;
  private readonly projectionEngine: InnovationProjectionContract;
  readonly queries: InnovationQueriesContract;
  readonly registry: InnovationRegistryContract;
  readonly repository: InnovationRepositoryContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(d: InnovationEngineDependencies = {}) {
    this.createId = d.createId ?? defaultCreateId;
    this.now = d.now ?? (() => new Date());
    this.ideaManagementIntelligence = d.ideaManagementIntelligence ?? new IdeaManagementIntelligence();
    this.researchDevelopmentIntelligence =
      d.researchDevelopmentIntelligence ?? new ResearchDevelopmentIntelligence();
    this.productServiceInnovationIntelligence =
      d.productServiceInnovationIntelligence ?? new ProductServiceInnovationIntelligence();
    this.processInnovationIntelligence =
      d.processInnovationIntelligence ?? new ProcessInnovationIntelligence();
    this.aiOpportunityIntelligence = d.aiOpportunityIntelligence ?? new AiOpportunityIntelligence();
    this.technologyAdoptionIntelligence =
      d.technologyAdoptionIntelligence ?? new TechnologyAdoptionIntelligence();
    this.emergingTechnologyIntelligence =
      d.emergingTechnologyIntelligence ?? new EmergingTechnologyIntelligence();
    this.innovationPortfolioIntelligence =
      d.innovationPortfolioIntelligence ?? new InnovationPortfolioIntelligence();
    this.experimentManagementIntelligence =
      d.experimentManagementIntelligence ?? new ExperimentManagementIntelligence();
    this.proofOfConceptIntelligence = d.proofOfConceptIntelligence ?? new ProofOfConceptIntelligence();
    this.intellectualPropertyIntelligence =
      d.intellectualPropertyIntelligence ?? new IntellectualPropertyIntelligence();
    this.continuousImprovementIntelligence =
      d.continuousImprovementIntelligence ?? new ContinuousImprovementIntelligence();
    this.strategicRoadmapIntelligence =
      d.strategicRoadmapIntelligence ?? new StrategicRoadmapIntelligence();
    this.reasoner = d.reasoner ?? new InnovationReasoner();
    this.knowledgeContributionEngine =
      d.knowledgeContributionEngine ?? new InnovationKnowledgeContributionEngine();
    this.intelligence = d.intelligence ?? new InnovationIntelligence();
    this.health = d.health ?? new InnovationHealth();
    this.dashboard = d.dashboard ?? new InnovationDashboard();
    this.specializedDashboards = d.specializedDashboards ?? new InnovationSpecializedDashboards();
    this.riskAnalyzer = d.riskAnalyzer ?? new InnovationRiskAnalyzer(this.createId);
    this.opportunityAnalyzer = d.opportunityAnalyzer ?? new InnovationOpportunityAnalyzer(this.createId);
    this.recommendationComposer =
      d.recommendationComposer ?? new InnovationRecommendationComposer(this.createId);
    this.briefGenerator = d.briefGenerator ?? new ExecutiveInnovationBriefGenerator();
    this.projectionEngine = d.projection ?? new InnovationProjection();
    this.queries = d.queries ?? new InnovationQueries();
    this.registry = d.registry ?? new InnovationRegistryStore();
    this.repository = d.repository ?? new InnovationRepositoryStore();
  }

  build(request: InnovationRequest): InnovationResult {
    const now = this.now();
    const scope = request.scope ?? emptyInnovationScope();
    const dna = request.dna ?? request.dnaResult?.dna ?? null;
    const createId = this.createId;

    const baseline = deriveInnovationBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      toPredictiveLight(request.predictionResult),
      request.marketResult,
      request.opportunityResult,
      request.knowledgeResult,
      request.documentResult,
      request.businessModelResult,
      request.improvementResult,
      request.decisionResult,
      request.baselineOverrides
    );

    const ideaManagement = this.ideaManagementIntelligence.assess({ baseline, now, createId });
    const researchDevelopment = this.researchDevelopmentIntelligence.assess({
      baseline,
      ideaManagement,
      now,
      createId,
    });
    const productServiceInnovation = this.productServiceInnovationIntelligence.assess({
      baseline,
      researchDevelopment,
      now,
      createId,
    });
    const processInnovation = this.processInnovationIntelligence.assess({
      baseline,
      productServiceInnovation,
      now,
      createId,
    });
    const aiOpportunity = this.aiOpportunityIntelligence.assess({
      baseline,
      processInnovation,
      now,
      createId,
    });
    const technologyAdoption = this.technologyAdoptionIntelligence.assess({
      baseline,
      aiOpportunity,
      now,
      createId,
    });
    const emergingTechnology = this.emergingTechnologyIntelligence.assess({
      baseline,
      technologyAdoption,
      now,
      createId,
    });
    const innovationPortfolio = this.innovationPortfolioIntelligence.assess({
      baseline,
      ideaManagement,
      researchDevelopment,
      productServiceInnovation,
      now,
      createId,
    });
    const experimentManagement = this.experimentManagementIntelligence.assess({
      baseline,
      ideaManagement,
      innovationPortfolio,
      now,
      createId,
    });
    const proofOfConcept = this.proofOfConceptIntelligence.assess({
      baseline,
      experimentManagement,
      now,
      createId,
    });
    const intellectualProperty = this.intellectualPropertyIntelligence.assess({
      baseline,
      productServiceInnovation,
      researchDevelopment,
      now,
      createId,
    });
    const continuousImprovement = this.continuousImprovementIntelligence.assess({
      baseline,
      processInnovation,
      experimentManagement,
      now,
      createId,
    });
    const strategicRoadmap = this.strategicRoadmapIntelligence.assess({
      baseline,
      innovationPortfolio,
      emergingTechnology,
      continuousImprovement,
      now,
      createId,
    });
    const knowledgeContribution = this.knowledgeContributionEngine.contribute({
      baseline,
      ideaManagement,
      experimentManagement,
      innovationPortfolio,
      strategicRoadmap,
      now,
      createId,
    });

    const reasoning = this.reasoner.reason({
      baseline,
      ideaManagement,
      experimentManagement,
      innovationPortfolio,
      strategicRoadmap,
      question: request.question,
      now,
    });

    const risks = this.riskAnalyzer.analyze({
      baseline,
      ideaManagement,
      experimentManagement,
      innovationPortfolio,
      intellectualProperty,
      now,
    });
    const opportunities = this.opportunityAnalyzer.analyze({
      baseline,
      aiOpportunity,
      emergingTechnology,
      continuousImprovement,
      knowledgeContribution,
      now,
    });
    const recommendations = this.recommendationComposer.compose({
      baseline,
      risks,
      opportunities,
      ideaManagement,
      experimentManagement,
      innovationPortfolio,
      strategicRoadmap,
      now,
    });

    const scores = this.intelligence.composeScores({
      baseline,
      ideaManagement,
      researchDevelopment,
      productServiceInnovation,
      processInnovation,
      aiOpportunity,
      technologyAdoption,
      emergingTechnology,
      innovationPortfolio,
      experimentManagement,
      proofOfConcept,
      intellectualProperty,
      continuousImprovement,
      strategicRoadmap,
      knowledgeContribution,
      reasoning,
      risks,
      opportunities,
    });
    const healthResult = this.health.assess({
      baseline,
      scores,
      ideaManagement,
      experimentManagement,
      innovationPortfolio,
    });
    const innovationPipeline = composeInnovationPipeline({ ideaManagement, now });
    const ideaBacklog = composeIdeaBacklog({ ideaManagement, now });
    const technologyRadar = composeTechnologyRadar({
      technologyAdoption,
      emergingTechnology,
      now,
      createId,
    });
    const innovationPortfolioResult = composeInnovationPortfolioResult({
      innovationPortfolio,
      now,
    });
    const dashboard = this.dashboard.compose({ scores, risks, opportunities, now });
    const pipelineDashboard = this.specializedDashboards.pipeline({
      ideaManagement,
      pipeline: innovationPipeline,
      now,
    });
    const experimentDashboard = this.specializedDashboards.experiment({
      experimentManagement,
      now,
    });
    const portfolioDashboard = this.specializedDashboards.portfolio({
      innovationPortfolio,
      now,
    });
    const radarDashboard = this.specializedDashboards.radar({
      technologyRadar,
      technologyAdoption,
      emergingTechnology,
      now,
    });
    const confidence = defaultInnovationConfidence({
      baseline,
      ideaManagement,
      experimentManagement,
      innovationPortfolio,
    });
    const brief = this.briefGenerator.generate({
      request,
      scores,
      risks,
      opportunities,
      ideaManagement,
      recommendations,
      confidence,
      now,
    });
    const projection = this.projectionEngine.project({
      request,
      scores,
      dashboard,
      pipelineDashboard,
      experimentDashboard,
      portfolioDashboard,
      radarDashboard,
      brief,
      confidence,
      baseline,
    });
    const historyRecord = {
      id: this.createId("inn-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: scores.healthScore.value,
      pipelineScore: scores.pipelineScore.value,
      portfolioScore: scores.portfolioScore.value,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: InnovationResult = {
      requestId: request.requestId,
      version: INNOVATION_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      pipelineScore: scores.pipelineScore,
      experimentScore: scores.experimentScore,
      portfolioScore: scores.portfolioScore,
      radarScore: scores.radarScore,
      ideaScore: scores.ideaScore,
      rdScore: scores.rdScore,
      productServiceScore: scores.productServiceScore,
      processScore: scores.processScore,
      aiOpportunityScore: scores.aiOpportunityScore,
      technologyAdoptionScore: scores.technologyAdoptionScore,
      emergingTechScore: scores.emergingTechScore,
      pocScore: scores.pocScore,
      ipScore: scores.ipScore,
      continuousImprovementScore: scores.continuousImprovementScore,
      roadmapScore: scores.roadmapScore,
      knowledgeScore: scores.knowledgeScore,
      health: healthResult,
      brief,
      projection,
      confidence,
      dashboard,
      innovationPipeline,
      ideaBacklog,
      experimentDashboard,
      innovationPortfolio: innovationPortfolioResult,
      technologyRadar,
      recommendations,
      risks,
      opportunities,
      historyRecord,
      ideaManagement,
      researchDevelopment,
      productServiceInnovation,
      processInnovation,
      aiOpportunity,
      technologyAdoption,
      emergingTechnology,
      innovationPortfolioSuite: innovationPortfolio,
      experimentManagement,
      proofOfConcept,
      intellectualProperty,
      continuousImprovement,
      strategicRoadmap,
      knowledgeContribution,
      reasoning,
      requestMetadata: {
        ...(request.metadata ?? {}),
        registryPublishers: this.registry.list().length,
        graphAligned: Boolean(request.graph),
        marketAligned: Boolean(request.marketResult),
        improvementAligned: Boolean(request.improvementResult),
        knowledgeAligned: Boolean(request.knowledgeResult),
      },
    };

    this.registry.register("innovation", "innovation_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export { InnovationIntelligenceEngineImpl as InnovationIntelligenceEngine };
export { InnovationIntelligenceEngineImpl as InnovationEngine };
export { InnovationIntelligenceEngineImpl as InnovationEngineImpl };

function toPredictiveLight(
  value: InnovationRequest["predictionResult"]
): PredictiveResultLight | null {
  if (!value) return null;
  const candidate = value as PredictiveResultLight;
  return {
    requestId: candidate.requestId,
    healthScore: candidate.healthScore,
    baseline: candidate.baseline,
    recommendations: candidate.recommendations,
  };
}
