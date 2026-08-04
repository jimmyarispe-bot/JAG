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
import { listProvisionedOrganizations } from "@/lib/jag-business/store";
import { getIndustry } from "@/lib/jag-business/industries";

function provisionedToCard(
  org: ReturnType<typeof listProvisionedOrganizations>[number]
): JagOrganizationCard {
  const industry = getIndustry(org.industry);
  const productName = industry?.productName ?? "AcademyOS";
  const productAvailable = industry?.available ?? false;

  return {
    id: org.organizationId,
    name: org.organizationName,
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

function boundOrgCard(
  session: JagPlatformSession,
  owned: readonly JagOrganizationCard[]
): JagOrganizationCard | null {
  const boundId = session.organizationId;
  if (!boundId) return null;
  const fromOwned = owned.find((o) => o.id === boundId);
  if (fromOwned) return fromOwned;
  // Session-bound org not in in-memory provisioned store — synthesize a card.
  return {
    id: boundId,
    name: boundId,
    health: "healthy",
    status: "active",
    products: [],
  };
}

/**
 * Organizations visible to the signed-in JAG user.
 *
 * Platform stewards: Academy Way seed card + in-memory provisioned orgs
 * (demo accounts) or owned orgs (non-demo).
 * Organization operators: only the session-bound organization — never the
 * Academy seed dump and never other founders' orgs.
 */
export function listOrganizationsForSession(
  session: JagPlatformSession
): readonly JagOrganizationCard[] {
  const provisioned = listProvisionedOrganizations().map(provisionedToCard);
  const seed = getAcademyWayOrganization();

  const owned = listProvisionedOrganizations()
    .filter(
      (o) => o.founder.email.toLowerCase() === session.email.toLowerCase()
    )
    .map(provisionedToCard);

  let candidates: JagOrganizationCard[];

  if (session.authority === "organization") {
    const bound = boundOrgCard(session, owned);
    candidates = bound ? [bound] : [];
  } else if (
    session.authority === "platform" &&
    isSeededPlatformAccount(session.email)
  ) {
    candidates = [seed, ...provisioned];
  } else {
    // Non-demo platform steward: owned in-memory orgs only until DB control plane lands.
    candidates = [...owned];
    if (session.organizationId) {
      const bound = boundOrgCard(session, owned);
      if (bound && !candidates.some((c) => c.id === bound.id)) {
        candidates = [bound, ...candidates];
      }
    }
  }

  return Object.freeze(
    candidates.filter((o) => sessionCanAccessOrganization(session, o.id))
  );
}
