/**
 * Support Intelligence domain — public API.
 *
 * First JAG Intelligence domain pack: customer support request analysis.
 * Tenant-agnostic and reusable across all organizations.
 */

export {
  SUPPORT_CATEGORIES,
  SUPPORT_CHANNELS,
  SUPPORT_FOLLOWUP_DAYS,
  SUPPORT_FOLLOWUP_STATUSES,
  SUPPORT_INTELLIGENCE_VERSION,
  SUPPORT_RESOLUTION_STATUSES,
  SUPPORT_SEVERITIES,
  type SupportCategory,
  type SupportChannel,
  type SupportClassification,
  type SupportDiagnosticSignal,
  type SupportDiagnosticsResult,
  type SupportFollowup,
  type SupportFollowupStatus,
  type SupportHypothesis,
  type SupportIntelligenceResult,
  type SupportMetadata,
  type SupportPlaybook,
  type SupportPlaybookStep,
  type SupportRequest,
  type SupportResolutionPlan,
  type SupportResolutionStatus,
  type SupportResolutionStep,
  type SupportSeverity,
} from "@/lib/platform/intelligence/domains/support/types";

export {
  SupportClassifier,
  type SupportClassifierOptions,
} from "@/lib/platform/intelligence/domains/support/classifier";

export {
  SupportDiagnostics,
  type SupportDiagnosticsDependencies,
} from "@/lib/platform/intelligence/domains/support/diagnostics";

export {
  SupportPlaybooks,
  type SupportPlaybooksOptions,
} from "@/lib/platform/intelligence/domains/support/playbooks";

export {
  SupportResolver,
  type SupportResolverDependencies,
} from "@/lib/platform/intelligence/domains/support/resolver";

export {
  SupportFollowupService,
  type SupportFollowupOptions,
} from "@/lib/platform/intelligence/domains/support/followup";

import { SupportClassifier } from "@/lib/platform/intelligence/domains/support/classifier";
import { SupportDiagnostics } from "@/lib/platform/intelligence/domains/support/diagnostics";
import { SupportFollowupService } from "@/lib/platform/intelligence/domains/support/followup";
import { SupportPlaybooks } from "@/lib/platform/intelligence/domains/support/playbooks";
import { SupportResolver } from "@/lib/platform/intelligence/domains/support/resolver";

/**
 * Create a fully wired Support Intelligence domain stack with default services.
 * Useful for tests and callers that do not need custom DI.
 */
export function createSupportIntelligenceDomain(): SupportResolver {
  const classifier = new SupportClassifier();
  const diagnostics = new SupportDiagnostics({ classifier });
  const playbooks = new SupportPlaybooks();
  const followup = new SupportFollowupService();

  return new SupportResolver({
    classifier,
    diagnostics,
    playbooks,
    followup,
  });
}
