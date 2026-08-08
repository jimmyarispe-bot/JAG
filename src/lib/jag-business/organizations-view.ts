/**
 * Organization cards for the JAG Platform dashboard.
 *
 * ACL source for data-plane surfaces — always filtered by session authority
 * and `sessionCanAccessOrganization`.
 */

import { ACADEMYOS_LAUNCH_PATH } from "@/lib/jag-platform/auth";
import {
  getAcademyWayOrganization,
  type JagOrganizationCard,
} from "@/lib/jag-platform/organizations";
import { sessionCanAccessOrganization } from "@/lib/jag-platform/org-context";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { JAG_PLATFORM_DEMO_ACCOUNTS } from "@/lib/jag-platform/auth";
import {
  getProvisionedOrganization,
  listProvisionedOrganizations,
} from "@/lib/jag-business/store";
import { getIndustry } from "@/lib/jag-business/industries";
import { resolveOrganizationDisplayName } from "@/lib/jag-business/organization-display";

function provisionedToCard(
  org: ReturnType<typeof listProvisionedOrganizations>[number]
): JagOrganizationCard {
  const industry = getIndustry(org.industry);
  const productName = industry?.productName ?? "AcademyOS";
  const productAvailable = industry?.available ?? false;

  return {
    id: org.organizationId,
    name: resolveOrganizationDisplayName(
      org.organizationId,
      org.organizationName
    ),
    health: "healthy",
    status: "active",
    products: productAvailable
      ? [
          {
            id: `product.${org.organizationId}.academyos`,
            name: productName,
            launchPath: ACADEMYOS_LAUNCH_PATH,
            status: "active",
          },
        ]
      : [
          {
            id: `product.${org.organizationId}.pending`,
            name: `${productName} (Coming Soon)`,
            launchPath: "/jag/organizations",
            status: "inactive",
          },
        ],
  };
}

function isSeededPlatformAccount(email: string): boolean {
  return JAG_PLATFORM_DEMO_ACCOUNTS.some(
    (a) => a.email === email.trim().toLowerCase()
  );
}

/**
 * Legacy command-center fixtures sometimes omit `authority`. Seeded demo
 * accounts are platform stewards; never invent organization-operator access.
 */
function effectiveSession(
  session: JagPlatformSession
): JagPlatformSession {
  if (session.authority) return session;
  if (isSeededPlatformAccount(session.email)) {
    return { ...session, authority: "platform" };
  }
  return session;
}

function boundOrgCard(
  session: JagPlatformSession,
  owned: readonly JagOrganizationCard[]
): JagOrganizationCard | null {
  const boundId = session.organizationId;
  if (!boundId) return null;
  const fromOwned = owned.find((o) => o.id === boundId);
  if (fromOwned) return fromOwned;
  const provisioned = getProvisionedOrganization(boundId);
  if (provisioned) return provisionedToCard(provisioned);
  // Session-bound org not in provisioned store — synthesize without using the id as label.
  return {
    id: boundId,
    name: resolveOrganizationDisplayName(boundId),
    health: "healthy",
    status: "active",
    products: [],
  };
}

function prioritizeActiveOrganization(
  cards: readonly JagOrganizationCard[],
  activeOrganizationId: string | null
): JagOrganizationCard[] {
  if (!activeOrganizationId) return [...cards];
  const active = cards.find((c) => c.id === activeOrganizationId);
  if (!active) return [...cards];
  return [active, ...cards.filter((c) => c.id !== activeOrganizationId)];
}

/**
 * Organizations visible to the signed-in JAG user.
 *
 * Platform stewards: Academy Way seed card + in-memory provisioned orgs
 * (demo accounts) or owned orgs (non-demo).
 * Organization operators: only the session-bound organization — never the
 * Academy seed dump and never other founders' orgs.
 *
 * When a session is bound to a provisioned/customer org, that org is listed
 * first so the UI does not default to the platform seed.
 */
export function listOrganizationsForSession(
  session: JagPlatformSession
): readonly JagOrganizationCard[] {
  const effective = effectiveSession(session);
  const provisioned = listProvisionedOrganizations().map(provisionedToCard);
  const seed = getAcademyWayOrganization();

  const owned = listProvisionedOrganizations()
    .filter(
      (o) => o.founder.email.toLowerCase() === effective.email.toLowerCase()
    )
    .map(provisionedToCard);

  let candidates: JagOrganizationCard[];

  if (effective.authority === "organization") {
    const bound = boundOrgCard(effective, owned);
    candidates = bound ? [bound] : [];
  } else if (
    effective.authority === "platform" &&
    isSeededPlatformAccount(effective.email)
  ) {
    // Bound to a customer (non-seed) org → customer data scope is that org only.
    // Platform-admin multi-org listing uses listOrganizationsForPlatformAdmin().
    const boundIsSeed = effective.organizationId === seed.id;
    if (effective.organizationId && !boundIsSeed) {
      const bound =
        provisioned.find((o) => o.id === effective.organizationId) ??
        boundOrgCard(effective, owned);
      candidates = bound ? [bound] : [];
    } else {
      candidates = [seed, ...provisioned];
    }
  } else {
    // Non-demo platform steward: owned in-memory orgs only until DB control plane lands.
    candidates = [...owned];
    if (effective.organizationId) {
      const bound = boundOrgCard(effective, owned);
      if (bound && !candidates.some((c) => c.id === bound.id)) {
        candidates = [bound, ...candidates];
      }
    }
    candidates = prioritizeActiveOrganization(
      candidates,
      effective.organizationId
    );
  }

  return Object.freeze(
    candidates.filter((o) => sessionCanAccessOrganization(effective, o.id))
  );
}

/**
 * Platform/admin multi-org listing — seed + all provisioned orgs the steward may access.
 * Not used for customer Executive Intelligence data loaders.
 */
export function listOrganizationsForPlatformAdmin(
  session: JagPlatformSession
): readonly JagOrganizationCard[] {
  const effective = effectiveSession(session);
  if (effective.authority !== "platform") {
    return listOrganizationsForSession(session);
  }
  const seed = getAcademyWayOrganization();
  const provisioned = listProvisionedOrganizations().map(provisionedToCard);
  const candidates = prioritizeActiveOrganization(
    [seed, ...provisioned],
    effective.organizationId
  );
  return Object.freeze(
    candidates.filter((o) => sessionCanAccessOrganization(effective, o.id))
  );
}
