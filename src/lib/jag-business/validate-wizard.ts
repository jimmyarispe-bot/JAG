import { getIndustry } from "@/lib/jag-business/industries";
import { getSubscriptionPlan } from "@/lib/jag-business/plans";
import type { PilotWizardInput } from "@/lib/jag-business/types";

export type WizardValidationResult =
  | { readonly ok: true; readonly data: PilotWizardInput }
  | { readonly ok: false; readonly fieldErrors: Record<string, string> };

export function validatePilotWizard(
  input: Partial<PilotWizardInput>
): WizardValidationResult {
  const fieldErrors: Record<string, string> = {};

  const organizationName = (input.organizationName ?? "").trim();
  if (organizationName.length < 2) {
    fieldErrors.organizationName = "Organization name is required.";
  }

  const industry = (input.industry ?? "").trim();
  if (!getIndustry(industry)) {
    fieldErrors.industry = "Select a valid industry.";
  }

  const country = (input.country ?? "").trim();
  if (country.length < 2) {
    fieldErrors.country = "Country is required.";
  }

  const timeZone = (input.timeZone ?? "").trim();
  if (timeZone.length < 2) {
    fieldErrors.timeZone = "Time zone is required.";
  }

  const planId = (input.planId ?? "").trim();
  if (!getSubscriptionPlan(planId)) {
    fieldErrors.planId = "Select a subscription plan.";
  }

  const firstName = (input.firstName ?? "").trim();
  if (firstName.length < 1) {
    fieldErrors.firstName = "First name is required.";
  }

  const lastName = (input.lastName ?? "").trim();
  if (lastName.length < 1) {
    fieldErrors.lastName = "Last name is required.";
  }

  const email = (input.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  const password = input.password ?? "";
  if (password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters.";
  }

  const passwordConfirmation = input.passwordConfirmation ?? "";
  if (passwordConfirmation !== password) {
    fieldErrors.passwordConfirmation = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      organizationName,
      industry,
      country,
      timeZone,
      planId,
      firstName,
      lastName,
      email,
      password,
      passwordConfirmation,
    },
  };
}
