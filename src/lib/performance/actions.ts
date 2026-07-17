"use server";

import { performanceTraceStore } from "@/lib/performance/store";

/** Record client hydration timing from the admin performance island. */
export async function recordHydrationMark(route: string, hydrationMs: number): Promise<void> {
  if (!Number.isFinite(hydrationMs) || hydrationMs < 0 || hydrationMs > 60_000) return;
  performanceTraceStore.recordHydration(route.slice(0, 120), Math.round(hydrationMs * 100) / 100);
}
