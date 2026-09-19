import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Pay for work that is not a class.
 *
 * Class pay is calculable because the platform already knows a session ran and
 * who was on the roster. Nothing in the platform knows Katie Vetere spent three
 * hours on admin, or that a teacher sat a child through a Structured Literacy
 * assessment. Somebody states it - that is a row in contractor_work_claims -
 * and this prices the statement.
 *
 * THREE UNITS, from the pay schedule of 18 September 2026 and Jimmy's rate for
 * Katie on 19 September:
 *
 *   'hour'        25.00 an hour x hours worked
 *   'occurrence'  15.00 for a staff meeting, however long it ran
 *   'student'      5.00 a GREATNESS report x students reported on
 *
 * The unit is not decoration. 15.00 per conference and 15.00 per staff meeting
 * are the same number meaning two different things, and a calculator that
 * cannot tell them apart will multiply one of them by a class size.
 */

export type WorkUnit = "hour" | "occurrence" | "student";

export interface WorkRate {
  code: string;
  label: string;
  unit: WorkUnit;
  amount: number;
  /** null means anybody. Set means this rate belongs to one person. */
  employeeId: string | null;
  cadenceNote: string | null;
  effectiveFrom: string;
}

/**
 * What a claim pays.
 *
 * Linear in every unit - the volume discount that shapes class pay (a base for
 * the first child, less for each after) does not appear anywhere on the
 * non-class lines of the sheet. Rounded to the cent at the end, because 2.5
 * hours at 25.00 must come back 62.50 and not 62.500000000000004.
 */
export function grossForWork(rate: WorkRate, quantity: number): number {
  if (quantity <= 0) return 0;
  return Math.round(rate.amount * quantity * 100) / 100;
}

/**
 * The rate that applies to one person, for one code, on one day.
 *
 * TWO RULES, IN THIS ORDER.
 *
 * 1. A rate belonging to the person beats a rate belonging to nobody. Katie's
 *    25.00 an hour is hers; if an 'admin_hourly' network rate is ever added it
 *    must not quietly overwrite what she was promised.
 * 2. Among rates of equal standing, the latest one in force on the day wins -
 *    the same versioning class pay uses, so a period recalculated in December
 *    prices at what it priced at in September.
 *
 * NULL, NOT ZERO, when nothing matches. A claim with no rate is named as
 * skipped rather than paid nothing, because a zero-pound line in a pay run
 * looks exactly like work that never happened.
 */
export function workRateOn(
  rates: WorkRate[],
  code: string,
  employeeId: string,
  workDate: string
): WorkRate | null {
  const day = workDate.slice(0, 10);

  const eligible = rates.filter(
    (r) =>
      r.code === code &&
      r.effectiveFrom.slice(0, 10) <= day &&
      (r.employeeId === null || r.employeeId === employeeId)
  );

  if (eligible.length === 0) return null;

  const mine = eligible.filter((r) => r.employeeId === employeeId);
  const pool = mine.length > 0 ? mine : eligible;

  return [...pool].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null;
}

export interface WorkPayRow {
  claimId: string;
  employeeId: string;
  personName: string;
  schoolId: string;
  workCode: string;
  workLabel: string;
  workDate: string;
  unit: WorkUnit;
  quantity: number;
  amount: number;
  cadenceNote: string | null;
  notes: string | null;
  gross: number;
}

export interface WorkPayPeriod {
  rows: WorkPayRow[];
  /** Claims with no rate on the day. Named, never zeroed. */
  skippedForNoRate: {
    claimId: string;
    employeeId: string;
    personName: string;
    workCode: string;
    workDate: string;
  }[];
  unavailable: string | null;
}

/**
 * Every non-class claim between two dates, priced.
 *
 * Reads only. Nothing is written until somebody commits the period, so opening
 * the screen can never move money.
 */
export async function computeWorkPay(
  supabase: AuthClient,
  periodStart: string,
  periodEnd: string
): Promise<WorkPayPeriod> {
  const { data: rateRows, error: rateError } = await supabase
    .from("work_pay_rates")
    .select("code, label, unit, amount, employee_id, cadence_note, effective_from");

  if (rateError) {
    return { rows: [], skippedForNoRate: [], unavailable: rateError.message };
  }

  const rates: WorkRate[] = ((rateRows ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
    code: String(r.code),
    label: String(r.label),
    unit: String(r.unit) as WorkUnit,
    amount: Number(r.amount),
    employeeId: (r.employee_id as string | null) ?? null,
    cadenceNote: (r.cadence_note as string | null) ?? null,
    effectiveFrom: String(r.effective_from),
  }));

  const { data: claims, error: claimError } = await supabase
    .from("contractor_work_claims")
    .select(
      /* The person's name lives on employee_profiles; public.employees has no
         name columns at all. Same trap that bit class-pay.ts. */
      "id, school_id, employee_id, work_code, work_date, quantity, notes, " +
        "employees(id, employee_profiles(first_name, last_name, display_name))"
    )
    .gte("work_date", periodStart)
    .lte("work_date", periodEnd)
    .order("work_date", { ascending: true });

  if (claimError) {
    return { rows: [], skippedForNoRate: [], unavailable: claimError.message };
  }

  /* Supabase returns an embedded relation as an object or as a one-element
     array depending on how it reads the relationship, and without generated
     Database types it hands back GenericStringError rather than a row shape.
     Non-generic on purpose: inferring T from `T | T[]` against an unknown
     collapses to {} and every property read below it fails to compile. */
  const one = (value: unknown): Record<string, unknown> | null => {
    const first = Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
    return first && typeof first === "object"
      ? (first)
      : null;
  };

  const rows: WorkPayRow[] = [];
  const skipped: WorkPayPeriod["skippedForNoRate"] = [];

  for (const raw of (claims ?? []) as unknown as Record<string, unknown>[]) {
    const employeeId = String(raw.employee_id);
    const employee = one(raw.employees);
    const profile = employee ? one(employee.employee_profiles) : null;
    const personName =
      (profile?.display_name as string | undefined) ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "Unnamed person";

    const workCode = String(raw.work_code);
    const workDate = String(raw.work_date).slice(0, 10);
    const rate = workRateOn(rates, workCode, employeeId, workDate);

    if (!rate) {
      skipped.push({
        claimId: String(raw.id),
        employeeId,
        personName,
        workCode,
        workDate,
      });
      continue;
    }

    const quantity = Number(raw.quantity);

    rows.push({
      claimId: String(raw.id),
      employeeId,
      personName,
      schoolId: String(raw.school_id),
      workCode,
      workLabel: rate.label,
      workDate,
      unit: rate.unit,
      quantity,
      amount: rate.amount,
      cadenceNote: rate.cadenceNote,
      notes: (raw.notes as string | null) ?? null,
      gross: grossForWork(rate, quantity),
    });
  }

  return { rows, skippedForNoRate: skipped, unavailable: null };
}

export interface WorkPayTotal {
  employeeId: string;
  personName: string;
  items: number;
  gross: number;
}

/** What each person is owed for non-class work in the period. Pure, so testable. */
export function totalsByPerson(rows: WorkPayRow[]): WorkPayTotal[] {
  const totals = new Map<string, WorkPayTotal>();

  for (const row of rows) {
    const entry = totals.get(row.employeeId) ?? {
      employeeId: row.employeeId,
      personName: row.personName,
      items: 0,
      gross: 0,
    };
    entry.items += 1;
    entry.gross = Math.round((entry.gross + row.gross) * 100) / 100;
    totals.set(row.employeeId, entry);
  }

  return [...totals.values()].sort((a, b) => a.personName.localeCompare(b.personName));
}
