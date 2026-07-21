/**
 * In-memory performance trace store — process-local ring buffer.
 * RC-1 mirrors aggregates into `@/lib/observability` (OTLP optional).
 */

import type { PerfTrace } from "./types";

const MAX_TRACES = 50;

class PerformanceTraceStore {
  private traces: PerfTrace[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private hydrationMarks: Array<{ route: string; hydrationMs: number; at: string }> = [];

  record(trace: PerfTrace): void {
    this.traces.unshift(trace);
    if (this.traces.length > MAX_TRACES) this.traces.length = MAX_TRACES;
    this.cacheHits += trace.cache.hits;
    this.cacheMisses += trace.cache.misses;
  }

  list(limit = 20): PerfTrace[] {
    return this.traces.slice(0, limit);
  }

  totals(): { cacheHits: number; cacheMisses: number; traceCount: number } {
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      traceCount: this.traces.length,
    };
  }

  recordHydration(route: string, hydrationMs: number): void {
    this.hydrationMarks.unshift({
      route,
      hydrationMs,
      at: new Date().toISOString(),
    });
    if (this.hydrationMarks.length > MAX_TRACES) this.hydrationMarks.length = MAX_TRACES;
  }

  listHydration(limit = 10) {
    return this.hydrationMarks.slice(0, limit);
  }

  clear(): void {
    this.traces = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.hydrationMarks = [];
  }
}

export const performanceTraceStore = new PerformanceTraceStore();
