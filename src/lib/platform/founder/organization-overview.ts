import type { PlatformApplicationKey } from "@/lib/platform/applications/types";
import { scoreToHealthBand } from "@/lib/platform/founder/health";
import type { FounderOrganizationSummary } from "@/lib/platform/founder/types";
import type { OrganizationFeatureFlags } from "@/lib/platform/organizations/types";

export function buildOrganizationOverview(input: {
  id: string;
  slug: string;
  name: string;
  status?: string;
  healthScore?: number | null;
  featureFlags?: OrganizationFeatureFlags;
  enabledApplicationKeys?: PlatformApplicationKey[];
}): FounderOrganizationSummary {
  const healthScore = input.healthScore ?? null;
  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    status: input.status ?? "active",
    healthScore,
    healthBand: scoreToHealthBand(healthScore),
    featureFlags: input.featureFlags ?? {},
    enabledApplicationKeys: input.enabledApplicationKeys ?? ["academyos"],
  };
}

export function selectActiveOrganization(
  organizations: FounderOrganizationSummary[],
  organizationId?: string | null
): FounderOrganizationSummary | null {
  if (!organizationId) return null;
  return organizations.find((o) => o.id === organizationId) ?? null;
}

export function filterOrganizationsForApplication(
  organizations: FounderOrganizationSummary[],
  applicationKey: PlatformApplicationKey
): FounderOrganizationSummary[] {
  return organizations.filter((o) =>
    o.enabledApplicationKeys.includes(applicationKey)
  );
}
