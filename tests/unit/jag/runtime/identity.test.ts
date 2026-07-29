import { describe, expect, it, vi } from "vitest";
import {
  createJagRuntime,
  createIdentityRuntime,
  createMemoryDelegationResolver,
  IDENTITY_EVENT_TYPES,
  installIdentityRuntime,
  RuntimeAuthorizationError,
  type IdentityProvider,
  type PrincipalRecord,
} from "@/lib/jag/runtime";

function principal(
  overrides: Partial<PrincipalRecord> & Pick<PrincipalRecord, "principalId">
): PrincipalRecord {
  return {
    roles: ["member"],
    permissions: ["workspace.read"],
    orgAssignments: [
      { organizationId: "org-a", label: "A" },
      { organizationId: "org-b", label: "B" },
    ],
    rolePermissionCatalog: {
      member: ["workspace.read", "workspace.list"],
      steward: ["impersonate.user"],
    },
    ...overrides,
  };
}

function memoryProvider(
  records: Record<string, PrincipalRecord>,
  options: { id?: string; sessionToUser?: Record<string, string> } = {}
): IdentityProvider {
  const sessionToUser = options.sessionToUser ?? {};
  return {
    id: options.id ?? "memory",
    priority: 10,
    loadPrincipal(request) {
      const userId =
        request.principalId ??
        (request.sessionRef ? sessionToUser[request.sessionRef] : undefined);
      if (!userId) return null;
      return records[userId] ?? null;
    },
    loadPrincipalById(userId) {
      return records[userId] ?? null;
    },
  };
}

describe("JAG Identity Runtime", () => {
  describe("identity resolution", () => {
    it("resolves RuntimeIdentity from a registered provider", async () => {
      const identity = createIdentityRuntime();
      identity.providers.register(
        memoryProvider(
          {
            u1: principal({
              principalId: "u1",
              displayName: "User One",
              email: "u1@example.com",
            }),
          },
          { sessionToUser: { sess1: "u1" } }
        )
      );

      const outcome = await identity.resolve({ sessionRef: "sess1" });
      expect(outcome.status).toBe("resolved");
      if (outcome.status !== "resolved") return;
      expect(outcome.value.identity.principalId).toBe("u1");
      expect(outcome.value.identity.effectiveUserId).toBe("u1");
      expect(outcome.value.identity.activeOrganizationId).toBe("org-a");
      expect(outcome.value.identity.permissions).toEqual(
        expect.arrayContaining(["workspace.read", "workspace.list"])
      );
      expect(outcome.value.providerId).toBe("memory");
    });

    it("returns unauthenticated when no provider matches", async () => {
      const identity = createIdentityRuntime();
      identity.providers.register(memoryProvider({}));
      const outcome = await identity.resolve({ sessionRef: "missing" });
      expect(outcome.status).toBe("unauthenticated");
    });
  });

  describe("multi-organization behavior", () => {
    it("honors preferred active organization", async () => {
      const identity = createIdentityRuntime();
      identity.providers.register(
        memoryProvider({
          u1: principal({ principalId: "u1" }),
        })
      );
      const resolved = await identity.resolveOrThrow({
        principalId: "u1",
        activeOrganizationId: "org-b",
      });
      expect(resolved.identity.activeOrganizationId).toBe("org-b");
      expect(resolved.scope.organizationIds).toEqual(["org-a", "org-b"]);
    });

    it("rejects switchOrganization for non-membership", async () => {
      const identity = createIdentityRuntime();
      identity.providers.register(
        memoryProvider({
          u1: principal({ principalId: "u1" }),
        })
      );
      const resolved = await identity.resolveOrThrow({ principalId: "u1" });
      await expect(
        identity.switchOrganization(resolved.identity, "org-z")
      ).rejects.toBeInstanceOf(RuntimeAuthorizationError);
    });

    it("switches organization and emits OrganizationChanged", async () => {
      const events: string[] = [];
      const bus = {
        publish: vi.fn(async (type: string) => {
          events.push(type);
          return {} as never;
        }),
      };
      const identity = createIdentityRuntime({ events: bus as never });
      identity.providers.register(
        memoryProvider({
          u1: principal({ principalId: "u1" }),
        })
      );
      const resolved = await identity.resolveOrThrow({ principalId: "u1" });
      const switched = await identity.switchOrganization(
        resolved.identity,
        "org-b"
      );
      expect(switched.identity.activeOrganizationId).toBe("org-b");
      expect(events).toContain(IDENTITY_EVENT_TYPES.ORGANIZATION_CHANGED);
    });
  });

  describe("delegation", () => {
    it("masks permissions for a delegation contract", async () => {
      const delegations = createMemoryDelegationResolver();
      const identity = createIdentityRuntime({ delegations });
      identity.providers.register(
        memoryProvider({
          u1: principal({
            principalId: "u1",
            permissions: ["workspace.read", "workspace.write", "billing.read"],
            roles: [],
          }),
        })
      );
      await identity.grantDelegation({
        id: "del-1",
        fromUserId: "boss",
        toUserId: "u1",
        kind: "delegation",
        scope: ["workspace.read"],
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        reason: "temp access",
      });

      const resolved = await identity.resolveOrThrow({
        principalId: "u1",
        delegationId: "del-1",
      });
      expect(resolved.identity.permissions).toEqual(["workspace.read"]);
      expect(resolved.identity.delegation?.fromUserId).toBe("boss");
    });

    it("supports impersonation only through explicit contracts", async () => {
      const identity = createIdentityRuntime();
      identity.providers.register(
        memoryProvider({
          steward: principal({
            principalId: "steward",
            roles: ["steward"],
            permissions: ["impersonate.user"],
          }),
          target: principal({
            principalId: "target",
            displayName: "Target",
            permissions: ["workspace.read", "grades.view"],
            roles: [],
          }),
        })
      );

      const actor = await identity.resolveOrThrow({ principalId: "steward" });
      const imp = await identity.beginImpersonation({
        actor: actor.identity,
        targetUserId: "target",
        reason: "support",
        scope: ["workspace.read"],
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      });

      expect(imp.identity.principalId).toBe("steward");
      expect(imp.identity.effectiveUserId).toBe("target");
      expect(imp.identity.impersonation?.targetUserId).toBe("target");
      expect(imp.identity.permissions).toEqual(["workspace.read"]);

      const ended = await identity.endImpersonation(imp.identity, {
        principalId: "steward",
      });
      expect(ended.identity.effectiveUserId).toBe("steward");
      expect(ended.identity.impersonation).toBeUndefined();
    });

    it("rejects expired delegation", async () => {
      const identity = createIdentityRuntime();
      identity.providers.register(
        memoryProvider({
          u1: principal({ principalId: "u1" }),
        })
      );
      await identity.grantDelegation({
        id: "del-expired",
        fromUserId: "boss",
        toUserId: "u1",
        kind: "delegation",
        scope: ["workspace.read"],
        expiresAt: new Date(Date.now() - 1_000).toISOString(),
        reason: "late",
      });
      await expect(
        identity.resolveOrThrow({
          principalId: "u1",
          delegationId: "del-expired",
        })
      ).rejects.toMatchObject({ code: "DELEGATION_EXPIRED" });
    });
  });

  describe("permission resolution", () => {
    it("authorize checks permission keys not roles", async () => {
      const identity = createIdentityRuntime();
      identity.providers.register(
        memoryProvider({
          u1: principal({ principalId: "u1" }),
        })
      );
      const resolved = await identity.resolveOrThrow({ principalId: "u1" });
      expect(identity.authorize(resolved.identity, "workspace.read")).toBe(
        true
      );
      expect(identity.authorize(resolved.identity, "billing.admin")).toBe(
        false
      );
      expect(resolved.identity.roles).toContain("member");
    });
  });

  describe("failure paths", () => {
    it("fails when no providers are registered", async () => {
      const identity = createIdentityRuntime();
      const outcome = await identity.resolve({ principalId: "u1" });
      expect(outcome.status).toBe("unauthenticated");
    });

    it("emits IdentityResolutionFailed on unauthenticated resolve", async () => {
      const publish = vi.fn(async () => ({} as never));
      const identity = createIdentityRuntime({
        events: { publish } as never,
      });
      identity.providers.register(memoryProvider({}));
      await identity.resolve({ sessionRef: "none" });
      expect(publish).toHaveBeenCalledWith(
        IDENTITY_EVENT_TYPES.IDENTITY_RESOLUTION_FAILED,
        expect.objectContaining({ code: "UNAUTHENTICATED" })
      );
    });
  });

  describe("registry + pipeline integration", () => {
    it("registers identity providers on the Runtime Registry", () => {
      const runtime = createJagRuntime();
      const provider = memoryProvider({
        u1: principal({ principalId: "u1" }),
      });
      runtime.registry.registerIdentityProvider(provider);
      expect(runtime.registry.listIdentityProviders()).toHaveLength(1);
    });

    it("installs Identity Runtime into the Identity pipeline stage", async () => {
      const runtime = createJagRuntime();
      runtime.registry.registerIdentityProvider(
        memoryProvider(
          {
            u1: principal({ principalId: "u1", displayName: "Pipe" }),
          },
          { sessionToUser: { s1: "u1" } }
        )
      );
      installIdentityRuntime(runtime);

      const result = await runtime.run({
        composeOnly: true,
        stopAfter: "identity",
        initialData: { sessionRef: "s1" },
      });

      expect(result.status).toBe("completed");
      expect(result.identity?.principalId).toBe("u1");
      expect(result.identity?.displayName).toBe("Pipe");
      expect(result.data.identityProviderId).toBe("memory");
    });

    it("fails the pipeline when identity cannot be resolved", async () => {
      const runtime = createJagRuntime();
      runtime.registry.registerIdentityProvider(memoryProvider({}));
      installIdentityRuntime(runtime);
      const result = await runtime.run({
        composeOnly: true,
        stopAfter: "identity",
        initialData: { sessionRef: "missing" },
      });
      expect(result.status).toBe("failed");
      expect(result.error?.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("typed events", () => {
    it("publishes IdentityResolved and PermissionResolved", async () => {
      const types: string[] = [];
      const identity = createIdentityRuntime({
        events: {
          publish: async (type: string) => {
            types.push(type);
            return {} as never;
          },
        } as never,
      });
      identity.providers.register(
        memoryProvider({
          u1: principal({ principalId: "u1" }),
        })
      );
      await identity.resolveOrThrow({ principalId: "u1" });
      expect(types).toContain(IDENTITY_EVENT_TYPES.PERMISSION_RESOLVED);
      expect(types).toContain(IDENTITY_EVENT_TYPES.IDENTITY_RESOLVED);
    });
  });
});
