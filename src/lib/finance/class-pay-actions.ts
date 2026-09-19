"use server";

/**
 * Committing and approving a virtual-class pay period.
 *
 * Three states, deliberately separate:
 *
 *   COMPUTED   read-only, from sessions and rosters. Opening the screen can
 *              never move money.
 *   COMMITTED  written to contractor_pay_ledger as 'pending'. A record of what
 *              the period came to, frozen against later roster changes.
 *   APPROVED   a person looked at it and said yes. Only approved rows export.
 *
 * Committing is idempotent: migration 375 adds a unique index on
 * (employee_id, instructional_session_id), so recalculating a period updates
 * its rows rather than paying a teacher twice for the same class.
 *
 * Approved rows are never silently recomputed. If a roster is corrected after
 * approval the recalculation leaves them alone and says so - unapproving is a
 * decision a person makes, not a side effect of pressing Calculate.
 */

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import { computeClassPay } from "@/lib/finance/class-pay";

const PAGE = "/dashboard/finance/class-pay";

/** Money is Jimmy and Danni. Campus access is not a reason to see a wage. */
async function assertMoneyAccess() {
  const identity = await getIdentityContext();
  if (!identity) return { ok: false as const, error: "Not signed in." };

  const roles = (identity.roles ?? []).map((r) => String(r).toUpperCase());
  if (hasPermission(identity, "finance.view") || roles.includes("FOUNDER")) {
    return { ok: true as const, identity };
  }

  // Name the permission. "Not allowed" sends somebody off to guess at their
  // own roles, which has cost hours before.
  return {
    ok: false as const,
    error: `Teacher pay needs finance.view. Your roles: ${
      roles.length ? roles.join(", ") : "none"
    }.`,
  };
}

export async function commitClassPayPeriod(periodStart: string, periodEnd: string) {
  const access = await assertMoneyAccess();
  if (!access.ok) return { error: access.error };

  const supabase = await createAuthClient();
  const period = await computeClassPay(supabase, periodStart, periodEnd);
  if (period.unavailable) return { error: period.unavailable };
  if (period.rows.length === 0) return { error: "No classes were taught in that period." };

  /* Approved rows are left exactly as they are. A correction after approval is
     a conversation, not an overwrite. */
  const { data: approved } = await supabase
    .from("contractor_pay_ledger")
    .select("instructional_session_id, employee_id")
    .gte("pay_period_start", periodStart)
    .lte("pay_period_end", periodEnd)
    .neq("payment_status", "pending");

  const frozen = new Set(
    (approved ?? []).map((r) => `${r.employee_id}:${r.instructional_session_id}`)
  );

  const payload = period.rows
    .filter((row) => !frozen.has(`${row.employeeId}:${row.sessionId}`))
    .map((row) => ({
      school_id: row.schoolId,
      employee_id: row.employeeId,
      instructional_session_id: row.sessionId,
      pay_period_start: periodStart,
      pay_period_end: periodEnd,
      student_count: row.studentCount,
      pay_rate_per_student: row.ratePerStudent,
      gross_amount: row.gross,
      payment_status: "pending",
    }));

  if (payload.length === 0) {
    return { committed: 0, frozen: frozen.size };
  }

  const { error } = await supabase
    .from("contractor_pay_ledger")
    .upsert(payload as never, { onConflict: "employee_id,instructional_session_id" });

  if (error) return { error: error.message };

  revalidatePath(PAGE);
  return { committed: payload.length, frozen: frozen.size };
}

export async function approveTeacherPay(
  employeeId: string,
  periodStart: string,
  periodEnd: string
) {
  const access = await assertMoneyAccess();
  if (!access.ok) return { error: access.error };

  const supabase = await createAuthClient();
  const { error, count } = await supabase
    .from("contractor_pay_ledger")
    .update(
      {
        payment_status: "approved",
        approved_by: access.identity.effectiveUserId ?? null,
      } as never,
      { count: "exact" }
    )
    .eq("employee_id", employeeId)
    .eq("pay_period_start", periodStart)
    .eq("pay_period_end", periodEnd)
    .eq("payment_status", "pending");

  if (error) return { error: error.message };

  /* Zero rows updated is a policy refusal wearing a success costume. On a pay
     screen that would read as "approved" while nothing was. */
  if (!count) {
    return { error: "Nothing was approved — those rows may already be approved, or the period was never committed." };
  }

  revalidatePath(PAGE);
  return { approved: count };
}
