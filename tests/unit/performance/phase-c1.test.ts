import { describe, expect, it, beforeEach } from "vitest";
import {
  getOrCreateIntegrationsSingleton,
  resetPerformanceSingletonsForTests,
  getIntegrationsSingletonStats,
} from "@/lib/performance";

describe("Performance Phase C.1", () => {
  beforeEach(() => {
    resetPerformanceSingletonsForTests();
  });

  it("bootstraps integration connectors once via parallel init (singleton warm path free)", async () => {
    const cold = await getOrCreateIntegrationsSingleton();
    expect(cold.coldStart).toBe(true);
    expect(cold.durationMs).toBeGreaterThan(0);

    const stats = getIntegrationsSingletonStats();
    expect(stats.initialized).toBe(true);
    expect(stats.initCount).toBe(1);

    const warm = await getOrCreateIntegrationsSingleton();
    expect(warm.coldStart).toBe(false);
    expect(warm.durationMs).toBe(0);
    expect(warm.management).toBe(cold.management);
  });
});
