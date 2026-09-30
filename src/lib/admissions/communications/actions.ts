"use server";

import { revalidatePath } from "next/cache";
import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import {
  processCommunicationQueue,
  triggerCommunications,
} from "@/lib/admissions/communications/engine";
import type { CommunicationTriggerEvent } from "@/lib/admissions/communications/types";
import { renderTemplate, type MergeContext } from "@/lib/admissions/communications/merge-fields";
import { sendTransactionalEmail } from "@/lib/platform/email";

async function requireAdmissionsManage() {
  return assertAnyPermission("admissions.manage", "admissions.accept");
}

export async function runCommunicationQueueProcessor() {
  const auth = await requireAdmissionsManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  await processCommunicationQueue(supabase);
  return { success: true };
}

export async function fireCommunicationTrigger(input: {
  leadId: string;
  applicationId?: string | null;
  triggerEvent: CommunicationTriggerEvent;
  mergeOverrides?: Partial<MergeContext>;
}) {
  const auth = await requireAdmissionsManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await triggerCommunications(supabase, {
    leadId: input.leadId,
    applicationId: input.applicationId,
    triggerEvent: input.triggerEvent,
    mergeOverrides: input.mergeOverrides,
    sentBy: user?.id ?? null,
  });

  await processCommunicationQueue(supabase);

  revalidatePath(`/dashboard/admissions/leads/${input.leadId}`);
  return { success: true };
}

export async function resendCommunication(formData: FormData) {
  const auth = await requireAdmissionsManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const communicationId = formData.get("communication_id") as string;
  const leadId = formData.get("lead_id") as string;
  const customSubject = (formData.get("subject") as string) || null;
  const customBody = (formData.get("body") as string) || null;

  const { data: original } = await supabase
    .from("admissions_communications")
    .select(
      "subject, body, communication_type, sent_to, application_id, template_id, template_key, trigger_event"
    )
    .eq("id", communicationId)
    .single();

  if (!original) return { error: "Communication not found" };

  const subject = customSubject ?? original.subject;
  const body = customBody ?? original.body;
  let deliveryStatus = "sent";
  if (original.communication_type === "email" && original.sent_to) {
    /*
     * THE SENDER HAS TO BE THE SCHOOL, not the platform default.
     *
     * This call used to pass only { to, subject, body }, so a re-sent message
     * left as EMAIL_FROM - noreply@theacademyway.org - while every other
     * admissions email goes out as the campus. That is worse than untidy: the
     * letter it re-sends ends with "reply to this email and it will reach
     * <contact> directly", and a reply to noreply@ reaches nobody. The
     * original send resolves this in engine.ts; the resend path never did.
     *
     * Read from the lead's school rather than from the original row, because
     * the original row does not record who it was sent AS - only that it was
     * sent. A campus that has since been given its own address should re-send
     * from the address it has now.
     */
    const { data: senderRow } = await supabase
      .from("admissions_leads")
      .select("schools(name, admissions_from_email, admissions_contact_name, admissions_contact_email)")
      .eq("id", leadId)
      .maybeSingle();

    const school = (senderRow as unknown as {
      schools?: {
        name?: string | null;
        admissions_from_email?: string | null;
        admissions_contact_name?: string | null;
        admissions_contact_email?: string | null;
      } | null;
    } | null)?.schools;

    const contactName = school?.admissions_contact_name?.trim();
    const schoolName = school?.name?.trim();

    /*
     * Absent, not defaulted. An unset campus falls through to EMAIL_FROM in
     * one place rather than two, and an address on a domain Resend has not
     * verified is rejected outright - so null is the safe state.
     */
    const from = school?.admissions_from_email?.trim() || undefined;
    const fromName =
      contactName && schoolName
        ? `${contactName} · ${schoolName}`
        : contactName || schoolName || undefined;
    const replyTo = school?.admissions_contact_email?.trim() || undefined;

    const emailResult = await sendTransactionalEmail({
      to: original.sent_to,
      subject,
      body,
      ...(from ? { from } : {}),
      ...(fromName ? { fromName } : {}),
      ...(replyTo ? { replyTo } : {}),
    });
    deliveryStatus = emailResult.success ? "sent" : "failed";
  } else if (original.communication_type === "sms") {
    deliveryStatus = "failed";
  }

  const { error } = await supabase.from("admissions_communications").insert({
    lead_id: leadId,
    application_id: original.application_id,
    communication_type: original.communication_type,
    subject,
    body,
    sent_to: original.sent_to,
    sent_by: user?.id ?? null,
    template_id: original.template_id,
    template_key: original.template_key,
    trigger_event: original.trigger_event,
    delivery_status: deliveryStatus,
    open_status: "unknown",
    metadata: { resent_from: communicationId },
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/admissions/leads/${leadId}`);
  return { success: true };
}

export async function sendManualCommunication(formData: FormData) {
  const auth = await requireAdmissionsManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const leadId = formData.get("lead_id") as string;
  const applicationId = (formData.get("application_id") as string) || null;
  const channel = formData.get("channel") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const sentTo = formData.get("sent_to") as string;

  let deliveryStatus = channel === "portal_notification" ? "sent" : "pending";
  if (channel === "email" && sentTo) {
    const emailResult = await sendTransactionalEmail({ to: sentTo, subject, body });
    deliveryStatus = emailResult.success ? "sent" : "failed";
  } else if (channel === "sms") {
    deliveryStatus = "failed";
  }

  const { error } = await supabase.from("admissions_communications").insert({
    lead_id: leadId,
    application_id: applicationId,
    communication_type: channel,
    subject,
    body,
    sent_to: sentTo,
    sent_by: user?.id ?? null,
    delivery_status: deliveryStatus,
    open_status: "unknown",
    trigger_event: "manual",
  });

  if (error) return { error: error.message };

  if (channel === "portal_notification") {
    await supabase.from("admissions_portal_notifications").insert({
      lead_id: leadId,
      application_id: applicationId,
      title: subject,
      body,
    });
  }

  revalidatePath(`/dashboard/admissions/leads/${leadId}`);
  return { success: true };
}

export async function updateCommunicationTemplate(formData: FormData) {
  const auth = await assertAnyPermission("admissions.manage", "admissions.accept");
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("admissions_communication_templates")
    .update({
      name: formData.get("name") as string,
      subject: formData.get("subject") as string,
      body: formData.get("body") as string,
      delay_hours: Number(formData.get("delay_hours")) || 0,
      is_active: formData.get("is_active") !== "false",
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admissions/communications");
  return { success: true };
}

export async function customizeQueuedCommunication(formData: FormData) {
  const auth = await requireAdmissionsManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const queueId = formData.get("queue_id") as string;
  const leadId = formData.get("lead_id") as string;

  const { error } = await supabase
    .from("admissions_communication_queue")
    .update({
      custom_subject: (formData.get("subject") as string) || null,
      custom_body: (formData.get("body") as string) || null,
    })
    .eq("id", queueId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/admissions/leads/${leadId}`);
  return { success: true };
}

export async function cancelQueuedCommunication(queueId: string, leadId: string) {
  const auth = await requireAdmissionsManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  const { error } = await supabase
    .from("admissions_communication_queue")
    .update({ status: "cancelled" })
    .eq("id", queueId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/admissions/leads/${leadId}`);
  return { success: true };
}

export async function markStaffNotificationRead(notificationId: string) {
  const auth = await requireAdmissionsManage();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;
  await supabase
    .from("admissions_staff_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function previewTemplateMerge(formData: FormData) {
  // Read-only preview — view permission remains valid.
  const auth = await assertAnyPermission(
    "admissions.manage",
    "admissions.accept",
    "admissions.view"
  );
  if ("error" in auth) return { error: auth.error };

  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const sampleContext: MergeContext = {
    studentFirstName: "Alex",
    studentLastName: "Johnson",
    guardianFirstName: "Maria",
    guardianLastName: "Johnson",
    guardianEmail: "maria@example.com",
    schoolName: "The Academy Way",
    program: "academy_virtual",
    campusName: "Virtual Campus",
    applicationId: "sample-id",
    leadId: "sample-lead",
  };

  return {
    subject: renderTemplate(subject, sampleContext),
    body: renderTemplate(body, sampleContext),
  };
}
