import { describe, expect, it, vi } from "vitest";
import {
  createIntelligenceService,
  IntelligenceConfidenceService,
  IntelligenceContextService,
  IntelligenceEventService,
  IntelligenceExplainService,
  IntelligenceKnowledgeService,
  IntelligenceLearningService,
  IntelligenceMemoryService,
  IntelligenceOrchestrator,
  IntelligencePlannerService,
  IntelligenceReasoningService,
  IntelligenceRouter,
  isIntelligenceResult,
  SUPPORT_INTELLIGENCE_VERSION,
  type BuildIntelligenceContextInput,
  type IntelligenceOrchestratorDependencies,
  type IntelligenceRunRequest,
  type SupportIntelligenceResult,
} from "@/lib/platform/intelligence";

/**
 * Foundation stage services throw "not implemented".
 * Integration tests inject working doubles via createIntelligenceService options
 * so the real registry → router → support domain → orchestrator path can run.
 */
function createTestOrchestratorDependencies(): IntelligenceOrchestratorDependencies {
  const context = new IntelligenceContextService();
  vi.spyOn(context, "build").mockImplementation((input: BuildIntelligenceContextInput) => ({
    scope: {
      organizationId: input.organizationId ?? null,
      schoolId: input.schoolId ?? null,
    },
    actor: {
      userId: input.userId ?? null,
      roleKeys: input.roleKeys,
    },
    domain: input.domain,
    session: null,
    permissions: input.permissions ?? [],
    locale: input.locale,
    metadata: input.metadata,
  }));
  vi.spyOn(context, "validate").mockReturnValue(true);

  const knowledge = new IntelligenceKnowledgeService();
  vi.spyOn(knowledge, "query").mockImplementation((_ctx, query) => ({
    nodes: [],
    query,
    retrievedAt: new Date().toISOString(),
  }));

  const memory = new IntelligenceMemoryService();
  vi.spyOn(memory, "recall").mockReturnValue([]);

  const reasoning = new IntelligenceReasoningService();
  vi.spyOn(reasoning, "reason").mockReturnValue({
    hypotheses: [],
    primaryHypothesis: null,
    reasoningNotes: ["integration-test"],
  });

  const confidence = new IntelligenceConfidenceService();
  vi.spyOn(confidence, "score").mockReturnValue({
    value: 0.5,
    level: "medium",
    factors: [],
  });

  const planner = new IntelligencePlannerService();
  vi.spyOn(planner, "plan").mockReturnValue({
    planId: "integration-plan",
    steps: [],
    primaryRecommendation: null,
    summary: "integration plan",
  });

  const explain = new IntelligenceExplainService();
  vi.spyOn(explain, "explain").mockReturnValue({
    summary: "integration explanation",
  });

  const learning = new IntelligenceLearningService();
  vi.spyOn(learning, "record").mockImplementation((_ctx, input) => ({
    learningId: "integration-learning",
    domain: input.domain,
    recommendationId: input.recommendation?.recommendationId,
    outcomeId: input.outcome.outcomeId,
    summary: input.summary ?? input.outcome.summary,
    success: input.outcome.success,
    organizationId: _ctx.scope.organizationId,
    schoolId: _ctx.scope.schoolId,
    createdAt: new Date().toISOString(),
  }));

  const events = new IntelligenceEventService();
  vi.spyOn(events, "publish").mockImplementation((ctx, input) => ({
    eventType: input.eventType,
    eventId: "integration-event",
    occurredAt: new Date().toISOString(),
    organizationId: ctx.scope.organizationId,
    schoolId: ctx.scope.schoolId,
    runId: input.runId,
    payload: input.payload ?? {},
    metadata: input.metadata,
  }));

  return {
    context,
    knowledge,
    memory,
    reasoning,
    confidence,
    planner,
    explain,
    learning,
    events,
  };
}

function makeSuccessRequest(): IntelligenceRunRequest {
  return {
    runId: "integration-run-1",
    domain: "success",
    intent: "I can't login to the dashboard",
    actor: { userId: "user-integration", roleKeys: ["admin"] },
    scope: { organizationId: "org-integration", schoolId: "school-integration" },
    input: {
      description: "Password reset failed after timeout",
      affectedModule: "auth",
    },
  };
}

describe("Intelligence service integration", () => {
  it("initializes the service with Support Intelligence registered", () => {
    const service = createIntelligenceService({
      orchestratorDependencies: createTestOrchestratorDependencies(),
    });

    expect(service).toBeTruthy();
    expect(service.registry.isInitialized()).toBe(true);
    expect(service.registry.get("success")).toEqual(
      expect.objectContaining({
        domainKey: "success",
        name: "Support Intelligence",
        version: SUPPORT_INTELLIGENCE_VERSION,
      })
    );
    expect(service.router).toBeInstanceOf(IntelligenceRouter);
    expect(service.orchestrator).toBeInstanceOf(IntelligenceOrchestrator);
  });

  it("runs end-to-end: router → support domain → orchestrator → IntelligenceResult", async () => {
    const orchestratorDependencies = createTestOrchestratorDependencies();
    const service = createIntelligenceService({ orchestratorDependencies });
    const request = makeSuccessRequest();

    const orchestratorRun = vi.spyOn(service.orchestrator, "run");
    const routerRoute = vi.spyOn(service.router, "route");

    const result = await service.runIntelligence(request);

    expect(routerRoute).toHaveBeenCalledTimes(1);
    expect(routerRoute).toHaveBeenCalledWith(request);
    expect(orchestratorRun).toHaveBeenCalledTimes(1);
    expect(orchestratorRun).toHaveBeenCalledWith(request);

    expect(orchestratorDependencies.context.build).toHaveBeenCalled();
    expect(orchestratorDependencies.context.validate).toHaveBeenCalled();
    expect(orchestratorDependencies.knowledge.query).toHaveBeenCalled();
    expect(orchestratorDependencies.memory.recall).toHaveBeenCalled();
    expect(orchestratorDependencies.reasoning.reason).toHaveBeenCalled();
    expect(orchestratorDependencies.confidence.score).toHaveBeenCalled();
    expect(orchestratorDependencies.planner.plan).toHaveBeenCalled();
    expect(orchestratorDependencies.explain.explain).toHaveBeenCalled();
    expect(orchestratorDependencies.learning.record).toHaveBeenCalled();
    expect(orchestratorDependencies.events.publish).toHaveBeenCalled();

    expect(isIntelligenceResult(result)).toBe(true);
    expect(result.runId).toBe("integration-run-1");
    expect(result.status).toBe("completed");
    expect(result.context.domain).toBe("success");
    expect(result.context.scope.organizationId).toBe("org-integration");
    expect(result.explanation.summary).toBe("integration explanation");

    const support = result.metadata?.support as SupportIntelligenceResult | undefined;
    expect(support).toBeDefined();
    expect(support?.requestId).toBe("integration-run-1");
    expect(support?.domainVersion).toBe(SUPPORT_INTELLIGENCE_VERSION);
    expect(support?.classification.category).toBe("authentication");
    expect(support?.resolution.status).toBe("ready");
    expect(support?.followup.status).toBe("scheduled");
    expect(support?.diagnostics.hypotheses.length).toBeGreaterThan(0);
  });

  it("rejects unknown domains through the real router", async () => {
    const service = createIntelligenceService({
      orchestratorDependencies: createTestOrchestratorDependencies(),
    });

    await expect(
      service.runIntelligence({
        ...makeSuccessRequest(),
        domain: "financial",
        runId: "integration-unknown",
      })
    ).rejects.toMatchObject({
      name: "IntelligenceRouterError",
      code: "UNKNOWN_DOMAIN",
      domainKey: "financial",
    });
  });
});
