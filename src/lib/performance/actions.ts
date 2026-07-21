"use server";

import { observeServerAction, metricsRegistry } from "@/lib/observability";
import { performanceTraceStore } from "@/lib/performance/store";

/** Record client hydration timing from the admin performance island. */
export async function recordHydrationMark(route: string, hydrationMs: number): Promise<void> {
  return observeServerAction("perf.recordHydrationMark", async () => {
    if (!Number.isFinite(hydrationMs) || hydrationMs < 0 || hydrationMs > 60_000) return;
    const ms = Math.round(hydrationMs * 100) / 100;
    performanceTraceStore.recordHydration(route.slice(0, 120), ms);
    metricsRegistry.recordDuration("rum.hydration", ms);
  });
}
