import { describe, expect, it, vi } from "vitest";
import {
  CONTEXT_EVENT_TYPES,
  createContextRuntime,
  createJagRuntime,
  installContextRuntime,
  installIdentityRuntime,
  RuntimeContextError,
  type ContextProvider,
  type ContextSnapshot,
  type PrincipalRecord,
  type RuntimeIdentity,
} from "@/lib/jag/runtime";

function identity(overrides: Partial<RuntimeIdentity> = {}): RuntimeIdentity {
  return {
    principalId: "u1",
    effectiveUserId: "u1",
    roles: ["member"],
    permissions: ["workspace.read", "context.use"],
    orgAssignments: [
      { organizationId: "org-a" },
      { organizationId: "org-b" },
    ],
    activeOrganizationId: "org-a",
    issuedAt: new Date().toISOString(),
    ...overrides,
  };
}

function memoryContextProvider(
  profiles: Array<{
    contextId: string;
    contextFamily: string;
    organizationId: string;
    parentContextId?: string;
    requiredPermissions?: string[];
    domainHints?: string[];
    priority?: number;
    legacySurfaceId?: string;
  }>
): ContextProvider {
  return {
    id: "memory-context",
    priority: 10,
    discover(id) {
      return profiles.filter(
        (p) =>
          id.orgAssignments.some((a) => a.organizationId === p.organizationId)
      );
    },
    enrich(_id, snapshot) {
      return {
        ...snapshot,
        attributes: { ...(snapshot.attributes ?? {}), enriched: true },
      };
    },
  };
}

describe("JAG Context Runtime", () => {
  describe("context resolution", () => {
    it("resolves a ContextSnapshot from providers", async () => {
      const runtime = createContextRuntime();
      runtime.providers.register(
        memoryContextProvider([
          {
            contextId: "ws.home",
            contextFamily: "operations",
            organizationId: "org-a",
            domainHints: ["pack.ops"],
          },
        ])
      );

      const snapshot = await runtime.resolveOrThrow({
        identity: identity(),
      });
      expect(snapshot.contextId).toBe("ws.home");
      expect(snapshot.organizationId).toBe("org-a");
      expect(snapshot.domainHints).toContain("pack.ops");
      expect(snapshot.attributes?.enriched).toBe(true);
      expect(snapshot.mode).toBe("persistent");
    });

    it("returns empty when no contexts are available", async () => {
      const runtime = createContextRuntime();
      runtime.providers.register(memoryContextProvider([]));
      const outcome = await runtime.resolve({ identity: identity() });
      expect(outcome.status).toBe("empty");
    });
  });

  describe("nested contexts", () => {
    it("inherits parent fields into child context", async () => {
      const runtime = createContextRuntime();
      runtime.providers.register(
        memoryContextProvider([
          {
            contextId: "org.root",
            contextFamily: "organization",
            organizationId: "org-a",
            domainHints: ["pack.core"],
            priority: 1,
          },
          {
            contextId: "team.alpha",
            contextFamily: "team",
            organizationId: "org-a",
            parentContextId: "org.root",
            domainHints: ["pack.team"],
            priority: 5,
          },
        ])
      );

      const snapshot = await runtime.resolveOrThrow({
        identity: identity(),
        selection: { contextId: "team.alpha", workspaceId: "space-1" },
      });
      expect(snapshot.contextId).toBe("team.alpha");
      expect(snapshot.parentContextId).toBe("org.root");
      expect(snapshot.inheritedFrom).toBe("org.root");
      expect(snapshot.depth).toBe(1);
      expect(snapshot.workspaceId).toBe("space-1");
      expect(snapshot.domainHints).toEqual(
        expect.arrayContaining(["pack.core", "pack.team"])
      );
    });
  });

  describe("temporary contexts", () => {
    it("overlays temporary context without destroying persistent", async () => {
      const runtime = createContextRuntime();
      runtime.providers.register(
        memoryContextProvider([
          {
            contextId: "ws.home",
            contextFamily: "operations",
            organizationId: "org-a",
          },
          {
            contextId: "ws.task",
            contextFamily: "task",
            organizationId: "org-a",
          },
        ])
      );

      const persistent = await runtime.resolveOrThrow({
        identity: identity(),
        selection: { contextId: "ws.home" },
      });
      runtime.store.setPersistent("u1", persistent);

      const temporary = await runtime.setTemporary(identity(), {
        contextId: "ws.task",
        activeTaskRef: { id: "task-1", type: "work.item" },
      });
      expect(temporary.mode).toBe("temporary");
      expect(temporary.activeTaskRef?.id).toBe("task-1");

      const active = runtime.getActive(identity());
      expect(active?.contextId).toBe("ws.task");

      const cleared = await runtime.clearTemporary(identity());
      expect(cleared.contextId).toBe("ws.home");
      expect(cleared.mode).toBe("persistent");
    });
  });

  describe("context switching", () => {
    it("switches persistent context and emits ContextChanged", async () => {
      const types: string[] = [];
      const runtime = createContextRuntime({
        events: {
          publish: async (type: string) => {
            types.push(type);
            return {} as never;
          },
        } as never,
      });
      runtime.providers.register(
        memoryContextProvider([
          {
            contextId: "a",
            contextFamily: "ops",
            organizationId: "org-a",
            priority: 2,
          },
          {
            contextId: "b",
            contextFamily: "ops",
            organizationId: "org-a",
            priority: 1,
          },
        ])
      );

      await runtime.switch(identity(), "a");
      const next = await runtime.switch(identity(), "b");
      expect(next.contextId).toBe("b");
      expect(types).toContain(CONTEXT_EVENT_TYPES.CONTEXT_CHANGED);
    });

    it("rejects unauthorized / unknown context ids", async () => {
      const runtime = createContextRuntime();
      runtime.providers.register(
        memoryContextProvider([
          {
            contextId: "allowed",
            contextFamily: "ops",
            organizationId: "org-a",
            requiredPermissions: ["context.use"],
          },
          {
            contextId: "secret",
            contextFamily: "ops",
            organizationId: "org-a",
            requiredPermissions: ["admin.only"],
          },
        ])
      );
      await expect(
        runtime.resolveOrThrow({
          identity: identity(),
          selection: { contextId: "secret" },
        })
      ).rejects.toBeInstanceOf(RuntimeContextError);
    });
  });

  describe("snapshot / restore", () => {
    it("creates and restores context snapshots", async () => {
      const runtime = createContextRuntime();
      runtime.providers.register(
        memoryContextProvider([
          {
            contextId: "home",
            contextFamily: "ops",
            organizationId: "org-a",
          },
          {
            contextId: "focus",
            contextFamily: "ops",
            organizationId: "org-a",
          },
        ])
      );

      await runtime.switch(identity(), "home");
      const record = await runtime.createSnapshot(identity());
      await runtime.setTemporary(identity(), {
        contextId: "focus",
        focusObject: { type: "object", id: "o1" },
      });
      expect(runtime.getActive(identity())?.contextId).toBe("focus");

      const restored = await runtime.restoreSnapshot(
        identity(),
        record.snapshotId
      );
      expect(restored.contextId).toBe("home");
      expect(runtime.getActive(identity())?.mode).toBe("persistent");
    });
  });

  describe("provider registration", () => {
    it("registers context providers on the Runtime Registry", () => {
      const jag = createJagRuntime();
      jag.registry.registerContextProvider(
        memoryContextProvider([
          {
            contextId: "x",
            contextFamily: "ops",
            organizationId: "org-a",
          },
        ])
      );
      expect(jag.registry.listContextProviders()).toHaveLength(1);
    });
  });

  describe("kernel + pipeline integration", () => {
    it("runs Identity → Context and exposes organizational context", async () => {
      const jag = createJagRuntime();
      jag.registry.registerIdentityProvider({
        id: "mem-id",
        loadPrincipal(req) {
          if (req.principalId !== "u1" && req.sessionRef !== "s1") return null;
          const record: PrincipalRecord = {
            principalId: "u1",
            roles: ["member"],
            permissions: ["workspace.read", "context.use"],
            orgAssignments: [{ organizationId: "org-a" }],
          };
          return record;
        },
      });
      jag.registry.registerContextProvider(
        memoryContextProvider([
          {
            contextId: "ops.home",
            contextFamily: "operations",
            organizationId: "org-a",
            domainHints: ["pack.ops"],
          },
        ])
      );
      installIdentityRuntime(jag);
      installContextRuntime(jag);

      const result = await jag.run({
        composeOnly: true,
        stopAfter: "context",
        initialData: {
          sessionRef: "s1",
          principalId: "u1",
          contextId: "ops.home",
        },
      });

      expect(result.status).toBe("completed");
      expect(result.identity?.principalId).toBe("u1");
      expect(result.organizationalContext?.contextId).toBe("ops.home");
      const snap = result.data.contextSnapshot as ContextSnapshot;
      expect(snap.workspaceId).toBeUndefined();
      expect(snap.domainHints).toContain("pack.ops");
    });

    it("fails Context stage when identity is missing", async () => {
      const jag = createJagRuntime();
      jag.registry.registerContextProvider(
        memoryContextProvider([
          {
            contextId: "ops.home",
            contextFamily: "operations",
            organizationId: "org-a",
          },
        ])
      );
      installContextRuntime(jag);
      const result = await jag.run({
        composeOnly: true,
        stopAfter: "context",
      });
      expect(result.status).toBe("failed");
      expect(result.error?.code).toBe("CONTEXT_REQUIRES_IDENTITY");
    });
  });

  describe("typed events", () => {
    it("publishes ContextResolved", async () => {
      const publish = vi.fn(async () => ({} as never));
      const runtime = createContextRuntime({
        events: { publish } as never,
      });
      runtime.providers.register(
        memoryContextProvider([
          {
            contextId: "home",
            contextFamily: "ops",
            organizationId: "org-a",
          },
        ])
      );
      await runtime.resolveOrThrow({ identity: identity() });
      expect(publish).toHaveBeenCalledWith(
        CONTEXT_EVENT_TYPES.CONTEXT_RESOLVED,
        expect.objectContaining({ contextId: "home" }),
        expect.any(Object)
      );
    });
  });

  describe("enter / exit nesting", () => {
    it("tracks enter stack and exits to previous", async () => {
      const runtime = createContextRuntime();
      runtime.providers.register(
        memoryContextProvider([
          {
            contextId: "root",
            contextFamily: "ops",
            organizationId: "org-a",
          },
          {
            contextId: "child",
            contextFamily: "ops",
            organizationId: "org-a",
          },
        ])
      );
      await runtime.switch(identity(), "root");
      await runtime.enter(identity(), { contextId: "child" });
      expect(runtime.getActive(identity())?.contextId).toBe("child");
      const exited = await runtime.exit(identity());
      expect(exited?.contextId).toBe("root");
    });
  });
});
