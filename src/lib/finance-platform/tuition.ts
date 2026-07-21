import type { BillingModel } from "./types";
import { calculateTuitionInvoice, type TuitionCalculationInput } from "@/lib/finance/tuition-engine";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export function normalizeBillingModel(raw: string | null | undefined): BillingModel {
  const value = (raw ?? "monthly").toLowerCase();
  if (value.includes("quarter")) return "quarterly";
  if (value.includes("year") || value.includes("annual")) return "annual";
  if (value.includes("course")) return "per_course";
  if (value.includes("one") || value.includes("once") || value.includes("fee")) return "one_time";
  return "monthly";
}

/** Period charge from annual amount based on billing model. */
export function periodAmountFromAnnual(
  annualAmount: number,
  model: BillingModel
): number {
  const annual = Number(annualAmount) || 0;
  switch (model) {
    case "monthly":
      return Math.round((annual / 12) * 100) / 100;
    case "quarterly":
      return Math.round((annual / 4) * 100) / 100;
    case "annual":
      return annual;
    case "per_course":
    case "one_time":
      return annual;
    default:
      return annual;
  }
}

/**
 * Calculate enrollment charges for a tuition plan + optional discounts/scholarships.
 */
export async function calculateEnrollmentCharges(
  supabase: AuthClient,
  input: TuitionCalculationInput & {
    annualAmount?: number;
    billingModel?: BillingModel | string | null;
  }
) {
  const model = normalizeBillingModel(input.billingModel);
  const subtotal =
    input.subtotal > 0
      ? input.subtotal
      : periodAmountFromAnnual(input.annualAmount ?? 0, model);

  return calculateTuitionInvoice(supabase, {
    ...input,
    subtotal,
  });
}
