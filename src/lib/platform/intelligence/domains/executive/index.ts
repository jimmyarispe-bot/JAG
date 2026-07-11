/**
 * Executive Intelligence domain — public API.
 *
 * Strategic executive request analysis for JAG Intelligence.
 * Tenant-agnostic and reusable across all organizations.
 */

export {
  EXECUTIVE_ANALYSIS_STATUSES,
  EXECUTIVE_CATEGORIES,
  EXECUTIVE_FOLLOWUP_DAYS,
  EXECUTIVE_FOLLOWUP_STATUSES,
  EXECUTIVE_INTELLIGENCE_VERSION,
  EXECUTIVE_SEVERITIES,
  type ExecutiveAnalysisResult,
  type ExecutiveAnalysisStatus,
  type ExecutiveBriefing,
  type ExecutiveCategory,
  type ExecutiveClassification,
  type ExecutiveDiagnosticSignal,
  type ExecutiveDiagnosticsResult,
  type ExecutiveFinding,
  type ExecutiveFollowup,
  type ExecutiveFollowupAction,
  type ExecutiveFollowupStatus,
  type ExecutiveHypothesis,
  type ExecutiveIntelligenceResult,
  type ExecutiveMetadata,
  type ExecutiveRecommendation,
  type ExecutiveRecommendationSet,
  type ExecutiveRequest,
  type ExecutiveSeverity,
} from "@/lib/platform/intelligence/domains/executive/types";

export {
  ExecutiveAnalysis,
  type ExecutiveAnalysisDependencies,
  type ExecutiveAnalysisOptions,
} from "@/lib/platform/intelligence/domains/executive/analysis";

export { ExecutiveDiagnostics } from "@/lib/platform/intelligence/domains/executive/diagnostics";

export {
  ExecutiveRecommendations,
  type ExecutiveRecommendationsOptions,
} from "@/lib/platform/intelligence/domains/executive/recommendations";

export {
  ExecutiveFollowups,
  type ExecutiveFollowupsOptions,
} from "@/lib/platform/intelligence/domains/executive/followups";

export {
  ExecutiveResolver,
  type ExecutiveResolverDependencies,
} from "@/lib/platform/intelligence/domains/executive/resolver";

import { ExecutiveAnalysis } from "@/lib/platform/intelligence/domains/executive/analysis";
import { ExecutiveDiagnostics } from "@/lib/platform/intelligence/domains/executive/diagnostics";
import { ExecutiveFollowups } from "@/lib/platform/intelligence/domains/executive/followups";
import { ExecutiveRecommendations } from "@/lib/platform/intelligence/domains/executive/recommendations";
import { ExecutiveResolver } from "@/lib/platform/intelligence/domains/executive/resolver";

/**
 * Create a fully wired Executive Intelligence domain stack.
 */
export function createExecutiveIntelligenceDomain(): ExecutiveResolver {
  const diagnostics = new ExecutiveDiagnostics();
  const analysis = new ExecutiveAnalysis({}, { diagnostics });
  const recommendations = new ExecutiveRecommendations();
  const followups = new ExecutiveFollowups();

  return new ExecutiveResolver({
    analysis,
    diagnostics,
    recommendations,
    followups,
  });
}
