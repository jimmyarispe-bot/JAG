/**
 * RC-1 — in-process metrics aggregator (histograms + counters).
 * Suitable for single-instance dashboards; export via /api/observability/metrics.
 */

import type { LatencyBucket, PercentileStats } from "./types";

const MAX_SAMPLES_PER_KEY = 200;
const MAX_KEYS = 400;

function emptyBucket(): LatencyBucket {
  return { count: 0, sumMs: 0, minMs: Number.POSITIVE_INFINITY, maxMs: 0, samples: [] };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? 0;
}

export function summarizeLatency(bucket: LatencyBucket | undefined): PercentileStats {
  if (!bucket || bucket.count === 0) {
    return { count: 0, p50: 0, p95: 0, p99: 0, max: 0, avg: 0 };
  }
  const sorted = [...bucket.samples].sort((a, b) => a - b);
  return {
    count: bucket.count,
    p50: Math.round(percentile(sorted, 50) * 100) / 100,
    p95: Math.round(percentile(sorted, 95) * 100) / 100,
    p99: Math.round(percentile(sorted, 99) * 100) / 100,
    max: Math.round(bucket.maxMs * 100) / 100,
    avg: Math.round((bucket.sumMs / bucket.count) * 100) / 100,
  };
}

class MetricsRegistry {
  private histograms = new Map<string, LatencyBucket>();
  private counters = new Map<string, number>();
  private activeUsers = new Set<string>();
  private startedAt = new Date().toISOString();

  recordDuration(name: string, durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs < 0) return;
    let bucket = this.histograms.get(name);
    if (!bucket) {
      if (this.histograms.size >= MAX_KEYS) return;
      bucket = emptyBucket();
      this.histograms.set(name, bucket);
    }
    bucket.count += 1;
    bucket.sumMs += durationMs;
    bucket.minMs = Math.min(bucket.minMs, durationMs);
    bucket.maxMs = Math.max(bucket.maxMs, durationMs);
    bucket.samples.push(durationMs);
    if (bucket.samples.length > MAX_SAMPLES_PER_KEY) {
      bucket.samples.splice(0, bucket.samples.length - MAX_SAMPLES_PER_KEY);
    }
  }

  increment(name: string, by = 1): void {
    if (this.counters.size >= MAX_KEYS && !this.counters.has(name)) return;
    this.counters.set(name, (this.counters.get(name) ?? 0) + by);
  }

  noteActiveUser(userId: string | undefined): void {
    if (!userId) return;
    this.activeUsers.add(userId);
    if (this.activeUsers.size > 5_000) {
      const first = this.activeUsers.values().next().value;
      if (first) this.activeUsers.delete(first);
    }
  }

  getHistogram(name: string): LatencyBucket | undefined {
    return this.histograms.get(name);
  }

  getCounter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  listHistogramNames(prefix?: string): string[] {
    const names = [...this.histograms.keys()].sort();
    return prefix ? names.filter((n) => n.startsWith(prefix)) : names;
  }

  topSlow(prefix: string, limit = 10): Array<{ name: string; stats: PercentileStats }> {
    return this.listHistogramNames(prefix)
      .map((name) => ({ name, stats: summarizeLatency(this.histograms.get(name)) }))
      .filter((row) => row.stats.count > 0)
      .sort((a, b) => b.stats.p95 - a.stats.p95)
      .slice(0, limit);
  }

  cacheRatio(): { hits: number; misses: number; hitRatio: number } {
    const hits = this.getCounter("cache.hit");
    const misses = this.getCounter("cache.miss");
    const total = hits + misses;
    return {
      hits,
      misses,
      hitRatio: total === 0 ? 0 : Math.round((hits / total) * 1000) / 1000,
    };
  }

  snapshot() {
    const histograms: Record<string, PercentileStats> = {};
    for (const name of this.histograms.keys()) {
      histograms[name] = summarizeLatency(this.histograms.get(name));
    }
    return {
      startedAt: this.startedAt,
      generatedAt: new Date().toISOString(),
      activeUsers: this.activeUsers.size,
      counters: Object.fromEntries(this.counters),
      histograms,
      cache: this.cacheRatio(),
      errors: {
        total: this.getCounter("errors.total"),
        api: this.getCounter("errors.api"),
        action: this.getCounter("errors.action"),
        db: this.getCounter("errors.db"),
      },
    };
  }

  clear(): void {
    this.histograms.clear();
    this.counters.clear();
    this.activeUsers.clear();
    this.startedAt = new Date().toISOString();
  }
}

export const metricsRegistry = new MetricsRegistry();
