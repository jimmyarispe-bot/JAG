import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type HcmActivityEvent =
  | "employee.created"
  | "employee.updated"
  | "employee.hired"
  | "employee.promoted"
  | "employee.assigned"
  | "employee.certification.expiring"
  | "employee.review.completed"
  | "employee.leave.approved"
  | "employee.terminated"
  | "employee.deactivated"
  | "employee.restored"
  | "employee.onboarding.completed"
  | "employee.offer.extended"
  | "payroll.approved";

export async function recordHcmActivity(
  supabase: AuthClient,
  input: {
    eventType: HcmActivityEvent;
    title: string;
    summary?: string | null;
    entityId: string;
    organizationId?: string | null;
    schoolId?: string | null;
    actorUserId?: string | null;
    sourceTable?: string;
    sourceId?: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  if (!input.organizationId && !input.schoolId) return;
  try {
    await recordActivity(supabase, {
      eventType: input.eventType,
      moduleKey: "hr",
      entityType: "employee",
      entityId: input.entityId,
      title: input.title,
      summary: input.summary ?? undefined,
      organizationId: input.organizationId ?? undefined,
      schoolId: input.schoolId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      sourceTable: input.sourceTable ?? "employees",
      sourceId: input.sourceId ?? input.entityId,
      payload: input.payload,
    });
  } catch {
    // best-effort
  }
}
