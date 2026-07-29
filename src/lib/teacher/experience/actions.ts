"use server";

import { getTeacherExperience } from "./orchestrator";

export async function teacherExperienceTakeAttendance(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getTeacherExperience().takeAttendance(formData, organizationId);
}

export async function teacherExperienceStartLesson(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getTeacherExperience().startLesson(formData, organizationId);
}

export async function teacherExperienceCompleteSession(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getTeacherExperience().completeSession(formData, organizationId);
}

export async function teacherExperienceUpdateProfile(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getTeacherExperience().updateProfile(formData, organizationId);
}
