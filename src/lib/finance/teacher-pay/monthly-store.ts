import type { createAuthClient } from "@/lib/supabase/server-auth";
import { loadTeacherWeek, namesByEmployeeId } from "@/lib/finance/teacher-pay/week-store";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * What a month cost, per campus — paysheet change 5 of 6.
 *
 * Jimmy, 8 October 2026: "provide totals each month per school for how much
 * was paid out to teachers".
 *
 * ── WHAT "PAID OUT" MEANS HERE, AND WHY IT IS NARROW ──────────────────────
 *
 * ONLY APPROVED WEEKS. A submitted week is a claim; an approved one is a
 * decision. A month total that counted submitted weeks would move every time
 * a teacher pressed Submit, which is a figure nobody could reconcile against
 * a bank statement - and would quietly overstate the month in the days
 * between Friday and whenever Jimmy gets to it.
 *
 * Weeks still waiting are reported SEPARATELY and by name, never folded in
 * and never silently dropped. A number that omits them without saying so
 * reads as "that is the month" on exactly the month somebody has not got to
 * yet.
 *
 * ── A WEEK BELONGS TO THE MONTH ITS MONDAY FALLS IN ───────────────────────
 *
 * A week starting Monday 29 September runs into October. Splitting it across
 * two months would mean apportioning one frozen figure by day, which is a
 * second arithmetic nobody asked for and nobody could check. One week, one
 * month, decided by the Monday - stated here because the alternative is
 * defensible too and somebody will wonder which was chosen.
 *
 * ── THE TOTAL AND THE SPLIT COME FROM DIFFERENT PLACES, ON PURPOSE ────────
 *
 * WHAT WAS PAID is the override if there is one, otherwise the week's own
 * total. That is the money.
 *
 * WHERE THE WORK WAS is the campus split from the same week - Virtual, HS,
 * and extras that belong to no campus.
 *
 * These can disagree, and the screen says so rather than hiding it. An
 * override is a decision about the whole week; nothing says which campus
 * Jimmy had in mind, and inventing an apportionment would be putting a
 * number in his mouth. So the campus columns always sum to the COMPUTED
 * total, the paid column is what actually went out, and any difference is
 * shown as its own figure with the reason beside it.
 */

export interface MonthlyCampus {
  readonly campus: "virtual" | "hs" | "unattributed";
  readonly label: string;
  readonly cents: number;
}

export interface MonthlyTeacher {
  readonly employeeId: string;
  readonly teacherName: string;
  readonly weeksApproved: number;
  readonly computedCents: number;
  readonly paidCents: number;
  readonly virtualCents: number;
  readonly hsCents: number;
  readonly unattributedCents: number;
  /** Every override in the month, so a difference is never anonymous. */
  readonly overrides: readonly { readonly weekStart: string; readonly reason: string | null }[];
}

export interface MonthlyLoad {
  readonly month: string;
  readonly monthLabel: string;
  readonly campuses: readonly MonthlyCampus[];
  readonly teachers: readonly MonthlyTeacher[];
  readonly computedCents: number;
  readonly paidCents: number;
  /** Submitted but not yet approved. Named, never folded in. */
  readonly waiting: readonly { readonly teacherName: string; readonly weekStart: string }[];
  readonly unavailable: string | null;
}

/** "2026-10" -> "October 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map((n) => Number(n));
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Every Monday whose month is this one. */
function mondaysIn(month: string): string[] {
  const [y, m] = month.split("-").map((n) => Number(n));
  if (!y || !m) return [];
  const out: string[] = [];
  const d = new Date(Date.UTC(y, m - 1, 1));
  /* getUTCDay: 0 is Sunday. Walk to the first Monday, then step by sevens. */
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCMonth() === m - 1) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

export async function loadMonthlyTeacherPay(
  supabase: AuthClient,
  month: string
): Promise<MonthlyLoad> {
  const label = monthLabel(month);
  const empty = (unavailable: string | null): MonthlyLoad => ({
    month,
    monthLabel: label,
    campuses: [],
    teachers: [],
    computedCents: 0,
    paidCents: 0,
    waiting: [],
    unavailable,
  });

  const weeks = mondaysIn(month);
  if (weeks.length === 0) return empty(`"${month}" is not a month I can read.`);

  /* Which weeks exist at all. RLS decides what comes back: for anyone but
     Jimmy and Danni that is their own rows or nothing, which is the same
     rule the weekly screen runs under. */
  const { data: rows, error } = await supabase
    .from("teacher_weeks")
    .select("employee_id, week_start, status")
    .in("week_start", weeks);

  if (error) return empty(`Could not read the month: ${error.message}`);

  const all = (rows ?? []) as { employee_id: string; week_start: string; status: string }[];
  const names = await namesByEmployeeId(
    supabase,
    [...new Set(all.map((r) => String(r.employee_id)))]
  );

  const nameOf = (id: string) => names.get(id) ?? `employee ${id.slice(0, 8)}`;

  const waiting = all
    .filter((r) => r.status === "submitted")
    .map((r) => ({ teacherName: nameOf(String(r.employee_id)), weekStart: String(r.week_start) }))
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName));

  const approved = all.filter((r) => r.status === "approved");

  /* One load per approved week. Thirteen teachers across five Mondays is
     sixty-five small reads rather than one query nobody can follow - the
     same trade the weekly screen already makes, and the same function, so
     the two screens cannot disagree about what a week was worth. */
  const loaded = await Promise.all(
    approved.map(async (r) => {
      const employeeId = String(r.employee_id);
      const weekStart = String(r.week_start);
      const week = await loadTeacherWeek(supabase, employeeId, weekStart);
      return { employeeId, weekStart, view: week.view };
    })
  );

  const byTeacher = new Map<string, MonthlyTeacher>();

  for (const row of loaded) {
    const v = row.view;
    const prev =
      byTeacher.get(row.employeeId) ??
      ({
        employeeId: row.employeeId,
        teacherName: nameOf(row.employeeId),
        weeksApproved: 0,
        computedCents: 0,
        paidCents: 0,
        virtualCents: 0,
        hsCents: 0,
        unattributedCents: 0,
        overrides: [],
      } as MonthlyTeacher);

    /* The override is the money. The computed figure is kept beside it, never
       replaced, so a month that was corrected still shows both. */
    const paid = v.overrideCents ?? v.totalCents;

    byTeacher.set(row.employeeId, {
      ...prev,
      weeksApproved: prev.weeksApproved + 1,
      computedCents: prev.computedCents + v.totalCents,
      paidCents: prev.paidCents + paid,
      virtualCents: prev.virtualCents + v.virtualCents,
      hsCents: prev.hsCents + v.hsCents,
      unattributedCents: prev.unattributedCents + v.unattributedCents,
      overrides:
        v.overrideCents === null
          ? prev.overrides
          : [...prev.overrides, { weekStart: row.weekStart, reason: v.overrideReason }],
    });
  }

  const teachers = [...byTeacher.values()].sort((a, b) => b.paidCents - a.paidCents);

  const sum = (pick: (t: MonthlyTeacher) => number) =>
    teachers.reduce((n, t) => n + pick(t), 0);

  return {
    month,
    monthLabel: label,
    campuses: [
      { campus: "virtual", label: "The Academy Virtual", cents: sum((t) => t.virtualCents) },
      { campus: "hs", label: "The Academy HS", cents: sum((t) => t.hsCents) },
      {
        campus: "unattributed",
        label: "Extras and hours (no campus)",
        cents: sum((t) => t.unattributedCents),
      },
    ],
    teachers,
    computedCents: sum((t) => t.computedCents),
    paidCents: sum((t) => t.paidCents),
    waiting,
    unavailable: null,
  };
}
