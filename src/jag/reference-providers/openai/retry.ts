/**
 * Deterministic retry helper for transient provider failures.
 */

import {
  isRetryableOpenAIError,
  OpenAIProviderError,
} from "@/jag/reference-providers/openai/errors";

export type RetryOptions = {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function withRetries<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 50;
  const sleep = options.sleep ?? defaultSleep;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (!isRetryableOpenAIError(error) || attempt === maxAttempts) {
        throw error;
      }
      await sleep(baseDelayMs * attempt);
    }
  }
  throw (
    lastError ??
    new OpenAIProviderError("unknown", "Retry loop exhausted without result")
  );
}
