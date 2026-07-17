/**
 * Business Model Intelligence — BusinessModelIntelligenceEngine (Sprint 037).
 *
 * Orchestrates canvas, lean canvas, organization design, simulation, scenarios,
 * risks, opportunities, and evolution into a unified result.
 *
 * Distinct from organization-dna's BusinessModelEngine artifact builder.
 */

import type {
  BusinessModelCanvasBuilder as BusinessModelCanvasBuilderContract,
  BusinessModelDashboard as BusinessModelDashboardContract,
  BusinessModelDependencies,
  BusinessModelEvolutionPlanner as BusinessModelEvolutionPlannerContract,
  BusinessModelHealth as BusinessModelHealthContract,
  BusinessModelIntelligence as BusinessModelIntelligenceContract,
  BusinessModelIntelligenceEngine as BusinessModelIntelligenceEngineContract,
  BusinessModelOpportunityAnalyzer as BusinessModelOpportunityAnalyzerContract,
  BusinessModelProjection as BusinessModelProjectionContract,
  BusinessModelQueries as BusinessModelQueriesContract,
  BusinessModelRecommendationComposer as BusinessModelRecommendationComposerContract,
  BusinessModelRegistry as BusinessModelRegistryContract,
  BusinessModelRepository as BusinessModelRepositoryContract,
  BusinessModelRiskAnalyzer as BusinessModelRiskAnalyzerContract,
  BusinessModelScenarioPlanner as BusinessModelScenarioPlannerContract,
  BusinessModelSimulator as BusinessModelSimulatorContract,
  CompetitivePositionAnalyzer as CompetitivePositionAnalyzerContract,
  ExecutiveBusinessBriefGenerator as ExecutiveBusinessBriefGeneratorContract,
  LeanCanvasBuilder as LeanCanvasBuilderContract,
  OrganizationDesignEngine as OrganizationDesignEngineContract,
} from "@/lib/platform/intelligence/business-model/contracts";
import {
  BusinessModelCanvasBuilder,
  LeanCanvasBuilder,
} from "@/lib/platform/intelligence/business-model/canvas-intelligence";
import { OrganizationDesignEngine } from "@/lib/platform/intelligence/business-model/design-intelligence";
import { BusinessModelScenarioPlanner } from "@/lib/platform/intelligence/business-model/scenario-intelligence";
import { BusinessModelSimulator } from "@/lib/platform/intelligence/business-model/business-model-simulator";
import { BusinessModelRegistryStore } from "@/lib/platform/intelligence/business-model/business-model-registry";
import {
  BusinessModelDashboard,
  BusinessModelEvolutionPlanner,
  BusinessModelHealth,
  BusinessModelIntelligence,
  BusinessModelOpportunityAnalyzer,
  BusinessModelRecommendationComposer,
  BusinessModelRiskAnalyzer,
  CompetitivePositionAnalyzer,
  defaultBusinessModelConfidence,
  ExecutiveBusinessBriefGenerator,
} from "@/lib/platform/intelligence/business-model/business-model-intelligence";
import {
  BusinessModelProjection,
  BusinessModelQueries,
} from "@/lib/platform/intelligence/business-model/projection";
import { BusinessModelRepositoryStore } from "@/lib/platform/intelligence/business-model/repository";
import {
  defaultCreateId,
  defaultPeriodLabel,
  deriveBusinessModelBaseline,
  emptyBusinessModelScope,
} from "@/lib/platform/intelligence/business-model/models";
import {
  BUSINESS_MODEL_INTELLIGENCE_VERSION,
  type BusinessModelRequest,
  type BusinessModelResult,
} from "@/lib/platform/intelligence/business-model/types";

export type BusinessModelEngineDependencies = BusinessModelDependencies;

/**
 * BusinessModelIntelligenceEngine — core orchestrator for business model outputs.
 */
export class BusinessModelIntelligenceEngineImpl
  implements BusinessModelIntelligenceEngineContract
{
  private readonly businessModelIntelligence: BusinessModelIntelligenceContract;
  private readonly businessModelDashboard: BusinessModelDashboardContract;
  private readonly businessModelHealth: BusinessModelHealthContract;
  private readonly businessModelCanvasBuilder: BusinessModelCanvasBuilderContract;
  private readonly leanCanvasBuilder: LeanCanvasBuilderContract;
  private readonly organizationDesignEngine: OrganizationDesignEngineContract;
  private readonly businessModelSimulator: BusinessModelSimulatorContract;
  private readonly businessModelScenarioPlanner: BusinessModelScenarioPlannerContract;
  private readonly competitivePositionAnalyzer: CompetitivePositionAnalyzerContract;
  private readonly businessModelRiskAnalyzer: BusinessModelRiskAnalyzerContract;
  private readonly businessModelOpportunityAnalyzer: BusinessModelOpportunityAnalyzerContract;
  private readonly businessModelEvolutionPlanner: BusinessModelEvolutionPlannerContract;
  private readonly businessModelRecommendationComposer: BusinessModelRecommendationComposerContract;
  private readonly briefGenerator: ExecutiveBusinessBriefGeneratorContract;
  private readonly projectionEngine: BusinessModelProjectionContract;
  readonly queries: BusinessModelQueriesContract;
  readonly registry: BusinessModelRegistryContract;
  readonly repository: BusinessModelRepositoryContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(d: BusinessModelEngineDependencies = {}) {
    this.createId = d.createId ?? defaultCreateId;
    this.now = d.now ?? (() => new Date());
    this.businessModelIntelligence =
      d.businessModelIntelligence ?? new BusinessModelIntelligence();
    this.businessModelDashboard =
      d.businessModelDashboard ?? new BusinessModelDashboard();
    this.businessModelHealth = d.businessModelHealth ?? new BusinessModelHealth();
    this.businessModelCanvasBuilder =
      d.businessModelCanvasBuilder ?? new BusinessModelCanvasBuilder();
    this.leanCanvasBuilder = d.leanCanvasBuilder ?? new LeanCanvasBuilder();
    this.organizationDesignEngine =
      d.organizationDesignEngine ?? new OrganizationDesignEngine(this.createId);
    this.businessModelSimulator =
      d.businessModelSimulator ?? new BusinessModelSimulator(this.createId);
    this.businessModelScenarioPlanner =
      d.businessModelScenarioPlanner ??
      new BusinessModelScenarioPlanner(this.createId);
    this.competitivePositionAnalyzer =
      d.competitivePositionAnalyzer ?? new CompetitivePositionAnalyzer();
    this.businessModelRiskAnalyzer =
      d.businessModelRiskAnalyzer ??
      new BusinessModelRiskAnalyzer(this.createId);
    this.businessModelOpportunityAnalyzer =
      d.businessModelOpportunityAnalyzer ??
      new BusinessModelOpportunityAnalyzer(this.createId);
    this.businessModelEvolutionPlanner =
      d.businessModelEvolutionPlanner ??
      new BusinessModelEvolutionPlanner(this.createId);
    this.businessModelRecommendationComposer =
      d.businessModelRecommendationComposer ??
      new BusinessModelRecommendationComposer(this.createId);
    this.briefGenerator =
      d.briefGenerator ?? new ExecutiveBusinessBriefGenerator();
    this.projectionEngine = d.projection ?? new BusinessModelProjection();
    this.queries = d.queries ?? new BusinessModelQueries();
    this.registry = d.registry ?? new BusinessModelRegistryStore();
    this.repository = d.repository ?? new BusinessModelRepositoryStore();
  }

  build(request: BusinessModelRequest): BusinessModelResult {
    const now = this.now();
    const scope = request.scope ?? emptyBusinessModelScope();
    const dna = request.dna ?? request.dnaResult?.dna ?? null;

    // 1. Baseline + DNA alignment
    const baseline = deriveBusinessModelBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      request.predictionResult,
      request.financialSignal,
      request.revenueResult,
      request.fundingResult,
      request.opportunityResult,
      request.improvementResult,
      request.baselineOverrides
    );

    // 2. Canvases
    const canvas = this.businessModelCanvasBuilder.build({
      baseline,
      dna,
      now,
    });
    const leanCanvas = this.leanCanvasBuilder.build({ baseline, dna, now });

    // 3. Organization design
    const organizationDesign = this.organizationDesignEngine.analyze({
      baseline,
      now,
    });

    // 4. Scenarios
    const scenarios = this.businessModelScenarioPlanner.plan({
      baseline,
      design: organizationDesign,
      now,
    });

    // 5. Simulation + comparison
    const { simulations, comparison } = this.businessModelSimulator.simulate({
      baseline,
      design: organizationDesign,
      scenarios,
      now,
    });

    // 6. Competitive position, risks, opportunities
    const competitivePosition = this.competitivePositionAnalyzer.analyze({
      baseline,
      canvas,
      now,
    });
    const risks = this.businessModelRiskAnalyzer.analyze({
      baseline,
      canvas,
      design: organizationDesign,
      now,
    });
    const opportunities = this.businessModelOpportunityAnalyzer.analyze({
      baseline,
      canvas,
      leanCanvas,
      scenarios,
      now,
    });

    // 7. Evolution + recommendations
    const evolutionRoadmap = this.businessModelEvolutionPlanner.plan({
      baseline,
      opportunities,
      risks,
      scenarios,
      now,
    });
    const recommendations = this.businessModelRecommendationComposer.compose({
      opportunities,
      risks,
      roadmap: evolutionRoadmap,
      design: organizationDesign,
      now,
    });

    // 8. Scores + health + dashboard
    const scores = this.businessModelIntelligence.composeScores({
      baseline,
      canvas,
      leanCanvas,
      risks,
      opportunities,
      competitive: competitivePosition,
    });
    const businessModelHealth = this.businessModelHealth.assess({
      baseline,
      scores,
      canvas,
      competitive: competitivePosition,
    });
    const dashboard = this.businessModelDashboard.compose({
      scores,
      baseline,
      risks,
      opportunities,
      now,
    });

    // 9. Brief, projection, confidence, history → persist
    const confidence = defaultBusinessModelConfidence(
      baseline,
      canvas,
      leanCanvas
    );
    const brief = this.briefGenerator.generate({
      request,
      baseline,
      scores,
      risks,
      opportunities,
      scenarios,
      recommendations,
      confidence,
      now,
    });
    const projection = this.projectionEngine.project({
      request,
      healthScore: scores.healthScore,
      clarityScore: scores.clarityScore,
      scalabilityScore: scores.scalabilityScore,
      sustainabilityScore: scores.sustainabilityScore,
      canvas,
      leanCanvas,
      brief,
      confidence,
      dashboard,
      baseline,
    });

    const historyRecord = {
      id: this.createId("bm-history"),
      requestId: request.requestId,
      scope,
      status: "generated" as const,
      healthScore: scores.healthScore.value,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: BusinessModelResult = {
      requestId: request.requestId,
      version: BUSINESS_MODEL_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      clarityScore: scores.clarityScore,
      scalabilityScore: scores.scalabilityScore,
      sustainabilityScore: scores.sustainabilityScore,
      riskScore: scores.riskScore,
      businessModelHealth,
      canvas,
      leanCanvas,
      organizationDesign,
      simulations,
      comparison,
      scenarios,
      dashboard,
      competitivePosition,
      risks,
      opportunities,
      evolutionRoadmap,
      alternatives: organizationDesign.alternatives,
      brief,
      projection,
      confidence,
      recommendations,
      historyRecord,
      metadata: {
        ...(request.metadata ?? {}),
        registryPublishers: this.registry.list().length,
        decisionAligned: Boolean(request.decisionResult),
        predictionAligned: Boolean(request.predictionResult),
      },
    };

    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

/** Aliases matching Sprint naming (package-local; DNA owns BusinessModelEngine at platform barrel). */
export { BusinessModelIntelligenceEngineImpl as BusinessModelIntelligenceEngine };
export { BusinessModelIntelligenceEngineImpl as BusinessModelEngine };
export { BusinessModelIntelligenceEngineImpl as BusinessModelEngineImpl };
