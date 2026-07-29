"use server";

import { getStudentExperience } from "./orchestrator";

export async function studentExperienceSendMessage(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getStudentExperience().sendMessage(formData, organizationId);
}

export async function studentExperienceUpdateProfile(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getStudentExperience().updateProfile(formData, organizationId);
}
