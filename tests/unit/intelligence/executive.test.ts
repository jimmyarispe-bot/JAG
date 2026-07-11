import { describe, expect, it } from "vitest";
import {
  createEmptyIntelligenceResult,
  createExecutiveIntelligenceDomain,
  createIntelligenceDomainRegistry,
  createIntelligenceService,
  EXECUTIVE_INTELLIGENCE_VERSION,
  validateIntelligenceDomain,
  type ExecutiveIntelligenceResult,
  type ExecutiveRequest,
} from "@/lib/platform/intelligence";

function makeRequest(overrides: Partial<ExecutiveRequest> = {}): ExecutiveRequest {
  return {
    requestId: "exec-req-1",
    subject: "Cash risk and enrollment forecast for board",
    description: "Need a strategic summary of cash decline and enrollment outlook",
    ...overrides,
  };
}

describe("Executive Intelligence domain", () => {
  it("classifies, diagnoses, finds, recommends, and schedules follow-ups", () => {
    const resolver = createExecutiveIntelligenceDomain();
    const result = resolver.analyze(
      makeRequest({
        subject: "Board risk briefing on cash and enrollment",
        description: "Critical cash decline with enrollment forecast variance",
      })
    );

    expect(result.domainVersion).toBe(EXECUTIVE_INTELLIGENCE_VERSION);
    expect(result.classification.category).not.toBe("general");
    expect(result.diagnostics.hypotheses.length).toBeGreaterThan(0);
    expect(result.diagnostics.primaryHypothesis).not.toBeNull();
    expect(result.analysis.findings.length).toBeGreaterThan(0);
    expect(result.analysis.primaryFinding).not.toBeNull();
    expect(result.recommendations.recommendations.length).toBeGreaterThan(0);
    expect(result.followup.status).toBe("scheduled");
    expect(result.followup.actions.length).toBeGreaterThan(0);
    expect(result.briefing.status).toBe("ready");
    expect(result.briefing.summary.length).toBeGreaterThan(0);
  });

  it("defaults to general when no category cues match", () => {
    const resolver = createExecutiveIntelligenceDomain();
    const result = resolver.analyze({
      requestId: "exec-general",
      subject: "Hello",
      description: "Please help",
    });

    expect(result.classification.category).toBe("general");
    expect(result.recommendations.category).toBe("general");
  });

  it("satisfies IntelligenceDomainModule when adapted for the registry", () => {
    const resolver = createExecutiveIntelligenceDomain();
    const module = {
      domainKey: "executive" as const,
      name: "Executive Intelligence",
      version: EXECUTIVE_INTELLIGENCE_VERSION,
      async handle(request: {
        runId?: string;
        domain: "executive";
        intent: string;
        actor: { userId: string | null };
        scope: { organizationId: string | null; schoolId: string | null };
      }) {
        const analysis = resolver.analyze({
          requestId: request.runId ?? "exec-handle",
          subject: request.intent,
        });
        return createEmptyIntelligenceResult({
          runId: request.runId ?? "exec-handle",
          context: {
            scope: request.scope,
            actor: request.actor,
            domain: "executive",
            session: null,
            permissions: [],
          },
          metadata: { executive: analysis },
        });
      },
    };

    expect(validateIntelligenceDomain(module).ok).toBe(true);

    const registry = createIntelligenceDomainRegistry();
    registry.register(module);
    expect(registry.get("executive")?.domainKey).toBe("executive");
  });

  it("is registered by createIntelligenceService", () => {
    const service = createIntelligenceService();
    const executive = service.registry.get("executive");

    expect(executive).toBeDefined();
    expect(executive?.domainKey).toBe("executive");
    expect(executive?.name).toBe("Executive Intelligence");
    expect(executive?.version).toBe(EXECUTIVE_INTELLIGENCE_VERSION);
    expect(service.registry.get("success")).toBeDefined();
    expect(service.registry.isInitialized()).toBe(true);
  });

  it("produces ExecutiveIntelligenceResult with expected shape", () => {
    const result: ExecutiveIntelligenceResult = createExecutiveIntelligenceDomain().analyze(
      makeRequest({ subject: "Enrollment opportunity and forecast" })
    );

    expect(result).toEqual(
      expect.objectContaining({
        requestId: "exec-req-1",
        domainVersion: EXECUTIVE_INTELLIGENCE_VERSION,
        classification: expect.objectContaining({
          category: expect.any(String),
          confidence: expect.objectContaining({ value: expect.any(Number) }),
        }),
        diagnostics: expect.objectContaining({
          hypotheses: expect.any(Array),
        }),
        analysis: expect.objectContaining({
          findings: expect.any(Array),
        }),
        recommendations: expect.objectContaining({
          recommendations: expect.any(Array),
        }),
        followup: expect.objectContaining({
          status: "scheduled",
          actions: expect.any(Array),
        }),
        briefing: expect.objectContaining({
          status: "ready",
        }),
      })
    );
  });
});
