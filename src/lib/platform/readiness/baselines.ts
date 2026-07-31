import type {
  PlatformBaselineMetric,
  PlatformBaselineReport,
} from "@/lib/platform/readiness/types";
import { PLATFORM_RELEASE } from "@/lib/platform/readiness/versioning";

/**
 * Time a synchronous or async operation and return elapsed ms.
 */
export async function measureElapsedMs(
  fn: () => void | Promise<void>,
  iterations = 1
): Promise<number> {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  return performance.now() - start;
}

export function baselineMetric(
  name: string,
  elapsedMs: number,
  iterations: number,
  notes?: string
): PlatformBaselineMetric {
  return {
    name,
    elapsedMs: Math.round(elapsedMs * 1000) / 1000,
    iterations,
    measuredAt: new Date().toISOString(),
    notes,
  };
}

export function buildBaselineReport(
  metrics: PlatformBaselineMetric[]
): PlatformBaselineReport {
  return {
    platformVersion: PLATFORM_RELEASE.platformVersion,
    measuredAt: new Date().toISOString(),
    metrics,
  };
}

/** Soft ceilings for CI smoke — not hard SLOs. Fail only if catastrophically slow. */
export const BASELINE_SOFT_CEILINGS_MS: Record<string, number> = {
  "sdk.register": 50,
  "schema.register": 50,
  "graph.rebuild": 200,
  "workflow.start+transition": 100,
  "api.dispatch": 50,
  "form.render": 50,
};
