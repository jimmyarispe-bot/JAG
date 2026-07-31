import {
  PLATFORM_APPLICATION_CATALOG,
} from "@/lib/platform/applications/catalog";
import type { PlatformApplicationKey } from "@/lib/platform/applications/types";
import type {
  FounderApplicationSummary,
  FounderOrganizationSummary,
} from "@/lib/platform/founder/types";

export function buildApplicationOverview(input: {
  key: PlatformApplicationKey;
  name?: string;
  description?: string;
  homeRoute?: string | null;
  status?: string;
  organizations?: FounderOrganizationSummary[];
}): FounderApplicationSummary {
  const catalog = PLATFORM_APPLICATION_CATALOG.find((a) => a.key === input.key);
  const orgs = input.organizations ?? [];
  const enabledCount = orgs.filter((o) =>
    o.enabledApplicationKeys.includes(input.key)
  ).length;

  return {
    key: input.key,
    name: input.name ?? catalog?.name ?? input.key,
    description: input.description ?? catalog?.description ?? "",
    homeRoute: input.homeRoute ?? catalog?.homeRoute ?? null,
    status: input.status ?? catalog?.status ?? "active",
    organizationCount: enabledCount,
  };
}

/** Catalog applications with per-org enablement counts. */
export function listFounderApplications(
  organizations: FounderOrganizationSummary[]
): FounderApplicationSummary[] {
  return PLATFORM_APPLICATION_CATALOG.map((app) =>
    buildApplicationOverview({
      key: app.key,
      name: app.name,
      description: app.description,
      homeRoute: app.homeRoute,
      status: app.status,
      organizations,
    })
  );
}

export function selectActiveApplication(
  applications: FounderApplicationSummary[],
  applicationKey?: string | null
): FounderApplicationSummary | null {
  if (!applicationKey) return null;
  return applications.find((a) => a.key === applicationKey) ?? null;
}
