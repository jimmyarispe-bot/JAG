import { describe, expect, it, vi } from "vitest";
import {
  createExperienceRuntime,
  createJagRuntime,
  EXPERIENCE_EVENT_TYPES,
  installContextRuntime,
  installExperienceRuntime,
  installIdentityRuntime,
  installIntentRuntime,
  type ExperienceProvider,
  type PrincipalRecord,
  type RuntimeIdentity,
  type RuntimeIntent,
  type RuntimeOrganizationalContext,
} from "@/lib/jag/runtime";

function identity(overrides: Partial<RuntimeIdentity> = {}): RuntimeIdentity {
  return {
    principalId: "u1",
    effectiveUserId: "u1",
    roles: ["member"],
    permissions: ["workspace.read", "experience.view"],
    orgAssignments: [{ organizationId: "org-a" }],
    activeOrganizationId: "org-a",
    issuedAt: new Date().toISOString(),
    preferences: {
      experience: {
        density: "comfortable",
        pinnedWidgetIds: ["w.summary"],
      },
    },
    ...overrides,
  };
}

function orgContext(): RuntimeOrganizationalContext {
  return {
    contextId: "ops.home",
    contextFamily: "operations",
    organizationId: "org-a",
    domainHints: ["pack.ops"],
    mode: "persistent",
  };
}

function intent(overrides: Partial<RuntimeIntent> = {}): RuntimeIntent {
  return {
    intentId: "review.inbox",
    domainHints: [],
    actionCandidates: ["action.open_inbox"],
    confidence: 1,
    source: "explicit",
    signals: [],
    conflicts: [],
    requiresClarification: false,
    resolvedAt: new Date().toISOString(),
    ...overrides,
  };
}

function sampleContributor(): ExperienceProvider {
  return {
    id: "contrib.sample",
    priority: 10,
    widgets() {
      return [
        {
          widgetId: "w.summary",
          kind: "summary",
          slot: "primary",
          order: 10,
          requiredPermissions: ["experience.view"],
          contextFamilies: ["operations"],
        },
        {
          widgetId: "w.list",
          kind: "list",
          slot: "secondary",
          order: 20,
        },
        {
          widgetId: "w.secret",
          kind: "alert",
          slot: "utility",
          requiredPermissions: ["admin.only"],
        },
      ];
    },
    notifications() {
      return [
        {
          id: "n1",
          title: "Notice",
          severity: "info",
          contextId: "ops.home",
          intentId: "review.inbox",
        },
      ];
    },
    navigation() {
      return [{ id: "nav.more", label: "More", order: 5 }];
    },
  };
}

describe("JAG Experience Runtime", () => {
  describe("composition", () => {
    it("composes an ExperienceModel with widgets and layout", async () => {
      const runtime = createExperienceRuntime();
      runtime.registerProvider(sampleContributor());
      const outcome = await runtime.compose({
        identity: identity(),
        organizationalContext: orgContext(),
        intent: intent(),
        renderTarget: "web",
      });
      expect(outcome.status).toBe("composed");
      expect(outcome.value.widgets.map((w) => w.widgetId)).toEqual(
        expect.arrayContaining(["w.summary", "w.list"])
      );
      expect(outcome.value.widgets.map((w) => w.widgetId)).not.toContain(
        "w.secret"
      );
      expect(outcome.value.layout.slots).toContain("primary");
      expect(outcome.value.commandEnabled).toBe(true);
      expect(outcome.value.renderTarget).toBe("web");
    });
  });

  describe("widget registration", () => {
    it("registers widgets on the experience registry", async () => {
      const publish = vi.fn(async () => ({} as never));
      const runtime = createExperienceRuntime({
        events: { publish } as never,
      });
      runtime.registerWidget({
        widgetId: "w.metric",
        kind: "metric",
        slot: "primary",
        order: 1,
      });
      expect(runtime.registry.getWidget("w.metric")?.kind).toBe("metric");
      expect(publish).toHaveBeenCalledWith(
        EXPERIENCE_EVENT_TYPES.WIDGET_REGISTERED,
        expect.objectContaining({ widgetId: "w.metric" })
      );
      const model = await runtime.composeOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
      });
      expect(model.widgets.some((w) => w.widgetId === "w.metric")).toBe(true);
    });
  });

  describe("briefing generation", () => {
    it("builds briefing from cognition without inventing recommendations", async () => {
      const runtime = createExperienceRuntime();
      const model = await runtime.composeOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
        cognition: {
          briefId: "b1",
          summary: "Here is what is known.",
          unknownGaps: [],
          priorities: [{ id: "p1", title: "First", actionCandidateId: "act.1" }],
          recommendations: [
            { title: "Do thing", actionCandidateId: "act.1" },
          ],
        },
      });
      expect(model.briefing?.briefingId).toBe("b1");
      expect(model.briefing?.summary).toBe("Here is what is known.");
      expect(model.nextActions.some((a) => a.actionId === "act.1")).toBe(true);
    });

    it("declares unknown gaps when cognition is empty", async () => {
      const runtime = createExperienceRuntime();
      const model = await runtime.composeOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
      });
      expect(model.briefing?.unknownGaps.length).toBeGreaterThan(0);
    });
  });

  describe("personalization", () => {
    it("pins and hides widgets from personalization prefs", async () => {
      const runtime = createExperienceRuntime();
      runtime.registerProvider(sampleContributor());
      runtime.registerWidget({
        widgetId: "w.chart",
        kind: "chart",
        slot: "secondary",
        order: 50,
      });
      const model = await runtime.composeOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
        personalization: {
          pinnedWidgetIds: ["w.chart"],
          hiddenWidgetIds: ["w.list"],
        },
      });
      expect(model.widgets.map((w) => w.widgetId)).not.toContain("w.list");
      expect(model.widgets[0]?.widgetId).toBe("w.chart");
      expect(model.personalization?.density).toBe("comfortable");
    });
  });

  describe("extension registration", () => {
    it("registers experience contributors on the Runtime Registry", () => {
      const jag = createJagRuntime();
      jag.registry.registerExperienceContributor(sampleContributor());
      expect(jag.registry.listExperienceContributors()).toHaveLength(1);
    });
  });

  describe("pipeline integration", () => {
    it("runs Identity → Context → Intent → Experience", async () => {
      const jag = createJagRuntime();
      jag.registry.registerIdentityProvider({
        id: "mem-id",
        loadPrincipal(req) {
          if (req.sessionRef !== "s1") return null;
          const record: PrincipalRecord = {
            principalId: "u1",
            roles: ["member"],
            permissions: ["workspace.read", "experience.view", "context.use"],
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
      jag.registry.registerIntentProvider({
        id: "mem-intent",
        detect() {
          return [];
        },
      });
      jag.registry.registerExperienceContributor(sampleContributor());
      installIdentityRuntime(jag);
      installContextRuntime(jag);
      installIntentRuntime(jag);
      installExperienceRuntime(jag);

      const result = await jag.run({
        composeOnly: true,
        stopAfter: "experience",
        initialData: {
          sessionRef: "s1",
          contextId: "ops.home",
          explicitIntentId: "review.inbox",
          renderTarget: "web",
        },
      });

      expect(result.status).toBe("completed");
      expect(result.experience?.contextId).toBe("ops.home");
      expect(result.experience?.widgetIds).toEqual(
        expect.arrayContaining(["w.summary", "w.list"])
      );
      expect(result.data.experienceModel).toBeDefined();
    });
  });

  describe("failure handling", () => {
    it("skips failing contributors and still composes", async () => {
      const runtime = createExperienceRuntime();
      runtime.registerProvider({
        id: "boom",
        widgets() {
          throw new Error("contributor crashed");
        },
      });
      runtime.registerProvider(sampleContributor());
      const model = await runtime.composeOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
      });
      expect(model.widgets.length).toBeGreaterThan(0);
    });

    it("emits ExperienceComposed event", async () => {
      const publish = vi.fn(async () => ({} as never));
      const runtime = createExperienceRuntime({
        events: { publish } as never,
      });
      runtime.registerProvider(sampleContributor());
      await runtime.composeOrThrow({
        identity: identity(),
        organizationalContext: orgContext(),
      });
      expect(publish).toHaveBeenCalledWith(
        EXPERIENCE_EVENT_TYPES.EXPERIENCE_COMPOSED,
        expect.objectContaining({ contextId: "ops.home" }),
        expect.any(Object)
      );
    });
  });
});
