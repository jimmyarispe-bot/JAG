/**
 * Decision Intelligence — evidence collection.
 */

import type {
  DecisionEvidenceItem,
  DecisionEvidenceKind,
  DecisionEvidenceResult,
  DecisionRequest,
} from "@/lib/platform/intelligence/decision/types";

/** Options for evidence collection. */
export interface DecisionEvidenceOptions {
  createId?: (kind: DecisionEvidenceKind, index: number) => string;
}

/**
 * Collects KPIs, reports, findings, historical decisions, and execution results.
 */
export class DecisionEvidence {
  private readonly createId: (kind: DecisionEvidenceKind, index: number) => string;

  constructor(options: DecisionEvidenceOptions = {}) {
    this.createId =
      options.createId ??
      ((kind, index) => `decision-evidence:${kind}:${index}`);
  }

  collect(request: DecisionRequest): DecisionEvidenceResult {
    const items: DecisionEvidenceItem[] = [];
    let index = 0;

    for (const kpi of request.kpis ?? []) {
      items.push({
        evidenceId: this.createId("kpi", index++),
        kind: "kpi",
        title: kpi.label,
        summary: `${kpi.key}=${kpi.value}${kpi.unit ? ` ${kpi.unit}` : ""}${
          kpi.target !== undefined ? ` (target ${kpi.target})` : ""
        }`,
        weight: 0.8,
        sourceRef: kpi.key,
        metadata: kpi.metadata,
      });
    }

    for (const finding of request.findings ?? []) {
      items.push({
        evidenceId: this.createId("intelligence_finding", index++),
        kind: "intelligence_finding",
        title: "Intelligence finding",
        summary: finding,
        weight: 0.75,
      });
    }

    for (const goal of request.strategicGoals ?? request.strategic?.goals ?? []) {
      items.push({
        evidenceId: this.createId("strategic_goal", index++),
        kind: "strategic_goal",
        title: goal.title,
        summary: goal.description,
        weight: 0.85,
        sourceRef: goal.id,
      });
    }

    for (const progress of request.executionProgress ?? []) {
      items.push({
        evidenceId: this.createId("execution_result", index++),
        kind: "execution_result",
        title: `Execution ${progress.subjectKind} ${progress.subjectId}`,
        summary: `${progress.completionPercent}% complete, health ${progress.healthLabel}, risk ${progress.riskScore}`,
        weight: 0.7,
        sourceRef: progress.subjectId,
      });
    }

    for (const memory of request.memories ?? []) {
      items.push({
        evidenceId: this.createId("historical_decision", index++),
        kind: "historical_decision",
        title: `Memory ${memory.id}`,
        summary:
          memory.observations.slice(0, 2).join("; ") ||
          memory.recommendations.slice(0, 2).join("; ") ||
          "Historical intelligence memory",
        weight: 0.65,
        sourceRef: memory.id,
      });
    }

    if (request.sharedContext) {
      items.push({
        evidenceId: this.createId("shared_context", index++),
        kind: "shared_context",
        title: "Shared organizational context",
        summary: `Org ${request.sharedContext.scope.organizationId ?? "n/a"} / school ${request.sharedContext.scope.schoolId ?? "n/a"}`,
        weight: 0.6,
        sourceRef: request.sharedContext.requestId,
      });
    }

    for (const ref of request.evidenceRefs ?? []) {
      items.push({
        evidenceId: this.createId("report", index++),
        kind: "report",
        title: ref.label ?? ref.evidenceId,
        summary: ref.label ?? ref.evidenceId,
        weight: ref.weight ?? 0.55,
        sourceRef: ref.evidenceId,
      });
    }

    if (items.length === 0) {
      items.push({
        evidenceId: this.createId("report", 0),
        kind: "report",
        title: "Decision subject",
        summary: request.description ?? request.subject,
        weight: 0.4,
      });
    }

    return {
      requestId: request.requestId,
      items,
      summary: `Collected ${items.length} evidence item(s) across ${new Set(items.map((i) => i.kind)).size} source kind(s).`,
      metadata: request.metadata,
    };
  }
}
