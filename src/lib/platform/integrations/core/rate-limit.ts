/**
 * Provider rate limiter — token-bucket style window with configurable policies.
 */

import type { RateLimitPolicy, RateLimitState } from "@/lib/platform/integrations/types";

export const DEFAULT_RATE_LIMIT_POLICY: RateLimitPolicy = {
  maxRequests: 60,
  windowMs: 60_000,
  burst: 10,
};

export class RateLimiter {
  private readonly timestamps: number[] = [];
  private blockedUntil = 0;

  constructor(
    private readonly policy: RateLimitPolicy = DEFAULT_RATE_LIMIT_POLICY,
    private readonly sleep: (ms: number) => Promise<void> = defaultSleep
  ) {}

  getState(now = Date.now()): RateLimitState {
    if (now < this.blockedUntil) return "blocked";
    this.prune(now);
    if (this.timestamps.length >= this.policy.maxRequests) return "throttled";
    return "open";
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    if (now < this.blockedUntil) {
      await this.sleep(this.blockedUntil - now);
      return this.acquire();
    }

    this.prune(now);
    if (this.timestamps.length >= this.policy.maxRequests) {
      const wait = this.timestamps[0]! + this.policy.windowMs - now;
      await this.sleep(Math.max(wait, 1));
      return this.acquire();
    }

    this.timestamps.push(Date.now());
  }

  /** External signal that the provider returned 429 / quota exceeded. */
  signalProviderLimit(retryAfterMs = 1_000): void {
    this.blockedUntil = Date.now() + Math.max(retryAfterMs, 1);
  }

  private prune(now: number): void {
    while (this.timestamps.length && this.timestamps[0]! <= now - this.policy.windowMs) {
      this.timestamps.shift();
    }
  }
}

export class RateLimitRegistry {
  private readonly limiters = new Map<string, RateLimiter>();

  constructor(private readonly defaultPolicy: RateLimitPolicy = DEFAULT_RATE_LIMIT_POLICY) {}

  forConnector(connectorId: string, policy?: RateLimitPolicy): RateLimiter {
    const key = connectorId;
    const existing = this.limiters.get(key);
    if (existing && !policy) return existing;
    const limiter = new RateLimiter(policy ?? this.defaultPolicy);
    this.limiters.set(key, limiter);
    return limiter;
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
