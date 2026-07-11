/**
 * Decision Intelligence — timeline estimation.
 */

import type {
  DecisionAlternativesResult,
  DecisionAnalysisResult,
  DecisionRequest,
  DecisionTimeline,
} from "@/lib/platform/intelligence/decision/types";

/** Options for timeline estimation. */
export interface DecisionTimelineOptions {
  now?: () => Date;
}

/**
 * Estimates decision date, approval timeline, implementation, and realization.
 */
export class DecisionTimelineEstimator {
  private readonly now: () => Date;

  constructor(options: DecisionTimelineOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  estimate(
    request: DecisionRequest,
    analysis: DecisionAnalysisResult,
    alternatives: DecisionAlternativesResult
  ): DecisionTimeline {
    const decisionDate = this.now();
    const top = alternatives.alternatives[0];
    const approvalDays =
      analysis.priority === "critical" ? 7 : analysis.priority === "high" ? 14 : 21;
    const implementationDays = top?.timelineDays ?? 60;
    const realizationDays = Math.round(implementationDays * 1.5);

    const approvalBy = addDays(decisionDate, approvalDays);
    const implementationBy = addDays(approvalBy, implementationDays);
    const realizationBy = addDays(approvalBy, realizationDays);

    return {
      timelineId: `${request.requestId}:timeline`,
      requestId: request.requestId,
      decisionDate: decisionDate.toISOString(),
      approvalDays,
      approvalBy: approvalBy.toISOString(),
      implementationDays,
      implementationBy: implementationBy.toISOString(),
      realizationDays,
      realizationBy: realizationBy.toISOString(),
      summary: `Decision ${decisionDate.toISOString().slice(0, 10)}; approval ~${approvalDays}d; implementation ~${implementationDays}d; realization ~${realizationDays}d.`,
      metadata: request.metadata,
    };
  }
}

function addDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
