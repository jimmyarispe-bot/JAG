/**
 * RC-1 — database operation monitoring (duration, slow queries, error rates).
 * Index / seq-scan / lock metrics are sourced from optional Postgres views when available;
 * otherwise duration-based heuristics apply.
 */

import { newId } from "./context";
import { logger } from "./logger";
import { metricsRegistry } from "./metrics";
import { startSpan } from "./tracing";
import type { DbQuerySample } from "./types";

const MAX_SAMPLES = 300;
const SLOW_QUERY_MS = Number(process.env.OBSERVABILITY_SLOW_QUERY_MS ?? 500);
const samples: DbQuerySample[] = [];

export function listDbQuerySamples(limit = 40): DbQuerySample[] {
  return samples.slice(0, limit);
}

export function listSlowQueries(limit = 20): DbQuerySample[] {
  return samples.filter((s) => s.durationMs >= SLOW_QUERY_MS).slice(0, limit);
}

function retain(sample: DbQuerySample): void {
  samples.unshift(sample);
  if (samples.length > MAX_SAMPLES) samples.length = MAX_SAMPLES;
}

/**
 * Time a DB-ish async operation and record metrics/spans.
 * Does not alter the underlying query — wrap only.
 */
export async function observeDbOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: { table?: string; sequentialScanHint?: boolean }
): Promise<T> {
  const span = startSpan(`db.${operation}`, {
    kind: "client",
    attributes: {
      "db.operation": operation,
      "db.table": options?.table,
    },
  });
  const started =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();

  try {
    const result = await fn();
    const end =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    const durationMs = Math.round((end - started) * 100) / 100;
    const sample: DbQuerySample = {
      id: newId(8),
      operation,
      table: options?.table,
      durationMs,
      ok: true,
      at: new Date().toISOString(),
      sequentialScanHint: options?.sequentialScanHint,
    };
    retain(sample);
    metricsRegistry.recordDuration("db.query", durationMs);
    metricsRegistry.recordDuration(`db.op.${operation}`, durationMs);
    if (options?.table) {
      metricsRegistry.recordDuration(`db.table.${options.table}`, durationMs);
    }
    if (durationMs >= SLOW_QUERY_MS) {
      metricsRegistry.increment("db.slow");
      logger.warn("Slow database operation", {
        operation,
        durationMs,
        table: options?.table ?? null,
      });
    }
    span.setAttributes({ "db.duration_ms": durationMs });
    span.end("ok");
    return result;
  } catch (error) {
    const end =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    const durationMs = Math.round((end - started) * 100) / 100;
    retain({
      id: newId(8),
      operation,
      table: options?.table,
      durationMs,
      ok: false,
      errorMessage: error instanceof Error ? error.message : String(error),
      at: new Date().toISOString(),
      sequentialScanHint: options?.sequentialScanHint,
    });
    metricsRegistry.increment("errors.db");
    metricsRegistry.increment("errors.total");
    span.end("error", error);
    throw error;
  }
}

export type DbPoolSnapshot = {
  configured: boolean;
  note: string;
  slowQueryThresholdMs: number;
  recentSlowCount: number;
  recentErrorCount: number;
};

/**
 * Connection pool / lock contention are managed by Supabase/Postgres externally.
 * We surface process-local proxies + guidance for dashboard/alerts.
 */
export function getDbPoolSnapshot(): DbPoolSnapshot {
  const recent = samples.slice(0, 100);
  return {
    configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    note:
      "Pool utilization and lock contention are observed in Supabase/Postgres dashboards; JAG tracks query latency and slow-query rate in-process.",
    slowQueryThresholdMs: SLOW_QUERY_MS,
    recentSlowCount: recent.filter((s) => s.durationMs >= SLOW_QUERY_MS).length,
    recentErrorCount: recent.filter((s) => !s.ok).length,
  };
}
