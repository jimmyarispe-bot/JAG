/**
 * Organization cards for the JAG Platform dashboard.
 */

import { ACADEMYOS_LAUNCH_PATH } from "@/lib/jag-platform/auth";
import {
  getAcademyWayOrganization,
  type JagOrganizationCard,
} from "@/lib/jag-platform/organizations";
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

/**
 * Organizations visible to the signed-in JAG user.
 *
 * Platform stewards: Academy Way seed card + in-memory provisioned orgs.
 * Organization operators: only orgs they own/created (never global seed dump).
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

  // Seeded platform demo accounts: Academy Way + all in-memory provisioned orgs.
  if (
    session.authority === "platform" &&
    isSeededPlatformAccount(session.email)
  ) {
    return Object.freeze([seed, ...provisioned]);
  }

  // Customer org operator — never expose the Academy seed by default.
  if (session.authority === "organization") {
    if (session.organizationId) {
      const bound = owned.filter((o) => o.id === session.organizationId);
      if (bound.length > 0) return Object.freeze(bound);
    }
    return Object.freeze(owned);
  }

  // Non-demo platform steward: owned in-memory orgs only until DB control plane lands.
  return Object.freeze(owned);
}
