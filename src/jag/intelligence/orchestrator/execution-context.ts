/**
 * ExecutionContext — envelope for every orchestrated reasoning request.
 * Telemetry only; not product analytics.
 */

import type { OrchestratorFailure } from "@/jag/intelligence/orchestrator/failures";

export type StageDuration = {
  readonly stageId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly ok: boolean;
};

export type ExecutionDiagnostics = {
  readonly notes: string[];
  failure?: OrchestratorFailure;
};

export type ExecutionMetadata = {
  readonly stageDurations: StageDuration[];
  providerSelectedId?: string;
  evidenceCount: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  validationStatus: "pending" | "passed" | "failed" | "skipped";
  retryCount: number;
  readonly stageOrder: readonly string[];
};

export type ExecutionContext = {
  readonly requestId: string;
  readonly organizationId: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly correlationId: string;
  readonly startedAt: string;
  completedAt?: string;
  readonly diagnostics: ExecutionDiagnostics;
  readonly metadata: ExecutionMetadata;
};

export type CreateExecutionContextInput = {
  readonly requestId: string;
  readonly organizationId: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly correlationId?: string;
  readonly startedAt: string;
  readonly stageOrder: readonly string[];
};

export function createExecutionContext(
  input: CreateExecutionContextInput
): ExecutionContext {
  return {
    requestId: input.requestId,
    organizationId: input.organizationId,
    userId: input.userId,
    sessionId: input.sessionId,
    correlationId: input.correlationId ?? input.requestId,
    startedAt: input.startedAt,
    diagnostics: { notes: [] },
    metadata: {
      stageDurations: [],
      evidenceCount: 0,
      graphNodeCount: 0,
      graphEdgeCount: 0,
      validationStatus: "pending",
      retryCount: 0,
      stageOrder: Object.freeze([...input.stageOrder]),
    },
  };
}

export function noteExecution(
  execution: ExecutionContext,
  note: string
): void {
  execution.diagnostics.notes.push(note);
}

export function recordStageDuration(
  execution: ExecutionContext,
  duration: StageDuration
): void {
  execution.metadata.stageDurations.push(duration);
}
