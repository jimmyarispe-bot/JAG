/**
 * Carrying inquiry answers forward, so a family is not asked twice.
 *
 * The application invitation email says, in as many words: "You will not need to
 * repeat anything you already told us on your inquiry." This module is what
 * makes that true.
 *
 * The overlap is smaller than it sounds. The application asks four things and
 * three of them — previous school, emergency contact name and phone — were never
 * on the inquiry form, so there is nothing to carry. The one that does overlap
 * is the child's challenges, which the family wrote out carefully and should
 * never have to write again.
 *
 * Answers live in `admissions_interest_answers`, keyed by question, hanging off
 * `admissions_interest_submissions` by lead. Both are written by the service
 * role and are unreadable to a parent's own session, so every read here uses the
 * service role too.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

/** Question keys from interest form v2 (migration 232). */
export const INQUIRY_QUESTION_KEYS = {
  greatness: "student_greatness",
  challenges: "student_challenges",
} as const;

export interface InquiryHighlights {
  readonly greatness: string | null;
  readonly challenges: string | null;
}

function asText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

/**
 * The two answers that carry the most meaning about a child, for the most recent
 * inquiry on this lead.
 *
 * Returns nulls rather than throwing when there is no submission — a lead
 * created by import or by hand has no interest answers, and that is a normal
 * state, not a failure.
 */
export async function getInquiryHighlights(leadId: string): Promise<InquiryHighlights> {
  const admin = createServiceRoleClient();

  const { data: submission } = await admin
    .from("admissions_interest_submissions" as never)
    .select("id")
    .eq("lead_id", leadId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const submissionId = (submission as { id?: string } | null)?.id;
  if (!submissionId) return { greatness: null, challenges: null };

  const { data: answers } = await admin
    .from("admissions_interest_answers" as never)
    .select("question_key, value")
    .eq("submission_id", submissionId)
    .in("question_key", [INQUIRY_QUESTION_KEYS.greatness, INQUIRY_QUESTION_KEYS.challenges]);

  const rows = (answers ?? []) as unknown as { question_key: string; value: unknown }[];
  const byKey = new Map(rows.map((r) => [r.question_key, r.value]));

  return {
    greatness: asText(byKey.get(INQUIRY_QUESTION_KEYS.greatness)),
    challenges: asText(byKey.get(INQUIRY_QUESTION_KEYS.challenges)),
  };
}

/**
 * Copy what the family already told us onto a newly created application.
 *
 * Written once at application creation rather than substituted at render time,
 * for three reasons: the family can then edit it like any other answer, the
 * value is visible in the database rather than conjured by a page, and a later
 * edit to the inquiry cannot silently rewrite an application that has already
 * been submitted.
 *
 * Never overwrites. If the field already has content, the family has been here
 * and typed something, and their words win.
 */
export async function carryForwardInquiryAnswers(
  leadId: string,
  applicationId: string
): Promise<{ carried: string[] } | { error: string }> {
  const highlights = await getInquiryHighlights(leadId);
  if (!highlights.challenges) return { carried: [] };

  const admin = createServiceRoleClient();

  const { data: application, error: readError } = await admin
    .from("admissions_applications")
    .select("learning_needs_summary")
    .eq("id", applicationId)
    .single();

  if (readError || !application) {
    return { error: readError?.message ?? "Application not found." };
  }

  const existing = (application.learning_needs_summary ?? "").trim();
  if (existing) return { carried: [] };

  const { error: writeError, count } = await admin
    .from("admissions_applications")
    .update(
      { learning_needs_summary: highlights.challenges },
      { count: "exact" }
    )
    .eq("id", applicationId);

  if (writeError) return { error: writeError.message };
  // Zero rows updated is a policy refusal wearing a success costume.
  if (!count) return { error: "Nothing was carried forward — the update matched no rows." };

  return { carried: ["learning_needs_summary"] };
}
