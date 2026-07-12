/**
 * Intelligence Platform Infrastructure — unit tests (Sprint 027).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createIntelligencePlatform,
  createIntelligenceProvider,
  createIntelligenceRegistry,
  IntelligenceRegistryError,
  resetPlatformIdSeqForTests,
  type IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure";
import { createIntelligenceService } from "@/lib/platform/intelligence";
import { resetGraphEdgeSeqForTests } from "@/lib/platform/intelligence/executive-graph";

function makeModule(
  id: string,
  dependencies: string[] = [],
  executeOk = true
): IntelligenceModule {
  return {
    id,
    name: `${id} module`,
    version: "1.0.0",
    dependencies,
    capabilities: [{ key: `${id}.run` }],
    async execute(context) {
      const startedAt = new Date().toISOString();
      if (!executeOk) {
        return {
          moduleId: id,
          ok: false,
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs: 0,
          error: "forced failure",
        };
      }
      context.set(`result:${id}`, { id });
      return {
        moduleId: id,
        ok: true,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: 1,
        data: { id },
      };
    },
  };
}

describe("Intelligence Platform Infrastructure (Sprint 027)", () => {
  beforeEach(() => {
    resetPlatformIdSeqForTests();
    resetGraphEdgeSeqForTests();
  });

  it("registers modules and resolves dependency order", () => {
    const registry = createIntelligenceRegistry();
    registry.register(makeModule("a"));
    registry.register(makeModule("b", ["a"]));
    registry.register(makeModule("c", ["b", "a"]));

    expect(registry.resolveOrder()).toEqual(["a", "b", "c"]);
    expect(registry.resolveOrder(["c"])).toEqual(["a", "b", "c"]);
  });

  it("detects duplicate, missing, and cyclic dependencies", () => {
    const registry = createIntelligenceRegistry();
    registry.register(makeModule("a"));
    expect(() => registry.register(makeModule("a"))).toThrow(
      IntelligenceRegistryError
    );

    registry.register(makeModule("b", ["missing"]));
    expect(() => registry.resolveOrder(["b"])).toThrow(/MISSING_DEPENDENCY|missing/i);

    const cyclic = createIntelligenceRegistry();
    cyclic.register(makeModule("x", ["y"]));
    cyclic.register(makeModule("y", ["x"]));
    expect(() => cyclic.resolveOrder()).toThrow(IntelligenceRegistryError);
  });

  it("runs the default integrated pipeline successfully", async () => {
    const platform = createIntelligencePlatform({
      clock: {
        now: () => new Date("2026-07-12T16:00:00.000Z"),
        createId: (prefix) => `${prefix}-test`,
      },
    });

    await platform.initialize();
    const result = await platform.run({
      scope: { organizationId: "org-1", schoolId: "school-1" },
      bypassCache: true,
    });

    expect(result.status).toBe("completed");
    expect(result.moduleOrder).toEqual([
      "organization-health",
      "financial",
      "founder",
      "executive",
      "executive-graph",
      "executive-decision",
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);

    const health = await platform.checkHealth();
    expect(health.modules.length).toBe(6);
    expect(["healthy", "degraded", "unhealthy", "unknown"]).toContain(health.status);

    const diagnostics = await platform.collectDiagnostics();
    expect(diagnostics.platformVersion).toBe(platform.version);
    expect(diagnostics.versions.length).toBeGreaterThanOrEqual(6);
    expect(diagnostics.recentEvents.length).toBeGreaterThan(0);

    await platform.shutdown();
  });

  it("caches module results on second identical run", async () => {
    const platform = createIntelligencePlatform({
      registerDefaults: false,
      providers: [
        createIntelligenceProvider("test", [makeModule("alpha"), makeModule("beta", ["alpha"])]),
      ],
      clock: {
        now: () => new Date("2026-07-12T16:00:00.000Z"),
        createId: (prefix) => `${prefix}-cache`,
      },
    });

    const first = await platform.run({
      scope: { organizationId: "org-1" },
      input: { n: 1 },
    });
    const second = await platform.run({
      scope: { organizationId: "org-1" },
      input: { n: 1 },
    });

    expect(first.status).toBe("completed");
    expect(second.status).toBe("completed");
    expect(second.stages.every((stage) => stage.cached === true)).toBe(true);
    expect(platform.cache.stats().hits).toBeGreaterThan(0);
  });

  it("records metrics, telemetry, configuration, and scheduler ticks", async () => {
    const platform = createIntelligencePlatform({
      registerDefaults: false,
      providers: [createIntelligenceProvider("solo", [makeModule("solo")])],
    });

    platform.configuration.set("custom.flag", true);
    expect(platform.configuration.get("custom.flag")).toBe(true);

    const events: string[] = [];
    platform.events.on((event) => events.push(event.kind));

    await platform.run({ bypassCache: true });
    expect(platform.metrics.list({ name: "pipeline.success" }).length).toBeGreaterThan(0);
    expect(events).toContain("pipeline.started");
    expect(events).toContain("pipeline.completed");

    platform.scheduler.schedule({
      id: "job-1",
      name: "Test job",
      intervalMs: 1000,
      enabled: true,
      nextRunAt: new Date(0).toISOString(),
    });
    const due = await platform.scheduler.tick(new Date("2026-07-12T16:00:00.000Z"));
    expect(due).toHaveLength(1);
    expect(platform.scheduler.get("job-1")?.runCount).toBe(1);
  });

  it("wires intelligencePlatform onto createIntelligenceService", async () => {
    const service = createIntelligenceService();
    expect(service.intelligencePlatform).toBeTruthy();
    expect(service.intelligencePlatform.registry.size()).toBeGreaterThanOrEqual(6);
    expect(service.executiveGraphAnalyzer).toBeTruthy();
    expect(service.executiveDecision).toBeTruthy();

    const partial = await service.intelligencePlatform.run({
      moduleIds: ["organization-health", "financial"],
      bypassCache: true,
      scope: { organizationId: "org-1" },
    });
    expect(partial.moduleOrder).toEqual(["organization-health", "financial"]);
    expect(partial.status).toBe("completed");
  });

  it("supports failFast partial failure behavior", async () => {
    const platform = createIntelligencePlatform({
      registerDefaults: false,
      providers: [
        createIntelligenceProvider("mix", [
          makeModule("ok"),
          makeModule("bad", ["ok"], false),
          makeModule("later", ["bad"]),
        ]),
      ],
    });

    const failFast = await platform.run({ failFast: true, bypassCache: true });
    expect(failFast.status).toBe("failed");
    expect(failFast.results.map((r) => r.moduleId)).toEqual(["ok", "bad"]);

    const continueAll = await platform.run({ failFast: false, bypassCache: true });
    expect(continueAll.results.map((r) => r.moduleId)).toEqual(["ok", "bad", "later"]);
    expect(continueAll.status).toBe("partial");
  });
});
