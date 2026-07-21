"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { resolveSchoolContext } from "@/lib/platform/shared/context";
import {
  assertCanCompose,
  canAnnounceSchoolWide,
  requireComposeAccess,
  requireViewAccess,
} from "./access";
import {
  archiveAnnouncement,
  createAnnouncement,
  duplicateAnnouncement,
} from "./announcements";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { logMeeting } from "./meetings";
import {
  createInAppNotification,
  listInAppNotifications,
  markInAppNotificationRead,
  toNavNotificationShape,
} from "./notifications";
import { logPhoneCall } from "./phone-calls";
import {
  archiveCommunication,
  composeAndSend,
  deleteCommunication,
  duplicateCommunication,
  restoreCommunication,
  saveDraft,
  scheduleCommunication,
  sendCommunication,
} from "./service";
import { renderTemplate } from "./templates";
import { getTemplateById } from "./queries";
import { recordCommunicationActivity } from "./activity";
import type {
  AnnouncementAudience,
  AudienceScope,
  CommunicationType,
  ComposeCommunicationInput,
  TemplateMergeContext,
} from "./types";

function revalidateComms(paths: string[] = []) {
  revalidatePath("/dashboard/communications");
  for (const p of paths) revalidatePath(p);
}

export async function composeMessageAction(formData: FormData) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();

  const type = String(formData.get("type") ?? "email") as CommunicationType;
  const mode = String(formData.get("mode") ?? "send"); // send | draft | schedule
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyText = String(formData.get("body_text") ?? "").trim();
  const bodyHtml = String(formData.get("body_html") ?? "").trim() || null;
  const schoolId = String(formData.get("school_id") ?? "").trim() || null;
  const studentId = String(formData.get("student_id") ?? "").trim() || null;
  const familyId = String(formData.get("family_id") ?? "").trim() || null;
  const templateId = String(formData.get("template_id") ?? "").trim() || null;
  const audienceScope = (String(formData.get("audience_scope") ?? "custom") ||
    "custom") as AudienceScope;
  const scheduledFor = String(formData.get("scheduled_for") ?? "").trim() || null;
  const scheduleRrule = String(formData.get("schedule_rrule") ?? "").trim() || null;
  const recipientName = String(formData.get("recipient_name") ?? "").trim() || null;
  const recipientEmail = String(formData.get("recipient_email") ?? "").trim() || null;
  const recipientPhone = String(formData.get("recipient_phone") ?? "").trim() || null;
  const recipientId = String(formData.get("recipient_id") ?? "").trim() || null;

  if (!subject && !bodyText) {
    return { error: "Subject or body is required." };
  }

  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;

  const input: ComposeCommunicationInput = {
    type,
    subject,
    bodyText,
    bodyHtml,
    schoolId,
    organizationId: schoolCtx?.organizationId,
    studentId,
    familyId,
    templateId,
    audienceScope,
    scheduledFor,
    scheduleRrule,
    recipients: recipientName || recipientEmail || recipientPhone || recipientId
      ? [
          {
            recipientType:
              audienceScope === "guardian"
                ? "guardian"
                : audienceScope === "family"
                  ? "family"
                  : audienceScope === "student"
                    ? "student"
                    : audienceScope === "teacher"
                      ? "teacher"
                      : audienceScope === "employee"
                        ? "employee"
                        : audienceScope === "class"
                          ? "class"
                          : audienceScope === "program"
                            ? "program"
                            : audienceScope === "school"
                              ? "school"
                              : "custom",
            recipientId,
            displayName: recipientName,
            email: recipientEmail,
            phone: recipientPhone,
          },
        ]
      : [],
  };

  let result;
  if (mode === "draft") {
    result = await saveDraft(supabase, input);
  } else if (mode === "schedule") {
    if (!scheduledFor) return { error: "Schedule date/time is required." };
    result = await scheduleCommunication(supabase, {
      ...input,
      scheduledFor,
    });
  } else {
    result = await composeAndSend(supabase, input);
  }

  if (!result.ok) return { error: result.error };

  revalidateComms([
    studentId ? `/dashboard/students/${studentId}` : "",
    familyId ? `/dashboard/families/${familyId}` : "",
  ].filter(Boolean));

  return {
    ok: true as const,
    communicationId: result.communicationId,
    auditId: result.auditId,
    status: result.status,
  };
}

export async function sendCommunicationAction(communicationId: string) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await sendCommunication(supabase, communicationId);
  if (!result.ok) return { error: result.error };
  revalidateComms();
  return result;
}

export async function archiveCommunicationAction(communicationId: string) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await archiveCommunication(supabase, communicationId);
  if (!result.ok) return { error: result.error };
  revalidateComms();
  return { ok: true as const };
}

export async function restoreCommunicationAction(communicationId: string) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await restoreCommunication(supabase, communicationId);
  if (!result.ok) return { error: result.error };
  revalidateComms();
  return { ok: true as const };
}

export async function duplicateCommunicationAction(communicationId: string) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await duplicateCommunication(supabase, communicationId);
  if (!result.ok) return { error: result.error };
  revalidateComms([`/dashboard/communications/${result.communicationId}`]);
  return { ok: true as const, communicationId: result.communicationId };
}

export async function deleteCommunicationAction(input: {
  communicationId: string;
  confirmationText: string;
  acknowledged: boolean;
}) {
  const access = await requireComposeAccess();
  if (!access.ok) return { ok: false as const, error: access.error };
  const supabase = await createAuthClient();
  const result = await deleteCommunication(supabase, input);
  if (!result.ok) return result;
  revalidateComms();
  return { ok: true as const };
}

export async function archiveAnnouncementAction(announcementId: string) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await archiveAnnouncement(supabase, announcementId);
  if (!result.ok) return { error: result.error };
  revalidateComms(["/dashboard/communications/announcements"]);
  return { ok: true as const };
}

export async function duplicateAnnouncementAction(announcementId: string) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await duplicateAnnouncement(supabase, announcementId);
  if (!result.ok) return { error: result.error };
  revalidateComms(["/dashboard/communications/announcements"]);
  return { ok: true as const, announcementId: result.announcementId };
}

export async function archiveTemplateAction(templateId: string) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const { data: row } = await supabase
    .from("platform_communication_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  if (!row) return { error: "Template not found" };
  const { error } = await supabase
    .from("platform_communication_templates")
    .update({ is_active: false })
    .eq("id", templateId);
  if (error) return { error: error.message };
  const { recordCommunicationActivity } = await import("./activity");
  await recordCommunicationActivity(supabase, {
    eventType: "template.archived",
    title: "Template archived",
    summary: row.name,
    entityId: templateId,
    entityType: "communication_template",
    organizationId: row.organization_id,
    schoolId: row.school_id,
  });
  revalidateComms(["/dashboard/communications/templates"]);
  return { ok: true as const };
}

export async function restoreTemplateAction(templateId: string) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const { data: row } = await supabase
    .from("platform_communication_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  if (!row) return { error: "Template not found" };
  const { error } = await supabase
    .from("platform_communication_templates")
    .update({ is_active: true })
    .eq("id", templateId);
  if (error) return { error: error.message };
  const { recordCommunicationActivity } = await import("./activity");
  await recordCommunicationActivity(supabase, {
    eventType: "template.restored",
    title: "Template restored",
    summary: row.name,
    entityId: templateId,
    entityType: "communication_template",
    organizationId: row.organization_id,
    schoolId: row.school_id,
  });
  revalidateComms(["/dashboard/communications/templates"]);
  return { ok: true as const };
}

export async function duplicateTemplateAction(templateId: string) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const { data: row } = await supabase
    .from("platform_communication_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  if (!row) return { error: "Template not found" };
  const { data, error } = await supabase
    .from("platform_communication_templates")
    .insert({
      organization_id: row.organization_id,
      school_id: row.school_id,
      name: `${row.name} (Copy)`,
      template_key: `${row.template_key}_copy_${Date.now()}`,
      channel: row.channel,
      subject: row.subject,
      body_text: row.body_text,
      body_html: row.body_html,
      variables: row.variables,
      is_active: true,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Unable to duplicate template" };
  const { recordCommunicationActivity } = await import("./activity");
  await recordCommunicationActivity(supabase, {
    eventType: "template.duplicated",
    title: "Template duplicated",
    summary: row.name,
    entityId: data.id as string,
    entityType: "communication_template",
    organizationId: row.organization_id,
    schoolId: row.school_id,
    payload: { sourceId: templateId },
  });
  revalidateComms(["/dashboard/communications/templates"]);
  return { ok: true as const, templateId: data.id as string };
}

export async function previewTemplateAction(
  templateId: string,
  context: TemplateMergeContext
) {
  const access = await requireViewAccess();
  if (!access.ok) return { error: access.error };
  const template = await getTemplateById(templateId);
  if (!template) return { error: "Template not found" };
  return { ok: true as const, preview: renderTemplate(template, context) };
}

export async function saveTemplateAction(formData: FormData) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const ctx = await getIdentityContext();
  if (!assertCanCompose(ctx).ok) return { error: "Unauthorized" };

  const supabase = await createAuthClient();
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyText = String(formData.get("body_text") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim() || "general";
  const templateKey =
    String(formData.get("template_key") ?? "").trim() ||
    name.toLowerCase().replace(/\s+/g, "_").slice(0, 60);
  const schoolId = String(formData.get("school_id") ?? "").trim() || null;

  if (!name || !subject) return { error: "Name and subject are required." };

  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;

  const { data, error } = await supabase
    .from("platform_communication_templates")
    .insert({
      organization_id: schoolCtx?.organizationId ?? null,
      school_id: schoolId,
      template_key: templateKey,
      name,
      category,
      subject,
      body_text: bodyText,
      variables: ["StudentName", "GuardianName", "School", "Teacher", "Program"],
      created_by: ctx?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Unable to save template" };

  await recordCommunicationActivity(supabase, {
    eventType: "template.created",
    title: "Template created",
    summary: name,
    entityId: data.id as string,
    entityType: "communication_template",
    organizationId: schoolCtx?.organizationId,
    schoolId,
    actorUserId: ctx?.id,
  });

  revalidateComms(["/dashboard/communications/templates"]);
  return { ok: true as const, templateId: data.id as string };
}

export async function publishAnnouncementAction(formData: FormData) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const ctx = await getIdentityContext();
  const supabase = await createAuthClient();

  const targetAudience = String(
    formData.get("target_audience") ?? "school"
  ) as AnnouncementAudience;
  if (
    (targetAudience === "organization" || targetAudience === "school") &&
    !canAnnounceSchoolWide(ctx)
  ) {
    return { error: "Only CEO / Founder / School Leader can publish school-wide announcements." };
  }

  const result = await createAnnouncement(supabase, {
    title: String(formData.get("title") ?? ""),
    bodyText: String(formData.get("body_text") ?? ""),
    bodyHtml: String(formData.get("body_html") ?? "") || null,
    schoolId: String(formData.get("school_id") ?? "") || null,
    targetAudience,
    programId: String(formData.get("program_id") ?? "") || null,
    classId: String(formData.get("class_id") ?? "") || null,
    scheduledFor: String(formData.get("scheduled_for") ?? "") || null,
    publishNow: formData.get("publish_now") === "true",
  });

  if (!result.ok) return { error: result.error };
  revalidateComms(["/dashboard/communications/announcements"]);
  return result;
}

export async function logPhoneCallAction(formData: FormData) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();

  const result = await logPhoneCall(supabase, {
    direction: formData.get("direction") === "inbound" ? "inbound" : "outbound",
    schoolId: String(formData.get("school_id") ?? "") || null,
    studentId: String(formData.get("student_id") ?? "") || null,
    familyId: String(formData.get("family_id") ?? "") || null,
    durationSeconds: Number(formData.get("duration_seconds") ?? 0) || null,
    notes: String(formData.get("notes") ?? "") || null,
    followUpRequired: formData.get("follow_up_required") === "true",
    outcome: String(formData.get("outcome") ?? "") || null,
    occurredAt: String(formData.get("occurred_at") ?? "") || null,
  });

  if (!result.ok) return { error: result.error };
  revalidateComms();
  return result;
}

export async function logMeetingAction(formData: FormData) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();

  const participantsRaw = String(formData.get("participants") ?? "").trim();
  const participants = participantsRaw
    ? participantsRaw.split(",").map((n) => ({ name: n.trim() })).filter((p) => p.name)
    : [];

  const result = await logMeeting(supabase, {
    title: String(formData.get("title") ?? ""),
    meetingType: (String(formData.get("meeting_type") ?? "parent_conference") ||
      "parent_conference") as "parent_conference" | "iep" | "scholarship" | "staff" | "other",
    schoolId: String(formData.get("school_id") ?? "") || null,
    studentId: String(formData.get("student_id") ?? "") || null,
    familyId: String(formData.get("family_id") ?? "") || null,
    participants,
    notes: String(formData.get("notes") ?? "") || null,
    decisions: String(formData.get("decisions") ?? "") || null,
    actionItems: String(formData.get("action_items") ?? "")
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text })),
    occurredAt: String(formData.get("occurred_at") ?? "") || null,
  });

  if (!result.ok) return { error: result.error };
  revalidateComms();
  return result;
}

export async function getNavNotificationsAction() {
  const ctx = await getIdentityContext();
  if (!ctx) return [];
  const supabase = await createAuthClient();
  const rows = await listInAppNotifications(supabase, ctx.id, 25);
  return rows.map(toNavNotificationShape);
}

export async function markNotificationReadAction(notificationId: string) {
  const ctx = await getIdentityContext();
  if (!ctx) return { error: "Unauthorized" };
  const supabase = await createAuthClient();
  const result = await markInAppNotificationRead(supabase, notificationId, ctx.id);
  if (!result.ok) return { error: result.error };
  return { ok: true as const };
}

export async function createStaffNotificationAction(input: {
  userId: string;
  title: string;
  body?: string;
  category?: string;
  href?: string | null;
  relatedStudentId?: string | null;
  relatedFamilyId?: string | null;
}) {
  const access = await requireComposeAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  return createInAppNotification(supabase, input);
}
