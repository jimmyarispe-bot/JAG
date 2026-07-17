import { beforeEach, describe, expect, it } from "vitest";
import {
  createEmptyIntelligenceResult,
  createIntelligenceDomainRegistry,
  IntelligenceDomainRegistry,
  IntelligenceDomainRegistryError,
  type IntelligenceDomainModule,
} from "@/lib/platform/intelligence";

function makeModule(
  domainKey: "success" | "executive" | "operational",
  name = `${domainKey} domain`
): IntelligenceDomainModule {
  return {
    domainKey,
    name,
    version: "1.0.0-test",
    async handle(request) {
      return createEmptyIntelligenceResult({
        runId: request.runId ?? `run-${domainKey}`,
        context: {
          scope: request.scope,
          actor: request.actor,
          domain: request.domain,
          session: null,
          permissions: [],
        },
      });
    },
  };
}

describe("IntelligenceDomainRegistry", () => {
  let registry: IntelligenceDomainRegistry;

  beforeEach(() => {
    registry = createIntelligenceDomainRegistry();
  });

  it("creates an uninitialized empty registry", () => {
    expect(registry.isInitialized()).toBe(false);
    expect(registry.list()).toEqual([]);
    expect(registry.keys()).toEqual([]);
  });

  it("marks the registry initialized", () => {
    registry.initialize();
    expect(registry.isInitialized()).toBe(true);
    registry.initialize();
    expect(registry.isInitialized()).toBe(true);
  });

  it("registers a domain and retrieves it by key", () => {
    const domainModule = makeModule("success");
    registry.register(domainModule);

    expect(registry.get("success")).toBe(domainModule);
    expect(registry.list()).toEqual([domainModule]);
    expect(registry.keys()).toEqual(["success"]);
  });

  it("prevents duplicate registration", () => {
    registry.register(makeModule("success", "First"));

    expect(() => registry.register(makeModule("success", "Second"))).toThrow(
      IntelligenceDomainRegistryError
    );

    try {
      registry.register(makeModule("success", "Second"));
      expect.unreachable("expected duplicate registration to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(IntelligenceDomainRegistryError);
      expect((error as IntelligenceDomainRegistryError).code).toBe("DUPLICATE_DOMAIN");
      expect((error as IntelligenceDomainRegistryError).domainKey).toBe("success");
    }

    expect(registry.list()).toHaveLength(1);
    expect(registry.get("success")?.name).toBe("First");
  });

  it("lists registered domains in stable key order", () => {
    registry.register(makeModule("executive"));
    registry.register(makeModule("success"));
    registry.register(makeModule("operational"));

    expect(registry.keys()).toEqual(["executive", "operational", "success"]);
    expect(registry.list().map((domainModule) => domainModule.domainKey)).toEqual([
      "executive",
      "operational",
      "success",
    ]);
  });

  it("returns undefined for an unknown domain", () => {
    registry.register(makeModule("success"));
    expect(registry.get("financial")).toBeUndefined();
    expect(registry.get("not-a-domain")).toBeUndefined();
  });

  it("rejects invalid modules on register", () => {
    expect(() =>
      registry.register({
        domainKey: "success",
        name: "Broken",
        version: "1",
      } as IntelligenceDomainModule)
    ).toThrow(IntelligenceDomainRegistryError);
  });

  it("clear resets registrations and initialization", () => {
    registry.initialize();
    registry.register(makeModule("success"));
    registry.clear();

    expect(registry.isInitialized()).toBe(false);
    expect(registry.get("success")).toBeUndefined();
    expect(registry.list()).toEqual([]);
  });
});
