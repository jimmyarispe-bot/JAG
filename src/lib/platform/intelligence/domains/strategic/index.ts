/**
 * Strategic Intelligence domain — public API.
 *
 * Converts intelligence findings into strategic goals, objectives,
 * initiatives, ownership, execution tracking, impact, and briefs.
 * Tenant-agnostic and reusable across all organizations.
 */

export {
  STRATEGIC_EXECUTION_STATUSES,
  STRATEGIC_GOAL_PRIORITIES,
  STRATEGIC_GOAL_STATUSES,
  STRATEGIC_IMPACT_DIMENSIONS,
  STRATEGIC_INTELLIGENCE_VERSION,
  STRATEGIC_MEASUREMENT_FREQUENCIES,
  STRATEGIC_OPPORTUNITY_KINDS,
  STRATEGIC_URGENCY_LEVELS,
  type StrategicAnalysisResult,
  type StrategicBrief,
  type StrategicExecutionSnapshot,
  type StrategicExecutionStatus,
  type StrategicFindingInput,
  type StrategicGoal,
  type StrategicGoalPriority,
  type StrategicGoalStatus,
  type StrategicImpactAssessment,
  type StrategicImpactDimension,
  type StrategicImpactScore,
  type StrategicInitiative,
  type StrategicIntelligenceResult,
  type StrategicMeasurementFrequency,
  type StrategicMetadata,
  type StrategicMilestone,
  type StrategicObjective,
  type StrategicOpportunity,
  type StrategicOpportunityKind,
  type StrategicOwners,
  type StrategicRecommendation,
  type StrategicRequest,
  type StrategicUrgency,
} from "@/lib/platform/intelligence/domains/strategic/types";

export {
  StrategicAnalysis,
  type StrategicAnalysisOptions,
} from "@/lib/platform/intelligence/domains/strategic/analysis";

export {
  StrategicGoals,
  type StrategicGoalsOptions,
} from "@/lib/platform/intelligence/domains/strategic/goals";

export {
  StrategicObjectives,
  type StrategicObjectivesOptions,
} from "@/lib/platform/intelligence/domains/strategic/objectives";

export {
  StrategicInitiatives,
  type StrategicInitiativesOptions,
} from "@/lib/platform/intelligence/domains/strategic/initiatives";

export {
  StrategicOwnersService,
  type StrategicOwnersOptions,
} from "@/lib/platform/intelligence/domains/strategic/owners";

export {
  StrategicExecution,
  type StrategicExecutionOptions,
} from "@/lib/platform/intelligence/domains/strategic/execution";

export {
  StrategicRecommendations,
  type StrategicRecommendationsOptions,
} from "@/lib/platform/intelligence/domains/strategic/recommendations";

export {
  StrategicImpact,
  type StrategicImpactOptions,
} from "@/lib/platform/intelligence/domains/strategic/impact";

export {
  StrategicBriefBuilder,
  type StrategicBriefOptions,
} from "@/lib/platform/intelligence/domains/strategic/brief";

export {
  StrategicResolver,
  type StrategicResolverDependencies,
} from "@/lib/platform/intelligence/domains/strategic/resolver";

import { StrategicAnalysis } from "@/lib/platform/intelligence/domains/strategic/analysis";
import { StrategicBriefBuilder } from "@/lib/platform/intelligence/domains/strategic/brief";
import { StrategicExecution } from "@/lib/platform/intelligence/domains/strategic/execution";
import { StrategicGoals } from "@/lib/platform/intelligence/domains/strategic/goals";
import { StrategicImpact } from "@/lib/platform/intelligence/domains/strategic/impact";
import { StrategicInitiatives } from "@/lib/platform/intelligence/domains/strategic/initiatives";
import { StrategicObjectives } from "@/lib/platform/intelligence/domains/strategic/objectives";
import { StrategicOwnersService } from "@/lib/platform/intelligence/domains/strategic/owners";
import { StrategicRecommendations } from "@/lib/platform/intelligence/domains/strategic/recommendations";
import { StrategicResolver } from "@/lib/platform/intelligence/domains/strategic/resolver";

/**
 * Create a fully wired Strategic Intelligence domain stack.
 */
export function createStrategicIntelligenceDomain(): StrategicResolver {
  return new StrategicResolver({
    analysis: new StrategicAnalysis(),
    goals: new StrategicGoals(),
    objectives: new StrategicObjectives(),
    initiatives: new StrategicInitiatives(),
    owners: new StrategicOwnersService(),
    execution: new StrategicExecution(),
    recommendations: new StrategicRecommendations(),
    impact: new StrategicImpact(),
    brief: new StrategicBriefBuilder(),
  });
}
