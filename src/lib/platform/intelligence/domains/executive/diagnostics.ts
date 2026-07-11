/**
 * Executive Intelligence — diagnostics.
 *
 * Generates ranked hypotheses for classified executive requests.
 * Tenant-agnostic; no external calls.
 */

import type {
  ExecutiveCategory,
  ExecutiveClassification,
  ExecutiveDiagnosticSignal,
  ExecutiveDiagnosticsResult,
  ExecutiveHypothesis,
  ExecutiveRequest,
} from "@/lib/platform/intelligence/domains/executive/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

interface HypothesisTemplate {
  label: string;
  description: string;
  baseConfidence: number;
  suggestedChecks: string[];
}

const HYPOTHESIS_TEMPLATES: Record<ExecutiveCategory, readonly HypothesisTemplate[]> = {
  strategic: [
    {
      label: "Strategic goal drift",
      description: "Current trajectory may be diverging from stated strategic goals",
      baseConfidence: 0.62,
      suggestedChecks: ["Compare KPI trends to annual goals", "Review initiative status"],
    },
  ],
  risk: [
    {
      label: "Elevated organizational risk",
      description: "Leading indicators suggest rising operational or financial risk",
      baseConfidence: 0.7,
      suggestedChecks: ["Inspect open alerts", "Review cash and compliance signals"],
    },
  ],
  opportunity: [
    {
      label: "Underutilized growth opportunity",
      description: "Capacity or demand signals may support an expansion opportunity",
      baseConfidence: 0.58,
      suggestedChecks: ["Review enrollment pipeline", "Assess program capacity"],
    },
  ],
  forecast: [
    {
      label: "Forecast variance requiring attention",
      description: "Projected outcomes may diverge from plan under current trends",
      baseConfidence: 0.65,
      suggestedChecks: ["Compare forecast vs actuals", "Stress-test key assumptions"],
    },
  ],
  scenario: [
    {
      label: "Scenario sensitivity is high",
      description: "Outcomes change materially across plausible scenarios",
      baseConfidence: 0.6,
      suggestedChecks: ["Run best/base/worst scenarios", "Identify decision levers"],
    },
  ],
  summary: [
    {
      label: "Executive summary incomplete",
      description: "Key domains may be missing from the current briefing",
      baseConfidence: 0.55,
      suggestedChecks: ["Confirm KPI coverage", "Include risk and opportunity callouts"],
    },
  ],
  board: [
    {
      label: "Board pack gaps",
      description: "Board reporting may lack required evidence or narrative clarity",
      baseConfidence: 0.57,
      suggestedChecks: ["Verify board metric set", "Attach evidence summaries"],
    },
  ],
  enrollment: [
    {
      label: "Enrollment pressure",
      description: "Admissions or retention signals may threaten enrollment targets",
      baseConfidence: 0.68,
      suggestedChecks: ["Review funnel conversion", "Inspect churn / withdrawal rates"],
    },
  ],
  financial_health: [
    {
      label: "Financial health concern",
      description: "Cash, collections, or margin signals may require executive action",
      baseConfidence: 0.72,
      suggestedChecks: ["Review cash runway", "Inspect outstanding receivables"],
    },
  ],
  operations: [
    {
      label: "Operational bottleneck",
      description: "Staffing, scheduling, or workflow friction may be degrading performance",
      baseConfidence: 0.64,
      suggestedChecks: ["Inspect attendance and staffing", "Review workflow backlogs"],
    },
  ],
  compliance: [
    {
      label: "Compliance exposure",
      description: "Policy, licensure, or audit readiness may be at risk",
      baseConfidence: 0.66,
      suggestedChecks: ["Review open compliance alerts", "Confirm document expirations"],
    },
  ],
  general: [
    {
      label: "Insufficient executive context",
      description: "Request lacks cues for a specialized executive diagnosis",
      baseConfidence: 0.35,
      suggestedChecks: ["Clarify decision needed", "Collect KPI and timeframe context"],
    },
  ],
};

/**
 * Generates diagnostic hypotheses for executive requests.
 */
export class ExecutiveDiagnostics {
  /**
   * Generate ranked hypotheses for a classified executive request.
   */
  diagnose(
    request: ExecutiveRequest,
    classification: ExecutiveClassification
  ): ExecutiveDiagnosticsResult {
    const signals = request.signals ?? [];
    const templates = HYPOTHESIS_TEMPLATES[classification.category];
    const hypotheses = templates.map((template, index) =>
      this.toHypothesis(request, classification, template, index, signals)
    );
    const ranked = [...hypotheses].sort((a, b) => b.confidence.value - a.confidence.value);

    return {
      requestId: request.requestId,
      category: classification.category,
      hypotheses: ranked,
      primaryHypothesis: ranked[0] ?? null,
      signalsUsed: signals,
      notes: [
        `Generated ${ranked.length} hypothesis(es) for category "${classification.category}"`,
      ],
      metadata: request.metadata,
    };
  }

  private toHypothesis(
    request: ExecutiveRequest,
    classification: ExecutiveClassification,
    template: HypothesisTemplate,
    index: number,
    signals: ExecutiveDiagnosticSignal[]
  ): ExecutiveHypothesis {
    const confidence = this.adjustConfidence(template.baseConfidence, signals, classification);
    return {
      hypothesisId: `${request.requestId}:hyp:${classification.category}:${index}`,
      label: template.label,
      description: template.description,
      confidence,
      evidenceRefs: request.evidenceRefs ?? [],
      domain: "executive",
      category: classification.category,
      suggestedChecks: [...template.suggestedChecks],
    };
  }

  private adjustConfidence(
    base: number,
    signals: ExecutiveDiagnosticSignal[],
    classification: ExecutiveClassification
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
        },
        {
          key: "signal_boost",
          label: "Provided Signals",
          contribution: signalBoost,
        },
        {
          key: "classification_alignment",
          label: "Classification Alignment",
          contribution: classificationBoost,
        },
      ],
    };
  }
}
