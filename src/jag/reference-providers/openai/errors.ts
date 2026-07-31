/**
 * Typed errors for the OpenAI reference provider.
 */

export type OpenAIProviderErrorCode =
  | "auth"
  | "rate_limit"
  | "invalid_response"
  | "network"
  | "timeout"
  | "config"
  | "unknown";

export class OpenAIProviderError extends Error {
  readonly code: OpenAIProviderErrorCode;
  readonly retryable: boolean;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(
    code: OpenAIProviderErrorCode,
    message: string,
    options: {
      readonly retryable?: boolean;
      readonly status?: number;
      readonly cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = "OpenAIProviderError";
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.status = options.status;
    this.cause = options.cause;
  }
}

export function isRetryableOpenAIError(error: unknown): boolean {
  if (error instanceof OpenAIProviderError) return error.retryable;
  return false;
}
