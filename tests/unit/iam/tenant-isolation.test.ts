import { describe, expect, it } from "vitest";
import {
  TenantIsolationError,
  createIamPlatform,
} from "@/lib/platform/iam";

describe("IAM tenant isolation", () => {
  it("keeps organizations isolated for non-admin actors", () => {
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
      { slug: "alpha", name: "Alpha", ownerUserId: "owner-a" },
      { ...platform, organizationId: null }
    );
    const orgB = iam.organizations.create(
      { slug: "beta", name: "Beta", ownerUserId: "owner-b" },
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
    const actorB = iam.buildSubjectSnapshot({
      userId: "owner-b",
      organizationId: orgB.id,
    });

    expect(iam.organizations.listForActor(actorA).map((o) => o.id)).toEqual([
      orgA.id,
    ]);
    expect(iam.organizations.listForActor(actorB).map((o) => o.id)).toEqual([
      orgB.id,
    ]);

    expect(() => iam.organizations.get(orgB.id, actorA)).toThrow(
      TenantIsolationError
    );
    expect(() => iam.organizations.get(orgA.id, actorB)).toThrow(
      TenantIsolationError
    );

    expect(iam.organizations.userBelongsToOrganization("owner-a", orgA.id)).toBe(
      true
    );
    expect(iam.organizations.userBelongsToOrganization("owner-a", orgB.id)).toBe(
      false
    );
  });
});
