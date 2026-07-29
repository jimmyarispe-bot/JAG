/**
 * Ordered diagnostic timeline of pipeline events.
 */

export type EducationTimelineEventKind =
  | "planning"
  | "planning_completed"
  | "contributor_started"
  | "contributor_completed"
  | "contributor_failed"
  | "contributor_skipped"
  | "contributor_skipped_dependent"
  | "graph_aggregation"
  | "recommendation_generation"
  | "pipeline_completion";

export interface EducationTimelineEvent {
  seq: number;
  kind: EducationTimelineEventKind;
  at: string;
  /** Relative ms from pipeline start when available. */
  elapsedMs?: number;
  contributorId?: string;
  stage?: number;
  message: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface EducationExecutionTimeline {
  events: readonly EducationTimelineEvent[];
  startedAt: string;
  completedAt: string;
}

export interface EducationTimelineBuilder {
  push(
    kind: EducationTimelineEventKind,
    message: string,
    extras?: {
      contributorId?: string;
      stage?: number;
      attributes?: Readonly<Record<string, unknown>>;
      at?: string;
    }
  ): void;
  snapshot(): EducationExecutionTimeline;
}

/** Mutable builder used during orchestration; freeze via snapshot(). */
export function createEducationTimelineBuilder(input: {
  startedAt: string;
  nowFn?: () => string;
  startedMs?: number;
}): EducationTimelineBuilder {
  const events: EducationTimelineEvent[] = [];
  const startedMs = input.startedMs ?? Date.now();
  const nowFn = input.nowFn ?? (() => new Date().toISOString());
  let seq = 0;

  return {
    push(kind, message, extras = {}) {
      const at = extras.at ?? nowFn();
      events.push({
        seq: seq++,
        kind,
        at,
        elapsedMs: Math.max(0, Date.now() - startedMs),
        contributorId: extras.contributorId,
        stage: extras.stage,
        message,
        attributes: extras.attributes,
      });
    },
    snapshot() {
      const completedAt =
        events.length > 0 ? events[events.length - 1]!.at : input.startedAt;
      return {
        events: events.map((e) => ({ ...e })),
        startedAt: input.startedAt,
        completedAt,
      };
    },
  };
}

/**
 * Reconstruct a timeline from completed pipeline artifacts (post-hoc).
 * Used when hosts only have the final result.
 */
export function buildEducationExecutionTimeline(input: {
  startedAt: string;
  completedAt: string;
  planId: string;
  intentId: string;
  records: ReadonlyArray<{
    contributorId: string;
    status: "executed" | "skipped" | "failed" | "skipped_dependent";
    reason?: string;
    durationMs?: number;
    stage?: number;
  }>;
  recommendationCount: number;
  graphSubjectId?: string;
}): EducationExecutionTimeline {
  const builder = createEducationTimelineBuilder({
    startedAt: input.startedAt,
    nowFn: () => input.completedAt,
    startedMs: Date.now(),
  });

  builder.push("planning", `Planning for intent ${input.intentId}`, {
    at: input.startedAt,
    attributes: { planId: input.planId },
  });
  builder.push("planning_completed", `Plan ${input.planId} ready`, {
    at: input.startedAt,
  });

  for (const record of input.records) {
    if (record.status === "skipped") {
      builder.push(
        "contributor_skipped",
        record.reason ?? `Skipped ${record.contributorId}`,
        {
          contributorId: record.contributorId,
          stage: record.stage,
          at: input.completedAt,
        }
      );
      continue;
    }
    if (record.status === "skipped_dependent") {
      builder.push(
        "contributor_skipped_dependent",
        record.reason ?? `Skipped dependent ${record.contributorId}`,
        {
          contributorId: record.contributorId,
          stage: record.stage,
          at: input.completedAt,
        }
      );
      continue;
    }

    builder.push("contributor_started", `Started ${record.contributorId}`, {
      contributorId: record.contributorId,
      stage: record.stage,
      at: input.completedAt,
    });

    if (record.status === "failed") {
      builder.push(
        "contributor_failed",
        record.reason ?? `Failed ${record.contributorId}`,
        {
          contributorId: record.contributorId,
          stage: record.stage,
          at: input.completedAt,
          attributes: { durationMs: record.durationMs },
        }
      );
    } else {
      builder.push(
        "contributor_completed",
        `Completed ${record.contributorId}`,
        {
          contributorId: record.contributorId,
          stage: record.stage,
          at: input.completedAt,
          attributes: { durationMs: record.durationMs },
        }
      );
    }
  }

  builder.push(
    "graph_aggregation",
    `Aggregated graph for subject ${input.graphSubjectId ?? "unknown"}`,
    { at: input.completedAt }
  );
  builder.push(
    "recommendation_generation",
    `Generated ${input.recommendationCount} recommendation(s)`,
    {
      at: input.completedAt,
      attributes: { recommendationCount: input.recommendationCount },
    }
  );
  builder.push("pipeline_completion", "Education intelligence pipeline completed", {
    at: input.completedAt,
  });

  return builder.snapshot();
}
