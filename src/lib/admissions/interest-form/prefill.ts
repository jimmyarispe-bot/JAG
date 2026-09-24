import "server-only";

/**
 * What we already know about a family, in the form's own vocabulary.
 *
 * THE RULE THIS SERVES, from Jimmy, 24 September:
 *
 *   "i want her interest form information to prepopulate the application
 *    fields so she or any other person going through this process doesn't have
 *    to submit the same information again and again and again in different
 *    forms."
 *
 * TWO SOURCES, DELIBERATELY. Reading only the interest answers would help
 * almost nobody: 304 of 318 leads have never submitted the form - they came
 * from the Monday board import - so a prefill built on answers alone would
 * leave Lisa Roy retyping her own name. The lead row holds those basics for
 * everybody, however they arrived.
 *
 *   lead row            name, guardian, contact, campus - true for all 318
 *   interest answers    everything the family typed themselves - the 14
 *
 * ANSWERS WIN. Where both hold a value the family's own words are kept. The
 * lead's copy has been through an import, a matcher and in some cases a
 * spreadsheet; the answer is what the parent actually wrote.
 *
 * NO COLUMN NAMES IN THE LEAD SELECT. `select *` and read by key, because the
 * columns this needs have cost three round trips already this week when
 * guessed. A key that is not there yields undefined and is skipped.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Lead columns that are the same thing as a form question, by question key.
 *
 * Only pairs where the meaning is identical. `program` is left out on purpose:
 * the form's programme question is a multi-select and the lead holds a single
 * value, so copying one into the other would silently narrow the family's
 * answer - the same reason submit.ts refuses to collapse it in the other
 * direction.
 */
const LEAD_COLUMN_FOR_QUESTION: Record<string, string> = {
  first_name: "first_name",
  last_name: "last_name",
  preferred_name: "preferred_name",
  date_of_birth: "date_of_birth",
  current_grade: "current_grade",
  applying_for_grade: "applying_for_grade",
  guardian_first_name: "guardian_first_name",
  guardian_last_name: "guardian_last_name",
  guardian_email: "guardian_email",
  guardian_phone: "guardian_phone",
  school_id: "school_id",
};

function meaningful(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Everything we can honestly fill in for this lead, keyed by question.
 *
 * Returns {} rather than throwing when the lead is unknown or unreadable. An
 * empty prefill is a form the family fills in by hand, which is today's
 * behaviour and not a failure - whereas a thrown error is a door that will not
 * open.
 */
export async function prefillValuesForLead(
  leadId: string
): Promise<Record<string, unknown>> {
  const admin = createServiceRoleClient();
  const out: Record<string, unknown> = {};

  /* 1. The lead row. Everyone has one. */
  const { data: lead, error: leadError } = await admin
    .from("admissions_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    console.error("[prefill] lead read failed:", leadError.message);
    return out;
  }
  if (!lead) return out;

  const leadRow = lead as unknown as Record<string, unknown>;
  for (const [questionKey, column] of Object.entries(LEAD_COLUMN_FOR_QUESTION)) {
    const value = leadRow[column];
    if (meaningful(value)) out[questionKey] = value;
  }

  /* 2. Their own answers, if they ever filled the form in. These win. */
  const { data: submission } = await admin
    .from("admissions_interest_submissions" as never)
    .select("id")
    .eq("lead_id", leadId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const submissionId = (submission as { id?: string } | null)?.id;
  if (!submissionId) return out;

  const { data: answers, error: answersError } = await admin
    .from("admissions_interest_answers" as never)
    .select("question_key, value")
    .eq("submission_id", submissionId);

  if (answersError) {
    console.error("[prefill] answers read failed:", answersError.message);
    return out;
  }

  for (const row of (answers ?? []) as unknown as Array<{
    question_key?: string;
    value?: unknown;
  }>) {
    const key = row.question_key;
    if (!key) continue;
    if (meaningful(row.value)) out[key] = row.value;
  }

  return out;
}
