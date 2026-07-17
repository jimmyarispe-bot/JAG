import type { IdentityContext } from "@/lib/platform/identity/context";
import { getOrganizationPlatform } from "../create-platform";
import type { ExecutiveTenantContext } from "../types";

/**
 * Map live identity session → Organization Platform executive tenant context.
 * Additive helper for ECC — does not change Command Center architecture.
 */
export function resolveExecutiveContextForIdentity(
  identity: Pick<IdentityContext, "email" | "fullName">
): ExecutiveTenantContext | null {
  const platform = getOrganizationPlatform();
  const email = identity.email.trim().toLowerCase();
  let user = [...platform.store.users.values()].find((u) => u.email === email);

  if (!user) {
    // Provision a shadow membership into the first org for local ECC wiring only.
    const orgs = platform.store.listOrganizations();
    if (orgs.length === 0) return null;
    user = platform.users.createUser({
      email,
      fullName: identity.fullName,
      authMethods: ["email_password"],
    });
    const org = orgs[0]!;
    const membershipId = platform.store.createId("mem");
    platform.store.memberships.set(membershipId, {
      id: membershipId,
      organizationId: org.id,
      userId: user.id,
      role: "executive",
      locationIds: [],
      departmentIds: [],
      teamIds: [],
      status: "active",
      joinedAt: new Date().toISOString(),
    });
  }

  let session = platform.sessions.listForUser(user.id)[0];
  if (!session) {
    session = platform.sessions.create(user.id, "email_password");
  }

  try {
    return platform.resolveExecutiveTenantContext(session.id);
  } catch {
    return null;
  }
}
