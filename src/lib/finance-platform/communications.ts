import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type FinanceCommKind =
  | "invoice_created"
  | "payment_received"
  | "payment_overdue"
  | "scholarship_applied"
  | "refund_processed"
  | "payment_plan_reminder";

const SUBJECTS: Record<FinanceCommKind, string> = {
  invoice_created: "New invoice available",
  payment_received: "Payment received — thank you",
  payment_overdue: "Payment overdue notice",
  scholarship_applied: "Scholarship applied to your account",
  refund_processed: "Refund processed",
  payment_plan_reminder: "Payment plan installment reminder",
};

/**
 * Fan-out finance lifecycle notices via the Communications platform.
 */
export async function sendFinanceCommunication(
  supabase: AuthClient,
  input: {
    kind: FinanceCommKind;
    organizationId?: string | null;
    schoolId?: string | null;
    familyId?: string | null;
    studentId?: string | null;
    body?: string;
    href?: string;
    actorUserId?: string | null;
  }
): Promise<{ ok: boolean; communicationId?: string; deferred?: boolean; error?: string }> {
  const subject = SUBJECTS[input.kind];
  const body =
    input.body ??
    `${subject}. View details in the family finance portal or contact the business office.`;

  const { data, error } = await supabase
    .from("platform_communications")
    .insert({
      organization_id: input.organizationId ?? null,
      school_id: input.schoolId ?? null,
      type: "email",
      direction: "outbound",
      status: "queued",
      subject,
      body_text: body,
      student_id: input.studentId ?? null,
      family_id: input.familyId ?? null,
      sender_user_id: input.actorUserId ?? null,
      metadata: {
        source: "finance_platform",
        kind: input.kind,
        href: input.href ?? "/dashboard/finance",
      },
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message, deferred: true };
  }
  return { ok: true, communicationId: data?.id };
}
