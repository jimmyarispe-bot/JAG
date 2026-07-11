import { describe, expect, it } from "vitest";
import {
  INTELLIGENCE_DOMAINS,
  INTELLIGENCE_ENGINE_VERSION,
  assertIntelligenceDomain,
  createEmptyIntelligenceResult,
  isIntelligenceDomain,
  isIntelligenceResult,
  validateIntelligenceDomain,
  type IntelligenceDomain,
  type IntelligenceDomainModule,
  type IntelligenceResult,
  type IntelligenceRunRequest,
} from "@/lib/platform/intelligence";

function makeRequest(domain: IntelligenceDomain): IntelligenceRunRequest {
  return {
    domain,
    intent: "test intent",
    actor: { userId: "user-1" },
    scope: { organizationId: "org-1", schoolId: "school-1" },
  };
}

function makeValidModule(domainKey: IntelligenceDomain): IntelligenceDomainModule {
  return {
    domainKey,
    name: `${domainKey} test domain`,
    version: "0.0.0-test",
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

describe("Intelligence contracts", () => {
  it("treats every INTELLIGENCE_DOMAINS entry as a valid domain key", () => {
    for (const domain of INTELLIGENCE_DOMAINS) {
      expect(isIntelligenceDomain(domain)).toBe(true);
    }
    expect(isIntelligenceDomain("not-a-domain")).toBe(false);
  });

  it("accepts an IntelligenceDomainModule for every known domain key", () => {
    for (const domain of INTELLIGENCE_DOMAINS) {
      const module = makeValidModule(domain);
      const result = validateIntelligenceDomain(module);
      expect(result.ok).toBe(true);
      expect(result.issues).toEqual([]);
      expect(() => assertIntelligenceDomain(module)).not.toThrow();
    }
  });

  it("fails validation for invalid domain modules", () => {
    expect(validateIntelligenceDomain(null).ok).toBe(false);
    expect(validateIntelligenceDomain({}).ok).toBe(false);

    const invalidKey = validateIntelligenceDomain({
      domainKey: "not-a-real-domain",
      name: "Bad",
      version: "1.0.0",
      handle: async () => makeValidModule("success").handle(makeRequest("success")),
    });
    expect(invalidKey.ok).toBe(false);
    expect(invalidKey.issues.map((issue) => issue.code)).toContain("invalid_domain_key");

    const missingHandle = validateIntelligenceDomain({
      domainKey: "success",
      name: "Success",
      version: "1.0.0",
    });
    expect(missingHandle.ok).toBe(false);
    expect(missingHandle.issues.map((issue) => issue.code)).toContain("missing_handle");

    expect(() =>
      assertIntelligenceDomain({
        domainKey: "success",
        name: "",
        version: "1",
        handle: "nope",
      })
    ).toThrow(/Invalid Intelligence domain module/);
  });

  it("verifies IntelligenceResult required shape", async () => {
    const module = makeValidModule("success");
    const result: IntelligenceResult = await module.handle(makeRequest("success"));

    expect(isIntelligenceResult(result)).toBe(true);
    expect(result.runId).toEqual(expect.any(String));
    expect(result.status).toBe("completed");
    expect(result.engineVersion).toBe(INTELLIGENCE_ENGINE_VERSION);
    expect(result.completedAt).toEqual(expect.any(String));
    expect(result.context.domain).toBe("success");
    expect(Array.isArray(result.memory)).toBe(true);
    expect(Array.isArray(result.events)).toBe(true);
    expect(result.confidence).toEqual(
      expect.objectContaining({
        value: expect.any(Number),
        level: expect.any(String),
        factors: expect.any(Array),
      })
    );
    expect(result.plan).toEqual(
      expect.objectContaining({
        planId: expect.any(String),
        steps: expect.any(Array),
        primaryRecommendation: null,
      })
    );
    expect(result.explanation).toEqual(expect.objectContaining({ summary: expect.any(String) }));
    expect(result.learning).toEqual(
      expect.objectContaining({
        learningId: expect.any(String),
        domain: "success",
        outcomeId: expect.any(String),
      })
    );

    expect(isIntelligenceResult(null)).toBe(false);
    expect(isIntelligenceResult({ runId: "only" })).toBe(false);
    expect(isIntelligenceResult({ ...result, status: "not-a-status" })).toBe(false);
  });
});
