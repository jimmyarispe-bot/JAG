import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type FinanceActivityEvent =
  | "finance.account.created"
  | "invoice.created"
  | "invoice.sent"
  | "invoice.paid"
  | "invoice.overdue"
  | "invoice.payment_recorded"
  | "payment.received"
  | "payment.failed"
  | "scholarship.applied"
  | "scholarship.awarded"
  | "discount.applied"
  | "refund.created"
  | "refund.completed"
  | "invoice.refunded"
  | "invoice.write_off";

export async function recordFinanceActivity(
  supabase: AuthClient,
  input: {
    eventType: FinanceActivityEvent;
    title: string;
    summary?: string | null;
    entityType?: string;
    entityId: string;
    organizationId?: string | null;
    schoolId?: string | null;
    studentId?: string | null;
    familyId?: string | null;
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
      moduleKey: "finance",
      entityType: input.entityType ?? "invoice",
      entityId: input.entityId,
      title: input.title,
      summary: input.summary ?? undefined,
      organizationId: input.organizationId ?? undefined,
      schoolId: input.schoolId ?? undefined,
      studentId: input.studentId ?? undefined,
      familyId: input.familyId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      sourceTable: input.sourceTable,
      sourceId: input.sourceId ?? input.entityId,
      payload: input.payload,
    });
  } catch {
    // best-effort
  }
}
