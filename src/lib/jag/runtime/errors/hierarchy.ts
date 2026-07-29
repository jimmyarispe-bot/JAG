import type { RuntimePipelineStageId } from "../types/stages";

export type RuntimeErrorSeverity = "recoverable" | "fatal";

export interface RuntimeErrorOptions {
  code?: string;
  cause?: unknown;
  stageId?: RuntimePipelineStageId;
  details?: Readonly<Record<string, unknown>>;
  severity?: RuntimeErrorSeverity;
}

export class RuntimeError extends Error {
  readonly code: string;
  readonly stageId?: RuntimePipelineStageId;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly severity: RuntimeErrorSeverity;
  override readonly cause?: unknown;

  constructor(message: string, options: RuntimeErrorOptions = {}) {
    super(message);
    this.name = "RuntimeError";
    this.code = options.code ?? "RUNTIME_ERROR";
    this.stageId = options.stageId;
    this.details = options.details;
    this.severity = options.severity ?? "fatal";
    this.cause = options.cause;
  }

  get recoverable(): boolean {
    return this.severity === "recoverable";
  }
}

export class RuntimeRecoverableError extends RuntimeError {
  constructor(message: string, options: RuntimeErrorOptions = {}) {
    super(message, { ...options, severity: "recoverable" });
    this.name = "RuntimeRecoverableError";
  }
}

export class RuntimeFatalError extends RuntimeError {
  constructor(message: string, options: RuntimeErrorOptions = {}) {
    super(message, { ...options, severity: "fatal" });
    this.name = "RuntimeFatalError";
  }
}

export class RuntimeAuthorizationError extends RuntimeError {
  constructor(message: string, options: RuntimeErrorOptions = {}) {
    super(message, {
      ...options,
      code: options.code ?? "RUNTIME_AUTHORIZATION",
      severity: options.severity ?? "fatal",
    });
    this.name = "RuntimeAuthorizationError";
  }
}

export class RuntimeContextError extends RuntimeError {
  constructor(message: string, options: RuntimeErrorOptions = {}) {
    super(message, {
      ...options,
      code: options.code ?? "RUNTIME_CONTEXT",
      stageId: options.stageId ?? "context",
    });
    this.name = "RuntimeContextError";
  }
}

export class RuntimeIntentError extends RuntimeError {
  constructor(message: string, options: RuntimeErrorOptions = {}) {
    super(message, {
      ...options,
      code: options.code ?? "RUNTIME_INTENT",
      stageId: options.stageId ?? "intent",
      severity: options.severity ?? "recoverable",
    });
    this.name = "RuntimeIntentError";
  }
}

export class RuntimePipelineError extends RuntimeError {
  constructor(message: string, options: RuntimeErrorOptions = {}) {
    super(message, {
      ...options,
      code: options.code ?? "RUNTIME_PIPELINE",
    });
    this.name = "RuntimePipelineError";
  }
}

export class RuntimeExtensionError extends RuntimeError {
  constructor(message: string, options: RuntimeErrorOptions = {}) {
    super(message, {
      ...options,
      code: options.code ?? "RUNTIME_EXTENSION",
    });
    this.name = "RuntimeExtensionError";
  }
}

export class RuntimeCancellationError extends RuntimeRecoverableError {
  constructor(message = "Runtime pipeline cancelled", options: RuntimeErrorOptions = {}) {
    super(message, {
      ...options,
      code: options.code ?? "RUNTIME_CANCELLED",
    });
    this.name = "RuntimeCancellationError";
  }
}

export function isRuntimeError(error: unknown): error is RuntimeError {
  return error instanceof RuntimeError;
}

export function toRuntimeError(
  error: unknown,
  fallbackStageId?: RuntimePipelineStageId
): RuntimeError {
  if (error instanceof RuntimeError) {
    return error;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "AbortError"
  ) {
    return new RuntimeCancellationError();
  }
  if (error instanceof Error) {
    return new RuntimePipelineError(error.message, {
      cause: error,
      stageId: fallbackStageId,
      code: "RUNTIME_WRAPPED",
    });
  }
  return new RuntimePipelineError(String(error), {
    stageId: fallbackStageId,
    code: "RUNTIME_UNKNOWN",
  });
}
