/**
 * Dynamically loaded domain packages for the Command Center.
 * Education is registered today; structure is multi-domain ready.
 */

import {
  EDUCATION_DOMAIN_ID,
  EDUCATION_DOMAIN_NAME,
  EDUCATION_DOMAIN_VERSION,
  listCapabilityPacks,
} from "@/lib/domains/education";
import type { JagLoadedDomainView } from "./types";

export type JagDomainDescriptor = {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly listPackCount: () => number;
};

const DOMAIN_LOADERS: readonly JagDomainDescriptor[] = [
  {
    id: EDUCATION_DOMAIN_ID,
    name: titleCase(EDUCATION_DOMAIN_NAME),
    version: EDUCATION_DOMAIN_VERSION,
    description:
      "Education domain package — lifecycle, support, operations, funding, and executive intelligence.",
    listPackCount: () => listCapabilityPacks().length,
  },
];

/** Future domains register here without changing Core / Runtime / SDK. */
export function registerCommandCenterDomainLoader(
  _descriptor: JagDomainDescriptor
): void {
  // Reserved extension point — append-only registration can be added later.
}

export function listLoadedDomains(): readonly JagLoadedDomainView[] {
  return DOMAIN_LOADERS.map((d) => {
    try {
      const packCount = d.listPackCount();
      return {
        id: d.id,
        name: d.name,
        version: d.version,
        status: "loaded" as const,
        packCount,
        description: d.description,
      };
    } catch {
      return {
        id: d.id,
        name: d.name,
        version: d.version,
        status: "unavailable" as const,
        packCount: 0,
        description: d.description,
      };
    }
  });
}

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
