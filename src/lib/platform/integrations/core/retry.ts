/**
 * Retry engine — exponential backoff, configurable policies, timeout handling.
 */

import type { CircuitBreakerPolicy, RetryPolicy } from "@/lib/platform/integrations/types";

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 5_000,
  jitter: true,
  retryableErrors: ["rate.?limit", "timeout", "ECONN", "503", "429", "circuit"],
};

export type RetryExecutionOptions = {
  readonly policy?: RetryPolicy;
  readonly timeoutMs?: number;
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
  readonly onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  readonly sleep?: (ms: number) => Promise<void>;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryExecutionOptions = {}
): Promise<T> {
  const policy = { ...DEFAULT_RETRY_POLICY, ...options.policy };
  const sleep = options.sleep ?? defaultSleep;
  const shouldRetry = options.shouldRetry ?? ((error) => isRetryable(error, policy));

  let lastError: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      if (options.timeoutMs && options.timeoutMs > 0) {
        return await withTimeout(fn, options.timeoutMs);
      }
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= policy.maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }
      const delay = computeBackoff(policy, attempt);
      options.onRetry?.(error, attempt, delay);
      await sleep(delay);
    }
  }
  throw lastError;
}

export function computeBackoff(policy: RetryPolicy, attempt: number): number {
  const exp = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempt - 1));
  if (!policy.jitter) return exp;
  const jitter = Math.floor(Math.random() * Math.max(1, Math.floor(exp * 0.2)));
  return Math.min(policy.maxDelayMs, exp + jitter);
}

export function isRetryable(error: unknown, policy: RetryPolicy): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const patterns = policy.retryableErrors ?? DEFAULT_RETRY_POLICY.retryableErrors ?? [];
  return patterns.some((pattern) => new RegExp(pattern, "i").test(message));
}

export class CircuitBreaker {
  private failures = 0;
  private successes = 0;
  private openedAt: number | null = null;
  private state: "closed" | "open" | "half_open" = "closed";

  constructor(private readonly policy: CircuitBreakerPolicy) {}

  getState(): "closed" | "open" | "half_open" {
    this.maybeHalfOpen();
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.maybeHalfOpen();
    if (this.state === "open") {
      throw new Error("Circuit breaker is open");
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === "half_open") {
      this.successes += 1;
      if (this.successes >= this.policy.successThreshold) {
        this.state = "closed";
        this.failures = 0;
        this.successes = 0;
        this.openedAt = null;
      }
      return;
    }
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures += 1;
    this.successes = 0;
    if (this.failures >= this.policy.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }

  private maybeHalfOpen(): void {
    if (this.state === "open" && this.openedAt !== null) {
      if (Date.now() - this.openedAt >= this.policy.openMs) {
        this.state = "half_open";
        this.successes = 0;
      }
    }
  }
}

async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
