/**
 * Lightweight timing primitives — no business logic.
 */

import { metricsRegistry } from "@/lib/observability";
import { performanceTraceStore } from "./store";
import type { PerfSpan, PerfTrace } from "./types";

export function nowMs(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T> | T,
  meta?: Record<string, unknown>
): Promise<{ value: T; span: PerfSpan }> {
  const startMs = nowMs();
  const value = await fn();
  const endMs = nowMs();
  return {
    value,
    span: {
      name,
      startMs,
      endMs,
      durationMs: Math.round((endMs - startMs) * 100) / 100,
      meta,
    },
  };
}

export function measureSync<T>(
  name: string,
  fn: () => T,
  meta?: Record<string, unknown>
): { value: T; span: PerfSpan } {
  const startMs = nowMs();
  const value = fn();
  const endMs = nowMs();
  return {
    value,
    span: {
      name,
      startMs,
      endMs,
      durationMs: Math.round((endMs - startMs) * 100) / 100,
      meta,
    },
  };
}

export function commitTrace(input: {
  route: string;
  label: string;
  spans: PerfSpan[];
  cacheHits?: number;
  cacheMisses?: number;
  intelligenceColdStart?: boolean;
  integrationsColdStart?: boolean;
}): PerfTrace {
  const totalMs =
    Math.round(input.spans.reduce((sum, s) => sum + s.durationMs, 0) * 100) / 100;
  const trace: PerfTrace = {
    id: `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    route: input.route,
    label: input.label,
    startedAt: new Date().toISOString(),
    totalMs,
    spans: input.spans,
    cache: {
      hits: input.cacheHits ?? 0,
      misses: input.cacheMisses ?? 0,
    },
    flags: {
      intelligenceColdStart: input.intelligenceColdStart ?? false,
      integrationsColdStart: input.integrationsColdStart ?? false,
    },
  };
  performanceTraceStore.record(trace);
  // RC-1 — mirror into observability metrics (no behavior change).
  metricsRegistry.recordDuration(`perf.route.${input.route}`, totalMs);
  metricsRegistry.recordDuration("perf.trace.total", totalMs);
  if (input.cacheHits) metricsRegistry.increment("cache.hit", input.cacheHits);
  if (input.cacheMisses) metricsRegistry.increment("cache.miss", input.cacheMisses);
  return trace;
}
