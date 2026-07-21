import { describe, expect, it, vi } from "vitest";
import {
  createAuthFramework,
  createEventBus,
  createGraphEntityBuilder,
  createGraphRelationshipBuilder,
  createIntegrationPlatformCore,
  createNormalizationPipeline,
  createPlatformConnectorRegistry,
  createPlatformInfrastructureRegistry,
  createScheduler,
  createStubPlatformConnector,
  createSyncEngine,
  INTEGRATION_PLATFORM_VERSION,
  INTEGRATIONS_PLATFORM_DESCRIPTOR,
  LifecycleManager,
  PLATFORM_EVENT_TYPES,
  PLATFORM_INFRASTRUCTURE_PILLARS,
  PlatformRegistryError,
  registerConnector,
  TelemetryCollector,
  computeBackoff,
  DEFAULT_RETRY_POLICY,
} from "@/lib/platform/integrations";
import {
  CircuitBreaker,
  RateLimiter,
  withRetry,
} from "@/lib/platform/integrations/core";
import { createOiosOperatingSystem } from "@/lib/platform/oios";

describe("Sprint 073 — Integration Platform Core", () => {
  describe("connector registration & discovery", () => {
    it("registers connectors and discovers catalog metadata", () => {
      const registry = createPlatformConnectorRegistry();
      const connector = createStubPlatformConnector({ id: "alpha", version: "1.2.3" });
      registerConnector(registry, connector);

      expect(registry.has("alpha")).toBe(true);
      expect(registry.getVersion("alpha")).toBe("1.2.3");
      expect(registry.list()).toHaveLength(1);
      expect(registry.discover()[0]?.version).toBe("1.2.3");
    });

    it("rejects duplicates, invalid versions, and missing dependencies", () => {
      const registry = createPlatformConnectorRegistry();
      registry.register(createStubPlatformConnector({ id: "alpha", version: "1.0.0" }));

      expect(() =>
        registry.register(createStubPlatformConnector({ id: "alpha", version: "1.0.1" }))
      ).toThrow(PlatformRegistryError);

      expect(() =>
        registry.register(createStubPlatformConnector({ id: "bad", version: "v1" }))
      ).toThrow(/invalid version/i);

      expect(() =>
        registry.register(createStubPlatformConnector({ id: "beta", version: "1.0.0" }), {
          dependencies: ["missing"],
        })
      ).toThrow(/missing connector/i);
    });

    it("supports enable/disable and dependency validation", () => {
      const registry = createPlatformConnectorRegistry();
      registry.register(createStubPlatformConnector({ id: "base", version: "1.0.0" }));
      registry.register(createStubPlatformConnector({ id: "child", version: "1.0.0" }), {
        dependencies: ["base"],
      });
      registry.disable("base");
      const validation = registry.validateDependencies();
      expect(validation.ok).toBe(false);
      expect(validation.issues[0]).toMatch(/disabled/);
    });
  });

  describe("authentication abstraction", () => {
    it("authenticates via registered strategy adapters", async () => {
      const auth = createAuthFramework();
      const apiKey = await auth.authenticate({
        connectorId: "x",
        instanceId: "i1",
        strategy: "api_key",
        credentials: { apiKey: "secret" },
      });
      expect(apiKey.ok).toBe(true);
      expect(apiKey.accessToken).toBe("secret");

      const oauth = await auth.authenticate({
        connectorId: "x",
        instanceId: "i1",
        strategy: "oauth2",
        credentials: { accessToken: "at", refreshToken: "rt" },
      });
      expect(oauth.ok).toBe(true);

      const refreshed = await auth.refresh({
        connectorId: "x",
        instanceId: "i1",
        strategy: "oauth2",
        credentials: { refreshToken: "rt", accessToken: "at" },
      });
      expect(refreshed.ok).toBe(true);
      expect(refreshed.expiresAt).toBeTruthy();
    });

    it("supports jwt, basic, and service account strategies", async () => {
      const auth = createAuthFramework();
      expect(
        (
          await auth.authenticate({
            connectorId: "x",
            instanceId: "i",
            strategy: "jwt",
            credentials: { jwt: "eyJ" },
          })
        ).ok
      ).toBe(true);
      expect(
        (
          await auth.authenticate({
            connectorId: "x",
            instanceId: "i",
            strategy: "basic",
            credentials: { username: "u", password: "p" },
          })
        ).ok
      ).toBe(true);
      expect(
        (
          await auth.authenticate({
            connectorId: "x",
            instanceId: "i",
            strategy: "service_account",
            credentials: { clientEmail: "a@b.c", privateKey: "k" },
          })
        ).ok
      ).toBe(true);
    });
  });

  describe("sync lifecycle", () => {
    it("runs manual sync through the shared engine and records telemetry", async () => {
      const platform = createIntegrationPlatformCore();
      const connector = createStubPlatformConnector({ id: "sync-demo", syncRecords: 5 });
      platform.registerConnector(connector);
      platform.lifecycle.seed("sync-demo-1", "connected");

      const result = await platform.syncNow("sync-demo", "sync-demo-1", "full");
      expect(result.status).toBe("succeeded");
      expect(result.recordsFetched).toBe(5);

      const telemetry = platform.telemetry.snapshot("sync-demo", "sync-demo-1");
      expect(telemetry.counters.syncSucceeded).toBe(1);
      expect(telemetry.counters.recordsProcessed).toBe(5);
      expect(platform.lifecycle.getState("sync-demo-1")).toBe("healthy");
      expect(platform.events.list().some((e) => e.type === "SYNC_COMPLETED")).toBe(true);
    });

    it("resolves incremental vs full from cursor presence", () => {
      const engine = createSyncEngine();
      expect(engine.resolveMode("incremental", false)).toBe("full");
      expect(engine.resolveMode("incremental", true)).toBe("incremental");
      expect(engine.resolveMode("full", true)).toBe("full");
      expect(engine.resolveMode("manual", true)).toBe("manual");
    });

    it("executes due schedules through the same sync path", async () => {
      let nowMs = Date.parse("2026-01-01T00:00:00.000Z");
      const platform = createIntegrationPlatformCore({
        now: () => new Date(nowMs),
      });
      platform.registerConnector(createStubPlatformConnector({ id: "sched" }));
      platform.lifecycle.seed("sched-1", "connected");
      platform.scheduler.schedule({
        connectorId: "sched",
        instanceId: "sched-1",
        cron: "*/5 * * * *",
        mode: "scheduled",
      });
      nowMs = Date.parse("2026-01-01T01:00:00.000Z");
      const results = await platform.runDueSchedules();
      expect(results).toHaveLength(1);
      expect(results[0]?.status).toBe("succeeded");
    });
  });

  describe("retry policies", () => {
    it("retries with exponential backoff then succeeds", async () => {
      let attempts = 0;
      const sleep = vi.fn(async () => undefined);
      const value = await withRetry(
        async () => {
          attempts += 1;
          if (attempts < 3) throw new Error("timeout");
          return "ok";
        },
        {
          policy: { maxAttempts: 4, baseDelayMs: 10, maxDelayMs: 100, jitter: false },
          sleep,
        }
      );
      expect(value).toBe("ok");
      expect(attempts).toBe(3);
      expect(sleep).toHaveBeenCalled();
      expect(computeBackoff({ ...DEFAULT_RETRY_POLICY, jitter: false }, 3)).toBeGreaterThan(
        computeBackoff({ ...DEFAULT_RETRY_POLICY, jitter: false }, 1)
      );
    });

    it("opens the circuit breaker after consecutive failures", async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        successThreshold: 1,
        openMs: 10_000,
      });
      await expect(breaker.execute(async () => { throw new Error("boom"); })).rejects.toThrow();
      await expect(breaker.execute(async () => { throw new Error("boom"); })).rejects.toThrow();
      expect(breaker.getState()).toBe("open");
      await expect(breaker.execute(async () => "x")).rejects.toThrow(/circuit breaker/i);
    });
  });

  describe("rate limiting", () => {
    it("throttles when the window is exhausted", async () => {
      let now = 1_000_000;
      const sleep = vi.fn(async (ms: number) => {
        now += ms;
      });
      const limiter = new RateLimiter(
        { maxRequests: 2, windowMs: 1_000 },
        sleep
      );
      // Patch Date.now for deterministic window math inside the limiter.
      const realNow = Date.now;
      Date.now = () => now;
      try {
        await limiter.acquire();
        await limiter.acquire();
        expect(limiter.getState()).toBe("throttled");
        await limiter.acquire();
        expect(sleep).toHaveBeenCalled();
      } finally {
        Date.now = realNow;
      }
    });

    it("enters blocked state after provider rate-limit signal", () => {
      const limiter = new RateLimiter({ maxRequests: 10, windowMs: 1_000 });
      limiter.signalProviderLimit(5_000);
      expect(limiter.getState()).toBe("blocked");
    });
  });

  describe("event bus", () => {
    it("publishes and delivers to typed and wildcard subscribers", async () => {
      const bus = createEventBus();
      const seen: string[] = [];
      bus.subscribe("SYNC_COMPLETED", (event) => {
        seen.push(event.type);
      });
      bus.subscribe("*", (event) => {
        seen.push(`*:${event.type}`);
      });
      await bus.publish({
        type: "SYNC_COMPLETED",
        payload: { ok: true },
        connectorId: "c1",
      });
      expect(seen).toContain("SYNC_COMPLETED");
      expect(seen).toContain("*:SYNC_COMPLETED");
      expect(PLATFORM_EVENT_TYPES).toContain("PAYMENT_RECEIVED");
      expect(PLATFORM_EVENT_TYPES).toContain("CONNECTOR_FAILED");
    });
  });

  describe("normalization pipeline", () => {
    it("validates, maps, deduplicates, and emits canonical entities", () => {
      const pipeline = createNormalizationPipeline({
        mapper: {
          map: (record) => ({ name: record.payload.name }),
          canonicalTypeFor: () => "person",
        },
      });
      const result = pipeline.run(
        [
          { externalId: "1", objectType: "user", payload: { name: "Ada" } },
          { externalId: "1", objectType: "user", payload: { name: "Ada Lovelace" } },
          { externalId: "", objectType: "user", payload: { name: "Bad" } },
        ],
        {
          connectorId: "stub",
          instanceId: "stub-1",
          sourceSystem: "stub",
        }
      );
      expect(result.rejected).toBe(1);
      expect(result.duplicates).toBe(1);
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0]?.canonicalType).toBe("person");
      expect(result.entities[0]?.data.name).toBe("Ada Lovelace");
    });

    it("builds graph node and relationship hints from canonical entities", () => {
      const pipeline = createNormalizationPipeline();
      const { entities } = pipeline.run(
        [{ externalId: "42", objectType: "account", payload: { name: "Acme" } }],
        { connectorId: "c", instanceId: "i", sourceSystem: "erp" }
      );
      const nodes = createGraphEntityBuilder().buildNodes(entities);
      expect(nodes[0]?.entityType).toBe("account");
      const rel = createGraphRelationshipBuilder().build({
        type: "RELATED_TO",
        from: entities[0]!,
        to: entities[0]!,
      });
      expect(rel.type).toBe("RELATED_TO");
    });
  });

  describe("lifecycle transitions", () => {
    it("allows valid transitions and audits them", () => {
      const lifecycle = new LifecycleManager(() => new Date("2026-07-19T12:00:00.000Z"));
      lifecycle.transition({
        connectorId: "c",
        instanceId: "i",
        to: "installing",
        reason: "start",
      });
      lifecycle.transition({
        connectorId: "c",
        instanceId: "i",
        to: "authenticating",
        reason: "auth",
      });
      lifecycle.transition({
        connectorId: "c",
        instanceId: "i",
        to: "connected",
        reason: "ok",
      });
      expect(lifecycle.getState("i")).toBe("connected");
      expect(lifecycle.listAudit("i")).toHaveLength(3);
    });

    it("rejects invalid transitions", () => {
      const lifecycle = new LifecycleManager();
      lifecycle.seed("i", "disconnected");
      expect(() =>
        lifecycle.transition({
          connectorId: "c",
          instanceId: "i",
          to: "healthy",
          reason: "skip",
        })
      ).toThrow(/invalid lifecycle transition/i);
    });
  });

  describe("telemetry", () => {
    it("tracks sync counters and rate-limit hits", () => {
      const telemetry = new TelemetryCollector();
      telemetry.recordSyncStart("c", "i");
      telemetry.recordSyncSuccess({
        connectorId: "c",
        instanceId: "i",
        durationMs: 12,
        recordsProcessed: 4,
      });
      telemetry.recordRateLimit("c", "i", "throttled");
      const snap = telemetry.snapshot("c", "i");
      expect(snap.counters.syncStarted).toBe(1);
      expect(snap.counters.syncSucceeded).toBe(1);
      expect(snap.counters.recordsProcessed).toBe(4);
      expect(snap.rateLimitState).toBe("throttled");
    });
  });

  describe("platform infrastructure / OIOS registration", () => {
    it("registers Integrations as a non-DAG platform pillar", () => {
      const infra = createPlatformInfrastructureRegistry();
      expect(PLATFORM_INFRASTRUCTURE_PILLARS.map((p) => p.id)).toEqual([
        "intelligence",
        "integrations",
        "security",
        "identity",
        "observability",
      ]);
      expect(infra.require("integrations").intelligenceDag).toBe(false);
      expect(INTEGRATIONS_PLATFORM_DESCRIPTOR.intelligenceDag).toBe(false);
      expect(INTEGRATIONS_PLATFORM_DESCRIPTOR.version).toBe(INTEGRATION_PLATFORM_VERSION);
      expect(() => infra.assertIntegrationsIndependent()).not.toThrow();
    });

    it("attaches Integration Platform Core to OIOS without intelligence DAG membership", () => {
      const oios = createOiosOperatingSystem({ wireOrganizationDna: false });
      expect(oios.platformInfrastructure.get("integrations")?.id).toBe("integrations");
      expect(oios.integrations?.version).toBe(INTEGRATION_PLATFORM_VERSION);
      expect(oios.integrationsDescriptor.intelligenceDag).toBe(false);
      // Intelligence domain registry must not list integrations as a domain module.
      const domains = oios.registry.list().map((d) => d.domain);
      expect(domains).not.toContain("integrations" as never);
    });
  });

  describe("scheduler helpers", () => {
    it("computes next run times for interval cron", () => {
      const scheduler = createScheduler(() => new Date("2026-01-01T00:00:00.000Z"));
      const { nextRunAt } = scheduler.schedule({
        connectorId: "c",
        instanceId: "i",
        cron: "*/15 * * * *",
      });
      expect(nextRunAt).toBe("2026-01-01T00:15:00.000Z");
    });
  });
});
