/**
 * RC-2 — latency / throughput aggregation.
 */

import type { Percentiles } from "./types";

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[idx] ?? 0;
}

export function summarize(samples: number[]): Percentiles {
  if (samples.length === 0) {
    return { count: 0, p50: 0, p95: 0, p99: 0, avg: 0, max: 0, min: 0 };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
    avg: round(sum / sorted.length),
    max: round(sorted[sorted.length - 1] ?? 0),
    min: round(sorted[0] ?? 0),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export class LatencyCollector {
  private samples: number[] = [];
  private errors = 0;
  private statusCounts: Record<string, number> = {};
  private started = Date.now();

  record(durationMs: number, status: number, ok: boolean): void {
    this.samples.push(durationMs);
    const key = String(status);
    this.statusCounts[key] = (this.statusCounts[key] ?? 0) + 1;
    if (!ok) this.errors += 1;
  }

  snapshot(concurrency: number) {
    const durationMs = Math.max(1, Date.now() - this.started);
    const requests = this.samples.length;
    return {
      concurrency,
      durationMs,
      requests,
      throughputRps: round((requests / durationMs) * 1000),
      errorRate: requests === 0 ? 0 : round(this.errors / requests),
      latency: summarize(this.samples),
      statusCounts: { ...this.statusCounts },
    };
  }
}
