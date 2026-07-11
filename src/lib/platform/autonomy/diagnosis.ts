/**
 * Autonomous Executive Operating Loop — diagnosis.
 *
 * Determines root causes from observational signals and intelligence context.
 */

import type {
  AutonomyDiagnosisResult,
  AutonomyEscalationSeverity,
  AutonomyLoopRequest,
  AutonomyObservationResult,
  AutonomyRootCause,
  AutonomyRootCauseKind,
} from "@/lib/platform/autonomy/types";
import type { IntelligenceConfidenceScore } from "@/lib/platform/intelligence/types";

export interface AutonomyDiagnosisDependencies {
  createId?: (prefix: string) => string;
}

function confidence(value: number): IntelligenceConfidenceScore {
  const level =
    value >= 0.8 ? "high" : value >= 0.55 ? "medium" : ("low" as const);
  return { value, level, factors: [] };
}

function inferKind(signalTitle: string, signalKind: string): AutonomyRootCauseKind {
  const text = `${signalTitle} ${signalKind}`.toLowerCase();
  if (/cash|budget|receivable|financial|revenue/.test(text)) return "financial_pressure";
  if (/attendance|enrollment|academic|literacy|learning/.test(text)) {
    return "academic_performance";
  }
  if (/vacancy|staff|teacher|hr|capacity/.test(text)) return "staffing_capacity";
  if (/execution|goal|milestone|progress/.test(text)) return "execution_drift";
  if (/strategic|initiative|mission/.test(text)) return "strategic_misalignment";
  if (/compliance|finding|audit|policy/.test(text)) return "compliance_risk";
  if (/anomaly|monitor|operational/.test(text)) return "operational_anomaly";
  return "unknown";
}

function rankSeverity(severity: AutonomyEscalationSeverity): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity];
}

/**
 * DIAGNOSE — determine root causes from collected signals.
 */
export class AutonomyDiagnosis {
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: AutonomyDiagnosisDependencies = {}) {
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  diagnose(
    request: AutonomyLoopRequest,
    observation: AutonomyObservationResult
  ): AutonomyDiagnosisResult {
    const byKind = new Map<
      AutonomyRootCauseKind,
      {
        signals: string[];
        severity: AutonomyEscalationSeverity;
        titles: string[];
      }
    >();

    for (const signal of observation.signals) {
      const kind = inferKind(signal.title, signal.kind);
      const existing = byKind.get(kind);
      if (!existing) {
        byKind.set(kind, {
          signals: [signal.signalId],
          severity: signal.severity,
          titles: [signal.title],
        });
      } else {
        existing.signals.push(signal.signalId);
        existing.titles.push(signal.title);
        if (rankSeverity(signal.severity) > rankSeverity(existing.severity)) {
          existing.severity = signal.severity;
        }
      }
    }

    if (
      request.strategic?.analysis.opportunities.some(
        (o) => o.priority === "critical" || o.priority === "high"
      )
    ) {
      const existing = byKind.get("strategic_misalignment");
      if (!existing) {
        byKind.set("strategic_misalignment", {
          signals: [],
          severity: "high",
          titles: ["Strategic opportunity pressure"],
        });
      }
    }

    const causes: AutonomyRootCause[] = Array.from(byKind.entries()).map(
      ([kind, data]) => ({
        causeId: this.createId("cause"),
        kind,
        title: data.titles[0] ?? kind.replaceAll("_", " "),
        explanation: `Diagnosed ${kind.replaceAll("_", " ")} from ${data.signals.length || 1} signal(s): ${data.titles.slice(0, 3).join("; ")}`,
        relatedSignalIds: data.signals,
        confidence: confidence(
          Math.min(0.9, 0.45 + data.signals.length * 0.1)
        ),
        severity: data.severity,
      })
    );

    causes.sort(
      (a, b) => rankSeverity(b.severity) - rankSeverity(a.severity)
    );

    if (causes.length === 0) {
      causes.push({
        causeId: this.createId("cause"),
        kind: "unknown",
        title: "No material root cause",
        explanation: "Observation did not surface priority signals requiring diagnosis.",
        relatedSignalIds: [],
        confidence: confidence(0.5),
        severity: "low",
      });
    }

    const primary = causes[0]!;
    const avgConfidence =
      causes.reduce((sum, c) => sum + c.confidence.value, 0) / causes.length;

    return {
      requestId: request.requestId,
      causes,
      primaryCauseId: primary.causeId,
      summary: `Primary cause: ${primary.title} (${primary.kind}); ${causes.length} cause(s) total`,
      confidence: confidence(avgConfidence),
    };
  }
}
