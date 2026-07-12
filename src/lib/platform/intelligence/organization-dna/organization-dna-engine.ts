/**
 * Organizational DNA Engine — core orchestrator (Sprint 030).
 */

import type {
  BusinessModelEngine as BusinessModelEngineContract,
  BusinessPlanBuilder as BusinessPlanBuilderContract,
  CompanyBuilder as CompanyBuilderContract,
  CompanyReadinessAssessmentEngine as CompanyReadinessAssessmentEngineContract,
  CustomerPersonaBuilder as CustomerPersonaBuilderContract,
  ExecutivePrioritiesBuilder as ExecutivePrioritiesBuilderContract,
  ExecutiveRoadmapBuilder as ExecutiveRoadmapBuilderContract,
  FundingModelBuilder as FundingModelBuilderContract,
  GoToMarketPlanner as GoToMarketPlannerContract,
  KpiRecommendationsBuilder as KpiRecommendationsBuilderContract,
  LeanCanvasGenerator as LeanCanvasGeneratorContract,
  OrganizationBlueprintBuilder as OrganizationBlueprintBuilderContract,
  OrganizationCapabilitiesBuilder as OrganizationCapabilitiesBuilderContract,
  OrganizationConstraintsBuilder as OrganizationConstraintsBuilderContract,
  OrganizationCultureBuilder as OrganizationCultureBuilderContract,
  OrganizationDnaComposer as OrganizationDnaComposerContract,
  OrganizationDnaDependencies,
  OrganizationDnaEngine as OrganizationDnaEngineContract,
  OrganizationDnaProjection as OrganizationDnaProjectionContract,
  OrganizationDnaQueries as OrganizationDnaQueriesContract,
  OrganizationDnaRepository as OrganizationDnaRepositoryContract,
  OrganizationLifecycle as OrganizationLifecycleContract,
  OrganizationMissionBuilder as OrganizationMissionBuilderContract,
  OrganizationProfileBuilder as OrganizationProfileBuilderContract,
  OrganizationStageDetector as OrganizationStageDetectorContract,
  OrganizationValuesBuilder as OrganizationValuesBuilderContract,
  OrganizationVisionBuilder as OrganizationVisionBuilderContract,
  OrganizationalGoalsBuilder as OrganizationalGoalsBuilderContract,
  OrganizationalScoreBuilder as OrganizationalScoreBuilderContract,
  ReadinessScoringEngine as ReadinessScoringEngineContract,
  RevenueModelBuilder as RevenueModelBuilderContract,
  SwotGenerator as SwotGeneratorContract,
  ValuePropositionBuilder as ValuePropositionBuilderContract,
} from "@/lib/platform/intelligence/organization-dna/contracts";
import { BusinessModelEngine as BusinessModelEngineImpl } from "@/lib/platform/intelligence/organization-dna/business-model-engine";
import { BusinessPlanBuilder as BusinessPlanBuilderImpl } from "@/lib/platform/intelligence/organization-dna/business-plan-builder";
import { CompanyBuilder as CompanyBuilderImpl } from "@/lib/platform/intelligence/organization-dna/company-builder";
import {
  CompanyReadinessAssessment as CompanyReadinessAssessmentImpl,
  ReadinessScoring as ReadinessScoringImpl,
} from "@/lib/platform/intelligence/organization-dna/company-readiness-assessment";
import { CustomerPersonaBuilder as CustomerPersonaBuilderImpl } from "@/lib/platform/intelligence/organization-dna/customer-persona-builder";
import {
  ExecutiveRoadmap as ExecutiveRoadmapImpl,
  OrganizationBlueprint as OrganizationBlueprintImpl,
} from "@/lib/platform/intelligence/organization-dna/executive-roadmap";
import { FundingModelBuilder as FundingModelBuilderImpl } from "@/lib/platform/intelligence/organization-dna/funding-model-builder";
import { GoToMarketPlanner as GoToMarketPlannerImpl } from "@/lib/platform/intelligence/organization-dna/go-to-market-planner";
import { LeanCanvasGenerator as LeanCanvasGeneratorImpl } from "@/lib/platform/intelligence/organization-dna/lean-canvas-generator";
import {
  deriveOrganizationDnaBaseline,
  levelFromValue,
  normalizeSeed,
} from "@/lib/platform/intelligence/organization-dna/models";
import { OrganizationCapabilities as OrganizationCapabilitiesImpl } from "@/lib/platform/intelligence/organization-dna/organization-capabilities";
import { OrganizationConstraints as OrganizationConstraintsImpl } from "@/lib/platform/intelligence/organization-dna/organization-constraints";
import { OrganizationCulture as OrganizationCultureImpl } from "@/lib/platform/intelligence/organization-dna/organization-culture";
import { OrganizationDnaComposer as OrganizationDnaComposerImpl } from "@/lib/platform/intelligence/organization-dna/organization-dna";
import { OrganizationLifecycle as OrganizationLifecycleImpl } from "@/lib/platform/intelligence/organization-dna/organization-lifecycle";
import { OrganizationMission as OrganizationMissionImpl } from "@/lib/platform/intelligence/organization-dna/organization-mission";
import {
  ExecutivePriorities as ExecutivePrioritiesImpl,
  KpiRecommendations as KpiRecommendationsImpl,
  OrganizationProfile as OrganizationProfileImpl,
  OrganizationalScore as OrganizationalScoreImpl,
} from "@/lib/platform/intelligence/organization-dna/organization-profile";
import { OrganizationStageDetector as OrganizationStageDetectorImpl } from "@/lib/platform/intelligence/organization-dna/organization-stage-detector";
import { OrganizationValues as OrganizationValuesImpl } from "@/lib/platform/intelligence/organization-dna/organization-values";
import { OrganizationVision as OrganizationVisionImpl } from "@/lib/platform/intelligence/organization-dna/organization-vision";
import { OrganizationalGoals as OrganizationalGoalsImpl } from "@/lib/platform/intelligence/organization-dna/organizational-goals";
import {
  OrganizationDnaProjection as OrganizationDnaProjectionImpl,
  OrganizationDnaQueries as OrganizationDnaQueriesImpl,
} from "@/lib/platform/intelligence/organization-dna/projection";
import { OrganizationDnaRepository as OrganizationDnaRepositoryStore } from "@/lib/platform/intelligence/organization-dna/repository";
import { RevenueModelBuilder as RevenueModelBuilderImpl } from "@/lib/platform/intelligence/organization-dna/revenue-model-builder";
import { SwotGenerator as SwotGeneratorImpl } from "@/lib/platform/intelligence/organization-dna/swot-generator";
import { ValuePropositionBuilder as ValuePropositionBuilderImpl } from "@/lib/platform/intelligence/organization-dna/value-proposition-builder";
import type {
  DnaConfidenceScore,
  OrganizationDnaRequest,
  OrganizationDnaResult,
} from "@/lib/platform/intelligence/organization-dna/types";
import type {
  Graph,
  GraphAnalysisResult,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface OrganizationDnaEngineDependencies
  extends OrganizationDnaDependencies {}

/**
 * OrganizationDnaEngine — orchestrates Company Builder + Organizational DNA outputs.
 */
export class OrganizationDnaEngineImpl implements OrganizationDnaEngineContract {
  private readonly stageDetector: OrganizationStageDetectorContract;
  private readonly lifecycle: OrganizationLifecycleContract;
  private readonly missionBuilder: OrganizationMissionBuilderContract;
  private readonly visionBuilder: OrganizationVisionBuilderContract;
  private readonly valuesBuilder: OrganizationValuesBuilderContract;
  private readonly cultureBuilder: OrganizationCultureBuilderContract;
  private readonly goalsBuilder: OrganizationalGoalsBuilderContract;
  private readonly constraintsBuilder: OrganizationConstraintsBuilderContract;
  private readonly capabilitiesBuilder: OrganizationCapabilitiesBuilderContract;
  private readonly personaBuilder: CustomerPersonaBuilderContract;
  private readonly valuePropositionBuilder: ValuePropositionBuilderContract;
  private readonly revenueModelBuilder: RevenueModelBuilderContract;
  private readonly fundingModelBuilder: FundingModelBuilderContract;
  private readonly goToMarketPlanner: GoToMarketPlannerContract;
  private readonly leanCanvasGenerator: LeanCanvasGeneratorContract;
  private readonly swotGenerator: SwotGeneratorContract;
  private readonly businessModelEngine: BusinessModelEngineContract;
  private readonly businessPlanBuilder: BusinessPlanBuilderContract;
  private readonly readinessAssessment: CompanyReadinessAssessmentEngineContract;
  private readonly readinessScoring: ReadinessScoringEngineContract;
  private readonly executiveRoadmap: ExecutiveRoadmapBuilderContract;
  private readonly organizationBlueprint: OrganizationBlueprintBuilderContract;
  private readonly organizationProfile: OrganizationProfileBuilderContract;
  private readonly organizationalScore: OrganizationalScoreBuilderContract;
  private readonly executivePriorities: ExecutivePrioritiesBuilderContract;
  private readonly kpiRecommendations: KpiRecommendationsBuilderContract;
  private readonly companyBuilder: CompanyBuilderContract;
  private readonly composer: OrganizationDnaComposerContract;
  private readonly projection: OrganizationDnaProjectionContract;
  private readonly repositoryStore: OrganizationDnaRepositoryContract;
  private readonly buildAndAnalyze:
    | ((input?: OrganizationDnaRequest["graphInput"]) => {
        graph: Graph;
        analysis: GraphAnalysisResult;
      })
    | null;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  readonly queries: OrganizationDnaQueriesContract;

  constructor(dependencies: OrganizationDnaEngineDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    this.now = now;
    this.createId = createId;
    this.buildAndAnalyze = dependencies.buildAndAnalyze ?? null;

    this.stageDetector =
      dependencies.stageDetector ?? new OrganizationStageDetectorImpl();
    this.lifecycle =
      dependencies.lifecycle ?? new OrganizationLifecycleImpl();
    this.missionBuilder =
      dependencies.organizationMission ?? new OrganizationMissionImpl();
    this.visionBuilder =
      dependencies.organizationVision ?? new OrganizationVisionImpl();
    this.valuesBuilder =
      dependencies.organizationValues ?? new OrganizationValuesImpl();
    this.cultureBuilder =
      dependencies.organizationCulture ?? new OrganizationCultureImpl();
    this.goalsBuilder =
      dependencies.organizationalGoals ?? new OrganizationalGoalsImpl();
    this.constraintsBuilder =
      dependencies.organizationConstraints ??
      new OrganizationConstraintsImpl();
    this.capabilitiesBuilder =
      dependencies.organizationCapabilities ??
      new OrganizationCapabilitiesImpl();
    this.personaBuilder =
      dependencies.customerPersonaBuilder ?? new CustomerPersonaBuilderImpl();
    this.valuePropositionBuilder =
      dependencies.valuePropositionBuilder ??
      new ValuePropositionBuilderImpl();
    this.revenueModelBuilder =
      dependencies.revenueModelBuilder ?? new RevenueModelBuilderImpl();
    this.fundingModelBuilder =
      dependencies.fundingModelBuilder ?? new FundingModelBuilderImpl();
    this.goToMarketPlanner =
      dependencies.goToMarketPlanner ?? new GoToMarketPlannerImpl();
    this.leanCanvasGenerator =
      dependencies.leanCanvasGenerator ?? new LeanCanvasGeneratorImpl();
    this.swotGenerator =
      dependencies.swotGenerator ?? new SwotGeneratorImpl();
    this.businessModelEngine =
      dependencies.businessModelEngine ?? new BusinessModelEngineImpl();
    this.businessPlanBuilder =
      dependencies.businessPlanBuilder ?? new BusinessPlanBuilderImpl();
    this.readinessAssessment =
      dependencies.readinessAssessment ?? new CompanyReadinessAssessmentImpl();
    this.readinessScoring =
      dependencies.readinessScoring ?? new ReadinessScoringImpl();
    this.executiveRoadmap =
      dependencies.executiveRoadmap ?? new ExecutiveRoadmapImpl();
    this.organizationBlueprint =
      dependencies.organizationBlueprint ?? new OrganizationBlueprintImpl();
    this.organizationProfile =
      dependencies.organizationProfile ?? new OrganizationProfileImpl();
    this.organizationalScore =
      dependencies.organizationalScore ?? new OrganizationalScoreImpl();
    this.executivePriorities =
      dependencies.executivePriorities ?? new ExecutivePrioritiesImpl();
    this.kpiRecommendations =
      dependencies.kpiRecommendations ?? new KpiRecommendationsImpl();
    this.companyBuilder =
      dependencies.companyBuilder ?? new CompanyBuilderImpl({ createId });
    this.composer =
      dependencies.composer ?? new OrganizationDnaComposerImpl();
    this.projection =
      dependencies.projection ?? new OrganizationDnaProjectionImpl();
    this.repositoryStore =
      dependencies.repository ?? new OrganizationDnaRepositoryStore();
    this.queries = dependencies.queries ?? new OrganizationDnaQueriesImpl();
  }

  get repository(): OrganizationDnaRepositoryContract {
    return this.repositoryStore;
  }

  build(request: OrganizationDnaRequest): OrganizationDnaResult {
    const now = this.now();
    let analysis = request.analysis ?? null;
    let graphInput = request.graphInput;

    if (!analysis && graphInput && this.buildAndAnalyze) {
      const built = this.buildAndAnalyze(graphInput);
      analysis = built.analysis;
    }

    const seed = normalizeSeed(request.seed);
    const baseline = deriveOrganizationDnaBaseline(
      analysis,
      graphInput,
      request.decisionResult?.baseline ?? null,
      request.predictionResult ?? null,
      request.governanceResult ?? null,
      seed,
      request.baselineOverrides
    );

    const stage = this.stageDetector.detect({
      seed,
      baseline,
      stageOverride: request.stageOverride,
    });
    const lifecycle = this.lifecycle.resolve({ stage });
    const confidence = this.scoreConfidence(request, analysis);

    const mission = this.missionBuilder.build({ seed, now });
    const vision = this.visionBuilder.build({ seed, stage, now });
    const values = this.valuesBuilder.build({
      seed,
      createId: this.createId,
      now,
    });
    const culture = this.cultureBuilder.build({ seed, stage, now });
    const goals = this.goalsBuilder.build({
      seed,
      stage,
      createId: this.createId,
      now,
    });
    const constraints = this.constraintsBuilder.build({
      seed,
      baseline,
      stage,
      createId: this.createId,
      now,
    });
    const capabilities = this.capabilitiesBuilder.build({
      seed,
      baseline,
      stage,
      createId: this.createId,
      now,
    });
    const personas = this.personaBuilder.build({
      seed,
      stage,
      createId: this.createId,
      now,
    });
    const valueProposition = this.valuePropositionBuilder.build({
      seed,
      personas,
      now,
    });
    const revenueModel = this.revenueModelBuilder.build({
      seed,
      stage,
      createId: this.createId,
      now,
    });
    const fundingModel = this.fundingModelBuilder.build({
      seed,
      stage,
      baseline,
      now,
    });
    const goToMarket = this.goToMarketPlanner.plan({
      seed,
      stage,
      personas,
      createId: this.createId,
      now,
    });
    const leanCanvas = this.leanCanvasGenerator.generate({
      seed,
      valueProposition,
      personas,
      revenueModel,
      goToMarket,
      now,
    });
    const swot = this.swotGenerator.generate({
      seed,
      baseline,
      stage,
      capabilities,
      constraints,
      now,
    });
    const businessModel = this.businessModelEngine.build({
      seed,
      stage,
      valueProposition,
      revenueModel,
      personas,
      now,
    });
    const readiness = this.readinessAssessment.assess({
      seed,
      baseline,
      stage,
      capabilities,
      constraints,
      createId: this.createId,
      now,
    });
    const scoring = this.readinessScoring.score({
      readiness,
      baseline,
      confidence,
    });
    const profile = this.organizationProfile.build({
      seed,
      stage,
      mission,
      vision,
      values,
      culture,
      goals,
      constraints,
      capabilities,
      personas,
      createId: this.createId,
      now,
    });
    const roadmap = this.executiveRoadmap.build({
      seed,
      stage,
      nextStage: lifecycle.next,
      readiness,
      createId: this.createId,
      now,
    });
    const blueprint = this.organizationBlueprint.build({
      seed,
      profile,
      stage,
      valueProposition,
      capabilities,
      readiness,
      now,
    });
    const businessPlan = this.businessPlanBuilder.build({
      seed,
      profile,
      businessModel,
      goToMarket,
      readiness,
      roadmap,
      swot,
      now,
    });
    const priorities = this.executivePriorities.build({
      seed,
      stage,
      readiness,
      swot,
      createId: this.createId,
      now,
    });
    const kpiRecommendations = this.kpiRecommendations.build({
      stage,
      businessModel,
      createId: this.createId,
      now,
    });
    const score = this.organizationalScore.build({
      baseline,
      readiness,
      scoring,
      stage,
    });

    // Compose DNA first (artifacts need DNA payload), then attach artifacts.
    const draftResult = this.composer.compose({
      request,
      baseline,
      stage,
      previousStage: lifecycle.previous,
      nextStage: lifecycle.next,
      profile,
      businessModel,
      leanCanvas,
      swot,
      valueProposition,
      revenueModel,
      fundingModel,
      goToMarket,
      readiness,
      scoring,
      blueprint,
      roadmap,
      businessPlan,
      priorities,
      score,
      kpiRecommendations,
      artifacts: [],
      confidence,
      now,
      createId: this.createId,
    });

    const artifacts = this.companyBuilder.build({
      request,
      seed,
      baseline,
      stage,
      profile,
      dna: draftResult.dna,
      now,
    });

    for (const artifact of artifacts) {
      this.repositoryStore.saveArtifact(artifact);
    }

    draftResult.artifacts = artifacts;
    draftResult.projection = this.projection.project({
      dna: draftResult.dna,
      artifacts,
    });

    this.repositoryStore.save(draftResult.dna);
    this.repositoryStore.saveHistory(draftResult.historyRecord);
    return draftResult;
  }

  private scoreConfidence(
    request: OrganizationDnaRequest,
    analysis: GraphAnalysisResult | null
  ): DnaConfidenceScore {
    const factors: DnaConfidenceScore["factors"] = [];
    let value = 0.4;

    if (request.seed) {
      factors.push({
        key: "seed",
        label: "Company Builder seed present",
        contribution: 0.18,
      });
      value += 0.18;
    }
    if (request.graphInput) {
      factors.push({
        key: "graph_input",
        label: "Upstream graph input present",
        contribution: 0.12,
      });
      value += 0.12;
    }
    if (analysis) {
      factors.push({
        key: "graph_analysis",
        label: "Executive graph analysis present",
        contribution: 0.1,
      });
      value += 0.1;
    }
    if (request.decisionResult) {
      factors.push({
        key: "decision",
        label: "Executive decision result present",
        contribution: 0.08,
      });
      value += 0.08;
    }
    if (request.predictionResult) {
      factors.push({
        key: "predictive",
        label: "Predictive intelligence present",
        contribution: 0.06,
      });
      value += 0.06;
    }
    if (request.governanceResult) {
      factors.push({
        key: "governance",
        label: "Board governance result present",
        contribution: 0.06,
      });
      value += 0.06;
    }

    value = Math.min(0.95, value);
    return {
      value,
      level: levelFromValue(value),
      factors,
    };
  }
}

export { OrganizationDnaEngineImpl as OrganizationDnaEngine };
