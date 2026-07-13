import type { CollectiveDependencies, CollectiveEngine as Contract } from "@/lib/platform/intelligence/collective/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveCollectiveBaseline, emptyCollectiveScope, buildConfidence } from "@/lib/platform/intelligence/collective/models";
import { COLLECTIVE_AREAS, COLLECTIVE_INTELLIGENCE_VERSION, type CollectiveArea, type CollectiveAreaSuite, type CollectiveRequest, type CollectiveResult } from "@/lib/platform/intelligence/collective/types";
import { CollectiveReasoningIntelligence } from "@/lib/platform/intelligence/collective/collective-reasoning-intelligence";
import { ConsensusAnalysisIntelligence } from "@/lib/platform/intelligence/collective/consensus-analysis-intelligence";
import { DistributedExpertiseIntelligence } from "@/lib/platform/intelligence/collective/distributed-expertise-intelligence";
import { CollaborativeIntelligence } from "@/lib/platform/intelligence/collective/collaborative-intelligence-intelligence";
import { MultiDomainSynthesisIntelligence } from "@/lib/platform/intelligence/collective/multi-domain-synthesis-intelligence";
import { CrossFunctionalIntelligence } from "@/lib/platform/intelligence/collective/cross-functional-intelligence-intelligence";
import { OrganizationalAlignmentIntelligence } from "@/lib/platform/intelligence/collective/organizational-alignment-intelligence";
import { TeamDecisionIntelligence } from "@/lib/platform/intelligence/collective/team-decision-intelligence-intelligence";
import { ExpertWeightingIntelligence } from "@/lib/platform/intelligence/collective/expert-weighting-intelligence";
import { PerspectiveDiversityIntelligence } from "@/lib/platform/intelligence/collective/perspective-diversity-intelligence";
import { ConflictResolutionIntelligence } from "@/lib/platform/intelligence/collective/conflict-resolution-intelligence";
import { CollaborativeLearningIntelligence } from "@/lib/platform/intelligence/collective/collaborative-learning-intelligence";
import { OrganizationalCoordinationIntelligence } from "@/lib/platform/intelligence/collective/organizational-coordination-intelligence";
import { SharedDecisionQualityIntelligence } from "@/lib/platform/intelligence/collective/shared-decision-quality-intelligence";
import { CollectiveOpportunityDetectionIntelligence } from "@/lib/platform/intelligence/collective/collective-opportunity-detection-intelligence";
import { CollectiveRiskAssessmentIntelligence } from "@/lib/platform/intelligence/collective/collective-risk-assessment-intelligence";
import { CollectiveIntelligenceEvolutionIntelligence } from "@/lib/platform/intelligence/collective/collective-intelligence-evolution-intelligence";
import { CollectiveForecastEngine } from "@/lib/platform/intelligence/collective/collective-forecast-engine";
import { CollectiveScenarioEngine } from "@/lib/platform/intelligence/collective/collective-scenario-engine";
import { CollectiveTrendEngine } from "@/lib/platform/intelligence/collective/collective-trend-engine";
import { CollectiveAnalysisEngine } from "@/lib/platform/intelligence/collective/collective-analysis-engine";
import { ConsensusEngine } from "@/lib/platform/intelligence/collective/consensus-engine";
import { DistributedExpertiseEngine } from "@/lib/platform/intelligence/collective/distributed-expertise-engine";
import { CrossDomainSynthesisEngine } from "@/lib/platform/intelligence/collective/cross-domain-synthesis-engine";
import { CollaborationEngine } from "@/lib/platform/intelligence/collective/collaboration-engine";
import { ConflictResolutionEngine } from "@/lib/platform/intelligence/collective/conflict-resolution-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/collective/early-warning-engine";
import { CollectiveKnowledgeContributionEngine } from "@/lib/platform/intelligence/collective/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/collective/closed-learning-loop";
import { CollectiveReasoner } from "@/lib/platform/intelligence/collective/collective-reasoner";
import {
  CollectiveIntelligence, CollectiveRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, collectiveLens,
} from "@/lib/platform/intelligence/collective/collective-intelligence";
import { CollectiveProjection, CollectiveQueries } from "@/lib/platform/intelligence/collective/projection";
import { CollectiveRepositoryStore } from "@/lib/platform/intelligence/collective/repository";
import { CollectiveRegistryStore } from "@/lib/platform/intelligence/collective/collective-registry";

export class CollectiveIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private consensus; private distributedExpertise; private crossDomainSynthesis; private collaboration; private conflictResolution;
  private earlyWarning; private reasoner;

  constructor(d: CollectiveDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new CollectiveRepositoryStore();
    this.registry = d.registry ?? new CollectiveRegistryStore();
    this.queries = new CollectiveQueries();
    this.areas = {
      collective_reasoning: new CollectiveReasoningIntelligence(),
      consensus_analysis: new ConsensusAnalysisIntelligence(),
      distributed_expertise: new DistributedExpertiseIntelligence(),
      collaborative_intelligence: new CollaborativeIntelligence(),
      multi_domain_synthesis: new MultiDomainSynthesisIntelligence(),
      cross_functional_intelligence: new CrossFunctionalIntelligence(),
      organizational_alignment: new OrganizationalAlignmentIntelligence(),
      team_decision_intelligence: new TeamDecisionIntelligence(),
      expert_weighting: new ExpertWeightingIntelligence(),
      perspective_diversity: new PerspectiveDiversityIntelligence(),
      conflict_resolution: new ConflictResolutionIntelligence(),
      collaborative_learning: new CollaborativeLearningIntelligence(),
      organizational_coordination: new OrganizationalCoordinationIntelligence(),
      shared_decision_quality: new SharedDecisionQualityIntelligence(),
      collective_opportunity_detection: new CollectiveOpportunityDetectionIntelligence(),
      collective_risk_assessment: new CollectiveRiskAssessmentIntelligence(),
      collective_intelligence_evolution: new CollectiveIntelligenceEvolutionIntelligence(),
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new CollectiveForecastEngine();
    this.scenarios = d.scenarioEngine ?? new CollectiveScenarioEngine();
    this.trends = d.trendEngine ?? new CollectiveTrendEngine();
    this.analysis = d.analysisEngine ?? new CollectiveAnalysisEngine();
    this.consensus = d.consensusEngine ?? new ConsensusEngine();
    this.distributedExpertise = d.distributedExpertiseEngine ?? new DistributedExpertiseEngine();
    this.crossDomainSynthesis = d.crossDomainSynthesisEngine ?? new CrossDomainSynthesisEngine();
    this.collaboration = d.collaborationEngine ?? new CollaborationEngine();
    this.conflictResolution = d.conflictResolutionEngine ?? new ConflictResolutionEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new CollectiveReasoner();
  }

  build(request: CollectiveRequest): CollectiveResult {
    const now = this.now();
    const baseline = deriveCollectiveBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyCollectiveScope();
    const areaSuites = Object.fromEntries(
      COLLECTIVE_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<CollectiveArea, CollectiveAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const consensusSuite = this.consensus.assess({ baseline, areas: areaSuites, now, createId });
    const distributedExpertiseSuite = this.distributedExpertise.assess({ baseline, areas: areaSuites, now, createId });
    const crossDomainSynthesisSuite = this.crossDomainSynthesis.assess({ baseline, areas: areaSuites, now, createId });
    const collaborationSuite = this.collaboration.assess({ baseline, areas: areaSuites, now, createId });
    const conflictResolutionSuite = this.conflictResolution.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new CollectiveKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new CollectiveIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      consensusEngine: consensusSuite.score,
      distributedExpertiseEngine: distributedExpertiseSuite.score,
      crossDomainSynthesis: crossDomainSynthesisSuite.score,
      collaborationEngine: collaborationSuite.score,
      conflictResolutionEngine: conflictResolutionSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new CollectiveRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = collectiveLens("organization", health.overallScore);

    const consensusDashboard = {
      generatedAt: now.toISOString(),
      headline: `Consensus index ${Math.round(consensusSuite.consensusIndex)}`,
      score: consensusSuite.score,
      consensusIndex: consensusSuite.consensusIndex,
      signals: consensusSuite.records.slice(0, 4).map(r => r.title),
      narrative: consensusSuite.narrative,
    };
    const crossDomainIntelligenceDashboard = {
      generatedAt: now.toISOString(),
      headline: `Cross-domain synthesis ${Math.round(crossDomainSynthesisSuite.synthesisIndex)}`,
      score: crossDomainSynthesisSuite.score,
      synthesisIndex: crossDomainSynthesisSuite.synthesisIndex,
      signals: crossDomainSynthesisSuite.records.slice(0, 4).map(r => r.title),
      narrative: crossDomainSynthesisSuite.narrative,
    };
    const expertiseNetworkDashboard = {
      generatedAt: now.toISOString(),
      headline: `Expertise network ${Math.round(distributedExpertiseSuite.expertiseIndex)}`,
      score: distributedExpertiseSuite.score,
      expertiseIndex: distributedExpertiseSuite.expertiseIndex,
      signals: distributedExpertiseSuite.records.map(r => r.narrative),
      narrative: distributedExpertiseSuite.narrative,
    };
    const organizationalAlignmentDashboard = {
      generatedAt: now.toISOString(),
      headline: `Organizational alignment ${Math.round(areaSuites.organizational_alignment.score)}`,
      score: areaSuites.organizational_alignment.score,
      alignmentIndex: areaSuites.organizational_alignment.score,
      signals: areaSuites.organizational_alignment.records.map(r => r.signal),
      narrative: areaSuites.organizational_alignment.narrative,
    };
    const collaborationHealthDashboard = {
      generatedAt: now.toISOString(),
      headline: `Collaboration health ${Math.round(collaborationSuite.collaborationIndex)}`,
      score: collaborationSuite.score,
      collaborationIndex: collaborationSuite.collaborationIndex,
      signals: collaborationSuite.records.map(r => r.narrative),
      narrative: collaborationSuite.narrative,
    };
    const collectiveLearningDashboard = {
      generatedAt: now.toISOString(),
      headline: `Collaborative learning ${Math.round(areaSuites.collaborative_learning.score)}`,
      score: areaSuites.collaborative_learning.score,
      learningIndex: areaSuites.collaborative_learning.score,
      signals: areaSuites.collaborative_learning.records.map(r => r.signal),
      narrative: areaSuites.collaborative_learning.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: `Collective Forecast: ${forecastSuite.outlook}`,
      score: forecastSuite.maturityScore,
      outlook: forecastSuite.outlook,
      signals: forecastSuite.forecasts.slice(0, 4).map(f => f.narrative),
      narrative: forecastSuite.narrative,
    };
    const brief = {
      generatedAt: now.toISOString(),
      headline: dashboard.headline,
      summary: `${forecastSuite.narrative} ${scenarioSuite.narrative}`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      topRecommendations: recommendations.map(r => r.title),
      topRisks: risks.map(r => r.title),
      lenses: commonLens,
      narrative: dashboard.narrative,
    };
    const boardReport = {
      generatedAt: now.toISOString(),
      headline: `Board Report: ${dashboard.headline}`,
      assuranceSummary: `Evidence coverage ${Math.round(baseline.evidenceCoverage)}; primary scenario ${scenarioSuite.primaryScenario.replaceAll("_", " ")}.`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      consensusEngineScore: consensusSuite.score,
      collaborationEngineScore: collaborationSuite.score,
      crossDomainSynthesisScore: crossDomainSynthesisSuite.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on collective consensus strength, collaboration quality, cross-domain synthesis, and long-term collective value.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new CollectiveProjection().project({
      generatedAt: now.toISOString(),
      headline: brief.headline,
      healthScore: health.overallScore,
      areaScores: health.areaScores,
      outlook: forecastSuite.outlook,
      dashboard,
      brief,
      overallConfidence: confidence,
    });
    const historyRecord = {
      id: createId("col-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: CollectiveResult = {
      requestId: request.requestId,
      version: COLLECTIVE_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      collectiveReasoningScore: scores.areaScores.collective_reasoning,
      consensusAnalysisScore: scores.areaScores.consensus_analysis,
      distributedExpertiseScore: scores.areaScores.distributed_expertise,
      collaborativeIntelligenceScore: scores.areaScores.collaborative_intelligence,
      multiDomainSynthesisScore: scores.areaScores.multi_domain_synthesis,
      crossFunctionalIntelligenceScore: scores.areaScores.cross_functional_intelligence,
      organizationalAlignmentScore: scores.areaScores.organizational_alignment,
      teamDecisionIntelligenceScore: scores.areaScores.team_decision_intelligence,
      expertWeightingScore: scores.areaScores.expert_weighting,
      perspectiveDiversityScore: scores.areaScores.perspective_diversity,
      conflictResolutionScore: scores.areaScores.conflict_resolution,
      collaborativeLearningScore: scores.areaScores.collaborative_learning,
      organizationalCoordinationScore: scores.areaScores.organizational_coordination,
      sharedDecisionQualityScore: scores.areaScores.shared_decision_quality,
      collectiveOpportunityDetectionScore: scores.areaScores.collective_opportunity_detection,
      collectiveRiskAssessmentScore: scores.areaScores.collective_risk_assessment,
      collectiveIntelligenceEvolutionScore: scores.areaScores.collective_intelligence_evolution,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      consensusEngineScore: scores.consensusEngineScore,
      distributedExpertiseEngineScore: scores.distributedExpertiseEngineScore,
      crossDomainSynthesisScore: scores.crossDomainSynthesisScore,
      collaborationEngineScore: scores.collaborationEngineScore,
      conflictResolutionEngineScore: scores.conflictResolutionEngineScore,
      health,
      dashboard,
      consensusDashboard,
      crossDomainIntelligenceDashboard,
      expertiseNetworkDashboard,
      organizationalAlignmentDashboard,
      collaborationHealthDashboard,
      collectiveLearningDashboard,
      forecastDashboard,
      brief,
      boardReport,
      recommendations,
      risks,
      opportunities,
      areaSuites,
      trendSuite,
      forecastSuite,
      scenarioSuite,
      analysisSuite,
      consensusSuite,
      distributedExpertiseSuite,
      crossDomainSynthesisSuite,
      collaborationSuite,
      conflictResolutionSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("collective", "collective_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  CollectiveIntelligenceEngineImpl as CollectiveIntelligenceEngine,
  CollectiveIntelligenceEngineImpl as CollectiveEngine,
  CollectiveIntelligenceEngineImpl as CollectiveEngineImpl,
};
