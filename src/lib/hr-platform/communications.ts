import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type HcmCommKind =
  | "offer_letter"
  | "onboarding_reminder"
  | "certification_alert"
  | "review_reminder"
  | "contract_renewal"
  | "time_off_decision";

const SUBJECTS: Record<HcmCommKind, string> = {
  offer_letter: "Offer letter",
  onboarding_reminder: "Onboarding reminder",
  certification_alert: "Certification expiration alert",
  review_reminder: "Performance review reminder",
  contract_renewal: "Contract renewal notice",
  time_off_decision: "Time-off request decision",
};

export async function sendHcmCommunication(
  supabase: AuthClient,
  input: {
    kind: HcmCommKind;
    organizationId?: string | null;
    schoolId?: string | null;
    body?: string;
    href?: string;
    actorUserId?: string | null;
  }
): Promise<{ ok: boolean; communicationId?: string; error?: string }> {
  const subject = SUBJECTS[input.kind];
  const body =
    input.body ??
    `${subject}. Please review details in the employee portal or HR dashboard.`;

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
      sender_user_id: input.actorUserId ?? null,
      metadata: {
        source: "hr_platform",
        kind: input.kind,
        href: input.href ?? "/dashboard/hr",
      },
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, communicationId: data?.id };
}
