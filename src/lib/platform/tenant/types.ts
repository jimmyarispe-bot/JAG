/**
 * Sprint 213 — Organization administration & tenant management types.
 */

export type OrganizationStatus =
  | "active"
  | "trial"
  | "suspended"
  | "provisioning"
  | "archived";

export type TenantContact = {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
};

export type OrganizationProfile = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly legalName: string;
  readonly industry: string;
  readonly timezone: string;
  readonly subdomain: string;
  readonly status: OrganizationStatus;
  readonly primaryContact: TenantContact;
  readonly executiveContact: TenantContact;
  readonly supportContact: TenantContact;
  readonly customDomain: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "cancelled"
  | "paused";

export type BillingProviderId = "none" | "stripe" | "manual";

export type TenantSubscription = {
  readonly organizationId: string;
  readonly planId: string;
  readonly planName: string;
  readonly status: SubscriptionStatus;
  readonly renewalAt: string | null;
  readonly seats: number;
  readonly seatLimit: number;
  readonly limits: {
    readonly apiCallsPerMonth: number;
    readonly storageGb: number;
    readonly documents: number;
    readonly briefingsPerMonth: number;
  };
  readonly billingProvider: BillingProviderId;
  readonly updatedAt: string;
};

/** Maps Capability SDK ids → tenant feature toggles. */
export type TenantFeatureFlagId =
  | "jag.intelligence.predictive"
  | "jag.intelligence.conversation"
  | "jag.intelligence.memory"
  | "jag.intelligence.strategy"
  | "jag.intelligence.watchers"
  | "jag.decisions.center"
  | "jag.intelligence.briefings"
  | "jag.intelligence.explainability"
  | string;

export type TenantFeatureFlags = Readonly<Record<string, boolean>>;

export type TenantUsageMetrics = {
  readonly organizationId: string;
  readonly executiveUsers: number;
  readonly organizations: number;
  readonly apiUsage: number;
  readonly storageGb: number;
  readonly documents: number;
  readonly briefingsGenerated: number;
  readonly watcherAlerts: number;
  readonly conversationSessions: number;
  readonly forecastsCreated: number;
  readonly measuredAt: string;
};

export type TenantCapabilityView = {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly health: string;
  readonly enabled: boolean;
  readonly installed: boolean;
  readonly dependencies: readonly string[];
  readonly description: string;
};

export type SubdomainAvailability = {
  readonly subdomain: string;
  readonly available: boolean;
  readonly reserved: boolean;
  readonly reason: string | null;
  readonly currentOwnerOrganizationId: string | null;
};

export type TenantRecord = {
  readonly profile: OrganizationProfile;
  readonly subscription: TenantSubscription;
  readonly featureFlags: TenantFeatureFlags;
  readonly usage: TenantUsageMetrics;
};

export type OrganizationAdminAuditKind =
  | "organization_update"
  | "brand_change"
  | "feature_flag_change"
  | "capability_change"
  | "subscription_change"
  | "settings_change"
  | "admin_action"
  | "export";

export type OrganizationAdminAuditEvent = {
  readonly id: string;
  readonly at: string;
  readonly kind: OrganizationAdminAuditKind;
  readonly organizationId: string;
  readonly actorLabel: string;
  readonly detail: string;
  readonly metadata?: Readonly<Record<string, string>>;
};

export type OrganizationObservabilityKind =
  | "organization_update"
  | "subscription_change"
  | "feature_toggle"
  | "capability_enable"
  | "capability_disable"
  | "export"
  | "admin_action";

export type OrganizationObservation = {
  readonly id: string;
  readonly kind: OrganizationObservabilityKind;
  readonly at: string;
  readonly organizationId: string;
  readonly detail: string;
  readonly metadata?: Readonly<Record<string, string>>;
};

export type OrganizationConfigExport = {
  readonly exportedAt: string;
  readonly profile: OrganizationProfile;
  readonly subscription: TenantSubscription;
  readonly featureFlags: TenantFeatureFlags;
  readonly brand: unknown;
  readonly capabilities: readonly TenantCapabilityView[];
};
