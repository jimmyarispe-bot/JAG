/**
 * Automatic organization provisioning for Start Your Pilot.
 */

import { getIndustry } from "@/lib/jag-business/industries";
import { getSubscriptionPlan } from "@/lib/jag-business/plans";
import {
  findOrganizationByFounderEmail,
  saveProvisionedOrganization,
} from "@/lib/jag-business/store";
import type {
  PilotWizardInput,
  ProvisionedOrganization,
  ProvisionResult,
} from "@/lib/jag-business/types";
import { validatePilotWizard } from "@/lib/jag-business/validate-wizard";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function provisionOrganization(
  input: Partial<PilotWizardInput>
): ProvisionResult {
  const validation = validatePilotWizard(input);
  if (!validation.ok) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const data = validation.data;
  if (findOrganizationByFounderEmail(data.email)) {
    return {
      ok: false,
      error: "An organization already exists for this founder email.",
      fieldErrors: { email: "This email is already registered as a founder." },
    };
  }

  const plan = getSubscriptionPlan(data.planId)!;
  const industry = getIndustry(data.industry)!;
  const stamp = Date.now().toString(36);
  const orgSlug = slugify(data.organizationName) || "organization";
  const organizationId = `org.${orgSlug}.${stamp}`;
  const userId = `jag-user.${slugify(data.email.split("@")[0] ?? "founder")}.${stamp}`;
  const workspaceId = `workspace.${orgSlug}.${stamp}`;

  const organization: ProvisionedOrganization = {
    organizationId,
    organizationName: data.organizationName,
    industry: industry.id,
    country: data.country,
    timeZone: data.timeZone,
    founder: {
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    },
    subscription: {
      planId: plan.id,
      planName: plan.name,
      status: "pilot",
    },
    workspace: {
      workspaceId,
      name: `${data.organizationName} Workspace`,
    },
    createdAt: new Date().toISOString(),
    settings: {
      locale: "en-US",
      productAvailability: "academyos_only",
    },
  };

  saveProvisionedOrganization(organization);
  return { ok: true, organization };
}
