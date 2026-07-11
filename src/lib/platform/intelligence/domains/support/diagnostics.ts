/**
 * Support Intelligence — diagnostics engine.
 *
 * Generates ranked hypotheses for a classified support request.
 * Tenant-agnostic; does not call external systems or databases.
 */

import type { SupportClassifier } from "@/lib/platform/intelligence/domains/support/classifier";
import type {
  SupportCategory,
  SupportClassification,
  SupportDiagnosticSignal,
  SupportDiagnosticsResult,
  SupportHypothesis,
  SupportRequest,
} from "@/lib/platform/intelligence/domains/support/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

/** Template hypothesis used to seed category diagnostics. */
interface HypothesisTemplate {
  label: string;
  description: string;
  baseConfidence: number;
  suggestedChecks: string[];
}

const HYPOTHESIS_TEMPLATES: Record<SupportCategory, readonly HypothesisTemplate[]> = {
  authentication: [
    {
      label: "Expired or invalid credentials",
      description: "User credentials or reset token may be expired or incorrect",
      baseConfidence: 0.72,
      suggestedChecks: ["Verify auth status", "Check password reset token age", "Confirm account enabled"],
    },
    {
      label: "Session or cache issue",
      description: "Stale browser session or cached auth state may block login",
      baseConfidence: 0.55,
      suggestedChecks: ["Clear session cookies", "Retry in private window", "Check device clock"],
    },
    {
      label: "Permission or role mismatch",
      description: "Account authenticates but lacks required role for the surface",
      baseConfidence: 0.4,
      suggestedChecks: ["Inspect role assignments", "Confirm workspace access"],
    },
  ],
  payments: [
    {
      label: "Payment recorded but not reflected",
      description: "Payment may have posted without updating the visible balance",
      baseConfidence: 0.68,
      suggestedChecks: ["Confirm payment ledger entry", "Check posting job status", "Verify student linkage"],
    },
    {
      label: "Duplicate or reversed charge",
      description: "A reversal or duplicate may explain the discrepancy",
      baseConfidence: 0.48,
      suggestedChecks: ["Review recent payment events", "Check refund / void records"],
    },
  ],
  billing: [
    {
      label: "Invoice calculation mismatch",
      description: "Billing rules or scholarship application may be out of sync",
      baseConfidence: 0.6,
      suggestedChecks: ["Recalculate invoice preview", "Verify fee schedule version"],
    },
  ],
  scheduling: [
    {
      label: "Schedule conflict or stale roster",
      description: "Conflicting assignments or an outdated roster may block scheduling",
      baseConfidence: 0.65,
      suggestedChecks: ["Inspect schedule conflicts", "Refresh roster snapshot", "Verify section capacity"],
    },
  ],
  workflow: [
    {
      label: "Workflow transition blocked",
      description: "A guard condition or missing approval may stall the workflow",
      baseConfidence: 0.7,
      suggestedChecks: ["Inspect workflow instance state", "Verify required approvals", "Check automation run log"],
    },
  ],
  permissions: [
    {
      label: "Missing permission grant",
      description: "Role or permission set does not include the required key",
      baseConfidence: 0.74,
      suggestedChecks: ["Compare required vs granted permissions", "Confirm school scope"],
    },
  ],
  missing_records: [
    {
      label: "Record not created or filtered out",
      description: "The record may never have been created or is hidden by filters/RLS",
      baseConfidence: 0.62,
      suggestedChecks: ["Search by alternate identifiers", "Verify create audit", "Check active filters"],
    },
  ],
  synchronization: [
    {
      label: "Sync job failed or delayed",
      description: "An integration or projection sync may be behind or failed",
      baseConfidence: 0.7,
      suggestedChecks: ["Inspect last sync timestamp", "Review sync error log", "Trigger safe re-sync if allowed"],
    },
  ],
  reporting: [
    {
      label: "Report query returned empty set",
      description: "Filters, date range, or permissions may exclude all rows",
      baseConfidence: 0.66,
      suggestedChecks: ["Widen date range", "Verify report permissions", "Confirm source data exists"],
    },
  ],
  integrations: [
    {
      label: "External connector failure",
      description: "Upstream integration credentials or payload mapping may have failed",
      baseConfidence: 0.68,
      suggestedChecks: ["Check connector health", "Validate credentials", "Inspect last delivery status"],
    },
  ],
  student_information: [
    {
      label: "Student profile incomplete or mismatched",
      description: "Core student fields or linkages may be incomplete",
      baseConfidence: 0.58,
      suggestedChecks: ["Verify student identifiers", "Check enrollment status"],
    },
  ],
  attendance: [
    {
      label: "Attendance save or submission failed",
      description: "Attendance may not have persisted due to validation or session issues",
      baseConfidence: 0.64,
      suggestedChecks: ["Retry attendance submit", "Confirm class session open", "Check validation errors"],
    },
  ],
  communications: [
    {
      label: "Message delivery blocked",
      description: "Recipient scope or channel settings may block delivery",
      baseConfidence: 0.55,
      suggestedChecks: ["Verify recipient list", "Check channel enablement"],
    },
  ],
  notifications: [
    {
      label: "Notification queue not delivered",
      description: "Notification may be queued, suppressed, or failed",
      baseConfidence: 0.6,
      suggestedChecks: ["Inspect notification queue", "Confirm user notification prefs"],
    },
  ],
  email: [
    {
      label: "Email provider delivery failure",
      description: "Outbound email may have been rejected or delayed by the provider",
      baseConfidence: 0.63,
      suggestedChecks: ["Check email delivery status", "Verify recipient address"],
    },
  ],
  mobile: [
    {
      label: "Client app state issue",
      description: "Stale app cache or outdated client version may cause the issue",
      baseConfidence: 0.57,
      suggestedChecks: ["Update app", "Clear app cache", "Retry on stable network"],
    },
  ],
  performance: [
    {
      label: "Transient performance degradation",
      description: "Timeouts or slow queries may be causing the reported issue",
      baseConfidence: 0.5,
      suggestedChecks: ["Retry operation", "Note time of slowness", "Check concurrent load signals"],
    },
  ],
  general: [
    {
      label: "Insufficient information to specialize",
      description: "Request lacks cues for a specialized root cause",
      baseConfidence: 0.35,
      suggestedChecks: ["Ask clarifying questions", "Collect screenshots / error text", "Identify affected module"],
    },
  ],
};

/** Dependencies for the diagnostics engine. */
export interface SupportDiagnosticsDependencies {
  /** Optional classifier used when classification is not precomputed. */
  classifier?: SupportClassifier;
}

/**
 * Generates diagnostic hypotheses for support requests.
 */
export class SupportDiagnostics {
  private readonly classifier: SupportClassifier | null;

  /**
   * @param dependencies - Optional classifier for classify-then-diagnose flows.
   */
  constructor(dependencies: SupportDiagnosticsDependencies = {}) {
    this.classifier = dependencies.classifier ?? null;
  }

  /**
   * Generate ranked hypotheses for a request using an existing classification.
   * @param request - Support request under analysis.
   * @param classification - Prior classification result.
   */
  diagnose(
    request: SupportRequest,
    classification: SupportClassification
  ): SupportDiagnosticsResult {
    const signals = request.signals ?? [];
    const templates = HYPOTHESIS_TEMPLATES[classification.category];
    const hypotheses = templates.map((template, index) =>
      this.toHypothesis(request, classification, template, index, signals)
    );

    const ranked = [...hypotheses].sort(
      (a, b) => b.confidence.value - a.confidence.value
    );

    return {
      requestId: request.requestId,
      category: classification.category,
      hypotheses: ranked,
      primaryHypothesis: ranked[0] ?? null,
      signalsUsed: signals,
      notes: [
        `Generated ${ranked.length} hypothesis(es) for category "${classification.category}"`,
        // Domain pack does not execute live checks — callers supply signals.
        "Hypotheses are template-ranked; live probe results should adjust confidence later",
      ],
      metadata: request.metadata,
    };
  }

  /**
   * Classify (if a classifier was injected) then diagnose in one call.
   * @param request - Support request under analysis.
   * @throws Error when no classifier was injected and classification is required.
   */
  diagnoseRequest(request: SupportRequest): SupportDiagnosticsResult {
    if (!this.classifier) {
      throw new Error(
        "SupportDiagnostics.diagnoseRequest requires an injected SupportClassifier"
      );
    }
    const classification = this.classifier.classify(request);
    return this.diagnose(request, classification);
  }

  private toHypothesis(
    request: SupportRequest,
    classification: SupportClassification,
    template: HypothesisTemplate,
    index: number,
    signals: SupportDiagnosticSignal[]
  ): SupportHypothesis {
    const confidence = this.adjustConfidence(template.baseConfidence, signals, classification);

    return {
      hypothesisId: `${request.requestId}:hyp:${classification.category}:${index}`,
      label: template.label,
      description: template.description,
      confidence,
      evidenceRefs: request.evidenceRefs ?? [],
      domain: "success",
      category: classification.category,
      suggestedChecks: [...template.suggestedChecks],
      metadata: {
        baseConfidence: template.baseConfidence,
      },
    };
  }

  private adjustConfidence(
    base: number,
    signals: SupportDiagnosticSignal[],
    classification: SupportClassification
  ): IntelligenceConfidenceScore {
    const signalBoost = Math.min(0.2, signals.length * 0.04);
    const classificationBoost = classification.confidence.value * 0.15;
    const value = Math.min(1, Math.max(0, base + signalBoost + classificationBoost - 0.1));
    const level =
      value >= 0.75 ? "high" : value >= 0.45 ? "medium" : value > 0 ? "low" : "unknown";

    return {
      value,
      level,
      factors: [
        {
          key: "template_base",
          label: "Template Base Confidence",
          contribution: base,
          reason: "Category hypothesis template prior",
        },
        {
          key: "signal_boost",
          label: "Provided Signals",
          contribution: signalBoost,
          reason: `${signals.length} diagnostic signal(s) supplied with request`,
        },
        {
          key: "classification_alignment",
          label: "Classification Alignment",
          contribution: classificationBoost,
          reason: `Classification confidence ${classification.confidence.value.toFixed(2)}`,
        },
      ],
    };
  }
}
