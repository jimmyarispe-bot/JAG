/**
 * Sprint 213 — Organization administration workspace loader.
 */

import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  FeatureFlagService,
  SubscriptionService,
  TenantService,
  UsageService,
  type OrganizationAdminAuditEvent,
  type OrganizationObservation,
  type OrganizationProfile,
  type SubdomainAvailability,
  type TenantCapabilityView,
  type TenantFeatureFlags,
  type TenantSubscription,
  type TenantUsageMetrics,
} from "@/lib/platform/tenant";

export type JagTenantAdminWorkspace = {
  readonly organizationId: string;
  readonly organizations: readonly { id: string; label: string }[];
  readonly profile: OrganizationProfile;
  readonly subdomain: {
    readonly current: string;
    readonly fqdn: string | null;
    readonly availability: SubdomainAvailability;
    readonly reservedNames: readonly string[];
    readonly customDomain: string | null;
    readonly customDomainPlaceholder: string;
  };
  readonly featureFlags: TenantFeatureFlags;
  readonly discoverableFlags: readonly {
    id: string;
    label: string;
    description: string;
  }[];
  readonly capabilities: readonly TenantCapabilityView[];
  readonly usage: TenantUsageMetrics;
  readonly subscription: TenantSubscription;
  readonly plans: ReturnType<typeof SubscriptionService.listPlans>;
  readonly billingProviderLabel: string;
  readonly audit: readonly OrganizationAdminAuditEvent[];
  readonly observations: readonly OrganizationObservation[];
  readonly brandingHref: string;
};

export function loadTenantAdminWorkspace(
  session: JagPlatformSession,
  organizationId?: string
): JagTenantAdminWorkspace {
  const orgs = listOrganizationsForSession(session).map((o) => ({
    id: o.id,
    label: o.name,
  }));

  const selectedId =
    (organizationId && orgs.some((o) => o.id === organizationId)
      ? organizationId
      : orgs[0]?.id) ?? "org.the-academy-way";

  const label =
    orgs.find((o) => o.id === selectedId)?.label ?? "Organization";

  const tenant = TenantService.ensureTenant({
    organizationId: selectedId,
    organizationName: label,
    subdomain:
      selectedId === "org.the-academy-way"
        ? "academy"
        : label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 48) || "tenant",
    primaryEmail: session.email,
  });

  const subscription =
    tenant.subscription ??
    SubscriptionService.getSubscription(selectedId)!;

  return {
    organizationId: selectedId,
    organizations: orgs.length
      ? orgs
      : [{ id: selectedId, label: tenant.profile.organizationName }],
    profile: tenant.profile,
    subdomain: TenantService.subdomainInfo(selectedId),
    featureFlags: FeatureFlagService.getFlags(selectedId),
    discoverableFlags: FeatureFlagService.listDiscoverableFlags(),
    capabilities: FeatureFlagService.listCapabilities(selectedId),
    usage: UsageService.getUsage(selectedId),
    subscription,
    plans: SubscriptionService.listPlans(),
    billingProviderLabel: SubscriptionService.describeBillingProvider(
      subscription.billingProvider
    ),
    audit: TenantService.auditLog(selectedId, 30),
    observations: TenantService.observations(selectedId, 20),
    brandingHref: "/jag/settings/branding",
  };
}
