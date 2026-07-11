/**
 * Support Intelligence — guided resolution resolver.
 *
 * Builds a resolution plan from classification, diagnostics, and playbooks.
 * Coordinates domain services only — no UI, database, or external calls.
 */

import type { SupportClassifier } from "@/lib/platform/intelligence/domains/support/classifier";
import type { SupportDiagnostics } from "@/lib/platform/intelligence/domains/support/diagnostics";
import type { SupportFollowupService } from "@/lib/platform/intelligence/domains/support/followup";
import type { SupportPlaybooks } from "@/lib/platform/intelligence/domains/support/playbooks";
import type {
  SupportIntelligenceResult,
  SupportRequest,
  SupportResolutionPlan,
  SupportResolutionStep,
} from "@/lib/platform/intelligence/domains/support/types";
import { SUPPORT_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/domains/support/types";

/** Injected collaborators for the support resolver. */
export interface SupportResolverDependencies {
  classifier: SupportClassifier;
  diagnostics: SupportDiagnostics;
  playbooks: SupportPlaybooks;
  followup: SupportFollowupService;
}

/**
 * Builds guided resolution plans for support requests.
 */
export class SupportResolver {
  private readonly classifier: SupportClassifier;
  private readonly diagnostics: SupportDiagnostics;
  private readonly playbooks: SupportPlaybooks;
  private readonly followup: SupportFollowupService;

  /**
   * @param dependencies - Classifier, diagnostics, playbooks, and follow-up services.
   */
  constructor(dependencies: SupportResolverDependencies) {
    this.classifier = dependencies.classifier;
    this.diagnostics = dependencies.diagnostics;
    this.playbooks = dependencies.playbooks;
    this.followup = dependencies.followup;
  }

  /**
   * Analyze a support request and build a guided resolution plan.
   * @param request - Normalized support request.
   * @returns Resolution plan with classification, diagnostics, and playbook steps.
   */
  resolve(request: SupportRequest): SupportResolutionPlan {
    const classification = this.classifier.classify(request);
    const diagnostics = this.diagnostics.diagnose(request, classification);
    const playbook = this.playbooks.getPlaybook(classification.category);

    const steps: SupportResolutionStep[] = playbook.steps.map((step, index) => ({
      stepId: `${request.requestId}:step:${step.stepKey}`,
      playbookStepKey: step.stepKey,
      label: step.label,
      instruction: step.instruction,
      authority: step.authority,
      order: step.order,
      status: index === 0 ? "active" : "pending",
      metadata: step.metadata,
    }));

    const primary = diagnostics.primaryHypothesis;
    const summary = primary
      ? `Likely cause: ${primary.label}. Follow ${playbook.title} (${steps.length} steps).`
      : `Follow ${playbook.title} (${steps.length} steps).`;

    return {
      planId: `${request.requestId}:plan`,
      requestId: request.requestId,
      status: "ready",
      classification,
      diagnostics,
      playbook,
      steps,
      primaryHypothesis: primary,
      summary,
      createdAt: new Date().toISOString(),
      metadata: request.metadata,
    };
  }

  /**
   * Full Support Intelligence pass: resolve + schedule 7-day follow-up.
   * @param request - Normalized support request.
   * @returns Aggregate domain result including follow-up.
   */
  analyze(request: SupportRequest): SupportIntelligenceResult {
    const resolution = this.resolve(request);
    const followup = this.followup.schedule(resolution);

    return {
      requestId: request.requestId,
      classification: resolution.classification,
      diagnostics: resolution.diagnostics,
      resolution,
      followup,
      domainVersion: SUPPORT_INTELLIGENCE_VERSION,
      completedAt: new Date().toISOString(),
      metadata: request.metadata,
    };
  }
}
