/**
 * Sprint 213 — Subscription placeholder (no payment integration).
 */

import { getSubscriptionPlan, JAG_SUBSCRIPTION_PLANS } from "@/lib/jag-business/plans";
import { defaultSubscription } from "./defaults";
import { recordOrganizationAdminAudit } from "./OrganizationObservability";
import { TenantRegistry } from "./TenantRegistry";
import type {
  BillingProviderId,
  SubscriptionStatus,
  TenantSubscription,
} from "./types";

export const SubscriptionService = {
  listPlans() {
    return JAG_SUBSCRIPTION_PLANS;
  },

  getSubscription(organizationId: string): TenantSubscription | null {
    return TenantRegistry.get(organizationId)?.subscription ?? null;
  },

  updateSubscription(
    organizationId: string,
    patch: Partial<{
      planId: string;
      status: SubscriptionStatus;
      seats: number;
      seatLimit: number;
      renewalAt: string | null;
      billingProvider: BillingProviderId;
    }>,
    actorLabel = "system"
  ): TenantSubscription | null {
    const record = TenantRegistry.get(organizationId);
    if (!record) return null;

    let subscription = { ...record.subscription };
    if (patch.planId) {
      const plan = getSubscriptionPlan(patch.planId);
      if (!plan) throw new Error(`Unknown plan: ${patch.planId}`);
      const defaults = defaultSubscription(organizationId, plan.id);
      subscription = {
        ...subscription,
        planId: plan.id,
        planName: plan.name,
        seatLimit: patch.seatLimit ?? defaults.seatLimit,
        limits: defaults.limits,
      };
    }
    if (patch.status) subscription = { ...subscription, status: patch.status };
    if (typeof patch.seats === "number") {
      subscription = { ...subscription, seats: patch.seats };
    }
    if (typeof patch.seatLimit === "number") {
      subscription = { ...subscription, seatLimit: patch.seatLimit };
    }
    if (patch.renewalAt !== undefined) {
      subscription = { ...subscription, renewalAt: patch.renewalAt };
    }
    if (patch.billingProvider) {
      subscription = {
        ...subscription,
        billingProvider: patch.billingProvider,
      };
    }
    subscription = { ...subscription, updatedAt: new Date().toISOString() };

    TenantRegistry.upsert({ ...record, subscription });
    recordOrganizationAdminAudit({
      kind: "subscription_change",
      organizationId,
      actorLabel,
      detail: `Subscription updated (${subscription.planName} / ${subscription.status})`,
      metadata: {
        planId: subscription.planId,
        status: subscription.status,
        billingProvider: subscription.billingProvider,
      },
    });
    return subscription;
  },

  /** Billing provider abstraction — no charge/payment yet. */
  describeBillingProvider(provider: BillingProviderId): string {
    switch (provider) {
      case "stripe":
        return "Stripe (not connected)";
      case "manual":
        return "Manual invoice";
      default:
        return "No billing provider configured";
    }
  },
};
