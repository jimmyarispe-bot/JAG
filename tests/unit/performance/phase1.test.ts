import { describe, expect, it, beforeEach } from "vitest";
import {
  getOrCreateIntelligenceSingleton,
  getOrCreateIntegrationsSingleton,
  resetPerformanceSingletonsForTests,
  runPerformanceProbe,
  buildRouteInventory,
} from "@/lib/performance";

describe("Performance Phase 1", () => {
  beforeEach(() => {
    resetPerformanceSingletonsForTests();
  });

  it("uses process singletons for intelligence (cold once, warm free)", () => {
    const cold = getOrCreateIntelligenceSingleton();
    expect(cold.coldStart).toBe(true);
    expect(cold.durationMs).toBeGreaterThan(0);

    const warm = getOrCreateIntelligenceSingleton();
    expect(warm.coldStart).toBe(false);
    expect(warm.durationMs).toBe(0);
    expect(warm.service).toBe(cold.service);
  });

  it("uses process singletons for integrations bootstrap", async () => {
    const cold = await getOrCreateIntegrationsSingleton();
    expect(cold.coldStart).toBe(true);
    expect(cold.durationMs).toBeGreaterThan(0);

    const warm = await getOrCreateIntegrationsSingleton();
    expect(warm.coldStart).toBe(false);
    expect(warm.durationMs).toBe(0);
    expect(warm.management).toBe(cold.management);
  });

  it("runs ECC probe with route timings and detections", async () => {
    const report = await runPerformanceProbe();
    expect(report.routeTimings.length).toBeGreaterThanOrEqual(5);
    expect(report.comparisons.intelligenceColdMs).toBeGreaterThan(0);
    expect(report.comparisons.integrationsColdMs).toBeGreaterThan(0);
    expect(report.detections.length).toBeGreaterThan(0);
    expect(report.routeInventory.appRouteFiles).toBeGreaterThan(10);
    expect(report.bundle.length).toBeGreaterThan(0);
  }, 120_000);

  it("inventories app routes without throwing", () => {
    const inv = buildRouteInventory();
    expect(inv.appRouteFiles).toBeGreaterThan(0);
    expect(inv.execRoutes).toBeGreaterThan(0);
  });
});
