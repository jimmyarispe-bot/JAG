/**
 * Decision Intelligence domain — public API.
 *
 * Strategic decision evaluation for JAG Intelligence.
 * Tenant-agnostic and reusable across all organizations.
 */

export {
  DECISION_APPROVAL_STATUSES,
  DECISION_EVIDENCE_KINDS,
  DECISION_IMPACT_DIMENSIONS,
  DECISION_INTELLIGENCE_VERSION,
  DECISION_PRIORITIES,
  DECISION_RISK_CATEGORIES,
  DECISION_SCENARIO_KINDS,
  type DecisionAlternative,
  type DecisionAlternativesResult,
  type DecisionAnalysisResult,
  type DecisionApproval,
  type DecisionApprovalStatus,
  type DecisionBrief,
  type DecisionEvidenceItem,
  type DecisionEvidenceKind,
  type DecisionEvidenceResult,
  type DecisionImpactAssessment,
  type DecisionImpactDimension,
  type DecisionImpactScore,
  type DecisionIntelligenceResult,
  type DecisionKpiSignal,
  type DecisionMetadata,
  type DecisionPriority,
  type DecisionRecommendation,
  type DecisionRequest,
  type DecisionRisk,
  type DecisionRiskCategory,
  type DecisionRisksResult,
  type DecisionScenario,
  type DecisionScenarioKind,
  type DecisionScenariosResult,
  type DecisionTimeline,
} from "@/lib/platform/intelligence/decision/types";

export {
  DecisionAnalysis,
  type DecisionAnalysisOptions,
} from "@/lib/platform/intelligence/decision/analysis";

export {
  DecisionEvidence,
  type DecisionEvidenceOptions,
} from "@/lib/platform/intelligence/decision/evidence";

export {
  DecisionAlternatives,
  type DecisionAlternativesOptions,
} from "@/lib/platform/intelligence/decision/alternatives";

export { DecisionRisks } from "@/lib/platform/intelligence/decision/risks";

export { DecisionScenarios } from "@/lib/platform/intelligence/decision/scenarios";

export {
  DecisionApprovals,
  type DecisionApprovalsOptions,
} from "@/lib/platform/intelligence/decision/approvals";

export {
  DecisionTimelineEstimator,
  type DecisionTimelineOptions,
} from "@/lib/platform/intelligence/decision/timeline";

export { DecisionRecommendations } from "@/lib/platform/intelligence/decision/recommendations";

export { DecisionImpact } from "@/lib/platform/intelligence/decision/impact";

export {
  DecisionBriefBuilder,
  type DecisionBriefOptions,
} from "@/lib/platform/intelligence/decision/brief";

export {
  DecisionResolver,
  type DecisionResolverDependencies,
} from "@/lib/platform/intelligence/decision/resolver";

import { DecisionAnalysis } from "@/lib/platform/intelligence/decision/analysis";
import { DecisionAlternatives } from "@/lib/platform/intelligence/decision/alternatives";
import { DecisionApprovals } from "@/lib/platform/intelligence/decision/approvals";
import { DecisionBriefBuilder } from "@/lib/platform/intelligence/decision/brief";
import { DecisionEvidence } from "@/lib/platform/intelligence/decision/evidence";
import { DecisionImpact } from "@/lib/platform/intelligence/decision/impact";
import { DecisionRecommendations } from "@/lib/platform/intelligence/decision/recommendations";
import { DecisionRisks } from "@/lib/platform/intelligence/decision/risks";
import { DecisionScenarios } from "@/lib/platform/intelligence/decision/scenarios";
import { DecisionResolver } from "@/lib/platform/intelligence/decision/resolver";
import { DecisionTimelineEstimator } from "@/lib/platform/intelligence/decision/timeline";

/**
 * Create a fully wired Decision Intelligence domain stack.
 */
export function createDecisionIntelligenceDomain(): DecisionResolver {
  return new DecisionResolver({
    evidence: new DecisionEvidence(),
    analysis: new DecisionAnalysis(),
    alternatives: new DecisionAlternatives(),
    risks: new DecisionRisks(),
    scenarios: new DecisionScenarios(),
    approvals: new DecisionApprovals(),
    timeline: new DecisionTimelineEstimator(),
    recommendations: new DecisionRecommendations(),
    impact: new DecisionImpact(),
    brief: new DecisionBriefBuilder(),
  });
}
