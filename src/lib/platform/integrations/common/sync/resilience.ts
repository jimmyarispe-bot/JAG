/**
 * Retry, rate limiting, and error helpers for sync / connector I/O.
 */

export class RateLimiter {
  private readonly timestamps: number[] = [];

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    while (this.timestamps.length && this.timestamps[0]! <= now - this.windowMs) {
      this.timestamps.shift();
    }
    if (this.timestamps.length >= this.maxRequests) {
      const wait = this.timestamps[0]! + this.windowMs - now;
      await sleep(Math.max(wait, 1));
      return this.acquire();
    }
    this.timestamps.push(Date.now());
  }
}

export type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 5_000;
  const shouldRetry =
    options.shouldRetry ??
    ((error: unknown) => {
      if (error instanceof Error && /rate.?limit|timeout|ECONN|503|429/i.test(error.message)) {
        return true;
      }
      return false;
    });

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetry(error, attempt)) {
        throw error;
      }
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      await sleep(delay);
    }
  }
  throw lastError;
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
