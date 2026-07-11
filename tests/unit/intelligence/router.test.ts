import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEmptyIntelligenceResult,
  createIntelligenceDomainRegistry,
  createIntelligenceRouter,
  IntelligenceDomainRegistry,
  IntelligenceRouter,
  IntelligenceRouterError,
  isIntelligenceResult,
  type IntelligenceDomainModule,
  type IntelligenceResult,
  type IntelligenceRunRequest,
} from "@/lib/platform/intelligence";

function makeRequest(
  domain: IntelligenceRunRequest["domain"],
  runId = `run-${domain}`
): IntelligenceRunRequest {
  return {
    runId,
    domain,
    intent: `analyze ${domain}`,
    actor: { userId: "user-1", roleKeys: ["admin"] },
    scope: { organizationId: "org-1", schoolId: "school-1" },
  };
}

function makeMockDomain(
  domainKey: "success" | "executive",
  handleImpl?: IntelligenceDomainModule["handle"]
): IntelligenceDomainModule {
  return {
    domainKey,
    name: `${domainKey} mock`,
    version: "0.0.1-test",
    handle:
      handleImpl ??
      (async (request) =>
        createEmptyIntelligenceResult({
          runId: request.runId ?? `fallback-${domainKey}`,
          context: {
            scope: request.scope,
            actor: request.actor,
            domain: request.domain,
            session: null,
            permissions: request.actor.roleKeys ?? [],
          },
          metadata: { routedDomain: domainKey },
        })),
  };
}

describe("IntelligenceRouter", () => {
  let registry: IntelligenceDomainRegistry;
  let router: IntelligenceRouter;

  beforeEach(() => {
    registry = createIntelligenceDomainRegistry();
    router = createIntelligenceRouter(registry);
  });

  it("accepts the registry through constructor dependency injection", async () => {
    const injected = createIntelligenceDomainRegistry();
    injected.initialize();
    injected.register(makeMockDomain("success"));

    const wired = new IntelligenceRouter({ registry: injected });
    const result = await wired.route(makeRequest("success", "di-run"));

    expect(wired).toBeInstanceOf(IntelligenceRouter);
    expect(result.runId).toBe("di-run");
    expect(result.context.domain).toBe("success");
  });

  it("routes requests to the registered domain module for request.domain", async () => {
    const successHandle = vi.fn(async (request: IntelligenceRunRequest) =>
      createEmptyIntelligenceResult({
        runId: request.runId ?? "success-run",
        context: {
          scope: request.scope,
          actor: request.actor,
          domain: "success",
          session: null,
          permissions: [],
        },
        explanation: { summary: "success-domain" },
      })
    );
    const executiveHandle = vi.fn(async (request: IntelligenceRunRequest) =>
      createEmptyIntelligenceResult({
        runId: request.runId ?? "executive-run",
        context: {
          scope: request.scope,
          actor: request.actor,
          domain: "executive",
          session: null,
          permissions: [],
        },
        explanation: { summary: "executive-domain" },
      })
    );

    registry.initialize();
    registry.register(makeMockDomain("success", successHandle));
    registry.register(makeMockDomain("executive", executiveHandle));

    const successResult = await router.route(makeRequest("success", "r-success"));
    const executiveResult = await router.route(makeRequest("executive", "r-exec"));

    expect(successHandle).toHaveBeenCalledTimes(1);
    expect(executiveHandle).toHaveBeenCalledTimes(1);
    expect(successHandle.mock.calls[0]?.[0]?.domain).toBe("success");
    expect(executiveHandle.mock.calls[0]?.[0]?.domain).toBe("executive");
    expect(successResult.explanation.summary).toBe("success-domain");
    expect(executiveResult.explanation.summary).toBe("executive-domain");
  });

  it("throws IntelligenceRouterError when the registry is not initialized", async () => {
    registry.register(makeMockDomain("success"));

    await expect(router.route(makeRequest("success"))).rejects.toMatchObject({
      name: "IntelligenceRouterError",
      code: "REGISTRY_NOT_INITIALIZED",
      domainKey: "success",
    });
  });

  it("throws IntelligenceRouterError for an unknown domain", async () => {
    registry.initialize();
    registry.register(makeMockDomain("success"));

    await expect(router.route(makeRequest("financial"))).rejects.toBeInstanceOf(
      IntelligenceRouterError
    );

    await expect(router.route(makeRequest("financial"))).rejects.toMatchObject({
      code: "UNKNOWN_DOMAIN",
      domainKey: "financial",
      message: expect.stringContaining("financial"),
    });
  });

  it("propagates the domain IntelligenceResult unchanged", async () => {
    const expected: IntelligenceResult = createEmptyIntelligenceResult({
      runId: "propagated-run",
      status: "completed",
      engineVersion: "0.1.0",
      context: {
        scope: { organizationId: "org-1", schoolId: null },
        actor: { userId: "user-1" },
        domain: "success",
        session: null,
        permissions: ["support.view"],
      },
      explanation: { summary: "propagated" },
      metadata: { source: "mock-domain" },
    });

    registry.initialize();
    registry.register(makeMockDomain("success", async () => expected));

    const result = await router.route(makeRequest("success", "propagated-run"));

    expect(result).toBe(expected);
    expect(isIntelligenceResult(result)).toBe(true);
    expect(result.runId).toBe("propagated-run");
    expect(result.explanation.summary).toBe("propagated");
    expect(result.metadata).toEqual({ source: "mock-domain" });
  });

  it("wraps domain handle failures as ROUTE_FAILED", async () => {
    registry.initialize();
    registry.register(
      makeMockDomain("success", async () => {
        throw new Error("domain boom");
      })
    );

    await expect(router.route(makeRequest("success"))).rejects.toMatchObject({
      name: "IntelligenceRouterError",
      code: "ROUTE_FAILED",
      domainKey: "success",
    });
  });
});
