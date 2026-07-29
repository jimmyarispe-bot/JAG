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
 * Seeded platform accounts see The Academy Way + all provisioned orgs.
 * New founders see organizations they created.
 */
export function listOrganizationsForSession(
  session: JagPlatformSession
): readonly JagOrganizationCard[] {
  const provisioned = listProvisionedOrganizations().map(provisionedToCard);
  const seed = getAcademyWayOrganization();

  if (isSeededPlatformAccount(session.email)) {
    return Object.freeze([seed, ...provisioned]);
  }

  const owned = listProvisionedOrganizations()
    .filter(
      (o) => o.founder.email.toLowerCase() === session.email.toLowerCase()
    )
    .map(provisionedToCard);

  return Object.freeze(owned);
}
