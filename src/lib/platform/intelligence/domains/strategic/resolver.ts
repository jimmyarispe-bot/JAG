/**
 * Strategic Intelligence — resolver.
 *
 * Coordinates analysis → goals → objectives → initiatives → owners →
 * execution → recommendations → impact → brief.
 */

import type { StrategicAnalysis } from "@/lib/platform/intelligence/domains/strategic/analysis";
import type { StrategicBriefBuilder } from "@/lib/platform/intelligence/domains/strategic/brief";
import type { StrategicExecution } from "@/lib/platform/intelligence/domains/strategic/execution";
import type { StrategicGoals } from "@/lib/platform/intelligence/domains/strategic/goals";
import type { StrategicImpact } from "@/lib/platform/intelligence/domains/strategic/impact";
import type { StrategicInitiatives } from "@/lib/platform/intelligence/domains/strategic/initiatives";
import type { StrategicObjectives } from "@/lib/platform/intelligence/domains/strategic/objectives";
import type { StrategicOwnersService } from "@/lib/platform/intelligence/domains/strategic/owners";
import type { StrategicRecommendations } from "@/lib/platform/intelligence/domains/strategic/recommendations";
import type {
  StrategicIntelligenceResult,
  StrategicRequest,
} from "@/lib/platform/intelligence/domains/strategic/types";
import { STRATEGIC_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/domains/strategic/types";

/** Injected collaborators for the strategic resolver. */
export interface StrategicResolverDependencies {
  analysis: StrategicAnalysis;
  goals: StrategicGoals;
  objectives: StrategicObjectives;
  initiatives: StrategicInitiatives;
  owners: StrategicOwnersService;
  execution: StrategicExecution;
  recommendations: StrategicRecommendations;
  impact: StrategicImpact;
  brief: StrategicBriefBuilder;
}

/**
 * Orchestrates the Strategic Intelligence workflow.
 *
 * Input: intelligence findings (via {@link StrategicRequest}).
 * Output: {@link StrategicIntelligenceResult}.
 */
export class StrategicResolver {
  private readonly analysis: StrategicAnalysis;
  private readonly goals: StrategicGoals;
  private readonly objectives: StrategicObjectives;
  private readonly initiatives: StrategicInitiatives;
  private readonly owners: StrategicOwnersService;
  private readonly execution: StrategicExecution;
  private readonly recommendations: StrategicRecommendations;
  private readonly impact: StrategicImpact;
  private readonly brief: StrategicBriefBuilder;

  constructor(dependencies: StrategicResolverDependencies) {
    this.analysis = dependencies.analysis;
    this.goals = dependencies.goals;
    this.objectives = dependencies.objectives;
    this.initiatives = dependencies.initiatives;
    this.owners = dependencies.owners;
    this.execution = dependencies.execution;
    this.recommendations = dependencies.recommendations;
    this.impact = dependencies.impact;
    this.brief = dependencies.brief;
  }

  /**
   * Run the full Strategic Intelligence workflow.
   */
  analyze(request: StrategicRequest): StrategicIntelligenceResult {
    const analysis = this.analysis.analyze(request);
    const goals = this.goals.createFromAnalysis(analysis);
    const objectives = this.objectives.createForGoals(goals, analysis.opportunities);
    const initiatives = this.initiatives.createForGoals(
      goals,
      objectives,
      analysis.opportunities
    );
    const owners = this.owners.assign(goals[0] ?? null, analysis.primaryOpportunity);
    const execution = this.execution.track(initiatives, objectives);
    const recommendations = this.recommendations.generate(analysis, goals);
    const impact = this.impact.assess(analysis.opportunities, goals, recommendations);
    const brief = this.brief.generate({
      request,
      analysis,
      goals,
      objectives,
      initiatives,
      owners,
      execution,
      recommendations,
      impact,
    });

    return {
      requestId: request.requestId,
      analysis,
      goals,
      objectives,
      initiatives,
      owners,
      execution,
      recommendations,
      impact,
      brief,
      domainVersion: STRATEGIC_INTELLIGENCE_VERSION,
      completedAt: new Date().toISOString(),
      metadata: request.metadata,
    };
  }
}
