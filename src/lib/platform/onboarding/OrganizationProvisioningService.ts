/**
 * Sprint 212 — Create the organization record from an onboarding session.
 */

import { getIndustry } from "@/lib/jag-business/industries";
import { getSubscriptionPlan } from "@/lib/jag-business/plans";
import {
  findOrganizationByFounderEmail,
  saveProvisionedOrganization,
} from "@/lib/jag-business/store";
import type { ProvisionedOrganization } from "@/lib/jag-business/types";
import { recordOnboardingObservation } from "./OnboardingObservability";
import type { OnboardingSession } from "./types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export type OrganizationProvisionOutcome =
  | { readonly ok: true; readonly organization: ProvisionedOrganization }
  | { readonly ok: false; readonly error: string };

export const OrganizationProvisioningService = {
  validateOrganizationDraft(session: OnboardingSession): string | null {
    if (!session.organization.organizationName.trim()) {
      return "Organization name is required.";
    }
    if (!session.organization.subdomain.trim()) {
      return "Subdomain is required.";
    }
    if (!/^[a-z0-9]([a-z0-9-]{0,46}[a-z0-9])?$/.test(session.organization.subdomain)) {
      return "Subdomain must be lowercase alphanumeric with optional hyphens.";
    }
    if (!session.organization.industry.trim()) {
      return "Industry is required.";
    }
    if (!session.organization.timezone.trim()) {
      return "Timezone is required.";
    }
    return null;
  },

  provisionFromSession(
    session: OnboardingSession,
    options?: { readonly passwordPlaceholder?: string }
  ): OrganizationProvisionOutcome {
    const validationError = this.validateOrganizationDraft(session);
    if (validationError) {
      recordOnboardingObservation({
        kind: "validation_failure",
        sessionId: session.id,
        stepId: "organization",
        detail: validationError,
      });
      return { ok: false, error: validationError };
    }

    const existing = findOrganizationByFounderEmail(session.ownerEmail);
    if (existing) {
      // Resume path — reuse existing org for this founder.
      recordOnboardingObservation({
        kind: "provisioning",
        sessionId: session.id,
        detail: `Reusing existing organization ${existing.organizationId}`,
        metadata: { organizationId: existing.organizationId },
      });
      return { ok: true, organization: existing };
    }

    const industry = getIndustry(session.organization.industry) ?? getIndustry("education")!;
    const plan = getSubscriptionPlan("starter");
    const stamp = Date.now().toString(36);
    const orgSlug =
      session.organization.subdomain ||
      slugify(session.organization.organizationName) ||
      "organization";
    const organizationId = `org.${orgSlug}.${stamp}`;
    const founder = session.executives.find((e) => e.role === "founder") ??
      session.executives[0];
    const nameParts = (founder?.name || session.ownerEmail).trim().split(/\s+/);
    const firstName = nameParts[0] || "Founder";
    const lastName = nameParts.slice(1).join(" ") || "Executive";

    const organization: ProvisionedOrganization = {
      organizationId,
      organizationName: session.organization.organizationName.trim(),
      industry: industry.id,
      country: session.organization.country || "US",
      timeZone: session.organization.timezone,
      founder: {
        userId: session.ownerUserId,
        firstName,
        lastName,
        email: session.ownerEmail,
        password: options?.passwordPlaceholder ?? `onboarding-${stamp}`,
      },
      subscription: {
        planId: plan?.id ?? "pilot",
        planName: plan?.name ?? "Pilot",
        status: "pilot",
      },
      workspace: {
        workspaceId: `workspace.${orgSlug}.${stamp}`,
        name: `${session.organization.organizationName.trim()} Executive Workspace`,
      },
      createdAt: new Date().toISOString(),
      settings: {
        locale: "en-US",
        productAvailability: "academyos_only",
      },
    };

    saveProvisionedOrganization(organization);
    recordOnboardingObservation({
      kind: "provisioning",
      sessionId: session.id,
      detail: `Provisioned organization ${organization.organizationId}`,
      metadata: { organizationId: organization.organizationId, subdomain: orgSlug },
    });

    return { ok: true, organization };
  },
};
