"use server";

/**
 * Server actions for Admissions Experience — delegates to orchestrator / existing services.
 */

import { getAdmissionsExperience } from "./orchestrator";

export async function experienceSubmitInterest(formData: FormData) {
  return getAdmissionsExperience().submitInterest(formData);
}

export async function experienceRequestDiscoveryCall(formData: FormData) {
  return getAdmissionsExperience().requestDiscoveryCall(formData);
}

export async function experienceRequestAssessment(formData: FormData) {
  return getAdmissionsExperience().requestAssessment(formData);
}

export async function experienceSaveApplicationDraft(formData: FormData) {
  return getAdmissionsExperience().saveApplicationDraft(formData);
}

export async function experienceSubmitApplication(applicationId: string) {
  return getAdmissionsExperience().submitApplication(applicationId);
}

export async function experienceUploadDocument(formData: FormData) {
  const file = formData.get("file");
  let fileContentBase64: string | null = null;
  if (file instanceof File) {
    const buf = Buffer.from(await file.arrayBuffer());
    fileContentBase64 = buf.toString("base64");
  }
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  const userId = String(formData.get("user_id") ?? "") || null;
  return getAdmissionsExperience().uploadDocument(formData, {
    organizationId,
    userId,
    fileContentBase64,
  });
}

export async function experienceGenerateOffer(
  applicationId: string,
  leadId: string
) {
  return getAdmissionsExperience().generateOffer(applicationId, leadId);
}

export async function experienceSignContract(formData: FormData) {
  return getAdmissionsExperience().signContract(formData);
}

export async function experienceSaveScholarship(formData: FormData) {
  return getAdmissionsExperience().saveScholarship(formData);
}

export async function experienceScheduleInterview(formData: FormData) {
  return getAdmissionsExperience().scheduleStaffInterview(formData);
}

export async function experienceScheduleTour(formData: FormData) {
  return getAdmissionsExperience().scheduleStaffTour(formData);
}
