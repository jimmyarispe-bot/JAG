"use server";

import { getSchoolLeaderExperience } from "./orchestrator";

export async function schoolLeaderExperienceUpdateProfile(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getSchoolLeaderExperience().updateProfile(formData, organizationId);
}
