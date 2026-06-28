import type { RetryPolicyDefinition } from "@/lib/platform/automation/engine-types";

export interface RetryAttemptResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  attempts: number;
}

/** Retry Policy Framework — exponential backoff with configurable limits. */
export function computeRetryDelay(
  policy: RetryPolicyDefinition,
  attempt: number
): number {
  const multiplier = policy.backoffMultiplier ?? 2;
  const delay = policy.initialDelayMs * Math.pow(multiplier, attempt - 1);
  if (policy.maxDelayMs !== undefined) {
    return Math.min(delay, policy.maxDelayMs);
  }
  return delay;
}

export async function executeWithRetry<T>(
  policy: RetryPolicyDefinition | undefined,
  fn: (attempt: number) => Promise<T>
): Promise<RetryAttemptResult<T>> {
  const maxAttempts = policy?.maxAttempts ?? 1;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn(attempt);
      return { success: true, result, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < maxAttempts && policy) {
        const delay = computeRetryDelay(policy, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return { success: false, error: lastError ?? "Retry exhausted", attempts: maxAttempts };
}

export function shouldRetry(
  policy: RetryPolicyDefinition | undefined,
  attempt: number
): boolean {
  if (!policy) return false;
  return attempt < policy.maxAttempts;
}
