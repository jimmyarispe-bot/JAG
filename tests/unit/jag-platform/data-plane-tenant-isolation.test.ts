/**
 * JAG External Pilot Foundation II — end-to-end data-plane tenant isolation.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertSessionCanAccessOrganization,
  filterAccessibleOrganizationIds,
  filterObservationsForSession,
  listSessionAccessibleOrganizations,
  resolveSessionOrganization,
} from "@/lib/jag-platform/data-plane";
import { resolveJagOrganizationContext } from "@/lib/jag-platform/org-context";
import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center/access";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import {
  resetJagBusinessStoreForTests,
  saveProvisionedOrganization,
} from "@/lib/jag-business/store";
import type { ProvisionedOrganization } from "@/lib/jag-business/types";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { buildAuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import { loadMemoryWorkspace } from "@/lib/jag-command-center/memory/load-memory";
import { loadExecutiveOverview } from "@/lib/jag-command-center/load-executive-overview";
import { loadTenantAdminWorkspace } from "@/lib/jag-command-center/tenant-admin/load-tenant-admin";
import {
  listJagAuditEvents,
  recordJagAuditEvent,
  resetJagAuditStoreForTests,
} from "@/lib/jag-command-center/audit/store";

function orgSession(
  organizationId: string,
  overrides?: Partial<JagPlatformSession>
): JagPlatformSession {
  return {
    userId: "u-org",
    email: "admin@pilot.example",
    displayName: "Pilot Admin",
    role: "ORG_OWNER",
    authority: "organization",
    organizationId,
    issuedAt: new Date().toISOString(),
    ...overrides,
  };
}

function platformSession(
  overrides?: Partial<JagPlatformSession>
): JagPlatformSession {
  return {
    userId: "u-founder",
    email: "founder@example.com",
    displayName: "Founder",
    role: "FOUNDER",
    authority: "platform",
    organizationId: null,
    issuedAt: new Date().toISOString(),
    ...overrides,
  };
}

function provisioned(
  organizationId: string,
  email: string,
  name: string
): ProvisionedOrganization {
  return {
    organizationId,
    organizationName: name,
    industry: "education",
    createdAt: new Date().toISOString(),
    founder: {
      userId: `user.${organizationId}`,
      email,
      displayName: name,
      password: "x",
    },
  };
}

describe("resolveSessionOrganization fail-closed", () => {
  beforeEach(() => {
    resetJagBusinessStoreForTests();
    saveProvisionedOrganization(
      provisioned("org-a", "admin@pilot.example", "Pilot A")
    );
    saveProvisionedOrganization(
      provisioned("org-b", "other@pilot.example", "Pilot B")
    );
  });

  it("org operator cannot resolve another tenant via preferred id", () => {
    const session = orgSession("org-a");
    expect(resolveSessionOrganization(session, "org-b")).toBeNull();
    expect(resolveEvidenceOrganization(session, "org-b")).toBeNull();
    expect(canAccessEvidenceOrganization(session, "org-b")).toBe(false);
  });

  it("org operator binds to session organization when preferred omitted", () => {
    const session = orgSession("org-a");
    expect(resolveSessionOrganization(session, null)?.id).toBe("org-a");
    expect(listSessionAccessibleOrganizations(session).map((o) => o.id)).toEqual([
      "org-a",
    ]);
  });

  it("invalid preferred does not soft-fallback to first accessible org", () => {
    const session = orgSession("org-a");
    expect(resolveSessionOrganization(session, "org-unknown")).toBeNull();
  });

  it("assertSessionCanAccessOrganization denies cross-tenant writes", () => {
    const session = orgSession("org-a");
    expect(assertSessionCanAccessOrganization(session, "org-b")).toBe(
      "Organization access denied."
    );
    expect(assertSessionCanAccessOrganization(session, "org-a")).toBeNull();
  });

  it("filterAccessibleOrganizationIds strips foreign ids", () => {
    const session = orgSession("org-a");
    expect(
      filterAccessibleOrganizationIds(session, ["org-a", "org-b", "org-c"])
    ).toEqual(["org-a"]);
  });
});

describe("listOrganizationsForSession ACL", () => {
  beforeEach(() => {
    resetJagBusinessStoreForTests();
    saveProvisionedOrganization(
      provisioned("org-a", "admin@pilot.example", "Pilot A")
    );
    saveProvisionedOrganization(
      provisioned("org-b", "admin@pilot.example", "Pilot B")
    );
  });

  it("org operator only sees the bound organization even if email owns multiple", () => {
    const session = orgSession("org-a");
    const ids = listOrganizationsForSession(session).map((o) => o.id);
    expect(ids).toEqual(["org-a"]);
    expect(ids).not.toContain("org-b");
    expect(ids).not.toContain("org.the-academy-way");
  });

  it("org operator never receives Academy Way seed", () => {
    const session = orgSession("org-a");
    expect(
      listOrganizationsForSession(session).some(
        (o) => o.id === "org.the-academy-way"
      )
    ).toBe(false);
  });
});

describe("command-center loaders cross-tenant", () => {
  beforeEach(() => {
    resetJagBusinessStoreForTests();
    saveProvisionedOrganization(
      provisioned("org-a", "admin@pilot.example", "Pilot A")
    );
    saveProvisionedOrganization(
      provisioned("org-b", "other@pilot.example", "Pilot B")
    );
  });

  it("memory loader ignores foreign organizationId query", () => {
    const session = orgSession("org-a");
    const model = loadMemoryWorkspace(session, { organizationId: "org-b" });
    expect(model.organizationId).toBeNull();
    expect(model.records).toEqual([]);
  });

  it("executive overview ignores foreign organizationId query", () => {
    const session = orgSession("org-a");
    const model = loadExecutiveOverview(session, { organizationId: "org-b" });
    expect(model.organizationId).toBeNull();
  });

  it("tenant-admin does not fall back to Academy Way", () => {
    const session = orgSession("org-a");
    expect(loadTenantAdminWorkspace(session, "org-b")).toBeNull();
    expect(loadTenantAdminWorkspace(session)?.organizationId).toBe("org-a");
  });
});

describe("multi-org context fail-closed", () => {
  it("org operator with multiple memberships and no preferred/primary returns null", async () => {
    const supabase = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order() {
            return Promise.resolve({
              data: [
                {
                  organization_id: "org-1",
                  membership_role: "admin",
                  is_primary: false,
                },
                {
                  organization_id: "org-2",
                  membership_role: "member",
                  is_primary: false,
                },
              ],
            });
          },
        };
      },
    };

    const snap = buildAuthzSnapshot("u-multi", ["JAG_ORG_ADMIN"]);
    const ctx = await resolveJagOrganizationContext(
      supabase as never,
      "u-multi",
      snap,
      null
    );
    expect(ctx).toBeNull();
  });

  it("org operator with unique primary binds without preferred", async () => {
    const supabase = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order() {
            return Promise.resolve({
              data: [
                {
                  organization_id: "org-1",
                  membership_role: "admin",
                  is_primary: true,
                },
                {
                  organization_id: "org-2",
                  membership_role: "member",
                  is_primary: false,
                },
              ],
            });
          },
        };
      },
    };

    const snap = buildAuthzSnapshot("u-multi", ["JAG_ORG_ADMIN"]);
    const ctx = await resolveJagOrganizationContext(
      supabase as never,
      "u-multi",
      snap,
      null
    );
    expect(ctx?.organizationId).toBe("org-1");
    expect(ctx?.authority).toBe("organization");
  });

  it("platform steward with ambiguous memberships stays unbound", async () => {
    const supabase = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          order() {
            return Promise.resolve({
              data: [
                {
                  organization_id: "org-1",
                  membership_role: "owner",
                  is_primary: false,
                },
                {
                  organization_id: "org-2",
                  membership_role: "owner",
                  is_primary: false,
                },
              ],
            });
          },
        };
      },
    };

    const snap = buildAuthzSnapshot("u-founder", ["FOUNDER"]);
    const ctx = await resolveJagOrganizationContext(
      supabase as never,
      "u-founder",
      snap,
      null
    );
    expect(ctx).toEqual({
      authority: "platform",
      organizationId: null,
      membershipRole: null,
    });
  });
});

describe("observability audit isolation", () => {
  beforeEach(() => {
    resetJagAuditStoreForTests();
    recordJagAuditEvent({
      action: "memory_created",
      actorUserId: "u1",
      actorLabel: "A",
      organizationId: "org-a",
      detail: "a",
    });
    recordJagAuditEvent({
      action: "memory_created",
      actorUserId: "u2",
      actorLabel: "B",
      organizationId: "org-b",
      detail: "b",
    });
  });

  afterEach(() => {
    resetJagAuditStoreForTests();
  });

  it("org operator only sees audit events for accessible orgs", () => {
    const session = orgSession("org-a");
    const events = listJagAuditEvents(40, {
      canAccessOrganization: (id) =>
        session.authority === "organization" &&
        session.organizationId === id,
      allowUnbound: false,
    });
    expect(events.map((e) => e.organizationId)).toEqual(["org-a"]);
  });

  it("platform steward can see unbound and any org events", () => {
    recordJagAuditEvent({
      action: "decision_status_updated",
      actorUserId: "u-f",
      actorLabel: "F",
      organizationId: null,
      detail: "platform",
    });
    const session = platformSession();
    const events = listJagAuditEvents(40, {
      canAccessOrganization: () => true,
      allowUnbound: session.authority === "platform",
    });
    expect(events.some((e) => e.organizationId === null)).toBe(true);
    expect(events.some((e) => e.organizationId === "org-b")).toBe(true);
  });
});

describe("conversation cross-tenant ACL", () => {
  beforeEach(async () => {
    const { resetJagConversationStoreForTests, createConversation } =
      await import("@/lib/jag-command-center/conversation/store");
    resetJagConversationStoreForTests();
    createConversation({
      organizationId: "org-a",
      organizationName: "A",
      title: "Tenant A chat",
    });
    createConversation({
      organizationId: "org-b",
      organizationName: "B",
      title: "Tenant B chat",
    });
  });

  it("workspace list and active deny foreign conversations", async () => {
    const { loadConversationWorkspace } = await import(
      "@/lib/jag-command-center/conversation/query"
    );
    const { listConversations } = await import(
      "@/lib/jag-command-center/conversation/store"
    );
    const all = listConversations({ includeArchived: true });
    const foreign = all.find((c) => c.title === "Tenant B chat")!;
    const session = orgSession("org-a");
    const model = loadConversationWorkspace(session, {
      conversationId: foreign.id,
    });
    expect(model.conversations.every((c) => c.title !== "Tenant B chat")).toBe(
      true
    );
    expect(model.active).toBeNull();
  });

  it("getAccessibleConversation returns null for foreign id", async () => {
    const { getAccessibleConversation } = await import(
      "@/lib/jag-command-center/conversation/access"
    );
    const { listConversations } = await import(
      "@/lib/jag-command-center/conversation/store"
    );
    const foreign = listConversations({ includeArchived: true }).find(
      (c) => c.title === "Tenant B chat"
    )!;
    expect(getAccessibleConversation(orgSession("org-a"), foreign.id)).toBeNull();
  });
});

describe("briefing list fail-closed", () => {
  it("returns empty briefings when preferred org is inaccessible", async () => {
    resetJagBusinessStoreForTests();
    saveProvisionedOrganization(
      provisioned("org-a", "admin@pilot.example", "Pilot A")
    );
    const { loadBriefingList } = await import(
      "@/lib/jag-command-center/briefing-engine/query"
    );
    const model = loadBriefingList(orgSession("org-a"), {
      organizationId: "org-b",
    });
    expect(model.selectedOrganizationId).toBeNull();
    expect(model.briefings).toEqual([]);
  });
});

describe("observation filter helper", () => {
  it("strips foreign and unbound rows for org operators", () => {
    const session = orgSession("org-a");
    const filtered = filterObservationsForSession(
      session,
      [
        { organizationId: "org-a", id: "1" },
        { organizationId: "org-b", id: "2" },
        { organizationId: null, id: "3" },
      ],
      20
    );
    expect(filtered.map((r) => r.id)).toEqual(["1"]);
  });
});

describe("source invariants", () => {
  it("data-plane module exports fail-closed helpers", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(
      join(process.cwd(), "src/lib/jag-platform/data-plane.ts"),
      "utf8"
    );
    expect(src).toContain("resolveSessionOrganization");
    expect(src).toContain("sessionCanAccessOrganization");
    expect(src).toContain("never silently rewrite");
  });

  it("org-context no longer silently picks memberships[0] for multi-org", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(
      join(process.cwd(), "src/lib/jag-platform/org-context.ts"),
      "utf8"
    );
    expect(src).toContain("fail closed");
    expect(src).not.toMatch(
      /memberships\.find\(\(m\) => m\.is_primary\) \?\?\s*memberships\[0\]/
    );
  });
});
