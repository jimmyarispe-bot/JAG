import { describe, expect, it, vi } from "vitest";
import {
  createIntentRuntime,
  createJagRuntime,
  INTENT_EVENT_TYPES,
  INTENT_PRECEDENCE,
  installContextRuntime,
  installIdentityRuntime,
  installIntentRuntime,
  UNKNOWN_INTENT_ID,
  type IntentProvider,
  type PrincipalRecord,
  type RuntimeIdentity,
  type RuntimeOrganizationalContext,
} from "@/lib/jag/runtime";

function identity(overrides: Partial<RuntimeIdentity> = {}): RuntimeIdentity {
  return {
    principalId: "u1",
    effectiveUserId: "u1",
    roles: ["member"],
    permissions: ["workspace.read", "intent.use"],
    orgAssignments: [{ organizationId: "org-a" }],
    activeOrganizationId: "org-a",
    issuedAt: new Date().toISOString(),
    ...overrides,
  };
}

function orgContext(
  overrides: Partial<RuntimeOrganizationalContext> = {}
): RuntimeOrganizationalContext {
  return {
    contextId: "ops.home",
    contextFamily: "operations",
    organizationId: "org-a",
    domainHints: ["pack.ops"],
    mode: "persistent",
    ...overrides,
  };
}

function catalogProvider(): IntentProvider {
  return {
    id: "catalog",
    priority: 5,
    catalog: [
      {
        intentId: "review.inbox",
        label: "Review inbox",
        actionCandidates: ["action.open_inbox"],
        domainHints: ["pack.ops"],
      },
      {
        intentId: "continue.work",
        label: "Continue work",
        actionCandidates: ["action.resume"],
      },
    ],
    detect(_req, signals) {
      return signals
        .filter((s) => s.intentId && s.sourceClass !== "explicit")
        .map((s) => ({
          intentId: s.intentId!,
          confidence: s.weight ?? 0.6,
          source: "inferred" as const,
          precedence: INTENT_PRECEDENCE.INFERRED,
          signals: [s],
        }));
    },
  };
}

describe("JAG Intent Runtime", () => {
  describe("explicit intent", () => {
    it("resolves explicit intent with confidence 1.0", async () => {
      const runtime = createIntentRuntime();
      runtime.providers.register(catalogProvider());
      const intent = await runtime.resolveOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
        explicitIntentId: "review.inbox",
      });
      expect(intent.intentId).toBe("review.inbox");
      expect(intent.confidence).toBe(1);
      expect(intent.source).toBe("explicit");
      expect(intent.requiresClarification).toBe(false);
      expect(intent.actionCandidates).toContain("action.open_inbox");
    });
  });

  describe("inferred intent", () => {
    it("resolves inferred intent from signals with confidence", async () => {
      const runtime = createIntentRuntime();
      runtime.providers.register(catalogProvider());
      const intent = await runtime.resolveOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
        signals: [
          {
            kind: "notification.open",
            sourceClass: "notification",
            intentId: "review.inbox",
            weight: 0.72,
          },
        ],
      });
      expect(intent.intentId).toBe("review.inbox");
      expect(intent.source).toBe("inferred");
      expect(intent.confidence).toBeCloseTo(0.72);
      expect(intent.signals.length).toBeGreaterThan(0);
    });
  });

  describe("confidence", () => {
    it("requires clarification for low-confidence inferred intents", async () => {
      const runtime = createIntentRuntime();
      runtime.providers.register({
        id: "weak",
        detect() {
          return [
            {
              intentId: "maybe.thing",
              confidence: 0.4,
              source: "inferred",
              precedence: INTENT_PRECEDENCE.INFERRED,
              signals: [{ kind: "weak", weight: 0.4 }],
            },
          ];
        },
      });
      const intent = await runtime.resolveOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
      });
      expect(intent.requiresClarification).toBe(true);
      expect(intent.confidence).toBeLessThan(0.55);
    });
  });

  describe("conflict resolution", () => {
    it("prefers explicit over inferred of a different intent", async () => {
      const runtime = createIntentRuntime();
      runtime.providers.register({
        id: "rival",
        detect() {
          return [
            {
              intentId: "continue.work",
              confidence: 0.95,
              source: "inferred",
              precedence: INTENT_PRECEDENCE.INFERRED,
              signals: [{ kind: "inferred.high", intentId: "continue.work" }],
            },
          ];
        },
      });
      const intent = await runtime.resolveOrThrow({
        identity: identity(),
        explicitIntentId: "review.inbox",
        signals: [
          {
            kind: "noise",
            intentId: "continue.work",
            weight: 0.95,
            sourceClass: "provider",
          },
        ],
      });
      expect(intent.intentId).toBe("review.inbox");
      expect(intent.conflicts).toContain("continue.work");
    });

    it("emits IntentConflictDetected when rivals exist", async () => {
      const publish = vi.fn(async () => ({} as never));
      const runtime = createIntentRuntime({ events: { publish } as never });
      runtime.providers.register({
        id: "two",
        detect() {
          return [
            {
              intentId: "a",
              confidence: 0.8,
              source: "inferred",
              precedence: INTENT_PRECEDENCE.INFERRED,
              signals: [{ kind: "a" }],
            },
            {
              intentId: "b",
              confidence: 0.7,
              source: "inferred",
              precedence: INTENT_PRECEDENCE.INFERRED,
              signals: [{ kind: "b" }],
            },
          ];
        },
      });
      await runtime.resolveOrThrow({ identity: identity() });
      expect(publish).toHaveBeenCalledWith(
        INTENT_EVENT_TYPES.INTENT_CONFLICT_DETECTED,
        expect.objectContaining({
          winnerIntentId: "a",
          conflictIntentIds: expect.arrayContaining(["b"]),
        })
      );
    });
  });

  describe("history", () => {
    it("appends resolved intents to history", async () => {
      const runtime = createIntentRuntime();
      await runtime.resolveOrThrow({
        identity: identity(),
        explicitIntentId: "review.inbox",
      });
      await runtime.replace(
        { identity: identity() },
        "continue.work"
      );
      const hist = runtime.history(identity(), 5);
      expect(hist[0]?.intentId).toBe("continue.work");
      expect(hist.some((h) => h.intentId === "review.inbox")).toBe(true);
    });
  });

  describe("expiration", () => {
    it("filters expired candidates and purges history", async () => {
      const publish = vi.fn(async () => ({} as never));
      const runtime = createIntentRuntime({ events: { publish } as never });
      const past = new Date(Date.now() - 1000).toISOString();
      const now = new Date().toISOString();

      runtime.providers.register({
        id: "expiring",
        detect() {
          return [
            {
              intentId: "temp.intent",
              confidence: 0.9,
              source: "inferred",
              precedence: INTENT_PRECEDENCE.INFERRED,
              expiresAt: past,
              signals: [{ kind: "temp", expiresAt: past }],
            },
          ];
        },
      });
      const first = await runtime.resolveOrThrow({
        identity: identity(),
        now,
      });
      expect(first.intentId).toBe(UNKNOWN_INTENT_ID);

      runtime.historyStore.append(
        identity().principalId,
        {
          intentId: "old.one",
          domainHints: [],
          actionCandidates: [],
          confidence: 0.8,
          source: "inferred",
          signals: [],
          conflicts: [],
          requiresClarification: false,
          resolvedAt: past,
        },
        past
      );
      const expired = runtime.purgeExpired(identity(), now);
      expect(expired).toContain("old.one");
      expect(publish).toHaveBeenCalledWith(
        INTENT_EVENT_TYPES.INTENT_EXPIRED,
        expect.objectContaining({ intentId: "old.one" })
      );
    });
  });

  describe("provider registration", () => {
    it("registers intent providers on the Runtime Registry", () => {
      const jag = createJagRuntime();
      jag.registry.registerIntentProvider(catalogProvider());
      expect(jag.registry.listIntentProviders()).toHaveLength(1);
    });
  });

  describe("pipeline integration", () => {
    it("runs Identity → Context → Intent", async () => {
      const jag = createJagRuntime();
      jag.registry.registerIdentityProvider({
        id: "mem-id",
        loadPrincipal(req) {
          if (req.sessionRef !== "s1") return null;
          const record: PrincipalRecord = {
            principalId: "u1",
            roles: ["member"],
            permissions: ["workspace.read", "context.use", "intent.use"],
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
      jag.registry.registerIntentProvider(catalogProvider());
      installIdentityRuntime(jag);
      installContextRuntime(jag);
      installIntentRuntime(jag);

      const result = await jag.run({
        composeOnly: true,
        stopAfter: "intent",
        initialData: {
          sessionRef: "s1",
          contextId: "ops.home",
          explicitIntentId: "review.inbox",
        },
      });

      expect(result.status).toBe("completed");
      expect(result.intent?.intentId).toBe("review.inbox");
      expect(result.intent?.confidence).toBe(1);
    });
  });

  describe("failure handling", () => {
    it("returns unknown when no candidates exist", async () => {
      const runtime = createIntentRuntime();
      const outcome = await runtime.resolve({
        identity: identity(),
        organizationalContext: orgContext(),
      });
      expect(outcome.status).toBe("unknown");
      expect(outcome.value.intentId).toBe(UNKNOWN_INTENT_ID);
    });

    it("ignores failing providers and continues", async () => {
      const runtime = createIntentRuntime();
      runtime.providers.register({
        id: "boom",
        detect() {
          throw new Error("provider crashed");
        },
      });
      runtime.providers.register(catalogProvider());
      const intent = await runtime.resolveOrThrow({
        identity: identity(),
        explicitIntentId: "review.inbox",
      });
      expect(intent.intentId).toBe("review.inbox");
    });
  });

  describe("clarify", () => {
    it("locks clarification choice as explicit", async () => {
      const runtime = createIntentRuntime();
      const intent = await runtime.clarify(
        { identity: identity() },
        "continue.work"
      );
      expect(intent.intentId).toBe("continue.work");
      expect(intent.source).toBe("explicit");
      expect(intent.confidence).toBe(1);
    });
  });
});
