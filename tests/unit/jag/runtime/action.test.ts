import { describe, expect, it, vi } from "vitest";
import {
  ACTION_EVENT_TYPES,
  createActionRuntime,
  createJagRuntime,
  installActionRuntime,
  installCognitiveRuntime,
  installContextRuntime,
  installExperienceRuntime,
  installIdentityRuntime,
  installIntentRuntime,
  type ActionProvider,
  type CognitiveResult,
  type PrincipalRecord,
  type RuntimeIdentity,
  type RuntimeOrganizationalContext,
} from "@/lib/jag/runtime";

function identity(
  overrides: Partial<RuntimeIdentity> = {}
): RuntimeIdentity {
  return {
    principalId: "u1",
    effectiveUserId: "u1",
    roles: ["member"],
    permissions: ["action.review.item", "workspace.read", "context.use"],
    orgAssignments: [{ organizationId: "org-a" }],
    activeOrganizationId: "org-a",
    issuedAt: new Date().toISOString(),
    ...overrides,
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

function cognition(): CognitiveResult {
  return {
    briefId: "brief-1",
    summary: "Ready",
    findings: [],
    recommendations: [
      {
        id: "rec-1",
        type: "actionable",
        title: "Review",
        priority: 1,
        confidence: 0.9,
        evidenceRefs: [
          {
            source: "memory",
            id: "ev-1",
            retrievedAt: new Date().toISOString(),
          },
        ],
        reasoningNodeIds: [],
        sourceProviderId: "cog",
        suggestedNextAction: "review.item",
        conflictFlags: [],
      },
    ],
    priorities: [],
    unknownGaps: [],
    conflicts: [],
    reasoningTrace: [],
    consultedProviders: ["cog"],
    failedProviders: [],
    evidenceRefs: [
      {
        source: "memory",
        id: "ev-1",
        retrievedAt: new Date().toISOString(),
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}

function reviewProvider(): ActionProvider {
  return {
    id: "provider.review",
    actionIds: ["review.item"],
    catalog: [
      {
        actionId: "review.item",
        kind: "review",
        permission: "action.review.item",
        requiresEvidence: true,
        requiresCognition: true,
      },
    ],
    execute() {
      return {
        status: "succeeded",
        domainPackageId: "pack.example",
        evidenceRefs: [
          {
            source: "memory",
            id: "ev-1",
            retrievedAt: new Date().toISOString(),
          },
        ],
      };
    },
  };
}

describe("JAG Action Runtime", () => {
  describe("authorization", () => {
    it("rejects when permission is missing", async () => {
      const runtime = createActionRuntime();
      runtime.registerProvider(reviewProvider());
      const result = await runtime.execute({
        actionId: "review.item",
        identity: identity({ permissions: ["workspace.read"] }),
        organizationalContext: orgContext(),
        cognition: cognition(),
        evidenceRefs: cognition().evidenceRefs,
      });
      expect(result.status).toBe("rejected");
      expect(result.error?.code).toBe("ACTION_UNAUTHORIZED");
    });
  });

  describe("evidence requirement", () => {
    it("rejects execution without evidence references", async () => {
      const runtime = createActionRuntime();
      runtime.registerProvider(reviewProvider());
      const result = await runtime.execute({
        actionId: "review.item",
        identity: identity(),
        organizationalContext: orgContext(),
        cognition: cognition(),
        evidenceRefs: [],
      });
      expect(result.status).toBe("rejected");
      expect(result.error?.code).toBe("ACTION_REQUIRES_EVIDENCE");
    });

    it("rejects execution without CognitiveResult", async () => {
      const runtime = createActionRuntime();
      runtime.registerProvider(reviewProvider());
      const result = await runtime.execute({
        actionId: "review.item",
        identity: identity(),
        organizationalContext: orgContext(),
        cognition: { ...cognition(), briefId: "" },
        evidenceRefs: cognition().evidenceRefs,
      });
      expect(result.status).toBe("rejected");
      expect(result.error?.code).toBe("ACTION_REQUIRES_COGNITION");
    });
  });

  describe("dispatch", () => {
    it("dispatches to a registered provider and succeeds", async () => {
      const publish = vi.fn(async () => ({} as never));
      const runtime = createActionRuntime({ events: { publish } as never });
      runtime.registerProvider(reviewProvider());
      const result = await runtime.execute({
        actionId: "review.item",
        identity: identity(),
        organizationalContext: orgContext(),
        cognition: cognition(),
        evidenceRefs: cognition().evidenceRefs,
        cognitionRecommendationId: "rec-1",
      });
      expect(result.status).toBe("succeeded");
      expect(result.providerId).toBe("provider.review");
      expect(result.auditEventId).toMatch(/^audit_action_/);
      expect(publish).toHaveBeenCalledWith(
        ACTION_EVENT_TYPES.ACTION_DISPATCHED,
        expect.objectContaining({ providerId: "provider.review" })
      );
      expect(publish).toHaveBeenCalledWith(
        ACTION_EVENT_TYPES.ACTION_COMPLETED,
        expect.objectContaining({ status: "succeeded" })
      );
    });

    it("rejects when no provider is registered", async () => {
      const runtime = createActionRuntime();
      runtime.registerCatalogEntry({
        actionId: "review.item",
        kind: "review",
        permission: "action.review.item",
      });
      const result = await runtime.execute({
        actionId: "review.item",
        identity: identity(),
        organizationalContext: orgContext(),
        cognition: cognition(),
        evidenceRefs: cognition().evidenceRefs,
      });
      expect(result.status).toBe("rejected");
      expect(result.error?.code).toBe("ACTION_PROVIDER_MISS");
    });
  });

  describe("audit", () => {
    it("records identity, context, cognition, and evidence", async () => {
      const runtime = createActionRuntime();
      runtime.registerProvider(reviewProvider());
      await runtime.execute({
        actionId: "review.item",
        identity: identity(),
        organizationalContext: orgContext(),
        cognition: cognition(),
        evidenceRefs: cognition().evidenceRefs,
        cognitionRecommendationId: "rec-1",
        correlationId: "corr-1",
      });
      const [entry] = runtime.listAudit(1);
      expect(entry?.actionId).toBe("review.item");
      expect(entry?.principalId).toBe("u1");
      expect(entry?.contextId).toBe("ops.home");
      expect(entry?.cognitionBriefId).toBe("brief-1");
      expect(entry?.evidenceRefs[0]?.id).toBe("ev-1");
      expect(entry?.status).toBe("succeeded");
    });
  });

  describe("provider registration", () => {
    it("registers action contributors on the Runtime Registry", () => {
      const jag = createJagRuntime();
      jag.registry.registerActionContributor(reviewProvider());
      expect(jag.registry.listActionContributors()).toHaveLength(1);
    });
  });

  describe("failure handling", () => {
    it("returns failed when provider throws", async () => {
      const runtime = createActionRuntime();
      runtime.registerProvider({
        id: "boom",
        actionIds: ["review.item"],
        catalog: [
          {
            actionId: "review.item",
            kind: "review",
            permission: "action.review.item",
          },
        ],
        execute() {
          throw new Error("adapter exploded");
        },
      });
      const result = await runtime.execute({
        actionId: "review.item",
        identity: identity(),
        organizationalContext: orgContext(),
        cognition: cognition(),
        evidenceRefs: cognition().evidenceRefs,
      });
      expect(result.status).toBe("failed");
      expect(result.error?.code).toBe("ACTION_DISPATCH_FAILED");
    });
  });

  describe("pipeline integration", () => {
    it("runs Cognition → Experience → Action with gated dispatch", async () => {
      const jag = createJagRuntime();
      jag.registry.registerIdentityProvider({
        id: "mem-id",
        loadPrincipal(req) {
          if (req.sessionRef !== "s1") return null;
          const record: PrincipalRecord = {
            principalId: "u1",
            roles: ["member"],
            permissions: [
              "action.review.item",
              "workspace.read",
              "context.use",
              "experience.view",
            ],
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
      jag.registry.registerCognitiveProvider({
        id: "cog",
        gatherEvidence() {
          return [
            {
              source: "memory",
              id: "ev-1",
              retrievedAt: new Date().toISOString(),
            },
          ];
        },
        recommend(_req, evidence) {
          return [
            {
              id: "rec-1",
              confidence: 0.9,
              evidenceRefs: evidence,
              suggestedNextAction: "review.item",
              type: "actionable",
            },
          ];
        },
      });
      jag.registry.registerActionContributor(reviewProvider());
      installIdentityRuntime(jag);
      installContextRuntime(jag);
      installIntentRuntime(jag);
      installCognitiveRuntime(jag);
      installExperienceRuntime(jag);
      installActionRuntime(jag);

      const result = await jag.run({
        stopAfter: "action",
        initialData: {
          sessionRef: "s1",
          contextId: "ops.home",
          explicitIntentId: "review.work",
          actionId: "review.item",
        },
      });

      expect(result.status).toBe("completed");
      expect(result.action?.status).toBe("succeeded");
      expect(result.data.actionAuditEventId).toBeDefined();
    });
  });
});
