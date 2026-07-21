import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordCommunicationActivity } from "./activity";
import { channelForCommunicationType, getAdapterForChannel } from "./providers";
import type {
  ComposeCommunicationInput,
  CommunicationRow,
  CommunicationStatus,
} from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type CommunicationResult =
  | { ok: true; communicationId: string; auditId: string; status: CommunicationStatus }
  | { ok: false; error: string };

async function loadCommunication(
  supabase: AuthClient,
  id: string
): Promise<CommunicationRow | null> {
  const { data } = await supabase
    .from("platform_communications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as CommunicationRow | null) ?? null;
}

export async function composeCommunication(
  supabase: AuthClient,
  input: ComposeCommunicationInput
): Promise<CommunicationResult> {
  const actorUserId = await resolveActorUserId(supabase);
  const schoolCtx = input.schoolId
    ? await resolveSchoolContext(supabase, input.schoolId)
    : null;

  const status: CommunicationStatus =
    input.status ?? (input.scheduledFor ? "scheduled" : "draft");

  const { data: actor } = actorUserId
    ? await supabase.from("users").select("full_name").eq("id", actorUserId).maybeSingle()
    : { data: null };

  const { data, error } = await supabase
    .from("platform_communications")
    .insert({
      organization_id: input.organizationId ?? schoolCtx?.organizationId ?? null,
      school_id: input.schoolId ?? null,
      type: input.type,
      direction: input.direction ?? "outbound",
      priority: input.priority ?? "normal",
      status,
      subject: input.subject ?? null,
      body_text: input.bodyText ?? null,
      body_html: input.bodyHtml ?? null,
      sender_user_id: actorUserId,
      sender_display_name: actor?.full_name ?? null,
      student_id: input.studentId ?? null,
      family_id: input.familyId ?? null,
      template_id: input.templateId ?? null,
      audience_scope: input.audienceScope ?? null,
      scheduled_for: input.scheduledFor ?? null,
      schedule_rrule: input.scheduleRrule ?? null,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
      created_by: actorUserId,
    })
    .select("id, audit_id, status")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Unable to create communication" };
  }

  const communicationId = data.id as string;
  const auditId = data.audit_id as string;

  if (input.recipients?.length) {
    await supabase.from("platform_communication_recipients").insert(
      input.recipients.map((r) => ({
        communication_id: communicationId,
        recipient_type: r.recipientType,
        recipient_id: r.recipientId ?? null,
        display_name: r.displayName ?? null,
        email: r.email ?? null,
        phone: r.phone ?? null,
      }))
    );
  }

  if (input.attachments?.length) {
    await supabase.from("platform_communication_attachments").insert(
      input.attachments.map((a) => ({
        communication_id: communicationId,
        file_name: a.fileName,
        file_url: a.fileUrl,
        mime_type: a.mimeType ?? null,
        size_bytes: a.sizeBytes ?? null,
        version: a.version ?? 1,
        created_by: actorUserId,
      }))
    );
  }

  if (input.templateId) {
    const { data: tmpl } = await supabase
      .from("platform_communication_templates")
      .select("usage_count")
      .eq("id", input.templateId)
      .maybeSingle();
    if (tmpl) {
      await supabase
        .from("platform_communication_templates")
        .update({ usage_count: (tmpl.usage_count ?? 0) + 1 })
        .eq("id", input.templateId);
    }
    await recordCommunicationActivity(supabase, {
      eventType: "template.used",
      title: "Template used",
      entityId: input.templateId,
      entityType: "communication_template",
      organizationId: input.organizationId ?? schoolCtx?.organizationId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      familyId: input.familyId,
      actorUserId,
      payload: { communicationId },
    });
  }

  await recordCommunicationActivity(supabase, {
    eventType: "communication.created",
    title: status === "draft" ? "Communication draft saved" : "Communication created",
    summary: input.subject,
    entityId: communicationId,
    organizationId: input.organizationId ?? schoolCtx?.organizationId,
    schoolId: input.schoolId,
    studentId: input.studentId,
    familyId: input.familyId,
    actorUserId,
    payload: { auditId, status, type: input.type },
  });

  return {
    ok: true,
    communicationId,
    auditId,
    status: data.status as CommunicationStatus,
  };
}

export async function saveDraft(
  supabase: AuthClient,
  input: ComposeCommunicationInput
): Promise<CommunicationResult> {
  return composeCommunication(supabase, { ...input, status: "draft" });
}

export async function scheduleCommunication(
  supabase: AuthClient,
  input: ComposeCommunicationInput & { scheduledFor: string }
): Promise<CommunicationResult> {
  if (!input.scheduledFor) {
    return { ok: false, error: "scheduledFor is required" };
  }
  return composeCommunication(supabase, {
    ...input,
    status: "scheduled",
    scheduledFor: input.scheduledFor,
  });
}

/**
 * Mark a communication as sent and invoke provider adapters (stubs for external).
 * Does not break if external providers are unconfigured.
 */
export async function sendCommunication(
  supabase: AuthClient,
  communicationId: string
): Promise<CommunicationResult> {
  const row = await loadCommunication(supabase, communicationId);
  if (!row) return { ok: false, error: "Communication not found" };
  if (row.status === "archived") {
    return { ok: false, error: "Archived communications cannot be sent" };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const channel = channelForCommunicationType(row.type);

  let failureReason: string | null = null;
  if (channel) {
    const adapter = getAdapterForChannel(channel);
    const { data: recipients } = await supabase
      .from("platform_communication_recipients")
      .select("email, phone, recipient_id, display_name")
      .eq("communication_id", communicationId);

    const result = await adapter.send({
      channel,
      to: (recipients ?? []).map((r) => ({
        email: r.email,
        phone: r.phone,
        userId: r.recipient_id,
        name: r.display_name,
      })),
      subject: row.subject,
      bodyText: row.body_text,
      bodyHtml: row.body_html,
      metadata: { communicationId, auditId: row.audit_id },
    });

    // Deferred adapters still count as "sent" in AcademyOS (queued for future provider).
    if (!result.ok) {
      failureReason = result.message;
    }
  }

  if (failureReason) {
    await supabase
      .from("platform_communications")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        failure_reason: failureReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", communicationId);

    await recordCommunicationActivity(supabase, {
      eventType: "communication.failed",
      title: "Communication failed",
      summary: row.subject,
      entityId: communicationId,
      organizationId: row.organization_id,
      schoolId: row.school_id,
      studentId: row.student_id,
      familyId: row.family_id,
      actorUserId,
      payload: { auditId: row.audit_id, failureReason },
    });

    return { ok: false, error: failureReason };
  }

  const now = new Date().toISOString();
  await supabase
    .from("platform_communications")
    .update({
      status: "sent",
      sent_at: now,
      updated_at: now,
    })
    .eq("id", communicationId);

  await supabase
    .from("platform_communication_recipients")
    .update({ delivery_status: "sent" })
    .eq("communication_id", communicationId);

  await recordCommunicationActivity(supabase, {
    eventType: "communication.sent",
    title: "Communication sent",
    summary: row.subject,
    entityId: communicationId,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    studentId: row.student_id,
    familyId: row.family_id,
    actorUserId,
    payload: { auditId: row.audit_id, type: row.type },
  });

  return {
    ok: true,
    communicationId,
    auditId: row.audit_id,
    status: "sent",
  };
}

/** Compose + send in one step (or schedule if scheduledFor provided). */
export async function composeAndSend(
  supabase: AuthClient,
  input: ComposeCommunicationInput
): Promise<CommunicationResult> {
  if (input.scheduledFor) {
    return scheduleCommunication(supabase, {
      ...input,
      scheduledFor: input.scheduledFor,
    });
  }

  const created = await composeCommunication(supabase, {
    ...input,
    status: "queued",
  });
  if (!created.ok) return created;
  return sendCommunication(supabase, created.communicationId);
}

export async function markCommunicationRead(
  supabase: AuthClient,
  communicationId: string
): Promise<CommunicationResult> {
  const row = await loadCommunication(supabase, communicationId);
  if (!row) return { ok: false, error: "Communication not found" };

  const now = new Date().toISOString();
  await supabase
    .from("platform_communications")
    .update({ status: "read", read_at: now, updated_at: now })
    .eq("id", communicationId);

  await recordCommunicationActivity(supabase, {
    eventType: "communication.read",
    title: "Communication read",
    summary: row.subject,
    entityId: communicationId,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    studentId: row.student_id,
    familyId: row.family_id,
    payload: { auditId: row.audit_id },
  });

  return {
    ok: true,
    communicationId,
    auditId: row.audit_id,
    status: "read",
  };
}

export async function archiveCommunication(
  supabase: AuthClient,
  communicationId: string
): Promise<CommunicationResult> {
  const row = await loadCommunication(supabase, communicationId);
  if (!row) return { ok: false, error: "Communication not found" };

  const actorUserId = await resolveActorUserId(supabase);
  const now = new Date().toISOString();
  await supabase
    .from("platform_communications")
    .update({ status: "archived", archived_at: now, updated_at: now })
    .eq("id", communicationId);

  await recordCommunicationActivity(supabase, {
    eventType: "communication.archived",
    title: "Communication archived",
    summary: row.subject,
    entityId: communicationId,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    studentId: row.student_id,
    familyId: row.family_id,
    actorUserId,
    payload: { auditId: row.audit_id },
  });

  return {
    ok: true,
    communicationId,
    auditId: row.audit_id,
    status: "archived",
  };
}

export async function restoreCommunication(
  supabase: AuthClient,
  communicationId: string
): Promise<CommunicationResult> {
  const row = await loadCommunication(supabase, communicationId);
  if (!row) return { ok: false, error: "Communication not found" };
  if (row.status !== "archived") {
    return { ok: false, error: "Communication is not archived" };
  }

  const restoredStatus: CommunicationStatus = row.sent_at
    ? "sent"
    : row.scheduled_for
      ? "scheduled"
      : "draft";
  const actorUserId = await resolveActorUserId(supabase);
  const now = new Date().toISOString();
  await supabase
    .from("platform_communications")
    .update({ status: restoredStatus, archived_at: null, updated_at: now })
    .eq("id", communicationId);

  await recordCommunicationActivity(supabase, {
    eventType: "communication.restored",
    title: "Communication restored",
    summary: row.subject,
    entityId: communicationId,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    studentId: row.student_id,
    familyId: row.family_id,
    actorUserId,
    payload: { auditId: row.audit_id, status: restoredStatus },
  });

  return {
    ok: true,
    communicationId,
    auditId: row.audit_id,
    status: restoredStatus,
  };
}

export async function duplicateCommunication(
  supabase: AuthClient,
  communicationId: string
): Promise<CommunicationResult> {
  const row = await loadCommunication(supabase, communicationId);
  if (!row) return { ok: false, error: "Communication not found" };

  const result = await composeCommunication(supabase, {
    type: row.type,
    direction: row.direction,
    subject: row.subject ? `${row.subject} (Copy)` : "(Copy)",
    bodyText: row.body_text,
    bodyHtml: row.body_html,
    schoolId: row.school_id,
    organizationId: row.organization_id,
    studentId: row.student_id,
    familyId: row.family_id,
    priority: row.priority,
    status: "draft",
  });

  if (result.ok) {
    await recordCommunicationActivity(supabase, {
      eventType: "communication.duplicated",
      title: "Communication duplicated",
      summary: row.subject,
      entityId: result.communicationId,
      organizationId: row.organization_id,
      schoolId: row.school_id,
      studentId: row.student_id,
      familyId: row.family_id,
      payload: { sourceId: communicationId, auditId: result.auditId },
    });
  }
  return result;
}

/**
 * Hard-delete only drafts/failed messages with no sent trail.
 * Otherwise prefer archive.
 */
export async function deleteCommunication(
  supabase: AuthClient,
  input: {
    communicationId: string;
    confirmationText: string;
    acknowledged: boolean;
  }
): Promise<CommunicationResult | { ok: false; error: string; code: string; suggestArchive?: boolean }> {
  const { validateDeleteConfirmation } = await import("@/lib/platform/crud");
  const confirmation = validateDeleteConfirmation(input);
  if (!confirmation.ok) {
    return { ok: false, error: confirmation.error, code: confirmation.code };
  }

  const row = await loadCommunication(supabase, input.communicationId);
  if (!row) return { ok: false, error: "Communication not found", code: "not_found" };

  const canHardDelete =
    (row.status === "draft" || row.status === "failed") && !row.sent_at && !row.delivered_at;
  if (!canHardDelete) {
    return {
      ok: false,
      error: "Only draft or failed (unsent) communications can be permanently deleted. Archive instead.",
      code: "has_dependencies",
      suggestArchive: true,
    };
  }

  const actorUserId = await resolveActorUserId(supabase);
  await supabase.from("platform_communication_recipients").delete().eq("communication_id", row.id);
  await supabase.from("platform_communications").delete().eq("id", row.id);

  await recordCommunicationActivity(supabase, {
    eventType: "communication.deleted",
    title: "Communication deleted",
    summary: row.subject,
    entityId: row.id,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    studentId: row.student_id,
    familyId: row.family_id,
    actorUserId,
    payload: { auditId: row.audit_id },
  });

  return {
    ok: true,
    communicationId: row.id,
    auditId: row.audit_id,
    status: "archived",
  };
}

export { loadCommunication };
