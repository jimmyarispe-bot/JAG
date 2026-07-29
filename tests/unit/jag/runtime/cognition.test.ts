import { describe, expect, it, vi } from "vitest";
import {
  COGNITION_EVENT_TYPES,
  createCognitiveRuntime,
  createJagRuntime,
  createReasoningGraph,
  installCognitiveRuntime,
  installContextRuntime,
  installExperienceRuntime,
  installIdentityRuntime,
  installIntentRuntime,
  scoreWithEvidence,
  type CognitiveProvider,
  type PrincipalRecord,
  type RuntimeIdentity,
  type RuntimeIntent,
  type RuntimeOrganizationalContext,
} from "@/lib/jag/runtime";

function identity(): RuntimeIdentity {
  return {
    principalId: "u1",
    effectiveUserId: "u1",
    roles: ["member"],
    permissions: ["workspace.read"],
    orgAssignments: [{ organizationId: "org-a" }],
    activeOrganizationId: "org-a",
    issuedAt: new Date().toISOString(),
  };
}

function orgContext(): RuntimeOrganizationalContext {
  return {
    contextId: "ops.home",
    contextFamily: "operations",
    organizationId: "org-a",
    domainHints: [],
    mode: "persistent",
  };
}

function intent(): RuntimeIntent {
  return {
    intentId: "review.work",
    domainHints: [],
    actionCandidates: [],
    confidence: 1,
    source: "explicit",
    signals: [],
    conflicts: [],
    requiresClarification: false,
    resolvedAt: new Date().toISOString(),
  };
}

function sampleProvider(overrides: Partial<CognitiveProvider> = {}): CognitiveProvider {
  return {
    id: "provider.sample",
    priority: 10,
    gatherEvidence() {
      return [
        {
          source: "memory",
          id: "mem-1",
          retrievedAt: new Date().toISOString(),
        },
      ];
    },
    analyze(_req, evidence) {
      return [
        {
          id: "finding-1",
          providerId: "provider.sample",
          title: "Observation",
          confidence: 0.8,
          evidenceRefs: evidence,
        },
      ];
    },
    recommend() {
      return [
        {
          id: "rec-1",
          title: "Continue review",
          confidence: 0.9,
          topicId: "topic.review",
          suggestedNextAction: "action.continue",
          evidenceRefs: [
            {
              source: "memory",
              id: "mem-1",
              retrievedAt: new Date().toISOString(),
            },
          ],
          type: "actionable",
          priority: 10,
        },
      ];
    },
    ...overrides,
  };
}

describe("JAG Cognitive Runtime", () => {
  describe("provider registration", () => {
    it("registers providers without hard-coding engines", () => {
      const runtime = createCognitiveRuntime();
      runtime.registerProvider(sampleProvider());
      expect(runtime.registry.list()).toHaveLength(1);

      const jag = createJagRuntime();
      jag.registry.registerCognitiveProvider(sampleProvider({ id: "p2" }));
      expect(jag.registry.listCognitiveProviders()).toHaveLength(1);
    });
  });

  describe("evidence aggregation", () => {
    it("collects and dedupes evidence references", async () => {
      const runtime = createCognitiveRuntime();
      runtime.registerProvider(sampleProvider());
      runtime.registerProvider(
        sampleProvider({
          id: "provider.other",
          gatherEvidence() {
            return [
              {
                source: "memory",
                id: "mem-1",
                retrievedAt: new Date().toISOString(),
              },
              {
                source: "twin",
                id: "twin-1",
                retrievedAt: new Date().toISOString(),
              },
            ];
          },
          analyze: undefined,
          recommend: undefined,
        })
      );
      const result = await runtime.thinkOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
        intent: intent(),
      });
      expect(result.evidenceRefs).toHaveLength(2);
      expect(result.consultedProviders).toEqual(
        expect.arrayContaining(["provider.sample", "provider.other"])
      );
    });
  });

  describe("recommendation ranking", () => {
    it("ranks recommendations into priorities", async () => {
      const runtime = createCognitiveRuntime();
      runtime.registerProvider(sampleProvider());
      const result = await runtime.thinkOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
        intent: intent(),
      });
      expect(result.recommendations[0]?.suggestedNextAction).toBe(
        "action.continue"
      );
      expect(result.priorities[0]?.actionCandidateId).toBe("action.continue");
      expect(result.priorities[0]?.rank).toBe(0);
    });
  });

  describe("conflict detection", () => {
    it("flags conflicting topic recommendations", async () => {
      const publish = vi.fn(async () => ({} as never));
      const runtime = createCognitiveRuntime({
        events: { publish } as never,
      });
      runtime.registerProvider(sampleProvider());
      runtime.registerProvider({
        id: "provider.rival",
        recommend() {
          return [
            {
              id: "rec-2",
              title: "Pause review",
              confidence: 0.85,
              topicId: "topic.review",
              suggestedNextAction: "action.pause",
              evidenceRefs: [
                {
                  source: "risk",
                  id: "risk-1",
                  retrievedAt: new Date().toISOString(),
                },
              ],
              type: "actionable",
            },
          ];
        },
      });
      const result = await runtime.thinkOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
      });
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(
        result.recommendations.some((r) => r.conflictFlags.length > 0)
      ).toBe(true);
      expect(publish).toHaveBeenCalledWith(
        COGNITION_EVENT_TYPES.CONFLICT_DETECTED,
        expect.objectContaining({
          recommendationIds: expect.arrayContaining(["rec-1", "rec-2"]),
        })
      );
    });
  });

  describe("reasoning graph", () => {
    it("supports universal nodes and edges", () => {
      const graph = createReasoningGraph();
      graph.addNode({ id: "o1", kind: "observation" });
      graph.addNode({ id: "e1", kind: "evidence" });
      graph.addNode({ id: "r1", kind: "recommendation" });
      graph.addEdge("e1", "r1", "supports", 0.9);
      graph.addEdge("o1", "r1", "contradicts", 0.2);
      expect(graph.listNodes()).toHaveLength(3);
      expect(graph.contradictions()).toHaveLength(1);
      expect(graph.neighbors("r1", "supports")[0]?.id).toBe("e1");
    });

    it("attaches graph snapshot on think", async () => {
      const runtime = createCognitiveRuntime();
      runtime.registerProvider(sampleProvider());
      const result = await runtime.thinkOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
      });
      expect(result.graphSnapshot).toBeDefined();
      const nodes = (result.graphSnapshot as { nodes: unknown[] }).nodes;
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  describe("confidence scoring", () => {
    it("boosts confidence with evidence and marks unsupported without it", async () => {
      expect(scoreWithEvidence(0.8, 3)).toBeGreaterThan(0.8);
      const runtime = createCognitiveRuntime();
      runtime.registerProvider({
        id: "no-evidence",
        recommend() {
          return [
            {
              id: "bare",
              confidence: 0.9,
              evidenceRefs: [],
              suggestedNextAction: "action.x",
              type: "actionable",
            },
          ];
        },
      });
      const result = await runtime.thinkOrThrow({
        identity: identity(),
      });
      const bare = result.recommendations.find((r) => r.id === "bare");
      expect(bare?.unsupported).toBe(true);
      expect(bare?.suggestedNextAction).toBeUndefined();
      expect(result.unknownGaps.some((g) => g.includes("Law 7"))).toBe(true);
    });
  });

  describe("pipeline integration", () => {
    it("runs Intent → Cognition → Experience with CognitiveResult bag", async () => {
      const jag = createJagRuntime();
      jag.registry.registerIdentityProvider({
        id: "mem-id",
        loadPrincipal(req) {
          if (req.sessionRef !== "s1") return null;
          const record: PrincipalRecord = {
            principalId: "u1",
            roles: ["member"],
            permissions: ["workspace.read", "context.use", "experience.view"],
            orgAssignments: [{ organizationId: "org-a" }],
          };
          return record;
        },
      });
      jag.registry.registerContextProvider({
        id: "mem-ctx",
        discover() {
          return [
            {
              contextId: "ops.home",
              contextFamily: "operations",
              organizationId: "org-a",
            },
          ];
        },
      });
      jag.registry.registerCognitiveProvider(sampleProvider());
      jag.registry.registerExperienceContributor({
        id: "exp",
        widgets() {
          return [
            {
              widgetId: "w.summary",
              kind: "summary",
              slot: "primary",
            },
          ];
        },
      });
      installIdentityRuntime(jag);
      installContextRuntime(jag);
      installIntentRuntime(jag);
      installCognitiveRuntime(jag);
      installExperienceRuntime(jag);

      const result = await jag.run({
        composeOnly: true,
        stopAfter: "experience",
        initialData: {
          sessionRef: "s1",
          contextId: "ops.home",
          explicitIntentId: "review.work",
        },
      });

      expect(result.status).toBe("completed");
      expect(result.cognition?.briefId).toBeDefined();
      expect(result.data.cognitiveResult).toBeDefined();
      expect(result.experience?.briefingId).toBeDefined();
    });
  });

  describe("failure handling", () => {
    it("isolates provider failures and continues", async () => {
      const publish = vi.fn(async () => ({} as never));
      const runtime = createCognitiveRuntime({
        events: { publish } as never,
      });
      runtime.registerProvider({
        id: "boom",
        gatherEvidence() {
          throw new Error("provider down");
        },
      });
      runtime.registerProvider(sampleProvider());
      const outcome = await runtime.think({
        identity: identity(),
        organizationalContext: orgContext(),
      });
      expect(outcome.status).toBe("partial");
      expect(outcome.value.failedProviders.some((f) => f.providerId === "boom")).toBe(
        true
      );
      expect(outcome.value.recommendations.length).toBeGreaterThan(0);
      expect(publish).toHaveBeenCalledWith(
        COGNITION_EVENT_TYPES.PROVIDER_FAILED,
        expect.objectContaining({ providerId: "boom" })
      );
    });

    it("returns empty when no providers are registered", async () => {
      const runtime = createCognitiveRuntime();
      const outcome = await runtime.think({ identity: identity() });
      expect(outcome.status).toBe("empty");
      expect(outcome.value.unknownGaps.length).toBeGreaterThan(0);
    });
  });
});
