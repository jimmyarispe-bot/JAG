/**
 * RC-1 — Real User Monitoring store (Core Web Vitals + TTFB/TTI).
 */

import { metricsRegistry } from "./metrics";
import type { RumMetricName, RumSample } from "./types";
import { newId } from "./context";

const MAX_SAMPLES = 500;
const samples: RumSample[] = [];

const VALID: Set<string> = new Set(["TTFB", "FCP", "LCP", "INP", "CLS", "TTI"]);

export function isRumMetricName(value: string): value is RumMetricName {
  return VALID.has(value);
}

export function recordRumSample(
  input: Omit<RumSample, "id" | "at"> & { at?: string }
): RumSample {
  const sample: RumSample = {
    id: newId(8),
    at: input.at ?? new Date().toISOString(),
    name: input.name,
    value: input.value,
    route: input.route,
    organizationId: input.organizationId,
    browser: input.browser,
    deviceClass: input.deviceClass,
    navigationType: input.navigationType,
  };
  samples.unshift(sample);
  if (samples.length > MAX_SAMPLES) samples.length = MAX_SAMPLES;
  metricsRegistry.recordDuration(`rum.${sample.name}`, sample.value);
  metricsRegistry.increment(`rum.count.${sample.name}`);
  return sample;
}

export function listRumSamples(limit = 50, filters?: {
  route?: string;
  organizationId?: string;
  name?: RumMetricName;
}): RumSample[] {
  return samples
    .filter((s) => (filters?.route ? s.route === filters.route : true))
    .filter((s) =>
      filters?.organizationId ? s.organizationId === filters.organizationId : true
    )
    .filter((s) => (filters?.name ? s.name === filters.name : true))
    .slice(0, limit);
}

export function rumSummaryByRoute(limit = 15) {
  const byRoute = new Map<string, RumSample[]>();
  for (const s of samples) {
    const list = byRoute.get(s.route) ?? [];
    list.push(s);
    byRoute.set(s.route, list);
  }
  return [...byRoute.entries()]
    .map(([route, rows]) => {
      const lcp = rows.filter((r) => r.name === "LCP").map((r) => r.value);
      const inp = rows.filter((r) => r.name === "INP").map((r) => r.value);
      const cls = rows.filter((r) => r.name === "CLS").map((r) => r.value);
      const ttfb = rows.filter((r) => r.name === "TTFB").map((r) => r.value);
      const avg = (vals: number[]) =>
        vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
      return {
        route,
        samples: rows.length,
        avgLcp: avg(lcp),
        avgInp: avg(inp),
        avgCls: avg(cls),
        avgTtfb: avg(ttfb),
      };
    })
    .sort((a, b) => b.avgLcp - a.avgLcp)
    .slice(0, limit);
}
