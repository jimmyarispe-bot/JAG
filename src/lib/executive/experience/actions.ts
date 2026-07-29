"use server";

import { getExecutiveExperience } from "./orchestrator";

export async function executiveExperienceUpdateProfile(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getExecutiveExperience().updateProfile(formData, organizationId);
}
