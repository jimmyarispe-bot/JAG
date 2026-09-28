/**
 * What the money chain is stuck on, and who has to decide it.
 *
 * Two views, added in migrations 445 and 446:
 *
 *   plans_waiting_on_a_figure       plans that cannot become a contract yet
 *   awards_without_a_decided_amount the applications they are waiting on
 *
 * A plan sits in `awaiting_scholarship_amounts` because somebody has to decide
 * a number - GA GOAL decides theirs, Jimmy decides an Academy-Based award.
 * Until then no contract can go out, because the figure on it would be
 * invented. The point of this screen is that the waiting is visible instead of
 * being discovered in November.
 *
 * EVERY FAILURE NAMES ITSELF. Both reads can be refused by RLS, and a refusal
 * returns no rows. On this screen "no rows" reads as "nothing is blocked,
 * everything is fine" - which is the single most expensive wrong answer it
 * could give. So a failed read returns an error rather than an empty queue.
 */

import { createAuthClient } from "@/lib/supabase/server-auth";

export interface WaitingPlan {
  readonly planId: string;
  readonly studentId: string;
  readonly student: string;
  readonly school: string;
  readonly schoolYear: string;
  readonly lifecycle: string;
  /** Null for a plain draft; set for anything awaiting a figure. */
  readonly awaitingReason: string | null;
  readonly daysWaiting: number;
}

export interface UndecidedAward {
  readonly awardId: string;
  readonly studentId: string;
  readonly student: string;
  readonly school: string;
  readonly programName: string;
  readonly programCode: string | null;
  readonly awardYear: string;
  /** What the family or the school expects. A claim, never a decision. */
  readonly expectedAmount: number | null;
  readonly expectedAmountSource: string | null;
  readonly appliedOn: string | null;
  readonly daysSinceApplied: number | null;
}

export interface DecisionQueue {
  readonly waitingPlans: WaitingPlan[];
  readonly undecidedAwards: UndecidedAward[];
  /** Undecided awards for this student, keyed by student id. */
  readonly awardsByStudent: Map<string, UndecidedAward[]>;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v === null || v === undefined ? "" : String(v);
}

function strOrNull(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v);
}

export async function loadDecisionQueue(): Promise<DecisionQueue | { error: string }> {
  const supabase = await createAuthClient();

  // `as never` on the view names: both views arrived in 445 and 446 and
  // src/types/database.ts predates them. The names are checked by the
  // database, which has no view it does not have.
  const [plansResult, awardsResult] = await Promise.all([
    supabase.from("plans_waiting_on_a_figure" as never).select("*"),
    supabase.from("awards_without_a_decided_amount" as never).select("*"),
  ]);

  if (plansResult.error) {
    return {
      error:
        `Could not read the plans waiting on a figure: ${plansResult.error.message}. ` +
        `This screen will not show an empty queue when it could not read one - ` +
        `an empty queue means nothing is blocked, and that is not something to guess at.`,
    };
  }
  if (awardsResult.error) {
    return {
      error:
        `Could not read the awards with no decided amount: ${awardsResult.error.message}. ` +
        `Refusing the screen rather than listing plans as blocked on nothing.`,
    };
  }

  const waitingPlans: WaitingPlan[] = ((plansResult.data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      planId: str(r.plan_id),
      studentId: str(r.student_id),
      student: str(r.student) || "(unnamed student)",
      school: str(r.school) || "(unknown school)",
      schoolYear: str(r.school_year),
      lifecycle: str(r.lifecycle),
      awaitingReason: strOrNull(r.awaiting_reason),
      daysWaiting: num(r.days_waiting) ?? 0,
    };
  });

  const undecidedAwards: UndecidedAward[] = ((awardsResult.data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      awardId: str(r.award_id),
      studentId: str(r.student_id),
      student: str(r.student) || "(unnamed student)",
      school: str(r.school) || "(unknown school)",
      programName: str(r.program_name),
      programCode: strOrNull(r.program_code),
      awardYear: str(r.award_year),
      expectedAmount: num(r.expected_amount),
      expectedAmountSource: strOrNull(r.expected_amount_source),
      appliedOn: strOrNull(r.applied_on),
      daysSinceApplied: num(r.days_since_applied),
    };
  });

  const awardsByStudent = new Map<string, UndecidedAward[]>();
  for (const a of undecidedAwards) {
    const list = awardsByStudent.get(a.studentId);
    if (list) list.push(a);
    else awardsByStudent.set(a.studentId, [a]);
  }

  return { waitingPlans, undecidedAwards, awardsByStudent };
}

/**
 * Awards nobody is waiting on.
 *
 * An application with no decided amount and NO plan blocked on it is its own
 * problem: either the plan was never built, or it was built before the family
 * applied and does not know. Both are quiet, and both end with a contract
 * going out at the wrong figure, so they are listed separately rather than
 * left out of a screen whose whole job is to show what is outstanding.
 */
export function awardsNobodyIsWaitingOn(queue: DecisionQueue): UndecidedAward[] {
  const blocked = new Set(queue.waitingPlans.map((p) => p.studentId));
  return queue.undecidedAwards.filter((a) => !blocked.has(a.studentId));
}
