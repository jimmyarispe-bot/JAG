/**
 * Decision Intelligence — resolver.
 *
 * Coordinates evidence → analysis → alternatives → risks → scenarios →
 * approvals → timeline → recommendations → impact → brief.
 */

import type { DecisionAnalysis } from "@/lib/platform/intelligence/decision/analysis";
import type { DecisionAlternatives } from "@/lib/platform/intelligence/decision/alternatives";
import type { DecisionApprovals } from "@/lib/platform/intelligence/decision/approvals";
import type { DecisionBriefBuilder } from "@/lib/platform/intelligence/decision/brief";
import type { DecisionEvidence } from "@/lib/platform/intelligence/decision/evidence";
import type { DecisionImpact } from "@/lib/platform/intelligence/decision/impact";
import type { DecisionRecommendations } from "@/lib/platform/intelligence/decision/recommendations";
import type { DecisionRisks } from "@/lib/platform/intelligence/decision/risks";
import type { DecisionScenarios } from "@/lib/platform/intelligence/decision/scenarios";
import type { DecisionTimelineEstimator } from "@/lib/platform/intelligence/decision/timeline";
import type {
  DecisionIntelligenceResult,
  DecisionRequest,
} from "@/lib/platform/intelligence/decision/types";
import { DECISION_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/decision/types";

/** Injected collaborators for the decision resolver. */
export interface DecisionResolverDependencies {
  evidence: DecisionEvidence;
  analysis: DecisionAnalysis;
  alternatives: DecisionAlternatives;
  risks: DecisionRisks;
  scenarios: DecisionScenarios;
  approvals: DecisionApprovals;
  timeline: DecisionTimelineEstimator;
  recommendations: DecisionRecommendations;
  impact: DecisionImpact;
  brief: DecisionBriefBuilder;
}

/**
 * Orchestrates the Decision Intelligence workflow.
 */
export class DecisionResolver {
  private readonly evidence: DecisionEvidence;
  private readonly analysis: DecisionAnalysis;
  private readonly alternatives: DecisionAlternatives;
  private readonly risks: DecisionRisks;
  private readonly scenarios: DecisionScenarios;
  private readonly approvals: DecisionApprovals;
  private readonly timeline: DecisionTimelineEstimator;
  private readonly recommendations: DecisionRecommendations;
  private readonly impact: DecisionImpact;
  private readonly brief: DecisionBriefBuilder;

  constructor(dependencies: DecisionResolverDependencies) {
    this.evidence = dependencies.evidence;
    this.analysis = dependencies.analysis;
    this.alternatives = dependencies.alternatives;
    this.risks = dependencies.risks;
    this.scenarios = dependencies.scenarios;
    this.approvals = dependencies.approvals;
    this.timeline = dependencies.timeline;
    this.recommendations = dependencies.recommendations;
    this.impact = dependencies.impact;
    this.brief = dependencies.brief;
  }

  /**
   * Run the full Decision Intelligence workflow.
   */
  analyze(request: DecisionRequest): DecisionIntelligenceResult {
    const evidence = this.evidence.collect(request);
    const analysis = this.analysis.analyze(request, evidence);
    const alternatives = this.alternatives.generate(request, analysis, evidence);
    const risks = this.risks.analyze(request, analysis);
    const scenarios = this.scenarios.generate(request, alternatives);
    const approval = this.approvals.create(request, analysis);
    const timeline = this.timeline.estimate(request, analysis, alternatives);
    const recommendation = this.recommendations.recommend(
      request,
      analysis,
      alternatives,
      risks
    );
    const recommendedAlternative =
      alternatives.alternatives.find(
        (a) => a.alternativeId === recommendation.recommendedAlternativeId
      ) ?? null;
    const impact = this.impact.assess(
      request,
      recommendation,
      risks,
      recommendedAlternative
    );
    const brief = this.brief.generate({
      request,
      analysis,
      evidence,
      alternatives,
      recommendation,
      risks,
      scenarios,
      impact,
      approval,
      timeline,
    });

    return {
      requestId: request.requestId,
      analysis,
      evidence,
      alternatives,
      risks,
      scenarios,
      approval,
      timeline,
      recommendation,
      impact,
      brief,
      domainVersion: DECISION_INTELLIGENCE_VERSION,
      completedAt: new Date().toISOString(),
      metadata: request.metadata,
    };
  }
}
