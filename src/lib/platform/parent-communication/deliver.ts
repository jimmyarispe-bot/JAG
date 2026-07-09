import { createMissionControlItem } from "@/lib/platform/automation/mission-control";
import { writePlatformAudit } from "@/lib/platform/automation/audit";
import { publishEvent } from "@/lib/platform/events/publisher/publish";
import { createPortalNotification } from "@/lib/portal/notifications";
import { logStudentCommunicationEvent } from "@/lib/ssis/timeline";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type ParentCommunicationCategory =
  | "teacher_message"
  | "attendance"
  | "progress"
  | "session_summary"
  | "intervention"
  | "scheduling"
  | "family_reminder";

export interface DeliverParentCommunicationInput {
  studentId: string;
  schoolId?: string | null;
  familyId?: string | null;
  category: ParentCommunicationCategory;
  title: string;
  body: string;
  href?: string;
  channel?: string;
  actorUserId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  metadata?: Record<string, unknown>;
  createFollowUpWork?: boolean;
  followUpTitle?: string;
  followUpHref?: string;
  fireLoopTransition?: boolean;
}

export interface DeliverParentCommunicationResult {
  portalUserIds: string[];
  notificationsSent: number;
}

export async function resolveFamilyPortalUserIds(
  supabase: AuthClient,
  studentId: string
): Promise<{ userIds: string[]; familyId: string | null }> {
  const { data: student } = await supabase
    .from("students")
    .select("family_id")
    .eq("id", studentId)
    .single();

  const familyId = (student?.family_id as string | null) ?? null;
  const userIds = new Set<string>();

  const { data: links } = await supabase
    .from("student_family_link")
    .select("user_id")
    .eq("student_id", studentId);

  for (const link of links ?? []) {
    if (link.user_id) userIds.add(link.user_id);
  }

  if (familyId) {
    const { data: guardians } = await supabase
      .from("guardians")
      .select("user_id")
      .eq("family_id", familyId);

    for (const guardian of guardians ?? []) {
      if (guardian.user_id) userIds.add(guardian.user_id);
    }
  }

  return { userIds: [...userIds], familyId };
}

/** Production parent communication — portal delivery, audit, events, optional follow-up work. */
export async function deliverParentCommunication(
  supabase: AuthClient,
  input: DeliverParentCommunicationInput
): Promise<DeliverParentCommunicationResult> {
  const resolved = await resolveFamilyPortalUserIds(supabase, input.studentId);
  const familyId = input.familyId ?? resolved.familyId;
  const portalUserIds = resolved.userIds;

  await logStudentCommunicationEvent(supabase, {
    studentId: input.studentId,
    schoolId: input.schoolId,
    channel: input.channel ?? "parent_portal",
    direction: "outbound",
    subject: input.title,
    body: input.body,
    actorUserId: input.actorUserId,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    metadata: {
      ...(input.metadata ?? {}),
      category: input.category,
      portalDelivered: portalUserIds.length > 0,
      portalUserIds,
    },
  });

  let notificationsSent = 0;
  for (const userId of portalUserIds) {
    await createPortalNotification(supabase, {
      userId,
      familyId,
      studentId: input.studentId,
      category: input.category,
      title: input.title,
      body: input.body,
      href: input.href,
      metadata: input.metadata,
    });
    notificationsSent += 1;
  }

  await writePlatformAudit(supabase, {
    schoolId: input.schoolId ?? undefined,
    module: "parent_communication",
    entityType: "students",
    entityId: input.studentId,
    actionType: "parent_communication_delivered",
    summary: input.title,
    actorUserId: input.actorUserId ?? undefined,
    metadata: {
      category: input.category,
      portalUserIds,
      notificationsSent,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    },
  });

  await publishEvent(
    {
      eventType: "communication.parent.delivered",
      entityType: "students",
      entityId: input.studentId,
      schoolId: input.schoolId ?? undefined,
      actorId: input.actorUserId ?? undefined,
      payload: {
        category: input.category,
        title: input.title,
        portalUserIds,
        notificationsSent,
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
      },
    },
    { persist: { supabase }, recordAudit: true }
  );

  if (input.createFollowUpWork && input.schoolId) {
    await createMissionControlItem(supabase, {
      schoolId: input.schoolId,
      module: "parent_portal",
      itemType: "pending_task",
      severity: "normal",
      title: input.followUpTitle ?? `Follow up: ${input.title}`,
      body: input.body.slice(0, 500),
      href: input.followUpHref ?? input.href ?? "/dashboard/teacher",
      entityType: "students",
      entityId: input.studentId,
      metadata: { category: input.category, communicationCategory: input.category },
    });
  }

  if (input.fireLoopTransition && input.schoolId) {
    const { fireOperationalLoopTransition } = await import("@/lib/platform/operational-loop");
    await fireOperationalLoopTransition(supabase, {
      studentId: input.studentId,
      schoolId: input.schoolId,
      actorUserId: input.actorUserId ?? undefined,
      transitionKey: "progress_to_parent_communication",
      relatedEntityType: input.relatedEntityType ?? "students",
      relatedEntityId: input.relatedEntityId ?? input.studentId,
      facts: { category: input.category, notificationsSent },
    });
  }

  return { portalUserIds, notificationsSent };
}
