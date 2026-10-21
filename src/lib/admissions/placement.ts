import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * HS PLACEMENT - WHAT THE PARENT ASKED FOR, WHAT THE SCHOOL LEADER PLACED.
 *
 * Jimmy, 20 October 2026: "with high school, heather/school leader was
 * supposed to be given options of the classes the student will attend. And be
 * able to choose the actual start date. Preferred and start are both shown to
 * heather/school leader. Parents are supposed to be given these options too.
 * That then needs to be included in the information sent to me."
 *
 * The options, his words: "1) The HS Experience (Entrepreneurship, LitLab,
 * Earth Quest, Real-World Math) 2) Structured Literacy Class 3) Structured
 * Literacy 1:1 Tutoring 4) Math 1:1 Tutoring --- if structured literacy or
 * math tutoring the # of days per month needs to be asked/required".
 *
 * The parent answers on the application (form v42, migration 574); the school
 * leader chooses at Accept; both are stored, neither overwrites the other.
 */

export const HS_SCHOOL_ID = "a1000000-0000-4000-8000-000000000003";

export const HS_OPTION_EXPERIENCE =
  "The HS Experience (Entrepreneurship, LitLab, Earth Quest, Real-World Math)";
export const HS_OPTION_SL_CLASS = "Structured Literacy Class";
export const HS_OPTION_SL_TUTORING = "Structured Literacy 1:1 Tutoring";
export const HS_OPTION_MATH_TUTORING = "Math 1:1 Tutoring";

export const HS_OPTIONS = [
  HS_OPTION_EXPERIENCE,
  HS_OPTION_SL_CLASS,
  HS_OPTION_SL_TUTORING,
  HS_OPTION_MATH_TUTORING,
] as const;

/** Which catalog item each option bills, and whether it is by the day. */
export const HS_OPTION_CATALOG: Record<string, { itemCode: string; byTheDay: "sl" | "math" | null }> = {
  [HS_OPTION_EXPERIENCE]: { itemCode: "hs_experience", byTheDay: null },
  [HS_OPTION_SL_CLASS]: { itemCode: "virtual_structured_literacy", byTheDay: null },
  [HS_OPTION_SL_TUTORING]: { itemCode: "virtual_structured_literacy", byTheDay: "sl" },
  [HS_OPTION_MATH_TUTORING]: { itemCode: "hs_math_tutoring", byTheDay: "math" },
};

export interface HsChoice {
  options: string[];
  slTutoringDays: number | null;
  mathTutoringDays: number | null;
}

export interface FamilyAsk extends HsChoice {
  /** "When would you like to start?" - inquiry answer desired_start_date. */
  preferredStart: string | null;
}

export interface Placement extends HsChoice {
  actualStartDate: string | null;
  recordedAt: string | null;
}

type AnyClient = SupabaseClient;

function asDays(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 31 ? Math.round(n) : null;
}

/** The parent's answers, newest submission winning per question. */
export async function readFamilyAsk(db: AnyClient, leadId: string): Promise<FamilyAsk> {
  const empty: FamilyAsk = { preferredStart: null, options: [], slTutoringDays: null, mathTutoringDays: null };
  const { data: subs } = await db
    .from("admissions_interest_submissions")
    .select("id, submitted_at")
    .eq("lead_id", leadId)
    .order("submitted_at", { ascending: false });
  const ids = (subs ?? []).map((s) => s.id as string);
  if (ids.length === 0) return empty;
  const { data: answers } = await db
    .from("admissions_interest_answers")
    .select("submission_id, question_key, value")
    .in("submission_id", ids)
    .in("question_key", ["desired_start_date", "hs_additional_core_classes", "hs_sl_tutoring_days", "hs_math_tutoring_days"]);
  const rank = new Map(ids.map((id, i) => [id, i]));
  const best = new Map<string, { r: number; value: unknown }>();
  for (const a of answers ?? []) {
    const r = rank.get(a.submission_id as string) ?? 99;
    const prev = best.get(a.question_key as string);
    if (!prev || r < prev.r) best.set(a.question_key as string, { r, value: a.value });
  }
  const start = best.get("desired_start_date")?.value;
  const opts = best.get("hs_additional_core_classes")?.value;
  return {
    preferredStart: typeof start === "string" && /^\d{4}-\d{2}-\d{2}/.test(start) ? start.slice(0, 10) : null,
    options: Array.isArray(opts) ? opts.map(String) : [],
    slTutoringDays: asDays(best.get("hs_sl_tutoring_days")?.value),
    mathTutoringDays: asDays(best.get("hs_math_tutoring_days")?.value),
  };
}

export function placementFromLead(row: Record<string, unknown> | null): Placement {
  const opts = row?.placement_class_names;
  return {
    options: Array.isArray(opts) ? opts.map(String) : [],
    slTutoringDays: asDays(row?.placement_sl_tutoring_days),
    mathTutoringDays: asDays(row?.placement_math_tutoring_days),
    actualStartDate: typeof row?.actual_start_date === "string" ? (row.actual_start_date as string) : null,
    recordedAt: typeof row?.placement_recorded_at === "string" ? (row.placement_recorded_at as string) : null,
  };
}

/** Reads the leader's choice off a submitted form. */
export function placementFromForm(fd: FormData): { ok: true; value: HsChoice & { actualStartDate: string } } | { ok: false; error: string } {
  const options = fd.getAll("placement_option").map(String).filter((o) => (HS_OPTIONS as readonly string[]).includes(o));
  const start = String(fd.get("actual_start_date") ?? "").trim();
  if (options.length === 0) return { ok: false, error: "Choose at least one class." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return { ok: false, error: "Choose the actual start date." };
  const sl = options.includes(HS_OPTION_SL_TUTORING) ? asDays(fd.get("placement_sl_days")) : null;
  const math = options.includes(HS_OPTION_MATH_TUTORING) ? asDays(fd.get("placement_math_days")) : null;
  if (options.includes(HS_OPTION_SL_TUTORING) && sl === null) {
    return { ok: false, error: "Enter how many days per month of Structured Literacy 1:1 Tutoring (1-31)." };
  }
  if (options.includes(HS_OPTION_MATH_TUTORING) && math === null) {
    return { ok: false, error: "Enter how many days per month of Math 1:1 Tutoring (1-31)." };
  }
  return { ok: true, value: { options, slTutoringDays: sl, mathTutoringDays: math, actualStartDate: start } };
}

export async function savePlacement(
  db: AnyClient,
  leadId: string,
  value: HsChoice & { actualStartDate: string }
): Promise<string | null> {
  const { error } = await db
    .from("admissions_leads")
    .update({
      placement_class_names: value.options,
      placement_sl_tutoring_days: value.slTutoringDays,
      placement_math_tutoring_days: value.mathTutoringDays,
      actual_start_date: value.actualStartDate,
      placement_recorded_at: new Date().toISOString(),
    } as never)
    .eq("id", leadId);
  return error ? error.message : null;
}

/** "The HS Experience (...); Structured Literacy 1:1 Tutoring, 8 days/month" */
export function describeChoice(c: HsChoice): string {
  if (c.options.length === 0) return "None chosen";
  return c.options
    .map((o) =>
      o === HS_OPTION_SL_TUTORING && c.slTutoringDays
        ? `${o}, ${c.slTutoringDays} days/month`
        : o === HS_OPTION_MATH_TUTORING && c.mathTutoringDays
          ? `${o}, ${c.mathTutoringDays} days/month`
          : o
    )
    .join("; ");
}

export function longDay(day: string | null): string {
  if (!day) return "Not given";
  const d = new Date(`${day.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? day
    : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
