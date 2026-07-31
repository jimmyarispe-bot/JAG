/**
 * Structured orchestrator failures — prefer these over thrown exceptions.
 */

export const ORCHESTRATOR_FAILURE_CODES = Object.freeze([
  "no_compatible_provider",
  "provider_timeout",
  "validation_failure",
  "insufficient_evidence",
  "evidence_graph_error",
  "invalid_question",
  "context_resolution_error",
  "provider_execution_error",
] as const);

export type OrchestratorFailureCode =
  (typeof ORCHESTRATOR_FAILURE_CODES)[number];

export type OrchestratorFailure = {
  readonly code: OrchestratorFailureCode;
  readonly message: string;
  readonly stageId?: string;
  readonly details?: readonly string[];
};

export function orchestratorFailure(
  code: OrchestratorFailureCode,
  message: string,
  options: {
    readonly stageId?: string;
    readonly details?: readonly string[];
  } = {}
): OrchestratorFailure {
  return {
    code,
    message,
    stageId: options.stageId,
    details: options.details,
  };
}
