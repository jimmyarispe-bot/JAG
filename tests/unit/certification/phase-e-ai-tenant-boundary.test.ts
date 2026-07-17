import { describe, expect, it } from "vitest";
import { createIamPlatform, TenantIsolationError } from "@/lib/platform/iam";

/**
 * Certifies in-memory multi-tenant isolation used by AI/executive context binding paths.
 * Live Supabase RLS isolation remains a Phase E.1 evidence gap (see docs/testing/phase-e).
 */
describe("Phase E — AI / executive tenant boundary certification", () => {
  it("prevents cross-organization reads for org-scoped actors", () => {
    const iam = createIamPlatform({
      createId: ((n) => (prefix: string) => `${prefix}-${++n}`)(0),
    });

    const adminRole = iam.roles.getByKey("SYSTEM_ADMIN")!;
    const orgAdminRole = iam.roles.getByKey("ORG_ADMIN")!;
    iam.identity.upsertUser({ id: "platform", email: "p@example.com" });
    iam.identity.upsertUser({ id: "owner-a", email: "a@example.com" });
    iam.identity.upsertUser({ id: "owner-b", email: "b@example.com" });
    iam.roles.assignRole("platform", adminRole.id);
    iam.roles.assignRole("owner-a", orgAdminRole.id);
    iam.roles.assignRole("owner-b", orgAdminRole.id);

    const platform = iam.buildSubjectSnapshot({ userId: "platform" });
    const orgA = iam.organizations.create(
      { slug: "ai-alpha", name: "AI Alpha", ownerUserId: "owner-a" },
      { ...platform, organizationId: null }
    );
    const orgB = iam.organizations.create(
      { slug: "ai-beta", name: "AI Beta", ownerUserId: "owner-b" },
      { ...platform, organizationId: null }
    );

    iam.organizations.transitionLifecycle(orgA.id, "active", {
      ...platform,
      organizationId: orgA.id,
    });
    iam.organizations.transitionLifecycle(orgB.id, "active", {
      ...platform,
      organizationId: orgB.id,
    });

    const actorA = iam.buildSubjectSnapshot({
      userId: "owner-a",
      organizationId: orgA.id,
    });

    expect(() => iam.organizations.get(orgB.id, actorA)).toThrow(TenantIsolationError);
    expect(iam.organizations.get(orgA.id, actorA).id).toBe(orgA.id);
  });
});
