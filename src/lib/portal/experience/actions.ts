"use server";

import { getParentExperience } from "./orchestrator";

export async function experienceSendMessage(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getParentExperience().sendMessage(formData, organizationId);
}

export async function experienceSubmitForm(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getParentExperience().signForm(formData, organizationId);
}

export async function experienceUpdateProfile(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getParentExperience().updateProfile(formData, organizationId);
}

export async function experienceScheduleMeeting(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "") || null;
  return getParentExperience().scheduleMeeting(formData, organizationId);
}

export async function experienceOpenSupportTicket(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "default");
  const subject = String(formData.get("subject") ?? "Support request");
  const actorUserId = String(formData.get("user_id") ?? "") || null;
  getParentExperience().publishSupportTicket({
    organizationId,
    actorUserId,
    subject,
  });
  // Route operational follow-up through messaging / conferences — no parallel ticket engine.
  return { success: true as const, routedTo: "/portal/messages" };
}

export async function experienceRequestExcuse(formData: FormData) {
  const organizationId = String(formData.get("organization_id") ?? "default");
  const studentId = String(formData.get("student_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const actorUserId = String(formData.get("user_id") ?? "") || null;
  if (!studentId || !date) return { error: "student_id and date are required" };
  getParentExperience().publishExcuseRequest({
    organizationId,
    actorUserId,
    studentId,
    date,
  });
  return { success: true as const };
}
