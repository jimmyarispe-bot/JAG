import { describe, expect, it, vi } from "vitest";
import {
  createSharedIntelligenceContextBuilder,
  freezeSharedContext,
  SharedIntelligenceContextBuilder,
  type SharedIntelligenceContextProvider,
  type SharedIntelligenceContextRequest,
} from "@/lib/platform/intelligence/context/builder";
import { SharedIntelligenceContextCache } from "@/lib/platform/intelligence/context/cache";
import {
  createEmptyExecutiveContextSection,
  ExecutiveContextProvider,
} from "@/lib/platform/intelligence/context/executive-context";
import {
  createEmptyFinanceContextSection,
  FinanceContextProvider,
} from "@/lib/platform/intelligence/context/finance-context";
import {
  createEmptyOrganizationContextSection,
  OrganizationContextProvider,
} from "@/lib/platform/intelligence/context/organization-context";
import {
  createEmptyStudentContextSection,
  StudentContextProvider,
} from "@/lib/platform/intelligence/context/student-context";

function makeRequest(
  overrides: Partial<SharedIntelligenceContextRequest> = {}
): SharedIntelligenceContextRequest {
  return {
    organizationId: "org-1",
    schoolId: "school-1",
    userId: "user-1",
    runId: "run-shared-1",
    ...overrides,
  };
}

describe("SharedIntelligenceContextCache", () => {
  it("stores and retrieves values", async () => {
    const cache = new SharedIntelligenceContextCache();
    expect(cache.has("a")).toBe(false);
    cache.set("a", 42);
    expect(cache.has("a")).toBe(true);
    expect(cache.get<number>("a")).toBe(42);
  });

  it("executes factory only once via getOrSet", async () => {
    const cache = new SharedIntelligenceContextCache();
    const factory = vi.fn(async () => "value");

    const first = await cache.getOrSet("exec", factory);
    const second = await cache.getOrSet("exec", factory);

    expect(first).toBe("value");
    expect(second).toBe("value");
    expect(factory).toHaveBeenCalledTimes(1);
    expect(cache.size()).toBe(1);
  });

  it("clears all entries", () => {
    const cache = new SharedIntelligenceContextCache();
    cache.set("x", 1);
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get("x")).toBeUndefined();
  });
});

describe("SharedIntelligenceContextBuilder", () => {
  it("assembles a shared context from default providers", async () => {
    const builder = createSharedIntelligenceContextBuilder();
    const context = await builder.build(makeRequest());

    expect(context.requestId).toBe("run-shared-1");
    expect(context.scope).toEqual({ organizationId: "org-1", schoolId: "school-1" });
    expect(context.executive?.available).toBe(false);
    expect(context.finance?.available).toBe(false);
    expect(context.student?.available).toBe(false);
    expect(context.organization?.available).toBe(false);
    expect(context.errors).toEqual([]);
    expect(context.builtAt).toEqual(expect.any(String));
  });

  it("supports dependency injection of providers", async () => {
    const executiveLoad = vi.fn(async (request: SharedIntelligenceContextRequest) => ({
      ...createEmptyExecutiveContextSection(request),
      available: true,
      summary: "injected-executive",
      riskFlags: ["cash"],
    }));

    const builder = new SharedIntelligenceContextBuilder({
      executive: new ExecutiveContextProvider({ load: executiveLoad }),
      finance: new FinanceContextProvider({
        load: async (request) => ({
          ...createEmptyFinanceContextSection(request),
          available: true,
          cashPosition: 1000,
        }),
      }),
      student: new StudentContextProvider({
        load: async (request) => ({
          ...createEmptyStudentContextSection(request),
          available: true,
          enrollmentCount: 250,
        }),
      }),
      organization: new OrganizationContextProvider({
        load: async (request) => ({
          ...createEmptyOrganizationContextSection(request),
          available: true,
          organizationName: "Academy OS Org",
        }),
      }),
    });

    const context = await builder.build(makeRequest());

    expect(executiveLoad).toHaveBeenCalledTimes(1);
    expect(context.executive?.summary).toBe("injected-executive");
    expect(context.executive?.riskFlags).toEqual(["cash"]);
    expect(context.finance?.cashPosition).toBe(1000);
    expect(context.student?.enrollmentCount).toBe(250);
    expect(context.organization?.organizationName).toBe("Academy OS Org");
    expect(context.errors).toEqual([]);
  });

  it("executes each provider once and caches within the build", async () => {
    const loads = {
      executive: 0,
      finance: 0,
      student: 0,
      organization: 0,
    };

    const trackingProvider = <T>(
      key: keyof typeof loads,
      empty: (request: SharedIntelligenceContextRequest) => T
    ): SharedIntelligenceContextProvider<T> => ({
      key,
      async load(request) {
        loads[key] += 1;
        return empty(request);
      },
    });

    const sharedCache = new SharedIntelligenceContextCache();
    const builder = new SharedIntelligenceContextBuilder({
      executive: trackingProvider("executive", createEmptyExecutiveContextSection),
      finance: trackingProvider("finance", createEmptyFinanceContextSection),
      student: trackingProvider("student", createEmptyStudentContextSection),
      organization: trackingProvider("organization", createEmptyOrganizationContextSection),
      createCache: () => sharedCache,
    });

    await builder.build(makeRequest());

    // Second getOrSet on same cache keys would reuse — simulate provider re-entry via cache
    await sharedCache.getOrSet("executive", async () => {
      loads.executive += 1;
      return createEmptyExecutiveContextSection(makeRequest());
    });

    expect(loads.executive).toBe(1);
    expect(loads.finance).toBe(1);
    expect(loads.student).toBe(1);
    expect(loads.organization).toBe(1);
  });

  it("fails gracefully when a provider throws and preserves other sections", async () => {
    const builder = new SharedIntelligenceContextBuilder({
      executive: {
        key: "executive",
        load: async () => {
          throw new Error("executive provider boom");
        },
      },
      finance: new FinanceContextProvider({
        load: async (request) => ({
          ...createEmptyFinanceContextSection(request),
          available: true,
          cashPosition: 500,
        }),
      }),
      student: new StudentContextProvider(),
      organization: new OrganizationContextProvider(),
    });

    const context = await builder.build(makeRequest());

    expect(context.executive).toBeNull();
    expect(context.finance?.cashPosition).toBe(500);
    expect(context.student).not.toBeNull();
    expect(context.organization).not.toBeNull();
    expect(context.errors).toEqual([
      { providerKey: "executive", message: "executive provider boom" },
    ]);
  });

  it("returns an immutable shared context", async () => {
    const builder = createSharedIntelligenceContextBuilder();
    const context = await builder.build(makeRequest());

    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.scope)).toBe(true);
    expect(Object.isFrozen(context.errors)).toBe(true);
    if (context.finance) {
      expect(Object.isFrozen(context.finance)).toBe(true);
    }

    expect(() => {
      (context as { requestId: string }).requestId = "mutated";
    }).toThrow();

    const frozen = freezeSharedContext({ a: { b: 1 }, c: [1, 2] });
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.a)).toBe(true);
    expect(Object.isFrozen(frozen.c)).toBe(true);
  });
});
