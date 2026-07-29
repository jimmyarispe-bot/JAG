import type { JagSubscriptionPlanId } from "@/lib/jag-business/plans";
import type { JagIndustryId } from "@/lib/jag-business/industries";

export type PilotWizardInput = {
  readonly organizationName: string;
  readonly industry: JagIndustryId | string;
  readonly country: string;
  readonly timeZone: string;
  readonly planId: JagSubscriptionPlanId | string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
  readonly passwordConfirmation: string;
};

export type ProvisionedFounder = {
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  /** Phase 1 pilot store — replace with hashed credentials later. */
  readonly password: string;
};

export type ProvisionedSubscription = {
  readonly planId: string;
  readonly planName: string;
  readonly status: "pilot" | "active" | "trial";
};

export type ProvisionedWorkspace = {
  readonly workspaceId: string;
  readonly name: string;
};

export type ProvisionedOrganization = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly industry: string;
  readonly country: string;
  readonly timeZone: string;
  readonly founder: ProvisionedFounder;
  readonly subscription: ProvisionedSubscription;
  readonly workspace: ProvisionedWorkspace;
  readonly createdAt: string;
  readonly settings: {
    readonly locale: string;
    readonly productAvailability: "academyos_only";
  };
};

export type ProvisionResult =
  | { readonly ok: true; readonly organization: ProvisionedOrganization }
  | { readonly ok: false; readonly error: string; readonly fieldErrors?: Record<string, string> };
