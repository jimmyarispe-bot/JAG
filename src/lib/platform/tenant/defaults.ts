/**
 * Sprint 213 — Default tenant records.
 */

import { getSubscriptionPlan } from "@/lib/jag-business/plans";
import type {
  OrganizationProfile,
  TenantFeatureFlags,
  TenantRecord,
  TenantSubscription,
  TenantUsageMetrics,
} from "./types";

export const DEFAULT_FEATURE_FLAGS: TenantFeatureFlags = Object.freeze({
  "jag.intelligence.predictive": true,
  "jag.intelligence.conversation": true,
  "jag.intelligence.memory": true,
  "jag.intelligence.strategy": true,
  "jag.intelligence.watchers": true,
  "jag.decisions.center": true,
  "jag.intelligence.briefings": true,
  "jag.intelligence.explainability": true,
});

function emptyContact(email = "") {
  return { name: "", email, phone: "" };
}

export function defaultUsage(organizationId: string): TenantUsageMetrics {
  return {
    organizationId,
    executiveUsers: 1,
    organizations: 1,
    apiUsage: 0,
    storageGb: 0.1,
    documents: 0,
    briefingsGenerated: 0,
    watcherAlerts: 0,
    conversationSessions: 0,
    forecastsCreated: 0,
    measuredAt: new Date().toISOString(),
  };
}

export function defaultSubscription(
  organizationId: string,
  planId = "starter"
): TenantSubscription {
  const plan = getSubscriptionPlan(planId) ?? getSubscriptionPlan("starter")!;
  const renewal = new Date();
  renewal.setMonth(renewal.getMonth() + 1);
  return {
    organizationId,
    planId: plan.id,
    planName: plan.name,
    status: "trial",
    renewalAt: renewal.toISOString(),
    seats: 1,
    seatLimit: plan.id === "enterprise" ? 500 : plan.id === "professional" ? 50 : 10,
    limits: {
      apiCallsPerMonth: plan.id === "enterprise" ? 1_000_000 : 50_000,
      storageGb: plan.id === "enterprise" ? 1000 : 50,
      documents: plan.id === "enterprise" ? 100_000 : 5_000,
      briefingsPerMonth: plan.id === "enterprise" ? 10_000 : 200,
    },
    billingProvider: "none",
    updatedAt: new Date().toISOString(),
  };
}

export function createTenantRecord(input: {
  organizationId: string;
  organizationName: string;
  subdomain: string;
  industry?: string;
  timezone?: string;
  legalName?: string;
  primaryEmail?: string;
}): TenantRecord {
  const at = new Date().toISOString();
  const email = input.primaryEmail ?? "";
  const profile: OrganizationProfile = {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    legalName: input.legalName ?? input.organizationName,
    industry: input.industry ?? "education",
    timezone: input.timezone ?? "America/New_York",
    subdomain: input.subdomain.toLowerCase(),
    status: "active",
    primaryContact: { ...emptyContact(email), name: input.organizationName },
    executiveContact: emptyContact(email),
    supportContact: emptyContact(email),
    customDomain: null,
    createdAt: at,
    updatedAt: at,
  };

  return {
    profile,
    subscription: defaultSubscription(input.organizationId),
    featureFlags: { ...DEFAULT_FEATURE_FLAGS },
    usage: defaultUsage(input.organizationId),
  };
}
