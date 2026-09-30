"use server";

import { revalidatePath } from "next/cache";

import { assertPermission } from "@/lib/platform/identity/action-guards";
import { writePlatformAudit } from "@/lib/platform/automation/audit";
import { canWaive } from "@/lib/admissions/fee/gate";
import {
  confirmApplicationFeePayment,
  createApplicationFeeCheckout,
} from "@/lib/admissions/fee/checkout";
import {
  resolveFeeReturnUrl,
  resolveFeeReturnUrlForToken,
} from "@/lib/admissions/fee/return-url";

/**
 * Waiving the $100, and recording who decided and why.
 *
 * Jimmy, 28 September, asked directly: he may waive it, nobody else, and the
 * reason is recorded. APPLICATION_FEE_WAIVER is a catalog permission, so
 * FOUNDER holds it and the explicit CEO and Executive Director lists do not.
 *
 * Migration 291 already refuses a waived row with no reason or no name - it
 * checks that in the database, where it cannot be skipped. This action decides
 * who is allowed to put their name there, and makes sure the reason is a
 * sentence rather than a space bar.
 */

/** Short enough to be lazy, long enough to be an answer. */
const MINIMUM_REASON_LENGTH = 10;

export async function waiveApplicationFee(input: {
  readonly applicationId: string;
  readonly reason: string;
}): Promise<{ success: true; waived: true } | { error: string }> {
  const auth = await assertPermission("APPLICATION_FEE_WAIVER");
  if ("error" in auth) {
    return {
      error:
        "Waiving the application fee is restricted to the Founder. " +
        "Ask Jimmy, or record the payment instead if the family has paid.",
    };
  }
  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    // 291's constraint requires a user id on a waiver. Without one the write
    // would be refused by the database anyway; refusing here says why.
    return { error: "Could not establish who is waiving this fee, so nothing was changed." };
  }

  const reason = input.reason.trim();
  if (reason.length < MINIMUM_REASON_LENGTH) {
    return {
      error:
        "A waiver needs a reason of at least a few words. It is the only record of why " +
        "this family did not pay, and it will be read long after everyone has forgotten.",
    };
  }

  const { data: current, error: readError } = await supabase
    .from("admissions_applications")
    .select("application_fee_status, application_fee_cents")
    .eq("id", input.applicationId)
    .maybeSingle();

  if (readError || !current) {
    return {
      error: `Could not read that application's fee (${readError?.message ?? "not found"}), so nothing was changed.`,
    };
  }

  const allowed = canWaive({
    status: String((current as { application_fee_status?: unknown }).application_fee_status ?? ""),
    amountCents: Number((current as { application_fee_cents?: unknown }).application_fee_cents ?? 0),
  });
  if (!allowed.ok) return { error: allowed.reason };

  const { error: writeError } = await supabase
    .from("admissions_applications")
    .update({
      application_fee_status: "waived",
      application_fee_waived_by_user_id: user.id,
      application_fee_waiver_reason: reason,
      // 291's coherence constraint requires this to be null on a waiver: a row
      // cannot claim both that money arrived and that none was owed.
      application_fee_paid_at: null,
    } as never)
    .eq("id", input.applicationId);

  if (writeError) {
    return { error: `The waiver was not saved: ${writeError.message}` };
  }

  await writePlatformAudit(supabase, {
    module: "admissions",
    entityType: "admissions_applications",
    entityId: input.applicationId,
    actionType: "application_fee_waived",
    actorUserId: user.id,
    summary: "Application fee waived",
    metadata: {
      reason,
      amountCents: Number(
        (current as { application_fee_cents?: unknown }).application_fee_cents ?? 0
      ),
      previousStatus: String(
        (current as { application_fee_status?: unknown }).application_fee_status ?? ""
      ),
    },
  });

  revalidatePath(`/dashboard/admissions/cases/${input.applicationId}`);
  return { success: true, waived: true };
}

/**
 * The family's two buttons.
 *
 * Start takes them to Square. Check asks Square. Neither believes anything the
 * browser says: the payment is confirmed by reading the order back, and the
 * "Check" button exists precisely because the return trip can fail - a closed
 * tab, a dropped connection, a parent who paid on their phone and finished on
 * a laptop. Every one of those ends with a real payment and a page that has
 * not heard about it, and this is how they get out of it without paying twice.
 *
 * No permission guard, deliberately. This is the applicant's own fee, and
 * whether they may see this application at all is decided by the row-level
 * policies inside readFeeContext. The privileged write happens only after
 * Square has confirmed the money.
 */
export async function startApplicationFeePayment(
  applicationId: string
): Promise<{ url: string } | { error: string }> {
  const returnUrl = await resolveFeeReturnUrl(applicationId);
  const result = await createApplicationFeeCheckout({ applicationId, returnUrl });
  if (!result.ok) return { error: result.reason };
  return { url: result.url };
}

export async function checkApplicationFeePayment(
  applicationId: string
): Promise<{ paid: true } | { error: string }> {
  const result = await confirmApplicationFeePayment({ applicationId });
  if (!result.ok) return { error: result.reason };
  revalidatePath(`/apply/portal/${applicationId}`);
  return { paid: true };
}

/**
 * The same two buttons, for a family who has no account.
 *
 * Jimmy, 29 September: "no one ever submits an application without us
 * providing the url. we don't publish this publicly anywhere." And no family
 * ever creates a JAG account. Until 30 September the $100 could be paid only
 * from /apply/portal/<id>, which begins by bouncing anyone without a session
 * to /login - so the one thing a family had to do was the one thing the rule
 * said they could not.
 *
 * THE TOKEN IS THE ONLY INPUT. No application id crosses from the browser,
 * so there is nothing to check and nothing to get wrong: readFeeContextForToken
 * resolves the token to a lead and finds the application from there.
 */
export async function startApplicationFeePaymentByToken(
  token: string
): Promise<{ url: string } | { error: string }> {
  const returnUrl = await resolveFeeReturnUrlForToken(token);
  const result = await createApplicationFeeCheckout({ token, returnUrl });
  if (!result.ok) return { error: result.reason };
  return { url: result.url };
}

export async function checkApplicationFeePaymentByToken(
  token: string
): Promise<{ paid: true } | { error: string }> {
  const result = await confirmApplicationFeePayment({ token });
  if (!result.ok) return { error: result.reason };
  revalidatePath(`/apply/start/${token}`);
  return { paid: true };
}
