/**
 * Intelligence Platform Infrastructure — IntelligenceExecutionContext (Sprint 027).
 */

import type {
  IntelligenceExecutionContext as IntelligenceExecutionContextContract,
  IntelligencePlatformClock,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type {
  IntelligenceExecutionRequest,
  IntelligencePlatformMetadata,
  IntelligencePlatformScope,
} from "@/lib/platform/intelligence/infrastructure/types";
import { createDefaultClock } from "@/lib/platform/intelligence/infrastructure/clock";

export class IntelligenceExecutionContextImpl
  implements IntelligenceExecutionContextContract
{
  readonly runId: string;
  readonly scope: IntelligencePlatformScope;
  readonly startedAt: string;
  readonly metadata: IntelligencePlatformMetadata;
  readonly bypassCache: boolean;
  readonly failFast: boolean;
  input: unknown;

  private readonly store = new Map<string, unknown>();

  constructor(
    request: IntelligenceExecutionRequest = {},
    clock: IntelligencePlatformClock = createDefaultClock()
  ) {
    const now = clock.now();
    this.runId = request.runId ?? clock.createId("run");
    this.scope = request.scope ?? {};
    this.startedAt = now.toISOString();
    this.metadata = { ...(request.metadata ?? {}) };
    this.bypassCache = request.bypassCache === true;
    this.failFast = request.failFast !== false;
    this.input = request.input;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  get<T = unknown>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  keys(): string[] {
    return [...this.store.keys()].sort((a, b) => a.localeCompare(b));
  }

  snapshot(): IntelligencePlatformMetadata {
    const out: IntelligencePlatformMetadata = {};
    for (const key of this.keys()) {
      out[key] = this.store.get(key);
    }
    return out;
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceExecutionContextImpl as IntelligenceExecutionContext };

export function createExecutionContext(
  request: IntelligenceExecutionRequest = {},
  clock?: IntelligencePlatformClock
): IntelligenceExecutionContextImpl {
  return new IntelligenceExecutionContextImpl(request, clock);
}
