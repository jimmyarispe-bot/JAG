/**
 * Organizations visible in the JAG Platform Portal (Phase 1).
 */

import { ACADEMYOS_LAUNCH_PATH } from "@/lib/jag-platform/auth";

export type JagInstalledProduct = {
  readonly id: string;
  readonly name: string;
  readonly launchPath: string;
  readonly status: "active" | "inactive";
};

export type JagOrganizationCard = {
  readonly id: string;
  readonly name: string;
  readonly health: "healthy" | "watch" | "critical";
  readonly status: "active" | "provisioning" | "suspended";
  readonly products: readonly JagInstalledProduct[];
};

export const JAG_PLATFORM_ORGANIZATIONS: readonly JagOrganizationCard[] =
  Object.freeze([
    Object.freeze({
      id: "org.the-academy-way",
      name: "The Academy Way",
      health: "healthy" as const,
      status: "active" as const,
      products: Object.freeze([
        Object.freeze({
          id: "product.academyos",
          name: "AcademyOS",
          launchPath: ACADEMYOS_LAUNCH_PATH,
          status: "active" as const,
        }),
      ]),
    }),
  ]);

export function getAcademyWayOrganization(): JagOrganizationCard {
  return JAG_PLATFORM_ORGANIZATIONS[0]!;
}
